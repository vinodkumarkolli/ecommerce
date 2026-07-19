"use client"

import React from "react"
import { ArrowLeft, ShieldCheck, Truck, CreditCard, RefreshCw, AlertCircle } from "lucide-react"
import { Footer } from "../../components/Footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-base-200 text-base-content pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-base-100 border-b px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-ghost btn-sm flex items-center gap-1.5 cursor-pointer font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h3 className="font-bold text-lg">Terms & Refund Policy</h3>
        <div className="w-16" /> {/* Spacer to align title */}
      </header>

      {/* Content Container */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Intro */}
        <section className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Terms of Service & Refund Policy</h2>
          <p className="text-sm opacity-75 mt-2">Effective Date: July 17, 2026 | Sravi Enterprises</p>
        </section>

        {/* 1. Payments Policy */}
        <div className="glass-panel p-6 rounded-2xl flex gap-4 shadow-sm">
          <CreditCard className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">1. Payment & Order Acceptance</h4>
            <p className="text-sm opacity-85 leading-relaxed">
              All orders placed with Sravi Enterprises are processed on a strictly **prepaid basis** using our secure Google Pay (UPI) payment gateway. We do not accept Cash on Delivery (COD) or post-dated payments. Shipment dispatch will only be initiated once transaction authorization is successfully completed and funds are reconciled.
            </p>
          </div>
        </div>

        {/* 2. Shipping Timeline */}
        <div className="glass-panel p-6 rounded-2xl flex gap-4 shadow-sm">
          <Truck className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">2. Shipping Timeline</h4>
            <p className="text-sm opacity-85 leading-relaxed">
              We offer standard shipping to all serviceable postal codes. 
              Our standard delivery timeline is **5 to 7 working days** (excluding Sundays and national holidays) from the date of payment confirmation. Delivery tracking numbers are generated and emailed to you once packages are handed over to our shipping partners.
            </p>
          </div>
        </div>

        {/* 3. Payment Gateway & Failed Transaction Scenarios */}
        <div className="glass-panel p-6 rounded-2xl flex gap-4 shadow-sm">
          <AlertCircle className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">3. Payment Gateway & Failed Transactions</h4>
            <p className="text-sm opacity-85 leading-relaxed mb-3">
              During checkout, payment processing is handled by third-party UPI / Bank aggregators. Technical issues or network timeouts may occasionally cause payment discrepancies:
            </p>
            <ul className="list-disc list-inside text-sm opacity-80 flex flex-col gap-2 leading-relaxed">
              <li>
                <strong>Debited but Mismatched Status</strong>: If money is debited from your account but checkout shows "payment failed" or doesn't generate an order, it is due to an aggregation delay. In such cases, the gateway's auto-reconciliation will refund the amount to your source account within **5 to 7 banking days**.
              </li>
              <li>
                <strong>Manual Verification</strong>: If your amount was debited and you did not receive an order confirmation within 2 hours, please email your transaction receipt containing the UTR / Ref Number to <span className="font-semibold text-primary">sravienterprises1@gmail.com</span> for manual verification.
              </li>
            </ul>
          </div>
        </div>

        {/* 4. Product Refund Policy */}
        <div id="refund-policy" className="glass-panel p-6 rounded-2xl flex gap-4 shadow-sm scroll-mt-20">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">4. Product Returns & Refund Policy</h4>
            <p className="text-sm opacity-85 leading-relaxed">
              We provide authentic Ayurvedic pain balms formulated under strict hygiene regulations. Due to the personal care and health nature of our products, **used, opened, or unsealed jars/bottles cannot be accepted for returns, replacements, or refunds**. We only issue replacements/refunds for sealed, completely unopened packages returned within 3 days of delivery in cases of verified transit damage.
            </p>
          </div>
        </div>

        {/* 5. Shipping Failures & RTO Policy */}
        <div className="glass-panel p-6 rounded-2xl flex gap-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">5. Delivery Failures & Returns to Origin (RTO)</h4>
            <p className="text-sm opacity-85 leading-relaxed mb-3">
              When a shipping courier fails to complete delivery, the refund workflow is determined by the root cause:
            </p>
            <ul className="list-disc list-inside text-sm opacity-80 flex flex-col gap-2 leading-relaxed">
              <li>
                <strong>Lost in Transit</strong>: If our shipping courier confirms a package is lost before reaching your destination, Sravi Enterprises will issue a **full refund** or ship a free replacement immediately.
              </li>
              <li>
                <strong>Invalid Address or Refusal</strong>: If a package is returned to origin (RTO) due to an incorrect/incomplete address, unreachable phone number, or delivery refusal, a refund will be issued **minus the actual outward shipping fees** once the package is returned to our warehouse.
              </li>
            </ul>
          </div>
        </div>

      </div>
      <Footer />
    </main>
  )
}
