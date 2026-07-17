# 🚀 Bootstrapping & Local Development Guide

This guide walks you through bootstrapping the MedusaJS v2 backend and the Next.js storefront starter inside the modular `backend/` and `frontend/` folders.

---

## 🛠️ Step 1: Bootstrapping the MedusaJS v2 Backend

To initialize your backend codebase:

1. **Bootstrap the project**:
   Run the Medusa CLI tool inside a temporary directory or directly in the project root:
   ```bash
   npx create-medusa-app@latest ecomm-store --db-url "postgres://medusa_user:medusa_secret_password@localhost:5432/medusa_db"
   ```
   *Note: Select `PostgreSQL` as the database and configure the username (`medusa_user`), password (`medusa_secret_password`), and database name (`medusa_db`) matching your running Postgres container.*

2. **Organize codebase files**:
   Move the generated files into the `backend/` directory while ensuring you keep the custom production configurations:
   * Keep [backend/Dockerfile](file:///home/sravienterprises/Documents/ecommerce/backend/Dockerfile)
   * Keep [backend/entrypoint.sh](file:///home/sravienterprises/Documents/ecommerce/backend/entrypoint.sh)
   * Keep [backend/.dockerignore](file:///home/sravienterprises/Documents/ecommerce/backend/.dockerignore)

3. **Install Dependencies**:
   Navigate to the `backend/` directory and install the necessary package dependencies:
   ```bash
   cd backend
   npm install
   ```

4. **Verify Database Connection**:
   Start the Medusa server in development mode:
   ```bash
   npm run dev
   ```
   *The backend should automatically perform migrations and start running at `http://localhost:9000`.*

---

## 🎨 Step 2: Bootstrapping the Next.js Storefront Starter

To initialize your frontend:

1. **Clone the Medusa Next.js Storefront Starter**:
   Clone the repository directly into your `frontend/` directory:
   ```bash
   git clone https://github.com/medusajs/nextjs-starter-medusa.git temp-frontend
   ```

2. **Move and clean files**:
   * Move everything from `temp-frontend` into the `frontend/` directory.
   * Delete the temporary `temp-frontend` folder.
   * Keep [frontend/Dockerfile](file:///home/sravienterprises/Documents/ecommerce/frontend/Dockerfile)
   * Keep [frontend/.dockerignore](file:///home/sravienterprises/Documents/ecommerce/frontend/.dockerignore)

3. **Configure Environment Variables**:
   In the `frontend/` directory, copy the template env file:
   ```bash
   cd frontend
   cp .env.template .env.local
   ```
   
   **Obtain a Publishable API Key**:
   Because Medusa v2 requires a publishable key for storefront API requests, create one using the Medusa Admin Dashboard:
   
   1. Create an admin user if you haven't already:
      ```bash
      npx medusa user --email admin@example.com --password your_password
      ```
   2. Start the backend server (`npm run dev`) and navigate to `http://localhost:9000/admin`.
   3. Log in, go to **Settings** > **Publishable API Keys**.
   4. Click **Create API Key**, enter a name (e.g., `Web Storefront Key`), associate it with your storefront's Sales Channel, and copy the generated key (starts with `pk_...`).

   Update [frontend/.env.local](file:///home/sravienterprises/Documents/ecommerce/frontend/.env.local) with the following settings:
   ```env
   # Point to your local backend API
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
   
   # Paste the generated publishable API key
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_generated_key
   
   # Local Storefront base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Set default region to India
   NEXT_PUBLIC_DEFAULT_REGION=in
   ```

4. **Install Dependencies & Start**:
   ```bash
   npm install
   npm run dev
   ```
   *The storefront will build and run locally at `http://localhost:8000` or `http://localhost:3000`.*

---

## 🔗 Step 3: Local Dev Orchestration via Compose

Once both codebases are created, you can stop the individual dev servers and spin up the entire stack using our root compose file:
```bash
docker compose up --build
```
This command compiles your custom Docker images for both `backend` and `storefront` and launches them alongside the database and redis services.
