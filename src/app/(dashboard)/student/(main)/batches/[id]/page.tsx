"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function BatchOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const batchId = unwrappedParams.id;
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBatch() {
      const { data } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (data) {
        setBatch(data);
      }
      setLoading(false);
    }
    fetchBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!batch) {
    return <div className="p-8 text-center text-muted-foreground">Batch not found.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">{batch.name}</h2>
      <p className="text-muted-foreground mb-6">{batch.description || "No description provided."}</p>
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold mb-2 text-primary">Overview</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Welcome to the {batch.name} batch! Here you can find all your course materials, 
          upcoming tests, announcements, and track your attendance. Use the sidebar to navigate 
          through different sections of your batch.
        </p>
      </div>
    </div>
  );
}
