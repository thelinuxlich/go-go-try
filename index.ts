import pIsPromise from 'p-is-promise'
type ResultTuple<T> = readonly [undefined, T] | readonly [string, undefined]
type RawResultTuple<T, E = unknown> =
	| readonly [undefined, T]
	| readonly [E, undefined]

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
		//  with circular references for example.
		return new Error(String(maybeError))
	}
}

function getErrorMessage(error: unknown): string {
	return toErrorWithMessage(error).message
}

function isPromise<T>(p: T | Promise<T>): p is Promise<T> {
	return pIsPromise(p)
}

function goTry<T>(value: Promise<T>): Promise<ResultTuple<T>>
function goTry<T>(value: () => T): ResultTuple<T>
function goTry<T>(
	value: (() => T) | Promise<T>,
): ResultTuple<T> | Promise<ResultTuple<T>> {
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

function goTryRaw<T, E = unknown>(
	value: Promise<T>,
): Promise<RawResultTuple<T, E>>
function goTryRaw<T, E = unknown>(value: () => T): RawResultTuple<T, E>
function goTryRaw<T, E = unknown>(
	value: Promise<T> | (() => T),
): RawResultTuple<T, E> | Promise<RawResultTuple<T, E>> {
	let unwrappedValue
	try {
		unwrappedValue = typeof value === 'function' ? value() : value
		if (isPromise(unwrappedValue)) {
			return Promise.resolve(unwrappedValue)
				.then((value) => [undefined, value] as const)
				.catch((err) => [err, undefined] as const)
		}
		return [undefined, unwrappedValue] as const
	} catch (err) {
		return [err, undefined] as const as RawResultTuple<T, E>
	}
}

async function goExpect<T>(
	value: (() => T) | Promise<T>,
	error?: (err: string) => string,
): Promise<T> {
	const _error = error ?? ((e: string): string => e)
	try {
		const unwrappedValue = typeof value === 'function' ? value() : value
		if (isPromise(unwrappedValue)) {
			const [err, res] = await goTry(unwrappedValue)
			if (err !== undefined) {
				throw new Error(err)
			}
			return res
		}
		return unwrappedValue
	} catch (err) {
		throw new Error(_error(getErrorMessage(err)))
	}
}

export { goTry, goExpect, goTryRaw }
