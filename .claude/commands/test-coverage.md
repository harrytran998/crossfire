---
description: Generate test coverage report and identify untested code
argument-hint: "[package-or-file]"
---

# Test Coverage Command

## Usage

```
claude test-coverage
claude test-coverage [package-name]
claude test-coverage --threshold 80
```

Generates coverage reports and identifies coverage gaps.

## Steps

1. **Run Tests** - Execute all tests with coverage collection:
   - Bun test with coverage instrumentation
   - Collect coverage metrics
   - Generate coverage data
2. **Analyze Coverage** - Process coverage report:
   - Line coverage percentage
   - Branch coverage percentage
   - Function coverage percentage
   - Uncovered lines identification
3. **Identify Gaps** - Find critical untested code:
   - Error handling paths
   - Complex business logic
   - API handlers
   - Database operations
4. **Generate Report** - Create detailed coverage report:
   - Overall statistics
   - Per-package breakdown
   - Uncovered lines with context
   - Critical gaps
   - Trend analysis
5. **Highlight Hot Spots** - Priority coverage improvements:
   - High complexity, low coverage
   - Critical paths untested
   - External APIs untested
6. **Compare Against Baseline** - Track coverage trend:
   - Previous run comparison
   - Regression detection
   - Improvement tracking
7. **Suggest Tests** - Provide test recommendations:
   - Missing test cases
   - Edge cases to cover
   - Integration tests needed

## Options

- `--threshold` - Minimum coverage percentage (fail if below)
- `--detailed` - Show file-by-file breakdown
- `--html` - Generate HTML report
- `--json` - Export as JSON
- `--compare` - Compare with baseline or previous run
- `--watch` - Re-run on file changes
- `--focus` - Analyze specific files or packages

## Examples

```bash
# Full coverage report
claude test-coverage

# Coverage for specific package
claude test-coverage packages/auth

# Enforce 85% coverage
claude test-coverage --threshold 85

# HTML report with comparison
claude test-coverage --html --compare ./coverage-baseline.json

# Watch mode with detailed output
claude test-coverage --watch --detailed --focus src/services

# JSON export for CI
claude test-coverage --json > coverage-report.json
```

## Tech Stack Integration

- **Bun** - Fast test runner with built-in coverage
- **TypeScript** - Source map resolution
- **Effect** - Comprehensive error handling coverage
- **Kysely** - Database operation coverage

## Coverage Goals by Package Type

- **Services** - 85%+ (critical business logic)
- **API Routes** - 80%+ (handler coverage)
- **Database** - 90%+ (query coverage)
- **Utilities** - 75%+ (helper functions)
- **Components** - 70%+ (UI rendering)

## Improving Coverage

1. Identify uncovered branches
2. Add edge case tests
3. Test error scenarios
4. Cover async operations
5. Test external service integrations
