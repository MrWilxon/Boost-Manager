'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Tag, Plus, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPromoCodes(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !value) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload: any = {
        code: newCode.toUpperCase(),
        discount_type: discountType,
        value: Number(value),
      };
      
      if (maxUsage) {
        payload.max_usage = Number(maxUsage);
      }

      const { error: insertErr } = await supabase
        .from('promo_codes')
        .insert([payload]);

      if (insertErr) throw insertErr;

      // Reset form
      setNewCode('');
      setValue('');
      setMaxUsage('');
      setShowForm(false);
      
      // Refresh list
      await fetchPromoCodes();
    } catch (err: any) {
      setError(err.message || "Failed to create promo code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateErr } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (updateErr) throw updateErr;
      
      setPromoCodes(prev => 
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
            <Tag size={20} className="text-indigo-500" />
            Promo Codes
          </h2>
          <p className="text-sm text-muted">Manage discount codes and promotional offers.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "New Code"}
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
            <form onSubmit={handleCreate} className="nm-flat p-6 rounded-2xl border border-white/5 space-y-4 mb-6">
              <h3 className="text-sm font-bold text-main uppercase tracking-widest mb-4">Create New Promo Code</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER25"
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="rate_override">Rate Override</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? "25" : "50.00"}
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Max Usage (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="w-full nm-inset bg-transparent rounded-xl px-4 py-3 text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="nm-flat rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto table-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Type & Value</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted font-bold">
                    No promo codes found. Create one above!
                  </td>
                </tr>
              ) : (
                promoCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono font-black text-main bg-white/5 px-2 py-1 rounded-md inline-block">
                        {code.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-main">
                      {code.discount_type === 'percentage' && `${code.value}% OFF`}
                      {code.discount_type === 'fixed' && `$${code.value} OFF`}
                      {code.discount_type === 'rate_override' && `Flat Rate: $${code.value}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-main">
                        {code.usage_count} <span className="text-muted font-normal">/ {code.max_usage || '∞'}</span>
                      </div>
                      {code.max_usage && code.usage_count >= code.max_usage && (
                        <div className="text-[10px] text-rose-500 font-bold uppercase mt-1">Limit Reached</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        code.is_active 
                          ? 'text-emerald-500 border-emerald-500/20 nm-inset' 
                          : 'text-zinc-500 border-zinc-500/20 nm-inset'
                      }`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(code.id, code.is_active)}
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                          code.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
