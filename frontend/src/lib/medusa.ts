import Medusa from "@medusajs/js-sdk"

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// Only throw the error on the client/browser at runtime, allowing static build compilations to succeed
if (!backendUrl && typeof window !== "undefined") {
  throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable is mandatory for the storefront.")
}

export const sdk = new Medusa({
  baseUrl: backendUrl || "http://localhost:9000", // Fallback only for build compilation
  publishableKey: publishableKey,
})
