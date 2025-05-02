export type Success<T> = readonly [undefined, T]
export type Failure<E> = readonly [E, undefined]
export type Result<E, T> = Success<T> | Failure<E>

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
