---
name: Kysely
description: Kysely query builder for type-safe SQL database operations
---

## Overview

Kysely is a type-safe SQL query builder for TypeScript. It provides compile-time type safety for SQL queries, automatic type inference, and support for multiple database engines while maintaining a familiar fluent API.

## Key Concepts

### Type-Safe Query Building
- Compile-time SQL validation
- Automatic type inference from database schema
- Type-safe query parameters
- Type-safe result mapping

### Database Schema
Define your schema as TypeScript interfaces that map to tables and columns.

### Fluent API
Chain methods to build queries in a readable, composable way.

### Database Agnostic
Support for multiple databases: PostgreSQL, MySQL, SQLite, etc.

## Code Examples

### Database Configuration
```typescript
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

interface UserTable {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

interface PostTable {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface Database {
  users: UserTable;
  posts: PostTable;
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});
```

### Select Queries
```typescript
// Simple select
const users = await db
  .selectFrom("users")
  .select(["id", "name", "email"])
  .execute();

// With where clause
const user = await db
  .selectFrom("users")
  .selectAll()
  .where("id", "=", 1)
  .executeTakeFirst();

// Multiple conditions
const activeUsers = await db
  .selectFrom("users")
  .select(["id", "name"])
  .where((qb) =>
    qb
      .where("email", "like", "%@example.com")
      .and("createdAt", ">", new Date("2024-01-01"))
  )
  .execute();

// With ordering and limit
const recent = await db
  .selectFrom("users")
  .selectAll()
  .orderBy("createdAt", "desc")
  .limit(10)
  .execute();
```

### Joins
```typescript
// Inner join
const userPosts = await db
  .selectFrom("users")
  .innerJoin("posts", "posts.userId", "users.id")
  .select(["users.id", "users.name", "posts.title"])
  .execute();

// Left join with type safety
const allUsers = await db
  .selectFrom("users")
  .leftJoin("posts", "posts.userId", "users.id")
  .select((qb) => [
    "users.id",
    "users.name",
    qb.fn.count("posts.id").as("postCount"),
  ])
  .groupBy("users.id")
  .execute();
```

### Insert Operations
```typescript
// Single insert
const newUser = await db
  .insertInto("users")
  .values({
    name: "Alice",
    email: "alice@example.com",
    createdAt: new Date(),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Multiple inserts
const users = await db
  .insertInto("users")
  .values([
    { name: "Bob", email: "bob@example.com", createdAt: new Date() },
    { name: "Charlie", email: "charlie@example.com", createdAt: new Date() },
  ])
  .returningAll()
  .execute();

// Insert with returning specific columns
const result = await db
  .insertInto("posts")
  .values({
    userId: 1,
    title: "My First Post",
    content: "Hello, World!",
    createdAt: new Date(),
  })
  .returning(["id", "title"])
  .executeTakeFirst();
```

### Update Operations
```typescript
// Update single record
const updated = await db
  .updateTable("users")
  .set({ name: "Alice Updated" })
  .where("id", "=", 1)
  .returningAll()
  .executeTakeFirst();

// Update with expression
const affected = await db
  .updateTable("users")
  .set((qb) => ({
    email: qb.fn("lower", ["email"]),
  }))
  .where("id", "=", 1)
  .execute();

// Conditional update
const result = await db
  .updateTable("posts")
  .set({
    title: "Updated Title",
  })
  .where((qb) =>
    qb
      .where("userId", "=", 1)
      .and("createdAt", ">", new Date("2024-01-01"))
  )
  .executeTakeFirst();
```

### Delete Operations
```typescript
// Delete with where
const deleted = await db
  .deleteFrom("users")
  .where("id", "=", 1)
  .executeTakeFirst();

// Delete multiple records
const result = await db
  .deleteFrom("posts")
  .where("userId", "=", 1)
  .executeTakeFirst();
```

### Aggregations
```typescript
// Count
const count = await db
  .selectFrom("users")
  .select(db.fn.count<number>("id").as("total"))
  .executeTakeFirst();

// Group by with aggregate functions
const userStats = await db
  .selectFrom("posts")
  .select((qb) => [
    "userId",
    qb.fn.count<number>("id").as("postCount"),
    qb.fn.max("createdAt").as("lastPost"),
  ])
  .groupBy("userId")
  .execute();

// Having clause
const activeUsers = await db
  .selectFrom("posts")
  .select(["userId", db.fn.count<number>("id").as("count")])
  .groupBy("userId")
  .having((qb) => qb.fn.count("id"), ">", 5)
  .execute();
```

### Transactions
```typescript
const result = await db.transaction().execute(async (trx) => {
  const user = await trx
    .insertInto("users")
    .values({
      name: "Alice",
      email: "alice@example.com",
      createdAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const post = await trx
    .insertInto("posts")
    .values({
      userId: user.id,
      title: "First Post",
      content: "Hello!",
      createdAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { user, post };
});
```

### Raw SQL
```typescript
// When you need raw SQL
const result = await db
  .selectFrom("users")
  .select(["id", "name"])
  .where(
    "email",
    "in",
    db.raw<string[]>(`(?)`, [
      ["alice@example.com", "bob@example.com"],
    ])
  )
  .execute();

// Raw query with sql template
import { sql } from "kysely";

const users = await sql<UserTable>`
  SELECT * FROM users WHERE id = ${1}
`.execute(db);
```

## Best Practices

### 1. Schema Definition
- Keep schema interfaces in a separate file
- Use strict types (avoid `any`)
- Use proper nullable types for optional columns

### 2. Query Composition
- Extract common query fragments into reusable functions
- Use `where` callbacks for complex conditions
- Build queries progressively for readability

### 3. Type Safety
- Leverage TypeScript strict mode
- Let Kysely infer types when possible
- Use `executeTakeFirst()` vs `execute()` appropriately

### 4. Performance
- Use projections (select specific columns)
- Index frequently queried columns
- Use `limit()` for large result sets
- Consider pagination for APIs

### 5. Error Handling
- Use `executeTakeFirstOrThrow()` when record must exist
- Handle transaction rollbacks
- Validate user input before queries

## Common Patterns

### Repository Pattern
```typescript
export class UserRepository {
  constructor(private db: Kysely<Database>) {}

  async findById(id: number) {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async findByEmail(email: string) {
    return this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  }

  async create(data: Omit<UserTable, "id" | "createdAt">) {
    return this.db
      .insertInto("users")
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, data: Partial<Omit<UserTable, "id">>) {
    return this.db
      .updateTable("users")
      .set(data)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number) {
    return this.db
      .deleteFrom("users")
      .where("id", "=", id)
      .executeTakeFirst();
  }
}
```

### Query Builder Helper
```typescript
export class QueryBuilder {
  static pagination<T>(
    query: Selectable<T>,
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }

  static search<T extends keyof Database>(
    table: T,
    searchTerm: string,
    fields: string[]
  ) {
    return db.selectFrom(table).where((qb) =>
      qb.orWhere(
        ...fields.map((field) =>
          db.raw(`${field} ILIKE ?`, [`%${searchTerm}%`])
        )
      )
    );
  }
}
```

### Soft Delete Pattern
```typescript
interface BaseTable {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const selectActive = <T extends BaseTable>(query: SelectQueryBuilder<any, any>) =>
  query.where("deletedAt", "is", null);

// Usage
const users = await selectActive(
  db.selectFrom("users").selectAll()
).execute();
```
