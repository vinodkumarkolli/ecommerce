import { model } from "@medusajs/framework/utils"

const PaymentReimbursement = model.define("payment_reimbursement", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  payment_id: model.text(),
  status: model.enum(["pending_review", "approved", "rejected"]).default("pending_review"),
  amount: model.bigNumber(),
  currency_code: model.text(),
  reason: model.text().nullable(),
})

export default PaymentReimbursement
