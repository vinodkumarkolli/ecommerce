import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type WhatsAppOptions = {
  phone_number_id: string
  access_token: string
  business_account_id?: string
}

export class WhatsAppNotificationProvider extends AbstractNotificationProviderService {
  static identifier = "whatsapp"
  protected options_: WhatsAppOptions

  constructor(container: any, options: WhatsAppOptions) {
    super()
    this.options_ = options
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification

    const phoneNumberId = this.options_.phone_number_id || process.env.WHATSAPP_PHONE_ID
    const accessToken = this.options_.access_token || process.env.WHATSAPP_TOKEN
    const businessAccountId = this.options_.business_account_id || process.env.WHATSAPP_BUSINESS_ID
    
    if (!phoneNumberId || !accessToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "WhatsApp configuration is missing. Provide phone_number_id and access_token."
      )
    }

    // Check if custom payload is provided (for WhatsApp templates)
    let payload: any = data?.whatsapp_payload || {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/[^0-9]/g, ""), // strip non-numeric characters
      type: "text",
      text: {
        preview_url: false,
        body: data?.message || "You have a new notification."
      }
    }

    // For template messages, the structure should be different
    if (data?.is_whatsapp_template && data?.template_name) {
      let components: any[] = []

      // Construct Body Parameters based on template
      let bodyParameters: any[] = [];

      if (data?.template_name === "amount_refunded") {
        // Body expects: 1. Name, 2. Amount, 3. Order ID
        bodyParameters = [
          {
            type: "text",
            text: data?.customer_name || ""
          },
          {
            type: "text",
            text: data?.refund_amount ? `₹${(data.refund_amount || 0).toFixed(2)}` : "the amount"
          },
          {
            type: "text",
            text: data?.order_id ? `#${data.order_id}` : "Unknown"
          }
        ];
      } else {
        // Default body for order placed/confirmed/canceled
        bodyParameters = [
          {
            type: "text",
            text: data?.customer_name || ""
          },
          {
            type: "text",
            text: data?.order_id ? `#${data.order_id}` : "Unknown"
          }
        ];
      }

      // If header_text is provided, create a header component
      if (data?.header_text) {
        components.push({
          type: "header",
          parameters: [
            {
              type: "text",
              text: data.header_text
            }
          ]
        });
      } else if (data?.template_name === "amount_refunded") {
        // Fallback for amount_refunded if header is explicitly required
        components.push({
          type: "header",
          parameters: [
            {
              type: "text",
              text: data?.refund_amount ? `₹${(data.refund_amount || 0).toFixed(2)}` : "the amount"
            }
          ]
        });
      }

      components.push({
        type: "body",
        parameters: bodyParameters
      });

      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/[^0-9]/g, ""),
        type: "template",
        template: {
          name: data.template_name,
          language: {
            code: data?.language_code || "en_US"
          },
          components: components
        }
      }

      // Add business account ID to the payload if available
      if (businessAccountId) {
        payload.business_account_id = businessAccountId
      }
    } else if (businessAccountId) {
      payload.business_account_id = businessAccountId
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("WhatsApp API Error:", errorText)
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Failed to send WhatsApp message: ${errorText}`
        )
      }

      const responseData = await response.json()

      return {
        id: responseData.messages?.[0]?.id || "wa_msg_unknown"
      }
    } catch (error: any) {
      console.error("WhatsApp Send Error:", error)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `WhatsApp error: ${error.message}`
      )
    }
  }
}
