"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { sdk } from "../../../../lib/medusa"
import { useCustomer } from "../../../../lib/providers/customer-provider"
import { Header } from "../../../../components/Header"

export default function OrderDetailsPage() {
  const params = useParams()
  const { customer, isLoading } = useCustomer()
  const [order, setOrder] = useState<any>(null)
  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !customer) {
      window.location.href = "/account/login"
    }
  }, [customer, isLoading])

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!customer || !params.id) return
      
      try {
        const { order: fetchedOrder } = await sdk.store.order.retrieve(params.id as string, {
          fields: "id,display_id,created_at,status,payment_status,fulfillment_status,total,subtotal,tax_total,discount_total,shipping_total,currency_code,*items,*shipping_methods,*payment_collections,*payment_collections.payments,*payment_collections.payments.refunds,*fulfillments,*shipping_address,*billing_address,*refunds"
        })
        setOrder(fetchedOrder)
        
        // Fetch Reimbursements for this order
        try {
          const res = await sdk.client.fetch<any>(`/store/orders/${params.id}/reimbursement`, {
            method: "GET"
          })
          setReimbursements(res.reimbursements || [])
        } catch (err) {
          console.error("No reimbursements found", err)
        }
      } catch (err) {
        console.error("Failed to fetch order", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrderDetails()
  }, [params.id, customer])

  if (isLoading || loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>
  if (!order) return <div className="p-10 text-center font-bold text-error">Order not found.</div>

  return (
    <div className="flex flex-col min-h-screen">
      <Header theme="nord" handleThemeChange={() => {}} cart={{}} setCartOpen={() => {}} />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <a href="/account/orders" className="text-sm font-bold text-primary hover:underline mb-2 inline-block">← Back to Orders</a>
          <h2 className="text-2xl font-bold text-base-content flex items-center gap-3">
            Order #{order.display_id}
            {order.status === 'canceled' && (
              <span className="badge badge-error text-white font-bold text-xs uppercase">Canceled</span>
            )}
          </h2>
          <span className="text-sm opacity-70 block">Placed on {new Date(order.created_at).toLocaleDateString()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Items */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Items Summary</h3>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0 border-base-300">
                    <div className="w-16 h-16 bg-base-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-xs opacity-70">{item.variant_title}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold">Qty: {item.quantity}</span>
                        <span className="font-bold">₹{item.unit_price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-base-300 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-80">Subtotal:</span>
                  <span className="font-semibold">₹{order.items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0}</span>
                </div>
                {order.discount_total > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Discount:</span>
                    <span className="font-semibold text-success">-₹{order.discount_total}</span>
                  </div>
                )}
                {order.shipping_total > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Shipping:</span>
                    <span className="font-semibold">₹{order.shipping_total}</span>
                  </div>
                )}
                {order.tax_total > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Tax:</span>
                    <span className="font-semibold">₹{order.tax_total}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-base-300 flex justify-between items-center">
                  <span className="font-bold text-base">Total:</span>
                  <span className="font-bold text-lg">
                    ₹{(order.items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0) + 
                      (order.shipping_total || 0) + 
                      (order.tax_total || 0) - 
                      (order.discount_total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment & Tracking */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Shipment & Tracking</h3>
              <div className={`bg-base-200 p-4 rounded-xl ${order.status === 'canceled' ? 'border border-error/30' : ''}`}>
                <span className="font-bold block text-sm">Status: <span className={`uppercase ${order.status === 'canceled' ? 'text-error' : 'text-primary'}`}>
                  {(() => {
                    if (order.status === 'canceled') return "Canceled";
                    
                    const active = order.fulfillments?.filter((f: any) => !f.canceled_at) || [];
                    if (active.length === 0) return order.fulfillment_status;
                    const isDelivered = active.every((f: any) => f.delivered_at);
                    const isShipped = active.some((f: any) => f.shipped_at || (f.tracking_numbers && f.tracking_numbers.length > 0));
                    
                    if (isDelivered) return "Delivered";
                    if (isShipped) return "Shipped & Pending Delivery";
                    return "Order Acknowledged & Pending Shipping";
                  })()}
                </span></span>
                
                {order.status === 'canceled' ? (
                  <p className="text-sm text-error font-medium mt-2">This order has been canceled and will not be shipped.</p>
                ) : order.fulfillments && order.fulfillments.filter((f: any) => !f.canceled_at).length > 0 ? (
                  order.fulfillments.filter((f: any) => !f.canceled_at).map((f: any) => (
                    <div key={f.id} className="mt-2 text-sm">
                      <p>Tracking Number: <span className="font-semibold">{f.tracking_numbers?.length ? f.tracking_numbers.join(', ') : 'N/A'}</span></p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm opacity-70 mt-1">We are preparing your order for shipment.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Payment Details */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Payment Details</h3>
              <div className="bg-base-200 p-4 rounded-xl space-y-2 text-sm">
                {(() => {
                  const calculatedTotal = (order.items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0) + 
                                          (order.shipping_total || 0) + 
                                          (order.tax_total || 0) - 
                                          (order.discount_total || 0);
                  const total = order.original_total || order.total || calculatedTotal;
                  
                  const isPaid = ['captured', 'refunded', 'partially_refunded'].includes(order.payment_status);
                  const paidAmount = isPaid ? total : 0;
                  const allRefunds = order.refunds?.length ? order.refunds : (order.payment_collections?.flatMap((pc: any) => pc.payments?.flatMap((p: any) => p.refunds || []) || []) || []);
                  const refundedAmount = allRefunds.reduce((acc: number, r: any) => acc + r.amount, 0) || 0;
                  const balanceAmount = paidAmount - refundedAmount;
                  
                  return (
                    <div className="space-y-2 mb-4 border-b border-base-300 pb-4">
                      <div className="flex justify-between opacity-80">
                        <span>Order Total:</span>
                        <span>₹{total}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Amount Paid:</span>
                        <span className="text-success">₹{paidAmount}</span>
                      </div>
                      {refundedAmount > 0 && (
                        <div className="flex justify-between font-bold">
                          <span>Amount Refunded:</span>
                          <span className="text-error">-₹{refundedAmount}</span>
                        </div>
                      )}
                      {refundedAmount > 0 && (
                        <div className="flex justify-between font-bold pt-2 mt-2 border-t border-base-300">
                          <span>Final Balance:</span>
                          <span>₹{balanceAmount}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
                <p>Status: <span className={`font-bold uppercase ${['canceled', 'refunded'].includes(order.payment_status) ? 'text-error' : 'text-primary'}`}>
                  {order.payment_status === 'captured' ? 'Authorised Payment' : 
                   (order.payment_status === 'authorized' || order.payment_status === 'awaiting') ? 'Payment is Pending Authorisation' : 
                   order.payment_status}
                </span></p>
                {(() => {
                  const paymentRef = order.payments?.[0]?.id || order.payment_collections?.[0]?.payments?.[0]?.id;
                  if (!paymentRef) return null;
                  return (
                    <div className="pt-2 mt-2 border-t border-base-300">
                      <span className="block opacity-70 text-xs mb-1">Transaction Ref:</span>
                      <span className="font-mono text-xs opacity-90 break-all">{paymentRef}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Payment Reimbursements / Refunds */}
              {reimbursements && reimbursements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <h4 className="font-bold text-sm text-error mb-2">Reimbursement Info</h4>
                  {reimbursements.map((r: any) => (
                    <div key={r.id} className="bg-error/10 p-3 rounded-lg text-sm mb-2">
                      <p className="font-semibold text-error">Status: {r.status}</p>
                      <p className="opacity-80">Amount: ₹{r.amount}</p>
                    </div>
                  ))}
                </div>
              )}

              {(() => {
                const allRefunds = order.refunds?.length ? order.refunds : (order.payment_collections?.flatMap((pc: any) => pc.payments?.flatMap((p: any) => p.refunds || []) || []) || []);
                if (!allRefunds || allRefunds.length === 0) return null;
                
                return (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <h4 className="font-bold text-sm text-error mb-2">Refund Details</h4>
                    {allRefunds.map((r: any) => (
                      <div key={r.id} className="bg-error/10 p-3 rounded-lg text-sm mb-2">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-error">Refunded: ₹{r.amount}</p>
                          <p className="text-[10px] opacity-70">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        {r.reason && (
                          <p className="opacity-90 text-xs mt-1"><span className="font-semibold">Reason:</span> {r.reason.replace(/_/g, ' ')}</p>
                        )}
                        {r.note && (
                          <p className="opacity-80 italic text-xs mt-1 text-base-content/70">"{r.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Address */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p className="font-bold">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                <p>{order.shipping_address?.address_1}</p>
                <p>{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}</p>
                <p>Phone: {order.shipping_address?.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
