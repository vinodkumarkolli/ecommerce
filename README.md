# 🛒 Sravi Enterprises - E-Commerce Setup

Modular headless e-commerce store with MedusaJS v2 backend and Next.js storefront.

---

## 🛠️ Development Environment (Local Host & Staging)

For running and testing the application locally on your development machine.

### 1. Start Mock Infrastructure Services
We provide a local mock infrastructure stack to run Postgres and Redis cache/queues in the background:
```bash
# Spin up local mock Postgres and Redis services
docker compose -f docker-compose.infra.yml up -d
```
*Note: This creates local networks `postgres-shared-network` and `frappe-shared-network` and exposes Postgres on port `5432`.*

### 2. Create the Local Development Database
Run the following command to initialize the database schema inside your mock Postgres container:
```bash
docker exec -it infra-postgres psql -U admin -d postgres -c "CREATE DATABASE medusa_db;"
```

### 3. Run Database Migrations
Before running the backend on your host machine, execute the migrations to generate the tables:
```bash
cd backend
npx medusa db:migrate
```

### 4. Start the Application Engines
Run both development servers:
* **Backend Dev Engine** (Runs on port `9000`):
  ```bash
  cd backend
  npm run dev
  ```
* **Storefront Dev Engine** (Runs on port `3000`):
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🚀 Production Environment (VPS Portainer & Traefik)

For live cloud deployment on your VPS.

### 1. Create the Production Database
Re-use your existing `infra-postgres` container in the infrastructure stack by creating a separate logical database:
```bash
docker exec -it infra-postgres psql -U admin -d postgres -c "CREATE DATABASE medusa_db;"
```

### 2. Deploy the Medusa Backend Stack
Deploy the backend using [docker-compose.backend.yml](file:///home/sravienterprises/Documents/ecommerce/docker-compose.backend.yml). It connects to the external database and Redis services in your infrastructure stack.

```bash
docker compose -f docker-compose.backend.yml up -d
```
* **Automated Migrations**: The backend container's `entrypoint.sh` boot script automatically executes `npx medusa db:migrate` on start. **No manual commands are needed.**
* **Domain Access**: Traefik will route incoming secure requests for `https://shop-api.sravie.in` to the Medusa backend.

### 3. Deploy the Next.js Storefront Stack
Deploy the storefront using [docker-compose.frontend.yml](file:///home/sravienterprises/Documents/ecommerce/docker-compose.frontend.yml).

```bash
docker compose -f docker-compose.frontend.yml up -d
```
* **Domain Access**: Traefik will route secure customer requests for `https://shop.sravie.in` to the storefront container.
