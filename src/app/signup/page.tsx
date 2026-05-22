'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/src/services/supabase';
import { motion } from 'motion/react';
import { Rocket, Mail, Lock, User, UserPlus, AlertCircle, Eye, EyeOff, Phone, Target } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: name,
          }
        }
      });
      
      if (signupError) throw signupError;

      if (data.user) {
        // Save mobile number to profiles table (as whatsapp/mobile)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, whatsapp: `+977${mobile}` }, { onConflict: 'id' });
          
        if (profileError) {
          console.error("Error updating profile mobile number:", profileError);
        }
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Signup error message:", err.message);
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setError(err.message || 'An error occurred during Google sign up.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex selection:bg-indigo-500/30 font-sans relative overflow-hidden">
      {/* Universal Background Noise Overlay */}
      <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none z-0"></div>

      {/* Left Panel - Visual/Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-black/30 z-10 bg-surface">
         <div className="relative z-10">
            <Link href="/" className="flex items-center gap-3 mb-16 group w-fit">
               <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[-4px_-4px_10px_rgba(255,255,255,0.05),_4px_4px_10px_rgba(0,0,0,0.5)] group-hover:bg-indigo-500 transition-colors">
                  <Rocket className="text-main w-5 h-5" />
               </div>
               <span className="text-xl font-black tracking-tight text-main">Boost Manager</span>
            </Link>
            <motion.h2
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="text-4xl font-black text-main leading-[1.1] tracking-tight mb-6"
            >
               The ultimate growth operating system.
            </motion.h2>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
               className="space-y-4"
            >
               {[
                 'Access exclusive engagement networks',
                 'Track campaign ROI in real-time',
                 'Secure wallet-based infrastructure'
               ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
                        <Target className="w-3.5 h-3.5" />
                     </div>
                     <span className="text-muted font-medium text-sm">{feature}</span>
                  </div>
               ))}
            </motion.div>
         </div>

         <div className="relative z-10 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Boost Manager System
         </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto z-10 bg-surface">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="w-full max-w-sm relative z-10 py-10 bg-white/5 backdrop-blur-sm nm-flat rounded-2xl p-8 shadow-xl"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
               <Link href="/" className="flex items-center gap-3 group">
                  <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[-4px_-4px_10px_rgba(255,255,255,0.05),_4px_4px_10px_rgba(0,0,0,0.5)] group-hover:bg-indigo-500 transition-colors">
                     <Rocket className="text-main w-5 h-5" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-main">Boost Manager</span>
               </Link>
            </div>
            <h1 className="text-3xl font-black text-main tracking-tight mb-2">Create Account.</h1>
            <p className="text-muted text-sm font-medium">Sign up to get started with Boost Manager.</p>
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

          <form onSubmit={handleSignup} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder-muted focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder-muted focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mobile Number (Nepal)</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-400 transition-colors" size={18} />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs">+977</div>
                <input
                  type="tel"
                  required
                  className="w-full pl-20 pr-4 py-4 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder-muted focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="98XXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-4 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium placeholder-muted focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  placeholder="•••••••• (Min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors"
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
                   Create Account <UserPlus size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>


          <p className="text-center text-muted text-xs font-medium mt-10">
            Already have an account? <Link href="/login" className="text-main font-bold hover:underline">Log in here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
