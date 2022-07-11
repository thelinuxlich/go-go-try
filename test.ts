import goodTry from './index'

describe('good-try', () => {
    it(`value returned by callback is used when callback doesn't throw`, () => {
        const value = goodTry(() => 'value', 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', () => {
        const value = goodTry(() => {
            throw new Error('error')
        }, 'default')

        expect(value).toBe('default')
    })

    it('if callback throws, return default callback value', () => {
        const value = goodTry(
            () => {
                throw new Error('error')
            },
            () => 'default',
        )

        expect(value).toBe('default')
    })

    it('first parameter accepts promises and makes the function async', async () => {
        const value = await goodTry(Promise.resolve('value'), 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', async () => {
        const value = await goodTry(Promise.reject(new Error('error')), 'default')

        expect(value).toBe('default')
    })

    it('first parameter accepts a function that returns a Promise', async () => {
        const value = await goodTry(() => Promise.resolve('value'), 'default')

        expect(value).toBe('value')
    })
})
