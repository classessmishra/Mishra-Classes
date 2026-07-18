"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/actions/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      const result = await resetPassword(token, password);
      
      if (!result.success) {
        setErrorMsg(result.error || "Failed to reset password.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      setErrorMsg("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/60 relative z-10 p-8 sm:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!isSuccess && (
          <Link href="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
          </Link>
        )}

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Password Reset Successfully!</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Your password has been changed successfully. You can now login with your new password.
            </p>
            <p className="text-sm font-bold text-slate-500 animate-pulse">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 border border-primary/20">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Set New Password</h2>
              <p className="text-slate-500 text-[15px]">Create a new, strong password for your account.</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-700">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none shadow-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-700">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none shadow-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !token}
                className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{loading ? "Resetting..." : "Reset Password"}</span>
                {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-8">
      <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
