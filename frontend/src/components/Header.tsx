import React, { useState, useEffect } from "react"
import { Sparkles, ShoppingBag } from "lucide-react"
import { useCustomer } from "../lib/providers/customer-provider"

interface HeaderProps {
  theme?: string
  handleThemeChange?: (newTheme: string) => void
  cart: any
  setCartOpen: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({
  theme: propTheme,
  handleThemeChange: propHandleThemeChange,
  cart,
  setCartOpen,
}) => {
  const { customer, isLoading } = useCustomer()
  const [theme, setTheme] = useState(propTheme || "nord")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "nord"
    setTheme(savedTheme)
  }, [])

  const onThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
    if (propHandleThemeChange) {
      propHandleThemeChange(newTheme)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0 mr-2">
        <Sparkles className="w-5 h-5 text-primary animate-pulse shrink-0" />
        <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-base-content hover:opacity-80 truncate">Sravi Enterprises</a>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Selector Switcher */}
        <select 
          value={theme} 
          onChange={(e) => onThemeChange(e.target.value)} 
          className="select select-bordered select-xs w-24 sm:w-28 bg-base-100 border-base-300 text-xs rounded-xl hidden sm:inline-flex"
        >
          <option value="nord">❄️ Nord</option>
          <option value="dracula">🧛 Dracula</option>
        </select>

        {/* Customer Account Avatar / Login */}
        {!isLoading && (
          customer ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-base-300 bg-base-200">
                <div className="w-8 rounded-full flex items-center justify-center font-bold text-primary">
                  {customer.first_name ? customer.first_name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
                <li><a href="/account" className="font-bold">Dashboard</a></li>
                <li><a href="/account/orders" className="font-bold">Orders</a></li>
                <li><a href="/account/login?logout=true" className="text-error font-bold">Logout</a></li>
              </ul>
            </div>
          ) : (
            <a href="/account/login" className="btn btn-sm bg-primary hover:bg-primary/80 text-white border-none rounded-xl font-bold">
              Login
            </a>
          )
        )}

        {/* Cart Trigger */}
        <button 
          onClick={() => setCartOpen(true)}
          className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ShoppingBag className="w-6 h-6" />
          {cart && cart.items && cart.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
