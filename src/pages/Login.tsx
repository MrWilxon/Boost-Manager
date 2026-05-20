import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { motion } from 'motion/react';
import { Rocket, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completion.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`This domain (${domain}) is not authorized in Firebase Console. Please add it to "Authorized domains" in Authentication settings.`);
      } else {
        setError(`Error: ${err.message || 'An error occurred during Google login.'}`);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error code:", err.code);
      console.error("Login error message:", err.message);
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email or password is incorrect');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled for this project. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`This domain (${domain}) is not authorized in Firebase Console. Please add it to "Authorized domains" in Authentication settings.`);
      } else if (err.code === 'auth/too-many-requests') {
        setError('Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'An error occurred during login. Please try again.');
      }
    } finally {
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Welcome Back</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-2">Log in to manage your ad boosts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex gap-3 text-rose-600 dark:text-rose-400 text-sm italic">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            <div className="flex justify-between mb-1.5 ml-1">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
                placeholder="••••••••"
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
            {loading ? 'Logging in...' : (
              <>
                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-bold transition-all flex items-center justify-center gap-3 mb-6 group disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="Google" />
          Continue with Google
        </button>

        <p className="text-center text-slate-500 dark:text-zinc-400 text-sm">
          Don't have an account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign up for free</Link>
        </p>
        <p className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-6">
          <Link to="/privacy-policy" className="text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
