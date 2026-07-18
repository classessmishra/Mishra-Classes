"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { verifyEmail } from "@/actions/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg("Invalid verification link.");
      return;
    }

    const processVerification = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setStatus('success');
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus('error');
          setErrorMsg(result.error || "Verification failed.");
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg("Something went wrong. Please try again.");
      }
    };

    processVerification();
  }, [token, router]);

  return (
    <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/60 relative z-10 p-8 sm:p-12 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email</h2>
          <p className="text-slate-500">Please wait a moment...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Email Verified!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your email has been successfully verified. You can now access all features of Mishra Classes.
          </p>
          <p className="text-sm font-bold text-slate-500 animate-pulse">
            Redirecting to login...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Verification Failed</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {errorMsg}
          </p>
          <Link
            href="/login"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Return to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-8">
      <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
