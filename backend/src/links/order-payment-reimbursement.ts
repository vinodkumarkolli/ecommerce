import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import PaymentReimbursementModule from "../modules/payment-reimbursement/index"

export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: PaymentReimbursementModule.linkable.paymentReimbursement,
    isList: true,
    deleteCascade: true
  }
)
