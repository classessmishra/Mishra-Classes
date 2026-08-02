"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function BatchAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = use(params);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      setUserId(match[2]);
    } else {
      setUserId("11111111-1111-1111-1111-111111111111");
    }
  }, []);

  useEffect(() => {
    async function fetchAttendance() {
      if (!userId) return;
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('batch_id', batchId)
        .eq('student_id', userId)
        .order('date', { ascending: false });
      
      if (data) {
        setAttendance(data);
      }
      setLoading(false);
    }
    fetchAttendance();
  }, [batchId, userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalClasses = attendance.length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">My Attendance</h2>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        <div className="bg-muted/30 p-2 sm:p-4 rounded-xl border border-border flex flex-col items-center justify-center text-center">
          <div className="text-[10px] sm:text-sm text-muted-foreground mb-1 leading-tight">Total Classes</div>
          <div className="text-xl sm:text-2xl font-bold">{totalClasses}</div>
        </div>
        <div className="bg-green-50 p-2 sm:p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] sm:text-sm text-green-700 mb-1 leading-tight">Present</div>
          <div className="text-xl sm:text-2xl font-bold text-green-700">{presentCount}</div>
        </div>
        <div className="bg-primary/5 p-2 sm:p-4 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] sm:text-sm text-primary mb-1 leading-tight">Percentage</div>
          <div className="text-xl sm:text-2xl font-bold text-primary">{percentage}%</div>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-4">Recent Records</h3>
      {attendance.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attendance records found yet.</p>
      ) : (
        <div className="space-y-3">
          {attendance.map((record) => (
            <div key={record.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-card">
              <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {record.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
