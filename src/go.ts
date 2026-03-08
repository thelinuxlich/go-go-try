/**
 * Alias for goTryRaw - the most common usage of go-go-try.
 *
 * @example
 * ```typescript
 * const [err, data] = await go(fetch('/api'))
 * const [err2, result] = await go(() => computeSomething())
 * ```
 */
export { goTryRaw as go } from './goTryRaw.js'

/**
 * Alias for goTryAllRaw - run multiple operations in parallel.
 *
 * @example
 * ```typescript
 * const results = await goAll([
 *   fetch('/api/users'),
 *   fetch('/api/posts'),
 *   fetch('/api/comments')
 * ])
 * // results is [Result<Error, Response>, Result<Error, Response>, Result<Error, Response>]
 * ```
 */
export { goTryAllRaw as goAll } from './goTryAll.js'

/**
 * Alias for goElse - returns a default value on error.
 * Returns the actual Error object (not just message) on failure.
 *
 * @example
 * ```typescript
 * const [err, data] = await goElse(fetch('/api'), { users: [] })
 * // err is Error | undefined, data is the response or { users: [] }
 * ```
 */
export { goElse } from './goElse.js'
