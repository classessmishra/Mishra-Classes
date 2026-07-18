import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Users, Award, ShieldCheck, Sparkles, GraduationCap, Target } from 'lucide-react';

export const metadata = {
  title: 'About Us | Mishra Classes',
  description: 'Learn more about Mishra Classes, our mission, and our expert coaching.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] relative overflow-hidden text-slate-100 font-sans selection:bg-primary/30">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-md mb-12"
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-24 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Sparkles size={16} />
            <span>Excellence in Education</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200 leading-[1.1]">
            Redefining English Coaching
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
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
              color: "from-blue-500/20 to-blue-600/5",
              border: "border-blue-500/20",
              iconColor: "text-blue-400",
            },
            {
              icon: Users,
              title: "Live Interactive Sessions",
              desc: "Engage directly with expert teachers in real-time classes, with chat, doubt solving, and polls.",
              color: "from-indigo-500/20 to-indigo-600/5",
              border: "border-indigo-500/20",
              iconColor: "text-indigo-400",
            },
            {
              icon: Target,
              title: "Performance Tracking",
              desc: "Regular automated tests and detailed analytics help identify weaknesses and track improvement.",
              color: "from-emerald-500/20 to-emerald-600/5",
              border: "border-emerald-500/20",
              iconColor: "text-emerald-400",
            },
            {
              icon: ShieldCheck,
              title: "Secure & Trusted",
              desc: "A modern, reliable, and highly secure digital platform for a seamless learning experience.",
              color: "from-purple-500/20 to-purple-600/5",
              border: "border-purple-500/20",
              iconColor: "text-purple-400",
            },
            {
              icon: GraduationCap,
              title: "Spoken English",
              desc: "Specialized programs designed to build confidence and fluency in spoken English.",
              color: "from-pink-500/20 to-pink-600/5",
              border: "border-pink-500/20",
              iconColor: "text-pink-400",
            },
            {
              icon: Award,
              title: "Proven Results",
              desc: "Years of experience and a track record of producing top scorers and confident speakers.",
              color: "from-amber-500/20 to-amber-600/5",
              border: "border-amber-500/20",
              iconColor: "text-amber-400",
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className={`group relative p-8 rounded-3xl bg-gradient-to-br ${feature.color} border ${feature.border} backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                  <Icon size={120} />
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl ${feature.iconColor}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Start Your Journey Today</h3>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Join thousands of students who have transformed their English skills with Mishra Classes.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(91,88,255,0.4)] hover:shadow-[0_0_60px_rgba(91,88,255,0.6)]"
            >
              Get Started Now
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
