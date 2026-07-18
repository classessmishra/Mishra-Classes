"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const result = await forgotPassword(email);
      
      if (!result.success) {
        setErrorMsg(result.error || "Something went wrong.");
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setErrorMsg("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/60 relative z-10 p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Login
          </Link>

          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Check your email</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We've sent a password reset link to <br/>
                <span className="font-semibold text-slate-900">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Didn't receive the email? Check your spam folder or <button type="button" onClick={() => setIsSuccess(false)} className="text-primary hover:underline font-semibold">try another email</button>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 border border-primary/20">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Forgot Password?</h2>
                <p className="text-slate-500 text-[15px]">No worries! Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-slate-700">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none shadow-sm"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{loading ? "Sending..." : "Send Reset Link"}</span>
                  {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
