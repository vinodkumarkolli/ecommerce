"use client"

import React, { useEffect, useState, useRef } from "react"
import { sdk } from "../../../lib/medusa"
import { useCustomer } from "../../../lib/providers/customer-provider"
import { Header } from "../../../components/Header"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const { customer, isLoading, logout, setCustomer, error: providerError } = useCustomer()
  const [identifier, setIdentifier] = useState("")
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const [step, setStep] = useState<"identifier" | "otp" | "capture_contact" | "capture_basic" | "capture_address">("identifier")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Capture State
  const [contactInfo, setContactInfo] = useState("")
  const [basicDetails, setBasicDetails] = useState({ first_name: "", last_name: "", dob: "", gender: "" })
  const [address, setAddress] = useState({ address_name: "", custom_name: "", address_1: "", city: "", province: "", postal_code: "", country_code: "in" })

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const redirect = searchParams?.get("redirect") || "/account"

  // Resend OTP states
  const [timeLeft, setTimeLeft] = useState(90)
  const [resendCount, setResendCount] = useState(0)
  const MAX_RESENDS = 2

  useEffect(() => {
    if (window.location.search.includes("logout=true")) {
      logout()
    }
  }, [logout])

  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    }
  }, [step, timeLeft])

  // Determine stage if customer is logged in
  useEffect(() => {
    if (customer && !isLoading) {
      const hasEmail = !!customer.email
      const hasPhone = !!customer.phone
      const hasFirstName = !!customer.first_name
      const hasLastName = !!customer.last_name
      const hasAddress = customer.addresses && customer.addresses.length > 0

      if (!hasEmail || !hasPhone) {
        setStep("capture_contact")
      } else if (!hasFirstName || !hasLastName) {
        setStep("capture_basic")
      } else if (!hasAddress) {
        setStep("capture_address")
      } else {
        window.location.href = redirect
      }
      
      // Pre-fill state for Back navigation
      if (customer) {
        // Pre-fill contact info (the missing one)
        setContactInfo(prev => {
          if (prev) return prev
          return (customer.email && customer.phone) ? (customer.email === "missing" ? customer.email : customer.phone) : "" 
        })

        setBasicDetails(prev => ({
          ...prev,
          first_name: customer.first_name || prev.first_name,
          last_name: customer.last_name || prev.last_name,
          dob: customer.metadata?.dob || prev.dob,
          gender: customer.metadata?.gender || prev.gender
        }))

        if (customer.addresses && customer.addresses.length > 0) {
          const defaultAddress = customer.addresses[0]
          setAddress(prev => ({
            ...prev,
            address_name: defaultAddress.address_name || prev.address_name,
            address_1: defaultAddress.address_1 || prev.address_1,
            city: defaultAddress.city || prev.city,
            province: defaultAddress.province || prev.province,
            postal_code: defaultAddress.postal_code || prev.postal_code,
            country_code: defaultAddress.country_code || prev.country_code || "in"
          }))
        }
      }
    }
  }, [customer, isLoading, redirect])

  if (isLoading) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>
  if (customer && step === "identifier") {
    // We are evaluating steps, don't show login form again
    return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>
  }

  const handleSendOtp = async (e?: React.FormEvent, isResend = false) => {
    if (e) e.preventDefault()
    
    if (isResend) {
      if (resendCount >= MAX_RESENDS) {
        setError("Maximum resend attempts reached. Please try again later.")
        return
      }
      setResendCount(prev => prev + 1)
      setTimeLeft(90)
      setOtpValues(Array(6).fill(""))
      inputRefs.current[0]?.focus()
    } else {
      setResendCount(0)
      setTimeLeft(90)
      setOtpValues(Array(6).fill(""))
    }

    if (!identifier) {
      setError("Please enter your email or phone number")
      return
    }

    const isEmail = identifier.includes("@")
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(identifier)) {
        setError("Please enter a valid email address")
        return
      }
    } else {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(identifier)) {
        setError("Please enter a valid 10-digit Indian mobile number")
        return
      }
    }
    
    setLoading(true)
    setError("")

    try {
      await sdk.client.fetch("/store/otp/send", {
        method: "POST",
        body: { type: isEmail ? "email" : "phone", identifier }
      })
      if (!isResend) {
        setStep("otp")
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (code: string) => {
    if (code.length !== 6) return
    setLoading(true)
    setError("")
    try {
      const response = await sdk.client.fetch<any>("/store/otp/verify", {
        method: "POST",
        body: { identifier, otp: code }
      })
      if (response.token) {
        localStorage.setItem("medusa_auth_token", response.token)
        await sdk.client.setToken(response.token)
      }
      // Instead of manual redirect, reload so context picks up customer and orchestrates steps
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.")
      setOtpValues(Array(6).fill(""))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return
    const newOtp = [...otpValues]
    newOtp[index] = value.substring(value.length - 1)
    setOtpValues(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (value && index === 5) {
      const fullOtp = newOtp.join("")
      if (fullOtp.length === 6) verifyOtp(fullOtp)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pastedData) return
    const newOtp = [...otpValues]
    for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i]
    setOtpValues(newOtp)
    const nextIndex = pastedData.length < 6 ? pastedData.length : 5
    inputRefs.current[nextIndex]?.focus()
    if (pastedData.length === 6) verifyOtp(pastedData)
  }

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactInfo) {
      setError("Please enter the required information")
      return
    }
    
    if (customer.email) {
      // Must be a 10 digit Indian phone number
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(contactInfo)) {
        setError("Please enter a valid 10-digit Indian Whatsapp number")
        return
      }
    } else {
      // Must be an email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactInfo)) {
        setError("Please enter a valid email address")
        return
      }
    }
    
    setLoading(true)
    setError("")
    try {
      const updateData = customer.email ? { phone: contactInfo } : { email: contactInfo }
      const { customer: updated } = await sdk.store.customer.update(updateData)
      setCustomer(updated) // Will trigger useEffect to move to next step
    } catch (err: any) {
      setError(err.message || "Failed to update information")
    } finally {
      setLoading(false)
    }
  }

  const submitBasic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!basicDetails.first_name || !basicDetails.last_name) {
      setError("First and Last Name are required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const updateData = {
        first_name: basicDetails.first_name,
        last_name: basicDetails.last_name,
        metadata: {
          ...customer.metadata,
          dob: basicDetails.dob,
          gender: basicDetails.gender
        }
      }
      const { customer: updated } = await sdk.store.customer.update(updateData)
      setCustomer(updated)
    } catch (err: any) {
      setError(err.message || "Failed to update details")
    } finally {
      setLoading(false)
    }
  }



  const submitAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.address_1 || !address.city || !address.province || !address.postal_code || !address.country_code) {
      setError("Please fill all address fields")
      return
    }
    setLoading(true)
    setError("")
    try {
      let finalAddressName = address.address_name
      if (address.address_name === "Other") {
        finalAddressName = address.custom_name || "Other"
      } else if (!address.address_name) {
        // Fallback to Home - # sequence if nothing selected
        const existingCount = customer?.addresses?.length || 0
        finalAddressName = `Home - ${existingCount + 1}`
      }

      // Ensure no two addresses have is_primary: true
      const existingPrimary = customer?.addresses?.find((a: any) => a.metadata?.is_primary === true)
      if (existingPrimary) {
        await sdk.client.fetch(`/store/customers/me/addresses/${existingPrimary.id}`, {
          method: "POST",
          body: {
            metadata: { ...existingPrimary.metadata, is_primary: false }
          }
        })
      }

      const res = await sdk.store.customer.createAddress({
        address_name: finalAddressName,
        first_name: customer?.first_name || basicDetails.first_name,
        last_name: customer?.last_name || basicDetails.last_name,
        phone: customer?.phone || contactInfo,
        address_1: address.address_1,
        city: address.city,
        province: address.province,
        postal_code: address.postal_code,
        country_code: address.country_code,
        metadata: {
          is_primary: true
        }
      })
      
      // Next.js aggressive caching might return stale customer without the new address,
      // so we manually inject the new address into the state and force the redirect immediately.
      const freshCustomer = {
        ...customer,
        addresses: [...(customer?.addresses || []), (res as any)?.address || address]
      }
      setCustomer(freshCustomer)
      
      // Force navigation to the intended target since Step 3 is the final step
      window.location.href = redirect
    } catch (err: any) {
      setError(err.message || "Failed to add address")
    } finally {
      setLoading(false)
    }
  }

  const isCaptureStage = ["capture_contact", "capture_basic", "capture_address"].includes(step)
  
  const getCaptureStepNumber = () => {
    if (step === "capture_contact") return 1
    if (step === "capture_basic") return 2
    if (step === "capture_address") return 3
    return 1
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content">
      <Header theme="nord" handleThemeChange={() => {}} cart={{}} setCartOpen={() => {}} />
      
      {!isCaptureStage ? (
        <div className="flex-1 max-w-sm mx-auto w-full px-4 py-12">
          <div className="glass-panel p-8 rounded-2xl shadow-sm relative bg-base-100">
            {step === "otp" && (
              <button 
                onClick={() => setStep("identifier")} 
                className="absolute top-6 left-6 p-2 rounded-full hover:bg-base-200 transition"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 opacity-70" />
              </button>
            )}

            <h2 className="text-2xl font-bold mb-2 text-center text-base-content">Welcome Back</h2>
            <p className="text-sm opacity-70 text-center mb-6">Sign in to track orders and manage your account.</p>
            
            {(error || providerError) && <div className="bg-error text-error-content text-sm p-3 rounded-xl mb-4 font-bold shadow-sm">{error || providerError}</div>}

            {step === "identifier" && (
              <form onSubmit={(e) => handleSendOtp(e, false)} className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Email/Whatsapp #</span></label>
                  <input type="text" className="input input-bordered w-full h-12 rounded-xl" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn bg-primary hover:bg-primary/80 text-white border-none font-bold h-12 rounded-xl mt-2">
                  {loading ? <span className="loading loading-spinner"></span> : "Send OTP"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <div className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Enter 6-digit OTP</span></label>
                  <div className="flex justify-between gap-2 my-2" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        className="input input-bordered w-full h-12 rounded-xl text-center text-xl font-bold p-0"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        disabled={loading}
                      />
                    ))}
                  </div>
                  <label className="label flex flex-col items-center justify-center gap-1 mt-2 text-center">
                    <span className="label-text-alt opacity-70">Sent to {identifier}</span>
                    {resendCount < MAX_RESENDS && (
                      <div className="text-xs mt-1 font-semibold">
                        {timeLeft > 0 ? (
                          <span className="opacity-70">Resend in {timeLeft}s</span>
                        ) : (
                          <button type="button" onClick={() => handleSendOtp(undefined, true)} className="text-primary hover:underline" disabled={loading}>Resend OTP</button>
                        )}
                      </div>
                    )}
                    {resendCount >= MAX_RESENDS && (
                       <span className="text-xs text-error font-semibold mt-1">Maximum resend attempts reached.</span>
                    )}
                  </label>
                </div>
                {loading && <div className="flex justify-center mt-2"><span className="loading loading-spinner text-primary"></span></div>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-base-content px-2">Complete Profile</h2>
          
          {/* Steps Progress Header - Desktop */}
          <div className="hidden md:flex justify-between items-center bg-base-100 p-4 rounded-2xl shadow-sm gap-2">
            {[
              { step: 1, label: "Primary Communication" },
              { step: 2, label: "Basic Details" },
              { step: 3, label: "Address Details" }
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  getCaptureStepNumber() >= s.step 
                    ? "bg-primary text-white" 
                    : "bg-base-300 text-base-content/40"
                }`}>
                  {s.step}
                </span>
                <span className={`text-xs font-bold ${
                  getCaptureStepNumber() === s.step ? "text-primary" : "opacity-60"
                }`}>
                  {s.label}
                </span>
                {s.step < 3 && <span className="text-base-content/20 text-xs font-normal">→</span>}
              </div>
            ))}
          </div>

          {/* Steps Progress Header - Mobile */}
          <div className="flex md:hidden flex-col gap-2 w-full bg-base-100 p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-primary">
                Step {getCaptureStepNumber()} of 3
              </span>
              <span className="opacity-80">
                {getCaptureStepNumber() === 1 && "Primary Communication"}
                {getCaptureStepNumber() === 2 && "Basic Details"}
                {getCaptureStepNumber() === 3 && "Address Details"}
              </span>
            </div>
            <div className="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300" 
                style={{ width: `${Math.min((getCaptureStepNumber() / 3) * 100, 100)}%` }}
              />
            </div>
          </div>

          {error && <div className="bg-error text-error-content text-sm p-3 rounded-xl font-bold shadow-sm">{error}</div>}

          {/* Capture Stage Panels */}
          {step === "capture_contact" && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm bg-base-100">
              <form onSubmit={submitContact} className="flex flex-col gap-4">
                <div className="bg-primary/10 p-4 rounded-xl text-sm mb-2 font-medium border border-primary/20">
                  {customer?.email ? (
                    <span>Your Primary Email is <strong className="text-primary">{customer.email}</strong></span>
                  ) : (
                    <span>Your Primary Whatsapp is <strong className="text-primary">{customer.phone}</strong></span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">
                      {customer?.email ? "Primary Whatsapp # *" : "Primary Email *"}
                    </span>
                  </label>
                  <input 
                    type={customer?.email ? "tel" : "email"}
                    placeholder={customer?.email ? "10-digit mobile" : "john@example.com"}
                    className="input input-bordered w-full h-11 rounded-xl" 
                    value={contactInfo} 
                    onChange={(e) => setContactInfo(e.target.value)} 
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={loading} className="btn bg-primary hover:bg-primary/80 text-white border-none font-bold rounded-xl px-8">
                    {loading ? <span className="loading loading-spinner"></span> : "Next"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "capture_basic" && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm bg-base-100">
              <form onSubmit={submitBasic} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">First Name *</span></label>
                    <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={basicDetails.first_name} onChange={(e) => setBasicDetails(prev => ({...prev, first_name: e.target.value}))} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">Last Name *</span></label>
                    <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={basicDetails.last_name} onChange={(e) => setBasicDetails(prev => ({...prev, last_name: e.target.value}))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-xs">Date of Birth</span></label>
                    <input type="date" className="input input-bordered w-full h-11 rounded-xl text-sm" value={basicDetails.dob} onChange={(e) => setBasicDetails(prev => ({...prev, dob: e.target.value}))} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-xs">Gender</span></label>
                    <select className="select select-bordered w-full h-11 rounded-xl text-sm" value={basicDetails.gender} onChange={(e) => setBasicDetails(prev => ({...prev, gender: e.target.value}))}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button type="button" onClick={() => setStep("capture_contact")} disabled={loading} className="btn btn-ghost text-base-content/70 rounded-xl px-6">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn bg-primary hover:bg-primary/80 text-white border-none font-bold rounded-xl px-8">
                    {loading ? <span className="loading loading-spinner"></span> : "Next"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "capture_address" && (
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 shadow-sm bg-base-100">
              <form onSubmit={submitAddress} className="flex flex-col gap-4">
                
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Address Title</span></label>
                  <div className="flex gap-2">
                    {["Home", "Office", "Other"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`btn btn-sm rounded-full px-4 border ${address.address_name === tag ? "bg-primary text-white border-primary" : "bg-base-200 text-base-content border-transparent hover:bg-base-300"}`}
                        onClick={() => setAddress(prev => ({ ...prev, address_name: tag }))}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {address.address_name === "Other" && (
                    <input 
                      type="text" 
                      placeholder="e.g. My Beach House" 
                      className="input input-bordered w-full h-11 rounded-xl mt-3" 
                      required 
                      value={address.custom_name} 
                      onChange={(e) => setAddress(prev => ({...prev, custom_name: e.target.value}))} 
                    />
                  )}
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Address Line 1 *</span></label>
                  <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={address.address_1} onChange={(e) => setAddress(prev => ({...prev, address_1: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">City *</span></label>
                    <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={address.city} onChange={(e) => setAddress(prev => ({...prev, city: e.target.value}))} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">State *</span></label>
                    <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={address.province} onChange={(e) => setAddress(prev => ({...prev, province: e.target.value}))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">Pincode *</span></label>
                    <input type="text" className="input input-bordered w-full h-11 rounded-xl" required value={address.postal_code} onChange={(e) => setAddress(prev => ({...prev, postal_code: e.target.value}))} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">Country *</span></label>
                    <select className="select select-bordered w-full h-11 rounded-xl" required value={address.country_code} onChange={(e) => setAddress(prev => ({...prev, country_code: e.target.value}))}>
                      <option value="in">India</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button type="button" onClick={() => setStep("capture_basic")} disabled={loading} className="btn btn-ghost text-base-content/70 rounded-xl px-6">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn bg-primary hover:bg-primary/80 text-white border-none font-bold rounded-xl px-8">
                    {loading ? <span className="loading loading-spinner"></span> : "Complete Setup"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

