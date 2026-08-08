"use client";

import { useState, useEffect } from "react";
import { getBatchAnnouncements } from "@/actions/announcements";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { Megaphone, Calendar, ExternalLink } from "lucide-react";
import { use } from "react";

export default function BatchAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatchAnnouncements(unwrappedParams.id).then(data => {
      setAnnouncements(data);
      setLoading(false);
    });

    const channel = supabase
      .channel(`announcements:${unwrappedParams.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'batch_announcements',
        filter: `batch_id=eq.${unwrappedParams.id}`
      }, (payload) => {
        setAnnouncements(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unwrappedParams.id]);

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-muted mx-auto rounded-full flex items-center justify-center mb-4 mt-12">
          <span className="text-2xl">📢</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No announcements</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your instructor hasn't posted any announcements for this batch yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Megaphone className="text-blue-600" /> Batch Announcements
      </h2>
      
      <div className="space-y-4">
        {announcements.map((ann, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800">{ann.title}</h3>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                <Calendar size={12} /> {new Date(ann.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{ann.message}</p>
            {ann.link_url && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <a 
                  href={ann.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  Open Attachment
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
