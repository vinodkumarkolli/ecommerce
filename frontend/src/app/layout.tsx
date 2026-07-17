import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Sravi Enterprises - Premium Balms",
  description: "Mobile-first ordering platform for premium organic wellness balms.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`h-full ${outfit.variable}`}>
      <body className="min-h-full flex flex-col bg-base-100 text-base-content">
        {children}
      </body>
    </html>
  )
}
