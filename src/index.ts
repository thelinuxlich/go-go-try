/// <reference path="types.d.ts" />
export type Success<T> = readonly [undefined, T]
export type Failure<E> = readonly [E, undefined]
export type Result<E, T> = Success<T> | Failure<E>

export type MaybePromise<T> = T | Promise<T>

export function isSuccess<E, T>(result: Result<E, T>): result is Success<T> {
  return result[0] === undefined
}
export function isFailure<E, T>(result: Result<E, T>): result is Failure<E> {
  return result[0] !== undefined
}

export function success<T>(value: T): Success<T> {
  return [undefined, value] as const
}

export function failure<E>(error: E): Failure<E> {
  return [error, undefined] as const
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  try {
    return JSON.stringify(error)
  } catch {
    // fallback in case there's an error stringifying the error
    // with circular references for example.
    return String(error)
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  )
}

export function goTry<T>(fn: () => T): Result<string, T>
export function goTry<T>(value: T): Result<string, T>
export function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>
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

export function goTryRaw<T, E = Error>(fn: () => T): Result<E, T>
export function goTryRaw<T, E = Error>(value: T): Result<E, T>
export function goTryRaw<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<E, T>>
export function goTryRaw<T, E = Error>(
  value: T | Promise<T> | (() => T | Promise<T>),
): Result<E, T> | Promise<Result<E, T>> {
  try {
    const result =
      typeof value === 'function' ? (value as () => T | Promise<T>)() : value
    if (isPromise<T>(result)) {
      return result
        .then((resolvedValue) => success<T>(resolvedValue))
        .catch((err) => failure<E>(err as E))
    }
    return success<T>(result)
  } catch (err) {
    return failure<E>(err as E)
  }
}
