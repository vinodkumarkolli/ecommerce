import React, { useEffect } from "react"
import { ArrowLeft, Truck, MapPin, CreditCard, Check, Loader2 } from "lucide-react"
import { sdk } from "../lib/medusa"
import { OrderSummary } from "./OrderSummary"

interface CheckoutOverlayProps {
  checkoutOpen: boolean
  setCheckoutOpen: (open: boolean) => void
  cart: any
  setCart: (cart: any) => void
  theme: string
  handleThemeChange: (newTheme: string) => void
  
  checkoutStep: number
  setCheckoutStep: React.Dispatch<React.SetStateAction<number>>
  billingSameAsShipping: boolean
  setBillingSameAsShipping: React.Dispatch<React.SetStateAction<boolean>>
  
  shippingAddress: {
    first_name: string
    last_name: string
    address_1: string
    city: string
    province: string
    postal_code: string
    phone: string
    email: string
  }
  setShippingAddress: React.Dispatch<React.SetStateAction<{
    first_name: string
    last_name: string
    address_1: string
    city: string
    province: string
    postal_code: string
    phone: string
    email: string
  }>>
  billingAddress: {
    first_name: string
    last_name: string
    address_1: string
    city: string
    province: string
    postal_code: string
    phone: string
  }
  setBillingAddress: React.Dispatch<React.SetStateAction<{
    first_name: string
    last_name: string
    address_1: string
    city: string
    province: string
    postal_code: string
    phone: string
  }>>
  
  shippingOptions: any[]
  setShippingOptions: React.Dispatch<React.SetStateAction<any[]>>
  selectedShippingOption: string
  setSelectedShippingOption: React.Dispatch<React.SetStateAction<string>>
  
  termsAccepted: boolean
  setTermsAccepted: React.Dispatch<React.SetStateAction<boolean>>
  selectedPaymentProvider: string
  setSelectedPaymentProvider: React.Dispatch<React.SetStateAction<string>>
  
  placingOrder: boolean
  setPlacingOrder: React.Dispatch<React.SetStateAction<boolean>>
  gpayContainerRef: React.RefObject<HTMLDivElement | null>
  handleGPayPayment: (paymentsClient: any) => Promise<void>
  gpayLoaded: boolean
}

