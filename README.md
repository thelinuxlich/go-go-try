# `go-go-try`

> Tries to execute a sync/async function, returns a Golang style result.

## Why

-   Supports sync/async functions.
-   Allows you to capture the thrown error.
-   Written in TypeScript. The types are written in a way that reduce developer errors.
-   Inspired by Golang error catching.
-   Zero dependencies.

Why not just `try`/`catch`?

-   In a lot of cases, `try`/`catch` is still the better option.
-   Nested `try`/`catch` statements are hard to process mentally. They also indent the code and make it hard to read. A single `try`/`catch` does the same but to a lesser degree.
-   If you [prefer const](https://eslint.org/docs/latest/rules/prefer-const), `try`/`catch` statements get in the way because you need to use `let` if you need the variable outside of the `try`/`catch` scope:
    ```ts
    let todos
    try {
        todos = JSON.parse(localStorage.getItem('todos'))
    } catch {}
    return todos.filter((todo) => todo.done)
    ```
-   It takes more space. It's slower to type.

## Install

```bash
npm install go-go-try
```

## Basic Usage

```ts
import { goTry, goTryRaw } from 'go-go-try'

// tries to parse todos, returns empty array if it fails
const [_, value = []] = goTry(() => JSON.parse(todos))

// fetch todos, on error, fallback to empty array
const [_, todos = []] = await goTry(fetchTodos())

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await goTry(fetchTodos()) // err is string | undefined
if (err) sendToErrorTrackingService(err)

// goTry extracts the error message from the error object, if you want the raw error object, use goTryRaw
const [err, value] = goTryRaw(() => JSON.parse('{/}')) // err is Error | undefined, value is T | undefined

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await goTryRaw(fetchTodos()) // err is Error | undefined
if (err) sendToErrorTrackingService(err)
```

## Advanced Usage

### Sequential Async Operations

Chain multiple async operations with clean error handling:

```ts
import { goTry } from 'go-go-try'

async function fetchUserData(userId: string) {
  // Fetch user
  const [fetchErr, user] = await goTry(fetch(`/api/users/${userId}`))
  if (fetchErr) return [fetchErr, undefined] as const
  
  // Parse response
  const [parseErr, data] = await goTry(user!.json())
  if (parseErr) return [parseErr, undefined] as const
  
  // Validate/transform
  const [validateErr, validated] = goTry(() => validateUser(data!))
  if (validateErr) return [validateErr, undefined] as const
  
  return [undefined, validated] as const
}

const [err, user] = await fetchUserData('123')
if (err) {
  console.error('Failed to fetch user:', err)
} else {
  console.log('User:', user)
}
```

### Parallel Execution with `goTryAll`

Execute multiple promises in parallel:

```ts
import { goTryAll } from 'go-go-try'

const [errors, results] = await goTryAll([
  fetchUser(userId),
  fetchPosts(userId),
  fetchComments(userId)
])

// errors is (string | undefined)[]
// results is (User | Posts | Comments | undefined)[]

const [user, posts, comments] = results
```

### Safe Unwrapping with `goTryOr`

Like `goTry`, but returns a default value on failure instead of `undefined`:

> **Note:** For static default values, you can use destructuring instead:
> ```ts
> // These are equivalent for static defaults:
> const [err, config = {port: 3000}] = goTry(() => JSON.parse(configString))
> const [err, config] = goTryOr(() => JSON.parse(configString), {port: 3000})
> ```
> Use `goTryOr` when you need **lazy evaluation** (the default is only computed on failure):

```ts
import { goTryOr } from 'go-go-try'

// ✅ Use goTryOr with a function for lazy evaluation - default only computed on failure
const [err, user] = await goTryOr(fetchUser(id), () => ({
  id: 'anonymous',
  name: 'Guest',
  createdAt: new Date()  // This won't run on success
}))

// ❌ Avoid: wasteful - createDefault() runs even on success
const [err, config = createDefault()] = goTry(loadConfig())

// ✅ Better: lazy - createDefault() only runs on failure
const [err, config] = goTryOr(loadConfig(), () => createDefault())
```

### Express/Fastify Error Handling

Use in API route handlers:

```ts
import { goTry } from 'go-go-try'
import express from 'express'

const app = express()

app.post('/users', async (req, res) => {
  const [err, user] = await goTry(createUser(req.body))
  
  if (err) {
    return res.status(400).json({ error: err })
  }
  
  res.json(user)
})

// Batch endpoint
app.post('/batch', async (req, res) => {
  const [errors, results] = await goTryAll(
    req.body.operations.map(op => processOperation(op))
  )
  
  const hasErrors = errors.some(e => e !== undefined)
  
  res.status(hasErrors ? 207 : 200).json({
    results,
    errors: errors.filter(Boolean)
  })
})
```

### Type Guards

Narrow types using `isSuccess` and `isFailure`:

```ts
import { goTry, isSuccess, isFailure } from 'go-go-try'

const result = goTry(() => riskyOperation())

if (isSuccess(result)) {
  // result[1] is typed as T (not T | undefined)
  console.log(result[1])
} else if (isFailure(result)) {
  // result[0] is typed as E (not E | undefined)
  console.error(result[0])
}
```

You can also narrow types by destructuring and checking the error:

```ts
const [err, value] = goTry(() => riskyOperation())

if (err === undefined) {
  // value is typed as T (not T | undefined)
  console.log(value)
} else {
  // err is typed as string (not string | undefined)
  console.error(err)
  // value is typed as undefined in this branch
}
```

### Helper Functions

Build custom utilities on top of the primitives:

```ts
import { goTry, success, failure, type Result } from 'go-go-try'

// Custom validation helper
function validateEmail(email: string): Result<string, string> {
  if (!email.includes('@')) {
    return failure('Invalid email format')
  }
  return success(email.toLowerCase().trim())
}

// Usage
const [err, normalizedEmail] = validateEmail('User@Example.COM')
if (err) {
  console.error(err) // Doesn't trigger
} else {
  console.log(normalizedEmail) // 'user@example.com'
}
```

## API

### `goTry<T>(value)`

Executes a function, promise, or value and returns a Result type with error message as string.

```ts
function goTry<T>(value: T | Promise<T> | (() => T | Promise<T>)): Result<string, T> | Promise<Result<string, T>>
```

### `goTryRaw<T, E>(value)`

Like `goTry` but returns the raw Error object instead of just the message.

```ts
function goTryRaw<T, E = Error>(value: T | Promise<T> | (() => T | Promise<T>)): Result<E, T> | Promise<Result<E, T>>
```

### `goTryAll<T>(promises)`

Executes multiple promises in parallel. Returns a tuple of `[errors, results]`.

```ts
function goTryAll<T extends readonly unknown[]>(
  promises: { [K in keyof T]: Promise<T[K]> }
): Promise<[string[] | undefined, { [K in keyof T]: T[K] | undefined }]>
```

### `goTryOr<T>(value, defaultValue)`

Like `goTry`, but returns a default value on failure instead of `undefined`.
The default can be either a static value or a function (for lazy evaluation).

```ts
function goTryOr<T>(value: T | Promise<T> | (() => T | Promise<T>), defaultValue: T | (() => T)): Result<string, T> | Promise<Result<string, T>>
```

### `isSuccess(result)` / `isFailure(result)`

Type guards to check result status.

```ts
function isSuccess<E, T>(result: Result<E, T>): result is Success<T>
function isFailure<E, T>(result: Result<E, T>): result is Failure<E>
```

### `success(value)` / `failure(error)`

Helper functions to create Result tuples.

```ts
function success<T>(value: T): Success<T>
function failure<E>(error: E): Failure<E>
```

## Types

```ts
type Success<T> = readonly [undefined, T]
type Failure<E> = readonly [E, undefined]
type Result<E, T> = Success<T> | Failure<E>
```

## License

MIT
