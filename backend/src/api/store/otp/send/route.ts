import fs from "fs"
import path from "path"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

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
  const cacheService = req.scope.resolve(Modules.CACHE)
  await cacheService.set(`otp:${identifier}`, otp, 300)

  console.log(`[OTP Verification] Generated OTP: ${otp} for ${identifier}`)

  let sendSuccess = false
  let errorMsg = ""

  try {
    if (type === "phone") {
      const waPhoneId = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
      const waToken = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
      const waTemplate = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "login_code"

      if (waPhoneId && waToken) {
        // Send WhatsApp OTP via Meta Business Cloud API
        let formattedPhone = identifier.replace(/[^0-9]/g, "") // Ensure clean number
        
        // Add India country code if it's exactly 10 digits (WhatsApp requires country code)
        if (formattedPhone.length === 10) {
          formattedPhone = `91${formattedPhone}`
        }
        
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
      const zeptoToken = process.env.ZEPTOMAIL_API_KEY || process.env.ZEPTOMAIL_SEND_TOKEN
      const zeptoBounce = process.env.ZEPTOMAIL_BOUNCE_ADDRESS
      
      if (zeptoToken) {
        let htmlContent = `<p>Your verification code is: <b>${otp}</b></p>`
        try {
          const templatePath = path.join(process.cwd(), "src/email-templates/otp-verification.html")
          htmlContent = fs.readFileSync(templatePath, "utf8")
          htmlContent = htmlContent.replace(/{{otp}}/g, otp).replace(/{{year}}/g, new Date().getFullYear().toString())
        } catch (err) {
          console.error("[OTP Verification] Failed to read HTML template, using fallback.", err)
        }

        // Send email OTP via Zoho ZeptoMail API standard endpoint
        const payload: any = {
          from: {
            address: process.env.ZEPTOMAIL_FROM_ADDRESS || "noreply@sravie.in",
            name: "Sravi Enterprises",
          },
          to: [
            {
              email_address: {
                address: identifier,
              },
            },
          ],
          subject: "Your OTP Verification Code",
          htmlbody: htmlContent,
        }

        if (zeptoBounce) {
          payload.bounce_address = zeptoBounce
        }

        const response = await fetch("https://api.zeptomail.in/v1.1/email", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": zeptoToken,
          },
          body: JSON.stringify(payload),
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

  const isSimulated = !(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN) && !(process.env.ZEPTOMAIL_API_KEY || process.env.ZEPTOMAIL_SEND_TOKEN)

  return res.status(200).json({
    success: sendSuccess,
    simulated: isSimulated,
    message: sendSuccess ? "OTP sent successfully" : `Failed to send OTP: ${errorMsg}`,
  })
}
