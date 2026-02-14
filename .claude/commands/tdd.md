---
description: Start Test-Driven Development workflow
argument-hint: "[test-file]"
---

# TDD Command

## Usage

```
claude tdd [test-file]
claude tdd --watch [test-file]
claude tdd --coverage
```

Initiates TDD workflow with test generation, implementation, and verification.

## Steps

1. **Parse Existing Tests** - Load test file and extract test cases
2. **Understand Requirements** - Extract requirements from test descriptions
3. **Generate Implementation Scaffold** - Create type stubs matching test expectations
4. **Watch Mode Setup** - Configure Bun watch for auto-execution
5. **Run Tests** - Execute tests and capture failures
6. **Guide Implementation** - Suggest minimal implementation to pass tests
7. **Refactor** - Optimize passing code maintaining green tests
8. **Verify Coverage** - Ensure critical paths are tested

## Options

- `--watch` - Run in watch mode, re-execute on file changes
- `--coverage` - Generate coverage report after tests pass
- `--verbose` - Show detailed test output and diffs
- `--focus` - Run only tests matching pattern
- `--bail` - Stop on first failure (faster feedback)
- `--gen-tests` - Auto-generate tests from function signature

## Examples

```bash
# Start TDD on new feature tests
claude tdd src/features/auth.test.ts

# Watch mode for rapid iteration
claude tdd src/core/middleware.test.ts --watch

# Generate coverage report
claude tdd src/services/database.test.ts --coverage --bail

# Focus on specific test suite
claude tdd src/api/users.test.ts --focus "POST /users"
```

## Tech Stack Integration

- **Bun** - Fast test execution and watch mode
- **TypeScript** - Type checking during tests
- **Effect** - Error handling test patterns
- **Kysely** - Database query testing

## TDD Workflow

1. **Red** - Write failing test
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve code quality
4. **Repeat** - Continue with next requirement
