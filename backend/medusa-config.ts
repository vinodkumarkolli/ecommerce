import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const dbHost = process.env.DB_HOST || "localhost"
const dbPort = process.env.DB_PORT || "5432"
const dbUser = process.env.DB_USER || "medusa_user"
const dbPassword = process.env.DB_PASSWORD || ""
const dbName = process.env.DB_NAME || "medusa_db"
const databaseUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: databaseUrl,
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
    // 1. Payment Module Integration (Google Pay)
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/googlepay",
            id: "googlepay",
            options: {
              merchant_id: process.env.GOOGLE_PAY_MERCHANT_ID,
              payee_vpa: process.env.MERCHANT_UPI_VPA || "sravi@okaxis",
              merchant_name: "Sravi Enterprises",
            },
          },
        ],
      },
    },
    // 2. Fulfillment Module Integration (Manual)
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
