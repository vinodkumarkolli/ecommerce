import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { type, identifier } = req.body as { type: "phone" | "email"; identifier: string }

  if (!type || !identifier) {
    return res.status(400).json({ message: "Type ('phone' or 'email') and identifier are required" })
  }

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 2. Cache the OTP in Redis using Medusa's cache service (expires in 5 minutes)
  const cacheService = req.scope.resolve("cacheService")
  await cacheService.set(`otp:${identifier}`, otp, 300)

  console.log(`[OTP Verification] Generated OTP: ${otp} for ${identifier}`)

  let sendSuccess = false
  let errorMsg = ""

  try {
    if (type === "phone") {
      const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
      const waToken = process.env.WHATSAPP_ACCESS_TOKEN
      const waTemplate = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_verification"

      if (waPhoneId && waToken) {
        // Send WhatsApp OTP via Meta Business Cloud API
        const formattedPhone = identifier.replace(/[^0-9]/g, "") // Ensure clean number with country code, e.g., 919876543210
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "template",
            template: {
              name: waTemplate,
              language: { code: "en_US" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: otp }],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: otp }],
                }
              ],
            },
          }),
        })

        if (response.ok) {
          sendSuccess = true
        } else {
          const errData = await response.json()
          errorMsg = JSON.stringify(errData)
          console.error("[OTP Verification] WhatsApp Cloud API Send Failed:", errorMsg)
        }
      } else {
        console.warn("[OTP Verification] WhatsApp Cloud API credentials missing in .env. Simulating send.")
        sendSuccess = true
      }
    } else if (type === "email") {
      const zeptoToken = process.env.ZEPTOMAIL_SEND_TOKEN
      const zeptoBounce = process.env.ZEPTOMAIL_BOUNCE_ADDRESS
      const zeptoTemplate = process.env.ZEPTOMAIL_OTP_TEMPLATE_ID

      if (zeptoToken && zeptoBounce && zeptoTemplate) {
        // Send email OTP via Zoho ZeptoMail API
        const response = await fetch("https://api.zeptomail.in/v1.1/email/template", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": zeptoToken,
          },
          body: JSON.stringify({
            mail_template_key: zeptoTemplate,
            bounce_address: zeptoBounce,
            from: {
              address: "noreply@sravie.in",
              name: "Sravi Enterprises",
            },
            to: [
              {
                email_address: {
                  address: identifier,
                },
              },
            ],
            merge_info: {
              otp_code: otp,
            },
          }),
        })

        if (response.ok) {
          sendSuccess = true
        } else {
          const errData = await response.json()
          errorMsg = JSON.stringify(errData)
          console.error("[OTP Verification] Zoho ZeptoMail API Send Failed:", errorMsg)
        }
      } else {
        console.warn("[OTP Verification] Zoho ZeptoMail credentials missing in .env. Simulating send.")
        sendSuccess = true
      }
    }
  } catch (err: any) {
    errorMsg = err.message
    console.error("[OTP Verification] Communication Gateway Exception:", err)
  }

  return res.status(200).json({
    success: sendSuccess,
    simulated: !process.env.WHATSAPP_ACCESS_TOKEN && !process.env.ZEPTOMAIL_SEND_TOKEN,
    message: sendSuccess ? "OTP sent successfully" : `Failed to send OTP: ${errorMsg}`,
  })
}
