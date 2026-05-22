'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Rocket, Shield, Zap, ArrowRight, BarChart3, 
  Facebook, Instagram, Twitter, Youtube, 
  TrendingUp, Target, Globe, Activity, CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Scrolling marquee component for brands
const BrandsMarquee = () => (
  <div className="w-full overflow-hidden bg-black py-10 border-y border-zinc-900 relative">
    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
    <motion.div 
      className="flex whitespace-nowrap items-center gap-16 md:gap-32 px-10"
      animate={{ x: ["0%", "-50%"] }}
      transition={{ ease: "linear", duration: 30, repeat: Infinity }}
    >
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-16 md:gap-32">
          <div className="flex items-center gap-3 text-zinc-600 font-black tracking-widest uppercase text-sm"><Facebook size={24} /> META</div>
          <div className="flex items-center gap-3 text-zinc-600 font-black tracking-widest uppercase text-sm"><Instagram size={24} /> INSTAGRAM</div>
          <div className="flex items-center gap-3 text-zinc-600 font-black tracking-widest uppercase text-sm"><Youtube size={24} /> YOUTUBE</div>
          <div className="flex items-center gap-3 text-zinc-600 font-black tracking-widest uppercase text-sm"><Globe size={24} /> TIKTOK</div>
          <div className="flex items-center gap-3 text-zinc-600 font-black tracking-widest uppercase text-sm"><Twitter size={24} /> X CORP</div>
        </div>
      ))}
    </motion.div>
  </div>
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-main selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-rose-900/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '14s', animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGZpbHRlciBpZD0ibiI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjEuNSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Floating Glass Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50 px-4 md:px-6 mx-auto max-w-7xl w-full">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="flex justify-between items-center bg-zinc-900/50 backdrop-blur-2xl border border-white/5 rounded-full px-4 md:px-6 py-3 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-2 rounded-full shadow-lg shadow-indigo-900/50">
              <Rocket className="text-main w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-sm md:text-base font-black tracking-tight text-main">
              BOOST<span className="text-muted"> MANAGER</span>
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" className="text-[10px] md:text-xs font-bold text-muted hover:text-main transition-colors uppercase tracking-[0.2em] px-2 md:px-4 py-2 whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/signup" className="bg-white hover:bg-zinc-200 text-black px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <span className="hidden xs:inline">Get Started</span>
              <span className="xs:hidden">Start</span>
              <ChevronRight size={12} className="md:w-[14px] md:h-[14px]" />
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "circOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-10 shadow-xl"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Engine v2.0 is now live
        </motion.div>
        
        <motion.h1 
          className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter text-main mb-8 max-w-5xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "circOut" }}
        >
          Command Your <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 text-transparent bg-clip-text inline-block pb-4">Social Gravity.</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-muted mb-12 max-w-2xl font-medium leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
        >
          The most advanced infrastructure for digital growth. Deploy highly targeted, automated boosting campaigns across the entire social ecosystem in seconds.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "circOut" }}
        >
          <Link href="/signup" className="group relative flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-full text-sm font-black transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)] uppercase tracking-widest overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">Signup <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-3 bg-zinc-900/50 backdrop-blur-xl border border-white/5 hover:bg-zinc-800 text-main px-10 py-5 rounded-full text-sm font-black transition-all hover:border-white/20 uppercase tracking-widest">
            Login
          </Link>
        </motion.div>

        {/* 3D Dashboard Preview */}
        <motion.div 
          style={{ y: y2 }}
          className="w-full max-w-5xl relative perspective-1000"
          initial={{ opacity: 0, rotateX: 20, y: 100 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "circOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 h-full w-full bottom-0"></div>
          <div className="bg-[#0A0A0B] rounded-t-[40px] border border-white/10 p-6 md:p-10 shadow-2xl shadow-indigo-500/10 overflow-hidden relative">
            
            {/* Mock Dashboard UI */}
            <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                     <Activity className="text-indigo-400" />
                  </div>
                  <div className="text-left">
                     <h4 className="text-lg font-black text-main">Live Network Pulse</h4>
                     <p className="text-[10px] text-muted font-bold uppercase tracking-widest">System Operational</p>
                  </div>
               </div>
               <div className="hidden md:flex gap-4">
                  <div className="bg-zinc-900 border border-white/5 rounded-lg px-4 py-2 text-xs font-bold text-muted">24h Volume: <span className="text-main">$14,204</span></div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Healthy
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
               {[
                 { p: 'Facebook', v: 92, c: 'bg-indigo-500' },
                 { p: 'Instagram', v: 88, c: 'bg-rose-500' },
                 { p: 'TikTok', v: 97, c: 'bg-white' },
               ].map((stat, i) => (
                 <motion.div key={i} whileHover={{ y: -5 }} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-xs font-black text-muted uppercase tracking-widest">{stat.p}</span>
                       <span className="text-lg font-black text-main">{stat.v}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${stat.v}%` }}
                         transition={{ duration: 1.5, delay: 1 + (i * 0.2) }}
                         className={`h-full ${stat.c} shadow-[0_0_10px_currentColor]`}
                       />
                    </div>
                 </motion.div>
               ))}
            </div>
            
            {/* Grid overlay for tech feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none opacity-50"></div>
          </div>
        </motion.div>
      </section>

      <BrandsMarquee />

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-40">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-8 text-main">Engineered for Dominance.</h2>
          <p className="text-lg text-muted font-medium leading-relaxed">Stop guessing with manual ads. Our proprietary algorithms route your capital for maximum engagement across global networks in milliseconds.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: Target, 
              title: 'Algorithmic Targeting', 
              desc: 'Deep demographic matching ensures your capital is deployed only to high-conversion audiences.' 
            },
            { 
              icon: Shield, 
              title: 'Vault-Grade Security', 
              desc: 'End-to-end encryption and automated logic checks protect your campaigns from invalid configurations.' 
            },
            { 
              icon: Zap, 
              title: 'Instant Deployment', 
              desc: 'Bypass manual review periods. Our system interfaces directly with network APIs for instant launch.' 
            },
            { 
              icon: BarChart3, 
              title: 'Real-time Analytics', 
              desc: 'Watch your metrics climb in real-time with our WebSocket-powered live dashboard.' 
            },
            { 
              icon: CheckCircle2, 
              title: 'Guaranteed Delivery', 
              desc: 'If a network rejects your asset, our system instantly refunds your balance automatically.' 
            },
            { 
              icon: Globe, 
              title: 'Global Scale', 
              desc: 'From hyper-local city targeting to global saturation, scale seamlessly without limits.' 
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="p-8 md:p-10 rounded-3xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-colors backdrop-blur-sm group"
            >
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all text-main">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-black mb-4 text-main">{feature.title}</h3>
              <p className="text-muted leading-relaxed text-sm font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32 mb-20">
        <div className="bg-gradient-to-br from-indigo-900/50 to-rose-900/20 border border-white/10 rounded-[40px] p-12 md:p-24 text-center overflow-hidden relative">
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGZpbHRlciBpZD0ibiI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjEuNSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>
           <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-main mb-8">Ready to Scale?</h2>
              <p className="text-xl text-indigo-200 mb-12 max-w-2xl">Join thousands of creators and agencies using Boost Manager to automate their digital presence.</p>
              <Link href="/signup" className="bg-white text-black px-12 py-6 rounded-full text-sm font-black transition-all hover:scale-105 shadow-[0_0_60px_rgba(255,255,255,0.2)] uppercase tracking-widest inline-flex items-center gap-3">
                 Create Free Account <ArrowRight size={18} />
              </Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black text-center py-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Rocket className="text-main w-4 h-4" />
          </div>
          <span className="text-lg font-black tracking-tight text-main">Boost Manager</span>
        </div>
        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Boost Manager Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
