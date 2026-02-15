---
name: Effect
description: Effect framework (3.19.x) patterns for building composable, type-safe applications
---

## Overview

Effect is a TypeScript library providing a foundation for building composable and type-safe applications. It offers primitives for managing effects, dependencies, error handling, and resource management in a functional programming paradigm.

## Key Concepts

### Effect<A, E, R>

The core type representing an effect with:

- `A`: Success value
- `E`: Error type
- `R`: Required dependencies/context

### Composability

Effects compose through operations like:

- `map`: Transform the success value
- `flatMap` (chain): Sequential effect composition
- `zip`: Run effects in parallel
- `orElse`: Error recovery

### Context & Dependency Injection

Effects can require context through the generic `R` parameter, allowing dependency injection without passing parameters through call chains.

### Resource Management

Automatic cleanup of resources through `acquireRelease` and related primitives.

## Code Examples

### Basic Effect Creation

```typescript
import { Effect } from 'effect'

// Simple effect
const hello: Effect.Effect<string, never, never> = Effect.succeed('Hello')

// Effect that can fail
const divide = (a: number, b: number): Effect.Effect<number, string, never> =>
  b === 0 ? Effect.fail('Division by zero') : Effect.succeed(a / b)

// Effect with dependencies
interface Logger {
  log: (message: string) => void
}

const greet = (name: string): Effect.Effect<string, never, Logger> =>
  Effect.gen(function* ($) {
    const logger = yield* $(Effect.service(Logger))
    const message = `Hello, ${name}!`
    logger.log(message)
    return message
  })
```

### Composing Effects

```typescript
const program = Effect.gen(function* ($) {
  const result1 = yield* $(Effect.succeed(10))
  const result2 = yield* $(divide(result1, 2))
  const greeting = yield* $(greet('World'))
  return { result2, greeting }
})

// Run the effect with context
const runnable = program.pipe(
  Effect.provideService(Logger, {
    log: console.log,
  })
)

Effect.runPromise(runnable)
```

### Error Handling

```typescript
const safeDivide = (a: number, b: number): Effect.Effect<number, string, never> =>
  divide(a, b).pipe(
    Effect.catch(
      (error) => Effect.succeed(0) // Default on error
    ),
    Effect.orElse(
      () => Effect.succeed(-1) // Alternative on specific error
    )
  )

// With error details
const withErrorDetails = divide(10, 0).pipe(
  Effect.mapError((error) => new Error(`Calculation failed: ${error}`))
)
```

### Resource Management

```typescript
const withFile = (path: string): Effect.Effect<string, Error, never> =>
  Effect.acquireRelease(
    Effect.sync(() => {
      console.log(`Opening ${path}`)
      return { content: 'file data' }
    }),
    (file) =>
      Effect.sync(() => {
        console.log(`Closing ${path}`)
      })
  ).pipe(Effect.map((file) => file.content))
```

### Parallel Execution

```typescript
const task1 = Effect.succeed(1)
const task2 = Effect.succeed(2)
const task3 = Effect.succeed(3)

const parallel = Effect.all([task1, task2, task3], { concurrency: 3 })
// Or tuple: [task1, task2, task3]
```

### Service Pattern

```typescript
interface Database {
  query: (sql: string) => Effect.Effect<any, Error, never>
}

const Database = Context.Tag<Database>()

const queryUsers = Effect.gen(function* ($) {
  const db = yield* $(Effect.service(Database))
  return yield* $(db.query('SELECT * FROM users'))
})

const layer = Layer.succeed(Database, {
  query: (sql) => Effect.succeed([{ id: 1, name: 'Alice' }]),
})

const program = queryUsers.pipe(Effect.provide(layer))
```

## Best Practices

### 1. Type Safety

- Always specify error types in effects
- Use discriminated unions for complex error scenarios
- Leverage TypeScript's type system for effect composition

### 2. Error Handling

- Provide meaningful error types, not generic strings
- Use `Effect.try` for sync code that might throw
- Use `Effect.promise` for promise-based async code

### 3. Context Management

- Define context types as interfaces tagged with `Context.Tag`
- Use `Layer` for composing multiple context providers
- Keep context minimal and focused

### 4. Resource Lifecycle

- Always use `acquireRelease` for resources needing cleanup
- Ensure cleanup logic is idempotent
- Use `scoped` for managing resource lifetimes

### 5. Performance

- Use `concurrency` options for parallel effects
- Batch-process when possible
- Avoid unnecessary `flatMap` chains for sequential processing

## Common Patterns

### Error Recovery Chain

```typescript
const retry = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  maxRetries: number = 3
): Effect.Effect<A, E, R> =>
  effect.pipe(
    Effect.catchAll((error) =>
      maxRetries > 0 ? retry(effect, maxRetries - 1) : Effect.fail(error)
    )
  )
```

### Validation

```typescript
const validate = (input: string): Effect.Effect<number, string, never> => {
  const num = parseInt(input, 10)
  return isNaN(num) ? Effect.fail(`Invalid number: ${input}`) : Effect.succeed(num)
}
```

### Pipeline Processing

```typescript
const pipeline = Effect.gen(function* ($) {
  const input = yield* $(validateInput)
  const processed = yield* $(processData(input))
  const output = yield* $(formatOutput(processed))
  return output
})
```

### Caching

```typescript
const cached = (effect: Effect.Effect<string, never, never>) =>
  Effect.gen(function* ($) {
    const ref = yield* $(Effect.ref<string | null>(null))
    return yield* $(
      Effect.flatMap(ref.get, (value) =>
        value !== null
          ? Effect.succeed(value)
          : Effect.flatMap(effect, (result) =>
              Effect.flatMap(ref.set(result), () => Effect.succeed(result))
            )
      )
    )
  })
```
