"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Clock, Award } from "lucide-react";

export default function TestLandingPage() {
  const tests = [
    { title: "Class 10 English Mock - Grammar", duration: "60 Mins", marks: 50 },
    { title: "Class 12 English Core Full Syllabus", duration: "180 Mins", marks: 80 },
    { title: "Spoken English Fluency Assessment", duration: "30 Mins", marks: 25 },
  ];

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-5xl"
    >
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-3xl p-8 md:p-12 mb-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Mishra Classes Test Series</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-8">
            Evaluate your preparation with our rigorous, exam-pattern mock tests. Experience the real exam environment with our next-gen anti-cheat platform.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute right-20 -bottom-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-6">Available Mock Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test, idx) => (
          <div key={idx} className="bg-card border border-border p-6 rounded-2xl flex flex-col hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{test.title}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium mb-6 mt-auto">
              <div className="flex items-center gap-1.5"><Clock size={16} /> {test.duration}</div>
              <div className="flex items-center gap-1.5"><Award size={16} /> {test.marks} Marks</div>
            </div>

            <Link href="/login" className="w-full text-center bg-muted text-foreground font-bold py-3 rounded-xl border border-border hover:bg-primary hover:text-white hover:border-primary transition-all">
              Login to Attempt
            </Link>
          </div>
        ))}
      </div>
    </motion.main>
  );
}
