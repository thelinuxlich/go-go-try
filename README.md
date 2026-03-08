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
import { go } from 'go-go-try'

// tries to parse todos, returns empty array if it fails
const [_, value = []] = go(() => JSON.parse(todos))

// fetch todos, on error, fallback to empty array
const [_, todos = []] = await go(fetchTodos())

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await go(fetchTodos()) // err is UnknownError | undefined
if (err) sendToErrorTrackingService(err)

// go() is the short alias for goTryRaw - returns the raw Error object
const [err, value] = go(() => JSON.parse('{/}')) // err is UnknownError | undefined, value is T | undefined
```

## Short Aliases (v8.0+)

For cleaner code, use the short aliases:

```ts
import { go, goAll, goElse, ensure } from 'go-go-try'

// go() - alias for goTryRaw
const [err, user] = await go(fetchUser(id))

// goAll() - alias for goTryAllRaw
const [errors, results] = await goAll([
  () => fetchUser(1),
  () => fetchUser(2),
])

// goElse() - like go() but with fallback default, returns Error object
const [err, config] = await goElse(loadConfig(), { port: 3000 })

// ensure() - validate values, throws if predicate fails
const res = await ensure(fetch('/api'), r => r.ok, RequestFailed)
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

### Parallel Execution with `goAll`

Execute multiple promises in parallel:

```ts
import { goAll } from 'go-go-try'

const [errors, results] = await goAll([
  () => fetchUser(userId),
  () => fetchPosts(userId),
  () => fetchComments(userId)
])

// errors is [UnknownError | undefined, UnknownError | undefined, UnknownError | undefined]
// results is [User | undefined, Posts | undefined, Comments | undefined]

const [user, posts, comments] = results
```

### Safe Unwrapping with `goElse` (recommended) or `goTryOr`

Both return a default value on failure, but `goElse` is more flexible:

```ts
import { goElse, goTryOr } from 'go-go-try'

// goElse() returns [Error, default] on failure - preserves full error object
const [err, user] = await goElse(fetchUser(id), () => ({
  id: 'anonymous',
  name: 'Guest'
}))
// err is Error | undefined (full error with stack trace)

// goTryOr() returns [string, default] - just the error message
const [errMsg, user] = await goTryOr(fetchUser(id), () => ({
  id: 'anonymous',
  name: 'Guest'
}))
// errMsg is string | undefined

// ✅ Use goElse when you need the full Error object for logging/tracking
const [err, data] = await goElse(fetchData(), defaultData)
if (err) {
  errorTracker.capture(err)  // Full error with stack trace
}

// ✅ Use goTryOr when you only need the error message
const [err, data] = await goTryOr(fetchData(), defaultData)
if (err) {
  console.error('Failed:', err)  // Just the message
}
```

> **Note:** For static default values, you can use destructuring instead:
> ```ts
> // These are equivalent for static defaults:
> const [err, config = {port: 3000}] = go(() => JSON.parse(configString))
> const [err, config] = goElse(() => JSON.parse(configString), {port: 3000})
> ```
> Use `goElse`/`goTryOr` when you need **lazy evaluation** (the default is only computed on failure):

```ts
// ✅ Lazy - createDefault() only runs on failure
const [err, config] = goElse(loadConfig(), () => createDefault())
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
  const [errors, results] = await goAll(
    req.body.operations.map((op: unknown) => () => processOperation(op))
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

### Tagged Errors for Discriminated Unions

Create typed errors with a `_tag` property for pattern matching and discriminated unions:

```ts
import { taggedError, go, failure, type Result } from 'go-go-try'

// Define error types
const DatabaseError = taggedError('DatabaseError')
const NetworkError = taggedError('NetworkError')
const ValidationError = taggedError('ValidationError')

// Create a union type
import type { TaggedUnion } from 'go-go-try'

// Option 1: Using TaggedUnion helper (cleaner)
const DatabaseError = taggedError('DatabaseError')
const NetworkError = taggedError('NetworkError')
const ValidationError = taggedError('ValidationError')

type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError, typeof ValidationError]>
// Equivalent to: DatabaseError | NetworkError | ValidationError

