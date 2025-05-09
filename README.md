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

## API

**First parameter** accepts:

-   synchronous/asynchronous function / Promise

**Returns** a tuple with the possible error and result as `[Err | undefined, T | undefined]` (Golang style)


If you use TypeScript, the types are well defined and won't let you make a mistake.
