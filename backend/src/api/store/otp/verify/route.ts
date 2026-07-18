import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, generateJwtToken } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { identifier, otp } = req.body as { identifier: string; otp: string }

  if (!identifier || !otp) {
    return res.status(400).json({ message: "Identifier and OTP code are required" })
  }

  // 1. Fetch cached OTP from Redis
  const cacheService = req.scope.resolve(Modules.CACHE)
  const cachedOtp = await cacheService.get(`otp:${identifier}`)

  // 2. Validate OTP (Allow 123456 as a default staging override)
  const isLocalSimulated = !(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN) && !(process.env.ZEPTOMAIL_API_KEY || process.env.ZEPTOMAIL_SEND_TOKEN)
  const isValid = cachedOtp === otp || (isLocalSimulated && otp === "123456")

  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification code" })
  }

  // 3. Delete OTP from cache after successful verification
  await cacheService.invalidate(`otp:${identifier}`)

  // 4. Check if a customer already exists with this phone or email
  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
  let customer: any = null

  try {
    const isEmail = identifier.includes("@")
    
    // Use 'q' parameter which natively searches across email, phone, and name in Medusa v2
    // to ensure we always find the customer regardless of what identifier they used.
    const customers = await customerModuleService.listCustomers({ q: identifier })

    if (customers.length > 0) {
      customer = customers[0]
      console.log(`[OTP Verification] Returning customer found: ${customer.id}`)
    } else {
      // Create new customer profile
      const newCustomerPayload: any = {}

      if (isEmail) {
        newCustomerPayload.email = identifier
      } else {
        newCustomerPayload.phone = identifier
        // Medusa requires a unique email or identifier for accounts, generate placeholder
        newCustomerPayload.email = `${identifier.replace(/[^0-9]/g, "")}@sravie-customer.in`
      }

      customer = await customerModuleService.createCustomers(newCustomerPayload)
      console.log(`[OTP Verification] New customer created: ${customer.id}`)
    }
  } catch (err: any) {
    console.error("[OTP Verification] Failed to query or create customer:", err.message)
    return res.status(500).json({ success: false, message: "Failed to process customer profile" })
  }

  // 5. Generate Auth Token
  const secret = process.env.JWT_SECRET || "supersecret"
  const token = generateJwtToken(
    {
      actor_id: customer.id,
      actor_type: "customer",
      auth_identity_id: "",
      app_metadata: {
        customer_id: customer.id,
      },
    },
    {
      secret,
      expiresIn: "24h",
    }
  )

  return res.status(200).json({
    success: true,
    message: "Verified successfully",
    token,
    customer: customer ? {
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      billing_address: customer.billing_address,
      addresses: customer.addresses || [],
    } : null
  })
}
