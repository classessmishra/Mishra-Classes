"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Phone, User, ArrowRight, Sparkles, UserRound, Zap } from "lucide-react";
import { registerUser } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    
    if (!formData.gender) {
      setErrorMsg("Please select a gender");
      return;
    }

    setLoading(true);
    
    try {
      const result = await registerUser(formData);
      
      if (!result.success) {
        setErrorMsg(result.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Successfully registered, auto-login or redirect to login
      alert("Registration successful! You can now log in.");
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error", err);
      setErrorMsg("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/60 relative">
        
        {/* Left Side - Illustration/Text */}
        <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center relative bg-gradient-to-br from-primary/[0.04] to-primary/[0.08] overflow-hidden hidden md:flex">
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
              <span>Join the Community</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
              Start your journey with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Mishra Classes
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-12 max-w-md leading-relaxed">
              Create an account to access premium courses, live classes, and comprehensive study materials designed for your success.
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
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Create an account</h2>
              <p className="text-slate-500 text-sm">Please fill in your details to register</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3" autoComplete="off">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-slate-700">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    autoComplete="off"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none text-sm"
                    placeholder="Enter full name"
                  />
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
                    name="email"
                    required
                    autoComplete="new-email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[13px] font-medium text-slate-700">Mobile No</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      autoComplete="new-phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none text-sm"
                      placeholder="Mobile number"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[13px] font-medium text-slate-700">Gender</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserRound className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <select
                      name="gender"
                      required
                      autoComplete="off"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm"
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
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
                    name="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none text-sm"
                    placeholder="Create a password"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-slate-700">Retype Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 outline-none text-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-primary text-white font-semibold py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,68,204,0.3)] active:scale-[0.98] disabled:opacity-70 mt-2 flex items-center justify-center gap-2 text-sm"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{loading ? "Registering..." : "Create Account"}</span>
                {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
