import pIsPromise from 'p-is-promise'
type ResultTuple<T> = readonly [undefined, T] | readonly [string, undefined]

type ErrorWithMessage = {
    message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) {
        return maybeError
    }

    try {
        return new Error(JSON.stringify(maybeError))
    } catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError))
    }
}

function getErrorMessage(error: unknown): string {
    return toErrorWithMessage(error).message
}

function isPromise<T>(p: T | PromiseLike<T>): p is PromiseLike<T> {
    return pIsPromise(p)
}

function goTry<T>(value: PromiseLike<T>): PromiseLike<ResultTuple<T>>
function goTry<T>(value: () => T): ResultTuple<T>
function goTry<T>(value: (() => T) | PromiseLike<T>): ResultTuple<T> | PromiseLike<ResultTuple<T>> {
    let unwrappedValue
    try {
        unwrappedValue = typeof value === 'function' ? value() : value

        if (isPromise(unwrappedValue)) {
            return Promise.resolve(unwrappedValue)
                .then((value) => [undefined, value] as const)
                .catch((err) => [getErrorMessage(err), undefined] as const)
        }
        return [undefined, unwrappedValue] as const
    } catch (err) {
        return [getErrorMessage(err), undefined] as const
    }
}

export default goTry