// Option 2: Using InstanceType (standard TypeScript)
type AppErrorVerbose = 
  | InstanceType<typeof DatabaseError>
  | InstanceType<typeof NetworkError>
  | InstanceType<typeof ValidationError>

// Use in functions with typed error returns
async function fetchUser(id: string): Promise<Result<AppError, User>> {
  const [dbErr, user] = await go(queryDatabase(id), { errorClass: DatabaseError })
  if (dbErr) return failure(dbErr)
  
  const [netErr, enriched] = await go(enrichUserData(user!), { errorClass: NetworkError })
  if (netErr) return failure(netErr)
  
  return [undefined, enriched] as const
}

// Pattern matching on errors
const [err, user] = await fetchUser('123')
if (err) {
  switch (err._tag) {
    case 'DatabaseError':
      console.error('Database failed:', err.message)
      break
    case 'NetworkError':
      console.error('Network issue:', err.message)
      break
    case 'ValidationError':
      console.error('Invalid data:', err.message)
      break
  }
}

// Exhaustive switch with compile-time safety
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${String(value)}`)
}

function handleError(err: AppError): string {
  switch (err._tag) {
    case 'DatabaseError':
      return `DB: ${err.message}`
    case 'NetworkError':
      return `NET: ${err.message}`
    case 'ValidationError':
      return `VAL: ${err.message}`
    default:
      // TypeScript will error here if any case is missing above
      return assertNever(err)
  }
}
```

The `taggedError` function creates an error class with:
- `_tag`: A readonly string literal for discriminated unions
- `message`: The error message
- `cause`: Optional cause for error chaining
- `name`: Set to the tag value

### Validation with `ensure`

Validate values with predicates - throws if validation fails. Works with sync values, promises, and functions:

```ts
import { ensure, go } from 'go-go-try'

// Validate a sync value
const num = ensure(42, n => n > 0)  // returns 42
ensure(-1, n => n > 0)  // throws UnknownError

// Validate a promise (awaits internally)
const res = await ensure(fetch('/api'), r => r.ok, RequestFailed)

// Validate with error class
const res = ensure(value, v => isValid(v), ValidationError)

// Validate with custom error factory
const res = ensure(
  response,
  r => r.status === 200,
  r => new Error(`HTTP ${r.status}`)
)

// Chain with go() for error handling
const [err, data] = await go(async () => {
  const res = await ensure(fetch('/api'), r => r.ok, RequestFailed)
  return res.json()
})
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

### Short Aliases

#### `go<T>(value)`

Alias for `goTryRaw`. The most common way to wrap operations.

```ts
function go<T>(value: T | Promise<T> | (() => T | Promise<T>)): Result<UnknownError, T> | Promise<Result<UnknownError, T>>
```

```ts
import { go } from 'go-go-try'

const [err, data] = await go(fetch('/api'))
const [err, value] = go(() => JSON.parse('{"key": "value"}'))
```

#### `goAll<T>(items, options?)`

Alias for `goTryAllRaw`. Execute multiple operations in parallel.

```ts
function goAll<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: { concurrency?: number }
): Promise<[{ [K in keyof T]: UnknownError | undefined }, { [K in keyof T]: T[K] | undefined }]>
```

```ts
import { goAll } from 'go-go-try'

const [errors, results] = await goAll([
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3),
], { concurrency: 2 })
```

#### `goElse<T, D>(value, defaultValue)`

Returns a default value on failure. Like `go()` but never returns `undefined` for the value.

```ts
function goElse<T, D = T>(
  value: T | Promise<T> | (() => T | Promise<T>),
  defaultValue: D | (() => D)
): ResultWithDefault<Error, T, D> | Promise<ResultWithDefault<Error, T, D>>

// ResultWithDefault<E, T, D> = readonly [E, D] | readonly [undefined, T]
```

```ts
import { goElse } from 'go-go-try'

// With static default
const [err, config] = await goElse(loadConfig(), { port: 3000 })

