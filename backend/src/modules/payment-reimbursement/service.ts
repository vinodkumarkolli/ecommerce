import { MedusaService } from "@medusajs/framework/utils"
import PaymentReimbursement from "./models/payment-reimbursement"

class PaymentReimbursementService extends MedusaService({
  PaymentReimbursement,
}) {}

export default PaymentReimbursementService
