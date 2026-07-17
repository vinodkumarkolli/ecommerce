"use client"

import { useEffect, useState, useRef } from "react"
import { sdk } from "@/lib/medusa"
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Check, 
  Loader2, 
  Sparkles, 
  MapPin, 
  Truck, 
  CreditCard 
} from "lucide-react"

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  
  // Variant Selection State
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  
  // OTP Verification State
  const [verifying, setVerifying] = useState(false)
  const [phoneOrEmail, setPhoneOrEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpMessage, setOtpMessage] = useState("")
  const [isVerified, setIsVerified] = useState(false)

  // Loading States
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  
  // Shipping Form State
  const [shippingAddress, setShippingAddress] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    email: ""
  })
  
  // Shipping Options State
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>("")
  const [placingOrder, setPlacingOrder] = useState(false)

  // GPay Script State
  const [gpayLoaded, setGpayLoaded] = useState(false)
  const gpayContainerRef = useRef<HTMLDivElement>(null)

  // 1. Initial Data Fetching (Products & Cart)
  useEffect(() => {
    async function initStore() {
      try {
        // Fetch products
        const { products } = await sdk.store.product.list({ limit: 10 })
        setProducts(products)

        // Set default variant for each product
        const initialVariants: Record<string, string> = {}
        products.forEach((p: any) => {
          if (p.variants && p.variants.length > 0) {
            initialVariants[p.id] = p.variants[0].id
          }
        })
        setSelectedVariants(initialVariants)

        // Initialize or load cart from localStorage
        let activeCartId = localStorage.getItem("medusa_cart_id")
        let activeCart: any = null

        if (activeCartId) {
          try {
            const { cart } = await sdk.store.cart.retrieve(activeCartId, {
              fields: "+items.thumbnail,+items.total"
            })
            activeCart = cart
          } catch (e) {
            localStorage.removeItem("medusa_cart_id")
          }
        }

        if (!activeCart) {
          const { cart } = await sdk.store.cart.create({})
          localStorage.setItem("medusa_cart_id", cart.id)
          activeCart = cart
        }

        setCart(activeCart)
      } catch (err) {
        console.error("Failed to initialize store:", err)
      } finally {
        setLoading(false)
      }
    }

    initStore()
  }, [])

  // 2. Fetch shipping methods when checkout is opened
  useEffect(() => {
    if (!checkoutOpen || !cart) return

    async function loadShippingOptions() {
      try {
        const { shipping_options } = await sdk.client.fetch<any>("/store/shipping-options", {
          query: { cart_id: cart.id }
        })
        setShippingOptions(shipping_options)
        if (shipping_options.length > 0) {
          setSelectedShippingOption(shipping_options[0].id)
        }
      } catch (err) {
        console.error("Failed to load shipping options:", err)
      }
    }

    loadShippingOptions()
  }, [checkoutOpen, cart])

  // 3. Load Google Pay SDK dynamically
  useEffect(() => {
    if (!checkoutOpen || typeof window === "undefined") return

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
  }, [checkoutOpen])

  // 4. Render Google Pay Button
  useEffect(() => {
    if (!gpayLoaded || !gpayContainerRef.current || !isVerified) return

    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || "TEST",
    })

    const button = paymentsClient.createButton({
      buttonColor: "black",
      buttonType: "plain",
      buttonSizeMode: "fill",
      onClick: () => handleGPayPayment(paymentsClient),
    })

    gpayContainerRef.current.replaceChildren(button)
  }, [gpayLoaded, isVerified, selectedShippingOption, shippingAddress])

  // Cart Operations
  const handleAddToCart = async (productId: string) => {
    if (!cart) return
    const variantId = selectedVariants[productId]
    if (!variantId) return

    setAddingToCart(productId)
    try {
      const { cart: updatedCart } = await sdk.store.cart.createLineItem(
        cart.id,
        {
          variant_id: variantId,
          quantity: 1,
        }
      )
      setCart(updatedCart)
      setCartOpen(true) // slide open the cart drawer
    } catch (err) {
      console.error("Failed to add to cart:", err)
    } finally {
      setAddingToCart(null)
    }
  }

  const handleUpdateQuantity = async (lineItemId: string, currentQty: number, change: number) => {
    if (!cart) return
    const newQty = currentQty + change
    if (newQty < 1) return

    try {
      const { cart: updatedCart } = await sdk.store.cart.updateLineItem(
        cart.id,
        lineItemId,
        { quantity: newQty }
      )
      setCart(updatedCart)
    } catch (err) {
      console.error("Failed to update item quantity:", err)
    }
  }

  const handleRemoveItem = async (lineItemId: string) => {
    if (!cart) return
    try {
      const { cart: updatedCart } = await sdk.store.cart.deleteLineItem(cart.id, lineItemId)
      setCart(updatedCart)
    } catch (err) {
      console.error("Failed to remove item from cart:", err)
    }
  }

  // OTP Operations
  const handleSendOTP = async () => {
    if (!phoneOrEmail) return
    setVerifying(true)
    setOtpMessage("")

    const isEmail = phoneOrEmail.includes("@")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isEmail ? "email" : "phone",
          identifier: phoneOrEmail,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setOtpSent(true)
        setOtpMessage("A 6-digit verification code has been sent.")
      } else {
        setOtpMessage(data.message || "Failed to send code. Please try again.")
      }
    } catch (err) {
      setOtpMessage("Error connecting to server.")
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode) return
    setVerifying(true)
    setOtpMessage("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: phoneOrEmail,
          otp: otpCode,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setIsVerified(true)
        setOtpMessage("Verified successfully!")
        
        // Auto fill address values if returning customer
        if (data.customer) {
          const cust = data.customer
          const address = cust.addresses?.[0] || {}
          
          setShippingAddress({
            first_name: cust.first_name || "Customer",
            last_name: cust.last_name || "Profile",
            address_1: address.address_1 || "",
            city: address.city || "",
            province: address.province || "",
            postal_code: address.postal_code || "",
            phone: cust.phone || phoneOrEmail.includes("@") ? "" : phoneOrEmail,
            email: cust.email || phoneOrEmail.includes("@") ? phoneOrEmail : ""
          })
        } else {
          // New customer, just preset identifier
          setShippingAddress(prev => ({
            ...prev,
            phone: phoneOrEmail.includes("@") ? "" : phoneOrEmail,
            email: phoneOrEmail.includes("@") ? phoneOrEmail : ""
          }))
        }
      } else {
        setOtpMessage(data.message || "Invalid OTP code.")
      }
    } catch (err) {
      setOtpMessage("Error verifying OTP.")
    } finally {
      setVerifying(false)
    }
  }

  // Google Pay Payment Execution
  const handleGPayPayment = async (paymentsClient: any) => {
    if (placingOrder) return
    setPlacingOrder(true)

    // Complete Shipping Information in Medusa
    try {
      // 1. Set Shipping Address on Cart
      const { cart: cartWithAddress } = await sdk.store.cart.update(cart.id, {
        email: shippingAddress.email || `${shippingAddress.phone}@sravie-customer.in`,
        shipping_address: {
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          address_1: shippingAddress.address_1,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postal_code: shippingAddress.postal_code,
          phone: shippingAddress.phone,
          country_code: "in",
        }
      })

      // 2. Select Shipping Method
      const { cart: cartWithShipping } = await sdk.store.cart.addShippingMethod(cart.id, {
        option_id: selectedShippingOption
      })

      // 3. Create Payment Sessions
      const { cart: cartWithPayment } = await sdk.store.payment.initiatePaymentSession(cartWithShipping, {
        provider_id: "pp_googlepay_googlepay"
      })

      // 4. Fire GPay Sheet Overlay
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
          totalPrice: cartWithShipping.total.toFixed(2),
          currencyCode: (cartWithShipping.currency_code || "INR").toUpperCase(),
          countryCode: "IN",
        },
        merchantInfo: {
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "12345678901234567890",
          merchantName: "Sravi Enterprises",
        },
      }

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest)

      if (paymentData) {
        // Complete the order
        const order = await sdk.store.cart.complete(cart.id)
        localStorage.removeItem("medusa_cart_id")
        alert("🎉 Order placed successfully!")
        window.location.reload()
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Payment authorization failed.")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-40 glass-panel border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Sravi Enterprises</h1>
        </div>
        <button 
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <ShoppingBag className="w-6 h-6" />
          {cart && cart.items && cart.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="px-4 py-8 text-center max-w-lg mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 rounded-full">Organic Wellness</span>
        <h2 className="text-3xl font-extrabold mt-3 tracking-tight">Pure Healing Balms</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Mobile-first ordering for Sravi Enterprises' signature wellness collection.</p>
      </section>

      {/* 3. Products Grid */}
      <section className="px-4 max-w-lg mx-auto flex flex-col gap-6">
        {products.map((product) => (
          <div key={product.id} className="glass-panel rounded-2xl overflow-hidden p-4 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4">
              {product.thumbnail && (
                <img 
                  src={product.thumbnail} 
                  alt={product.title} 
                  className="w-24 h-24 object-cover rounded-xl bg-slate-100"
                />
              )}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base leading-tight">{product.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                </div>
                <div className="font-extrabold text-lg text-slate-900 dark:text-white">
                  ₹{product.variants?.[0]?.prices?.[0]?.amount || "400.00"}
                </div>
              </div>
            </div>

            {/* Touch Friendly Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariants(prev => ({ ...prev, [product.id]: variant.id }))}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                      selectedVariants[product.id] === variant.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            )}

            {/* Add To Cart */}
            <button
              onClick={() => handleAddToCart(product.id)}
              disabled={addingToCart === product.id}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {addingToCart === product.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Add to Cart <Plus className="w-4 h-4" /></>
              )}
            </button>
          </div>
        ))}
      </section>

      {/* 4. Bottom-Sheet Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
          <div className="absolute inset-0" onClick={() => setCartOpen(false)} />
          <div className="glass-panel w-full max-h-[85vh] rounded-t-[24px] overflow-hidden flex flex-col animate-slide-up z-10 shadow-2xl">
            
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Close</button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {!cart || !cart.items || cart.items.length === 0 ? (
                <div className="py-12 text-center text-slate-400">Your cart is empty.</div>
              ) : (
                cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.title} className="w-16 h-16 object-cover rounded-xl" />
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-slate-400">₹{item.unit_price} each</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            className="p-1 rounded hover:bg-white dark:hover:bg-slate-900"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-semibold px-2">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            className="p-1 rounded hover:bg-white dark:hover:bg-slate-900"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-600 p-2 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            {cart && cart.items && cart.items.length > 0 && (
              <div className="p-5 border-t bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Subtotal</span>
                  <span>₹{cart.items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0)}</span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false)
                    setCheckoutOpen(true)
                  }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  Checkout <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Full Screen Checkout Overlay */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-fade-in flex flex-col">
          
          {/* Checkout Header */}
          <header className="sticky top-0 z-10 glass-panel border-b px-4 py-3 flex items-center justify-between">
            <button onClick={() => setCheckoutOpen(false)} className="text-slate-500 hover:text-slate-700 font-semibold text-sm">← Back</button>
            <h3 className="font-bold text-base">Checkout</h3>
            <div className="w-10"></div>
          </header>

          <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">
            
            {/* Step 1: Verification Form */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
              <h4 className="font-bold text-base flex items-center gap-2 text-blue-600">
                <MapPin className="w-5 h-5" /> 1. Verification
              </h4>
              
              {!isVerified ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500">Sign in with WhatsApp number or Email to verify details & auto-fill billing.</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="WhatsApp (e.g. 9198765...) or Email"
                      value={phoneOrEmail}
                      disabled={otpSent}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      className="flex-1 h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                    />
                    {!otpSent && (
                      <button
                        onClick={handleSendOTP}
                        disabled={verifying || !phoneOrEmail}
                        className="px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center"
                      >
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                      </button>
                    )}
                  </div>

                  {otpSent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="flex-1 h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                      />
                      <button
                        onClick={handleVerifyOTP}
                        disabled={verifying || !otpCode}
                        className="px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center"
                      >
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                  )}

                  {otpMessage && (
                    <p className={`text-xs font-semibold ${otpMessage.includes("Verified") ? "text-green-600" : "text-slate-500"}`}>
                      {otpMessage}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950/20 text-green-600 rounded-xl p-3 flex items-center gap-2 text-sm font-semibold">
                  <Check className="w-5 h-5 shrink-0" /> Verified successfully as {phoneOrEmail}
                </div>
              )}
            </div>

            {/* Step 2: Shipping Form */}
            {isVerified && (
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-base flex items-center gap-2 text-blue-600">
                  <MapPin className="w-5 h-5" /> 2. Delivery Address
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={shippingAddress.first_name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, first_name: e.target.value }))}
                    className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={shippingAddress.last_name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, last_name: e.target.value }))}
                    className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={shippingAddress.address_1}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, address_1: e.target.value }))}
                  className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                />

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, province: e.target.value }))}
                    className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="h-11 px-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Shipping Method Selection */}
            {isVerified && shippingOptions.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-base flex items-center gap-2 text-blue-600">
                  <Truck className="w-5 h-5" /> 3. Shipping Method
                </h4>
                
                <div className="flex flex-col gap-2">
                  {shippingOptions.map((option) => (
                    <label 
                      key={option.id}
                      className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                        selectedShippingOption === option.id
                          ? "border-blue-600 bg-blue-50/10"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          checked={selectedShippingOption === option.id}
                          onChange={() => setSelectedShippingOption(option.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold">{option.name}</span>
                      </div>
                      <span className="text-sm font-bold">₹{option.amount}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review & Payment */}
            {isVerified && selectedShippingOption && (
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-base flex items-center gap-2 text-blue-600">
                  <CreditCard className="w-5 h-5" /> 4. Payment
                </h4>
                
                <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cart Subtotal</span>
                    <span className="font-semibold">₹{cart?.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span className="font-semibold">
                      ₹{shippingOptions.find(o => o.id === selectedShippingOption)?.amount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>
                      ₹{((cart?.total || 0) + (shippingOptions.find(o => o.id === selectedShippingOption)?.amount || 0))}
                    </span>
                  </div>
                </div>

                {/* Google Pay Button Container */}
                <div className="w-full mt-4">
                  <div 
                    ref={gpayContainerRef}
                    className="w-full h-12 rounded overflow-hidden shadow-sm"
                  />
                  {placingOrder && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing order...
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  )
}
