import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type ZeptoMailOptions = {
  api_key: string
  api_host?: string
  from_address: string
  from_name?: string
}

export class ZeptoMailNotificationProvider extends AbstractNotificationProviderService {
  static identifier = "zeptomail"
  protected options_: ZeptoMailOptions

  constructor(container: any, options: ZeptoMailOptions) {
    super()
    this.options_ = options
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification

    // Fallback if options aren't provided in config
    const apiKey = this.options_.api_key || process.env.ZEPTOMAIL_API_KEY
    const apiHost = this.options_.api_host || process.env.ZEPTOMAIL_API_HOST
    const fromAddress = this.options_.from_address || process.env.ZEPTOMAIL_FROM_ADDRESS
    
    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ZeptoMail API key is missing. Please provide it in medusa-config.ts options or via ZEPTOMAIL_API_KEY environment variable."
      )
    }

    const payload = {
      from: { 
        address: fromAddress,
        name: this.options_.from_name || "Sravi Enterprises"
      },
      to: [
        {
          email_address: {
            address: to,
            name: data?.customer_name || to
          }
        }
      ],
      subject: data?.subject || "Notification from Sravi Enterprises",
      htmlbody: data?.htmlbody || `<div><b>${data?.message || "You have a new notification."}</b></div>`
    }

    try {
      const response = await fetch(`${apiHost}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ZeptoMail API Error:", errorText)
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Failed to send email via ZeptoMail: ${errorText}`
        )
      }

      const responseData = await response.json()

      return {
        id: responseData.data?.[0]?.message_id || "zepto_msg_unknown"
      }
    } catch (error: any) {
      console.error("ZeptoMail Send Error:", error)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `ZeptoMail error: ${error.message}`
      )
    }
  }
}
