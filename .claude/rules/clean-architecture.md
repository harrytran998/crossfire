# Clean Architecture Rules

## Core Principles

- **Dependency Rule**: Inner layers must not depend on outer layers
- **Layered Structure**: Entities → Usecases → Interface Adapters → Frameworks
- **Stable Abstractions**: High-level policies stable; low-level details changeable
- **No Leakage**: Framework concerns (HTTP, DB) don't leak into business logic
- **Testability**: Can test business logic without external dependencies

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Frameworks & Drivers (Express)     │
├─────────────────────────────────────────────┤
│  Interface Adapters (Controllers, Gateways) │
├─────────────────────────────────────────────┤
│  Application (Usecases, Service Layer)      │
├─────────────────────────────────────────────┤
│  Entities & Domain (Business Rules)         │
└─────────────────────────────────────────────┘
```

## DO ✅

### 1. Organize by Feature Modules

```typescript
// DO: Feature-based structure
src/
  features/
    users/
      domain/
        User.ts           # Entity
        UserRepository.ts # Interface
        errors.ts         # Domain errors
      application/
        CreateUserUsecase.ts
        GetUserUsecase.ts
      adapters/
        UserController.ts
        UserGateway.ts    # Repository implementation
      tests/
        usecase.test.ts
        gateway.test.ts
    orders/
      domain/
      application/
      adapters/
      tests/

// DO: Domain entity without dependencies
export class User {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly name: string
  ) {}

  isValid(): boolean {
    return this.email.includes('@') && this.name.length > 0
  }
}
```

### 2. Use Repository Pattern for Data Access

```typescript
// DO: Define repository interface in domain
export interface IUserRepository {
  save(user: User): Effect.Effect<void, SaveError>
  findById(id: string): Effect.Effect<User, UserNotFound>
  findByEmail(email: string): Effect.Effect<User, UserNotFound>
}

// DO: Implement in adapters layer
export class UserGateway implements IUserRepository {
  constructor(private db: Database) {}

  save(user: User): Effect.Effect<void, SaveError> {
    return Effect.sync(() => this.db.users.create(user))
  }

  findById(id: string): Effect.Effect<User, UserNotFound> {
    return Effect.sync(() => {
      const found = this.db.users.get(id)
      if (!found) throw new UserNotFound({ id })
      return found
    })
  }
}

// DO: Inject repository into usecase
export class GetUserUsecase {
  constructor(
    private userRepo: IUserRepository,
    private logger: Logger
  ) {}

  execute(id: string): Effect.Effect<User, UserNotFound> {
    return this.userRepo
      .findById(id)
      .pipe(Effect.tap(() => this.logger.info(`Retrieved user: ${id}`)))
  }
}
```

### 3. Usecases Orchestrate Business Logic

```typescript
// DO: Usecase contains business rules
export class CreateUserUsecase {
  constructor(
    private userRepo: IUserRepository,
    private emailService: EmailService,
    private idGenerator: IdGenerator
  ) {}

  execute(input: CreateUserInput): Effect.Effect<User, CreateUserError> {
    return Effect.succeed(input).pipe(
      Effect.andThen((input) => this.validateInput(input)),
      Effect.andThen((input) => this.checkEmailExists(input.email)),
      Effect.andThen((input) => this.createUser(input)),
      Effect.andThen((user) => this.sendWelcomeEmail(user)),
      Effect.map((user) => user)
    )
  }

  private validateInput(input: CreateUserInput): Effect.Effect<CreateUserInput, ValidationError> {
    if (!input.email.includes('@')) {
      return Effect.fail(new ValidationError('Invalid email'))
    }
    return Effect.succeed(input)
  }

  private checkEmailExists(email: string): Effect.Effect<CreateUserInput, EmailAlreadyExists> {
    return this.userRepo.findByEmail(email).pipe(
      Effect.flip,
      Effect.andThen(() => Effect.succeed({ email }))
    )
  }

  private createUser(input: CreateUserInput): Effect.Effect<User, SaveError> {
    const user = new User(this.idGenerator.next(), input.email, input.name)
    return this.userRepo.save(user).pipe(Effect.as(user))
  }

  private sendWelcomeEmail(user: User): Effect.Effect<User, EmailError> {
    return this.emailService.sendWelcome(user).pipe(Effect.as(user))
  }
}
```

### 4. Controllers Bridge HTTP and Usecases

```typescript
// DO: Controller is thin adapter
export class UserController {
  constructor(
    private createUserUsecase: CreateUserUsecase,
    private getUserUsecase: GetUserUsecase
  ) {}

  create(req: Request): Effect.Effect<Response, HttpError> {
    const input = {
      email: req.body.email,
      name: req.body.name,
    }

    return this.createUserUsecase.execute(input).pipe(
      Effect.map((user) => Response.json({ status: 'ok', data: user }, 201)),
      Effect.catch('ValidationError', (err) =>
        Effect.succeed(Response.json({ error: err.message }, 400))
      ),
      Effect.catch('EmailAlreadyExists', () =>
        Effect.succeed(Response.json({ error: 'Email taken' }, 409))
      )
    )
  }

  getById(req: Request): Effect.Effect<Response, HttpError> {
    const id = req.params.id

    return this.getUserUsecase.execute(id).pipe(
      Effect.map((user) => Response.json({ data: user })),
      Effect.catch('UserNotFound', () => Effect.succeed(Response.json({ error: 'Not found' }, 404)))
    )
  }
}
```

### 5. Dependency Injection at Module Boundary

```typescript
// DO: Wire dependencies at entry point (main.ts)
const AppLayer = Layer.merge(DatabaseLayer, LoggerLayer, EmailServiceLayer).pipe(
  Layer.andThen(
    Layer.effectDiscard(
      Effect.all([Effect.serviceWithEffect(UserRepository, (repo) => repo.initialize())])
    )
  )
)