// With lazy default (function only called on failure)
const [err, user] = await goElse(fetchUser(id), () => ({
  id: 'anonymous',
  name: 'Guest'
}))
```

#### `ensure<T>(value, predicate, error?)`

Validates a value against a predicate. Throws if the predicate returns false.

```ts
function ensure<T>(
  value: T | Promise<T> | (() => T | Promise<T>),
  predicate: (value: T) => boolean,
  error?: ErrorConstructor<Error> | ((value: T) => Error)
): T | Promise<T>
```

```ts
import { ensure } from 'go-go-try'

// Sync validation
const num = ensure(42, n => n > 0)  // returns 42
ensure(-1, n => n > 0)  // throws UnknownError

// Async validation (promise awaited internally)
const res = await ensure(fetch('/api'), r => r.ok, RequestFailed)

// With error class
ensure(value, isValid, ValidationError)

// With custom error
ensure(response, r => r.ok, r => new Error(`HTTP ${r.status}`))
```

### Full Function Names

### `goTry<T>(value)`

Executes a function, promise, or value and returns a Result type with error message as string.

```ts
function goTry<T>(value: T | Promise<T> | (() => T | Promise<T>)): Result<string, T> | Promise<Result<string, T>>
```

### `goTryRaw<T, E>(value, options?)`

Like `goTry` but returns the raw Error object instead of just the message.

By default, errors are wrapped in `UnknownError` (a tagged error class). You can customize this behavior with the options object:

```ts
type GoTryRawOptions<E> =
  | { errorClass: ErrorConstructor<E> }           // Wrap ALL errors in this class
  | { systemErrorClass: ErrorConstructor<E> }     // Only wrap non-tagged errors
  | {}                                            // Use defaults
```

> **Note:** `errorClass` and `systemErrorClass` are **mutually exclusive**. TypeScript will show an error if you try to pass both.
> - Use `errorClass` when you want all errors wrapped in a specific type
> - Use `systemErrorClass` when you want tagged errors to pass through and only wrap untagged errors

```ts
// Without options - err is UnknownError | undefined
function goTryRaw<T>(value: T | Promise<T> | (() => T | Promise<T>)): Result<UnknownError, T> | Promise<Result<UnknownError, T>>

// With options object - err is E | undefined
function goTryRaw<T, E>(value: T | Promise<T> | (() => T | Promise<T>), options: GoTryRawOptions<E>): Result<E, T> | Promise<Result<E, T>>
```

**Examples:**

```ts
const DatabaseError = taggedError('DatabaseError')
const NetworkError = taggedError('NetworkError')

// Default - errors wrapped in UnknownError
const [err1, data1] = await goTryRaw(fetchData())
// err1 is UnknownError | undefined
// err1?._tag === 'UnknownError'

// Options object - wrap all errors
const [err2, data2] = await goTryRaw(fetchData(), { errorClass: DatabaseError })
// err2 is DatabaseError | undefined
// err2?._tag === 'DatabaseError'

// Options object - systemErrorClass only wraps non-tagged errors
const [err3, data3] = await goTryRaw(fetchData(), { systemErrorClass: NetworkError })
// If fetchData throws a tagged error (e.g., DatabaseError), it passes through
// If fetchData throws a plain Error, it gets wrapped in NetworkError
```

### `goTryAll<T>(items, options?)`

Executes multiple promises or factory functions with optional concurrency limit. Returns a tuple of `[errors, results]` with fixed tuple types preserving input order.

```ts
interface GoTryAllOptions {
  concurrency?: number  // 0 = unlimited (default), 1 = sequential, N = max concurrent
}

function goTryAll<T extends readonly unknown[]>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllOptions
): Promise<[{ [K in keyof T]: string | undefined }, { [K in keyof T]: T[K] | undefined }]>
```

**Promise mode** (pass promises directly):
```ts
// Run all in parallel (default):
const [errors, results] = await goAll([
  fetchUser(1),      // Promise<User>
  fetchUser(2),      // Promise<User>
  fetchUser(3),      // Promise<User>
])
// errors: [UnknownError | undefined, UnknownError | undefined, UnknownError | undefined]
// results: [User | undefined, User | undefined, User | undefined]
```

**Factory mode** (pass functions that return promises):
```ts
// True lazy execution - factories only called when a slot is available
const [errors, results] = await goAll([
  () => fetchUser(1),  // Only called when concurrency slot available
  () => fetchUser(2),  // Only called when concurrency slot available
  () => fetchUser(3),  // Only called when concurrency slot available
  () => fetchUser(4),  // Only called when concurrency slot available
], { concurrency: 2 })

