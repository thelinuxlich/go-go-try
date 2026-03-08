import { isPromise, resolveDefault } from './internals.js'

/**
 * Result type with Error and a default value.
 * On error, returns [Error, DefaultT]
 * On success, returns [undefined, T]
 */
export type ResultWithDefault<E, T, D = T> = readonly [E, D] | readonly [undefined, T]

/**
 * Executes a function, promise, or value and returns a Result type with a fallback default.
 * If an error occurs, it returns the actual Error object and the default value.
 *
 * @template T The type of the successful result
 * @template D The type of the default value (defaults to T)
 * @param {T | Promise<T> | (() => T | Promise<T>)} value - The value, promise, or function to execute
 * @param {D | (() => D)} defaultValue - The default value or a function to compute it (only called on failure)
 * @returns {ResultWithDefault<Error, T, D> | Promise<ResultWithDefault<Error, T, D>>} A tuple of [error, value] or Promise thereof
 *
 * @example
 * // With a static default
 * const [err, config] = goElse(() => JSON.parse('invalid'), { port: 3000 })
 * // err is the Error object, config is { port: 3000 }
 *
 * @example
 * // With a computed default (lazy evaluation)
 * const [err, user] = await goElse(fetchUser(id), () => ({
 *   id: 'anonymous',
 *   name: 'Guest'
 * }))
 */
export function goElse<T, D = T>(
	fn: () => never,
	defaultValue: D | (() => D),
): ResultWithDefault<Error, never, D>
export function goElse<T, D = T>(
	fn: () => Promise<T>,
	defaultValue: D | (() => D),
): Promise<ResultWithDefault<Error, T, D>>
export function goElse<T, D = T>(
	promise: Promise<T>,
	defaultValue: D | (() => D),
): Promise<ResultWithDefault<Error, T, D>>
export function goElse<T, D = T>(
	fn: () => T,
	defaultValue: D | (() => D),
): ResultWithDefault<Error, T, D>
export function goElse<T, D = T>(
	value: T,
	defaultValue: D | (() => D),
): ResultWithDefault<Error, T, D>
export function goElse<T, D = T>(
	value: T | Promise<T> | (() => T | Promise<T>),
	defaultValue: D | (() => D),
): ResultWithDefault<Error, T, D> | Promise<ResultWithDefault<Error, T, D>> {
	try {
		const result =
			typeof value === 'function' ? (value as () => T | Promise<T>)() : value

		if (isPromise<T>(result)) {
			return result
				.then((resolvedValue): ResultWithDefault<Error, T, D> => [undefined, resolvedValue])
				.catch((err): ResultWithDefault<Error, T, D> => {
					const error = err instanceof Error ? err : new Error(String(err))
					return [error, resolveDefault(defaultValue)]
				})
		}

		return [undefined, result]
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err))
		return [error, resolveDefault(defaultValue)]
	}
}
