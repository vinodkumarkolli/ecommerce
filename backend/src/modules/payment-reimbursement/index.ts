import PaymentReimbursementService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PAYMENT_REIMBURSEMENT_MODULE = "paymentReimbursement"

export default Module(PAYMENT_REIMBURSEMENT_MODULE, {
  service: PaymentReimbursementService,
})
