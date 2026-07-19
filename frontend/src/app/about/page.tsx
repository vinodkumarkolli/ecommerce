"use client"

import React from "react"
import { ArrowLeft, Rocket, Route, ShieldCheck, Target, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "../../components/Footer"

export default function AboutPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="btn btn-ghost btn-sm flex items-center gap-1.5 cursor-pointer font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h3 className="font-bold text-lg tracking-tight">About Us</h3>
        <div className="w-16" />
      </header>
      
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">
        
        {/* Bridging Tradition */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Bridging Tradition with Technology
          </h2>
          <p className="text-sm opacity-85 leading-relaxed">
            Founded in 2021 by Vinod Kumar K, Sravi Enterprises represents a modern evolution in the FMCG and OTC distribution landscape. With a foundation built on a decade of IT professional expertise, Vinod recognized an opportunity to streamline how household staples reach the families who need them most.
          </p>
        </section>

        {/* Our Journey */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Our Journey
          </h2>
          <p className="text-sm opacity-85 leading-relaxed">
            We began our journey in Chennai, working at the grassroots level by distributing Sastry Balm directly to local pharmaceutical outlets. As the product's reputation for quality took hold, we scaled rapidly. What started as a direct-to-pharmacy operation has evolved into a robust, multi-tier network of Dealers, Distributors, and Super Stockists across Tamil Nadu.
          </p>
        </section>

        {/* Advantage of Innovation */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            The Advantage of Innovation
          </h2>
          <p className="text-sm opacity-85 leading-relaxed">
            What sets us apart is our DNA. We don't just move products; we optimize the supply chain. By integrating IT-driven tools and data-centric strategies, we solve the complex challenges of "Go-to-Market" logistics. This allows us to ensure that Sastry Balm—a beloved household name in Andhra Pradesh—is consistently available and efficiently managed throughout Tamil Nadu.
          </p>
        </section>

        {/* Our Core Pillars */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-center">Our Core Pillars</h2>
          
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-base-200/50 rounded-2xl flex gap-3">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">Excellence</h4>
                <p className="text-sm opacity-80 leading-relaxed">Delivering premium OTC products with unwavering reliability.</p>
              </div>
            </div>

            <div className="p-4 bg-base-200/50 rounded-2xl flex gap-3">
              <Route className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">Perseverance</h4>
                <p className="text-sm opacity-80 leading-relaxed">Building a network from the ground up, one outlet at a time.</p>
              </div>
            </div>

            <div className="p-4 bg-base-200/50 rounded-2xl flex gap-3">
              <Lightbulb className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold mb-1">Innovation</h4>
                <p className="text-sm opacity-80 leading-relaxed">Using technology to bring transparency and efficiency to traditional distribution.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
      
      <Footer />
    </main>
  )
}
