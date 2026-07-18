import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Shield, CreditCard, Users, BookMarked, Settings } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | Mishra Classes',
  description: 'Terms and conditions for using Mishra Classes platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Background Decorators */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm mb-12"
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-6 shadow-sm">
            <Scale size={16} className="text-blue-500" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            Terms & Conditions
          </h1>
          <p className="text-slate-500 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {[
            {
              icon: Shield,
              title: "1. Acceptance of Terms",
              content: "By accessing and using the Mishra Classes platform, you accept and agree to be bound by the terms and provision of this agreement. Mishra Classes provides exclusive coaching for Class 9th to 12th & Spoken English.",
              color: "text-blue-600",
              bg: "bg-blue-100",
              border: "border-blue-100"
            },
            {
              icon: BookMarked,
              title: "2. Course Enrollment and Access",
              content: "Upon successful enrollment and payment, students receive access to their respective live classes, recorded sessions, and study materials. Access to course content is strictly for the enrolled student and may not be shared, transferred, or sold to any third party.",
              color: "text-indigo-600",
              bg: "bg-indigo-100",
              border: "border-indigo-100"
            },
            {
              icon: CreditCard,
              title: "3. Payment and Refund Policy",
              content: "All payments made through our secure gateway (Razorpay) are final. Fees once paid are non-refundable unless specified otherwise in a specific course's terms. In case of duplicate transactions, the extra amount will be refunded within 5-7 working days.",
              color: "text-emerald-600",
              bg: "bg-emerald-100",
              border: "border-emerald-100"
            },
            {
              icon: Users,
              title: "4. User Conduct and Live Classes",
              content: "Students are expected to maintain decorum during live classes. Any form of harassment, spamming, or inappropriate behavior in live chats or forums will result in immediate termination of the account without any refund.",
              color: "text-amber-600",
              bg: "bg-amber-100",
              border: "border-amber-100"
            },
            {
              icon: Settings,
              title: "5. Intellectual Property & Modification",
              content: "All content provided by Mishra Classes is our intellectual property. Unauthorized distribution is prohibited. We reserve the right to change these conditions from time to time as we see fit.",
              color: "text-purple-600",
              bg: "bg-purple-100",
              border: "border-purple-100"
            }
          ].map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-5">
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
        <div className="mt-12 p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/50 rounded-full blur-[40px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-[40px]" />
          
          <div className="relative z-10">
            <p className="text-blue-800 mb-3 font-semibold text-lg">Questions about these terms?</p>
            <a href="mailto:classessmishra@gmail.com" className="inline-block text-primary font-bold hover:text-blue-700 transition-colors text-xl bg-white px-6 py-3 rounded-xl shadow-sm border border-blue-100 hover:shadow-md">
              classessmishra@gmail.com
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
