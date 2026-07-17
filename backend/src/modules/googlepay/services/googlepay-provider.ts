import { 
  AbstractPaymentProvider, 
  PaymentProviderSessionResponse, 
  PaymentResponse, 
  PaymentSessionStatus 
} from "@medusajs/framework/utils"

export class GooglePayProviderService extends AbstractPaymentProvider {
  static identifier = "googlepay"

  protected config_: any

  constructor(container: any, config: any) {
    super(container, config)
    this.config_ = config
  }

  async initiatePayment(context: any): Promise<PaymentProviderSessionResponse> {
    const { amount } = context
    try {
      return {
        data: {
          amount,
          currency: "INR",
          merchantName: this.config_.merchant_name || "Sravi Enterprises",
          payeeVpa: this.config_.payee_vpa
        }
      }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  async authorizePayment(paymentSessionData: Record<string, any>, context: Record<string, any>): Promise<PaymentResponse> {
    return {
      status: "authorized",
      data: paymentSessionData,
    }
  }

  async capturePayment(paymentData: Record<string, any>): Promise<Record<string, any>> {
    return { status: "captured" }
  }

  async refundPayment(paymentData: Record<string, any>, refundAmount: number): Promise<Record<string, any>> {
    return { status: "refunded" }
  }

  async cancelPayment(paymentData: Record<string, any>): Promise<Record<string, any>> {
    return { status: "canceled" }
  }

  async getPaymentStatus(paymentSessionData: Record<string, any>): Promise<PaymentSessionStatus> {
    return "authorized"
  }
}

export default GooglePayProviderService
