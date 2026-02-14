---
name: Oxlint
description: Oxlint configuration for JavaScript/TypeScript static analysis
---

## Overview

Oxlint is a fast, zero-config JavaScript/TypeScript linter written in Rust. It provides ESLint compatibility while being significantly faster and with sensible defaults that work out of the box.

## Key Concepts

### Speed
- Written in Rust for performance
- Analyzes entire codebase in milliseconds
- Suitable for large codebases

### ESLint Compatibility
- Supports ESLint configuration files
- Compatible with many ESLint plugins
- Easy migration from ESLint

### Built-in Rules
- JavaScript best practices
- TypeScript type safety
- React/JSX conventions
- Tree-shaking warnings

### Zero-Config Philosophy
- Works with sensible defaults
- Minimal configuration needed
- Optional customization available

## Code Examples

### Installation and Basic Usage
```bash
# Install oxlint
npm install --save-dev oxlint

# Run oxlint on current directory
npx oxlint

# Run on specific directory
npx oxlint src/

# Fix issues automatically
npx oxlint --fix

# Output in JSON format
npx oxlint --format json

# Show specific rule
npx oxlint --rule=no-unused-vars
```

### Basic oxlintrc.json Configuration
```json
{
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "no-empty": "error",
    "no-duplicate-case": "error",
    "prefer-const": "warn"
  },
  "settings": {
    "jsx-a11y": {
      "components": {
        "Link": "a"
      }
    }
  }
}
```

### TOML Configuration (.oxlintrc.toml)
```toml
[rules]
# JavaScript/TypeScript
no_unused_vars = "warn"
no_console = "off"
no_empty = "error"
no_duplicate_case = "error"
prefer_const = "warn"
no_undef = "error"

# React-specific
react_no_unescaped_entities = "warn"
react_display_name = "off"
react_prop_types = "off"

# Typescript-specific
typescript_no_unused_vars = "warn"

[settings]
# React settings
react_version = "18"

# JSX A11y settings
[settings.jsx_a11y]
components = { Link = "a" }

# Import settings
[settings.import]
extensions = [".ts", ".tsx", ".js", ".jsx"]

# Environment
[env]
browser = true
node = true
es2020 = true
```

### Configuration with Overrides
```json
{
  "rules": {
    "no-console": "error",
    "no-unused-vars": "warn"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts"],
      "rules": {
        "no-console": "off"
      }
    },
    {
      "files": ["src/generated/**"],
      "rules": {
        "no-unused-vars": "off",
        "no-undef": "off"
      }
    }
  ]
}
```

### Ignoring Files
```
# .oxlintignore
node_modules/
dist/
build/
coverage/
*.min.js

# Generated files
src/generated/
src/types/generated.ts

# Temporary
tmp/
temp/
```

### Recommended Rule Sets
```json
{
  "extends": ["oxlint/recommended"],
  "rules": {
    // Override specific rules
    "no-console": "off",
    "no-unused-vars": "warn"
  }
}
```

### Package.json Integration
```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "lint:json": "oxlint --format json > lint-report.json",
    "lint:check": "oxlint --exit-with-status-code",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  },
  "devDependencies": {
    "oxlint": "^0.1.0"
  }
}
```

### Rule Categories and Examples

