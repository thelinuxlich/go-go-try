type Success<T> = readonly [undefined, T];
type Failure<E> = readonly [E, undefined];
type Result<E, T> = Success<T> | Failure<E>;
type ResultWithDefault<E, T> = readonly [E | undefined, T];
type MaybePromise<T> = T | Promise<T>;
interface GoTryAllOptions {
    /**
     * Maximum number of concurrent promises.
     * Set to 0 (default) for unlimited concurrency (all promises run in parallel).
     */
    concurrency?: number;
}
declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
declare function success<T>(value: T): Success<T>;
declare function failure<E>(error: E): Failure<E>;
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
declare function goTryOr<T>(fn: () => never, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
declare function goTryOr<T>(fn: () => Promise<T>, defaultValue: T | (() => T)): Promise<ResultWithDefault<string, T>>;
declare function goTryOr<T>(promise: Promise<T>, defaultValue: T | (() => T)): Promise<ResultWithDefault<string, T>>;
declare function goTryOr<T>(fn: () => T, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
declare function goTryOr<T>(value: T, defaultValue: T | (() => T)): ResultWithDefault<string, T>;
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
declare function goTryAll<T extends readonly unknown[]>(items: {
    [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>);
}, options?: GoTryAllOptions): Promise<[{
    [K in keyof T]: string | undefined;
}, {
    [K in keyof T]: T[K] | undefined;
}]>;
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
declare function goTryAllRaw<T extends readonly unknown[]>(items: {
    [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>);
}, options?: GoTryAllOptions): Promise<[{
    [K in keyof T]: Error | undefined;
}, {
    [K in keyof T]: T[K] | undefined;
}]>;
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
declare function goTry<T>(fn: () => never): Result<string, never>;
declare function goTry<T>(fn: () => Promise<T>): Promise<Result<string, T>>;
declare function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>;
declare function goTry<T>(fn: () => T): Result<string, T>;
declare function goTry<T>(value: T): Result<string, T>;
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
declare function goTryRaw<T, E = Error>(fn: () => never): Result<E, never>;
declare function goTryRaw<T, E = Error>(fn: () => Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(promise: Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>;
declare function goTryRaw<T, E = Error>(value: T): Result<E, T>;

export { failure, goTry, goTryAll, goTryAllRaw, goTryOr, goTryRaw, isFailure, isSuccess, success };
export type { Failure, GoTryAllOptions, MaybePromise, Result, ResultWithDefault, Success };
//# sourceMappingURL=index.d.cts.map
