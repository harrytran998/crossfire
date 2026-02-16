import type { Effect } from 'effect'

export type AppRunner = <A, E, R>(effect: Effect.Effect<A, E, R>) => Promise<A>

export type RouteHandler = (
  req: Request,
  context: {
    params: Record<string, string>
    runApp: AppRunner
  }
) => Promise<Response>

export type RouteDefinition = {
  method: string
  path: string
  handler: RouteHandler
}

type ParamChild = {
  name: string
  node: RouteNode
}

class RouteNode {
  staticChildren = new Map<string, RouteNode>()
  paramChild: ParamChild | null = null
  handlers = new Map<string, RouteHandler>()
}

const normalizePath = (path: string): string => {
  if (path.length === 0) {
    return '/'
  }

  if (path === '/') {
    return '/'
  }

  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const toSegments = (path: string): string[] => {
  const normalized = normalizePath(path)
  if (normalized === '/') {
    return []
  }

  return normalized.slice(1).split('/')
}

export type MatchResult =
  | {
      kind: 'found'
      handler: RouteHandler
      params: Record<string, string>
    }
  | {
      kind: 'method_not_allowed'
      allow: string[]
    }
  | {
      kind: 'not_found'
    }

export class RadixRouter {
  private readonly root = new RouteNode()

  add(route: RouteDefinition): void {
    const method = route.method.toUpperCase()
    const segments = toSegments(route.path)

    let node = this.root
    for (const segment of segments) {
      if (segment.startsWith(':')) {
        const name = segment.slice(1)
        if (name.length === 0) {
          throw new Error(`Invalid route segment in path: ${route.path}`)
        }

        if (node.paramChild && node.paramChild.name !== name) {
          throw new Error(`Conflicting param name in route path: ${route.path}`)
        }

        if (!node.paramChild) {
          node.paramChild = {
            name,
            node: new RouteNode(),
          }
        }

        node = node.paramChild.node
        continue
      }

      const existing = node.staticChildren.get(segment)
      if (existing) {
        node = existing
        continue
      }

      const next = new RouteNode()
      node.staticChildren.set(segment, next)
      node = next
    }

    node.handlers.set(method, route.handler)
  }

  addMany(routes: readonly RouteDefinition[]): void {
    for (const route of routes) {
      this.add(route)
    }
  }

  match(method: string, path: string): MatchResult {
    const normalizedMethod = method.toUpperCase()
    const segments = toSegments(path)

    let node = this.root
    const params: Record<string, string> = {}

    for (const segment of segments) {
      const staticNode = node.staticChildren.get(segment)
      if (staticNode) {
        node = staticNode
        continue
      }

      if (node.paramChild) {
        params[node.paramChild.name] = segment
        node = node.paramChild.node
        continue
      }

      return { kind: 'not_found' }
    }

    const exact = node.handlers.get(normalizedMethod)
    if (exact) {
      return {
        kind: 'found',
        handler: exact,
        params,
      }
    }

    if (node.handlers.size > 0) {
      return {
        kind: 'method_not_allowed',
        allow: Array.from(node.handlers.keys()).sort(),
      }
    }

    return { kind: 'not_found' }
  }
}
