'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, DollarSign, Layers, Plus, Trash2, CheckCircle,
  XCircle, Save, RefreshCw, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';

interface AppSettings {
  id: string;
  exchange_rate: number;
  updated_at: string;
}

interface CampaignType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

type ToastType = 'success' | 'error' | null;

interface Toast {
  type: ToastType;
  message: string;
}

export const AdminSystemConfig: React.FC = () => {
  // ── App Settings state ──────────────────────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Campaign Types state ─────────────────────────────────────────────────────
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: Exclude<ToastType, null>, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadingTypes(true);
    try {
      // App settings — we always use id = 'global'
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData);
        setExchangeRate(String(settingsData.exchange_rate));
      } else {
        // Seed default row if it doesn't exist yet
        const { data: inserted } = await supabase
          .from('app_settings')
          .insert({ id: 'global', exchange_rate: 135 })
          .select()
          .single();
        if (inserted) {
          setSettings(inserted);
          setExchangeRate(String(inserted.exchange_rate));
        }
      }

      // Campaign types
      const { data: typesData } = await supabase
        .from('campaign_types')
        .select('*')
        .order('created_at', { ascending: true });

      setCampaignTypes(typesData || []);
    } catch (err) {
      console.error('Error fetching system config:', err);
      showToast('error', 'Failed to load system configuration.');
    } finally {
      setLoading(false);
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Save exchange rate ───────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    const rate = parseFloat(exchangeRate);
    if (isNaN(rate) || rate <= 0) {
      showToast('error', 'Please enter a valid positive dollar rate.');
      return;
    }
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global', exchange_rate: rate, updated_at: new Date().toISOString() });
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, exchange_rate: rate } : prev);
      showToast('success', 'Dollar rate saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save dollar rate.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Toggle campaign type ─────────────────────────────────────────────────────
  const handleToggleType = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('campaign_types')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setCampaignTypes(prev =>
        prev.map(t => t.id === id ? { ...t, is_active: !currentActive } : t)
      );
      showToast('success', `Campaign type ${!currentActive ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update campaign type.');
    }
  };

  // ── Add campaign type ────────────────────────────────────────────────────────
  const handleAddType = async () => {
    const name = newTypeName.trim();
    if (!name) return;
    setAddingType(true);
    try {
      const { data, error } = await supabase
        .from('campaign_types')
        .insert({ name, is_active: true })
        .select()
        .single();
      if (error) throw error;
      setCampaignTypes(prev => [...prev, data]);
      setNewTypeName('');
      showToast('success', `"${name}" added successfully.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add campaign type.');
    } finally {
      setAddingType(false);
    }
  };

  // ── Delete campaign type ─────────────────────────────────────────────────────
  const handleDeleteType = async (id: string, name: string) => {
    if (!confirm(`Delete campaign type "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from('campaign_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCampaignTypes(prev => prev.filter(t => t.id !== id));
      showToast('success', `"${name}" deleted.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete campaign type.');
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="nm-inset rounded-2xl p-6 h-40 border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">

      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl nm-flat border text-sm font-bold shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-500/20 text-emerald-400'
                : 'border-rose-500/20 text-rose-400'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={17} />
              : <AlertCircle size={17} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl nm-inset flex items-center justify-center border border-rose-500/15">
            <Settings size={20} className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-main tracking-tight">System Configuration</h2>
            <p className="text-xs font-bold text-muted mt-0.5">Manage global app settings and campaign types</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 nm-flat hover:nm-concave rounded-xl text-xs font-black text-muted hover:text-main uppercase tracking-widest transition-all cursor-pointer active:scale-[0.96]"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── App Settings Card ───────────────────────────────────────────────── */}
      <div className="nm-flat rounded-2xl border border-white/5 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-black/30 bg-[#161719]/40 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg nm-inset flex items-center justify-center border border-amber-500/15">
            <DollarSign size={15} className="text-amber-400" />
          </div>
          <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">Dollar Rate (NPR per $1)</h3>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <p className="text-xs font-medium text-muted mb-5 leading-relaxed">
            Set the NPR conversion rate used to calculate campaign costs across the platform.
            This rate applies to all new and edited boost requests.
          </p>

          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">
                Rate (रू per $1)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm pointer-events-none">
                  रू
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveSettings()}
                  className="w-full pl-10 pr-4 py-3.5 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-amber-500 transition-all font-black text-lg placeholder-muted focus:ring-2 focus:ring-amber-500/15"
                  placeholder="135"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.35)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]"
            >
              {savingSettings
                ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <Save size={14} />}
              Save Rate
            </button>
          </div>

          {settings?.updated_at && (
            <p className="text-[10px] font-bold text-zinc-600 mt-3 ml-1 uppercase tracking-widest">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ── Campaign Types Card ─────────────────────────────────────────────── */}
      <div className="nm-flat rounded-2xl border border-white/5 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-black/30 bg-[#161719]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/15">
              <Layers size={15} className="text-indigo-400" />
            </div>
            <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">Campaign Types</h3>
            <span className="px-2 py-0.5 nm-inset rounded-md text-[10px] font-black text-indigo-400 border border-indigo-500/20">
              {campaignTypes.filter(t => t.is_active).length} active
            </span>
          </div>
        </div>

        {/* Add new type row */}
        <div className="px-6 pt-5 pb-4 border-b border-black/20">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddType()}
              placeholder="New campaign type name…"
              className="flex-1 px-4 py-3 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-medium text-sm placeholder-muted focus:ring-2 focus:ring-indigo-500/15"
            />
            <button
              onClick={handleAddType}
              disabled={addingType || !newTypeName.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]"
            >
              {addingType
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Plus size={14} />}
              Add
            </button>
          </div>
        </div>

        {/* Campaign types list */}
        <div className="divide-y divide-black/15">
          {loadingTypes ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : campaignTypes.length === 0 ? (
            <div className="p-10 text-center">
              <Layers size={28} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-600">No campaign types yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Add your first one above.</p>
            </div>
          ) : (
            <AnimatePresence>
              {campaignTypes.map((type, idx) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.015] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${type.is_active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-zinc-700'}`} />
                    <span className={`text-sm font-bold ${type.is_active ? 'text-main' : 'text-zinc-600 line-through'}`}>
                      {type.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleType(type.id, type.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-[0.95] ${
                        type.is_active
                          ? 'nm-flat hover:nm-concave text-emerald-400 border border-emerald-500/20'
                          : 'nm-flat hover:nm-concave text-zinc-500 border border-white/5'
                      }`}
                    >
                      {type.is_active
                        ? <><ToggleRight size={13} /> Enabled</>
                        : <><ToggleLeft size={13} /> Disabled</>}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteType(type.id, type.name)}
                      className="p-1.5 rounded-lg nm-flat hover:nm-concave text-zinc-600 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 transition-all cursor-pointer active:scale-[0.95]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
};
