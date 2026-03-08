import { UnknownError } from './unknown-error.js'

/**
 * Error class constructor type.
 */
type ErrorConstructor<E extends Error = Error> = new (
	message: string,
	options?: { cause?: unknown },
) => E

/**
 * Helper to check if value is a Promise.
 */
function isPromise<T>(value: unknown): value is Promise<T> {
	return value instanceof Promise
}

/**
 * Type guard to check if error is an Error class constructor.
 */
function isErrorConstructor<E extends Error>(
	error: ErrorConstructor<E> | ((value: unknown) => E) | ((value: never) => E),
): error is ErrorConstructor<E> {
	return (
		typeof error === 'function' &&
		error.prototype !== undefined &&
		error.prototype instanceof Error
	)
}

/**
 * Helper to throw error from class or factory.
 */
function throwError<T, E extends Error>(
	value: T,
	error: ErrorConstructor<E> | ((value: never) => E),
): never {
	if (isErrorConstructor(error)) {
		// It's an Error class constructor
		throw new error(String(value), { cause: value })
	}
	// It's a factory function - cast to any to handle type variance
	throw (error as (value: T) => E)(value)
}

/**
 * Ensures a value satisfies a predicate, throwing an error if not.
 * Returns the value if the predicate passes.
 *
 * Accepts sync values, promises, or functions - just like `go`.
 *
 * The error can be either:
 * - An Error class constructor (instantiated with the value as cause)
 * - A function that creates and returns an Error
 * - If omitted, defaults to UnknownError
 *
 * @example
 * ```typescript
 * // With sync value (uses UnknownError by default)
 * ensure(42, n => n > 0)
 *
 * // With promise (awaited internally)
 * const res = await ensure(fetch('/api'), r => r.ok, RequestFailedError)
 *
 * // With function
 * const res = ensure(() => parseInt('42'), n => !isNaN(n), Error)
 *
 * // With error factory function
 * const res = ensure(
 *   await fetch('/api'),
 *   r => r.ok,
 *   r => new Error(`HTTP ${r.status}`)
 * )
 * ```
 */
// Promise overloads first (more specific)
export function ensure<T>(
	value: Promise<T>,
	predicate: (value: T) => boolean,
	error?: ErrorConstructor<Error> | ((value: T) => Error),
): Promise<T>
// Function returning Promise
export function ensure<T>(
	fn: () => Promise<T>,
	predicate: (value: T) => boolean,
	error?: ErrorConstructor<Error> | ((value: T) => Error),
): Promise<T>
// Sync function
export function ensure<T>(
	fn: () => T,
	predicate: (value: T) => boolean,
	error?: ErrorConstructor<Error> | ((value: T) => Error),
): T
// Sync value (catch-all)
export function ensure<T>(
	value: T,
	predicate: (value: T) => boolean,
	error?: ErrorConstructor<Error> | ((value: T) => Error),
): T
export function ensure<T>(
	value: T | Promise<T> | (() => T | Promise<T>),
	predicate: (value: T) => boolean,
	error: ErrorConstructor<Error> | ((value: T) => Error) = UnknownError,
): T | Promise<T> {
	// Handle function
	if (typeof value === 'function') {
		const result = (value as () => T | Promise<T>)()
		if (isPromise<T>(result)) {
			return result.then((resolved) => {
				if (!predicate(resolved)) {
					throwError(resolved, error)
				}
				return resolved
			})
		}
		if (!predicate(result)) {
			throwError(result, error)
		}
		return result
	}

	// Handle promise
	if (isPromise<T>(value)) {
		return value.then((resolved) => {
			if (!predicate(resolved)) {
				throwError(resolved, error)
			}
			return resolved
		})
	}

	// Handle sync value
	if (!predicate(value)) {
		throwError(value, error)
	}
	return value
}
