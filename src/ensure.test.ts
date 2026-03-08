import { describe, test, expect } from 'vitest'
import { ensure } from './ensure.js'
import { taggedError } from './tagged-error.js'
import { UnknownError } from './unknown-error.js'

describe('ensure', () => {
	test('returns value when predicate passes', () => {
		const result = ensure(42, (n) => n > 0, () => new Error('negative'))
		expect(result).toBe(42)
	})

	test('uses UnknownError when error parameter is omitted', () => {
		expect(() => ensure(-1, (n) => n > 0)).toThrow(UnknownError)
	})

	test('uses UnknownError with async when error parameter is omitted', async () => {
		await expect(ensure(Promise.resolve(-1), (n) => n > 0)).rejects.toThrow(UnknownError)
	})

	test('returns value when predicate passes with error class', () => {
		const MyError = taggedError('MyError')
		const result = ensure(42, (n) => n > 0, MyError)
		expect(result).toBe(42)
	})

	test('returns value with complex predicate', () => {
		const result = ensure([1, 2, 3], (arr) => arr.length > 0, () => new Error('empty'))
		expect(result).toEqual([1, 2, 3])
	})

	test('throws error when predicate fails', () => {
		expect(() => ensure(-1, (n) => n > 0, (n) => new Error(`${n} is negative`))).toThrow('-1 is negative')
	})

	test('throws with access to value in error factory', () => {
		const obj = { status: 404 }
		expect(() =>
			ensure(
				obj,
				(o) => o.status === 200,
				(o) => new Error(`HTTP ${o.status}`)
			)
		).toThrow('HTTP 404')
	})

	test('throws with error class constructor', () => {
		const RequestFailed = taggedError('RequestFailed')
		const obj = { status: 404 }
		expect(() =>
			ensure(
				obj,
				(o: { status: number }) => o.status === 200,
				RequestFailed
			)
		).toThrow()
		try {
			ensure(obj, (o: { status: number }) => o.status === 200, RequestFailed)
		} catch (e) {
			expect(e).toBeInstanceOf(RequestFailed)
			expect((e as Error & { cause?: unknown }).cause).toBe(obj)
		}
	})

	test('narrows type when predicate is type guard', () => {
		interface User {
			name: string
		}
		const maybeUser: unknown = { name: 'Alice' }

		const user = ensure(
			maybeUser as unknown,
			(u): u is User => typeof u === 'object' && u !== null && 'name' in u,
			() => new Error('Not a user')
		)

		// TypeScript knows this is User, not unknown
		expect((user as User).name).toBe('Alice')
	})

	test('works with async values (promise passed directly)', async () => {
		const result = await ensure(Promise.resolve(42), (n) => n > 0, () => new Error('negative'))
		expect(result).toBe(42)
	})

	test('throws with async values when predicate fails', async () => {
		await expect(
			ensure(Promise.resolve(-1), (n) => n > 0, (n) => new Error(`${n} is negative`))
		).rejects.toThrow('-1 is negative')
	})

	test('works with sync functions', () => {
		const result = ensure(() => 42, (n) => n > 0, () => new Error('negative'))
		expect(result).toBe(42)
	})

	test('throws with sync functions when predicate fails', () => {
		expect(() =>
			ensure(() => -1, (n) => n > 0, (n) => new Error(`${n} is negative`))
		).toThrow('-1 is negative')
	})

	test('works with async functions', async () => {
		const result = await ensure(
			() => Promise.resolve(42),
			(n) => n > 0,
			() => new Error('negative')
		)
		expect(result).toBe(42)
	})

	test('throws with async functions when predicate fails', async () => {
		await expect(
			ensure(() => Promise.resolve(-1), (n) => n > 0, (n) => new Error(`${n} is negative`))
		).rejects.toThrow('-1 is negative')
	})
})
