import pIsPromise from 'p-is-promise'

type ResultTuple<T> = [string?, T?]

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

export default function goTry<T>(
    value: (() => T) | PromiseLike<T>,
): ResultTuple<T> | PromiseLike<ResultTuple<T>> {
    try {
        const unwrappedValue = typeof value === 'function' ? value() : value

        if (pIsPromise(unwrappedValue)) {
            return Promise.resolve(unwrappedValue)
                .then((value) => [undefined, value])
                .catch((err) => [getErrorMessage(err), undefined]) as Promise<ResultTuple<T>>
        }

        return [undefined, unwrappedValue as T | undefined]
    } catch (err) {
        return [getErrorMessage(err), undefined]
    }
}
