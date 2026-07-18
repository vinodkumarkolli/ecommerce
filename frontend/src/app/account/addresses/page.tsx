"use client"

import React, { useEffect, useState } from "react"
import { sdk } from "../../../lib/medusa"
import { useCustomer } from "../../../lib/providers/customer-provider"
import { Header } from "../../../components/Header"
import { User, Mail, LogOut, MapPin, Plus, Edit2, Trash2, Loader2, X, Phone } from "lucide-react"

export default function AddressesPage() {
  const { customer, isLoading, logout, fetchCustomer } = useCustomer()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const addresses = customer?.addresses || []

  const defaultForm = {
    address_title: "Home",
    address_title_custom: "",
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    province: "",
    postal_code: "",
    country_code: "in",
    phone: ""
  }
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (!isLoading && !customer) {
      window.location.href = "/account/login"
    }
  }, [customer, isLoading])

  if (isLoading || !customer) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>

  const handleEdit = (address: any) => {
    const title = address.address_name || address.metadata?.title || "Home"
    const isCustom = title !== "Home" && title !== "Office"
    
    setFormData({
      address_title: isCustom ? "Other" : title,
      address_title_custom: isCustom ? title : "",
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      company: address.company || "",
      address_1: address.address_1 || "",
      address_2: address.address_2 || "",
      city: address.city || "",
      province: address.province || "",
      postal_code: address.postal_code || "",
      country_code: address.country_code || "in",
      phone: address.phone || ""
    })
    setEditingId(address.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (addresses.length <= 1) {
      alert("You must have at least one saved address.")
      return
    }
    if (!confirm("Are you sure you want to delete this address?")) return
    try {
      await sdk.client.fetch(`/store/customers/me/addresses/${id}`, { method: "DELETE" })
      await fetchCustomer()
    } catch (err) {
      console.error(err)
      alert("Failed to delete address")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const finalTitle = formData.address_title === "Other" ? formData.address_title_custom : formData.address_title
      
      const existingAddress = editingId ? addresses.find((a: any) => a.id === editingId) : null
      const isFirstAddress = addresses.length === 0
      
      const payload: any = {
        ...formData,
        address_name: finalTitle,
        metadata: { 
          ...(existingAddress?.metadata || {}),
          title: finalTitle,
          ...(!editingId && isFirstAddress ? { is_primary: true } : {})
        }
      }
      delete payload.address_title
      delete payload.address_title_custom

      if (editingId) {
        await sdk.client.fetch(`/store/customers/me/addresses/${editingId}`, {
          method: "POST",
          body: payload
        })
      } else {
        await sdk.client.fetch(`/store/customers/me/addresses`, {
          method: "POST",
          body: payload
        })
      }
      await fetchCustomer()
      setIsAdding(false)
      setEditingId(null)
      setFormData(defaultForm)
    } catch (err) {
      console.error(err)
      alert("Failed to save address. Please check your inputs.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData(defaultForm)
  }

  const buildUpdatePayload = (addr: any, isPrimary: boolean) => ({
    first_name: addr.first_name,
    last_name: addr.last_name,
    company: addr.company,
    address_1: addr.address_1,
    address_2: addr.address_2,
    city: addr.city,
    country_code: addr.country_code,
    province: addr.province,
    postal_code: addr.postal_code,
    phone: addr.phone,
    address_name: addr.address_name,
    metadata: { ...addr.metadata, is_primary: isPrimary }
  })

  const handleMakePrimary = async (addressId: string) => {
    try {
      const currentPrimary = addresses.find((a: any) => a.metadata?.is_primary === true)
      
      if (currentPrimary && currentPrimary.id !== addressId) {
        await sdk.client.fetch(`/store/customers/me/addresses/${currentPrimary.id}`, {
          method: "POST",
          body: buildUpdatePayload(currentPrimary, false)
        })
      }

      const newPrimary = addresses.find((a: any) => a.id === addressId)
      if (newPrimary) {
        await sdk.client.fetch(`/store/customers/me/addresses/${newPrimary.id}`, {
          method: "POST",
          body: buildUpdatePayload(newPrimary, true)
        })
      }
      
      await fetchCustomer()
    } catch (err) {
      console.error(err)
      alert("Failed to update primary address")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header theme="nord" handleThemeChange={() => {}} cart={{}} setCartOpen={() => {}} />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 shadow-sm mb-4">
            <div>
              <h3 className="font-bold text-base-content leading-tight">{customer.first_name} {customer.last_name}</h3>
              <p className="text-xs opacity-70">{customer.email}</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            <a href="/account" className="btn btn-ghost justify-start"><User className="w-4 h-4 mr-2" /> Profile Details</a>
            <a href="/account/orders" className="btn btn-ghost justify-start"><Mail className="w-4 h-4 mr-2" /> Order History</a>
            <a href="/account/addresses" className="btn btn-ghost justify-start bg-base-200 font-bold"><MapPin className="w-4 h-4 mr-2" /> Addresses</a>
            <button onClick={logout} className="btn btn-ghost justify-start text-error hover:bg-error/10"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 glass-panel p-6 rounded-2xl shadow-sm">
          {!isAdding && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-base-content">Saved Addresses</h2>
              <button onClick={() => setIsAdding(true)} className="btn btn-sm btn-primary text-white rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Add Address
              </button>
            </div>
          )}

          {isAdding ? (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{editingId ? "Edit Address" : "Add New Address"}</h3>
                <button onClick={handleCancel} className="btn btn-circle btn-ghost btn-sm"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-bold">Address Title (Tag)</span></label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFormData({...formData, address_title: "Home"})} className={`btn btn-sm rounded-xl ${formData.address_title === "Home" ? "btn-primary text-white border-primary" : "btn-outline border-base-300"}`}>Home</button>
                    <button type="button" onClick={() => setFormData({...formData, address_title: "Office"})} className={`btn btn-sm rounded-xl ${formData.address_title === "Office" ? "btn-primary text-white border-primary" : "btn-outline border-base-300"}`}>Office</button>
                    <button type="button" onClick={() => setFormData({...formData, address_title: "Other"})} className={`btn btn-sm rounded-xl ${formData.address_title === "Other" ? "btn-primary text-white border-primary" : "btn-outline border-base-300"}`}>Other</button>
                  </div>
                  {formData.address_title === "Other" && (
                    <input type="text" placeholder="e.g. Mom's House" className="input input-bordered w-full input-sm h-11 rounded-xl mt-3" value={formData.address_title_custom || ""} onChange={(e) => setFormData({...formData, address_title_custom: e.target.value})} required />
                  )}
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">First Name *</span></label>
                  <input required type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Last Name *</span></label>
                  <input required type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-bold">Company (Optional)</span></label>
                  <input type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-bold">Address Line 1 *</span></label>
                  <input required type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.address_1} onChange={(e) => setFormData({...formData, address_1: e.target.value})} />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-bold">Address Line 2 (Optional)</span></label>
                  <input type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.address_2} onChange={(e) => setFormData({...formData, address_2: e.target.value})} />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">City *</span></label>
                  <input required type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
                
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">State / Province</span></label>
                  <input type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Postal Code *</span></label>
                  <input required type="text" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">Country Code *</span></label>
                  <select required className="select select-bordered w-full select-sm h-11 rounded-xl" value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})}>
                    <option value="in">India (IN)</option>
                    <option value="us">United States (US)</option>
                    <option value="gb">United Kingdom (GB)</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-bold">Phone Number</span></label>
                  <input type="tel" className="input input-bordered w-full input-sm h-11 rounded-xl" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="md:col-span-2 mt-4 flex justify-end gap-2">
                  <button type="button" onClick={handleCancel} className="btn btn-ghost rounded-xl">Cancel</button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary text-white rounded-xl px-8">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 bg-base-200 rounded-2xl border border-dashed border-base-300">
              <MapPin className="w-12 h-12 text-base-300 mx-auto mb-4" />
              <p className="text-base-content/70 font-semibold">You have no saved addresses.</p>
              <button onClick={() => setIsAdding(true)} className="btn btn-sm btn-primary text-white rounded-xl mt-4">
                Add your first address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="border border-base-300 rounded-2xl p-5 hover:border-primary transition-colors flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      {(addr.address_name || addr.metadata?.title) && (
                        <span className="badge badge-primary badge-sm font-bold">{addr.address_name || addr.metadata?.title}</span>
                      )}
                      {addr.metadata?.is_primary && (
                        <span className="badge badge-accent badge-sm font-bold">Primary</span>
                      )}
                    </div>
                    <h4 className="font-bold text-lg mb-1">{addr.first_name} {addr.last_name}</h4>
                    {addr.company && <p className="text-sm opacity-70 mb-1">{addr.company}</p>}
                    <p className="text-sm">{addr.address_1}</p>
                    {addr.address_2 && <p className="text-sm">{addr.address_2}</p>}
                    <p className="text-sm">{addr.city}, {addr.province} {addr.postal_code}</p>
                    <p className="text-sm uppercase">{addr.country_code}</p>
                    {addr.phone && <p className="text-sm mt-2 flex items-center gap-2"><Phone className="w-3 h-3" /> {addr.phone}</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-base-200 flex items-center justify-between">
                    <div>
                      {!addr.metadata?.is_primary && (
                        <button onClick={() => handleMakePrimary(addr.id)} className="text-xs font-bold text-base-content/60 hover:text-primary transition-colors">
                          Make Primary
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(addr)} className="btn btn-xs btn-ghost text-primary"><Edit2 className="w-3 h-3 mr-1" /> Edit</button>
                      {!addr.metadata?.is_primary && (
                        <button onClick={() => handleDelete(addr.id)} className="btn btn-xs btn-ghost text-error" disabled={addresses.length <= 1}><Trash2 className="w-3 h-3 mr-1" /> Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
