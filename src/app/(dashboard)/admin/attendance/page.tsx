"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle, XCircle, Search } from "lucide-react";
import { getBatches, getStudentsInBatch, markAttendance, getAttendanceByDate, removeAttendance } from "@/actions/batches";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const filteredStudents = students.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone?.includes(searchQuery));
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent'>>({});

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch);
    } else {
      setStudents([]);
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedBatch && selectedDate) {
      loadAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const fetchBatches = async () => {
    const data = await getBatches();
    setBatches(data);
    if (data.length > 0) setSelectedBatch(data[0].id);
  };

  const fetchStudents = async (batchId: string) => {
    const data = await getStudentsInBatch(batchId);
    setStudents(data);
  };

  const loadAttendance = async () => {
    if (!selectedBatch || !selectedDate) return;
    const data = await getAttendanceByDate(selectedBatch, selectedDate);
    const stateObj: Record<string, 'present' | 'absent'> = {};
    data.forEach((row: any) => {
      stateObj[row.student_id] = row.status;
    });
    setAttendanceState(stateObj);
  };

  const handleMark = async (studentId: string, status: 'present' | 'absent') => {
    const isCurrentlyMarked = attendanceState[studentId] === status;
    const newStatus = isCurrentlyMarked ? undefined : status;

    setAttendanceState(prev => {
      const newState = { ...prev };
      if (newStatus) {
        newState[studentId] = newStatus;
      } else {
        delete newState[studentId];
      }
      return newState;
    });
    
    try {
      if (newStatus) {
        await markAttendance(selectedBatch, studentId, selectedDate, newStatus);
      } else {
        await removeAttendance(selectedBatch, studentId, selectedDate);
      }
    } catch (err: any) {
      alert("Failed to save attendance: " + err.message);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return alert("No students found in this batch");
    const batchName = batches.find(b => b.id === selectedBatch)?.name || "Batch";
    const headers = ["ID", "Full Name", "Phone", "Date", "Batch", "Status"];
    const csvRows = students.map(student => {
      const id = student.id;
      const name = `"${student.full_name || ''}"`;
      const phone = `"${student.phone || ''}"`;
      const dateStr = selectedDate;
      const status = attendanceState[student.id] || "Not Marked";
      return [id, name, phone, dateStr, `"${batchName}"`, status].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mishra_classes_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Smart Attendance</h1>
          <p className="text-muted-foreground text-sm">Select a batch and date to mark attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Export CSV
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Print PDF
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col md:flex-row gap-6 print:hidden">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
            {batches.length === 0 && <option value="">No batches found</option>}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden print:border-none">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="font-bold text-lg">Student List</h2>
          <span className="text-sm font-medium text-primary">
            {Object.values(attendanceState).filter(s => s === 'present').length} Present / {students.length} Total
          </span>
        </div>

        <div className="p-4 border-b border-border bg-white print:hidden">
          <div className="relative" onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search students by name or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            {showSuggestions && searchQuery.trim().length > 0 && filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredStudents.slice(0, 5).map(student => (
                  <div 
                    key={student.id} 
                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                    onClick={() => {
                      setSearchQuery(student.full_name || student.phone || "");
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-semibold text-slate-800 text-sm">{student.full_name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{student.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {filteredStudents.map((student) => (
            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {student.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{student.full_name || "Unknown Student"}</h3>
                  <p className="text-xs text-muted-foreground">Phone: {student.phone || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={() => handleMark(student.id, 'present')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    attendanceState[student.id] === "present"
                      ? "bg-green-100 text-green-700 border-green-200 border"
                      : "bg-white text-muted-foreground hover:bg-muted border-border border"
                  }`}
                >
                  <CheckCircle size={16} /> Present
                </button>
                <button
                  onClick={() => handleMark(student.id, 'absent')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    attendanceState[student.id] === "absent"
                      ? "bg-red-100 text-red-700 border-red-200 border"
                      : "bg-white text-muted-foreground hover:bg-muted border-border border"
                  }`}
                >
                  <XCircle size={16} /> Absent
                </button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No students found in this batch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
