---
name: Clean Architecture
description: Clean Architecture module pattern for scalable, maintainable applications
---

## Overview

Clean Architecture emphasizes separation of concerns through concentric layers. The innermost layers (entities, use cases) contain business logic independent of external frameworks and tools. Outer layers handle UI, database, and infrastructure concerns.

## Key Concepts

### Concentric Layers

1. **Entities**: Core business rules (innermost)
2. **Use Cases**: Application-specific business rules
3. **Interface Adapters**: Translates between use cases and external systems
4. **Frameworks & Drivers**: Web frameworks, databases, etc. (outermost)

### Dependency Rule

Dependencies point inward only. Inner layers never depend on outer layers.

### Independence

- Independent of frameworks
- Testable
- Independent of UI
- Independent of database
- Independent of external agencies

### Modularity

Organize code by business domain rather than technical layer.

## Code Examples

### Project Structure

```
src/
├── domain/                  # Core business entities
│   ├── User/
│   │   └── User.ts
│   ├── Post/
│   │   └── Post.ts
│   └── Comment/
│       └── Comment.ts
├── usecases/               # Application business rules
│   ├── User/
│   │   ├── CreateUserUseCase.ts
│   │   └── GetUserUseCase.ts
│   ├── Post/
│   │   ├── CreatePostUseCase.ts
│   │   └── ListPostsUseCase.ts
│   └── Comment/
│       └── CreateCommentUseCase.ts
├── adapters/               # Interface adapters
│   ├── http/
│   │   ├── UserController.ts
│   │   ├── PostController.ts
│   │   └── routes.ts
│   ├── persistence/
│   │   ├── UserRepository.ts
│   │   ├── PostRepository.ts
│   │   └── CommentRepository.ts
│   └── presenters/
│       ├── UserPresenter.ts
│       └── PostPresenter.ts
├── frameworks/             # External frameworks
│   ├── database/
│   │   └── PostgresDatabase.ts
│   ├── http/
│   │   └── ExpressServer.ts
│   └── cache/
│       └── RedisCache.ts
└── di/                     # Dependency Injection
    └── Container.ts
```

### Domain Layer - Entities

```typescript
// src/domain/User/User.ts
export interface IUser {
  id: string
  email: string
  username: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export class User implements IUser {
  id: string
  email: string
  username: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date

  constructor(
    id: string,
    email: string,
    username: string,
    passwordHash: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id
    this.email = email
    this.username = username
    this.passwordHash = passwordHash
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  // Business logic methods
  updateEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format')
    }
    this.email = newEmail
    this.updatedAt = new Date()
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}

// src/domain/User/UserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
  findAll(): Promise<User[]>
}
```

### Use Case Layer

```typescript
// src/usecases/User/CreateUserUseCase.ts
import { User, IUserRepository } from '../../domain/User'

export interface CreateUserRequest {
  email: string
  username: string
  password: string
}

export interface CreateUserResponse {
  id: string
  email: string
  username: string
}

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create user entity
    const user = new User(
      this.generateId(),
      request.email,
      request.username,
      this.hashPassword(request.password),
      new Date(),
      new Date()
    )

    // Save to repository
    await this.userRepository.save(user)

    // Return response
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(7)
  }

  private hashPassword(password: string): string {
    // In production, use bcrypt or similar
    return Buffer.from(password).toString('base64')
  }
}

// src/usecases/User/GetUserUseCase.ts
export interface GetUserResponse {
  id: string
  email: string
  username: string
  createdAt: Date
}

export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<GetUserResponse | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    }
  }
}
```

### Adapter Layer - Controllers

```typescript
// src/adapters/http/UserController.ts
import { CreateUserUseCase, CreateUserRequest } from '../../usecases/User'
import { GetUserUseCase } from '../../usecases/User/GetUserUseCase'
import { IUserPresenter } from './presenters/UserPresenter'

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private userPresenter: IUserPresenter
  ) {}

  async createUser(req: any, res: any): Promise<void> {
    try {
      const request: CreateUserRequest = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
      }

      const response = await this.createUserUseCase.execute(request)
      res.status(201).json(this.userPresenter.present(response))
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }

  async getUser(req: any, res: any): Promise<void> {
    try {
      const userId = req.params.id
      const response = await this.getUserUseCase.execute(userId)

      if (!response) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(this.userPresenter.present(response))
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}

// src/adapters/http/routes.ts
import { Router } from 'express'
import { UserController } from './UserController'

export function setupRoutes(router: Router, userController: UserController) {
  router.post('/users', (req, res) => userController.createUser(req, res))
  router.get('/users/:id', (req, res) => userController.getUser(req, res))
}
```

