# Testing Conventions

## Core Principles
- **Test-Driven Development (TDD)**: Write tests before implementation
- **80% Coverage Target**: Aim for 80% code coverage; 100% on critical paths
- **Effect Testing**: Use Effect.runSync/runPromise for Effect-based code
- **Unit First**: Test units in isolation; use mocks for dependencies
- **Arrange-Act-Assert**: Clear test structure for readability
- **Fast Feedback**: Tests run in <5s; fail fast

## DO ✅

### 1. TDD Workflow (Red-Green-Refactor)
```typescript
// RED: Write failing test first
describe('CreateUserUsecase', () => {
  it('should create a user with valid input', async () => {
    // Arrange
    const mockRepo = {
      save: jest.fn().mockResolvedValue(void 0),
      findByEmail: jest.fn().mockRejectedValue(new UserNotFound())
    }
    const usecase = new CreateUserUsecase(mockRepo)

    // Act
    const result = await usecase.execute({
      email: 'test@example.com',
      name: 'Test User'
    }).pipe(Effect.runPromise)

    // Assert
    expect(result).toBeDefined()
    expect(result.email).toBe('test@example.com')
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }))
  })
})

// GREEN: Implement minimal code to pass
export class CreateUserUsecase {
  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(generateId(), input.email, input.name)
    await this.repo.save(user)
    return user
  }
}

// REFACTOR: Improve without changing behavior
export class CreateUserUsecase {
  execute(input: CreateUserInput): Effect.Effect<User, CreateUserError> {
    return Effect.succeed(input).pipe(
      Effect.andThen((input) => this.validateInput(input)),
      Effect.andThen((input) => this.createAndSave(input))
    )
  }

  private validateInput(input: CreateUserInput): Effect.Effect<CreateUserInput, ValidationError> {
    if (!input.email.includes('@')) {
      return Effect.fail(new ValidationError('Invalid email'))
    }
    return Effect.succeed(input)
  }

  private createAndSave(input: CreateUserInput): Effect.Effect<User, SaveError> {
    const user = new User(generateId(), input.email, input.name)
    return this.repo.save(user).pipe(Effect.as(user))
  }
}
```

### 2. Effect Testing with Test Layers
```typescript
// DO: Create test doubles
const UserRepositoryTest = Layer.succeed(
  UserRepository,
  {
    save: () => Effect.succeed(void 0),
    findById: (id) => Effect.fail(new UserNotFound({ id }))
  }
)

// DO: Test effects with runSync
describe('GetUserUsecase', () => {
  it('should return user when found', () => {
    const testUser = new User('123', 'test@example.com', 'Test')
    
    const UserRepositoryTest = Layer.succeed(
      UserRepository,
      {
        save: () => Effect.succeed(void 0),
        findById: (id) => 
          id === '123' 
            ? Effect.succeed(testUser)
            : Effect.fail(new UserNotFound({ id }))
      }
    )

    const result = GetUserUsecase.execute('123').pipe(
      Effect.provide(UserRepositoryTest),
      Effect.runSync
    )

    expect(result).toEqual(testUser)
  })

  // DO: Test error cases
  it('should fail with UserNotFound when user missing', () => {
    const UserRepositoryTest = Layer.succeed(
      UserRepository,
      {
        save: () => Effect.succeed(void 0),
        findById: () => Effect.fail(new UserNotFound({ id: '404' }))
      }
    )

    expect(() => 
      GetUserUsecase.execute('404').pipe(
        Effect.provide(UserRepositoryTest),
        Effect.runSync
      )
    ).toThrow('UserNotFound')
  })
})

// DO: Test with async Effects
describe('EmailService', () => {
  it('should send email successfully', async () => {
    const result = await sendEmail('test@example.com', 'Subject', 'Body').pipe(
      Effect.runPromise
    )

    expect(result).toEqual({ status: 'sent', messageId: expect.any(String) })
  })
})
```

