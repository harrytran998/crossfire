---
name: Effect Testing
description: Testing patterns and best practices for Effect framework applications
---

## Overview

Effect provides comprehensive testing utilities for writing testable, composable effect-based code. Testing with Effect emphasizes functional purity, composability, and type safety.

## Key Concepts

### Effect Testing Layer
- Provides testing utilities built on Effect primitives
- Enables deterministic testing of concurrent code
- Supports property-based testing via @effect/schema

### Fiber-Level Testing
- Test individual Effect fibers
- Control timing and scheduling
- Test interruption and cancellation

### Mock Services
- Replace real services with test implementations
- Verify service interactions
- Test multiple scenarios without side effects

### Deterministic Time
- Control time in tests
- Test timeout behavior
- Verify timing-sensitive logic

## Code Examples

### Basic Effect Tests with @effect/test
```typescript
import * as Test from "@effect/test";
import { describe, it } from "@effect/test";
import { Effect, Exit } from "effect";
import { expect } from "bun:test";

describe("Basic Effect Tests", () => {
  it("should succeed with a value", () =>
    Effect.gen(function* ($) {
      const result = yield* $(Effect.succeed(42));
      expect(result).toBe(42);
    }));

  it("should fail with an error", () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        Effect.fail("Expected error").pipe(
          Effect.flip() // Convert error to value for testing
        )
      );
      expect(result).toBe("Expected error");
    }));

  it("should handle sequential operations", () =>
    Effect.gen(function* ($) {
      const a = yield* $(Effect.succeed(10));
      const b = yield* $(Effect.succeed(5));
      const result = a + b;
      expect(result).toBe(15);
    }));
});
```

### Testing with Fibers
```typescript
import { Fiber, Effect, Runtime } from "effect";

describe("Fiber Tests", () => {
  it("should fork and join effects", async () => {
    const effect = Effect.gen(function* ($) {
      const fiber1 = yield* $(Effect.fork(Effect.succeed(1)));
      const fiber2 = yield* $(Effect.fork(Effect.succeed(2)));

      const result1 = yield* $(Fiber.join(fiber1));
      const result2 = yield* $(Fiber.join(fiber2));

      return result1 + result2;
    });

    const result = await Effect.runPromise(effect);
    expect(result).toBe(3);
  });

  it("should handle fiber interruption", async () => {
    const effect = Effect.gen(function* ($) {
      const fiber = yield* $(
        Effect.fork(
          Effect.sleep(Duration.seconds(10)).pipe(
            Effect.map(() => "completed")
          )
        )
      );

      yield* $(Effect.sleep(Duration.millis(100)));
      yield* $(Fiber.interrupt(fiber));

      const result = yield* $(Fiber.join(fiber).pipe(Effect.flip()));
      return result;
    });

    const result = await Effect.runPromise(effect);
    expect(result._tag).toBe("InterruptedException");
  });
});
```

### Testing with Mock Services
```typescript
import { Context, Effect, Layer } from "effect";

interface UserService {
  getUser: (id: number) => Effect.Effect<{ id: number; name: string }, Error>;
  createUser: (
    name: string
  ) => Effect.Effect<{ id: number; name: string }, Error>;
}

const UserService = Context.Tag<UserService>();

// Real implementation
const LiveUserService = Layer.succeed(UserService, {
  getUser: (id) =>
    Effect.succeed({ id, name: `User ${id}` }),
  createUser: (name) =>
    Effect.succeed({ id: 1, name }),
});

// Test implementation
const TestUserService = Layer.succeed(UserService, {
  getUser: (id) =>
    id === 1
      ? Effect.succeed({ id: 1, name: "Test User" })
      : Effect.fail(new Error("User not found")),
  createUser: (name) =>
    name.length > 0
      ? Effect.succeed({ id: 1, name })
      : Effect.fail(new Error("Invalid name")),
});

describe("UserService Tests", () => {
  it("should get user with test service", () =>
    Effect.gen(function* ($) {
      const service = yield* $(Effect.service(UserService));
      const user = yield* $(service.getUser(1));
      expect(user.name).toBe("Test User");
    }).pipe(Effect.provide(TestUserService)));

  it("should handle user not found", () =>
    Effect.gen(function* ($) {
      const service = yield* $(Effect.service(UserService));
      const result = yield* $(
        service.getUser(999).pipe(Effect.flip())
      );
      expect(result.message).toBe("User not found");
    }).pipe(Effect.provide(TestUserService)));

  it("should create user", () =>
    Effect.gen(function* ($) {
      const service = yield* $(Effect.service(UserService));
      const user = yield* $(service.createUser("Alice"));
      expect(user.name).toBe("Alice");
    }).pipe(Effect.provide(TestUserService)));
});
```

