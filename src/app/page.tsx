'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  Rocket, 
  Shield, 
  Zap, 
  ArrowRight, 
  BarChart3, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  TrendingUp,
  Target
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 flex justify-between items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <Rocket className="text-white w-5 h-5 md:w-[22px] md:h-[22px]" />
          </div>
          <span className="text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent truncate max-w-[150px] md:max-w-none">
            Boost Manager
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-8 shrink-0">
          <Link href="/login" className="text-xs md:text-sm font-bold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest px-2 py-2">Log In</Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-zinc-950 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10 uppercase tracking-widest text-center whitespace-nowrap">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-40 grid lg:grid-cols-12 gap-16 items-center">
        <motion.div 
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-8 border border-indigo-100 dark:border-indigo-500/20">
            <Zap size={12} className="fill-current" />
            Empowering Digital Creators
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 tracking-tighter text-slate-900 dark:text-white">
            Scale Your <br />
            <span className="text-indigo-600 inline-block">Social Identity.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-zinc-300 mb-12 leading-relaxed max-w-xl font-medium">
            The world's most trusted engine for digital growth. 
            Automated boosting, precise targeting, and real-time ROI tracking across all major networks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-16">
            <Link href="/signup" className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-lg font-black transition-all shadow-2xl shadow-indigo-200 dark:shadow-indigo-950/40 group uppercase tracking-widest">
              Start Your Campaign
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <Facebook size={24} className="hover:text-[#1877F2]" />
            <Instagram size={24} className="hover:text-[#E4405F]" />
            <Twitter size={24} className="hover:text-[#1DA1F2]" />
            <Youtube size={24} className="hover:text-[#FF0000]" />
          </div>
        </motion.div>
        
        <motion.div 
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
        >
          {/* Main Dashboard Card */}
          <div className="relative z-10 bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                  <TrendingUp className="text-white" size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-black">Live Pulse</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Network Status</p>
                </div>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Active
              </div>
            </div>

            <div className="space-y-6">
              {[
                { platform: 'Facebook', value: 85, color: 'bg-indigo-500', icon: Facebook },
                { platform: 'Instagram', value: 92, color: 'bg-rose-500', icon: Instagram },
                { platform: 'TikTok', value: 78, color: 'bg-zinc-900 dark:bg-white', icon: Zap },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <item.icon size={14} className={i === 2 ? 'text-zinc-900 dark:text-white' : i === 0 ? 'text-indigo-500' : 'text-rose-500'} />
                      <span className="text-slate-500 dark:text-zinc-400">{item.platform}</span>
                    </div>
                    <span>{item.value}% Rank</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + (i * 0.2) }}
                      className={`h-full ${item.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-zinc-800">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Delivery</p>
                 <span className="text-2xl font-black tracking-tighter">रू 1.4M+</span>
               </div>
               <BarChart3 className="text-indigo-600 opacity-40" />
            </div>
          </div>
          
          {/* Decorative accents */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-rose-600/10 rounded-full blur-[100px] -z-10"></div>
        </motion.div>
      </section>

      {/* Stats/Proof Section */}
      <section className="bg-slate-50 dark:bg-zinc-900/30 py-20 border-y border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Growth Catalyzed', value: '45K+' },
              { label: 'Active Partners', value: '1.2K' },
              { label: 'Success Velocity', value: '99.9%' },
              { label: 'Uptime SLA', value: 'Instant' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <h3 className="text-4xl font-black tracking-tighter text-indigo-600">{stat.value}</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center max-w-2xl mx-auto mb-24">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Built for the Modern Web.</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Precision engineered tools to give you the competitive edge in any market.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: Target, 
              title: 'Precise Targeting', 
              desc: 'Advanced demographics matching to ensure your content reaches the right eyes every time.' 
            },
            { 
              icon: Shield, 
              title: 'Secure Delivery', 
              desc: 'Proprietary delivery systems that protect your account integrity and reputation.' 
            },
            { 
              icon: Zap, 
              title: 'Instant Execution', 
              desc: 'Our neural network begins routing your campaign within seconds of submission.' 
            }
          ].map((feature, i) => (
            <div key={i} className="p-10 rounded-[32px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 hover:border-indigo-600 dark:hover:border-indigo-500 transition-all group">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <feature.icon size={32} />
              </div>
              <h3 className="text-xl font-black mb-4">{feature.title}</h3>
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-sm font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-zinc-900 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Rocket className="text-indigo-600" size={24} />
          <span className="text-xl font-black tracking-tight">Boost Manager</span>
        </div>
        <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">
          © 2024 Boost Manager. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
