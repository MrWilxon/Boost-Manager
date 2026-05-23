'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Shield } from 'lucide-react';

interface ModernLoaderProps {
  label?: string;
  type?: 'dashboard' | 'admin';
}

export const ModernLoader: React.FC<ModernLoaderProps> = ({ label = 'Initializing Engine...', type = 'dashboard' }) => {
  const isAdmin = type === 'admin';
  const colorPrimary = isAdmin ? 'from-amber-500/80 to-orange-600/80' : 'from-indigo-500/80 to-purple-600/80';
  const colorGlow = isAdmin ? 'bg-amber-500/20' : 'bg-indigo-500/20';
  const Icon = isAdmin ? Shield : Rocket;
  const textColor = isAdmin ? 'text-amber-400' : 'text-indigo-400';

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-[${isAdmin ? '#f59e0b' : '#6366f1'}] opacity-70`}
          style={{ borderTopColor: isAdmin ? '#f59e0b' : '#6366f1' }}
        />
        
        {/* Inner reverse rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-b-2 border-l-2 border-transparent opacity-50"
          style={{ borderBottomColor: isAdmin ? '#fbbf24' : '#818cf8' }}
        />
        
        {/* Glowing backdrop */}
        <div className={`absolute inset-4 rounded-full blur-xl ${colorGlow} animate-pulse`} />
        
        {/* Center Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`relative z-10 p-3 rounded-2xl bg-gradient-to-br ${colorPrimary} shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-sm`}
        >
          <Icon className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" size={24} />
        </motion.div>
      </div>
      
      {/* Loading Text */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColor} mb-2`}>
          {label}
        </span>
        
        {/* Loading Bar */}
        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className={`absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r ${colorPrimary}`}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
};
