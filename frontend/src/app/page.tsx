"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Truck, PackageCheck, Clock } from "lucide-react"
import { sdk } from "../lib/medusa"
import { Header } from "../components/Header"
import { Hero } from "../components/Hero"
import { ProductCard } from "../components/ProductCard"
import { CartDrawer } from "../components/CartDrawer"
import { CheckoutOverlay } from "../components/CheckoutOverlay"
import { Footer } from "../components/Footer"
import { useCustomer } from "../lib/providers/customer-provider"

export default function Home() {
  const [theme, setTheme] = useState<string>('nord')
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { customer, isLoading: loadingCustomer } = useCustomer()
  const router = useRouter()
  
  // Variant Selection State
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  
  // Stepped Checkout State
  const [checkoutStep, setCheckoutStep] = useState<number>(1)
  const [billingSameAsShipping, setBillingSameAsShipping] = useState<boolean>(true)
  const [billingAddress, setBillingAddress] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    city: "",
    province: "",
    postal_code: "",
    phone: ""
  })
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false)
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<string>("googlepay") // "googlepay" or "manual"

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

  // Google Pay specific references
  const [gpayLoaded, setGpayLoaded] = useState(false)
  const gpayContainerRef = useRef<HTMLDivElement | null>(null)

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "nord"
    setTheme(savedTheme)
    document.documentElement.setAttribute("data-theme", savedTheme)
  }, [])

  // Theme Management Selector Helper
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  // 1. Initial Seeding and Catalog Load
  useEffect(() => {
    async function initStore() {
      try {
        // Fetch regions to get pricing context
        const { regions } = await sdk.store.region.list()
        const defaultRegionCode = process.env.NEXT_PUBLIC_DEFAULT_REGION || "in"
        const indiaRegion = regions.find((r: any) => 
          r.countries?.some((c: any) => c.iso_2 === defaultRegionCode)
        ) || regions[0]

        // Fetch products with calculated prices in region context
        const { products } = await sdk.store.product.list({
          region_id: indiaRegion?.id,
          fields: "*variants.calculated_price,*type,*collection"
        })
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
            // If the retrieved cart belongs to a different region, discard and recreate
            if (indiaRegion?.id && cart.region_id !== indiaRegion.id) {
              localStorage.removeItem("medusa_cart_id")
              activeCart = null
            } else {
              activeCart = cart
            }
          } catch (e) {
            localStorage.removeItem("medusa_cart_id")
          }
        }

        if (!activeCart) {
          const { cart } = await sdk.store.cart.create({
            region_id: indiaRegion?.id
          })
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

  // Handle auto-opening checkout from a redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get("checkout") === "true") {
        if (!loadingCustomer && customer) {
          const hasEmail = !!customer.email;
          const hasPhone = !!customer.phone;
          const hasFirstName = !!customer.first_name;
          const hasLastName = !!customer.last_name;
          if ((hasEmail || hasPhone) && hasFirstName && hasLastName) {
            setCheckoutOpen(true)
            
            // Clean up URL so it doesn't re-trigger on refresh
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
          }
        }
      }
    }
  }, [customer, loadingCustomer])

  // Load Google Pay SDK dynamically
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

  // Google Pay Payment Execution
  const handleGPayPayment = async (paymentsClient: any) => {
    if (placingOrder) return
    setPlacingOrder(true)

    try {
      // 1. Create Payment Session
      try {
        await sdk.store.payment.initiatePaymentSession(cart, {
          provider_id: "pp_googlepay_googlepay"
        })
      } catch (sessionErr: any) {
        // If the session is already created but Medusa throws a deletion error, we can still safely proceed
        if (sessionErr.message && sessionErr.message.includes("delete all payment sessions")) {
          console.warn("Payment session exists, proceeding to payment window...", sessionErr)
        } else {
          throw sessionErr
        }
      }

      // 2. Fire GPay Sheet Overlay
      const totalPrice = (cart.total || 0).toFixed(2)
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
          totalPrice: totalPrice,
          currencyCode: (cart.currency_code || "INR").toUpperCase(),
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
        const orderRes = await sdk.store.cart.complete(cart.id)
        localStorage.removeItem("medusa_cart_id")
        
        if (orderRes.type === "order") {
          setCheckoutOpen(false)
          router.push(`/account/orders/${orderRes.order.id}`)
        } else {
          setCheckoutStep(5)
        }
      }
    } catch (err: any) {
      console.error(err)
      
      // Silently ignore if the user simply closed the Google Pay window
      if (err.statusCode === "CANCELED" || (err.message && err.message.includes("closed the Payment Request UI"))) {
        return
      }
      
      alert("Payment authorization failed. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 text-base-content">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content pb-20 relative">
      <Header 
        theme={theme}
        handleThemeChange={handleThemeChange}
        cart={cart}
        setCartOpen={setCartOpen}
      />
      
      {/* Promotional Banner */}
      <div className="w-full max-w-6xl mx-auto relative mt-2 px-4 mb-8">
        <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg border border-base-200 group">
          <img src="/Sreleela 1.png" alt="Promotional Banner" className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
            <h2 className="text-white text-2xl md:text-4xl font-extrabold tracking-tight mb-2">Premium Experience</h2>
            <p className="text-white/90 text-sm md:text-base font-medium max-w-md">Discover our latest collection featuring exclusive designs and unmatched quality.</p>
          </div>
        </div>
      </div>

      {/* Shipping Features */}
      <section className="px-4 max-w-6xl mx-auto grid grid-cols-3 gap-4 md:gap-8 mb-12">
        <div className="flex flex-col items-center text-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 transition-shadow hover:shadow-md">
          <Truck className="w-8 h-8 md:w-10 md:h-10 text-primary mb-3 opacity-90" />
          <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider opacity-80">Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center text-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 transition-shadow hover:shadow-md">
          <PackageCheck className="w-8 h-8 md:w-10 md:h-10 text-primary mb-3 opacity-90" />
          <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider opacity-80">Secure Pack</span>
        </div>
        <div className="flex flex-col items-center text-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 transition-shadow hover:shadow-md">
          <Clock className="w-8 h-8 md:w-10 md:h-10 text-primary mb-3 opacity-90" />
          <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider opacity-80">24/7 Support</span>
        </div>
      </section>

      {Object.entries(
        products.reduce((acc: any, product: any) => {
          const collectionStr = product.collection?.title || "Other Products";
          if (!acc[collectionStr]) acc[collectionStr] = [];
          acc[collectionStr].push(product);
          return acc;
        }, {})
      ).map(([collectionStr, collectionProducts]: [string, any], index) => {
        const collectionMetadata = collectionProducts[0]?.collection?.metadata || {};
        return (
          <div key={collectionStr} className={`max-w-6xl mx-4 xl:mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start border border-base-300 rounded-3xl bg-base-100 shadow-sm ${index > 0 ? "mt-12" : "mt-8 mb-12"}`}>
            {/* Left Pane: Metadata */}
            <div className="w-full md:w-5/12 md:sticky top-24">
              <Hero 
                pillText={collectionStr}
                title={collectionMetadata.Header}
                metadata={collectionMetadata}
              />
            </div>
            
            {/* Right Pane: Products listing (vertical stack) */}
            <div className="w-full md:w-7/12 flex flex-col gap-6 pt-4 md:pt-8">
            {collectionProducts.map((product: any) => (
              <ProductCard 
                key={product.id}
                product={product}
                activeVariantId={selectedVariants[product.id] || product.variants?.[0]?.id}
                onChangeVariant={(variantId) => setSelectedVariants(prev => ({ ...prev, [product.id]: variantId }))}
                onAddToCart={handleAddToCart}
                addingToCart={addingToCart}
              />
            ))}
            </div>
          </div>
        );
      })}

      {/* Cart bottom-sheet */}
      <CartDrawer 
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        handleUpdateQuantity={handleUpdateQuantity}
        handleRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setCartOpen(false)
          
          if (loadingCustomer) return;
          
          if (!customer) {
            window.location.href = "/account/login?redirect=/?checkout=true";
            return;
          }
          
          // Check if user has all required basic details
          const hasEmail = !!customer.email;
          const hasPhone = !!customer.phone;
          const hasFirstName = !!customer.first_name;
          const hasLastName = !!customer.last_name;
          
          // They need at least (email or phone) and (first name and last name)
          // To be safe, if they don't have first/last name, we redirect them to login capture flow
          if ((!hasEmail && !hasPhone) || !hasFirstName || !hasLastName) {
            window.location.href = "/account/login?redirect=/?checkout=true";
            return;
          }
          
          setCheckoutOpen(true)
        }}
      />

      {/* 4-Step Checkout Overlay */}
      <CheckoutOverlay 
        checkoutOpen={checkoutOpen}
        setCheckoutOpen={setCheckoutOpen}
        cart={cart}
        setCart={setCart}
        theme={theme}
        handleThemeChange={handleThemeChange}
        
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        billingSameAsShipping={billingSameAsShipping}
        setBillingSameAsShipping={setBillingSameAsShipping}
        
        shippingAddress={shippingAddress}
        setShippingAddress={setShippingAddress}
        billingAddress={billingAddress}
        setBillingAddress={setBillingAddress}
        
        shippingOptions={shippingOptions}
        setShippingOptions={setShippingOptions}
        selectedShippingOption={selectedShippingOption}
        setSelectedShippingOption={setSelectedShippingOption}
        
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
        selectedPaymentProvider={selectedPaymentProvider}
        setSelectedPaymentProvider={setSelectedPaymentProvider}
        
        placingOrder={placingOrder}
        setPlacingOrder={setPlacingOrder}
        gpayContainerRef={gpayContainerRef}
        handleGPayPayment={handleGPayPayment}
        gpayLoaded={gpayLoaded}
      />

      <Footer />
    </main>
  )
}
