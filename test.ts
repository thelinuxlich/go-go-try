import goodTry from './index'

describe('good-try', () => {
    it(`value returned by callback is used when callback doesn't throw`, () => {
        const [_, value] = goodTry(() => 'value', 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', () => {
        const [_, value] = goodTry(() => {
            throw new Error('error')
        }, 'default')

        expect(value).toBe('default')
    })

    it('if callback throws, return default callback value', () => {
        const [err, value] = goodTry(() => {
            throw new Error('error')
        }, 'default')

        expect(value).toBe('default')
        expect(err).toBe('error')
    })

    it('first parameter accepts promises and makes the function async', async () => {
        const [_, value] = await goodTry(Promise.resolve('value'), 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', async () => {
        const [err, value] = await goodTry(Promise.reject(new Error('error')), 'default')

        expect(value).toBe('default')
        expect(err).toBe('error')
    })
})
