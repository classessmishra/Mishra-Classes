import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Award, ShieldCheck, Sparkles, GraduationCap, Target } from 'lucide-react';

export const metadata = {
  title: 'About Us | Mishra Classes',
  description: 'Learn more about Mishra Classes, our mission, and our expert coaching.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-indigo-300/20 blur-[100px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm mb-12"
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-24 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold mb-6 shadow-sm">
            <Sparkles size={16} className="text-blue-500" />
            <span>Excellence in Education</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.15]">
            Redefining <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">English Coaching</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Mishra Classes is a premier educational institution dedicated to mastering English. 
            We provide exclusive, high-quality coaching for students from Class 9th to 12th, along with specialized Spoken English programs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          
          {[
            {
              icon: BookOpen,
              title: "Comprehensive Curriculum",
              desc: "Expertly crafted study materials and detailed video lectures covering every aspect of the syllabus.",
              color: "bg-blue-50",
              border: "border-blue-100",
              iconColor: "text-blue-600",
              iconBg: "bg-blue-100",
            },
            {
              icon: Users,
              title: "Live Interactive Sessions",
              desc: "Engage directly with expert teachers in real-time classes, with chat, doubt solving, and polls.",
              color: "bg-indigo-50",
              border: "border-indigo-100",
              iconColor: "text-indigo-600",
              iconBg: "bg-indigo-100",
            },
            {
              icon: Target,
              title: "Performance Tracking",
              desc: "Regular automated tests and detailed analytics help identify weaknesses and track improvement.",
              color: "bg-emerald-50",
              border: "border-emerald-100",
              iconColor: "text-emerald-600",
              iconBg: "bg-emerald-100",
            },
            {
              icon: ShieldCheck,
              title: "Secure & Trusted",
              desc: "A modern, reliable, and highly secure digital platform for a seamless learning experience.",
              color: "bg-purple-50",
              border: "border-purple-100",
              iconColor: "text-purple-600",
              iconBg: "bg-purple-100",
            },
            {
              icon: GraduationCap,
              title: "Spoken English",
              desc: "Specialized programs designed to build confidence and fluency in spoken English.",
              color: "bg-pink-50",
              border: "border-pink-100",
              iconColor: "text-pink-600",
              iconBg: "bg-pink-100",
            },
            {
              icon: Award,
              title: "Proven Results",
              desc: "Years of experience and a track record of producing top scorers and confident speakers.",
              color: "bg-amber-50",
              border: "border-amber-100",
              iconColor: "text-amber-600",
              iconBg: "bg-amber-100",
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className={`group relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-${feature.iconColor}/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 group-hover:scale-110 ${feature.iconColor}`}>
                  <Icon size={140} />
                </div>
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 shadow-sm border border-white`}>
                  <Icon size={26} className={feature.iconColor} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-xl p-8 sm:p-14 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">Start Your Journey Today</h3>
            <p className="text-slate-600 mb-10 max-w-xl mx-auto text-lg">
              Join thousands of students who have transformed their English skills with Mishra Classes.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-2xl text-white bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/30"
            >
              Get Started Now
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
