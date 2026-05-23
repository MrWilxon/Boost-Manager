'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationBell = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (profile?.role === 'Admin') {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setNotifications(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Set up realtime subscription
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new;
          // Check if this notification is for the current user
          if (newNotif.user_id === user.id || (newNotif.user_id === null && profile?.role === 'Admin')) {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    // Chunk updates due to IN clause limits
    for (const id of unreadIds) {
       await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon relative"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-surface"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 nm-flat rounded-2xl border border-white/5 z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface/50">
              <h3 className="text-xs font-black text-main uppercase tracking-widest">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto table-scrollbar flex flex-col">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full nm-inset flex items-center justify-center text-zinc-600 mb-2">
                    <Bell size={20} />
                  </div>
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">No notifications</span>
                  <span className="text-[10px] text-zinc-500">You're all caught up!</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-white/5 last:border-0 transition-colors ${!n.is_read ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                      <div className="flex-1">
                        <h4 className={`text-xs ${!n.is_read ? 'font-black text-main' : 'font-bold text-zinc-300'}`}>{n.title}</h4>
                        <p className={`text-[11px] mt-1 ${!n.is_read ? 'text-zinc-300' : 'text-zinc-500'}`}>{n.message}</p>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-2 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
