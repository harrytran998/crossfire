---
description: Run comprehensive security audit and vulnerability scan
argument-hint: '[scope]'
---

# Security Scan Command

## Usage

```
claude security-scan
claude security-scan [package-name]
claude security-scan --deep
```

Executes security audit covering dependencies, code patterns, and configuration.

## Steps

1. **Dependency Scan** - Check npm/package.json for known vulnerabilities
2. **Code Pattern Analysis** - Detect insecure patterns:
   - SQL injection risks in database queries
   - XSS vulnerabilities in output
   - CSRF token validation
   - Authentication bypass risks
3. **Environment Audit** - Check for exposed secrets:
   - .env file inspection
   - Hardcoded credentials detection
   - Configuration exposure
4. **Type Security** - Validate type-safe patterns:
   - Unsafe `any` types
   - Missing input validation
   - Effect error handling coverage
5. **Database Security** - Kysely query safety:
   - SQL injection prevention
   - Migration safety
   - Permission boundaries
6. **API Security** - Request/response validation:
   - Input sanitization
   - Rate limiting setup
   - CORS configuration
7. **Generate Report** - Output severity-categorized findings:
   - Critical vulnerabilities
   - High-risk patterns
   - Medium-risk recommendations
   - Low-priority improvements
   - Remediation steps

## Options

- `--deep` - Extended scanning including transitive dependencies
- `--crit-only` - Show only critical/high severity issues
- `--fix` - Attempt auto-fix for known issues
- `--json` - Output in JSON format
- `--compare` - Compare against previous scan
- `--no-update` - Skip dependency check

## Examples

```bash
# Full security scan
claude security-scan

# Scan specific package
claude security-scan @myorg/auth-service

# Deep scan with fix suggestions
claude security-scan --deep --fix

# Critical issues only
claude security-scan --crit-only --json > security-report.json

# Compare against baseline
claude security-scan --deep --compare security-baseline.json
```

## Tech Stack Security Focus

- **TypeScript** - Type safety prevents many vulnerabilities
- **Effect** - Runtime error handling and validation
- **PostgreSQL** - Query parameterization via Kysely
- **Bun** - Built-in permissions system
- **Dependencies** - Known vulnerability database
