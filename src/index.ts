export type Success<T> = readonly [undefined, T]
export type Failure<E> = readonly [E, undefined]
export type Result<E, T> = Success<T> | Failure<E>

export type ResultWithDefault<E, T> = readonly [E | undefined, T]

export type MaybePromise<T> = T | Promise<T>

export function isSuccess<E, T>(result: Result<E, T>): result is Success<T> {
  return result[0] === undefined
}
export function isFailure<E, T>(result: Result<E, T>): result is Failure<E> {
  return result[0] !== undefined
}

export function success<T>(value: T): Success<T> {
  return [undefined, value] as const
}

export function failure<E>(error: E): Failure<E> {
  return [error, undefined] as const
}

function resolveDefault<T>(defaultValue: T | (() => T)): T {
  return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue
}

/**
 * Executes a function, promise, or value and returns a Result type with a fallback default.
 * If an error occurs, it returns the error message and the default value.
 *
 * @template T The type of the successful result
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @param {T | (() => T)} defaultValue - The default value or a function to compute it (only called on failure)
 * @returns {ResultWithDefault<string, T> | Promise<ResultWithDefault<string, T>>} A tuple of [error, value] or Promise thereof
 *
 * @example
 * // With a static default
 * const [err, config] = goTryOr(() => JSON.parse('invalid'), { port: 3000 })
 * // err is the error message, config is { port: 3000 }
 *
 * @example
 * // With a computed default (lazy evaluation)
 * const [err, user] = await goTryOr(fetchUser(id), () => ({
 *   id: 'anonymous',
 *   name: 'Guest'
 * }))
 */
export function goTryOr<T>(fn: () => never, defaultValue: T | (() => T)): ResultWithDefault<string, T>
export function goTryOr<T>(
  fn: () => Promise<T>,
  defaultValue: T | (() => T),
): Promise<ResultWithDefault<string, T>>
export function goTryOr<T>(
  promise: Promise<T>,
  defaultValue: T | (() => T),
): Promise<ResultWithDefault<string, T>>
export function goTryOr<T>(fn: () => T, defaultValue: T | (() => T)): ResultWithDefault<string, T>
export function goTryOr<T>(value: T, defaultValue: T | (() => T)): ResultWithDefault<string, T>
export function goTryOr<T>(
  value: T | Promise<T> | (() => T | Promise<T>),
  defaultValue: T | (() => T),
): ResultWithDefault<string, T> | Promise<ResultWithDefault<string, T>> {
  try {
    const result =
      typeof value === 'function' ? (value as () => T | Promise<T>)() : value

    if (isPromise<T>(result)) {
      return result
        .then((resolvedValue) => success<T>(resolvedValue))
        .catch((err) => [getErrorMessage(err), resolveDefault(defaultValue)] as const)
    }

    return success<T>(result)
  } catch (err) {
    return [getErrorMessage(err), resolveDefault(defaultValue)] as const
  }
}

/**
 * Executes multiple promises in parallel and returns a tuple of [errors, results].
 * Unlike Promise.all, this doesn't fail fast - it waits for all promises to settle.
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> }]} promises - Array of promises to execute
 * @returns {Promise<[(string | undefined)[], { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is an array of errors (or undefined) and
 *          the second element is an array of results (or undefined)
 *
 * @example
 * const [errors, results] = await goTryAll([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ])
 *
 * // errors: (string | undefined)[]
 * // results: (User | undefined)[]
 */
export async function goTryAll<T extends readonly unknown[]>(
  promises: { [K in keyof T]: Promise<T[K]> },
): Promise<[(string | undefined)[], { [K in keyof T]: T[K] | undefined }]> {
  const settled = await Promise.allSettled(promises)

  const errors: (string | undefined)[] = []
  const results: unknown[] = []

  for (const item of settled) {
    if (item.status === 'fulfilled') {
      errors.push(undefined)
      results.push(item.value)
    } else {
      errors.push(getErrorMessage(item.reason))
      results.push(undefined)
    }
  }

  return [errors, results as { [K in keyof T]: T[K] | undefined }]
}

