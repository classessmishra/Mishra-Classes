"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Zap, Sparkles, UserRound } from "lucide-react";
import { authenticateUser } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Main Admin hardcoded login
      if (email === "classessmishra@gmail.com" && password === "Nitich14@in") {
        if (role !== "admin") {
          alert("Please select 'Admin' in the 'Login As' dropdown.");
          setLoading(false);
          return;
        }
        document.cookie = "auth_role=admin; path=/";
        document.cookie = "user_id=00000000-0000-0000-0000-000000000000; path=/";
        router.push("/admin");
        return;
      }

      const result = await authenticateUser(email, password);
      
      if (!result.success || !result.data) {
        alert(result.error);
        setLoading(false);
        return;
      }
      
      const { id, role: userRole } = result.data;

      if (userRole !== role) {
        alert(`Your account is registered as a ${userRole}, not an ${role}.`);
        setLoading(false);
        return;
      }

      document.cookie = `auth_role=${userRole}; path=/`;
      document.cookie = `user_id=${id}; path=/`;
      
      if (userRole === 'admin' || userRole === 'teacher') {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();

    } catch (err) {
      console.error("Login error", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/60 relative">
        
        {/* Left Side - Illustration/Text */}
        <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center relative bg-gradient-to-br from-primary/[0.04] to-primary/[0.08] overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
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

            {/* Abstract futuristic shapes representing illustration */}
            <div className="relative w-full max-w-xs aspect-[4/3] rounded-2xl bg-gradient-to-tr from-white/60 to-white/20 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="w-full h-full rounded-xl bg-slate-50/60 border border-white/80 relative flex items-center justify-center overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-dashed border-2 border-primary/30 flex items-center justify-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-blue-400/20 blur-md" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="text-primary w-12 h-12" />
                </div>
                
                {/* Floating elements */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-blue-100/80 border border-blue-200/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                   <div className="w-4 h-1 rounded-full bg-blue-400" />
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-indigo-100/80 border border-indigo-200/50 flex items-center justify-center shadow-sm backdrop-blur-sm">
                   <div className="w-4 h-4 rounded-full bg-indigo-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center bg-white relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Login to your account</h2>
              <p className="text-slate-500">Please enter your email and password to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-slate-700">Login As</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserRound className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm"
                  >
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
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-slate-700">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 mt-4 flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{loading ? "Processing..." : "Proceed Securely"}</span>
                {!loading && <ArrowRight className="relative z-10 h-5 w-5" />}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline block p-4 -m-4 relative z-50">
                Forgot your password? Click here
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-500 max-w-sm">
                <Link href="/about" className="hover:text-primary hover:underline transition-colors">
                  About Us
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link href="/terms" className="hover:text-primary hover:underline transition-colors">
                  Terms & Conditions
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link href="/contact-us" className="hover:text-primary hover:underline transition-colors">
                  Contact Us
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link href="/cancellation-and-refunds" className="hover:text-primary hover:underline transition-colors">
                  Cancellation and Refunds
                </Link>
              </div>
              <p className="text-center text-sm text-slate-500 mt-1">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

