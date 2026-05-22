"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppSupportButton = () => {
  const adminPhone = "9779843398340";
  const message = "Hello, I need support with Boost Manager.";

  const handleClick = () => {
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed right-6 bottom-6 z-[100] group flex items-center flex-row-reverse gap-3">
      <button
        onClick={handleClick}
        className="relative w-12 h-12 rounded-full nm-flat flex items-center justify-center text-[#25D366] hover:text-[#20bd5a] hover:nm-concave active:scale-95 transition-all duration-200 cursor-pointer shadow-[-4px_-4px_12px_rgba(255,255,255,0.04),_4px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[-5px_-5px_15px_rgba(255,255,255,0.06),_5px_5px_15px_rgba(0,0,0,0.6)]"
        title="Chat with Support"
      >
        <MessageCircle size={22} fill="currentColor" className="text-[#25D366]" />
        
        {/* Pulsing indicator tag with small Neumorphic ring */}
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1A1C1E] rounded-full flex items-center justify-center shadow-[-1px_-1px_3px_rgba(255,255,255,0.05),_1px_1px_3px_rgba(0,0,0,0.5)]">
          <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="relative w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
        </div>
      </button>

      {/* Floating interactive tooltip */}
      <div className="opacity-0 translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-300 nm-flat px-3 py-2 rounded-xl shadow-[-3px_-3px_8px_rgba(255,255,255,0.02),_3px_3px_8px_rgba(0,0,0,0.4)] flex items-center gap-1.5 border border-white/5">
        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Support</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Online</span>
      </div>
    </div>
  );
};
