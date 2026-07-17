"use client"

import { isManual, isStripeLike, isGooglePay } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState, useEffect } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case isGooglePay(paymentSession?.provider_id):
      return (
        <GooglePayPaymentButton notReady={notReady} cart={cart} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              line1: cart.billing_address?.address_1 || "",
              line2: cart.billing_address?.address_2 || "",
              city: cart.billing_address?.city || "",
              state: cart.billing_address?.province || "",
              postal_code: cart.billing_address?.postal_code || "",
              country: cart.billing_address?.country_code || "",
            },
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent
          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          setSubmitting(false)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          (paymentIntent && paymentIntent.status === "succeeded")
        ) {
          onPaymentCompleted()
        }
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

const GooglePayPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gpayLoaded, setGpayLoaded] = useState(false)
  const buttonRef = React.useRef<HTMLDivElement>(null)

  // 1. Load the Google Pay SDK dynamically
  useEffect(() => {
    if (typeof window === "undefined") return

    if ((window as any).google?.payments?.api?.PaymentsClient) {
      setGpayLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://pay.google.com/gp/p/js/pay.js"
    script.async = true
    script.onload = () => setGpayLoaded(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // 2. Initialize and mount the Google Pay button
  useEffect(() => {
    if (!gpayLoaded || !buttonRef.current) return

    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || "TEST",
    })

    const button = paymentsClient.createButton({
      buttonColor: "black",
      buttonType: "plain",
      buttonSizeMode: "fill",
      onClick: () => handleGooglePayPayment(paymentsClient),
    })

    buttonRef.current.replaceChildren(button)
  }, [gpayLoaded, notReady])

  // 3. Handle the Google Pay Sheet Popup
  const handleGooglePayPayment = async (paymentsClient: any) => {
    if (notReady) return
    setSubmitting(true)
    setErrorMessage(null)

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["MASTERCARD", "VISA"],
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "example",
              gatewayMerchantId: "exampleGatewayMerchantId",
            },
          },
        },
      ],
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: cart.total.toFixed(2),
        currencyCode: (cart.currency_code || "INR").toUpperCase(),
        countryCode: "IN",
      },
      merchantInfo: {
        merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "12345678901234567890",
        merchantName: "Sravi Enterprises",
      },
    }

    try {
      // Trigger the official Google Pay payment sheet overlay
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest)
      
      if (paymentData) {
        // Payment authorized successfully in Google Pay sheet, now finalize Medusa order
        await placeOrder()
      }
    } catch (err: any) {
      if (err.statusCode === "CANCELED") {
        setErrorMessage("Payment was canceled by the user.")
      } else {
        setErrorMessage(err.message || "An error occurred with Google Pay.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full mt-6">
      {/* Mounted GPay button container */}
      <div 
        ref={buttonRef} 
        className={clx("w-full h-12 rounded overflow-hidden", {
          "opacity-50 pointer-events-none": notReady || submitting
        })}
      />
      <ErrorMessage
        error={errorMessage}
        data-testid="googlepay-payment-error-message"
      />
    </div>
  )
}

export default PaymentButton
