import type { ResultWithDefault } from './types.js'
import { success } from './result-helpers.js'
import { isPromise, getErrorMessage, resolveDefault } from './internals.js'

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
