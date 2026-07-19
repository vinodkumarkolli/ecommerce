import React from "react"

interface HeroProps {
  pillText?: string;
  title?: string;
  subtitle?: string;
}

export const Hero: React.FC<HeroProps> = ({ 
  pillText = "Organic Wellness",
  title,
  subtitle
}) => {
  return (
    <section className="px-4 py-8 text-center max-w-lg mx-auto">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3 py-1 bg-primary/15 rounded-full inline-block">
        {pillText}
      </span>
      {title && <h2 className="text-3xl font-extrabold mt-3 tracking-tight">{title}</h2>}
      {subtitle && <p className="text-sm opacity-75 mt-2">{subtitle}</p>}
    </section>
  )
}