// Use factory mode when you need to:
// - Rate limit API calls (don't start HTTP requests until allowed)
// - Control database connection limits
// - Limit expensive computation resources
```

### `goTryAllRaw<T, E>(items, options?)`

Like `goTryAll`, but returns raw Error objects instead of error messages.
Non-tagged errors are wrapped in `UnknownError` by default (consistent with `goTryRaw`).
Tagged errors pass through unchanged.

Supports the same `errorClass` and `systemErrorClass` options as `goTryRaw`, plus `concurrency` control.

```ts
interface GoTryAllRawOptions<E> {
  concurrency?: number
  // errorClass and systemErrorClass are mutually exclusive
  errorClass?: ErrorConstructor<E>        // Wrap ALL errors
  systemErrorClass?: ErrorConstructor<E>  // Only wrap non-tagged errors
}

function goTryAllRaw<T extends readonly unknown[], E = UnknownError>(
  items: { [K in keyof T]: Promise<T[K]> | (() => Promise<T[K]>) },
  options?: GoTryAllRawOptions<E>
): Promise<[{ [K in keyof T]: E | undefined }, { [K in keyof T]: T[K] | undefined }]>
```

**Example:**
```ts
const DatabaseError = taggedError('DatabaseError')

// Default behavior - non-tagged errors wrapped in UnknownError
const [errors1] = await goTryAllRaw([
  fetchUser(1),
  fetchUser(2),
])

// Wrap all errors in DatabaseError
const [errors2] = await goTryAllRaw([
  fetchUser(1),
  fetchUser(2),
], { errorClass: DatabaseError })

// Combine concurrency control with errorClass
const [errors3] = await goTryAllRaw([
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3),
], { concurrency: 2, errorClass: DatabaseError })
```

### `goElse<T, D>(value, defaultValue)` / `goTryOr<T>(value, defaultValue)`

Both return a default value on failure instead of `undefined`. `goElse` is the recommended alias.

**`goElse`** returns the full `Error` object:
```ts
function goElse<T, D = T>(value: T | Promise<T> | (() => T | Promise<T>), defaultValue: D | (() => D)): ResultWithDefault<Error, T, D> | Promise<ResultWithDefault<Error, T, D>>
```

**`goTryOr`** returns only the error message (string):
```ts
function goTryOr<T>(value: T | Promise<T> | (() => T | Promise<T>), defaultValue: T | (() => T)): Result<string, T> | Promise<Result<string, T>>
```

**Recommendation:** Use `goElse` when you need the full error for logging/tracking:
```ts
const [err, data] = await goElse(fetchData(), defaultData)
if (err) {
  errorTracker.capture(err)  // Full error with stack trace
}
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

### `taggedError<T>(tag)`

Creates a tagged error class for discriminated error handling. Returns a class constructor that extends `Error` and includes a readonly `_tag` property.

```ts
function taggedError<T extends string>(tag: T): TaggedErrorClass<T>

// Returned class interface:
class TaggedErrorClass<T> extends Error implements TaggedError<T> {
  readonly _tag: T
  readonly cause?: unknown
  constructor(message: string, options?: { cause?: unknown })
}
```

**Example:**
```ts
const DatabaseError = taggedError('DatabaseError')
const err = new DatabaseError('connection failed', { cause: originalError })

console.log(err._tag)    // 'DatabaseError'
console.log(err.message) // 'connection failed'
console.log(err.name)    // 'DatabaseError'
console.log(err.cause)   // originalError
```

### `UnknownError`

A default tagged error class used by `goTryRaw` when no options are provided, or when `systemErrorClass` is not specified in the options object.

```ts
import { UnknownError, go } from 'go-go-try'

// Errors are automatically wrapped in UnknownError
const [err, data] = go(() => {
  throw new Error('something went wrong')
})

if (err) {
  console.log(err._tag)    // 'UnknownError'
  console.log(err.message) // 'something went wrong'
  console.log(err.cause)   // original Error
}
```

