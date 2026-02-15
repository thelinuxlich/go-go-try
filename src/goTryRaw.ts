import type { Result, ErrorConstructor } from './types.js'
import { success, failure } from './result-helpers.js'
import { isPromise, isError } from './internals.js'

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
