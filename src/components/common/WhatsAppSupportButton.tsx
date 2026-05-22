"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppSupportButton = () => {
  const adminPhone = "9779843398340";
  const message = "Hello, I need support with Boost Manager.";

  // Position state — default bottom-right
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right corner after mount
  useEffect(() => {
    const btnSize = 56;
    const margin = 24;
    setPos({
      x: window.innerWidth - btnSize - margin,
      y: window.innerHeight - btnSize - margin,
    });
    setInitialized(true);
  }, []);

  // Clamp position inside viewport
  const clamp = useCallback((x: number, y: number) => {
    const btnSize = 56;
    const margin = 8;
    return {
      x: Math.min(Math.max(x, margin), window.innerWidth - btnSize - margin),
      y: Math.min(Math.max(y, margin), window.innerHeight - btnSize - margin),
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    hasDragged.current = false;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDragged.current = true;
    }
    setPos(clamp(startPos.current.x + dx, startPos.current.y + dy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    // Snap to nearest side (left or right edge)
    const btnSize = 56;
    const margin = 24;
    const midX = window.innerWidth / 2;
    const snapX = pos.x + btnSize / 2 < midX ? margin : window.innerWidth - btnSize - margin;
    setPos(prev => clamp(snapX, prev.y));
  };

  const onClick = (e: React.MouseEvent) => {
    // If user dragged, don't open WhatsApp
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  if (!initialized) return null;

  return (
    <div
      ref={buttonRef}
      className="fixed z-[100] group"
      style={{
        left: pos.x,
        top: pos.y,
        width: 56,
        height: 56,
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragging.current ? 'grabbing' : 'grab',
        transition: dragging.current ? 'none' : 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Tooltip - shows on hover, hidden while dragging */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 translate-y-[4px] group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-300 nm-flat px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/5 whitespace-nowrap">
        <span className="text-[10px] font-black text-main uppercase tracking-widest leading-none">Support</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
        <span className="text-[8px] font-bold text-muted uppercase tracking-widest leading-none">Online</span>
      </div>

      {/* The button itself */}
      <div
        onClick={onClick}
        className="relative w-14 h-14 rounded-full nm-flat flex items-center justify-center text-[#25D366] hover:text-[#20bd5a] hover:nm-concave active:scale-[0.98] active:nm-inset transition-colors duration-200 shadow-[-4px_-4px_12px_rgba(255,255,255,0.04),_4px_4px_12px_rgba(0,0,0,0.5)]"
        title="Drag to move • Click to chat with Support"
      >
        <MessageCircle size={22} fill="currentColor" className="text-[#25D366] pointer-events-none" />

        {/* Pulsing online indicator */}
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-surface rounded-full flex items-center justify-center shadow-[-1px_-1px_3px_rgba(255,255,255,0.05),_1px_1px_3px_rgba(0,0,0,0.5)]">
          <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="relative w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
        </div>
      </div>
    </div>
  );
};
