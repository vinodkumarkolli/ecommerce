# 🐳 Production Docker & Portainer Stack Guide

This guide outlines how to build, publish, and deploy the modular Headless E-commerce stack using Docker and Portainer Stacks.

---

## 🛠️ 1. Building the Docker Images

Since the backend and frontend are placed in separate folders, you build them independently. Replace `your-registry` with your Docker registry or Docker Hub namespace (e.g. `docker.io/sravi`).

### A. MedusaJS v2 Backend
1. Navigate to the project root directory.
2. Build and tag the backend image:
   ```bash
   docker build -t your-registry/medusa-backend:latest -f backend/Dockerfile backend/
   ```

### B. Next.js Storefront
1. Build and tag the frontend storefront:
   ```bash
   docker build -t your-registry/nextjs-storefront:latest -f frontend/Dockerfile frontend/
   ```

### C. Pushing to a Container Registry
After successful builds, log into your registry and push the images:
```bash
docker login your-registry
docker push your-registry/medusa-backend:latest
docker push your-registry/nextjs-storefront:latest
```

---

## 🚀 2. Deploying via Portainer Stack (Production Compose)

Create a new stack in your Portainer instance (e.g., **Stacks** > **Add stack**) and paste the following deployment configuration.

### Portainer Stack YAML Template

```yaml
version: "3.8"

services:
  # 1. PostgreSQL Database with strict resource caps
  postgres:
    image: postgres:17-alpine
    container_name: medusa-db-prod
    environment:
      POSTGRES_USER: medusa_user
      POSTGRES_PASSWORD: ${POSTGRES_DB_PASSWORD}
      POSTGRES_DB: medusa_db
    volumes:
      - pgdata-prod:/var/lib/postgresql/data
    command: >
      postgres 
      -c max_connections=20
      -c shared_buffers=32MB
      -c work_mem=2MB
      -c min_wal_size=32MB
      -c max_wal_size=128MB
      -c logging_collector=off
    deploy:
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa_user -d medusa_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 2. Redis Workflow Broker
  redis:
    image: redis:7-alpine
    container_name: medusa-redis-prod
    deploy:
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 128M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 3. MedusaJS Backend Container
  backend:
    image: your-registry/medusa-backend:latest
    container_name: medusa-backend-prod
    expose:
      - "9000"
    environment:
      - DATABASE_URL=postgres://medusa_user:${POSTGRES_DB_PASSWORD}@postgres:5432/medusa_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - PORT=9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5

  # 4. Next.js Storefront Container
  storefront:
    image: your-registry/nextjs-storefront:latest
    container_name: nextjs-storefront-prod
    ports:
      - "80:3000" # Map host HTTP port 80 to container Next.js web server port 3000
    environment:
      - NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://backend:9000
    depends_on:
      backend:
        condition: service_healthy
    deploy:
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 256M

volumes:
  pgdata-prod:
    driver: local
```

---

## 🔒 3. Required Environment Variables (Portainer Stack Env)

Define the following environment variables under Portainer's **Environment variables** section when creating/updating the stack:

| Key | Example Value | Description |
|---|---|---|
| `POSTGRES_DB_PASSWORD` | `choose-a-strong-random-db-password` | Root password for the PostgreSQL instance. |
| `JWT_SECRET` | `generate-random-secret-key-32-chars` | Secret key used for authenticating JSON Web Tokens. |
| `COOKIE_SECRET` | `generate-random-cookie-secret` | Cryptographic secret for signing browser cookies. |

---

## 🏗️ 4. Handling Initial Seed Data & Migrations

The Backend container automatically executes `npx medusa db:migrate` at startup. To seed the database with the initial products, currency settings, and regions, perform the following steps:

1. **Access the Backend Terminal**:
   In Portainer, click on the running `medusa-backend-prod` container, click **Console**, and select `/bin/sh` or `/bin/bash`.
2. **Execute Seed Script**:
   Run the seeding command inside the container shell:
   ```bash
   npx medusa exec ./dist/scripts/seed.js
   ```
3. **Register Products and Configurations**:
   Log into the admin portal (configured at the backend's routing endpoint) to define the Sastry Balm catalog variants, weights/dimensions, manual shipping options, and the Paytm integration keys.
