import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Ban, RefreshCcw, Clock, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Cancellation and Refunds | Mishra Classes',
  description: 'Cancellation and Refund Policy for Mishra Classes.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Background Decorators */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm mb-10"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-6 shadow-sm">
            <RefreshCcw size={16} className="text-indigo-500" />
            <span>Policy Details</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            Cancellation & Refunds
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Please read our cancellation and refund guidelines carefully before purchasing any course or subscription.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {[
            {
              icon: Ban,
              title: "1. Cancellation Policy",
              content: "Once enrolled in a course, subscriptions or enrollments cannot be cancelled mid-term. Please review the course curriculum, schedule, and free demo classes (if available) to ensure the course meets your needs before making a payment.",
              color: "text-rose-600",
              bg: "bg-rose-100",
            },
            {
              icon: RefreshCcw,
              title: "2. Refund Policy",
              content: "All payments made are strictly non-refundable. We do not provide refunds for any partially used courses or if you simply change your mind. The only exception to this policy is duplicate transactions.",
              color: "text-amber-600",
              bg: "bg-amber-100",
            },
            {
              icon: Clock,
              title: "3. Duplicate Transactions",
              content: "If you have accidentally been charged twice for the same transaction due to a technical glitch or network error, please contact our support team within 48 hours. Upon verification, the duplicate amount will be refunded to your original payment method within 5-7 working days.",
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              icon: AlertCircle,
              title: "4. Violation of Terms",
              content: "If your account is suspended or terminated due to a violation of our Terms and Conditions (e.g., sharing account credentials, inappropriate behavior in live classes), no refund will be provided for the remaining duration of your course.",
              color: "text-purple-600",
              bg: "bg-purple-100",
            }
          ].map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className={`mt-1 p-3.5 rounded-2xl ${section.bg} ${section.color} border border-white shadow-sm shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 mb-3">{section.title}</h2>
                    <p className="text-slate-600 leading-relaxed text-[15px]">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Contact Footer */}
        <div className="mt-12 p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-[40px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/50 rounded-full blur-[40px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Need help with a payment?</h3>
              <p className="text-slate-600 text-sm">Our support team is available to help resolve any billing issues.</p>
            </div>
            <Link href="/contact-us" className="whitespace-nowrap px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl border border-indigo-100 shadow-sm hover:shadow-md hover:text-indigo-800 transition-all">
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
