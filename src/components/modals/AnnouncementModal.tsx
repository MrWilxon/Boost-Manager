'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X } from 'lucide-react';

export const AnnouncementModal = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchActiveAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return;

      // Filter out dismissed announcements from localStorage
      const dismissedStr = localStorage.getItem('dismissed_announcements') || '[]';
      let dismissed = [];
      try { dismissed = JSON.parse(dismissedStr); } catch (e) {}

      const unread = data.filter(a => !dismissed.includes(a.id));
      
      if (unread.length > 0) {
        setAnnouncements(unread);
        setIsVisible(true);
      }
    };

    fetchActiveAnnouncements();

    const handleManualOpen = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setAnnouncements(data);
        setCurrentIndex(0);
        setIsVisible(true);
      }
    };

    window.addEventListener('open_announcements', handleManualOpen);
    return () => window.removeEventListener('open_announcements', handleManualOpen);
  }, []);

  const handleDismiss = () => {
    const currentId = announcements[currentIndex].id;
    
    // Add to localStorage
    const dismissedStr = localStorage.getItem('dismissed_announcements') || '[]';
    let dismissed = [];
    try { dismissed = JSON.parse(dismissedStr); } catch (e) {}
    
    if (!dismissed.includes(currentId)) {
      dismissed.push(currentId);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-md nm-flat rounded-3xl border border-indigo-500/30 overflow-y-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 bg-indigo-500/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Megaphone size={16} />
            </div>
            <h3 className="font-black text-main uppercase tracking-widest text-sm flex-1">Notice</h3>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
              {current.content}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
              {currentIndex + 1} of {announcements.length}
            </div>
            <button
              onClick={handleDismiss}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
