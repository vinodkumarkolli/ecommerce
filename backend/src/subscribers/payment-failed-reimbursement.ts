import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
import { PAYMENT_REIMBURSEMENT_MODULE } from "../modules/payment-reimbursement/index"
import PaymentReimbursementService from "../modules/payment-reimbursement/service"

export default async function paymentFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; amount: number; order_id: string }>) {
  const logger = container.resolve("logger")
  const service: PaymentReimbursementService = container.resolve(PAYMENT_REIMBURSEMENT_MODULE)
  const query = container.resolve("query")
  const link = container.resolve("link")

  logger.info(`Handling payment_failed for payment: ${data.id}`)

  try {
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: ["id", "amount", "currency_code", "payment_collection.*"],
      filters: { id: data.id }
    })
    const payment = payments[0]
    if (!payment) return;
    
    // Ideally we would get order_id from payment_collection or we might pass it
    // Let's assume order ID can be retrieved, or we create without order ID for now.
    // For simplicity, we just set "unknown_order" if we can't find it easily in the event.
    
    const reimbursement = await service.createPaymentReimbursements({
      payment_id: payment.id,
      order_id: "pending_resolution", // Since payment_collection to order might be complex, we'll store this and manually resolve.
      status: "pending_review",
      amount: payment.amount,
      currency_code: payment.currency_code,
      reason: "Payment failed automatically",
    })
    
    await link.create({
      [Modules.PAYMENT]: { payment_id: payment.id },
      [PAYMENT_REIMBURSEMENT_MODULE]: { payment_reimbursement_id: reimbursement.id }
    })
    
  } catch (error: any) {
    logger.error(`Failed to create reimbursement: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "payment.payment_failed",
}