### Testing Effect Errors
```typescript
import { Effect, Cause } from "effect";

describe("Error Handling Tests", () => {
  it("should catch specific errors", () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        Effect.fail("Custom error").pipe(
          Effect.catch((error) => `Caught: ${error}`)
        )
      );
      expect(result).toBe("Caught: Custom error");
    }));

  it("should handle multiple error types", () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        Effect.gen(function* ($) {
          return yield* $(Effect.fail("error"));
        }).pipe(
          Effect.catchAll((error) => {
            if (typeof error === "string") {
              return Effect.succeed(`String error: ${error}`);
            }
            return Effect.fail(error);
          })
        )
      );
      expect(result).toBe("String error: error");
    }));

  it("should recover from error with orElse", () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        Effect.fail("error").pipe(
          Effect.orElse(() => Effect.succeed("recovered"))
        )
      );
      expect(result).toBe("recovered");
    }));
});
```

### Testing Concurrent Effects
```typescript
import { Effect } from "effect";

describe("Concurrent Effect Tests", () => {
  it("should run multiple effects in parallel", () =>
    Effect.gen(function* ($) {
      const effects = [
        Effect.succeed(1),
        Effect.succeed(2),
        Effect.succeed(3),
      ];

      const result = yield* $(Effect.all(effects));
      expect(result).toEqual([1, 2, 3]);
    }));

  it("should handle concurrent failures", () =>
    Effect.gen(function* ($) {
      const effects = [
        Effect.succeed(1),
        Effect.fail("error"),
        Effect.succeed(3),
      ];

      const result = yield* $(
        Effect.all(effects, { concurrency: "unbounded" }).pipe(
          Effect.flip()
        )
      );
      expect(result).toBe("error");
    }));

  it("should validate with concurrency", () =>
    Effect.gen(function* ($) {
      const validateUser = (id: number) =>
        Effect.sleep(Duration.millis(10)).pipe(
          Effect.map(() => id > 0)
        );

      const results = yield* $(
        Effect.all([
          validateUser(1),
          validateUser(2),
          validateUser(3),
        ], { concurrency: 2 })
      );

      expect(results.every((r) => r)).toBe(true);
    }));
});
```

### Testing with Dependencies
```typescript
import { Context, Effect, Layer } from "effect";

interface Database {
  query: (sql: string) => Effect.Effect<any[], Error>;
}

interface Logger {
  log: (message: string) => Effect.Effect<void>;
}

const Database = Context.Tag<Database>();
const Logger = Context.Tag<Logger>();

const UserService = (userId: number) =>
  Effect.gen(function* ($) {
    const db = yield* $(Effect.service(Database));
    const logger = yield* $(Effect.service(Logger));

    yield* $(logger.log(`Fetching user ${userId}`));
    const result = yield* $(db.query(`SELECT * FROM users WHERE id = ${userId}`));
    
    return result[0] || null;
  });

describe("Dependency Injection Tests", () => {
  it("should use injected services", () =>
    UserService(1).pipe(
      Effect.provide([
        Layer.succeed(Database, {
          query: () => Effect.succeed([{ id: 1, name: "Alice" }]),
        }),
        Layer.succeed(Logger, {
          log: () => Effect.succeed(undefined),
        }),
      ]),
      Effect.andThen((user) => {
        expect(user?.name).toBe("Alice");
        return Effect.succeed(null);
      })
    ));
});
```

