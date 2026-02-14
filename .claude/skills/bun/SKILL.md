---
name: Bun
description: Bun runtime (1.3.x) modern JavaScript/TypeScript runtime and toolkit
---

## Overview

Bun is an all-in-one JavaScript runtime designed as a faster alternative to Node.js. It includes a bundler, transpiler, package manager, and test runner built-in, with native TypeScript support and improved performance.

## Key Concepts

### Fast Runtime

- Written in Zig, significantly faster than Node.js
- Native TypeScript support without compilation step
- JSX support out of the box
- CommonJS and ES modules interoperability

### Integrated Tooling

- Built-in package manager (`bun install`)
- Bundler and minifier
- File watcher for development
- Test runner with Jest-compatible API

### API Compatibility

- Mostly compatible with Node.js APIs
- Web standard APIs (fetch, WebSocket, etc.)
- Extensions for performance-critical operations

## Code Examples

### Package Management

```typescript
// Install packages
// $ bun add lodash @types/lodash

// bunfig.toml configuration
;[install]
registry = 'https://registry.npmjs.org/'

// Using for CLI tools
// $ migrate deploy
```

### Server Creation

```typescript
import { serve } from 'bun'

serve({
  port: 3000,
  hostname: '0.0.0.0',
  fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/') {
      return new Response('Hello from Bun!', { status: 200 })
    }

    if (url.pathname === '/api/data') {
      return Response.json({ message: 'JSON response' })
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log('Server running on http://0.0.0.0:3000')
```

### File Operations

```typescript
// Reading files
const content = await Bun.file('package.json').text()

// Writing files
await Bun.write('output.txt', 'Hello, Bun!')

// Streaming
const file = Bun.file('large-file.bin')
const stream = file.stream()

// Fast digest computation
const buffer = await Bun.file('data.bin').arrayBuffer()
const hash = await Bun.hash(buffer)
```

### TypeScript Support

```typescript
// .ts files work directly without compilation
export interface User {
  id: number;
  name: string;
  email: string;
}

export async function getUser(id: number): Promise<User> {
  const response = await fetch(`https://api.example.com/users/${id}`);
  return response.json();
}

// JSX support (requires .tsx extension)
export const Component = () => {
  return <div>Hello, JSX!</div>;
};
```

### Process & Subprocess

```typescript
import { $ } from 'bun'

// Using the $ syntax (Bun's shell DSL)
const result = await $`echo "Hello from Bun"`
console.log(result.stdout.toString())

// Run a command
const process = Bun.spawn(['ls', '-la'], {
  stdout: 'inherit',
  stderr: 'inherit',
})

const exitCode = await process.exited
console.log('Exit code:', exitCode)
```

### Testing

```typescript
import { describe, it, expect } from 'bun:test'

describe('Calculator', () => {
  it('should add two numbers', () => {
    const result = 2 + 2
    expect(result).toBe(4)
  })

  it('should handle negative numbers', () => {
    const result = -5 + 3
    expect(result).toBe(-2)
  })
})

// Run tests: bun test
```

### Database Operations

```typescript
import { Database } from 'bun:sqlite'

const db = new Database('./data.sqlite', { create: true })

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
  )
`)

// Insert
db.run('INSERT INTO users (name, email) VALUES (?, ?)', ['Alice', 'alice@example.com'])

// Query
const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
const user = stmt.get(1)
console.log(user)

// Close
db.close()
```

### WebSocket Server

```typescript
import { serve } from 'bun'

serve({
  port: 3000,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response('Upgrade failed', { status: 500 })
  },
  websocket: {
    open(ws) {
      console.log('Client connected')
      ws.send('Welcome to Bun!')
    },
    message(ws, message) {
      console.log('Message:', message)
      ws.send(`Echo: ${message}`)
    },
    close(ws) {
      console.log('Client disconnected')
    },
  },
})
```

### Environment Variables

```typescript
// .env file
DATABASE_URL=postgresql://user:password@localhost/dbname
API_KEY=secret123

// Access in code
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

// Bun automatically loads .env on startup
console.log(Bun.env);
```

## Best Practices

### 1. Installation

- Use `bun install` instead of npm/yarn for faster dependency resolution
- Use `bun add` to add new packages
- Use `bun pm cache` to manage cache if needed

### 2. Development

- Use `bun --watch` for development with file watching
- Use `bun run` to execute scripts defined in package.json
- Leverage TypeScript directly without build step

### 3. Performance

- Use Bun's native APIs when available (faster than Node.js equivalents)
- Use `Bun.file()` for efficient file operations
- Leverage `$` syntax for shell commands
- Use built-in database support via SQLite

### 4. Testing

- Use `bun:test` for unit tests
- Run with `bun test` for parallel test execution
- Use familiar Jest-compatible assertions

### 5. Deployment

- Bundle code with `bun build`
- Use `bun run` with custom scripts
- Consider Bun's performance benefits in production

## Common Patterns

### HTTP Server with Routing

```typescript
import { serve } from 'bun'

interface Route {
  method: string
  path: string | RegExp
  handler: (req: Request) => Response | Promise<Response>
}

const routes: Route[] = [
  {
    method: 'GET',
    path: '/',
    handler: () => new Response('Home'),
  },
  {
    method: 'POST',
    path: /^\/api\/users\/(\d+)$/,
    handler: async (req) => {
      const body = await req.json()
      return Response.json({ received: body })
    },
  },
]

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    for (const route of routes) {
      if (req.method !== route.method) continue
      if (typeof route.path === 'string') {
        if (url.pathname === route.path) {
          return route.handler(req)
        }
      } else if (route.path.test(url.pathname)) {
        return route.handler(req)
      }
    }
    return new Response('Not Found', { status: 404 })
  },
})
```

### Middleware Pattern

```typescript
type Handler = (req: Request) => Response | Promise<Response>
type Middleware = (handler: Handler) => Handler

const cors: Middleware = (handler) => (req) => {
  const res = handler instanceof Promise ? await handler(req) : handler(req)
  res.headers.set('Access-Control-Allow-Origin', '*')
  return res
}

const authenticated: Middleware = (handler) => (req) => {
  const token = req.headers.get('Authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  return handler(req)
}
```

### CLI Tool

```typescript
// scripts/cli.ts
import { parseArgs } from 'bun'

const args = parseArgs(process.argv)

if (args.help) {
  console.log('Usage: bun run cli.ts [options]')
  process.exit(0)
}

const command = args._?.[0]
switch (command) {
  case 'greet':
    console.log(`Hello, ${args.name || 'World'}!`)
    break
  default:
    console.log('Unknown command')
}
```

### Task Runner

```typescript
// scripts/build.ts
import { $, write } from 'bun'

const build = async () => {
  console.log('🔨 Building...')
  await $`bun run typecheck`
  await $`bun run lint`
  await $`bun build ./src/index.ts --outdir ./dist`
  console.log('✅ Build complete')
}

await build()
```
