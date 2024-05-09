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

## Usage

```ts
import { goTry, goTryRaw, goTrySync, goTryRawSync } from 'go-go-try'

// tries to parse todos, returns empty array if it fails
const [_, value = []] = goTrySync(() => JSON.parse(todos))

// fetch todos, on error, fallback to empty array
const [_, todos = []] = await goTry(fetchTodos())

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await goTry(fetchTodos()) // err is string | undefined
sentToErrorTrackingService(err)

// goTry extracts the error message from the error object, if you want the raw error object, use goTryRaw/goTryRawSync
const [err, value] = goTryRawSync<Error>(() => JSON.parse('{/}')) // err will be unknown, value will be always T and you can add a Error type as the first generic argument to avoid checking `instanceof Error`

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await goTryRaw<SomeErrorType>(fetchTodos()) // err is SomeErrorType | undefined
sentToErrorTrackingService(err)
```

## API

**First parameter** accepts:

-   asynchronous function / Promise

**Returns** a tuple with the possible error and result (Golang style)

Alternatively, you can use the `goTrySync` and `goTryRawSync` functions to get the result and error for sync functions.

If you use TypeScript, the types are well defined and won't let you make a mistake.

## Inspiration

-   This library started as a fork of [good-try](https://github.com/astoilkov/good-try) but diverged a lot so I decided to rename it
