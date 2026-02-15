/**
 * Core Result types for go-go-try
 */
type Success<T> = readonly [undefined, T];
type Failure<E> = readonly [E, undefined];
type Result<E, T> = Success<T> | Failure<E>;
type ResultWithDefault<E, T> = readonly [E | undefined, T];
type MaybePromise<T> = T | Promise<T>;
/**
 * Base interface for tagged errors.
 * The `_tag` property enables discriminated union narrowing.
 */
interface TaggedError<T extends string> {
    readonly _tag: T;
    readonly message: string;
    readonly cause?: unknown;
}
interface GoTryAllOptions {
    /**
     * Maximum number of concurrent promises.
     * Set to 0 (default) for unlimited concurrency (all promises run in parallel).
     */
    concurrency?: number;
}
/**
 * Type for error constructors that can be used with goTryRaw.
 */
type ErrorConstructor<E> = new (message: string, options?: {
    cause?: unknown;
}) => E;
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
type TaggedUnion<T extends readonly ErrorConstructor<unknown>[]> = {
    [K in keyof T]: T[K] extends ErrorConstructor<infer E> ? E : never;
}[number];

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
declare function goTryRaw<T, E = Error>(fn: () => never): Result<E, never>;
declare function goTryRaw<T, E = Error>(fn: () => never, ErrorClass: ErrorConstructor<E>): Result<E, never>;
declare function goTryRaw<T, E = Error>(fn: () => Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(fn: () => Promise<T>, ErrorClass: ErrorConstructor<E>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(promise: Promise<T>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(promise: Promise<T>, ErrorClass: ErrorConstructor<E>): Promise<Result<E, T>>;
declare function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>;
declare function goTryRaw<T, E = Error>(fn: () => T, ErrorClass: ErrorConstructor<E>): Result<E, T>;
declare function goTryRaw<T, E = Error>(value: T): Result<E, T>;
declare function goTryRaw<T, E = Error>(value: T, ErrorClass: ErrorConstructor<E>): Result<E, T>;

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
declare function taggedError<T extends string>(tag: T): {
    new (message: string, options?: {
        cause?: unknown;
    }): {
        readonly _tag: T;
        readonly cause?: unknown;
        name: string;
        message: string;
        stack?: string;
    };
    isError(error: unknown): error is Error;
};

/**
 * Asserts that a condition is true, otherwise throws the provided error.
 * Provides type narrowing when used with Result types.
 *
 * @param condition - The condition to assert
 * @param error - An Error instance or string message to throw if condition is falsy
 * @throws {Error} Throws the provided error if condition is falsy
 *
 * @example
 * // With Result type - narrows error to undefined after assertion
 * const [err, user] = goTryRaw(fetchUser(), DatabaseError)
 * assert(err === undefined, new DatabaseError('Failed to fetch user'))
 * // TypeScript now knows: err is undefined, user is User
 *
 * @example
 * // With string message
 * assert(response.ok, 'Response was not ok')
 *
 * @example
 * // With custom Error instance
 * assert(value > 0, new ValidationError('Value must be positive'))
 */
declare function assert(condition: unknown, error: Error | string): asserts condition;
/**
 * Asserts that a condition is true, otherwise instantiates and throws the error class.
 * Provides type narrowing when used with Result types.
 *
 * @param condition - The condition to assert
 * @param ErrorClass - An Error class constructor (e.g., from taggedError)
 * @param message - The error message to pass to the constructor
 * @throws {Error} Throws a new instance of ErrorClass if condition is falsy
 *
 * @example
 * const ValidationError = taggedError('ValidationError')
 * assert(value > 0, ValidationError, 'Value must be positive')
 * // Equivalent to: if (!(value > 0)) throw new ValidationError('Value must be positive')
 */
declare function assert<T extends Error>(condition: unknown, ErrorClass: new (message: string) => T, message: string): asserts condition;

declare function isSuccess<E, T>(result: Result<E, T>): result is Success<T>;
declare function isFailure<E, T>(result: Result<E, T>): result is Failure<E>;
declare function success<T>(value: T): Success<T>;
declare function failure<E>(error: E): Failure<E>;
/**
 * Helper for exhaustive switch checks on discriminated unions.
 * If this function is called, it means a case was forgotten in a switch statement.
 * Use this in the `default` case of switch statements handling tagged errors.
 *
 * @param value - The value that should be of type `never` if all cases are handled
 * @throws {Error} Always throws an error indicating unhandled case
 *
 * @example
 * const DatabaseError = taggedError('DatabaseError')
 * const NetworkError = taggedError('NetworkError')
 * type AppError = InstanceType<typeof DatabaseError> | InstanceType<typeof NetworkError>
 *
 * function handleError(err: AppError): string {
 *   switch (err._tag) {
 *     case 'DatabaseError':
 *       return `DB: ${err.message}`
 *     case 'NetworkError':
 *       return `NET: ${err.message}`
 *     default:
 *       // TypeScript will error if we forget a case above
 *       return assertNever(err)
 *   }
 * }
 */
declare function assertNever(value: never): never;

export { assert, assertNever, failure, goTry, goTryAll, goTryAllRaw, goTryOr, goTryRaw, isFailure, isSuccess, success, taggedError };
export type { ErrorConstructor, Failure, GoTryAllOptions, MaybePromise, Result, ResultWithDefault, Success, TaggedError, TaggedUnion };
//# sourceMappingURL=index.d.mts.map
