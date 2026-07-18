import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Shield, CreditCard, Users, BookMarked, Settings } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | Mishra Classes',
  description: 'Terms and conditions for using Mishra Classes platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] relative overflow-hidden text-slate-100 font-sans selection:bg-primary/30">
      
      {/* Background Decorators */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-md mb-12"
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium mb-6">
            <Scale size={16} className="text-blue-400" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Terms & Conditions
          </h1>
          <p className="text-slate-400 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          
          {[
            {
              icon: Shield,
              title: "1. Acceptance of Terms",
              content: "By accessing and using the Mishra Classes platform, you accept and agree to be bound by the terms and provision of this agreement. Mishra Classes provides exclusive coaching for Class 9th to 12th & Spoken English.",
              color: "text-blue-400",
              bg: "bg-blue-500/10"
            },
            {
              icon: BookMarked,
              title: "2. Course Enrollment and Access",
              content: "Upon successful enrollment and payment, students receive access to their respective live classes, recorded sessions, and study materials. Access to course content is strictly for the enrolled student and may not be shared, transferred, or sold to any third party.",
              color: "text-indigo-400",
              bg: "bg-indigo-500/10"
            },
            {
              icon: CreditCard,
              title: "3. Payment and Refund Policy",
              content: "All payments made through our secure gateway (Razorpay) are final. Fees once paid are non-refundable unless specified otherwise in a specific course's terms. In case of duplicate transactions, the extra amount will be refunded within 5-7 working days.",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10"
            },
            {
              icon: Users,
              title: "4. User Conduct and Live Classes",
              content: "Students are expected to maintain decorum during live classes. Any form of harassment, spamming, or inappropriate behavior in live chats or forums will result in immediate termination of the account without any refund.",
              color: "text-amber-400",
              bg: "bg-amber-500/10"
            },
            {
              icon: Settings,
              title: "5. Intellectual Property & Modification",
              content: "All content provided by Mishra Classes is our intellectual property. Unauthorized distribution is prohibited. We reserve the right to change these conditions from time to time as we see fit.",
              color: "text-purple-400",
              bg: "bg-purple-500/10"
            }
          ].map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/[0.07] transition-colors">
                <div className="flex items-start gap-5">
                  <div className={`mt-1 p-3 rounded-xl ${section.bg} ${section.color} shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-3">{section.title}</h2>
                    <p className="text-slate-400 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Contact Footer */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 text-center">
          <p className="text-blue-200 mb-2 font-medium">Questions about these terms?</p>
          <a href="mailto:classessmishra@gmail.com" className="text-white font-bold hover:text-blue-300 transition-colors text-lg">
            classessmishra@gmail.com
          </a>
        </div>

      </div>
    </div>
  );
}
