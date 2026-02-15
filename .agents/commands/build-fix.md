---
description: Fix build issues and resolve compilation errors
argument-hint: '[error-message]'
---

# Build Fix Command

## Usage

```
claude build-fix
claude build-fix "[error-message]"
claude build-fix --verbose
```

Diagnoses and fixes build failures systematically.

## Steps

1. **Identify Build Error** - Run build and capture error output
2. **Parse Error Message** - Extract file path, line number, error type
3. **Categorize Error** - Determine error category:
   - TypeScript compilation errors
   - Missing dependencies
   - Circular dependencies
   - Import resolution failures
   - Runtime errors in build process
4. **Locate Problem** - Navigate to problematic code
5. **Analyze Context** - Understand surrounding code and dependencies
6. **Suggest Fix** - Provide specific fix with explanation:
   - Show corrected code
   - Explain root cause
   - Prevent similar issues
7. **Verify Fix** - Re-run build to confirm
8. **Check Related Issues** - Look for similar patterns in codebase

## Options

- `--verbose` - Show detailed build output
- `--watch` - Auto-fix and rebuild on file changes
- `--auto-fix` - Apply suggested fixes automatically
- `--check-deps` - Include dependency resolution analysis
- `--ignore-cache` - Clear and rebuild from scratch
- `--focus` - Focus on specific error type (ts, imports, etc)

## Examples

```bash
# Run full build diagnostic
claude build-fix

# Fix specific error
claude build-fix "Cannot find module '@myorg/shared'"

# Auto-fix and watch
claude build-fix --auto-fix --watch

# Verbose TypeScript errors
claude build-fix --verbose --focus ts

# Check for dependency issues
claude build-fix --check-deps --ignore-cache
```

## Tech Stack Build Stack

- **Bun** - Build runner and transpiler
- **TypeScript** - Type checking and compilation
- **Moonrepo** - Monorepo build orchestration
- **oxlint** - Linting during build

## Common Error Patterns

1. **Missing Types** - Add `@types/` packages
2. **Import Paths** - Fix path aliases in tsconfig
3. **Circular Dependencies** - Restructure modules
4. **Effect Imports** - Ensure correct Schema/Runtime imports
5. **Database Migrations** - Sync schema changes
