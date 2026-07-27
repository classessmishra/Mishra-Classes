"use client";

import Link from "next/link";
import { Home, Users, Store, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(^| )auth_role=([^;]+)/);
    if (match) setRole(match[2]);
  }, []);

  const isAuthOrPublicPage = ['/about', '/terms', '/contact-us', '/cancellation-and-refunds', '/forgot-password', '/reset-password', '/login', '/signup', '/verify-email'].includes(pathname || '');

  // Never hide on admin or student dashboard, so it's always consistent
  if (pathname?.startsWith("/test/") || pathname?.startsWith("/student/live-class") || isAuthOrPublicPage) return null;

  // Determine Dashboard/Profile link based on role
  let dashboardHref = "/login";
  if (role === 'admin' || role === 'teacher') {
    dashboardHref = "/admin";
  } else if (role === 'student') {
    dashboardHref = "/student";
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Batches", href: "/batches", icon: Users },
    { name: "Chats", href: "/chats", icon: MessageSquare },
    { name: "Store", href: "/store", icon: Store },
    { name: "Profile", href: dashboardHref, icon: User }
  ];

  return (
    <div id="web-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-border/40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.name === "Profile" && pathname?.startsWith(item.href) && item.href !== "/login") || (item.name === "Chats" && pathname?.startsWith("/chats"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className={cn(isActive && "fill-primary/20 stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
