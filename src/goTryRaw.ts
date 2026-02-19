import type { Result, GoTryRawOptions } from './types.js'
import { success, failure } from './result-helpers.js'
import { isPromise, isError } from './internals.js'
import { UnknownError } from './unknown-error.js'

/**
 * Checks if a value is a tagged error (has a _tag property).
 */
function isTaggedError(err: unknown): err is { _tag: string } {
  return isError(err) && '_tag' in err && typeof (err as { _tag?: unknown })._tag === 'string'
}

/**
 * Executes a function, promise, or value and returns a Result type.
 * If an error occurs, it returns a Failure with the raw error object.
 *
 * @template T The type of the successful result
 * @template E The type of the error
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @param {GoTryRawOptions<E>} [options] - Optional options object
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
 * // With options object - wrap all errors
 * const DatabaseError = taggedError('DatabaseError');
 * const [err, result] = await goTryRaw(fetchData(), { errorClass: DatabaseError });
 *
 * @example
 * // With options object - systemErrorClass only wraps non-tagged errors
 * const [err, result] = await goTryRaw(fetchData(), { systemErrorClass: UnknownError });
 * // Errors thrown as tagged errors pass through
 * // Other errors are wrapped in UnknownError
 */
export function goTryRaw<T>(fn: () => never): Result<Error, never>
export function goTryRaw<T, E = InstanceType<typeof UnknownError>>(fn: () => never, options: GoTryRawOptions<E>): Result<E, never>
export function goTryRaw<T>(
  fn: () => Promise<T>,
): Promise<Result<Error, T>>
export function goTryRaw<T, E = InstanceType<typeof UnknownError>>(
  fn: () => Promise<T>,
  options: GoTryRawOptions<E>,
): Promise<Result<E, T>>
export function goTryRaw<T>(
  promise: Promise<T>,
): Promise<Result<Error, T>>
export function goTryRaw<T, E = InstanceType<typeof UnknownError>>(
  promise: Promise<T>,
  options: GoTryRawOptions<E>,
): Promise<Result<E, T>>
export function goTryRaw<T>(fn: () => T): Result<Error, T>
export function goTryRaw<T, E = InstanceType<typeof UnknownError>>(fn: () => T, options: GoTryRawOptions<E>): Result<E, T>
export function goTryRaw<T>(value: T): Result<Error, T>
export function goTryRaw<T, E = InstanceType<typeof UnknownError>>(value: T, options: GoTryRawOptions<E>): Result<E, T>
export function goTryRaw<T, E = Error>(
  value: T | Promise<T> | (() => T | Promise<T>),
  options?: GoTryRawOptions<E>,
): Result<E, T> | Promise<Result<E, T>> {
  const { errorClass, systemErrorClass } = options || {}

  // Determine the actual system error class to use
  // Default to UnknownError when systemErrorClass is not specified
  const actualSystemErrorClass = systemErrorClass ?? UnknownError

  // Helper to wrap error based on the options
  const wrapError = (err: unknown): E => {
    // If errorClass is specified, wrap all errors with it
    if (errorClass) {
      if (err === undefined) {
        return new errorClass('undefined')
      }
      if (isError(err)) {
        return new errorClass(err.message, { cause: err })
      }
      return new errorClass(String(err))
    }

    // If actualSystemErrorClass is specified, only wrap non-tagged errors
    if (actualSystemErrorClass) {
      if (isTaggedError(err)) {
        return err as unknown as E
      }

      // Wrap non-tagged errors with systemErrorClass
      if (err === undefined) {
        return new actualSystemErrorClass('undefined') as unknown as E
      }
      if (isError(err)) {
        return new actualSystemErrorClass(err.message, { cause: err }) as unknown as E
      }
      return new actualSystemErrorClass(String(err)) as unknown as E
    }

    // No options - original behavior: return raw error
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
