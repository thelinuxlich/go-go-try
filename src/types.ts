/**
 * Core Result types for go-go-try
 */

export type Success<T> = readonly [undefined, T]
export type Failure<E> = readonly [E, undefined]
export type Result<E, T> = Success<T> | Failure<E>

export type ResultWithDefault<E, T> = readonly [E | undefined, T]

export type MaybePromise<T> = T | Promise<T>

/**
 * Base interface for tagged errors.
 * The `_tag` property enables discriminated union narrowing.
 */
export interface TaggedError<T extends string> {
  readonly _tag: T
  readonly message: string
  readonly cause?: unknown
}

export interface GoTryAllOptions {
  /**
   * Maximum number of concurrent promises.
   * Set to 0 (default) for unlimited concurrency (all promises run in parallel).
   */
  concurrency?: number
}

/**
 * Type for error constructors that can be used with goTryRaw.
 */
export type ErrorConstructor<E> = new (message: string, options?: { cause?: unknown }) => E

/**
 * Checks if a value is a tagged error (has a _tag property).
 */
export type IsTaggedError<T> = T extends { _tag: string } ? true : false

/**
 * Options for goTryRaw function.
 * errorClass and systemErrorClass are mutually exclusive - you can only provide one.
 */
export type GoTryRawOptions<E = Error> =
  | { errorClass: ErrorConstructor<E>; systemErrorClass?: never }
  | { errorClass?: never; systemErrorClass: ErrorConstructor<E> }
  | { errorClass?: never; systemErrorClass?: never }

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
export type TaggedUnion<T extends readonly ErrorConstructor<unknown>[]> = 
  { [K in keyof T]: T[K] extends ErrorConstructor<infer E> ? E : never }[number]
