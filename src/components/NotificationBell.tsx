"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, MoreVertical, ArrowLeft, Mail } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, clearAllNotifications, clearNotification } from "@/actions/chat";

export default function NotificationBell({ 
  iconSize = 20, 
  buttonClassName = "relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" 
}: { 
  iconSize?: number, 
  buttonClassName?: string 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeNotifMenu, setActiveNotifMenu] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (idMatch) {
      getUserNotifications(idMatch[2]).then(data => {
        setNotifications(data || []);
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle hardware back button for the mobile full-screen notification panel
  useEffect(() => {
    const handlePopState = () => {
      if (notifOpen) {
        setNotifOpen(false);
      }
    };

    if (notifOpen && window.innerWidth < 768) {
      window.history.pushState({ modal: 'notification' }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [notifOpen]);

  const handleReadNotif = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setActiveNotifMenu(null);
  };

  const handleClearNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      await clearNotification(id, match[2]);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setActiveNotifMenu(null);
    }
  };

  const handleClearAllNotifs = async () => {
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      await clearAllNotifications(match[2]);
      setNotifications([]);
      setActiveNotifMenu(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={notifRef}>
      <button 
        onClick={() => setNotifOpen(!notifOpen)}
        className={buttonClassName}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[9px] bg-red-500 rounded-full border border-white flex items-center justify-center font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {notifOpen && (
        <>
          {/* Desktop Dropdown */}
          <div className="hidden md:flex absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border flex-col z-50 overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-border bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-foreground text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={handleClearAllNotifs} className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications.
                </div>
              ) : (
                notifications.map(n => {
                  const NotifWrapper = n.link_url ? 'a' : 'div';
                  return (
                    <div key={n.id} className="relative group">
                      <NotifWrapper 
                        href={n.link_url || undefined}
                        target={n.link_url ? "_blank" : undefined}
                        onClick={() => handleReadNotif(n.id)}
                        className={`block p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : 'bg-white'}`}
                      >
                        <div className="flex justify-between items-start mb-1 pr-6">
                          <h4 className={`text-sm ${!n.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                            {n.title}
                          </h4>
                          {!n.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 pr-6">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </NotifWrapper>
                      
                      {/* Context Menu Button */}
                      <div className="absolute top-4 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveNotifMenu(activeNotifMenu === n.id ? null : n.id); }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                      
                      {/* Context Menu */}
                      {activeNotifMenu === n.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveNotifMenu(null); }}></div>
                          <div className="absolute top-10 right-2 w-32 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReadNotif(n.id); }} 
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Mark as read
                            </button>
                            <button 
                              onClick={(e) => handleClearNotif(n.id, e)} 
                              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              Clear
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mobile Full Screen Notifications */}
          <div className="md:hidden fixed inset-0 z-[999999] bg-white flex flex-col">
            {/* Top Bar */}
            <div className="w-full h-[60px] bg-[#5B58FF] flex items-center px-4 shrink-0 shadow-md">
              <button onClick={() => {
                if (window.innerWidth < 768) {
                  window.history.back();
                } else {
                  setNotifOpen(false);
                }
              }} className="text-white p-2 -ml-2">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-white text-lg font-medium ml-4">Notifications</h1>
            </div>

            {/* Sub Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white shrink-0">
              <span className="text-[13px] text-gray-700 font-medium">
                {unreadCount === 0 ? "No new notification(s)" : `${unreadCount} new notification(s)`}
              </span>
              <button onClick={handleClearAllNotifs} className="text-[13px] text-gray-500 flex items-center gap-1.5 hover:text-gray-800">
                <Mail className="w-4 h-4" />
                All notifications read
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No new notifications.
                </div>
              ) : (
                notifications.map(n => {
                  const NotifWrapper = n.link_url ? 'a' : 'div';
                  return (
                    <div key={n.id} className="relative group border-b border-gray-100 last:border-b-0">
                      <NotifWrapper 
                        href={n.link_url || undefined}
                        target={n.link_url ? "_blank" : undefined}
                        onClick={() => handleReadNotif(n.id)}
                        className={`flex gap-4 p-4 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/30' : 'bg-white'}`}
                      >
                        {/* Left Icon (Bell in circle) */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Bell className="w-6 h-6 text-gray-500" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[15px] mb-1 ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                            {n.title}
                          </h4>
                          <p className="text-[13px] text-slate-600 mb-2 leading-snug break-words">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {new Date(n.created_at).toLocaleString('en-US', { hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                          </p>
                        </div>
                      </NotifWrapper>
                      
                      {/* Context Menu Button */}
                      <div className="absolute top-4 right-2 z-10 opacity-100">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveNotifMenu(activeNotifMenu === n.id ? null : n.id); }}
                          className="p-2 text-slate-400 hover:text-slate-700"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      
                      {/* Context Menu */}
                      {activeNotifMenu === n.id && (
                        <>
                          <div className="fixed inset-0 z-[210]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveNotifMenu(null); }}></div>
                          <div className="absolute top-12 right-6 w-36 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[220]">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReadNotif(n.id); }} 
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Mark as read
                            </button>
                            <button 
                              onClick={(e) => handleClearNotif(n.id, e)} 
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Clear
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
