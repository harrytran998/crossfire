# Effect Framework Patterns

## Core Principles
- **Tagged errors**: Use `Tag<"ErrorName">` for compiler-verified errors
- **Layer pattern**: Compose services using `Layer` for dependency injection
- **Effect as workflow**: Everything is an Effect; compose with pipe
- **Typed errors**: Error types drive code flow and recovery strategies
- **Resource safety**: Use `Layer.scoped` for automatic cleanup

## DO ✅

### 1. Use Tagged Errors
```typescript
// DO: Define errors with Tag
import { Tag } from 'effect'

const UserNotFound = Tag<'UserNotFound', { readonly userId: string }>()
const DatabaseError = Tag<'DatabaseError', { readonly reason: string }>()

// DO: Use errors in Effect return type
export const findUser = (id: string): Effect.Effect<User, UserNotFound> => {
  return Effect.succeed(user).pipe(
    Effect.catch('UserNotFound', () => 
      new UserNotFound({ userId: id })
    )
  )
}

// DO: Handle specific errors
const program = findUser('123').pipe(
  Effect.catch('UserNotFound', (err) => 
    Effect.logInfo(`User not found: ${err.userId}`)
  ),
  Effect.catch('DatabaseError', (err) => 
    Effect.sync(() => console.error(err.reason))
  )
)
```

### 2. Use Layer for Dependency Injection
```typescript
// DO: Define service interface
interface UserRepository {
  readonly _tag: 'UserRepository'
  findById(id: string): Effect.Effect<User, UserNotFound>
  save(user: User): Effect.Effect<void, SaveError>
}

// DO: Implement with Layer
const UserRepositoryLive = Layer.succeed(
  UserRepository,
  {
    _tag: 'UserRepository' as const,
    findById: (id: string) => Effect.sync(() => findInDB(id)),
    save: (user: User) => Effect.sync(() => saveInDB(user))
  }
)

// DO: Consume via Effect.serviceWithEffect
export const getUser = (id: string): Effect.Effect<User, UserNotFound, UserRepository> => 
  Effect.serviceWithEffect(UserRepository, (repo) => repo.findById(id))

// DO: Compose layers
const AppLayer = Layer.merge(
  UserRepositoryLive,
  DatabaseLive,
  LoggerLive
)

// DO: Provide layer to effect
program.pipe(
  Effect.provide(AppLayer),
  Effect.runPromise
)
```

### 3. Use Effect Pipeline Pattern
```typescript
// DO: Compose effects with pipe
const workflow = getUserData(userId).pipe(
  Effect.andThen((user) => validateUser(user)),
  Effect.andThen((validUser) => saveUser(validUser)),
  Effect.tap((saved) => Effect.logInfo(`Saved: ${saved.id}`)),
  Effect.map((user) => ({ success: true, data: user })),
  Effect.catch('ValidationError', (err) => 
    Effect.fail(new APIError('Invalid user', 400))
  ),
  Effect.catch('SaveError', (_) => 
    Effect.fail(new APIError('Database error', 500))
  )
)
```

### 4. Resource Management with Scoped
```typescript
// DO: Use scoped for resource cleanup
const DatabaseLive = Layer.scoped(
  Database,
  Effect.acquireRelease(
    Effect.sync(() => createConnection()),
    (conn) => Effect.sync(() => conn.close())
  )
)

// DO: File handling
const readFile = (path: string): Effect.Effect<string, FileError> =>
  Effect.acquireRelease(
    Effect.sync(() => fs.openSync(path, 'r')),
    (fd) => Effect.sync(() => fs.closeSync(fd))
  ).pipe(
    Effect.andThen((fd) => Effect.sync(() => fs.readFileSync(fd, 'utf-8')))
  )
```

### 5. Testing Effects
```typescript
// DO: Test effects with Effect.runSync or Effect.runPromise
describe('UserService', () => {
  it('should find user', async () => {
    const result = await getUserData('123').pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
    expect(result.id).toBe('123')
  })

  // DO: Test error cases
  it('should fail with UserNotFound', async () => {
    const result = findUser('invalid').pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )
    await expect(result).rejects.toThrow('UserNotFound')
  })
})
```

## DON'T ❌

### 1. Avoid Raw Promises
```typescript
// DON'T: Mix Promises and Effects
const findUser = (id: string): Promise<User> => {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

// Instead, wrap in Effect
const findUser = (id: string): Effect.Effect<User, FetchError> =>
  Effect.promise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
  ).pipe(
    Effect.catch('NetworkError', () => new FetchError(...))
  )
```

### 2. Avoid Untyped Errors
```typescript
// DON'T: Use generic Error or string
Effect.fail('Something went wrong')
Effect.fail(new Error('Database error'))

// Instead, use tagged errors
const DatabaseError = Tag<'DatabaseError', { message: string }>()
Effect.fail(new DatabaseError({ message: 'Connection failed' }))
```

### 3. Avoid Deep Nesting
```typescript
// DON'T: Nested callbacks
findUser(id).then(user => {
  validateUser(user).then(valid => {
    saveUser(valid).then(saved => {
      console.log('Done')
    })
  })
})

// Instead, use pipe
findUser(id).pipe(
  Effect.andThen(validateUser),
  Effect.andThen(saveUser),
  Effect.tap(() => Effect.logInfo('Done'))
)
```

### 4. Avoid Manual Dependency Passing
```typescript
// DON'T: Manually pass dependencies
class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
    private cache: Cache,
    private validator: Validator
  ) {}
}

// Instead, use Layer for DI
const UserServiceLive = Layer.effect(
  UserService,
  Effect.all([Database, Logger, Cache, Validator]).pipe(
    Effect.map(([db, logger, cache, validator]) => 
      new UserService(db, logger, cache, validator)
    )
  )
)
```

### 5. Avoid Catching All Errors
```typescript
// DON'T: Swallow all errors
Effect.try(() => someOperation()).pipe(
  Effect.catch(() => Effect.succeed(null))
)

// Instead, be specific
Effect.try(() => someOperation()).pipe(
  Effect.catch('ValidationError', (err) => handleValidation(err)),
  Effect.catch('TimeoutError', (_) => retryOperation()),
  Effect.catch('FatalError', (err) => Effect.fail(err))
)
```

## Error Handling Patterns

### Tagged Errors Structure
```typescript
// Define errors as separate tags
const NotFound = Tag<'NotFound', { readonly resource: string }>()
const Unauthorized = Tag<'Unauthorized', { readonly userId: string }>()
const ServerError = Tag<'ServerError', { readonly code: number }>()

// Use in union
type ApiError = NotFound | Unauthorized | ServerError

// Handle each
const handler = (error: ApiError): string => {
  switch (error._tag) {
    case 'NotFound':
      return `Resource not found: ${error.resource}`
    case 'Unauthorized':
      return `User ${error.userId} unauthorized`
    case 'ServerError':
      return `Server error (${error.code})`
  }
}
```

## Integration with Skills
- **Use with /git-master**: Effect changes often involve error type updates
- **Use with /refactor**: Effect refactoring focuses on improving error flow
- **Use in testing**: Test both happy path and error cases

## Rationale

| Pattern | Why |
|---------|-----|
| Tagged errors | Compiler checks error handling; no missed cases |
| Layer | Explicit dependencies; testable; clear initialization |
| Effect pipes | Readable, functional composition; error propagation automatic |
| Scoped resources | Automatic cleanup; no resource leaks |
| Type safety | Errors are data; type system guides handling |

## References
- Effect Documentation: https://effect.website/
- Error Management: https://effect.website/docs/guides/error-management
- Dependency Injection: https://effect.website/docs/guides/dependency-injection
