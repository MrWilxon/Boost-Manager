'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/src/services/supabase';
import { motion } from 'motion/react';
import { Rocket, Mail, Lock, User, UserPlus, AlertCircle, Eye, EyeOff, Phone } from 'lucide-react';

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
          .update({ whatsapp: `+977${mobile}` })
          .eq('id', data.user.id);
          
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 mb-4">
            <Rocket className="text-white fill-white/20" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Create Account</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-2">Start your boosting journey today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex gap-3 text-rose-600 dark:text-rose-400 text-sm italic">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input 
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input 
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Mobile Number (Nepal)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 font-medium">+977</div>
              <input 
                type="tel"
                required
                className="w-full pl-20 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
                placeholder="98XXXXXXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
                placeholder="•••••••• (Min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
        </div>

        <button 
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full py-3 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="Google" />
          Continue with Google
        </button>

        <p className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-8">
          Already have an account? <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Log in</Link>
        </p>
        <p className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-6">
          <Link href="/privacy-policy" className="text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
