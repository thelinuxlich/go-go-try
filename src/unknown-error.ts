import { taggedError } from './tagged-error.js'

/**
 * Default system error class for errors that aren't already wrapped in a tagged error class.
 *
 * @example
 * // By default, goTryRaw wraps unknown errors in UnknownError
 * const [err, result] = goTryRaw(() => mightThrow())
 * if (err) {
 *   console.log(err._tag) // 'UnknownError'
 * }
 *
 * @example
 * // Use a custom system error class
 * const SystemError = taggedError('SystemError')
 * const [err, result] = goTryRaw(() => mightThrow(), {
 *   systemErrorClass: SystemError
 * })
 */
export const UnknownError = taggedError('UnknownError')
