import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Mishra Classes',
  description: 'Get in touch with Mishra Classes.',
};

export default function ContactUsPage() {
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
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-6 shadow-sm">
            <MessageCircle size={16} className="text-blue-500" />
            <span>We are here to help</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
            Contact Us
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Have a question about our courses or need assistance? Reach out to our support team and we'll be happy to help.
          </p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center">
            <div className="mb-6 p-4 rounded-full bg-blue-100 text-blue-600 border border-blue-50">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Email Us</h2>
            <p className="text-slate-500 mb-6 text-sm">Drop us an email anytime and we will get back to you within 24 hours.</p>
            <a href="mailto:classessmishra@gmail.com" className="text-lg font-bold text-primary hover:text-blue-700 transition-colors">
              classessmishra@gmail.com
            </a>
          </div>

          <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center">
            <div className="mb-6 p-4 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-50">
              <Phone size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Call Us</h2>
            <p className="text-slate-500 mb-6 text-sm">Our support team is available from Monday to Saturday, 9:00 AM to 6:00 PM.</p>
            <a href="tel:+918789443057" className="text-lg font-bold text-primary hover:text-indigo-700 transition-colors">
              +91 8789 443057
            </a>
          </div>

        </div>

        {/* Additional Info Section */}
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/50 rounded-full blur-[40px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-[40px]" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Office Location</h3>
                <p className="text-sm text-slate-600">
                  Mishra Classes<br/>
                  (Please contact us for exact center details in your city)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Working Hours</h3>
                <p className="text-sm text-slate-600">
                  Monday - Saturday: 9:00 AM - 6:00 PM<br/>
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
