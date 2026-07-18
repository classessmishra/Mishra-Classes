import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Award, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'About Us | Mishra Classes',
  description: 'Learn more about Mishra Classes, our mission, and our expert coaching.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <Link href="/login" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">About Mishra Classes</h1>
        </div>
        
        <div className="p-6 sm:p-12">
          
          {/* Mission Section */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Empowering Students Through Quality Education</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Mishra Classes is a premier educational institution dedicated to mastering English. 
              We provide exclusive, high-quality coaching for students from Class 9th to 12th, along with specialized Spoken English programs.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="flex gap-4 p-6 rounded-xl bg-blue-50 border border-blue-100/50">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Comprehensive Curriculum</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our expertly crafted study materials and detailed video lectures cover every aspect of the syllabus, ensuring complete conceptual clarity.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-indigo-50 border border-indigo-100/50">
              <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Live Interactive Sessions</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Engage directly with expert teachers in our real-time live classes, complete with live chat, doubt solving, and interactive polls.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-emerald-50 border border-emerald-100/50">
              <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <Award className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Performance Tracking</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Regular automated tests and detailed analytics help students identify their weaknesses and track their continuous improvement.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-purple-50 border border-purple-100/50">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Secure & Trusted Platform</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  A modern, reliable, and highly secure digital platform designed to provide a seamless learning experience without distractions.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Footer */}
          <div className="text-center border-t border-slate-100 pt-12">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Join Us Today</h3>
            <p className="text-slate-600 mb-6">
              Start your journey towards excellence in English. Let's achieve greatness together.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go to Login Page
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