export const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({
  checkoutOpen,
  setCheckoutOpen,
  cart,
  setCart,
  theme,
  handleThemeChange,
  
  checkoutStep,
  setCheckoutStep,
  billingSameAsShipping,
  setBillingSameAsShipping,
  
  shippingAddress,
  setShippingAddress,
  billingAddress,
  setBillingAddress,
  
  shippingOptions,
  setShippingOptions,
  selectedShippingOption,
  setSelectedShippingOption,
  
  termsAccepted,
  setTermsAccepted,
  selectedPaymentProvider,
  setSelectedPaymentProvider,
  
  placingOrder,
  setPlacingOrder,
  gpayContainerRef,
  handleGPayPayment,
  gpayLoaded,
}) => {

  // Render Google Pay Button when on Step 4 and GPay is selected
  useEffect(() => {
    if (!gpayLoaded || !gpayContainerRef.current || checkoutStep !== 4 || selectedPaymentProvider !== "googlepay") return

    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || "TEST",
    })

    const button = paymentsClient.createButton({
      buttonColor: theme === "dracula" ? "white" : "black",
      buttonType: "buy",
      buttonSizeMode: "fill",
      onClick: () => handleGPayPayment(paymentsClient),
    })

    gpayContainerRef.current.replaceChildren(button)
  }, [gpayLoaded, checkoutStep, selectedPaymentProvider, theme, checkoutOpen, termsAccepted])

  const loadShippingOptions = async (cartId: string) => {
    try {
      const { shipping_options } = await sdk.client.fetch<any>("/store/shipping-options", {
        query: { cart_id: cartId }
      })
      const enabledOptions = (shipping_options || []).filter((o: any) => 
        o.rules && o.rules.some((r: any) => r.attribute === "enabled_in_store" && r.value === "true")
      )
      setShippingOptions(enabledOptions)
      if (enabledOptions.length > 0) {
        setSelectedShippingOption(enabledOptions[0].id)
      }
    } catch (err) {
      console.error("Failed to load shipping options:", err)
    }
  }

  const handleProceedToStep2 = async () => {
    if (!shippingAddress.first_name || !shippingAddress.last_name || !shippingAddress.address_1 || !shippingAddress.city || !shippingAddress.province || !shippingAddress.postal_code || !shippingAddress.phone || !shippingAddress.email) {
      alert("Please fill in all shipping details.")
      return
    }
    if (!selectedShippingOption) {
      alert("Please select a shipping method.")
      return
    }
    
    setPlacingOrder(true)
    try {
      const updateData: any = {
        email: shippingAddress.email,
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
      }

      if (billingSameAsShipping) {
        updateData.billing_address = { ...updateData.shipping_address }
      }

      const { cart: updatedCart } = await sdk.store.cart.update(cart.id, updateData)
      
      const { cart: cartWithShipping } = await sdk.store.cart.addShippingMethod(cart.id, {
        option_id: selectedShippingOption
      })
      
      setCart(cartWithShipping)
      setCheckoutStep(2)
    } catch (err: any) {
      console.error(err)
      alert("Failed to save shipping information. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleProceedToStep3 = async () => {
    if (billingSameAsShipping) {
      setCheckoutStep(3)
      return
    }

    if (!billingAddress.first_name || !billingAddress.last_name || !billingAddress.address_1 || !billingAddress.city || !billingAddress.province || !billingAddress.postal_code || !billingAddress.phone) {
      alert("Please fill in all billing details.")
      return
    }

    setPlacingOrder(true)
    try {
      const { cart: updatedCart } = await sdk.store.cart.update(cart.id, {
        billing_address: {
          first_name: billingAddress.first_name,
          last_name: billingAddress.last_name,
          address_1: billingAddress.address_1,
          city: billingAddress.city,
          province: billingAddress.province,
          postal_code: billingAddress.postal_code,
          phone: billingAddress.phone,
          country_code: "in",
        }
      })
      setCart(updatedCart)
      setCheckoutStep(3)
    } catch (err: any) {
      console.error(err)
      alert("Failed to save billing information. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleProceedToStep4 = () => {
    setCheckoutStep(4)
  }

  const handlePlaceOrderManual = async () => {
    if (placingOrder) return
    if (!termsAccepted) {
      alert("Please accept the terms and conditions.")
      return
    }
    setPlacingOrder(true)
    try {
      await sdk.store.payment.initiatePaymentSession(cart, {
        provider_id: "pp_system_default"
      })
      await sdk.store.cart.complete(cart.id)
      localStorage.removeItem("medusa_cart_id")
      alert("🎉 Order placed successfully!")
      window.location.reload()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to place order. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (!checkoutOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-base-200 text-base-content overflow-y-auto animate-fade-in flex flex-col">
      
      {/* Checkout Header */}
      <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setCheckoutOpen(false)} 
          className="btn btn-ghost btn-sm flex items-center gap-1.5 cursor-pointer font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h3 className="font-bold text-lg">Checkout</h3>
        
        {/* Symmetrical Theme Dropdown */}
        <select 
          value={theme} 
          onChange={(e) => handleThemeChange(e.target.value)} 
          className="select select-bordered select-xs w-28 bg-base-100 border-base-300 text-xs rounded-xl"
        >
          <option value="nord">❄️ Nord</option>
          <option value="dracula">🧛 Dracula</option>
        </select>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: The Active Step Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Steps Progress Header */}
          {/* Steps Progress Header - Desktop */}
          <div className="hidden md:flex justify-between items-center bg-base-100 p-4 rounded-2xl shadow-sm gap-2">
            {[
              { step: 1, label: "Shipping" },
              { step: 2, label: "Billing" },
              { step: 3, label: "Payment" },
              { step: 4, label: "Review" }
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  checkoutStep >= s.step 
                    ? "bg-[#5e81ac] text-white" 
                    : "bg-base-300 text-base-content/40"
                }`}>
                  {s.step}
                </span>
                <span className={`text-xs font-bold ${
                  checkoutStep === s.step ? "text-[#5e81ac]" : "opacity-60"
                }`}>
                  {s.label}
                </span>
                {s.step < 4 && <span className="text-base-content/20 text-xs font-normal">→</span>}
              </div>
            ))}
          </div>

          {/* Steps Progress Header - Mobile */}
          <div className="flex md:hidden flex-col gap-2 w-full bg-base-100 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#5e81ac]">Step {checkoutStep} of 4</span>
              <span className="opacity-80">
                {checkoutStep === 1 && "Shipping Details"}
                {checkoutStep === 2 && "Billing Address"}
                {checkoutStep === 3 && "Payment Method"}
                {checkoutStep === 4 && "Review & Place Order"}
              </span>
            </div>
            <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#5e81ac] h-full transition-all duration-300" 
                style={{ width: `${(checkoutStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: Shipping Address */}
          {checkoutStep === 1 && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2 text-[#5e81ac]">
                <Truck className="w-5 h-5" /> 1. Shipping Address
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={shippingAddress.first_name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, first_name: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={shippingAddress.last_name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, last_name: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold opacity-70">Street Address</label>
                <input
                  type="text"
                  placeholder="123 Wellness Way"
                  value={shippingAddress.address_1}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, address_1: e.target.value }))}
                  className="input input-bordered w-full input-sm h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">City</label>
                  <input
                    type="text"
                    placeholder="Chennai"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">State</label>
                  <input
                    type="text"
                    placeholder="Tamil Nadu"
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, province: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">Pincode</label>
                  <input
                    type="text"
                    placeholder="600128"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">Phone Number</label>
                  <input
                    type="text"
                    placeholder="919876543210"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-70">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                    className="input input-bordered w-full input-sm h-11 rounded-xl"
                  />
                </div>
              </div>

              <label className="label cursor-pointer justify-start gap-3 mt-1">
                <input 
                  type="checkbox" 
                  checked={billingSameAsShipping} 
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="checkbox border-base-300 checked:bg-[#5e81ac] checked:border-[#5e81ac] checkbox-sm"
                />
                <span className="label-text font-semibold text-sm flex-1 whitespace-normal break-words">Billing Address is same as Shipping Address</span>
              </label>

              {/* Dynamic Shipping Options Sub-Step */}
              {shippingOptions.length > 0 && (
                <div className="flex flex-col gap-3 mt-2 border-t pt-4 border-base-300">
                  <h5 className="font-bold text-sm text-base-content/85">Select Delivery Option:</h5>
                  <div className="flex flex-col gap-2">
                    {shippingOptions.map((option) => (
                      <label 
                        key={option.id}
                        className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                          selectedShippingOption === option.id
                            ? "border-[#5e81ac] bg-[#5e81ac]/5"
                            : "border-base-300 hover:bg-base-300/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping_method"
                            checked={selectedShippingOption === option.id}
                            onChange={() => setSelectedShippingOption(option.id)}
                            className="radio border-base-300 checked:bg-[#5e81ac] checked:border-[#5e81ac] radio-sm"
                          />
                          <span className="text-sm font-semibold">{option.name}</span>
                        </div>
                        <span className="text-sm font-bold">₹{option.amount}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4">
                {shippingOptions.length === 0 ? (
                  <button
                    onClick={async () => {
                      if (!shippingAddress.first_name || !shippingAddress.address_1 || !shippingAddress.city || !shippingAddress.postal_code || !shippingAddress.email) {
                        alert("Please fill in address and contact details to see delivery options.")
                        return
                      }
                      setPlacingOrder(true)
                      try {
                        const { cart: updatedCart } = await sdk.store.cart.update(cart.id, {
                          email: shippingAddress.email,
                          shipping_address: {
                            first_name: shippingAddress.first_name,
                            last_name: shippingAddress.last_name || "",
                            address_1: shippingAddress.address_1,
                            city: shippingAddress.city,
                            province: shippingAddress.province || "",
                            postal_code: shippingAddress.postal_code,
                            phone: shippingAddress.phone || "",
                            country_code: "in",
                          }
                        })
                        await loadShippingOptions(updatedCart.id)
                      } catch (e) {
                        alert("Failed to load delivery options. Check address fields.")
                      } finally {
                        setPlacingOrder(false)
                      }
                    }}
                    disabled={placingOrder}
                    className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none font-bold rounded-xl"
                  >
                    {placingOrder ? <span className="loading loading-spinner"></span> : "Show Delivery Options"}
                  </button>
                ) : (
                  <button
                    onClick={handleProceedToStep2}
                    disabled={placingOrder}
                    className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none font-bold rounded-xl"
                  >
                    {placingOrder ? <span className="loading loading-spinner"></span> : "Next: Billing Address"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Billing Address */}
          {checkoutStep === 2 && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2 text-[#5e81ac]">
                <MapPin className="w-5 h-5" /> 2. Billing Address
              </h4>
              
              {billingSameAsShipping ? (
                <div className="bg-[#a3be8c]/15 text-[#a3be8c] border border-[#a3be8c]/25 rounded-xl p-4 text-sm font-semibold flex flex-col gap-2">
                  <span>✓ Billing Address matches your Shipping Address:</span>
                  <span className="opacity-95 font-medium pl-5 text-base-content/90">
                    {shippingAddress.first_name} {shippingAddress.last_name}, {shippingAddress.address_1}, {shippingAddress.city}, {shippingAddress.postal_code}
                  </span>
                  <button 
                    onClick={() => setBillingSameAsShipping(false)} 
                    className="btn btn-ghost btn-xs text-[#5e81ac] self-start font-bold underline mt-2"
                  >
                    Use a different billing address
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold opacity-70">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={billingAddress.first_name}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, first_name: e.target.value }))}
                        className="input input-bordered w-full input-sm h-11 rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold opacity-70">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={billingAddress.last_name}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, last_name: e.target.value }))}
                        className="input input-bordered w-full input-sm h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold opacity-70">Street Address</label>
                    <input
                      type="text"
                      placeholder="456 Commerce Rd"
                      value={billingAddress.address_1}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, address_1: e.target.value }))}
                      className="input input-bordered w-full input-sm h-11 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold opacity-70">City</label>
                      <input
                        type="text"
                        placeholder="Chennai"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="input input-bordered w-full input-sm h-11 rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold opacity-70">State</label>
                      <input
                        type="text"
                        placeholder="Tamil Nadu"
                        value={billingAddress.province}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, province: e.target.value }))}
                        className="input input-bordered w-full input-sm h-11 rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold opacity-70">Pincode</label>
                      <input
                        type="text"
                        placeholder="600128"
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="input input-bordered w-full input-sm h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold opacity-70">Phone Number</label>
                    <input
                      type="text"
                      placeholder="919876543210"
                      value={billingAddress.phone}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      className="input input-bordered w-full input-sm h-11 rounded-xl"
                    />
                  </div>

                  <button 
                    onClick={() => setBillingSameAsShipping(true)} 
                    className="btn btn-ghost btn-xs text-[#5e81ac] self-start font-bold mt-1"
                  >
                    ← Back to Same as Shipping Address
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3 mt-4">
                <button
                  onClick={() => setCheckoutStep(1)}
                  className="btn btn-ghost font-bold rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToStep3}
                  disabled={placingOrder}
                  className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none font-bold rounded-xl"
                >
                  {placingOrder ? <span className="loading loading-spinner"></span> : "Next: Payment Gateway"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Gateway */}
          {checkoutStep === 3 && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2 text-[#5e81ac]">
                <CreditCard className="w-5 h-5" /> 3. Payment Gateway Selection
              </h4>
              
              <div className="flex flex-col gap-3">
                <label 
                  className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition ${
                    selectedPaymentProvider === "googlepay"
                      ? "border-[#5e81ac] bg-[#5e81ac]/5"
                      : "border-base-300 hover:bg-base-300/40"
                  }`}
                  onClick={() => setSelectedPaymentProvider("googlepay")}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_gateway"
                      checked={selectedPaymentProvider === "googlepay"}
                      readOnly
                      className="radio border-base-300 checked:bg-[#5e81ac] checked:border-[#5e81ac] radio-sm"
                    />
                    <div>
                      <span className="font-bold text-sm block">Google Pay (UPI)</span>
                      <span className="text-xs opacity-75">Instant, secure mobile payments using cards or connected bank accounts.</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-3 mt-4">
                <button
                  onClick={() => setCheckoutStep(2)}
                  className="btn btn-ghost font-bold rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToStep4}
                  className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none font-bold rounded-xl"
                >
                  Next: Review Order
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Order & Accept Terms */}
          {checkoutStep === 4 && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm">
              <h4 className="font-bold text-lg flex items-center gap-2 text-[#5e81ac]">
                <Check className="w-5 h-5" /> 4. Review & Place Order
              </h4>
              
              {/* Summary Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-300/30 p-4 rounded-2xl text-sm">
                <div>
                  <span className="font-bold block opacity-70 text-xs uppercase tracking-wider mb-1">Shipping Details</span>
                  <span className="font-medium block">{shippingAddress.first_name} {shippingAddress.last_name}</span>
                  <span className="opacity-95 block">{shippingAddress.address_1}, {shippingAddress.city}</span>
                  <span className="opacity-95 block">PIN: {shippingAddress.postal_code}</span>
                  <span className="opacity-95 block">Phone: {shippingAddress.phone}</span>
                </div>

                <div>
                  <span className="font-bold block opacity-70 text-xs uppercase tracking-wider mb-1">Billing Details</span>
                  {billingSameAsShipping ? (
                    <span className="opacity-95 block">Same as shipping address</span>
                  ) : (
                    <>
                      <span className="font-medium block">{billingAddress.first_name} {billingAddress.last_name}</span>
                      <span className="opacity-95 block">{billingAddress.address_1}, {billingAddress.city}</span>
                      <span className="opacity-95 block">PIN: {billingAddress.postal_code}</span>
                    </>
                  )}
                </div>

                <div className="border-t pt-3 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 border-base-300">
                  <div>
                    <span className="font-bold block opacity-70 text-xs uppercase tracking-wider mb-1">Shipping Method</span>
                    <span className="font-semibold block text-[#5e81ac]">
                      {shippingOptions.find(o => o.id === selectedShippingOption)?.name || "Standard Delivery"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold block opacity-70 text-xs uppercase tracking-wider mb-1">Payment Method</span>
                    <span className="font-semibold block text-[#5e81ac]">
                      Google Pay (UPI)
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="label cursor-pointer justify-start gap-3 bg-base-100 p-4 rounded-xl shadow-sm border border-base-300">
                  <input 
                    type="checkbox" 
                    checked={termsAccepted} 
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="checkbox border-base-300 checked:bg-[#5e81ac] checked:border-[#5e81ac] checkbox-sm"
                  />
                  <span className="label-text text-xs md:text-sm font-semibold opacity-90 leading-tight flex-1 whitespace-normal break-words">
                    I agree to the <a href="/terms" target="_blank" className="text-[#5e81ac] underline hover:text-[#81a1c1] font-bold">Terms & Conditions</a>, <a href="/terms#refund-policy" target="_blank" className="text-[#5e81ac] underline hover:text-[#81a1c1] font-bold">Refund Policy</a>, and confirm my order details are correct.
                  </span>
                </label>
              </div>

              {/* Actions & Placing button */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setCheckoutStep(3)}
                    className="btn btn-ghost font-bold rounded-xl"
                  >
                    Back
                  </button>
                </div>

                {/* Google Pay Button container */}
                {selectedPaymentProvider === "googlepay" && (
                  <div className="w-full mt-2 border-t pt-4 border-base-300">
                    {!termsAccepted ? (
                      <div className="text-center p-3 text-xs font-semibold opacity-60 bg-base-300/40 rounded-xl">
                        Please check the Terms & Conditions checkbox above to enable Google Pay checkout.
                      </div>
                    ) : (
                      <div className="w-full">
                        <div 
                          ref={gpayContainerRef}
                          className="w-full h-12 rounded-xl overflow-hidden shadow-sm flex justify-center"
                        />
                        {placingOrder && (
                          <div className="flex items-center justify-center gap-2 text-sm opacity-70 mt-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#5e81ac]" /> Processing order...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        
        {/* Right Column: Order Summary Card */}
        <div className="md:col-span-1">
          <OrderSummary 
            cart={cart}
            selectedShippingOption={selectedShippingOption}
            shippingOptions={shippingOptions}
          />
        </div>

      </div>
    </div>
  )
}
