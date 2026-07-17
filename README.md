# 🛒 Sravi Enterprises - E-Commerce Setup

Modular headless e-commerce store with MedusaJS v2 backend and Next.js storefront.

---

## 🗄️ Database Setup (Reusing Existing Postgres)

You do not need to create a new database container. You can reuse the PostgreSQL database instance from your infrastructure stack (`infra-postgres`) by creating a new database schema named `medusa_db`.

Run the following command on your VPS/host to create the database:
```bash
docker exec -it infra-postgres psql -U admin -d postgres -c "CREATE DATABASE medusa_db;"
```

---

## 🚀 Orchestration (Split Composes)

### A. Medusa Backend Stack
Deploy the backend stack using [docker-compose.backend.yml](file:///home/sravienterprises/Documents/ecommerce/docker-compose.backend.yml). It connects to the external database and Redis services.

```bash
docker compose -f docker-compose.backend.yml up -d
```

### B. Next.js Storefront Stack
Deploy the storefront using [docker-compose.frontend.yml](file:///home/sravienterprises/Documents/ecommerce/docker-compose.frontend.yml).

```bash
docker compose -f docker-compose.frontend.yml up -d
```
