---
name: Moonrepo
description: Moonrepo monorepo task runner for scaling JavaScript/TypeScript projects
---

## Overview

Moonrepo is a fast build system and task runner for monorepos. It provides efficient task scheduling, dependency resolution, caching, and parallelization for large codebases with multiple packages and workspaces.

## Key Concepts

### Workspace Graph
- Tracks dependencies between projects
- Enables incremental builds and tests
- Optimizes task execution order

### Task Pipeline
- Runs tasks in dependency order
- Caches task outputs
- Parallelizes independent tasks

### File-Based Hashing
- Detects which files changed
- Only runs affected tasks
- Speeds up CI/CD pipelines

### Configuration as Code
- Define workflows in YAML or TypeScript
- Version-controlled task definitions
- Flexible and composable

## Code Examples

### moon.yml Configuration
```yaml
# Root moon.yml
workspace:
  # Inherit all TypeScript config
  typescript:
    root: tsconfig.json
  
  # Inherit all ESLint config
  eslint:
    root: .eslintrc.js

  # Node package manager
  node:
    packageManager: bun
    version: "1.3.0"

  # VCS provider for change detection
  vcs:
    provider: git

# Define workspace projects
projects:
  globs:
    - "apps/*"
    - "packages/*"
    - "tools/*"

# Define custom tasks
tasks:
  typecheck:
    command: tsc --noEmit
    inputs:
      - "src/**/*.ts"
      - "tsconfig.json"
    outputs:
      - ".typecheck"
    cache: true

  lint:
    command: eslint .
    inputs:
      - "src/**/*.ts"
      - ".eslintrc.js"

  test:
    command: bun test
    inputs:
      - "src/**/*.test.ts"
    outputs:
      - "coverage"
    cache: true

  build:
    command: bun build ./src/index.ts
    inputs:
      - "src/**/*.ts"
    outputs:
      - "dist"
    cache: true
    deps:
      - "typecheck"
```

### Project-Level moon.yml
```yaml
# apps/web/moon.yml
project:
  name: web
  type: application
  language: typescript
  framework: react

# Tasks specific to this project
tasks:
  dev:
    command: next dev --port 3000
    local: true

  build:
    command: next build
    inputs:
      - "src/**/*.{ts,tsx}"
      - "public/**/*"
      - "next.config.js"
    outputs:
      - ".next"
      - "dist"
    cache: true

  test:
    command: jest
    inputs:
      - "src/**/*.test.{ts,tsx}"
    outputs:
      - "coverage"
    cache: true

# Task dependencies
  lint:
    extends: root/lint

  typecheck:
    extends: root/typecheck

# Project dependencies
dependencies:
  - id: ui
    scope: peer

  - id: api
    scope: dev

  - id: shared
    scope: dev
```

### Package-Level moon.yml
```yaml
# packages/ui/moon.yml
project:
  name: ui
  type: library
  language: typescript
  framework: react

tasks:
  build:
    command: tsc --declaration
    inputs:
      - "src/**/*.tsx"
      - "tsconfig.json"
    outputs:
      - "dist"
    cache: true

  test:
    command: jest
    inputs:
      - "src/**/*.test.tsx"
    outputs:
      - "coverage"
    cache: true

  storybook:
    command: storybook dev
    local: true
```

### Moonfile.ts (Advanced Configuration)
```typescript
// moonfile.ts
import { defineWorkspace } from "@moonrepo/core";

export default defineWorkspace({
  projects: {
    globs: ["apps/*", "packages/*"],
  },

  tasks: {
    build: {
      command: "bun build",
      inputs: ["src/**/*.ts"],
      outputs: ["dist"],
      cache: true,
    },

    test: {
      command: "bun test",
      inputs: ["src/**/*.test.ts"],
      cache: true,
    },

    // Conditional task execution
    "release-check": {
      command: "bun release-check",
      platform: ["linux", "macos"],
      // Only run if files changed
      inputs: ["src/**/*", "package.json"],
    },
  },

  // Task inheritance
  extends: ["@moonrepo/base"],
});
```

### CLI Commands
```bash
# Run task in specific project
moon run web:build

# Run task across all projects
moon run :build

# Run with affected detection
moon run :build --affected

# Only projects that changed since base branch
moon run :test --since origin/main

# Dry run to see execution plan
moon run :build --dry-run

# Focus on specific project
moon run --focus web web:build api:build

# Watch mode
moon run :build --watch

# Check which projects would be affected
moon affected --base main --head HEAD

# Graph visualization
moon graph web:build

# Run in CI mode
moon ci build test

# Continue on error
moon run :build --continue

# Silent output
moon run :build --quiet

# Output in JSON
moon run :build --json
```

