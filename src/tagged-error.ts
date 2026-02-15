import type { TaggedError } from './types.js'

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
export function taggedError<T extends string>(tag: T) {
  return class TaggedErrorClass extends Error implements TaggedError<T> {
    readonly _tag: T = tag
    readonly cause?: unknown

    constructor(message: string, options?: { cause?: unknown }) {
      super(message)
      this.name = tag
      this.cause = options?.cause
    }
  }
}
