"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { getTests, assignTest } from "@/actions/tests";
import { getBatches } from "@/actions/batches";

export default function TestAssignPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [t, b] = await Promise.all([getTests(), getBatches()]);
    setTests(t);
    setBatches(b);
    if (t.length > 0) setSelectedTest(t[0].id);
    if (b.length > 0) setSelectedBatch(b[0].id);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignTest(selectedTest, { batch_id: selectedBatch });
      alert("Test assigned to batch successfully!");
    } catch (err: any) {
      alert("Error assigning test: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Test Allocation Engine</h1>
        <p className="text-muted-foreground">Assign existing tests to batches or individual students.</p>
      </div>

      <form onSubmit={handleAssign} className="bg-card p-6 rounded-2xl border border-border space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Test</label>
          <select 
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none"
          >
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.title} ({t.duration_minutes} Mins)</option>
            ))}
            {tests.length === 0 && <option value="">No tests found</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Assign To Batch</label>
          <select 
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
            {batches.length === 0 && <option value="">No batches found</option>}
          </select>
        </div>

        <button 
          disabled={loading || !selectedTest || !selectedBatch}
          type="submit" 
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Assigning..." : <><Send size={20} /> Assign Test</>}
        </button>
      </form>
    </div>
  );
}