### CI Integration
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: moonrepo/setup-toolchain@v0

      - name: Install dependencies
        run: moon install

      - name: Check affected projects
        run: moon affected --base main --head HEAD

      - name: Type check
        run: moon run :typecheck --affected

      - name: Lint
        run: moon run :lint --affected

      - name: Test
        run: moon run :test --affected

      - name: Build
        run: moon run :build --affected

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Cache Configuration
```yaml
# moon.yml
workspace:
  # Local cache
  cache:
    type: local
    dir: .moon/cache

  # Remote cache (optional)
  # cache:
  #   type: http
  #   host: https://cache.example.com
  #   token: $CACHE_TOKEN

tasks:
  build:
    # This task is cacheable
    cache: true
    # But exclude certain inputs from cache key
    cacheableOutputs:
      - dist
      - "!dist/tmp"

  deploy:
    # Don't cache this task
    cache: false
    local: true
```

### Project Dependency Graph
```bash
# View dependency graph
moon graph :build

# Output includes:
# - build (root)
#   ├── web:build
#   │   ├── ui:build
#   │   │   └── shared:build
#   │   └── api:build
#   │       └── shared:build
#   ├── docs:build
#   │   └── shared:build
#   └── cli:build
#       └── shared:build
```

### Scripting with moon.yml
```yaml
# moon.yml
tasks:
  "prepare-release":
    command: |
      set -e
      moon run :typecheck
      moon run :lint
      moon run :test
      moon run :build
      bun scripts/update-versions.ts
      git add .
      git commit -m "chore: prepare release"

  "deploy-staging":
    command: |
      ENVIRONMENT=staging bun scripts/deploy.ts
    env:
      AWS_REGION: us-east-1

  "db-migrate":
    command: |
      cd apps/api
      bun migrate
    platform: [linux, macos]
```

### Workspace Structure with moon
```
.
├── moon.yml                    # Workspace config
├── moonfile.ts                 # Advanced config (optional)
├── apps/
│   ├── web/
│   │   ├── moon.yml
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── api/
│   │   ├── moon.yml
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   └── cli/
│       ├── moon.yml
│       └── package.json
├── packages/
│   ├── ui/
│   │   ├── moon.yml
│   │   └── package.json
│   ├── shared/
│   │   ├── moon.yml
│   │   └── package.json
│   └── api-client/
│       ├── moon.yml
│       └── package.json
├── tools/
│   └── scripts/
│       ├── moon.yml
│       └── package.json
├── .moon/
│   └── cache/               # Auto-generated cache
├── package.json             # Root package.json
└── tsconfig.json            # Root tsconfig.json
```

## Best Practices

### 1. Task Definition
- Keep tasks focused and atomic
- Define clear inputs and outputs
- Use caching for deterministic tasks
- Avoid side effects in cached tasks

### 2. Dependency Management
- Keep dependency graph clean
- Use dependency scopes (peer, dev, prod)
- Avoid circular dependencies
- Document inter-project dependencies

### 3. Performance
- Use `--affected` in CI to run only changed projects
- Leverage remote caching for CI/CD
- Keep tasks incremental when possible
- Use task dependencies to optimize execution order

### 4. Configuration
- Use workspace-level configuration for common tasks
- Override in project-level config when needed
- Keep Configuration DRY
- Version control all configuration

### 5. CI/CD Integration
- Detect affected projects early
- Run checks in parallel
- Cache dependencies and build outputs
- Fail fast on important checks

## Common Patterns

### Multi-Package Build Pipeline
```yaml
# Root moon.yml
tasks:
  ci:
    command: |
      moon run :typecheck --affected
      moon run :lint --affected
      moon run :test --affected
      moon run :build
    desc: Full CI pipeline

  # Pre-release checks
  "pre-release":
    command: |
      moon run :typecheck
      moon run :lint
      moon run :test
      moon run :build
      bun validate-versions.ts
    desc: Pre-release validation
```

### Workspace Script
```bash
#!/bin/bash
# scripts/run-affected.sh
AFFECTED=$(moon affected --base $1 --head $2 --json | jq -r '.projects[]')

for PROJECT in $AFFECTED; do
  echo "Building $PROJECT..."
  moon run $PROJECT:build
done
```

### Versioning Strategy
```yaml
# packages/*/package.json
{
  "name": "@myapp/ui",
  "version": "1.0.0",
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

### Monorepo Release Flow
```bash
# 1. Detect changes
moon affected --base main --head HEAD

# 2. Build affected
moon run :build --affected

# 3. Test affected
moon run :test --affected

# 4. Version and publish
bun bump-versions.ts
moon run :publish
```
