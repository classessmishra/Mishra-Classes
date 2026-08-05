"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getStudentBatches } from "@/actions/batches";

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_student_batches');
        return cached ? JSON.parse(cached) : [];
      } catch(e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem('cached_student_batches');
      } catch(e) {}
    }
    return true;
  });

  useEffect(() => {
    async function fetchMyBatches() {
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        const data = await getStudentBatches(match[2]);
        if (data) {
          setBatches(data);
          try { localStorage.setItem('cached_student_batches', JSON.stringify(data)); } catch(e) {}
        }
      }
      setLoading(false);
    }
    fetchMyBatches();
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 pt-24 pb-28 md:py-8 max-w-5xl"
    >
      <div className="mb-6 md:mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 md:mb-4">Your Batches</h1>
        <p className="text-sm md:text-lg text-muted-foreground">Select a batch to view tests and announcements.</p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : batches.length > 0 ? (
          batches.map((batch, idx) => (
            <Link href={`/batches/${batch.id}`} key={idx} className="block group">
              <div className="bg-card border border-border p-5 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-sm group-hover:shadow-md group-hover:border-primary/50 transition-all">
                <div className="space-y-3 md:space-y-4 flex-1">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      {batch.status || 'Active'}
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-muted-foreground flex items-center gap-1">
                      <Users size={14} /> {batch.seats || 'Unlimited'}
                    </span>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{batch.name}</h2>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 text-xs md:text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 md:px-3 py-1.5 rounded-lg">
                      <Calendar size={16} className="text-primary" /> {batch.timings ? batch.timings.split(' - ')[0] : 'To be announced'}
                    </div>
                    {batch.timings && batch.timings.split(' - ')[1] && (
                      <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <Clock size={16} className="text-primary" /> {batch.timings.split(' - ')[1]}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 md:gap-3 md:w-48 shrink-0 mt-2 md:mt-0">
                  <div className="text-xs md:text-sm text-left md:text-right text-muted-foreground">
                    Instructor: <span className="font-bold text-foreground">{batch.instructor || 'TBA'}</span>
                  </div>
                  <button className="w-full bg-primary text-white font-bold py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base hover:bg-primary/90 transition-all shadow-md md:shadow-lg shadow-primary/20 pointer-events-none">
                    View Batch
                  </button>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Users size={32} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Batches Allotted Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't been assigned to any batches. Once the admin adds you to a batch using your name or mobile number, it will appear here.
            </p>
          </div>
        )}
      </div>
    </motion.main>
  );
}
