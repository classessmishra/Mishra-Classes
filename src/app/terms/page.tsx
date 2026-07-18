import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | Mishra Classes',
  description: 'Terms and conditions for using Mishra Classes platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <Link href="/login" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Terms and Conditions</h1>
        </div>
        
        <div className="p-6 sm:p-10 prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4">
            By accessing and using the Mishra Classes platform, you accept and agree to be bound by the terms and provision of this agreement. 
            Mishra Classes provides exclusive coaching for Class 9th to 12th & Spoken English.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">2. Course Enrollment and Access</h2>
          <p className="text-slate-600 mb-4">
            Upon successful enrollment and payment, students receive access to their respective live classes, recorded sessions, and study materials. 
            Access to course content is strictly for the enrolled student and may not be shared, transferred, or sold to any third party.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">3. Payment and Refund Policy</h2>
          <p className="text-slate-600 mb-4">
            All payments made through our secure gateway (Razorpay) are final. Fees once paid are non-refundable unless specified otherwise 
            in a specific course's terms. In case of duplicate transactions, the extra amount will be refunded within 5-7 working days.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">4. User Conduct and Live Classes</h2>
          <p className="text-slate-600 mb-4">
            Students are expected to maintain decorum during live classes. Any form of harassment, spamming, or inappropriate behavior in live chats 
            or forums will result in immediate termination of the account without any refund.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">5. Intellectual Property</h2>
          <p className="text-slate-600 mb-4">
            All content, including but not limited to video lectures, study materials, tests, and assignments provided by Mishra Classes, 
            is the intellectual property of Mishra Classes. Unauthorized recording, downloading, or distribution of this content is strictly prohibited.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">6. Modification of Terms</h2>
          <p className="text-slate-600 mb-4">
            Mishra Classes reserves the right to change these conditions from time to time as it sees fit and your continued use of the 
            site will signify your acceptance of any adjustment to these terms.
          </p>
          
          <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">
              If you have any questions regarding these terms, please contact us at classessmishra@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