### Adapter Layer - Repository Implementation

```typescript
// src/adapters/persistence/UserRepository.ts
import { User, IUserRepository } from '../../domain/User'
import { Kysely } from 'kysely'

interface UserRow {
  id: string
  email: string
  username: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export class UserRepository implements IUserRepository {
  constructor(private db: Kysely<any>) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    if (!row) return null
    return this.mapRowToUser(row)
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst()

    if (!row) return null
    return this.mapRowToUser(row)
  }

  async save(user: User): Promise<void> {
    await this.db
      .insertInto('users')
      .values({
        id: user.id,
        email: user.email,
        username: user.username,
        password_hash: user.passwordHash,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .execute()
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('users').where('id', '=', id).execute()
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db.selectFrom('users').selectAll().execute()

    return rows.map((row) => this.mapRowToUser(row))
  }

  private mapRowToUser(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.username,
      row.password_hash,
      row.created_at,
      row.updated_at
    )
  }
}
```

### Presenter

```typescript
// src/adapters/http/presenters/UserPresenter.ts
export interface IUserPresenter {
  present(data: any): any
}

export class UserPresenter implements IUserPresenter {
  present(userData: any) {
    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      createdAt: userData.createdAt,
    }
  }
}
```

### Dependency Injection Container

```typescript
// src/di/Container.ts
import { Kysely } from 'kysely'
import { CreateUserUseCase } from '../usecases/User'
import { GetUserUseCase } from '../usecases/User/GetUserUseCase'
import { UserRepository } from '../adapters/persistence/UserRepository'
import { UserController } from '../adapters/http/UserController'
import { UserPresenter } from '../adapters/http/presenters/UserPresenter'

export class Container {
  private static instance: Container
  private services: Map<string, any> = new Map()

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  registerService(key: string, factory: () => any): void {
    this.services.set(key, factory)
  }

  getService(key: string): any {
    const factory = this.services.get(key)
    if (!factory) {
      throw new Error(`Service ${key} not found`)
    }
    return factory()
  }

  setupDefaultServices(db: Kysely<any>): void {
    // Repositories
    this.registerService('userRepository', () => new UserRepository(db))

    // Use Cases
    this.registerService(
      'createUserUseCase',
      () => new CreateUserUseCase(this.getService('userRepository'))
    )
    this.registerService(
      'getUserUseCase',
      () => new GetUserUseCase(this.getService('userRepository'))
    )

    // Presenters
    this.registerService('userPresenter', () => new UserPresenter())

    // Controllers
    this.registerService(
      'userController',
      () =>
        new UserController(
          this.getService('createUserUseCase'),
          this.getService('getUserUseCase'),
          this.getService('userPresenter')
        )
    )
  }
}
```

## Best Practices

### 1. Layer Separation

- Keep business logic in domain and use cases
- Controllers should be thin and delegate to use cases
- Don't leak framework details into inner layers

### 2. Dependency Direction

- Always point dependencies inward
- Use dependency injection for external dependencies
- Define interfaces at the layer that needs them

### 3. Testing

- Domain entities are easily testable (no dependencies)
- Use case tests mock repositories
- Integration tests verify adapter/framework layer

### 4. Module Organization

- Group by business domain, not technical layer
- Keep related entities and use cases together
- Each module should have clear responsibility

### 5. Error Handling

- Define domain-specific exceptions
- Let use cases throw application exceptions
- Controllers translate to HTTP responses

## Common Patterns

### Request/Response Objects

Use DTOs to decouple between layers:

```typescript
// Request and Response are independent of HTTP framework
interface CreateUserRequest {
  email: string
  username: string
  password: string
}

interface CreateUserResponse {
  id: string
  email: string
  username: string
}
```

### Entity Validation

```typescript
export class User {
  static create(email: string, username: string, passwordHash: string): User | Error {
    if (!this.isValidEmail(email)) {
      return new Error('Invalid email')
    }
    return new User(generateId(), email, username, passwordHash, new Date(), new Date())
  }
}
```

### Use Case Composition

```typescript
export class UpdateUserAndNotifyUseCase {
  constructor(
    private updateUserUseCase: UpdateUserUseCase,
    private notifyUserUseCase: NotifyUserUseCase
  ) {}

  async execute(request: any) {
    const updateResponse = await this.updateUserUseCase.execute(request)
    await this.notifyUserUseCase.execute(updateResponse.id)
    return updateResponse
  }
}
```