### Testing with Timeout
```typescript
import { Effect, Duration } from "effect";

describe("Timeout Tests", () => {
  it("should timeout long-running effect", async () => {
    const slowEffect = Effect.sleep(Duration.seconds(10)).pipe(
      Effect.map(() => "done")
    );

    const result = await Effect.runPromise(
      slowEffect.pipe(
        Effect.timeout(Duration.millis(100)),
        Effect.flip()
      )
    );

    expect(result._tag).toBe("TimeoutException");
  });

  it("should recover from timeout", async () => {
    const slowEffect = Effect.sleep(Duration.seconds(10)).pipe(
      Effect.map(() => "done")
    );

    const result = await Effect.runPromise(
      slowEffect.pipe(
        Effect.timeout(Duration.millis(100)),
        Effect.orElse(() => Effect.succeed("timed out"))
      )
    );

    expect(result).toBe("timed out");
  });
});
```

### Testing Resource Management
```typescript
import { Effect } from "effect";
import { Ref } from "effect";

describe("Resource Management Tests", () => {
  it("should properly acquire and release resources", () =>
    Effect.gen(function* ($) {
      const opened = yield* $(Ref.make(false));
      const closed = yield* $(Ref.make(false));

      const resource = Effect.acquireRelease(
        Effect.gen(function* ($) {
          yield* $(opened.set(true));
          return "resource";
        }),
        () =>
          Effect.gen(function* ($) {
            yield* $(closed.set(true));
          })
      );

      const result = yield* $(
        Effect.scoped(
          Effect.gen(function* ($) {
            const res = yield* $(resource);
            return res;
          })
        )
      );

      const openedState = yield* $(opened.get);
      const closedState = yield* $(closed.get);

      expect(result).toBe("resource");
      expect(openedState).toBe(true);
      expect(closedState).toBe(true);
    }));
});
```

### Property-Based Testing
```typescript
import * as S from "@effect/schema";
import { Schema } from "@effect/schema";
import { Effect } from "effect";

const UserSchema = S.struct({
  id: S.number.pipe(S.positive()),
  name: S.string.pipe(S.minLength(1)),
  email: S.string.pipe(S.email()),
});

describe("Property-Based Tests", () => {
  it("should validate user schema", () =>
    Effect.gen(function* ($) {
      const validUser = {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      };

      const result = yield* $(
        S.decodeUnknown(UserSchema)(validUser)
      );

      expect(result.id).toBe(1);
      expect(result.name).toBe("Alice");
    }));

  it("should fail invalid user schema", () =>
    Effect.gen(function* ($) {
      const invalidUser = {
        id: -1, // negative ID
        name: "", // empty name
        email: "invalid-email",
      };

      const result = yield* $(
        S.decodeUnknown(UserSchema)(invalidUser).pipe(Effect.flip())
      );

      expect(result).toBeDefined();
    }));
});
```

## Best Practices

### 1. Testing Strategy
- Test pure effects without side effects first
- Use mock services for IO operations
- Test error cases explicitly
- Test concurrent scenarios

### 2. Service Mocking
- Create test implementations of services
- Provide deterministic behavior in tests
- Use separate layers for test vs production
- Verify service interactions

### 3. Error Testing
- Test both success and failure paths
- Verify error types and messages
- Test error recovery mechanisms
- Test cascading failures

### 4. Async Testing
- Use `Effect.runPromise` for async tests
- Test timeout behaviors
- Verify concurrent execution
- Handle cleanup in tests

### 5. Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests focused and isolated
- Avoid test interdependencies

## Common Patterns

### Service Interface Pattern
```typescript
interface TestService {
  query: (input: string) => Effect.Effect<string, Error>;
}

const createTestService = (responses: Map<string, string>): TestService => ({
  query: (input) =>
    responses.has(input)
      ? Effect.succeed(responses.get(input)!)
      : Effect.fail(new Error("Not found")),
});
```

### Cleanup Pattern
```typescript
describe("Cleanup Tests", () => {
  it("should cleanup resources", () =>
    Effect.gen(function* ($) {
      const cleaned = yield* $(Ref.make(false));

      yield* $(
        Effect.scoped(
          Effect.gen(function* ($) {
            yield* $(Effect.addFinalizer(() =>
              cleaned.set(true)
            ));
          })
        )
      );

      const state = yield* $(cleaned.get);
      expect(state).toBe(true);
    }));
});
```

### Assertion Pattern
```typescript
const assertEffect = <A>(effect: Effect.Effect<A>, predicate: (a: A) => boolean) =>
  Effect.gen(function* ($) {
    const result = yield* $(effect);
    expect(predicate(result)).toBe(true);
  });
```