#### Best Practices Rules
```json
{
  "rules": {
    "no-array-callback-reference": "warn",
    "no-array-method-this-binding": "warn",
    "no-comparing-to-nan": "error",
    "no-constant-condition": "warn",
    "no-debugger": "error",
    "no-delete-var": "error",
    "no-dupe-args": "error",
    "no-dupe-else-if": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-duplicate-imports": "warn",
    "no-empty": "warn",
    "no-enum-compare": "error",
    "no-eval": "error",
    "no-ex-assign": "error",
    "no-extend-native": "error",
    "no-extra-label": "warn",
    "no-fallthrough": "warn",
    "no-func-assign": "error",
    "no-global-assign": "error",
    "no-import-assign": "error",
    "no-inner-declarations": "warn",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-iterator": "error",
    "no-label-var": "error",
    "no-labels": "warn",
    "no-lone-blocks": "warn",
    "no-loss-of-precision": "error",
    "no-misleading-character-class": "error",
    "no-mixed-operators": "warn",
    "no-multi-str": "warn",
    "no-nested-ternary": "warn",
    "no-new-symbol": "error",
    "no-nonoctal-decimal-escape": "error",
    "no-obj-calls": "error",
    "no-octal": "error",
    "no-octal-escape": "error",
    "no-regex-spaces": "warn",
    "no-restricted-globals": "off",
    "no-self-assign": "warn",
    "no-setter-return": "error",
    "no-shadow": "off",
    "no-shadow-restricted-names": "error",
    "no-sparse-arrays": "warn",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "no-unsafe-optional-chaining": "warn",
    "no-unused-labels": "warn",
    "no-unused-vars": "warn",
    "no-useless-catch": "warn",
    "no-useless-escape": "warn",
    "no-with": "error",
    "use-isnan": "error",
    "use-valid-typeof": "error"
  }
}
```

#### TypeScript-Specific Rules
```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-unnecessary-type-constraint": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false
      }
    ]
  }
}
```

#### React-Specific Rules
```json
{
  "rules": {
    "react/display-name": "off",
    "react/jsx-no-comment-textnodes": "warn",
    "react/jsx-no-duplicate-props": "warn",
    "react/jsx-no-target-blank": "warn",
    "react/jsx-no-undef": "error",
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "react/no-array-index-key": "warn",
    "react/no-children-prop": "warn",
    "react/no-danger-with-children": "error",
    "react/no-dangerously-set-inner-html": "warn",
    "react/no-deprecated": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-find-dom-node": "error",
    "react/no-render-return-value": "error",
    "react/no-string-refs": "warn",
    "react/no-unescaped-entities": "warn",
    "react/no-unescaped-html": "warn",
    "react/require-render-return": "error"
  }
}
```

### Integration with CI/CD
```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run oxlint
        run: bun lint

      - name: Check lint results
        if: failure()
        run: echo "Lint failed"
```

### Pre-commit Hook Integration
```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Linting..."
oxlint --max-warnings 0

if [ $? != 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

echo "✅ Linting passed"
```

### VS Code Integration
```json
// .vscode/settings.json
{
  "[typescript]": {
    "editor.defaultFormatter": "oxlint.vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.oxlint": true
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "oxlint.vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.oxlint": true
    }
  }
}
```

## Best Practices

### 1. Configuration
- Start with recommended configuration
- Gradually customize rules per project needs
- Keep configuration version controlled
- Document why rules are overridden

### 2. Rule Severity
- Use "error" for critical issues
- Use "warn" for important but not blocking
- Use "off" for rules that don't apply
- Consider team consensus on severity

### 3. Performance
- Run linting in CI on every commit
- Use `--fix` for automatic corrections
- Ignore generated files (node_modules, dist, etc.)
- Run locally before pushing

### 4. Integration
- Add to pre-commit hooks for early feedback
- Integrate with editor for real-time feedback
- Use in CI for final validation
- Generate reports for code quality metrics

### 5. Maintenance
- Review and update rules periodically
- Stay updated with Oxlint releases
- Consider project maturity and team size
- Balance strictness with productivity

## Common Patterns

### Monorepo Configuration
```json
// Root oxlintrc.json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn"
  },
  "overrides": [
    {
      "files": ["packages/*/src/**"],
      "rules": {
        "no-console": "error"
      }
    },
    {
      "files": ["apps/*/src/**"],
      "rules": {
        "no-console": "off"
      }
    },
    {
      "files": ["**/*.test.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

### Strict Type Checking
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/explicit-function-return-types": "warn",
    "no-console": "error"
  }
}
```

### Production-Ready Config
```toml
# .oxlintrc.toml
[rules]
# Critical errors
no_undef = "error"
no_eval = "error"
no_debugger = "error"
no_fallthrough = "error"

# Important warnings
no_unused_vars = "warn"
no_duplicate_imports = "warn"
prefer_const = "warn"
no_console = "warn"

# Off for now
no_empty = "off"
react_prop_types = "off"
```
