import type { Result } from './types.js'
import { success, failure } from './result-helpers.js'
import { isPromise, getErrorMessage } from './internals.js'

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
