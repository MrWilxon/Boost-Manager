'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/src/services/supabase';
import { motion } from 'motion/react';
import { Rocket, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Login error message:", err.message);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1C1E] flex selection:bg-indigo-500/30 font-sans relative overflow-hidden">
      {/* Universal Background Noise Overlay */}
      <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none z-0"></div>

      {/* Left Panel - Visual/Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-black/30 z-10 bg-[#1A1C1E]">
         {/* Animated Background */}
         <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-rose-600/5 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
         </div>
         
         <div className="relative z-10 flex items-center gap-3">
            <div className="bg-indigo-600/90 p-2.5 rounded-xl shadow-[-4px_-4px_10px_rgba(255,255,255,0.05),_4px_4px_10px_rgba(0,0,0,0.5)]">
               <Rocket className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">BOOSTMGR</span>
         </div>
         
         <div className="relative z-10 max-w-md">
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="text-4xl font-black text-white leading-[1.1] tracking-tight mb-6"
            >
               Deploy campaigns at the speed of thought.
            </motion.h2>
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
               className="space-y-4"
            >
               {[
                 'Zero-latency campaign deployment',
                 'Algorithmic targeting engine',
                 'Automated ROI optimization'
               ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                     </div>
                     <span className="text-zinc-400 font-medium text-sm">{feature}</span>
                  </div>
               ))}
            </motion.div>
         </div>

         <div className="relative z-10 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Boost Manager System
         </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#1A1C1E]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
               <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[-4px_-4px_10px_rgba(255,255,255,0.05),_4px_4px_10px_rgba(0,0,0,0.5)]">
                  <Rocket className="text-white w-5 h-5" />
               </div>
               <span className="text-xl font-black tracking-tight text-white">BOOSTMGR</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome back.</h1>
            <p className="text-zinc-500 text-sm font-medium">Enter your credentials to access the engine.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 text-rose-400 text-sm font-medium shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.01),_inset_3px_3px_8px_rgba(0,0,0,0.4)]"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 nm-inset rounded-xl text-white outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder:text-zinc-600 focus:ring-4 focus:ring-indigo-500/5 text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-4 nm-inset rounded-xl text-white outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder:text-zinc-600 focus:ring-4 focus:ring-indigo-500/5 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-[-4px_-4px_12px_rgba(255,255,255,0.05),_4px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[-5px_-5px_15px_rgba(255,255,255,0.08),_5px_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 group disabled:opacity-50 text-xs active:scale-[0.98] active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.04),_inset_3px_3px_8px_rgba(0,0,0,0.6)] cursor-pointer"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.02)]"></div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">or continue with</span>
            <div className="h-px flex-1 bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.02)]"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading}
            className="w-full py-4 nm-flat hover:nm-concave text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm active:scale-[0.98] active:shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.02),_inset_3px_3px_8px_rgba(0,0,0,0.6)] cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="Google" />
            Continue with Google
          </button>

          <p className="text-center text-zinc-500 text-xs font-medium mt-10">
            No active session? <Link href="/signup" className="text-white font-bold hover:underline">Request access</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