// DO: Create usecase with proper dependencies
const CreateUserUsecaseLive = Layer.effect(
  CreateUserUsecase,
  Effect.all([UserRepository, EmailService, IdGenerator]).pipe(
    Effect.map(([repo, email, idGen]) => new CreateUserUsecase(repo, email, idGen))
  )
)

// DO: Export layer for consumption
export const UsecaseLayer = Layer.merge(CreateUserUsecaseLive, GetUserUsecaseLive)
```

## DON'T ❌

### 1. Don't Let Framework Details Leak Into Domain

```typescript
// DON'T: Domain depends on HTTP/DB libraries
export class User {
  @Required()
  @Email()
  email: string

  @PrimaryKey()
  @GeneratedValue()
  id: string
}

// Instead, keep domain pure
export class User {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly name: string
  ) {}

  isValid(): boolean {
    return this.email.includes('@') && this.name.length > 0
  }
}
```

### 2. Don't Violate Dependency Rule

```typescript
// DON'T: Inner layer depends on outer layer
export class User {
  constructor(
    readonly db: Database,
    readonly http: HttpClient
  ) {}
}

// DON'T: Business logic in controller
export class UserController {
  create(req: Request): Response {
    const user = new User(req.body.email, req.body.name)
    const saved = await this.db.users.save(user)
    await this.email.send(saved)
    return Response.json(saved)
  }
}

// Instead, delegate to usecase
export class UserController {
  constructor(private usecase: CreateUserUsecase) {}

  create(req: Request): Effect.Effect<Response, HttpError> {
    return this.usecase
      .execute({
        email: req.body.email,
        name: req.body.name,
      })
      .pipe(Effect.map((user) => Response.json(user)))
  }
}
```

### 3. Don't Mix Concerns in Single Class

```typescript
// DON'T: Mixing HTTP, DB, email, validation
export class UserService {
  async handleCreateUserRequest(req: Request): Promise<Response> {
    if (!req.body.email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, 400)
    }
    const existing = await db.users.findByEmail(req.body.email)
    if (existing) {
      return Response.json({ error: 'Email taken' }, 409)
    }
    const user = new User(req.body.email, req.body.name)
    await db.users.save(user)
    await emailService.sendWelcome(user)
    return Response.json(user, 201)
  }
}

// Instead, separate concerns
// Domain: User entity, validation logic
// Application: CreateUserUsecase orchestrates flow
// Adapter: UserController handles HTTP
```

### 4. Don't Pass Framework Objects Into Domain

```typescript
// DON'T: Request/Response objects leak
export class CreateUserUsecase {
  execute(req: Request): Promise<Response> {
    const user = new User(req.body.email, req.body.name)
    // ...
  }
}

// Instead, extract data first
export class CreateUserUsecase {
  execute(input: CreateUserInput): Effect.Effect<User, CreateUserError> {
    const user = new User(input.email, input.name)
    // ...
  }
}

export class UserController {
  create(req: Request): Effect.Effect<Response, HttpError> {
    const input = {
      email: req.body.email,
      name: req.body.name,
    }
    return this.usecase.execute(input).pipe(Effect.map((user) => Response.json(user)))
  }
}
```

### 5. Don't Create Circular Dependencies

```typescript
// DON'T: A → B → A
export class UserService {
  constructor(private orderService: OrderService) {}
}

export class OrderService {
  constructor(private userService: UserService) {}
}

// Instead, extract common interface
export interface IUserNotifier {
  notifyUserOfOrder(userId: string, orderId: string): Effect.Effect<void>
}

export class UserService {
  constructor(private notifier: IUserNotifier) {}
}

export class OrderService {
  constructor(private notifier: IUserNotifier) {}
}
```

## Module Structure Template

```typescript
// domain/User.ts - Pure entity
export class User {
  constructor(
    readonly id: string,
    readonly email: string
  ) {}
  isValid(): boolean {
    /* business rules */
  }
}

// domain/IUserRepository.ts - Domain interface
export interface IUserRepository {
  save(user: User): Effect.Effect<void, SaveError>
  findById(id: string): Effect.Effect<User, UserNotFound>
}

// application/CreateUserUsecase.ts - Orchestration
export class CreateUserUsecase {
  constructor(private repo: IUserRepository) {}
  execute(input: Input): Effect.Effect<User, Error> {
    /* */
  }
}

// adapters/UserGateway.ts - Implementation
export class UserGateway implements IUserRepository {
  constructor(private db: Database) {}
  save(user: User): Effect.Effect<void, SaveError> {
    /* */
  }
  findById(id: string): Effect.Effect<User, UserNotFound> {
    /* */
  }
}

// adapters/UserController.ts - HTTP adapter
export class UserController {
  constructor(private usecase: CreateUserUsecase) {}
  create(req: Request): Effect.Effect<Response, HttpError> {
    /* */
  }
}
```

## Integration with Skills

- **Use with /git-master**: Architecture changes require thoughtful commits
- **Use with /refactor**: Refactoring enforces clean architecture
- **Use in TDD**: Architecture emerges from test requirements

## Rationale

| Rule               | Why                                           |
| ------------------ | --------------------------------------------- |
| Dependency Rule    | Prevents tight coupling; enables testing      |
| Layered Structure  | Clear responsibility boundaries               |
| Repository Pattern | Decouples business logic from data source     |
| Thin Controllers   | Easy to test; framework-agnostic logic        |
| DI at Boundary     | Explicit wiring; easy to swap implementations |

## References

- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Layered Architecture: https://www.oreilly.com/library/view/software-architecture-fundamentals/9781491998991/
