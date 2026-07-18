import React from "react"

export const Hero: React.FC = () => {
  return (
    <section className="px-4 py-8 text-center max-w-lg mx-auto">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3 py-1 bg-primary/15 rounded-full">
        Organic Wellness
      </span>
      <h2 className="text-3xl font-extrabold mt-3 tracking-tight">Pure Healing Balms</h2>
      <p className="text-sm opacity-75 mt-2">Mobile-first ordering for Sravi Enterprises' signature wellness collection.</p>
    </section>
  )
}
