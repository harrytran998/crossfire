---
description: Database migration helper for schema changes and data updates
argument-hint: '[migration-name]'
---

# DB Migrate Command

## Usage

```
claude db-migrate [migration-name]
claude db-migrate --status
claude db-migrate --rollback
```

Assists with database migrations using Kysely and PostgreSQL.

## Steps

1. **Check Current State** - Verify database connection and current schema
2. **Analyze Changes** - Compare desired schema against current state
3. **Generate Migration** - Create migration file with:
   - Table creation/modification
   - Index changes
   - Constraint updates
   - Data transformations
4. **Review Safety** - Check for:
   - Data loss risks
   - Reversibility
   - Performance impact
   - Foreign key constraints
5. **Generate Type Updates** - Create TypeScript types from new schema
6. **Apply Migration** - Run against database:
   - Test on staging first
   - Capture before/after state
   - Verify constraints
7. **Update Kysely Schema** - Sync TypeScript definitions
8. **Document Changes** - Create changelog entry

## Options

- `--status` - Show current migration status
- `--rollback` - Revert last migration
- `--dry-run` - Show SQL without executing
- `--force` - Skip safety checks
- `--down` - Generate down migration
- `--seed` - Include data seeding
- `--generate-types` - Update TypeScript schema types

## Examples

```bash
# Create named migration
claude db-migrate "add_user_roles"

# Check migration status
claude db-migrate --status

# Dry run to review SQL
claude db-migrate "add_audit_logs" --dry-run

# Rollback last migration
claude db-migrate --rollback

# Create migration with down script
claude db-migrate "update_user_schema" --down --generate-types

# Seed migration
claude db-migrate "initial_seed" --seed
```

## Tech Stack Integration

- **PostgreSQL** - Target database
- **Kysely** - Type-safe query builder and migrations
- **TypeScript** - Type generation from schema
- **Bun** - Migration runner

## Safety Practices

1. Always backup before production
2. Test migrations on staging
3. Include rollback steps
4. Document schema changes
5. Update TypeScript types
6. Verify constraints post-migration
