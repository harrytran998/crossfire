# Deployment & Cloud Infrastructure

## Crossfire Web Game - Infrastructure Plan

---

## 1. Overview

This document outlines the deployment strategy and cloud infrastructure for the Crossfire web game, designed for:
- **High Availability**: 99.5%+ uptime
- **Low Latency**: <100ms for regional players
- **Scalability**: Auto-scaling based on player load
- **Cost Efficiency**: Pay-per-use model

---

## 2. Infrastructure Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                              ┌─────────────────┐                                │
│                              │  Cloudflare CDN │                                │
│                              │  (Static Assets)│                                │
│                              └────────┬────────┘                                │
│                                       │                                          │
│                              ┌────────▼────────┐                                │
│                              │  Cloudflare LB  │                                │
│                              │  (DDoS Protect) │                                │
│                              └────────┬────────┘                                │
│                                       │                                          │
│           ┌───────────────────────────┼───────────────────────────┐             │
│           │                           │                           │              │
│           ▼                           ▼                           ▼              │
│   ┌───────────────┐           ┌───────────────┐           ┌───────────────┐    │
│   │   Region US   │           │   Region EU   │           │  Region ASIA  │    │
│   │               │           │               │           │               │    │
│   │ ┌───────────┐ │           │ ┌───────────┐ │           │ ┌───────────┐ │    │
│   │ │ API GW    │ │           │ │ API GW    │ │           │ │ API GW    │ │    │
│   │ └─────┬─────┘ │           │ └─────┬─────┘ │           │ └─────┬─────┘ │    │
│   │       │       │           │       │       │           │       │       │    │
│   │ ┌─────▼─────┐ │           │ ┌─────▼─────┐ │           │ ┌─────▼─────┐ │    │
│   │ │ Game Svr  │ │           │ │ Game Svr  │ │           │ │ Game Svr  │ │    │
│   │ │ Cluster   │ │           │ │ Cluster   │ │           │ │ Cluster   │ │    │
│   │ └─────┬─────┘ │           │ └─────┬─────┘ │           │ └─────┬─────┘ │    │
│   │       │       │           │       │       │           │       │       │    │
│   │ ┌─────▼─────┐ │           │ ┌─────▼─────┐ │           │ ┌─────▼─────┐ │    │
│   │ │PostgreSQL │ │           │ │PostgreSQL │ │           │ │PostgreSQL │ │    │
│   │ │ (Primary) │ │           │ │ (Primary) │ │           │ │ (Primary) │ │    │
│   │ └───────────┘ │           │ └───────────┘ │           │ └───────────┘ │    │
│   │               │           │               │           │               │    │
│   └───────────────┘           └───────────────┘           └───────────────┘    │
│                                                                                   │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │                         SHARED SERVICES                                │    │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │    │
│   │  │   Redis    │  │ Monitoring │  │   Logs     │  │   Secrets  │    │    │
│   │  │  Cluster   │  │ (Prometheus│  │  (Loki)    │  │  Manager   │    │    │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Cloud Provider Options

| Provider | Recommendation | Cost | Notes |
|----------|---------------|------|-------|
| **AWS** | ✅ Primary | $$ | Most features, global regions |
| **GCP** | ✅ Alternative | $$ | Great Kubernetes, gaming solutions |
| **Azure** | ⚠️ Alternative | $$ | Good enterprise integration |
| **Railway/Render** | ⚠️ MVP/Dev | $ | Simple, limited scaling |
| **Fly.io** | ⚠️ Edge-focused | $ | Global edge deployment |

### 3.2 Recommended Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **CDN** | Cloudflare | Static assets, DDoS protection |
| **Load Balancer** | Cloudflare / Cloud LB | SSL termination, routing |
| **Container Orchestration** | Kubernetes (GKE/EKS) | Game server management |
| **Game Server Hosting** | Agones (optional) | Dedicated game server orchestration |
| **Database** | Managed PostgreSQL | Persistent data |
| **Cache** | Managed Redis | Real-time state, sessions |
| **Monitoring** | Prometheus + Grafana | Metrics & alerting |
| **Logging** | Loki + Grafana | Centralized logging |
| **Secrets** | Cloud Secret Manager | API keys, credentials |

---

## 4. Container Configuration

### 4.1 Dockerfile (Bun Server)

```dockerfile
# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY tsconfig.json ./

# Build
WORKDIR /app/packages/server
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Run
CMD ["bun", "run", "dist/index.js"]
```

### 4.2 Dockerfile (Client)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage (nginx)
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4.3 docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: crossfire
      POSTGRES_PASSWORD: crossfire_dev
      POSTGRES_DB: crossfire
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crossfire"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Game Server (Bun)
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://crossfire:crossfire_dev@postgres:5432/crossfire
      - REDIS_URL=redis://redis:6379
      - HOST=0.0.0.0
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/server:/app/packages/server
      - ./packages/shared:/app/packages/shared

  # Client (Vite Dev Server)
  client:
    build:
      context: .
      dockerfile: Dockerfile.client
      target: builder
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./packages/client:/app/packages/client
      - ./packages/shared:/app/packages/shared
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

---

## 5. Kubernetes Configuration

### 5.1 Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: crossfire-game
  labels:
    app: crossfire
```

### 5.2 ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: game-server-config
  namespace: crossfire-game
data:
  NODE_ENV: "production"
  HOST: "0.0.0.0"
  PORT: "3000"
  TICK_RATE: "30"
  MAX_ROOMS: "100"
  REDIS_URL: "redis://redis-service:6379"
```

### 5.3 Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: game-server-secrets
  namespace: crossfire-game
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres-service:5432/crossfire"
  JWT_SECRET: "your-jwt-secret-here"
  API_KEY: "your-api-key-here"
```

### 5.4 Deployment (Game Server)

```yaml
# k8s/deployment-server.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-server
  namespace: crossfire-game
spec:
  replicas: 3
  selector:
    matchLabels:
      app: game-server
  template:
    metadata:
      labels:
        app: game-server
    spec:
      containers:
        - name: game-server
          image: crossfire/game-server:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: game-server-config
            - secretRef:
                name: game-server-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: game-server-service
  namespace: crossfire-game
spec:
  selector:
    app: game-server
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### 5.5 Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-server-hpa
  namespace: crossfire-game
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: game-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### 5.6 Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: game-ingress
  namespace: crossfire-game
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.crossfire-game.com
        - game.crossfire-game.com
      secretName: crossfire-tls
  rules:
    - host: api.crossfire-game.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: game-server-service
                port:
                  number: 80
    - host: game.crossfire-game.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: game-server-service
                port:
                  number: 80
```

---

## 6. Database Deployment

### 6.1 PostgreSQL (Managed)

**Recommended: Use managed PostgreSQL service**

| Provider | Service | Notes |
|----------|---------|-------|
| AWS | RDS PostgreSQL | Automated backups, scaling |
| GCP | Cloud SQL | Integrated with GKE |
| Azure | Database for PostgreSQL | Enterprise features |
| Railway | PostgreSQL | Simple, good for MVP |

### 6.2 Redis (Managed)

| Provider | Service | Notes |
|----------|---------|-------|
| AWS | ElastiCache | Cluster mode available |
| GCP | Memorystore | Integrated with GKE |
| Upstash | Serverless Redis | Pay per request |

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_SERVER: ${{ github.repository }}/server
  IMAGE_NAME_CLIENT: ${{ github.repository }}/client

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Run tests
        run: bun test
        
      - name: Type check
        run: bun run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push server
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.server
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_SERVER }}:${{ github.sha }}
          
      - name: Build and push client
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.client
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_CLIENT }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
          
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/game-server \
            game-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_SERVER }}:${{ github.sha }} \
            -n crossfire-game
            
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/game-server -n crossfire-game --timeout=300s
```

---

## 8. Monitoring & Observability

### 8.1 Prometheus Metrics

```typescript
// Server metrics
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'

const register = new Registry()

// Custom metrics
const connectedPlayers = new Counter({
  name: 'game_connected_players_total',
  help: 'Total connected players',
  registers: [register]
})

const activeRooms = new Counter({
  name: 'game_active_rooms_total',
  help: 'Total active game rooms',
  registers: [register]
})

const messageLatency = new Histogram({
  name: 'game_message_latency_seconds',
  help: 'Message processing latency',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
})

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})
```

### 8.2 Grafana Dashboard

Key metrics to monitor:
- **Connection count**: Active WebSocket connections
- **Room count**: Active game rooms
- **CPU/Memory**: Server resource usage
- **Latency P95/P99**: Network latency percentiles
- **Error rate**: Errors per minute
- **Throughput**: Messages per second

---

## 9. Cost Estimation

### 9.1 MVP (100-500 players)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Compute (2 vCPU, 4GB) | Railway/Render | $20-50 |
| PostgreSQL | Supabase/Railway | $0-25 |
| Redis | Upstash | $0-30 |
| CDN | Cloudflare | $0 |
| **Total** | | **$20-105/month** |

### 9.2 Production (1000-10000 players)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Kubernetes (3 nodes) | GKE/EKS | $150-300 |
| PostgreSQL (Managed) | Cloud SQL | $50-150 |
| Redis (Managed) | Memorystore | $50-100 |
| CDN + Load Balancer | Cloudflare | $20-50 |
| Monitoring | Grafana Cloud | $0-50 |
| **Total** | | **$270-650/month** |

---

## 10. Security Checklist

### Infrastructure Security

- [ ] Enable DDoS protection (Cloudflare)
- [ ] Configure WAF rules
- [ ] Enable TLS 1.3 only
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use managed secrets
- [ ] Enable audit logging
- [ ] Regular security scans

### Application Security

- [ ] Input validation on all endpoints
- [ ] JWT token rotation
- [ ] Server-authoritative game logic
- [ ] Anti-cheat mechanisms
- [ ] Encrypted sensitive data

---

*Document Version: 1.0*
*Last Updated: February 2026*
