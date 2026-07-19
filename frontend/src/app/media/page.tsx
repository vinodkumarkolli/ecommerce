"use client"

import React from "react"
import { ArrowLeft, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MediaPage() {
  const router = useRouter()
  return (
    <main className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm flex items-center gap-1.5 cursor-pointer font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h3 className="font-bold text-lg">Media</h3>
        <div className="w-16" />
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <ImageIcon className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Media Gallery</h2>
        <p className="text-sm opacity-75">
          Our media gallery and press resources will be available here soon.
        </p>
      </div>
    </main>
  )
}
