import React from "react"
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react"

interface CartDrawerProps {
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  cart: any
  handleUpdateQuantity: (lineItemId: string, currentQty: number, change: number) => void
  handleRemoveItem: (lineItemId: string) => void
  onCheckout: () => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cartOpen,
  setCartOpen,
  cart,
  handleUpdateQuantity,
  handleRemoveItem,
  onCheckout,
}) => {
  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
      <div className="absolute inset-0" onClick={() => setCartOpen(false)} />
      <div className="glass-panel w-full max-h-[80vh] rounded-t-[32px] overflow-hidden flex flex-col animate-slide-up z-10 shadow-2xl p-2">
        
        {/* Drawer Header */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-center">
          <h3 className="font-bold text-xl">Your Cart</h3>
          <button 
            onClick={() => setCartOpen(false)} 
            className="btn btn-ghost btn-circle btn-sm text-base-content/60"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4">
          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="py-12 text-center opacity-60">Your cart is empty.</div>
          ) : (
            cart.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt={item.title} className="w-16 h-16 object-cover rounded-xl" />
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-xs opacity-60">₹{item.unit_price} each</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2 bg-base-300 rounded-lg p-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        className="p-1 rounded hover:bg-base-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold px-2">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        className="p-1 rounded hover:bg-base-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn btn-ghost btn-circle btn-sm text-error"
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
          <div className="px-5 pb-5 pt-3 flex flex-col gap-4">
            <div className="flex justify-between font-bold text-lg px-1">
              <span>Subtotal</span>
              <span>₹{cart.items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              Checkout <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
