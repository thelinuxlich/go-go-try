import { describe, test, expect } from 'vitest'
import { go, goAll, goElse } from './index.js'

describe('go (alias for goTryRaw)', () => {
	test('returns value on success', async () => {
		const result = await go(Promise.resolve(42))
		expect(result).toEqual([undefined, 42])
	})

	test('returns error on failure', async () => {
		const error = new Error('oops')
		const result = await go(Promise.reject(error))
		// goTryRaw wraps errors in UnknownError by default
		expect(result[0]).toBeInstanceOf(Error)
		expect(result[0]?.message).toBe('oops')
		expect(result[1]).toBeUndefined()
	})

	test('works with non-promise values', async () => {
		const result = await go(42)
		expect(result).toEqual([undefined, 42])
	})

	test('works with sync functions', async () => {
		const result = await go(() => 'hello')
		expect(result).toEqual([undefined, 'hello'])
	})

	test('catches sync errors', async () => {
		const result = await go(() => {
			throw new Error('sync error')
		})
		expect(result[0]?.message).toBe('sync error')
		expect(result[1]).toBeUndefined()
	})

	test('is exported from index', () => {
		// Verified by the import at the top of the file
		expect(go).toBeDefined()
	})
})

describe('goAll (alias for goTryAllRaw)', () => {
	test('returns all results', async () => {
		const [errors, results] = await goAll([
			() => Promise.resolve(1),
			() => Promise.resolve(2),
			() => Promise.resolve(3),
		])
		expect(errors).toEqual([undefined, undefined, undefined])
		expect(results).toEqual([1, 2, 3])
	})

	test('handles mixed success and failure', async () => {
		const [errors, results] = await goAll([
			() => Promise.resolve(1),
			() => Promise.reject(new Error('failed')),
			() => Promise.resolve(3),
		])
		expect(errors[0]).toBeUndefined()
		expect(errors[1]).toBeInstanceOf(Error)
		expect(errors[2]).toBeUndefined()
		expect(results).toEqual([1, undefined, 3])
	})

	test('is exported from index', () => {
		expect(goAll).toBeDefined()
	})
})

describe('goElse', () => {
	test('returns value on success', async () => {
		const [err, value] = await goElse(Promise.resolve(42), 0)
		expect(err).toBeUndefined()
		expect(value).toBe(42)
	})

	test('returns default on failure with Error object', async () => {
		const originalError = new Error('oops')
		const [err, value] = await goElse(() => Promise.reject(originalError), 'default')
		expect(err).toBeInstanceOf(Error)
		expect(err?.message).toBe('oops')
		expect(value).toBe('default')
	})

	test('returns default on sync error with Error object', async () => {
		const [err, value] = await goElse(() => {
			throw new Error('sync error')
		}, 'fallback')
		expect(err).toBeInstanceOf(Error)
		expect(err?.message).toBe('sync error')
		expect(value).toBe('fallback')
	})

	test('wraps non-Error throws in Error', async () => {
		const [err, value] = await goElse(() => {
			throw 'string error'
		}, 'fallback')
		expect(err).toBeInstanceOf(Error)
		expect(err?.message).toBe('string error')
		expect(value).toBe('fallback')
	})

	test('is exported from index', () => {
		expect(goElse).toBeDefined()
	})
})
