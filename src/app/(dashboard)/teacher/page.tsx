export default function TeacherDashboard() {
  return (
    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto mt-10">
      <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-3">Teacher Dashboard</h2>
      <p className="text-slate-500 text-lg">Your portal is currently being set up. Soon you'll be able to manage your classes, view student progress, and take attendance from here.</p>
    </div>
  );
}