/**
 * Similar to goTryAll, but returns the raw Error objects instead of just error messages.
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> }]} promises - Array of promises to execute
 * @returns {Promise<[(Error | undefined)[], { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is an array of Error objects (or undefined) and
 *          the second element is an array of results (or undefined)
 */
export async function goTrySettled<T extends readonly unknown[]>(
  promises: { [K in keyof T]: Promise<T[K]> },
): Promise<[(Error | undefined)[], { [K in keyof T]: T[K] | undefined }]> {
  const settled = await Promise.allSettled(promises)

  const errors: (Error | undefined)[] = []
  const results: unknown[] = []

  for (const item of settled) {
    if (item.status === 'fulfilled') {
      errors.push(undefined)
      results.push(item.value)
    } else {
      errors.push(
        isError(item.reason)
          ? item.reason
          : new Error(String(item.reason)),
      )
      results.push(undefined)
    }
  }

  return [errors, results as { [K in keyof T]: T[K] | undefined }]
}

function getErrorMessage(error: unknown): string {
  if (error === undefined) return 'undefined'

  if (typeof error === 'string') return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  try {
    return JSON.stringify(error)
  } catch {
    // fallback in case there's an error stringifying the error
    // with circular references for example.
    return String(error)
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  )
}

function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the error message as a string.
 *
 * @template T The type of the successful result
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @returns {Result<string, T> | Promise<Result<string, T>>} A Result type or a Promise of a Result type
 *
 * @example
 * // With a value
 * const [err, result] = goTry(42);
 *
 * @example
 * // With a function
 * const [err, result] = goTry(() => JSON.parse('{"key": "value"}'));
 *
 * @example
 * // With a promise
 * const [err, result] = await goTry(fetch('https://api.example.com/data'));
 */
export function goTry<T>(fn: () => never): Result<string, never>
export function goTry<T>(fn: () => Promise<T>): Promise<Result<string, T>>
export function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>
export function goTry<T>(fn: () => T): Result<string, T>
export function goTry<T>(value: T): Result<string, T>
export function goTry<T>(
  value: T | Promise<T> | (() => T | Promise<T>),
): Result<string, T> | Promise<Result<string, T>> {
  try {
    const result =
      typeof value === 'function' ? (value as () => T | Promise<T>)() : value
    if (isPromise<T>(result)) {
      return result
        .then((resolvedValue) => success<T>(resolvedValue))
        .catch((err) => failure<string>(getErrorMessage(err)))
    }
    return success<T>(result)
  } catch (err) {
    return failure<string>(getErrorMessage(err))
  }
}

/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the raw error object.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to Error
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @returns {Result<E, T> | Promise<Result<E, T>>} A Result type or a Promise of a Result type
 *
 * @example
 * // With a value
 * const [err, result] = goTryRaw(42);
 *
 * @example
 * // With a function
 * const [err, result] = goTryRaw(() => JSON.parse('{"key": "value"}'));
 *
 * @example
 * // With a promise
 * const [err, result] = await goTryRaw(fetch('https://api.example.com/data'));
 */
export function goTryRaw<T, E = Error>(fn: () => never): Result<E, never>
export function goTryRaw<T, E = Error>(
  fn: () => Promise<T>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>
export function goTryRaw<T, E = Error>(value: T): Result<E, T>
export function goTryRaw<T, E = Error>(
  value: T | Promise<T> | (() => T | Promise<T>),
): Result<E, T> | Promise<Result<E, T>> {
  try {
    const result =
      typeof value === 'function' ? (value as () => T | Promise<T>)() : value
    if (isPromise<T>(result)) {
      return result
        .then((resolvedValue) => success<T>(resolvedValue))
        .catch((err) => {
          if (err === undefined) {
            return failure<E>(new Error('undefined') as unknown as E)
          }
          return failure<E>(
            isError(err)
              ? (err as unknown as E)
              : (new Error(String(err)) as unknown as E),
          )
        })
    }
    return success<T>(result)
  } catch (err) {
    return failure<E>(
      isError(err)
        ? (err as unknown as E)
        : (new Error(String(err)) as unknown as E),
    )
  }
}
