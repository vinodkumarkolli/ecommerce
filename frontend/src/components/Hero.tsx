import React, { useState } from "react"

interface HeroProps {
  pillText?: string;
  title?: string;
  metadata?: Record<string, string>;
}

const ExpandableText: React.FC<{ label: string, content: string }> = ({ label, content }) => {
  const [showFull, setShowFull] = useState(false);
  const isHtml = content ? /<[a-z][\s\S]*>/i.test(content) : false;

  return (
    <div className="mt-4 text-left bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
      <strong className="block mb-1 text-sm font-bold text-primary">{label}:</strong>
      {isHtml ? (
        <div 
          className={`text-sm opacity-75 transition-all duration-300 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>li]:mb-1 ${showFull ? "" : "line-clamp-3"}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className={`text-sm opacity-75 transition-all duration-300 ${showFull ? "" : "line-clamp-3"}`}>
          {content}
        </p>
      )}
      {content.length > 100 && (
        <button 
          type="button"
          onClick={() => setShowFull(!showFull)}
          className="text-xs text-primary hover:underline font-bold mt-2 cursor-pointer inline-block"
        >
          {showFull ? "Read Less" : "Read More..."}
        </button>
      )}
    </div>
  )
}

export const Hero: React.FC<HeroProps> = ({ 
  pillText = "Organic Wellness",
  title,
  metadata
}) => {
  const renderableKeys = metadata ? Object.keys(metadata).filter(k => k !== "Header").sort((a, b) => {
    if (a === "Description") return -1;
    if (b === "Description") return 1;
    return a.localeCompare(b);
  }) : [];

  return (
    <section className="py-4 md:py-8 text-center md:text-left w-full">
      <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3 py-1 bg-primary/15 rounded-full inline-block">
        {pillText}
      </span>
      {title && <h2 className="text-3xl font-extrabold mt-3 tracking-tight">{title}</h2>}
      
      {renderableKeys.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          {renderableKeys.map(key => (
            <ExpandableText key={key} label={key} content={metadata![key]} />
          ))}
        </div>
      )}
    </section>
  )
}
