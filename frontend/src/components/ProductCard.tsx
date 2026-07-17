import React from "react"
import { Loader2 } from "lucide-react"

interface ProductCardProps {
  product: any
  activeVariantId: string
  onChangeVariant: (variantId: string) => void
  onAddToCart: (productId: string) => void
  addingToCart: string | null
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  activeVariantId,
  onChangeVariant,
  onAddToCart,
  addingToCart,
}) => {
  const [showFullDescription, setShowFullDescription] = React.useState(false)
  const activeVariant = product.variants?.find((v: any) => v.id === activeVariantId) || product.variants?.[0]
  const activePrice = activeVariant?.calculated_price?.calculated_amount || "400.00"
  const isAdding = addingToCart === product.id

  return (
    <div className="glass-panel rounded-2xl overflow-hidden p-4 shadow-sm flex flex-col gap-4">
      <div className="flex gap-4">
        {product.thumbnail && (
          <img 
            src={product.thumbnail} 
            alt={product.title} 
            className="w-24 h-24 object-cover rounded-xl bg-slate-100 shrink-0"
          />
        )}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base leading-tight">{product.title}</h3>
            <p className={`text-xs opacity-75 mt-1 transition-all duration-300 ${
              showFullDescription ? "" : "line-clamp-2"
            }`}>
              {product.description}
            </p>
            {product.description && product.description.length > 60 && (
              <button 
                type="button"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-[#5e81ac] hover:underline font-bold mt-1 cursor-pointer block"
              >
                {showFullDescription ? "Read Less" : "Read More..."}
              </button>
            )}
          </div>
          <div className="font-extrabold text-xl text-[#5e81ac] mt-2">
            ₹{activePrice}
          </div>
        </div>
      </div>

      {/* Touch Friendly Variant Selector */}
      {product.variants && product.variants.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">Select Pack Size</span>
          <div className="grid grid-cols-3 gap-2">
            {product.variants.map((variant: any) => {
              const isSelected = activeVariantId === variant.id
              const variantPrice = variant.calculated_price?.calculated_amount || "400"
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onChangeVariant(variant.id)}
                  className={`btn flex flex-col items-center justify-center p-3 h-auto rounded-xl transition text-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none font-bold"
                      : "btn-outline border-base-300 hover:bg-base-300/40 text-base-content/80"
                  }`}
                >
                  <span className="text-xs font-bold">
                    {variant.title}
                  </span>
                  <span className="text-xs font-extrabold opacity-90">
                    ₹{variantPrice}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add To Cart Trigger */}
      <button 
        type="button"
        disabled={isAdding}
        onClick={() => onAddToCart(product.id)}
        className="btn bg-[#5e81ac] hover:bg-[#81a1c1] text-white border-none w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Adding to Cart...
          </>
        ) : (
          <>Add to Cart +</>
        )}
      </button>
    </div>
  )
}
