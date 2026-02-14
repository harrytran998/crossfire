---
description: Run moonrepo checks and validate monorepo structure
argument-hint: '[scope]'
---

# Moon Check Command

## Usage

```
claude moon-check
claude moon-check [package-name]
claude moon-check --full
```

Validates moonrepo configuration and monorepo health.

## Steps

1. **Verify Configuration** - Check moon.yml and workspace config:
   - Valid YAML syntax
   - Required fields present
   - Version compatibility
2. **Dependency Analysis** - Validate internal dependencies:
   - Check all internal references exist
   - Detect circular dependencies
   - Verify dependency version constraints
3. **Task Configuration** - Review task definitions:
   - Inputs and outputs defined
   - Dependencies correct
   - Cache invalidation rules sensible
4. **Project Validation** - Check all projects:
   - Source files exist
   - Root configs present
   - Language settings correct
5. **Type Safety** - Verify TypeScript integration:
   - Project references correct
   - tsconfig inheritance valid
   - Path aliases aligned
6. **Build Integrity** - Test build pipeline:
   - Run affected task analysis
   - Check build cache strategy
   - Verify output artifacts
7. **Generate Report** - Output findings:
   - Configuration issues
   - Dependency warnings
   - Optimization suggestions
   - Health score

## Options

- `--full` - Deep analysis of all projects and tasks
- `--fix` - Auto-fix common issues
- `--verbose` - Detailed output with file locations
- `--sync-types` - Synchronize TypeScript project references
- `--clean` - Clean cache and regenerate
- `--ci` - Stricter checks for CI/CD

## Examples

```bash
# Quick monorepo validation
claude moon-check

# Check specific package
claude moon-check packages/auth

# Full analysis with fixes
claude moon-check --full --fix

# CI-mode validation
claude moon-check --ci --verbose

# Sync TypeScript references and clean
claude moon-check --sync-types --clean

# Verbose dependency analysis
claude moon-check --verbose --full
```

## Tech Stack Integration

- **Moonrepo** - Monorepo management
- **TypeScript** - Project reference validation
- **Bun** - Task execution
- **Effect/Kysely** - Package-level checks

## Common Checks

1. Circular dependency detection
2. TypeScript project reference validation
3. Task cache strategy review
4. Workspace configuration consistency
5. Internal dependency version alignment
6. Build artifact output verification
