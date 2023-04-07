# `go-go-try`

> Tries to execute a sync/async function, returns a Golang style result.

## Why

Why not [`nice-try`](https://github.com/electerious/nice-try) with it's 70+ million downloads per month?

-   `go-go-try` supports async functions.
-   `go-go-try` allows you to capture the thrown error.
-   `go-go-try` is written in TypeScript. The types are written in a way that reduce developer errors.
-   `go-go-try` is inspired by Golang error catching.

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
import { goTry, goExpect, goTryRaw } from 'go-go-try'

// tries to parse todos, returns empty array if it fails
const [_, value = []] = goTry(() => JSON.parse(todos))

// fetch todos, on error, fallback to empty array
const [_, todos = []] = await goTry(fetchTodos())

// fetch todos, fallback to empty array, send error to your error tracking service
const [err, todos = []] = await goTry(fetchTodos())
sentToErrorTrackingService(err)

// if you still want the task to throw but with a optional custom message
const value = await goExpect(() => JSON.parse('{/}', (err) => `Malformed JSON!`)) // value will be always T

// goTry and goExpect extract the error message from the error object, if you want the raw error object, use goTryRaw
const [err, value] = await goTryRaw(() => JSON.parse('{/}')) // err will be unknown, value will be always T
```

## API

**First parameter** accepts:

-   synchronous function `goTry(() => JSON.parse(value))`
-   asynchronous function / Promise

**Returns** a tuple with the possible error and result (Golang style)

If you use TypeScript, the types are well defined and won't let you make a mistake.

## Inspiration

-   This library started as a fork of [good-try](https://github.com/astoilkov/good-try) but diverged a lot so I decided to rename it
