import pIsPromise from 'p-is-promise'

export default function goodTry<T, K>(value: () => T, defaultValue: K): T | K
export default function goodTry<T>(value: () => T): T | undefined
export default function goodTry<T, K>(
    value: Promise<T> | (() => Promise<T>),
    defaultValue: K,
): Promise<T | K>
export default function goodTry<T>(value: Promise<T> | (() => Promise<T>)): Promise<T | undefined>
// eslint-disable-next-line @typescript-eslint/promise-function-async
export default function goodTry<T, K>(
    value: (() => T) | Promise<T> | (() => Promise<T>),
    defaultValue?: K,
): T | K | undefined | Promise<T | K | undefined> {
    try {
        const unwrappedValue = typeof value === 'function' ? value() : value

        if (pIsPromise(unwrappedValue)) {
            return new Promise((resolve) => {
                return (
                    unwrappedValue
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .then((value) => {
                            resolve(value)
                        })
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .catch(() => {
                            resolve(defaultValue)
                        })
                )
            })
        }

        return unwrappedValue
    } catch {
        return defaultValue
    }
}
