import fs from "fs"
import path from "path"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService, IOrderModuleService } from "@medusajs/framework/types"

type FulfillmentCreatedEventData = {
  order_id: string
  fulfillment_id: string
  no_notification?: boolean
}

export default async function orderNotificationsHandler({
  event: { data, name },
  container,
}: SubscriberArgs<FulfillmentCreatedEventData>) {
  const notificationModuleService = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)
  const orderModuleService = container.resolve<IOrderModuleService>(Modules.ORDER)

  let order
  try {
    // Handle both order.placed (data.id) and order.fulfillment_created (data.order_id)
    const orderId = data.order_id || (data as any).id
    
    if (!orderId) {
      console.error(`Could not retrieve order ID from event data: ${JSON.stringify(data)}`)
      return
    }
    
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["*", "shipping_address.*", "items.*"],
      filters: { id: orderId }
    })
    
    if (!orders || orders.length === 0) {
      console.error(`Could not retrieve order for notification: ${orderId}`)
      return
    }
    order = orders[0]
  } catch (err) {
    console.error(`Could not retrieve order for notification: ${err}`)
    return
  }

  const customerEmail = order.email
  const customerPhone = order.shipping_address?.phone || "910000000000" // Fallback to avoid crashes
  const customerName = order.shipping_address?.first_name || "Customer"

  let message = `Your order ${order.display_id || order.id} has been placed successfully!`
  if (name === "order.fulfillment_created") {
    message = `Your order ${order.display_id || order.id} is confirmed and ready to be shipped!`
  } else if (name === "order.canceled") {
    message = `Your order ${order.display_id || order.id} has been canceled due to a payment failure.`
  }

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
            <td>${quantity}</td>
            <td style="text-align: right;">₹${Number(unitPrice).toFixed(2)}</td>
          </tr>
          `;
        }).join("")
      }

      const targetTotal = order.original_total || order.total;
      const orderTotal = targetTotal?.numeric_ !== undefined ? targetTotal.numeric_ : (targetTotal ? Number(targetTotal) : 0);
      const totalAmount = `₹${Number(orderTotal).toFixed(2)}`
      
      let htmlContent = `<div><b>${message}</b></div>`
      try {
        let templatePath = path.join(process.cwd(), "src/email-templates/order-placed.html")
        if (name === "order.canceled") {
          templatePath = path.join(process.cwd(), "src/email-templates/order-canceled.html")
        }
        
        htmlContent = fs.readFileSync(templatePath, "utf8")
        htmlContent = htmlContent
          .replace(/{{customer_name}}/g, customerName)
          .replace(/{{message}}/g, message)
          .replace(/{{order_id}}/g, String(order.display_id || order.id))
          .replace(/{{order_items_html}}/g, orderItemsHtml)
          .replace(/{{order_total}}/g, totalAmount)
          .replace(/{{year}}/g, new Date().getFullYear().toString())
          .replace(/{{store_url}}/g, process.env.STORE_CORS || "http://localhost:8000")
      } catch (err) {
        console.error("[ZeptoMail] Failed to read HTML template, using fallback.", err)
      }

      await notificationModuleService.createNotifications({
        to: customerEmail,
        channel: "zeptomail",
        template: "system", // We hardcoded the HTML in the provider, so template is ignored for now
        data: {
          customer_name: customerName,
          subject: `Order Update - ${order.display_id || order.id}`,
          htmlbody: htmlContent
        },
      })
      console.log(`[ZeptoMail] Sent email to ${customerEmail}`)
    } catch (e) {
      console.error("[ZeptoMail] Failed to send email", e)
    }
  }

  // 2. Send via WhatsApp
  if (customerPhone) {
    try {
      let templateName = "order_placed_no_cta"
      if (name === "order.fulfillment_created") {
        templateName = "order_confirmed"
      } else if (name === "order.canceled") {
        templateName = "order_canceled_cta"
      }

      await notificationModuleService.createNotifications({
        to: customerPhone,
        channel: "whatsapp",
        template: "system",
        data: {
          message: message,
          is_whatsapp_template: true,
          template_name: templateName,
          order_id: order.display_id || order.id,
          customer_name: order.shipping_address?.first_name || "Customer",
          order_amount: orderTotal,
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
    "order.placed",
    "order.fulfillment_created",
    "order.canceled"
  ]
}
