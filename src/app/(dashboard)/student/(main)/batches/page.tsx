"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BookOpen, Video, PlayCircle } from "lucide-react";
import { getStudentCourses } from "@/actions/courses";

export default function StudentPage() {
  const [batches, setBatches] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_student_enrolled_batches');
        return cached ? JSON.parse(cached) : [];
      } catch(e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem('cached_student_enrolled_batches');
      } catch(e) {}
    }
    return true;
  });

  useEffect(() => {
    async function fetchMyBatches() {
      // 1. Get user ID from cookies
      let userId = null;
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (match) {
        userId = match[2];
      } else {
        // Fallback for dev mode
        userId = "11111111-1111-1111-1111-111111111111";
      }

      // 2. Fetch enrollments for this user
      const { data, error } = await supabase
        .from('batch_students')
        .select(`
          batch_id,
          batches ( id, name, description )
        `)
        .eq('student_id', userId);

      if (!error && data) {
        // Extract the nested 'batches' object
        const extractedBatches = data
          .map((item: any) => item.batches)
          .filter(Boolean);
        setBatches(extractedBatches);
        try { localStorage.setItem('cached_student_enrolled_batches', JSON.stringify(extractedBatches)); } catch(e) {}
      }

      setLoading(false);
    }

    fetchMyBatches();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Batches */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-foreground">My Enrolled Batches</h2>
        
        {batches.length === 0 ? (
          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl md:rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-muted mx-auto rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No batch allotted</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't been added to any batches yet. Once your teacher assigns you to a batch, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <Link key={batch.id} href={`/batches/${batch.id}`}>
                <div className="group bg-gradient-to-br from-primary/10 to-primary/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-primary/20 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">{batch.name}</h3>
                  </div>
                  <p className="text-muted-foreground mb-6 line-clamp-2 text-sm h-10">
                    {batch.description || "No description provided."}
                  </p>
                  <div className="flex justify-between items-center text-sm font-semibold text-primary">
                    <span>Enter Batch</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
