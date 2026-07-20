"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { sdk } from "../medusa"

interface CustomerContextType {
  customer: any | null
  setCustomer: React.Dispatch<React.SetStateAction<any | null>>
  isLoading: boolean
  error?: string | null
  logout: () => Promise<void>
  fetchCustomer: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomer = async () => {
    try {
      const savedToken = localStorage.getItem("medusa_auth_token")
      
      if (!savedToken) {
        setCustomer(null)
        setError(null)
        setIsLoading(false)
        return
      }

      // Bypassing Next.js/Browser aggressive caching and SDK header mangling by utilizing native fetch directly
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      
      const url = new URL("/store/customers/me", backendUrl)
      url.searchParams.set("fields", "id,first_name,last_name,email,phone,*addresses,orders,metadata")
      
      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${savedToken}`,
          ...(pubKey ? { "x-publishable-api-key": pubKey } : {}),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        cache: "no-store"
      })
      
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 401) {
          localStorage.removeItem("medusa_auth_token")
          await sdk.client.clearToken()
          setCustomer(null)
          setError(null)
          return
        }
        console.error(`Failed to fetch customer: ${res.status} ${res.statusText}`, errText)
        throw new Error(`API Error: ${res.status} - ${errText}`)
      }
      
      const data = await res.json()
      
      setCustomer(data.customer)
      setError(null)
      
    } catch (error: any) {
      console.error("fetchCustomer exception:", error)
      setError(error.message || "Failed to fetch customer profile")
      setCustomer(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("medusa_auth_token")
    if (savedToken) {
      sdk.client.setToken(savedToken)
    }
    fetchCustomer()
  }, [])

  const logout = async () => {
    try {
      localStorage.removeItem("medusa_auth_token")
      await sdk.client.clearToken()
      setCustomer(null)
      window.location.href = "/" // hard refresh to clear state
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <CustomerContext.Provider value={{ customer, setCustomer, isLoading, error, logout, fetchCustomer }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider")
  }
  return context
}
