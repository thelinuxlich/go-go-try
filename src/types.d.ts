import type { Result } from "./index";

declare module "./index" {
	export function goTry<T>(promise: Promise<T>): Promise<Result<string, T>>
	export function goTryRaw<E = Error>(
		promise: Promise<string>,
	): Promise<Result<E, string>>;
	export function goTryRaw<T, E = Error>(
		promise: Promise<T>,
	): Promise<Result<E, T>>;
}
