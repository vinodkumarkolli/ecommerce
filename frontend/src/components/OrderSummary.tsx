import React from "react"

interface OrderSummaryProps {
  cart: any
  selectedShippingOption: string
  shippingOptions: any[]
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  selectedShippingOption,
  shippingOptions,
}) => {
  const itemsSubtotal = cart?.items?.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0) || 0
  const shippingAmount = selectedShippingOption
    ? (shippingOptions.find(o => o.id === selectedShippingOption)?.amount || 0)
    : 0

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-md sticky top-24">
      <h4 className="font-extrabold text-lg border-b pb-3 border-base-300">Order Summary</h4>
      
      {/* Items List */}
      <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
        {cart?.items?.map((item: any) => (
          <div key={item.id} className="flex gap-3 text-sm">
            {item.thumbnail && (
              <img src={item.thumbnail} alt={item.title} className="w-12 h-12 object-cover rounded-lg bg-base-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-semibold block truncate leading-tight">{item.title}</span>
              <span className="text-xs opacity-60 block mt-0.5">Qty: {item.quantity} × ₹{item.unit_price}</span>
            </div>
            <span className="font-bold shrink-0">₹{item.unit_price * item.quantity}</span>
          </div>
        ))}
      </div>
      
      {/* Totals Breakdown */}
      <div className="flex flex-col gap-2 border-t pt-4 border-base-300 text-sm">
        <div className="flex justify-between">
          <span className="opacity-75">Items Subtotal</span>
          <span className="font-semibold">₹{itemsSubtotal}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="opacity-75">Shipping Fee</span>
          <span className="font-semibold">
            {selectedShippingOption 
              ? `₹${shippingAmount}`
              : <span className="text-xs opacity-50 italic">Calculated at Step 1</span>
            }
          </span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-75">Tax (GST)</span>
          <span className="font-semibold opacity-75">Included</span>
        </div>

        <div className="flex justify-between font-extrabold text-base border-t pt-3 mt-2 border-base-300">
          <span>Total Price</span>
          <span className="text-[#5e81ac] text-lg">
            ₹{itemsSubtotal + shippingAmount}
          </span>
        </div>
      </div>
    </div>
  )
}
