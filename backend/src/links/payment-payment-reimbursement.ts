import { defineLink } from "@medusajs/framework/utils"
import PaymentModule from "@medusajs/medusa/payment"
import PaymentReimbursementModule from "../modules/payment-reimbursement/index"

export default defineLink(
  PaymentModule.linkable.payment,
  {
    linkable: PaymentReimbursementModule.linkable.paymentReimbursement,
    isList: true,
    deleteCascade: true
  }
)
