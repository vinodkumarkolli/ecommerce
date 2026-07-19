"use client"

import React from "react"
import { ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Clock, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "../../components/Footer"

export default function ContactPage() {
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
        <h3 className="font-bold text-lg tracking-tight">Contact Us</h3>
        <div className="w-16" />
      </header>
      
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">
        
        {/* Partner With Us */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Partner With Us</h2>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Whether you are a retailer looking to stock Sastry Balm or a business interested in joining our growing network of distributors, we are ready to connect.
          </p>
        </section>

        {/* Head Office */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Head Office</h2>
          </div>
          
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <span className="font-semibold opacity-70 block text-xs uppercase tracking-wider mb-1">Proprietor</span>
              <p className="font-medium">Vinod Kumar K</p>
            </div>
            <div>
              <span className="font-semibold opacity-70 block text-xs uppercase tracking-wider mb-1">Firm Name</span>
              <p className="font-medium">Sravi Enterprises</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2 opacity-90 leading-relaxed">
                <p>
                  Vatsalya, Plot No: 21, Padma Avenue, <br />
                  Near Kolapakkam Bus Stop, Kolapakkam, <br />
                  Chennai, Tamil Nadu, PIN: 600128
                </p>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Vatsalya,+Plot+No:+21,+Padma+Avenue,+Kolapakkam,+Chennai,+Tamil+Nadu+600128"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-medium flex items-center gap-1 hover:underline text-sm"
                >
                  <MapPin className="w-4 h-4" /> View on Google Maps
                </a>
              </div>
            </div>
            
            {/* Map Embed */}
            <div className="w-full h-48 rounded-xl overflow-hidden mt-1 border border-base-200">
              <iframe 
                src="https://www.google.com/maps?q=Vatsalya,+Plot+No:+21,+Padma+Avenue,+Kolapakkam,+Chennai,+Tamil+Nadu+600128&output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex items-center gap-3 mt-1">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <a href="mailto:support@sravie.in" className="font-medium text-primary hover:underline">support@sravie.in</a>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <p className="font-medium">6399962999 / 8122586261</p>
            </div>
          </div>
        </section>

        {/* Our Reach */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Our Reach</h2>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            We are currently expanding our footprint across Tamil Nadu. If you are a Distributor or Super Stockist interested in partnering with a tech-enabled firm, please reach out.
          </p>
        </section>

        {/* Business Hours */}
        <section className="bg-base-100 p-6 rounded-3xl shadow-sm border border-base-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Business Hours</h2>
          </div>
          <p className="font-medium text-sm mb-1">Monday – Saturday: 9:00 AM – 6:30 PM</p>
          <p className="text-xs opacity-60">We aim to respond to all partnership inquiries within 24-48 hours.</p>
        </section>

      </div>
      
      <Footer />
    </main>
  )
}
