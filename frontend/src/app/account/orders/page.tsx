"use client"

import React, { useEffect, useState } from "react"
import { sdk } from "../../../lib/medusa"
import { useCustomer } from "../../../lib/providers/customer-provider"
import { Header } from "../../../components/Header"
import { User, Mail, LogOut, Package, MapPin } from "lucide-react"

export default function OrdersPage() {
  const { customer, isLoading, logout } = useCustomer()
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!isLoading && !customer) {
      window.location.href = "/account/login"
    }
  }, [customer, isLoading])

  useEffect(() => {
    async function fetchOrders() {
      if (!customer) return
      try {
        const res = await sdk.store.order.list({
          fields: "id,display_id,created_at,status,payment_status,fulfillment_status,total,original_total,subtotal,tax_total,discount_total,shipping_total,currency_code,*items,*shipping_methods"
        })
        setOrders(res.orders || [])
      } catch (err) {
        console.error("Failed to fetch orders", err)
      } finally {
        setLoadingOrders(false)
      }
    }
    fetchOrders()
  }, [customer])

  if (isLoading || !customer) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>

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
            <a href="/account/orders" className="btn btn-ghost justify-start bg-base-200 font-bold"><Mail className="w-4 h-4 mr-2" /> Order History</a>
            <a href="/account/addresses" className="btn btn-ghost justify-start"><MapPin className="w-4 h-4 mr-2" /> Addresses</a>
            <button onClick={logout} className="btn btn-ghost justify-start text-error hover:bg-error/10"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 glass-panel p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Order History
          </h2>
          
          {loadingOrders ? (
            <div className="py-10 text-center"><span className="loading loading-spinner text-primary"></span></div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center opacity-70 font-bold">No orders found.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <a 
                  key={order.id} 
                  href={`/account/orders/${order.id}`}
                  className="block bg-base-200 hover:bg-base-300 transition p-4 rounded-xl border border-base-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg">Order #{order.display_id}</h4>
                      <p className="text-xs opacity-70">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      {(() => {
                        const calculatedTotal = (order.items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0) + 
                                                (order.shipping_total || 0) + 
                                                (order.tax_total || 0) - 
                                                (order.discount_total || 0);
                        const total = order.original_total || order.total || calculatedTotal;
                        return <p className="font-bold text-lg mb-1">₹{total}</p>;
                      })()}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full mt-1 ${order.status === 'canceled' ? 'bg-error text-white' : 'bg-primary/10 text-primary'}`}>
                        Order: {order.status} • Payment: {order.payment_status} • Shipping: {order.fulfillment_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="w-12 h-12 bg-base-100 rounded-lg overflow-hidden flex-shrink-0 border border-base-300">
                        {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
