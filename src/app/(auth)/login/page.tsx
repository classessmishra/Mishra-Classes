"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Zap, Sparkles, UserRound, KeyRound } from "lucide-react";
import { authenticateUser, sendOtp, verifyOtpLogin } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  
  // Shared State
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Password State
  const [password, setPassword] = useState("");
  
  // OTP State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Session and error check logic
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("logout") === "true") {
      document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
      document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch(e) {}
      return;
    }

    if (searchParams.get("error") === "session_expired") {
      setErrorMessage("Your session has expired or you have logged in from another device. Please log in again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const currentRole = document.cookie.split('; ').find(row => row.startsWith('auth_role='))?.split('=')[1];
    if (currentRole === 'admin' || currentRole === 'teacher') {
      window.location.href = "/admin";
    } else if (currentRole === 'student') {
      window.location.href = "/student/profile";
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handlePasswordLogin = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true); setErrorMessage(""); setSuccessMessage("");
    
    try {
      const isApp = typeof window !== 'undefined' && (window as any).ReactNativeWebView !== undefined;
      const loginSource = isApp ? 'app' : 'web';

      const result = await authenticateUser(email, password, loginSource);
      
      if (!result?.success || !result.data) {
        setErrorMessage(result?.error || "Login failed.");
        setLoading(false); return;
      }
      
      const { id, role: userRole } = result.data;
      if (userRole !== role) {
        setErrorMessage(`Your account is registered as a ${userRole}, not an ${role}.`);
        setLoading(false); return;
      }

      if (userRole === 'admin' || userRole === 'teacher') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage("System Error: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email."); return;
    }
    setLoading(true); setErrorMessage(""); setSuccessMessage("");
    
    try {
      const result = await sendOtp(email);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to send OTP.");
      } else {
        setSuccessMessage("OTP sent successfully to your email!");
        setOtpStep(2);
        setCooldown(60);
      }
    } catch (err: any) {
      setErrorMessage("System Error: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (otp.length < 6) {
      setErrorMessage("Please enter a valid 6-digit OTP."); return;
    }
    setLoading(true); setErrorMessage(""); setSuccessMessage("");
    
    try {
      const isApp = typeof window !== 'undefined' && (window as any).ReactNativeWebView !== undefined;
      const loginSource = isApp ? 'app' : 'web';

      const result = await verifyOtpLogin(email, otp, loginSource);
      
      if (!result?.success || !result.data) {
        setErrorMessage(result?.error || "Invalid OTP.");
        setLoading(false); return;
      }
      
      const { id, role: userRole } = result.data;
      if (userRole !== role) {
        setErrorMessage(`Your account is registered as a ${userRole}, not an ${role}.`);
        setLoading(false); return;
      }

      if (userRole === 'admin' || userRole === 'teacher') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage("System Error: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/60 relative">
        
        {/* Left Side - Illustration/Text */}
        <div className="hidden md:flex w-full md:w-1/2 p-10 lg:p-14 flex-col justify-center relative bg-gradient-to-br from-primary/[0.04] to-primary/[0.08] overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <Sparkles size={16} />
              <span>Welcome to the Best</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
              Welcome to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Mishra Classes
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-12 max-w-md leading-relaxed">
              Your ultimate destination for mastering English. Exclusive coaching for Class 9th to 12th & Spoken English, all in one secure platform.
            </p>

            <div className="relative w-full max-w-xs aspect-[4/3] rounded-2xl bg-gradient-to-tr from-white/60 to-white/20 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="w-full h-full rounded-xl bg-slate-50/60 border border-white/80 relative flex items-center justify-center overflow-hidden">
                <div className="w-32 h-32 rounded-full border-dashed border-2 border-primary/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-blue-400/20 blur-md" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="text-primary w-12 h-12" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center bg-white relative z-10 overflow-hidden">
          <div className="max-w-md w-full mx-auto">
            
            {/* Sliding Toggle */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center mb-8 relative">
              <div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-300 ease-in-out"
                style={{ left: loginMethod === 'password' ? '6px' : 'calc(50%)' }}
              />
              <button
                onClick={() => { setLoginMethod('password'); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${loginMethod === 'password' ? 'text-primary' : 'text-slate-500'}`}
              >
                Password Login
              </button>
              <button
                onClick={() => { setLoginMethod('otp'); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${loginMethod === 'otp' ? 'text-primary' : 'text-slate-500'}`}
              >
                OTP Login
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Login to your account</h2>
              <p className="text-slate-500">
                {loginMethod === 'password' ? "Enter your email and password" : "Get a one-time password via email"}
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2 mb-5">
                <span className="mt-0.5">⚠️</span>
                <p>{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2 mb-5">
                <span className="mt-0.5">✅</span>
                <p>{successMessage}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {loginMethod === 'password' ? (
                <motion.form 
                  key="password-form"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                  onSubmit={handlePasswordLogin} className="space-y-5"
                >
                  {/* Role Selection */}
                  <div className="space-y-1">
                    <label className="block text-[13px] font-medium text-slate-700">Login As</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <UserRound className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm">
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[13px] font-medium text-slate-700">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none" placeholder="name@example.com" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-[13px] font-medium text-slate-700">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none" placeholder="Enter your password" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 mt-4 flex items-center justify-center gap-2">
                    <span className="relative z-10">{loading ? "Processing..." : "Login Securely"}</span>
                  </button>
                  
                  <div className="mt-5 text-center">
                    <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                      Forgot your password? Click here
                    </Link>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                >
                  {otpStep === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-1">
                        <label className="block text-[13px] font-medium text-slate-700">Login As</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <UserRound className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[13px] font-medium text-slate-700">Email Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none" placeholder="name@example.com" />
                        </div>
                      </div>
                      
                      <button type="submit" disabled={loading} className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 mt-4 flex items-center justify-center gap-2">
                        <span className="relative z-10">{loading ? "Sending..." : "Send OTP"}</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="space-y-1">
                        <label className="block text-[13px] font-medium text-slate-700">Enter 6-Digit OTP</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <KeyRound className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none tracking-widest font-mono text-center text-lg" placeholder="------" />
                        </div>
                      </div>
                      
                      <button type="submit" disabled={loading || otp.length < 6} className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 mt-4 flex items-center justify-center gap-2">
                        <span className="relative z-10">{loading ? "Verifying..." : "Verify & Login"}</span>
                      </button>
                      
                      <div className="mt-5 flex items-center justify-between px-2">
                        <button type="button" onClick={() => { setOtpStep(1); setSuccessMessage(""); setErrorMessage(""); }} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                          Change Email
                        </button>
                        <button type="button" onClick={handleSendOtp} disabled={cooldown > 0} className={`text-sm font-semibold ${cooldown > 0 ? 'text-slate-400' : 'text-primary hover:underline'}`}>
                          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-center text-sm text-slate-500 mt-1">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Register here
                </Link>
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