### 3. Unit Testing with Mocks
```typescript
// DO: Mock dependencies cleanly
describe('OrderService', () => {
  let userRepo: jest.Mocked<IUserRepository>
  let orderRepo: jest.Mocked<IOrderRepository>
  let service: OrderService

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      save: jest.fn()
    }
    orderRepo = {
      save: jest.fn(),
      findById: jest.fn()
    }
    service = new OrderService(userRepo, orderRepo)
  })

  it('should create order for valid user', async () => {
    const user = new User('1', 'test@example.com', 'Test')
    userRepo.findById.mockResolvedValue(user)
    orderRepo.save.mockResolvedValue(void 0)

    const result = await service.createOrder('1', {
      items: [{ id: 'item1', quantity: 1 }]
    })

    expect(result).toBeDefined()
    expect(userRepo.findById).toHaveBeenCalledWith('1')
    expect(orderRepo.save).toHaveBeenCalled()
  })

  // DO: Verify call arguments
  it('should pass correct data to repository', async () => {
    userRepo.findById.mockResolvedValue(new User('1', 'test@example.com', 'Test'))
    orderRepo.save.mockResolvedValue(void 0)

    await service.createOrder('1', { items: [] })

    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '1',
        items: expect.any(Array)
      })
    )
  })
})
```

### 4. Achieve 80% Coverage
```typescript
// DO: Check coverage regularly
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/**/index.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}

// DO: Test critical paths 100%
// Critical: domain entities, validation logic, error handling
describe('User', () => {
  // All possible states tested
  it('should be valid with correct data', () => {
    const user = new User('1', 'test@example.com', 'Test')
    expect(user.isValid()).toBe(true)
  })

  it('should be invalid without email', () => {
    const user = new User('1', '', 'Test')
    expect(user.isValid()).toBe(false)
  })

  it('should be invalid without name', () => {
    const user = new User('1', 'test@example.com', '')
    expect(user.isValid()).toBe(false)
  })
})
```

### 5. Integration Testing
```typescript
// DO: Test feature end-to-end with test layers
describe('Create User Feature', () => {
  it('should create user with welcome email', async () => {
    const TestLayer = Layer.merge(
      UserRepositoryTestLive,
      EmailServiceTestLive,
      LoggerTestLive
    )

    const result = await CreateUserUsecase.execute({
      email: 'new@example.com',
      name: 'New User'
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    )

    expect(result.email).toBe('new@example.com')
    // Verify side effects happened
    expect(EmailServiceTestLive.lastSent).toEqual({
      to: 'new@example.com',
      subject: expect.stringContaining('Welcome')
    })
  })
})

// DO: Test error recovery
describe('Error Handling', () => {
  it('should retry on transient error', async () => {
    let attempts = 0
    const flaky = Effect.sync(() => {
      attempts++
      if (attempts < 2) throw new Error('Transient error')
      return 'success'
    })

    const result = await flaky.pipe(
      Effect.retry({ times: 2 }),
      Effect.runPromise
    )

    expect(result).toBe('success')
    expect(attempts).toBe(2)
  })
})
```

## DON'T ❌

### 1. Don't Test Implementation Details
```typescript
// DON'T: Testing internals
it('should call findById before save', () => {
  const spy = jest.spyOn(repo, 'findById')
  usecase.execute(input)
  expect(spy).toHaveBeenCalled()
})

// Instead, test behavior
it('should return saved user', async () => {
  const result = await usecase.execute(input).pipe(Effect.runPromise)
  expect(result).toHaveProperty('id')
  expect(result.email).toBe(input.email)
})
```

### 2. Don't Write Tests for Getters/Setters
```typescript
// DON'T: Trivial tests
it('should get name', () => {
  const user = new User('1', 'email', 'Test')
  expect(user.name).toBe('Test')
})

// Instead, test behavior
it('should validate name is not empty', () => {
  expect(() => new User('1', 'email', '')).toThrow()
})
```

### 3. Don't Make Tests Brittle
```typescript
// DON'T: Over-specify mocks
expect(mockFn).toHaveBeenCalledWith(
  exactly('this', 'exact', 'order', 'matters')
)

// Instead, use matchers
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ email: expect.any(String) })
)
```

