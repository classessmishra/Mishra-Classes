"use client";

import { useEffect, useState, use } from "react";
import { getReportedQuestionsByTest, resolveReport } from "@/actions/tests";
import { Flag, CheckCircle, AlertTriangle, ExternalLink, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TestReportsPage() {
  const params = useParams();
  const testId = params.testId as string;
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function loadReports() {
      const data = await getReportedQuestionsByTest(testId);
      setReports(data || []);
      setLoading(false);
    }
    loadReports();
  }, [testId]);

  const openResolveModal = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedReport) return;
    setResolving(true);
    try {
      // Admin should have already fixed the question via Edit Test page.
      // This simply marks the report as resolved and recalcs scores.
      await resolveReport(selectedReport.id, selectedReport.test_id, -1, selectedReport.question_index);
      alert("Report resolved! Test scores for this test have been recalculated.");
      setIsModalOpen(false);
      setReports(reports.filter(r => r.id !== selectedReport.id));
    } catch (e: any) {
      alert("Failed to resolve: " + e.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      <Link href={`/admin/tests/${testId}/submissions`} className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-2 font-medium text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Submissions
      </Link>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reported Questions</h1>
          <p className="text-slate-500 text-sm">Review and fix questions reported by students for this test.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">No pending reports</h3>
          <p className="text-slate-500">All good! No questions have been reported by students for this test.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Question No.</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold bg-slate-100 px-3 py-1 rounded-lg">Q{report.question_index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    {report.users?.full_name || report.users?.phone || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openResolveModal(report)}
                      className="bg-green-50 text-green-700 hover:bg-green-100 font-bold px-4 py-2 rounded-lg transition-colors border border-green-200"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolve Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} /> Resolve Report
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-sm text-amber-800 flex gap-3">
                <AlertTriangle size={20} className="shrink-0 text-amber-500" />
                <p>
                  <strong>Important:</strong> Before resolving this report, you must first click "Edit Test" to fix the actual question and update its correct option or marks. 
                  Resolving this report will recalculate all student scores for this test based on the <b>current</b> state of the test.
                </p>
              </div>

              <div className="space-y-4 mb-6 text-sm text-slate-600">
                <p><strong>Student's Reason:</strong><br/> {selectedReport.reason}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button 
                  onClick={handleResolve}
                  disabled={resolving} 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                  {resolving ? "Resolving & Recalculating..." : "Recalculate Scores & Resolve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
