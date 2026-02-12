export type Success<T> = readonly [undefined, T]
export type Failure<E> = readonly [E, undefined]
export type Result<E, T> = Success<T> | Failure<E>

/**
 * Base interface for tagged errors.
 * The `_tag` property enables discriminated union narrowing.
 */
export interface TaggedError<T extends string> {
  readonly _tag: T
  readonly message: string
  readonly cause?: unknown
}

/**
 * Creates a tagged error class for discriminated error handling.
 *
 * @template T The literal type of the tag
 * @param tag The string tag to identify this error type (e.g., 'DatabaseError')
 * @returns A class constructor for creating tagged errors
 *
 * @example
 * const DatabaseError = taggedError('DatabaseError')
 * const NetworkError = taggedError('NetworkError')
 *
 * type MyError = InstanceType<typeof DatabaseError> | InstanceType<typeof NetworkError>
 *
 * function fetchUser(id: string): Result<MyError, User> {
 *   const [err, user] = goTryRaw(fetch(`/users/${id}`), DatabaseError)
 *   if (err) return failure(err)
 *   // ...
 * }
 *
 * // Pattern matching on errors
 * if (err._tag === 'DatabaseError') {
 *   // TypeScript knows this is DatabaseError
 * }
 */
export function taggedError<T extends string>(tag: T) {
  return class TaggedErrorClass extends Error implements TaggedError<T> {
    readonly _tag: T = tag
    readonly cause?: unknown

    constructor(message: string, options?: { cause?: unknown }) {
      super(message)
      this.name = tag
      this.cause = options?.cause
    }
  }
}

export type ResultWithDefault<E, T> = readonly [E | undefined, T]

export type MaybePromise<T> = T | Promise<T>

export interface GoTryAllOptions {
  /**
   * Maximum number of concurrent promises.
   * Set to 0 (default) for unlimited concurrency (all promises run in parallel).
   */
  concurrency?: number
}

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

type PromiseFactory<T> = () => Promise<T>

async function runWithConcurrency<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | PromiseFactory<T[K]> },
  concurrency: number,
): Promise<PromiseSettledResult<T[number]>[]> {
  if (items.length === 0) {
    return []
  }

  // Auto-detect factory mode by checking if first item is a function
  const isFactoryMode = typeof items[0] === 'function'

  // concurrency of 0 means unlimited (run all in parallel)
  if (!isFactoryMode && (concurrency <= 0)) {
    return Promise.allSettled(items as Promise<T[number]>[])
  }

  const results: PromiseSettledResult<T[number]>[] = new Array(items.length)
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++
      try {
        const item = items[currentIndex]
        // If factory mode, call the function; otherwise await the promise directly
        const value = isFactoryMode
          ? await (item as PromiseFactory<T[number]>)()
          : await (item as Promise<T[number]>)
        results[currentIndex] = { status: 'fulfilled', value }
      } catch (reason) {
        results[currentIndex] = { status: 'rejected', reason }
      }
    }
  }

  // Determine number of workers
  const workerCount = concurrency <= 0 ? items.length : Math.min(concurrency, items.length)

  // Start workers
  const workers: Promise<void>[] = []
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker())
  }

  await Promise.all(workers)
  return results
}

/**
 * Executes multiple promises or factory functions in parallel (or with limited concurrency)
 * and returns a tuple of [errors, results]. Unlike Promise.all, this doesn't fail fast -
 * it waits for all promises to settle.
 *
 * Accepts either:
 * - An array of promises (for simple parallel execution)
 * - An array of factory functions that return promises (for lazy execution with concurrency control)
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) }]} items - Array of promises or factories
 * @param {GoTryAllOptions} options - Optional configuration
 * @returns {Promise<[{ [K in keyof T]: string | undefined }, { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is a tuple of errors (or undefined) and
 *          the second element is a tuple of results (or undefined), preserving input order
 *
 * @example
 * // Run all in parallel (default) - with promises
 * const [errors, results] = await goTryAll([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3)
 * ])
 *
 * @example
 * // Limit concurrency with factory functions (lazy execution)
 * const [errors, results] = await goTryAll([
 *   () => fetchUser(1),  // Only called when a slot is available
 *   () => fetchUser(2),  // Only called when a slot is available
 *   () => fetchUser(3),  // Only called when a slot is available
 * ], { concurrency: 2 })
 */
export async function goTryAll<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllOptions,
): Promise<[{ [K in keyof T]: string | undefined }, { [K in keyof T]: T[K] | undefined }]> {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0)

  const errors = [] as { [K in keyof T]: string | undefined }
  const results = [] as { [K in keyof T]: T[K] | undefined }

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i]!
    if (item.status === 'fulfilled') {
      ;(errors as (string | undefined)[])[i] = undefined
      ;(results as unknown[])[i] = (item as PromiseFulfilledResult<T[number]>).value
    } else {
      ;(errors as (string | undefined)[])[i] = getErrorMessage((item as PromiseRejectedResult).reason)
      ;(results as unknown[])[i] = undefined
    }
  }

  return [errors, results]
}

