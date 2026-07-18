"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Store, MessageSquare, User, LayoutDashboard } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home, exact: true },
    { name: 'Batches', href: '/student/batches', icon: Users },
    { name: 'Store', href: '/student/courses', icon: Store },
    { name: 'Chats', href: '/student/chats', icon: MessageSquare },
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard, exact: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full h-[80px] bg-white z-[99999] border-t flex md:hidden items-center justify-around px-2 pb-safe m-0 max-w-none shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full pt-1"
          >
            <div 
              className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            </div>
            <span 
              className={`text-[10px] font-medium mt-1 transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-gray-500'
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
