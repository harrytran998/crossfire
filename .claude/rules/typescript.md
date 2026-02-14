# TypeScript Conventions

## Core Principles

- **No `any` type**: Always use explicit types or generics
- **Strict mode enabled**: tsconfig.json must have `strict: true`
- **Interfaces for contracts**: Use interfaces for public APIs
- **Types for aliases**: Use type aliases for internal unions and utilities
- **Explicit return types**: Functions must have declared return types

## DO ✅

### 1. Use Strict Types

```typescript
// DO: Explicit return type and parameter types
function processUser(user: User): Promise<Result<UserData>> {
  return Effect.succeed(user.data).pipe(Effect.map((data) => ({ ...data, processed: true })))
}

// DO: Use generics instead of any
function createStore<T>(initialValue: T): Store<T> {
  return { value: initialValue }
}

// DO: Use interfaces for public contracts
interface UserRepository {
  findById(id: string): Effect.Effect<User, UserNotFound>
  save(user: User): Effect.Effect<void, SaveError>
}
```

### 2. Use Proper Type Constructs

```typescript
// DO: Interface for object contracts
interface Config {
  database: string
  port: number
  debug?: boolean
}

// DO: Type for discriminated unions
type Response<T> = { status: 'success'; data: T } | { status: 'error'; error: Error }

// DO: Use const assertions for literals
const ROLES = ['admin', 'user', 'guest'] as const
type Role = (typeof ROLES)[number]
```

### 3. Type Parameters with Constraints

```typescript
// DO: Constrain generic types
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// DO: Use conditional types for complex logic
type Flatten<T> = T extends Array<infer U> ? U : T
```

## DON'T ❌

### 1. Avoid `any`

```typescript
// DON'T: Using any defeats TypeScript
const result: any = someFunction()
const items: any[] = []

// DON'T: `as any` escape hatches
const data = (response as any).data

// Instead, use unknown and narrow
function handle(response: unknown): void {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    const data = (response as { data: unknown }).data
  }
}
```

### 2. Avoid Implicit Types

```typescript
// DON'T: Inferred return types on complex functions
function processData(input) {
  return input.map((x) => x.value).filter((v) => v > 0)
}

// Instead, be explicit
function processData(input: Item[]): number[] {
  return input.map((x) => x.value).filter((v) => v > 0)
}
```

### 3. Avoid `type: 'module'` Issues

```typescript
// DON'T: Mix CommonJS and ESM
export = MyClass
const x = require('./file')

// Instead, use consistent ES modules
export default MyClass
import { MyClass } from './file'
```

## Rationale

| Rule                 | Why                                                       |
| -------------------- | --------------------------------------------------------- |
| No `any`             | Defeats TypeScript's entire purpose; creates runtime bugs |
| Strict mode          | Catches null/undefined errors at compile time             |
| Interface for public | Forces API clarity and contract stability                 |
| Type for unions      | More flexible and better for algebraic types              |
| Explicit returns     | Self-documenting code; catch inference bugs early         |

## File Structure Example

```typescript
// file.ts

// 1. Type definitions first
interface User {
  id: string
  name: string
  email: string
}

type UserResult = Result<User, UserNotFound>

// 2. Constants
const BATCH_SIZE = 100 as const

// 3. Service class
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<UserResult> {
    // Implementation
  }
}

// 4. Export public interface
export interface IUserService {
  getUser(id: string): Promise<UserResult>
}
```

## Integration with Skills

- **Use with /git-master**: Type changes require careful commit messages
- **Use with /refactor**: TypeScript refactoring uses LSP type information
- **Use in TDD flow**: Write types before implementation

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Strict Mode: https://www.typescriptlang.org/tsconfig#strict
