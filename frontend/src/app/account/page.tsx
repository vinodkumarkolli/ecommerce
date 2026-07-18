"use client"

import React, { useEffect, useState } from "react"
import { sdk } from "../../lib/medusa"
import { useCustomer } from "../../lib/providers/customer-provider"
import { Header } from "../../components/Header"
import { User, Mail, Phone, Calendar, LogOut, MapPin } from "lucide-react"

export default function AccountDashboard() {
  const { customer, setCustomer, isLoading, logout } = useCustomer()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: ""
  })

  useEffect(() => {
    if (!isLoading && !customer) {
      window.location.href = "/account/login"
    } else if (customer) {
      setFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        dob: customer.metadata?.dob || customer.profile?.dob || "",
        gender: customer.metadata?.gender || customer.profile?.gender || ""
      })
    }
  }, [customer, isLoading])

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      alert("Please provide both First Name and Last Name.")
      return
    }

    setSaving(true)
    try {
      // 1. Update Core Customer details and metadata
      await sdk.store.customer.update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        metadata: {
          ...(customer.metadata || {}),
          dob: formData.dob,
          gender: formData.gender
        }
      })

      // Construct the new metadata
      const newMetadata = {
        ...(customer.metadata || {}),
        dob: formData.dob,
        gender: formData.gender
      }

      setCustomer((prev: any) => ({ ...prev, first_name: formData.first_name, last_name: formData.last_name, metadata: newMetadata }))
      alert("Profile updated successfully")
    } catch (err) {
      console.error(err)
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !customer) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>

  return (
    <div className="flex flex-col min-h-screen">
      <Header theme="nord" handleThemeChange={() => {}} cart={{}} setCartOpen={() => {}} />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 shadow-sm mb-4">
            <div>
              <h3 className="font-bold text-base-content leading-tight">
                {customer.first_name || "John"} {customer.last_name || "Doe"}
              </h3>
              <p className="text-xs opacity-70">{customer.email}</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            <a href="/account" className="btn btn-ghost justify-start bg-base-200 font-bold"><User className="w-4 h-4 mr-2" /> Profile Details</a>
            <a href="/account/orders" className="btn btn-ghost justify-start"><Mail className="w-4 h-4 mr-2" /> Order History</a>
            <a href="/account/addresses" className="btn btn-ghost justify-start"><MapPin className="w-4 h-4 mr-2" /> Addresses</a>
            <button onClick={logout} className="btn btn-ghost justify-start text-error hover:bg-error/10"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 glass-panel p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-base-content">Personal & Contact Details</h2>
          
          {(!customer.first_name || !customer.last_name) && (
            <div className="bg-warning/20 text-warning-content p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="font-bold">Please complete your profile.</span> First Name and Last Name are required.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-bold">First Name <span className="text-error">*</span></span></label>
              <input type="text" placeholder="John" required className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-bold">Last Name <span className="text-error">*</span></span></label>
              <input type="text" placeholder="Doe" required className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-bold">Date of Birth <span className="font-normal opacity-50">(Optional)</span></span></label>
              <input type="date" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-bold">Gender <span className="font-normal opacity-50">(Optional)</span></span></label>
              <select className="select select-bordered w-full select-sm h-11 rounded-xl" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>


          </div>
          
          <div className="mt-8 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn bg-primary hover:bg-primary/80 text-white border-none font-bold rounded-xl px-8">
              {saving ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
