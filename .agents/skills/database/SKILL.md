---
name: Database
description: PostgreSQL 18.2 and golang-migrate for database schema management
---

## Overview

Combining PostgreSQL 18.2 (advanced relational database) with golang-migrate (migration tool) provides a robust, version-controlled approach to database schema management. This ensures reproducible database state and supports team collaboration.

## Key Concepts

### PostgreSQL Features

- ACID compliance
- Advanced data types (JSONB, arrays, ranges)
- Window functions and CTEs
- Full-text search capabilities
- Partitioning and indexing strategies

### golang-migrate

- Version control for database schemas
- Up and down migrations
- Database driver agnostic
- CLI tool and Go package support
- Source directory or remote migration support

### Migration Strategy

Track schema changes as discrete, reversible migrations to maintain consistency across environments.

## Code Examples

### Migration File Structure

```bash
migrations/
├── 001_initial_schema.up.sql
├── 001_initial_schema.down.sql
├── 002_add_user_profile.up.sql
├── 002_add_user_profile.down.sql
├── 003_create_posts_table.up.sql
└── 003_create_posts_table.down.sql
```

### Initial Schema Migration

```sql
-- migrations/001_initial_schema.up.sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

```sql
-- migrations/001_initial_schema.down.sql
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
```

### Add User Profile Column

```sql
-- migrations/002_add_user_profile.up.sql
ALTER TABLE users ADD COLUMN profile_data JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512);

CREATE INDEX idx_users_profile ON users USING GIN (profile_data);
```

```sql
-- migrations/002_add_user_profile.down.sql
DROP INDEX IF EXISTS idx_users_profile;
ALTER TABLE users DROP COLUMN avatar_url;
ALTER TABLE users DROP COLUMN bio;
ALTER TABLE users DROP COLUMN profile_data;
```

### Complex Migration with Constraints

```sql
-- migrations/003_add_comments.up.sql
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Add stats table
CREATE TABLE post_stats (
  post_id BIGINT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

```sql
-- migrations/003_add_comments.down.sql
DROP TABLE IF EXISTS post_stats;
DROP TABLE IF EXISTS comments;
```

### Using golang-migrate CLI

```bash
# Install golang-migrate
# macOS
brew install golang-migrate

# Initialize migrations
migrate create -ext sql -dir migrations -seq initial_schema

# Run migrations up
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb up

# Run specific version
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb up 2

# Rollback migrations
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb down

# Rollback one version
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb down 1

# Check current version
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb version

# Force version (use with caution)
migrate -path migrations -database postgresql://user:password@localhost:5432/mydb force 1
```

### Using golang-migrate in Go

```go
package main

import (
  "github.com/golang-migrate/migrate/v4"
  _ "github.com/golang-migrate/migrate/v4/database/postgres"
  _ "github.com/golang-migrate/migrate/v4/source/file"
  "log"
)

func runMigrations() error {
  m, err := migrate.New(
    "file://migrations",
    "postgresql://user:password@localhost:5432/mydb?sslmode=disable",
  )
  if err != nil {
    return err
  }

  if err := m.Up(); err != nil && err != migrate.ErrNoChange {
    return err
  }

  log.Println("Migrations completed successfully")
  return nil
}
```

### PostgreSQL Advanced Features

#### Window Functions

```sql
-- Get rank of posts by likes
SELECT
  id,
  title,
  like_count,
  RANK() OVER (ORDER BY like_count DESC) as rank,
  ROW_NUMBER() OVER (ORDER BY like_count DESC) as row_num
FROM posts;
```

#### Common Table Expressions (CTEs)

```sql
-- Find top users by post count
WITH user_post_count AS (
  SELECT
    user_id,
    COUNT(*) as post_count
  FROM posts
  GROUP BY user_id
)
SELECT
  u.id,
  u.username,
  upc.post_count
FROM users u
JOIN user_post_count upc ON u.id = upc.user_id
ORDER BY upc.post_count DESC
LIMIT 10;
```

#### JSONB Operations

```sql
-- Store complex data in JSONB
UPDATE users
SET profile_data = jsonb_set(
  profile_data,
  '{preferences,theme}',
  '"dark"'
)
WHERE id = 1;

-- Query JSONB
SELECT * FROM users
WHERE profile_data->>'preferences'->>'theme' = 'dark';

-- JSONB array operations
UPDATE users
SET profile_data = jsonb_set(
  profile_data,
  '{tags}',
  profile_data->'tags' || '"newTag"'
)
WHERE id = 1;
```

#### Full-Text Search

```sql
-- Create search vector
ALTER TABLE posts ADD COLUMN search_vector tsvector;

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

CREATE TRIGGER posts_search_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);

-- Search posts
SELECT * FROM posts
WHERE search_vector @@ plainto_tsquery('english', 'database');
```

### Connection Pool Configuration

```typescript
// TypeScript/Node.js example with Kysely
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
})
```

## Best Practices

### 1. Migration Design

- One logical change per migration
- Make migrations reversible when possible
- Use descriptive names for migrations
- Test migrations down and up
- Avoid data loss in down migrations

### 2. Schema Design

- Use appropriate data types (not everything is TEXT)
- Add constraints (NOT NULL, UNIQUE, FOREIGN KEY)
- Include timestamps (created_at, updated_at)
- Index columns used in WHERE clauses
- Use SERIAL or BIGSERIAL for IDs

### 3. Performance

- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE to optimize queries
- Consider partitioning for large tables
- Monitor query performance

### 4. Data Integrity

- Use foreign key constraints
- Add CHECK constraints for valid data
- Use transactions for related changes
- Implement audit trails for sensitive data

### 5. Environment Management

- Different connection strings per environment
- Version controlled migration files
- Document schema changes
- Test migrations on staging before production

## Common Patterns

### Audit Trail Table

```sql
-- Migration file
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by BIGINT REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(changed_at DESC);
```

### Soft Delete Pattern

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_users_deleted_at ON users(deleted_at)
WHERE deleted_at IS NULL;

-- Query active users
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Versioning Table Pattern

```sql
CREATE TABLE post_versions (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT REFERENCES users(id),

  UNIQUE(post_id, version_number)
);
```
