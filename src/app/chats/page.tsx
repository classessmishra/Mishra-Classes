"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check auth state from cookies
    const match = document.cookie.match(/(^| )auth_role=([^;]+)/);
    if (match) {
      const role = match[2];
      if (role === 'admin') {
        router.push('/admin/chats');
      } else if (role === 'student') {
        router.push('/chats/student');
      } else {
        setChecking(false);
      }
    } else {
      setChecking(false);
    }
  }, [router]);

  // Prevent flashing the login UI while we redirect the user
  if (checking) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]"
    >
      <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl text-center shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-muted mx-auto rounded-full flex items-center justify-center mb-6 relative">
            <MessageCircle size={32} className="text-muted-foreground" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-background rounded-full flex items-center justify-center border border-border">
              <Lock size={16} className="text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">Community Chats</h1>
          <p className="text-muted-foreground mb-8">
            Please Login to access Community Chats & Doubt Solving. Connect with peers and instructors in real-time.
          </p>
          
          <Link href="/login" className="inline-block w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
            Login Now
          </Link>
        </div>
      </div>
    </motion.main>
  );
}
