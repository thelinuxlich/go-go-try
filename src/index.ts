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

function goTry<T>(value: PromiseLike<T>) {
	return Promise.resolve(value)
		.then((value) => [undefined, value] as const)
		.catch((err) => [getErrorMessage(err), undefined] as const)
}

function goTrySync<T>(value: () => T) {
	try {
		return [undefined, value()] as const
	} catch (err) {
		return [getErrorMessage(err), undefined] as const
	}
}

function goTryRaw<E = unknown, T = unknown>(value: PromiseLike<T>) {
	return Promise.resolve(value)
		.then((value) => [undefined, value] as const)
		.catch((err) => [err as E, undefined] as const)
}

function goTryRawSync<E = unknown, T = unknown>(value: () => T) {
	try {
		return [undefined, value()] as const
	} catch (err) {
		return [err as E, undefined] as const
	}
}

export { goTry, goTryRaw, goTrySync, goTryRawSync }