### 4. Don't Skip Error Cases
```typescript
// DON'T: Only test happy path
it('should create user', () => {
  const result = usecase.execute(validInput)
  expect(result).toBeDefined()
})

// Instead, test errors too
it('should fail with invalid email', () => {
  expect(() => 
    usecase.execute({ email: 'invalid', name: 'Test' })
  ).toThrow('ValidationError')
})

it('should fail when email exists', () => {
  mockRepo.findByEmail.mockResolvedValue(existingUser)
  expect(() => usecase.execute(input)).toThrow('EmailAlreadyExists')
})
```

### 5. Don't Use sleep() or Timeouts
```typescript
// DON'T: Flaky timing
it('should process queue', (done) => {
  processQueue()
  setTimeout(() => {
    expect(queue.isEmpty()).toBe(true)
    done()
  }, 1000) // Unreliable!
})

// Instead, use explicit signaling
it('should process queue', async () => {
  const processed = new Promise(resolve => {
    processQueue().then(() => resolve(true))
  })
  
  const result = await processed
  expect(result).toBe(true)
})
```

### 6. Don't Test Third-Party Libraries
```typescript
// DON'T: Testing Express behavior
it('should set status code 201', () => {
  const res = Response.create()
  res.status(201)
  expect(res.statusCode).toBe(201)
})

// Instead, test your code
it('should return created status', async () => {
  const response = await controller.create(request)
  expect(response.statusCode).toBe(201)
})
```

## Test File Structure

```typescript
// src/features/users/application/CreateUserUsecase.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Layer, Effect } from 'effect'
import { CreateUserUsecase } from './CreateUserUsecase'
import { UserRepository } from '../adapters/UserRepository'

describe('CreateUserUsecase', () => {
  let usecase: CreateUserUsecase
  let mockRepo: jest.Mocked<IUserRepository>

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findByEmail: jest.fn()
    }
    usecase = new CreateUserUsecase(mockRepo)
  })

  describe('execute', () => {
    it('should create user with valid input', async () => {
      mockRepo.findByEmail.mockRejectedValue(new UserNotFound())
      
      const result = await usecase.execute({
        email: 'test@example.com',
        name: 'Test'
      }).pipe(Effect.runPromise)

      expect(result.email).toBe('test@example.com')
    })

    it('should fail when email exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(existingUser)

      expect(() =>
        usecase.execute({
          email: 'existing@example.com',
          name: 'Test'
        }).pipe(Effect.runSync)
      ).toThrow('EmailAlreadyExists')
    })
  })

  describe('validation', () => {
    it('should reject invalid email', async () => {
      expect(() =>
        usecase.execute({
          email: 'invalid',
          name: 'Test'
        }).pipe(Effect.runSync)
      ).toThrow('ValidationError')
    })
  })
})
```

## Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# Example output:
# ──────────────────────────────────────────────────────────
# File           | % Stmts | % Branch | % Funcs | % Lines |
# ──────────────────────────────────────────────────────────
# All files      |   82.5  |   80.2   |   85.1  |   82.1  |
# users/domain   |   100   |   100    |   100   |   100   |
# users/app      |   88    |   82     |   90    |   88    |
# users/adapters |   70    |   65     |   75    |   70    |
# ──────────────────────────────────────────────────────────
```

## Integration with Skills
- **Use with /git-master**: Tests should pass before commits
- **Use with /refactor**: Run tests after refactoring to ensure correctness
- **Use with TDD**: Red → Green → Refactor workflow

## Rationale

| Practice | Why |
|----------|-----|
| TDD | Drives design; ensures testability |
| 80% coverage | Catches bugs; cost-effective |
| Effect testing | Ensures effects work correctly; type-safe |
| Unit first | Fast feedback; isolates issues |
| Mocks for deps | Tests independent; no side effects |

## References
- Jest Documentation: https://jestjs.io/
- Testing Library: https://testing-library.com/
- Effect Testing: https://effect.website/docs/guides/testing
