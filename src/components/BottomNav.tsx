"use client";

import Link from "next/link";
import { Home, Users, Store, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Batches", href: "/batches", icon: Users },
  { name: "Chats", href: "/chats", icon: MessageSquare },
  { name: "Store", href: "/store", icon: Store },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(^| )auth_role=([^;]+)/);
    if (match) setRole(match[2]);
  }, []);

  const isAuthOrPublicPage = ['/about', '/terms', '/contact-us', '/cancellation-and-refunds', '/forgot-password', '/reset-password', '/login', '/signup', '/verify-email'].includes(pathname || '');

  if (pathname?.startsWith("/test/") || pathname?.startsWith("/admin") || pathname?.startsWith("/chats/admin") || pathname?.startsWith("/student/live-class") || isAuthOrPublicPage) return null;

  const filteredItems = role === 'admin'
    ? [
        { name: "Home", href: "/", icon: Home },
        { name: "Dashboard", href: "/admin", icon: Users },
        { name: "Store", href: "/store", icon: Store },
      ]
    : role === 'student'
    ? [
        ...navItems,
        { name: "Dashboard", href: "/student", icon: LayoutDashboard }
      ]
    : navItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-border/40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
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
