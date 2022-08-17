import goTry from './index'

describe('go-go-try', () => {
    it(`value returned by callback is used when callback doesn't throw`, () => {
        const [_, value] = goTry(() => 'value', 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', () => {
        const [_, value] = goTry(() => {
            throw new Error('error')
        }, 'default')

        expect(value).toBe('default')
    })

    it('if callback throws, return default callback value', () => {
        const [err, value] = goTry(() => {
            throw new Error('error')
        }, 'default')

        expect(value).toBe('default')
        expect(err).toBe('error')
    })

    it('first parameter accepts promises and makes the function async', async () => {
        const [_, value] = await goTry(Promise.resolve('value'), 'default')

        expect(value).toBe('value')
    })

    it('if callback throws, return default value', async () => {
        const [err, value] = await goTry(Promise.reject(new Error('error')), 'default')

        expect(value).toBe('default')
        expect(err).toBe('error')
    })
})