/**
 * Like `goTryAll`, but returns raw Error objects instead of error messages.
 *
 * @template T The tuple type of all promise results
 * @param {readonly [...{ [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) }]} items - Array of promises or factories
 * @param {GoTryAllOptions} options - Optional configuration
 * @returns {Promise<[{ [K in keyof T]: Error | undefined }, { [K in keyof T]: T[K] | undefined }]>}
 *          A tuple where the first element is a tuple of Error objects (or undefined) and
 *          the second element is a tuple of results (or undefined), preserving input order
 */
export async function goTryAllRaw<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllOptions,
): Promise<[{ [K in keyof T]: Error | undefined }, { [K in keyof T]: T[K] | undefined }]> {
  const settled = await runWithConcurrency(items, options?.concurrency ?? 0)

  const errors = [] as { [K in keyof T]: Error | undefined }
  const results = [] as { [K in keyof T]: T[K] | undefined }

  for (let i = 0; i < settled.length; i++) {
    const item = settled[i]!
    if (item.status === 'fulfilled') {
      ;(errors as (Error | undefined)[])[i] = undefined
      ;(results as unknown[])[i] = (item as PromiseFulfilledResult<T[number]>).value
    } else {
      const reason = (item as PromiseRejectedResult).reason
      ;(errors as (Error | undefined)[])[i] = isError(reason)
        ? reason
        : new Error(String(reason))
      ;(results as unknown[])[i] = undefined
    }
  }

  return [errors, results]
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
 * Type for error constructors that can be used with goTryRaw.
 */
export type ErrorConstructor<E> = new (message: string, options?: { cause?: unknown }) => E

/**
 * Extracts the instance type from a tagged error class.
 * Useful for creating cleaner error type definitions.
 *
 * @template T The tagged error class type
 * @returns The instance type of the error class
 *
 * @example
 * const DatabaseError = taggedError('DatabaseError')
 * type DbError = TaggedInstance<typeof DatabaseError>
 * // Equivalent to: InstanceType<typeof DatabaseError>
 */
export type TaggedInstance<T extends ErrorConstructor<unknown>> = 
  T extends ErrorConstructor<infer E> ? E : never

/**
 * Creates a union type from multiple tagged error classes.
 *
 * @template T A tuple of tagged error class types
 * @returns A union of all instance types
 *
 * @example
 * const DatabaseError = taggedError('DatabaseError')
 * const NetworkError = taggedError('NetworkError')
 *
 * type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError]>
 * // Equivalent to: DatabaseError | NetworkError
 */
export type TaggedUnion<T extends readonly ErrorConstructor<unknown>[]> = 
  { [K in keyof T]: T[K] extends ErrorConstructor<infer E> ? E : never }[number]

/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the raw error object.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to Error
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @param {ErrorConstructor<E>} [ErrorClass] - Optional error constructor to wrap caught errors
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
 *
 * @example
 * // With tagged error for discriminated unions
 * const DatabaseError = taggedError('DatabaseError');
 * const [err, result] = await goTryRaw(fetchData(), DatabaseError);
 * // err is InstanceType<typeof DatabaseError> | undefined
 */
export function goTryRaw<T, E = Error>(fn: () => never): Result<E, never>
export function goTryRaw<T, E = Error>(fn: () => never, ErrorClass: ErrorConstructor<E>): Result<E, never>
export function goTryRaw<T, E = Error>(
  fn: () => Promise<T>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(
  fn: () => Promise<T>,
  ErrorClass: ErrorConstructor<E>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(
  promise: Promise<T>,
  ErrorClass: ErrorConstructor<E>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>
export function goTryRaw<T, E = Error>(fn: () => T, ErrorClass: ErrorConstructor<E>): Result<E, T>
export function goTryRaw<T, E = Error>(value: T): Result<E, T>
export function goTryRaw<T, E = Error>(value: T, ErrorClass: ErrorConstructor<E>): Result<E, T>
export function goTryRaw<T, E = Error>(
  value: T | Promise<T> | (() => T | Promise<T>),
  ErrorClass?: ErrorConstructor<E>,
): Result<E, T> | Promise<Result<E, T>> {
  // Helper to wrap error in the provided class or return as-is
  const wrapError = (err: unknown): E => {
    if (ErrorClass) {
      if (err === undefined) {
        return new ErrorClass('undefined')
      }
      if (isError(err)) {
        return new ErrorClass(err.message, { cause: err })
      }
      return new ErrorClass(String(err))
    }
    // Default behavior: return raw error
    if (err === undefined) {
      return new Error('undefined') as unknown as E
    }
    return (
      isError(err) ? err : new Error(String(err))
    ) as unknown as E
  }

  try {
    const result =
      typeof value === 'function' ? (value as () => T | Promise<T>)() : value
    if (isPromise<T>(result)) {
      return result
        .then((resolvedValue) => success<T>(resolvedValue))
        .catch((err) => failure<E>(wrapError(err)))
    }
    return success<T>(result)
  } catch (err) {
    return failure<E>(wrapError(err))
  }
}
