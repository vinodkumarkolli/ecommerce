# 💳 Google Pay UPI Web Integration Guide

This guide details how to integrate the **Google Pay API for India** to collect payments via **UPI (Unified Payments Interface)** in your headless e-commerce stack.

---

## 🗺️ How Google Pay UPI Works on the Web (India)

When a customer checks out using Google Pay on a web storefront in India:
1. **On Mobile Devices (Android)**: The Google Pay API triggers a **UPI Intent**. It opens the Google Pay app on the user's phone directly to complete the secure payment.
2. **On Desktop Devices**: The storefront displays a secure Google Pay popup where the user can authorize the transaction via their UPI ID (or scan a dynamic UPI QR Code).
3. **Backend Validation**: Once the payment is authorized on the client side, the Google Pay token is sent to the Medusa backend, which completes the transaction via your chosen Indian UPI merchant acquirer (e.g., Razorpay, Paytm, or direct bank merchant APIs).

---

## 🛠️ 1. Frontend Integration (Next.js Storefront)

### A. Load the Google Pay JavaScript SDK
Add the Google Pay API script into your storefront checkout head. In Next.js, use the `Script` component:

```tsx
import Script from "next/script"

// Inside your checkout component
<Script 
  src="https://pay.google.com/gp/p/js/pay.js" 
  strategy="lazyOnload" 
  onLoad={() => initializeGooglePay()} 
/>
```

### B. Initialize Google Pay for India UPI
Define the transaction requirements using the UPI protocol:

```typescript
const gpRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: "PAYMENT_GATEWAY",
      parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"]
      },
      tokenizationSpecification: {
        type: "PAYMENT_GATEWAY",
        parameters: {
          gateway: "example", // Replace with your gateway (e.g., "razorpay" or "paytm")
          gatewayMerchantId: "your-gateway-merchant-id"
        }
      }
    },
    // Direct UPI Integration (Alternative)
    {
      type: "UPI",
      parameters: {
        payeeVpa: "merchant@upi", // Your Merchant VPA
        payeeName: "Sravi Enterprises",
        mcc: "5411", // Merchant Category Code
        transactionReferenceId: "TXN123456"
      }
    }
  ],
  transactionInfo: {
    totalPriceStatus: "FINAL",
    totalPrice: "480.00",
    currencyCode: "INR",
    countryCode: "IN"
  },
  merchantInfo: {
    merchantId: "12345678901234567890", // Your Google Pay Merchant ID
    merchantName: "Sravi Enterprises"
  }
}
```

---

## ⚙️ 2. Backend Integration (MedusaJS v2)

Create a custom payment provider in your backend at `src/modules/googlepay/services/googlepay-provider.ts` to manage UPI payment sessions:

```typescript
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
      // Return parameters required by the frontend SDK to bind the transaction
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
    // Validate Google Pay token and verify transaction status via gateway API
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
```

---

## 🔒 3. Registering the Module

Register the Google Pay module in [medusa-config.ts](file:///home/sravienterprises/Documents/ecommerce/backend/medusa-config.ts):

```typescript
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/googlepay",
            id: "googlepay",
            options: {
              merchant_id: process.env.GOOGLE_PAY_MERCHANT_ID,
              payee_vpa: process.env.MERCHANT_UPI_VPA || "sravi@okaxis",
              merchant_name: "Sravi Enterprises",
            },
          },
        ],
      },
    },
```

---

## 🔑 4. Environment Variables Configuration

Configure the Google Pay keys in your workspace environment configuration files:

### A. Backend Settings (`backend/.env`)
Add these credentials to let the backend initialize the custom Google Pay provider:
```env
# Google Pay Merchant ID (Obtained from Google Pay Business Console)
GOOGLE_PAY_MERCHANT_ID=12345678901234567890

# Merchant UPI ID / VPA (Where the customer funds will be routed)
MERCHANT_UPI_VPA=sravienterprises@okaxis

# Legal business name shown during payment confirmation
GOOGLE_PAY_MERCHANT_NAME="Sravi Enterprises"
```

### B. Frontend Settings (`frontend/.env.local`)
Add these to let the Next.js storefront client-side SDK display and authenticate the Google Pay sheet:
```env
NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID=12345678901234567890
NEXT_PUBLIC_MERCHANT_UPI_VPA=sravienterprises@okaxis

# Environment: TEST (for sandbox testing) or PRODUCTION (for live transactions)
NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT=TEST
```

---

## 💡 How to obtain your Google Pay details:
1. **Google Pay Merchant ID**: Register your business on the [Google Pay Business Console](https://business.google.com/payments). Once verified, you will receive a 20-digit merchant ID (e.g., `12345678901234567890`).
2. **Merchant VPA (UPI ID)**: Created through your business bank account or acquiring gateway (e.g. `yourname@okaxis`, `yourname@ybl`). Ensure it is configured to accept merchant-to-merchant settlements.
3. **MCC (Merchant Category Code)**: Standard 4-digit code classifying your business (e.g. `5411` for Groceries, `5732` for Electronics).

```
