import React from "react"
import { Sparkles, ShoppingBag } from "lucide-react"

interface HeaderProps {
  theme: string
  handleThemeChange: (newTheme: string) => void
  cart: any
  setCartOpen: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  handleThemeChange,
  cart,
  setCartOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#5e81ac] animate-pulse" />
        <h1 className="text-lg font-bold tracking-tight text-base-content">Sravi Enterprises</h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Theme Selector Switcher */}
        <select 
          value={theme} 
          onChange={(e) => handleThemeChange(e.target.value)} 
          className="select select-bordered select-xs w-28 bg-base-100 border-base-300 text-xs rounded-xl"
        >
          <option value="nord">❄️ Nord</option>
          <option value="dracula">🧛 Dracula</option>
        </select>

        {/* Cart Trigger */}
        <button 
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ShoppingBag className="w-6 h-6" />
          {cart && cart.items && cart.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#5e81ac] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
