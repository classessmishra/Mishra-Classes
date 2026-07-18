"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshDashboardButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000); // UI delay for better UX
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-70"
    >
      <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
      {isRefreshing ? "Refreshing..." : "Refresh Data"}
    </button>
  );
}
