---
description: Request code review with analysis and suggestions
argument-hint: "[file-or-pr-url]"
---

# Code Review Command

## Usage

```
claude code-review [file-or-pr-url]
claude code-review --pr [pr-number]
claude code-review --all-changes
```

Performs comprehensive code review with linting, type checking, and architecture analysis.

## Steps

1. **Load Code Context** - Parse file(s) or fetch PR changes
2. **Run Static Analysis** - Execute oxlint for code quality
3. **Type Check** - Run TypeScript compiler in check mode
4. **Architecture Review** - Validate module boundaries and dependencies
5. **Performance Scan** - Identify N+1 queries, unnecessary renders, inefficient patterns
6. **Security Review** - Check for common vulnerabilities
7. **Generate Report** - Create detailed review with:
   - Issues found (categorized by severity)
   - Code style suggestions
   - Performance recommendations
   - Security concerns
   - Positive notes
8. **Suggest Improvements** - Provide refactoring patterns

## Options

- `--pr` - Review specific PR number
- `--all-changes` - Review all unstaged/uncommitted changes
- `--strict` - Apply strictest rules
- `--security-focus` - Emphasize security concerns
- `--performance-focus` - Emphasize performance optimizations
- `--auto-fix` - Suggest auto-fixable issues
- `--detailed` - Include code snippets and explanations

## Examples

```bash
# Review specific file
claude code-review src/services/auth.ts

# Review PR before merge
claude code-review --pr 42 --strict

# Security-focused review
claude code-review src/api/ --security-focus

# Review all uncommitted changes
claude code-review --all-changes --auto-fix

# Performance and architecture review
claude code-review packages/database/ --performance-focus --detailed
```

## Tech Stack Focus

- **TypeScript** - Type safety and inference analysis
- **Effect** - Error handling patterns
- **Kysely** - Query optimization and safety
- **oxlint** - Fast, comprehensive linting
- **Moonrepo** - Package boundary violations
