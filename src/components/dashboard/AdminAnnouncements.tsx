'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Megaphone, Plus, X, AlertCircle, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAnnouncements(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        is_active: isActive
      };

      if (editingId) {
        const { error: updateErr } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingId);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('announcements')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      // Reset form
      setEditingId(null);
      setTitle('');
      setContent('');
      setIsActive(true);
      setShowForm(false);
      
      // Refresh list
      await fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || "Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (announce: any) => {
    setEditingId(announce.id);
    setTitle(announce.title);
    setContent(announce.content);
    setIsActive(announce.is_active);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const { error: deleteErr } = await supabase.from('announcements').delete().eq('id', id);
      if (deleteErr) throw deleteErr;
      setAnnouncements(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete announcement');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateErr } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (updateErr) throw updateErr;
      
      setAnnouncements(prev => 
        prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p)
      );
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-main flex items-center gap-2">
            <Megaphone size={20} className="text-indigo-500" />
            Global Announcements
          </h2>
          <p className="text-sm text-muted">Manage pop-up notices shown to users upon login.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setTitle('');
              setContent('');
              setIsActive(true);
            }
          }}
          className="btn-primary"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {error && (
        <div className="nm-flat p-4 rounded-xl border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="nm-flat p-6 rounded-2xl border border-white/5 space-y-4 mb-6">
              <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-4">
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. System Maintenance Notice"
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Content</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement details here..."
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      isActive ? 'bg-indigo-500 text-white' : 'nm-inset border border-white/10 text-transparent'
                    }`}>
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-bold text-main">Set as Active</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Saving..." : "Save Announcement"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="nm-flat rounded-3xl overflow-hidden border border-white/5">
        <div className="hidden md:block overflow-x-auto table-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted font-bold">
                    No announcements found. Create one above!
                  </td>
                </tr>
              ) : (
                announcements.map((announce) => (
                  <tr key={announce.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-main">
                        {announce.title}
                      </div>
                      <div className="text-xs text-muted truncate max-w-xs mt-1">
                        {announce.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-muted">
                      {new Date(announce.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        announce.is_active 
                          ? 'text-emerald-500 border-emerald-500/20 nm-inset' 
                          : 'text-zinc-500 border-zinc-500/20 nm-inset'
                      }`}>
                        {announce.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(announce.id, announce.is_active)}
                          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                            announce.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                        >
                          {announce.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => startEdit(announce)}
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-indigo-400 hover:bg-indigo-400/10 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(announce.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col p-4 gap-4">
          {loading ? (
            <div className="py-8 text-center text-muted">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                Loading...
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-muted font-bold">
              No announcements found. Create one above!
            </div>
          ) : (
            announcements.map((announce) => (
              <div key={announce.id} className="nm-flat bg-surface rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-main">
                    {announce.title}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shrink-0 ml-2 ${
                    announce.is_active 
                      ? 'text-emerald-500 border-emerald-500/20 nm-inset' 
                      : 'text-zinc-500 border-zinc-500/20 nm-inset'
                  }`}>
                    {announce.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="text-xs text-muted">
                  {announce.content}
                </div>

                <div className="text-xs font-bold text-muted">
                  {new Date(announce.created_at).toLocaleDateString()}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleToggleActive(announce.id, announce.is_active)}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                      announce.is_active ? 'text-amber-500 nm-inset hover:bg-amber-500/10' : 'text-emerald-500 nm-inset hover:bg-emerald-500/10'
                    }`}
                  >
                    {announce.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => startEdit(announce)}
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-indigo-400 nm-inset hover:bg-indigo-400/10 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announce.id)}
                    className="w-8 h-8 rounded-lg nm-flat hover:nm-concave text-rose-400 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.95]"
                    title="Delete Announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
