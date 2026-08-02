import { 
  Users, BookOpen, Clock, TrendingUp, CheckCircle, AlertCircle, FileText, Megaphone
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import RefreshDashboardButton from "@/components/RefreshDashboardButton";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { activeStudents, totalBatches, upcomingTests, totalCourses, recentEnrollments } = await getDashboardStats();

  const stats = [
    { title: "Total Active Students", value: (activeStudents || 0).toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100", trend: "Real-time sync" },
    { title: "Ongoing Batches", value: (totalBatches || 0).toString(), icon: Clock, color: "text-purple-600", bg: "bg-purple-100", trend: "Real-time sync" },
    { title: "Upcoming Tests", value: (upcomingTests || 0).toString(), icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", trend: "Real-time sync" },
    { title: "Total Courses", value: (totalCourses || 0).toString(), icon: BookOpen, color: "text-orange-600", bg: "bg-orange-100", trend: "Active catalog" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <RefreshDashboardButton />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
            <div className="flex items-center text-xs font-medium text-slate-500">
              <TrendingUp size={14} className="mr-1 text-slate-400" />
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Enrollments</h3>
            <Link href="/admin/users" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEnrollments.length > 0 ? recentEnrollments.map((student, i) => (
              <div key={student.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {student.full_name ? student.full_name.substring(0, 2).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{student.full_name || 'Unknown Student'}</p>
                    <p className="text-xs text-slate-500">Phone: {student.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700">
                    {new Date(student.created_at).toLocaleDateString()}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                    Completed
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500 text-sm">No recent enrollments found.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { name: "Add Student to Batch", href: "/admin/batches", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { name: "Upload Mock Test", href: "/admin/tests", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
              { name: "Send Global Announcement", href: "/admin/communications", icon: Megaphone, color: "text-orange-600", bg: "bg-orange-50" },
              { name: "Review Attendance", href: "/admin/attendance", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            ].map((action, idx) => (
              <Link key={idx} href={action.href} className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group text-left">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg}`}>
                  <action.icon size={18} className={action.color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{action.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click to proceed</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
