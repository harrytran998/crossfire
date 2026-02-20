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

### Layer Composition with `Layer.provideMerge`

When building an application with multiple service layers that have inter-dependencies, `Layer.mergeAll` alone is **not sufficient** — it creates all layers in parallel so layers within the same `mergeAll` cannot see each other's outputs.

Use `Layer.provideMerge(consumer, provider)` (non-curried form) to chain tiers so each tier's outputs feed into the next tier's requirements.

**Key rules:**
- `Layer.provideMerge(consumer, provider)` — provider's outputs satisfy consumer's requirements, result outputs both
- `Layer.mergeAll(A, B)` — only for layers that are truly independent (no dependency between A and B)
- If layer B depends on layer A at construction time (via `yield*` inside `Layer.effect`), they **cannot** be in the same `mergeAll`

**Correct pattern — tiered composition:**

```typescript
import { Layer } from 'effect'

const ConfigLayer = Layer.mergeAll(
  ServerConfig.Default,
  DatabaseConfig.Default,
  RedisConfig.Default,
)

const InfraLayer = Layer.provideMerge(
  Layer.mergeAll(DatabaseServiceLive, RedisServiceLive),
  ConfigLayer,
)

// HeartbeatServiceLive depends on ConnectionRegistryService at construction time,
// so they cannot be in the same mergeAll — split into two steps
const ConnectionLayer = Layer.provideMerge(
  ConnectionRegistryServiceLive,
  InfraLayer,
)

const RealtimeLayer = Layer.provideMerge(
  HeartbeatServiceLive,
  ConnectionLayer,
)

const DomainLayer = Layer.provideMerge(
  Layer.mergeAll(
    AuthServiceLive,
    PlayerServiceLive,
    // ... other independent domain services
  ),
  RealtimeLayer,
)

const AppLayer = Layer.provideMerge(
  Layer.mergeAll(MatchmakingServiceLive, OutboxDispatcherServiceLive),
  DomainLayer,
)
```

**Wrong — flat mergeAll (runtime crash):**

```typescript
// BROKEN: layers cannot resolve inter-dependencies
const AppLayer = Layer.mergeAll(
  ConfigLayer,
  DatabaseServiceLive,    // needs DatabaseConfig — not available
  RedisServiceLive,       // needs RedisConfig — not available
  HeartbeatServiceLive,   // needs ConnectionRegistryService — not available
  ConnectionRegistryServiceLive,
)
```

**Wrong — `.pipe(Layer.provideMerge(...))` with accumulation (direction is reversed):**

```typescript
// BROKEN: in .pipe form, the argument PROVIDES FOR the receiver, not the other way around
// This feeds InfraLayer's outputs into ConfigLayer's requirements (wrong direction)
const AppLayer = ConfigLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(DatabaseServiceLive, RedisServiceLive)),
)
```

**Note on transitive dependencies:** When a service layer internally bundles repo dependencies via `.pipe(Layer.provide(RepoLive))`, the repo's unsatisfied requirements (e.g., `DatabaseService`) bubble up as the service layer's own requirements. These are resolved by the outer `provideMerge` chain.
