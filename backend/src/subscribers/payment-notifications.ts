import fs from "fs"
import path from "path"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"

type PaymentRefundedEventData = {
  id: string
}

export default async function paymentNotificationsHandler({
  event: { data, name },
  container,
}: SubscriberArgs<PaymentRefundedEventData>) {
  const notificationModuleService = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const query = container.resolve("query")

  let order
  let refundAmount = 0
  
  try {
    const paymentId = data.id
    
    if (!paymentId) {
      console.error(`Could not retrieve payment ID from event data: ${JSON.stringify(data)}`)
      return
    }

    // Query the payment to get the latest refund amount and the linked order
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: [
        "id", 
        "amount",
        "refunds.*", 
        "payment_collection.order.id",
        "payment_collection.order.display_id",
        "payment_collection.order.email",
        "payment_collection.order.total",
        "payment_collection.order.shipping_address.*",
        "payment_collection.order.items.*"
      ],
      filters: { id: paymentId }
    })

    if (!payments || payments.length === 0) {
      console.error(`Could not retrieve payment with ID: ${paymentId}`)
      return
    }

    const payment = payments[0]
    
    order = payment.payment_collection?.order
    
    if (!order) {
      console.error(`Could not retrieve order for payment: ${paymentId}`)
      return
    }

    // Find the most recent refund
    if (payment.refunds && payment.refunds.length > 0) {
      const sortedRefunds = [...payment.refunds].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      refundAmount = sortedRefunds[0]?.amount || 0
    } else {
      // Fallback
      refundAmount = payment.amount
    }
    
  } catch (err) {
    console.error(`Could not retrieve order/payment for notification: ${err}`)
    return
  }

  const customerEmail = order.email
  const customerPhone = order.shipping_address?.phone || "910000000000"
  const customerName = order.shipping_address?.first_name || "Customer"

  const displayRefundAmount = `₹${(refundAmount || 0).toFixed(2)}`
  const message = `Your refund for ${displayRefundAmount} has been processed for order #${order.display_id || order.id}.`

  // 1. Send via ZeptoMail
  if (customerEmail) {
    try {
      let orderItemsHtml = ""
      if (order.items && order.items.length > 0) {
        orderItemsHtml = order.items.map((item: any) => {
          const quantity = item.quantity?.numeric_ !== undefined ? item.quantity.numeric_ : (item.quantity ? Number(item.quantity) : 1);
          const unitPrice = item.unit_price?.numeric_ !== undefined ? item.unit_price.numeric_ : (item.unit_price ? Number(item.unit_price) : 0);
          return `
          <tr>
            <td>${item.title || "Item"}</td>
            <td style="text-align: center;">${quantity}</td>
            <td style="text-align: right;">₹${Number(unitPrice).toFixed(2)}</td>
          </tr>
          `;
        }).join("")
      }

      let htmlContent = `<div><b>${message}</b></div>`
      try {
        const templatePath = path.join(process.cwd(), "src/email-templates/amount_refunded.html")
        
        htmlContent = fs.readFileSync(templatePath, "utf8")
        htmlContent = htmlContent
          .replace(/{{customer_name}}/g, customerName)
          .replace(/{{message}}/g, message)
          .replace(/{{refund_amount}}/g, displayRefundAmount)
          .replace(/{{order_id}}/g, String(order.display_id || order.id))
          .replace(/{{order_items_html}}/g, orderItemsHtml)
          .replace(/{{year}}/g, new Date().getFullYear().toString())
          .replace(/{{store_url}}/g, process.env.STORE_CORS || "http://localhost:8000")
      } catch (err) {
        console.error("[ZeptoMail] Failed to read HTML template, using fallback.", err)
      }

      await notificationModuleService.createNotifications({
        to: customerEmail,
        channel: "zeptomail",
        template: "system", 
        data: {
          customer_name: customerName,
          subject: `Refund Processed - Order #${order.display_id || order.id}`,
          htmlbody: htmlContent
        },
      })
      console.log(`[ZeptoMail] Sent refund email to ${customerEmail}`)
    } catch (e) {
      console.error("[ZeptoMail] Failed to send email", e)
    }
  }

  // 2. Send via WhatsApp
  if (customerPhone) {
    try {
      const templateName = "amount_refunded"

      await notificationModuleService.createNotifications({
        to: customerPhone,
        channel: "whatsapp",
        template: "system",
        data: {
          message: message,
          is_whatsapp_template: true,
          template_name: templateName,
          order_id: order.display_id || order.id,
          customer_name: customerName,
          refund_amount: refundAmount,
          order_amount: order.total,
        },
      })
      console.log(`[WhatsApp] Sent ${templateName} template message to ${customerPhone}`)
    } catch (e) {
      console.error("[WhatsApp] Failed to send whatsapp", e)
    }
  }
}

export const config: SubscriberConfig = {
  event: [
    "payment.refunded"
  ]
}