Since `UnknownError` is the default for `systemErrorClass`, you can distinguish between known tagged errors and unexpected system errors without specifying any options:

```ts
const DatabaseError = taggedError('DatabaseError')

function fetchData() {
  // Operations that might throw DatabaseError should use errorClass to wrap them
  const [err1, data1] = go(() => queryDatabase(), { errorClass: DatabaseError })
  
  // Other operations use the default behavior - non-tagged errors become UnknownError
  const [err2, data2] = go(() => parseData(data1))
  // err2 is UnknownError | undefined
  
  // Now you can distinguish between known and unknown error types
  if (err1) {
    console.log('Known DB error:', err1.message)
  } else if (err2) {
    console.log('Unexpected error:', err2.message)
  }
}
```

### `TaggedUnion<T>`

Creates a union type from multiple tagged error classes.

```ts
type TaggedUnion<T extends readonly ErrorConstructor<unknown>[]> = 
  { [K in keyof T]: T[K] extends ErrorConstructor<infer E> ? E : never }[number]
```

**Example:**
```ts
const DatabaseError = taggedError('DatabaseError')
const NetworkError = taggedError('NetworkError')
const ValidationError = taggedError('ValidationError')

// Before (verbose):
type AppErrorVerbose = 
  | InstanceType<typeof DatabaseError>
  | InstanceType<typeof NetworkError>
  | InstanceType<typeof ValidationError>

// After (clean):
type AppError = TaggedUnion<[typeof DatabaseError, typeof NetworkError, typeof ValidationError]>
// Results in: DatabaseError | NetworkError | ValidationError
```

#### Automatic Union Inference

When using `goTryRaw` with different error classes in the same function, TypeScript **automatically infers** the union type without needing explicit type annotations:

```ts
// No explicit return type needed!
async function fetchUserData(id: string) {
  // First operation might fail with DatabaseError
  const [dbErr, user] = await go(queryDb(id), { errorClass: DatabaseError })
  if (dbErr) return failure(dbErr)  // returns Failure<DatabaseError>

  // Second operation might fail with NetworkError  
  const [netErr, enriched] = await go(enrichUser(user!), { errorClass: NetworkError })
  if (netErr) return failure(netErr)  // returns Failure<NetworkError>

  return success(enriched)  // returns Success<User>
}

// TypeScript infers: Promise<Result<DatabaseError | NetworkError, User>>
// No TaggedUnion or explicit types needed!
```

The inferred union enables exhaustive pattern matching:

```ts
const [err, user] = await fetchUserData('123')
if (err) {
  switch (err._tag) {
    case 'DatabaseError': /* handle db error */ break
    case 'NetworkError': /* handle network error */ break
    default: assertNever(err) // compile-time safety
  }
}
```

## Types

```ts
type Success<T> = readonly [undefined, T]
type Failure<E> = readonly [E, undefined]
type Result<E, T> = Success<T> | Failure<E>
type ResultWithDefault<E, T, D = T> = readonly [E, D] | readonly [undefined, T]  // For goElse/goTryOr

// Error type helpers
type TaggedInstance<T> = T extends ErrorConstructor<infer E> ? E : never
type TaggedUnion<T extends readonly ErrorConstructor<unknown>[]> = 
  { [K in keyof T]: T[K] extends ErrorConstructor<infer E> ? E : never }[number]

// Options for goTryRaw (errorClass and systemErrorClass are mutually exclusive)
type GoTryRawOptions<E> =
  | { errorClass: ErrorConstructor<E>; systemErrorClass?: never }
  | { errorClass?: never; systemErrorClass: ErrorConstructor<E> }
  | { errorClass?: never; systemErrorClass?: never }

// Options for goTryAllRaw (includes concurrency + error class options)
type GoTryAllRawOptions<E> =
  | { concurrency?: number; errorClass: ErrorConstructor<E>; systemErrorClass?: never }
  | { concurrency?: number; errorClass?: never; systemErrorClass: ErrorConstructor<E> }
  | { concurrency?: number; errorClass?: never; systemErrorClass?: never }
```

## License

MIT
