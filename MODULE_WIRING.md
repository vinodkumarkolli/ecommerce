# 🔌 Module Wiring & Integrations Guide

This guide describes how to configure and wire the **Manual Fulfillment** module in your MedusaJS v2 backend workspace.

For Payment Gateway setups, please refer to the dedicated payment integration guide:
👉 [Google Pay UPI Integration Guide](file:///home/sravienterprises/Documents/ecommerce/GOOGLE_PAY_UPI.md)

---

## 📦 1. Installation

In MedusaJS v2, the Manual Fulfillment provider module is installed as a package dependency:

Run the following command in your terminal inside the `backend/` directory:
```bash
cd backend
npm install @medusajs/fulfillment-manual
```

---

## ⚙️ 2. Configuration (`medusa-config.ts`)

Open [backend/medusa-config.ts](file:///home/sravienterprises/Documents/ecommerce/backend/medusa-config.ts) and register the Manual Fulfillment provider under the `modules` block:

```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:9000,http://localhost:8000",
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    // Fulfillment Module Integration (Manual)
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
            options: {},
          },
        ],
      },
    },
  ]
})
```
