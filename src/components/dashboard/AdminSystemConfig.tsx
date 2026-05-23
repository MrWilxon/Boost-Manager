'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, DollarSign, Layers, Plus, Trash2, CheckCircle,
  XCircle, Save, RefreshCw, AlertCircle, ToggleLeft, ToggleRight,
  MessageCircle, Zap
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ALL_PLATFORMS } from '../../constants';

interface AppSettings {
  id: string;
  exchange_rate: number;
  whatsapp_number?: string;
  allowed_platforms?: string[];
  all_platforms?: string[];
  platform_rates?: Record<string, number>;
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
  const [platformRates, setPlatformRates] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ── LocalStorage state ──────────────────────────────────────────────────────
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<string[]>(ALL_PLATFORMS);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [addingPlatform, setAddingPlatform] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editPlatformName, setEditPlatformName] = useState('');

  // ── Campaign Types state ─────────────────────────────────────────────────────
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');

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
        if (settingsData.whatsapp_number) setWhatsappNumber(settingsData.whatsapp_number);
        if (settingsData.allowed_platforms) setAllowedPlatforms(Array.from(new Set(settingsData.allowed_platforms)));
        if (settingsData.all_platforms) setAllPlatforms(Array.from(new Set(settingsData.all_platforms)));
        
        if (settingsData.platform_rates) {
          const ratesStr = Object.fromEntries(
            Object.entries(settingsData.platform_rates).map(([k, v]) => [k, String(v)])
          );
          setPlatformRates(ratesStr);
        }
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
          if (inserted.whatsapp_number) setWhatsappNumber(inserted.whatsapp_number);
          if (inserted.allowed_platforms) setAllowedPlatforms(Array.from(new Set(inserted.allowed_platforms)));
          if (inserted.all_platforms) setAllPlatforms(Array.from(new Set(inserted.all_platforms)));
          
          if (inserted.platform_rates) {
            const ratesStr = Object.fromEntries(
              Object.entries(inserted.platform_rates).map(([k, v]) => [k, String(v)])
            );
            setPlatformRates(ratesStr);
          }
        }
      }

      // Campaign types
      const { data: typesData } = await supabase
        .from('campaign_types')
        .select('*')
        .order('created_at', { ascending: true });

      setCampaignTypes(typesData || []);

      // Load local storage items for data saver
      setIsDataSaver(localStorage.getItem('data_saver') === 'true');

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
    
    // Parse platform rates
    const parsedPlatformRates: Record<string, number> = {};
    for (const [platform, val] of Object.entries(platformRates)) {
      const pRate = parseFloat(val);
      if (!isNaN(pRate) && pRate > 0) {
        parsedPlatformRates[platform] = pRate;
      }
    }

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          id: 'global', 
          exchange_rate: rate, 
          platform_rates: parsedPlatformRates,
          updated_at: new Date().toISOString() 
        });
      if (error) throw error;
      setSettings(prev => prev ? { ...prev, exchange_rate: rate, platform_rates: parsedPlatformRates } : prev);
      showToast('success', 'Exchange rates saved successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save rates.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Save WhatsApp Number ──────────────────────────────────────────────────────
  const handleSaveWhatsApp = async () => {
    if (!whatsappNumber.trim()) {
      showToast('error', 'Please enter a valid WhatsApp number.');
      return;
    }
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global', whatsapp_number: whatsappNumber, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast('success', 'WhatsApp support number updated globally!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save WhatsApp number.');
    }
  };

  // ── Save Allowed Platforms ───────────────────────────────────────────────────
  const handleSavePlatforms = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global', allowed_platforms: allowedPlatforms, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast('success', 'Active campaign platforms updated globally!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save allowed platforms.');
    }
  };

  // ── Save Master Platforms ────────────────────────────────────────────────────
  const updateMasterPlatforms = async (newAllPlatforms: string[]) => {
    setAllPlatforms(newAllPlatforms);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global', all_platforms: newAllPlatforms, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast('success', 'Master platform list saved!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save master platforms.');
    }
  };

  // ── Toggle Data Saver ────────────────────────────────────────────────────────
  const handleToggleDataSaver = () => {
    const newValue = !isDataSaver;
    setIsDataSaver(newValue);
    localStorage.setItem('data_saver', String(newValue));
    window.location.reload();
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

  // ── Edit campaign type ───────────────────────────────────────────────────────
  const handleEditType = async (id: string) => {
    const name = editTypeName.trim();
    if (!name) return;
    try {
      const { error } = await supabase
        .from('campaign_types')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
      setCampaignTypes(prev =>
        prev.map(t => t.id === id ? { ...t, name } : t)
      );
      setEditingType(null);
      showToast('success', 'Campaign type updated successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update campaign type.');
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

      {/* ── Bandwidth Saver ─────────────────────────────────────────────────── */}
      <section className="bg-orange-50 dark:bg-orange-500/5 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-500/10 mb-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-2xl text-orange-600 dark:text-orange-400">
                  <Zap size={24} />
              </div>
              <div>
                  <h4 className="text-slate-900 dark:text-main font-bold">Bandwidth Saver Mode</h4>
                  <p className="text-sm text-slate-500 dark:text-muted">Reduce cloud syncing for slower connections.</p>
              </div>
            </div>
            <button
              onClick={handleToggleDataSaver}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isDataSaver ? 'bg-orange-500' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDataSaver ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
      </section>

      {/* ── System Rates & Support Card ─────────────────────────────────────── */}
      <div className="nm-flat rounded-2xl border border-white/5 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-black/30 bg-[#161719]/40 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg nm-inset flex items-center justify-center border border-amber-500/15">
            <Settings size={15} className="text-amber-400" />
          </div>
          <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">System Rates & Support</h3>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/5">
            {/* Dollar Rate */}
            <div>
              <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <DollarSign size={14} className="text-amber-400" /> Default / Base Dollar Rate (NPR per $1)
              </h4>
              <p className="text-[10px] text-muted mb-3 font-medium">This rate is used as a fallback if a platform doesn't have a specific rate.</p>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
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
                    className="w-full pl-10 pr-4 py-3.5 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-amber-500 transition-all font-black text-sm placeholder-muted focus:ring-2 focus:ring-amber-500/15"
                    placeholder="135"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Support */}
            <div>
              <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <MessageCircle size={14} className="text-emerald-400" /> WhatsApp Support Number
              </h4>
              <p className="text-[10px] text-muted mb-3 font-medium">Used for direct customer support links.</p>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveWhatsApp()}
                  className="flex-1 px-4 py-3.5 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-emerald-500 transition-all font-black text-sm placeholder-muted focus:ring-2 focus:ring-emerald-500/15"
                  placeholder="+977-9843398340"
                />
                <button
                  onClick={handleSaveWhatsApp}
                  className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] cursor-pointer active:scale-[0.97]"
                >
                  <Save size={14} /> Set
                </button>
              </div>
            </div>
          </div>

          {/* Per-Platform Rates */}
          <div>
            <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-amber-400" /> Custom Platform Rates
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {Array.from(new Set(allPlatforms)).map(platform => (
                <div key={platform} className="nm-flat p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300">{platform}</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold text-xs pointer-events-none">
                      रू
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={platformRates[platform] || ''}
                      onChange={e => setPlatformRates(prev => ({ ...prev, [platform]: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 nm-inset rounded-lg text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-amber-500 transition-all font-bold text-xs placeholder-muted"
                      placeholder={`Default (${exchangeRate})`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center gap-4">
              {settings?.updated_at && (
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  Last updated: {new Date(settings.updated_at).toLocaleString()}
                </p>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.35)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]"
              >
                {savingSettings
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : <Save size={14} />}
                Save All Rates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Service Management Card (Allowed Platforms) ───────────────────────── */}
      <div className="nm-flat rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/30 bg-[#161719]/40 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/15">
            <AlertCircle size={15} className="text-indigo-400" />
          </div>
          <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">Service Management</h3>
        </div>

        <div className="p-6">
          <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.15em] mb-4">
            Active Campaign Platforms
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (allowedPlatforms.length === allPlatforms.length) {
                  setAllowedPlatforms([]);
                } else {
                  setAllowedPlatforms([...allPlatforms]);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-[0.96] ${
                allowedPlatforms.length === allPlatforms.length
                  ? 'nm-flat text-indigo-400 border border-indigo-500/20'
                  : 'nm-inset text-zinc-500 border border-black/20 hover:text-zinc-400'
              }`}
            >
              Select All
            </button>
            {Array.from(new Set(allPlatforms)).map(p => {
              const isActive = allowedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => {
                    const next = isActive
                      ? allowedPlatforms.filter(x => x !== p)
                      : [...allowedPlatforms, p];
                    setAllowedPlatforms(next);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-[0.96] ${
                    isActive
                      ? 'nm-flat text-indigo-400 border border-indigo-500/20'
                      : 'nm-inset text-zinc-500 border border-black/20 hover:text-zinc-400'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSavePlatforms}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] cursor-pointer active:scale-[0.97]"
            >
              <Save size={14} /> Update Platforms
            </button>
          </div>
        </div>
      </div>

      {/* ── Master Platforms Card ─────────────────────────────────────────────── */}
      <div className="nm-flat rounded-2xl border border-white/5 overflow-hidden mb-8 mt-8">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-black/30 bg-[#161719]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/15">
              <Layers size={15} className="text-indigo-400" />
            </div>
            <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">Master Platform List</h3>
          </div>
        </div>

        {/* Add new platform row */}
        <div className="px-6 pt-5 pb-4 border-b border-black/20">
          <div className="flex gap-3">
            <input
              type="text"
              value={newPlatformName}
              onChange={e => setNewPlatformName(e.target.value)}
              placeholder="e.g. Threads, Snapchat..."
              className="flex-1 px-4 py-2.5 nm-inset rounded-xl text-main outline-none border border-black/20 focus:border-l-4 focus:border-l-indigo-500 transition-all font-bold text-sm placeholder-muted"
            />
            <button
              onClick={async () => {
                if (!newPlatformName.trim()) return;
                const newName = newPlatformName.trim();
                
                if (allPlatforms.map(p => p.toLowerCase()).includes(newName.toLowerCase())) {
                  showToast('error', `${newName} already exists in the master list.`);
                  return;
                }
                
                // Update Master List
                const nextAll = [...allPlatforms, newName];
                await updateMasterPlatforms(nextAll);
                
                // Automatically activate newly created platforms (deduplicate just in case)
                const nextAllowed = Array.from(new Set([...allowedPlatforms, newName]));
                setAllowedPlatforms(nextAllowed);
                await supabase.from('app_settings').upsert({ id: 'global', allowed_platforms: nextAllowed, updated_at: new Date().toISOString() });
                
                setNewPlatformName('');
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-[0.96]"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Platforms List */}
        <div className="p-4 grid gap-2">
          {Array.from(new Set(allPlatforms)).map(platform => (
            <div key={platform} className="flex items-center justify-between p-3 nm-flat rounded-xl">
              {editingPlatform === platform ? (
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="text"
                    value={editPlatformName}
                    onChange={e => setEditPlatformName(e.target.value)}
                    className="flex-1 px-3 py-1.5 nm-inset rounded-lg text-main outline-none text-sm font-bold"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (!editPlatformName.trim()) return;
                        const newName = editPlatformName.trim();
                        
                        // Update Master List
                        await updateMasterPlatforms(allPlatforms.map(p => p === platform ? newName : p));
                        
                        // Rename in allowedPlatforms as well
                        if (allowedPlatforms.includes(platform)) {
                          const nextAllowed = allowedPlatforms.map(p => p === platform ? newName : p);
                          setAllowedPlatforms(nextAllowed);
                          await supabase.from('app_settings').upsert({ id: 'global', allowed_platforms: nextAllowed, updated_at: new Date().toISOString() });
                        }
                        
                        // Rename in platformRates
                        if (platformRates[platform] !== undefined) {
                          setPlatformRates(prev => {
                            const newRates = { ...prev };
                            newRates[newName] = newRates[platform];
                            delete newRates[platform];
                            return newRates;
                          });
                          // We don't strictly need to auto-save rates here since admin can click Save All Rates, but it updates UI
                        }
                        
                        setEditingPlatform(null);
                      }}
                      className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => setEditingPlatform(null)}
                      className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-bold text-sm text-zinc-300">{platform}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPlatform(platform);
                        setEditPlatformName(platform);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        await updateMasterPlatforms(allPlatforms.filter(p => p !== platform));
                        
                        // Remove from allowedPlatforms
                        let nextAllowed = allowedPlatforms;
                        if (allowedPlatforms.includes(platform)) {
                          nextAllowed = allowedPlatforms.filter(p => p !== platform);
                          setAllowedPlatforms(nextAllowed);
                        }
                        
                        // Remove from platformRates and save to DB
                        const newRates = { ...platformRates };
                        let ratesChanged = false;
                        if (newRates[platform] !== undefined) {
                          delete newRates[platform];
                          setPlatformRates(newRates);
                          ratesChanged = true;
                        }

                        // Batch update to DB
                        const updates: any = { id: 'global', updated_at: new Date().toISOString() };
                        if (allowedPlatforms.includes(platform)) updates.allowed_platforms = nextAllowed;
                        
                        // Always save rates if it was changed
                        const parsedRates: Record<string, number> = {};
                        if (ratesChanged) {
                          for (const [p, val] of Object.entries(newRates)) {
                            const pRate = parseFloat(val);
                            if (!isNaN(pRate) && pRate > 0) parsedRates[p] = pRate;
                          }
                          updates.platform_rates = parsedRates;
                        }
                        
                        if (Object.keys(updates).length > 2) {
                           await supabase.from('app_settings').upsert(updates);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {allPlatforms.length === 0 && (
            <div className="text-center py-6 text-sm text-muted font-bold">No platforms added.</div>
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
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${type.is_active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-zinc-700'}`} />
                    
                    {editingType === type.id ? (
                      <input 
                        type="text" 
                        value={editTypeName}
                        onChange={(e) => setEditTypeName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditType(type.id)}
                        autoFocus
                        className="px-2 py-1 text-sm font-bold text-main bg-transparent border-b border-indigo-500/50 outline-none w-full max-w-[200px]"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${type.is_active ? 'text-main' : 'text-zinc-600 line-through'}`}>
                        {type.name}
                      </span>
                    )}
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

                    {/* Edit */}
                    {editingType === type.id ? (
                      <button
                        onClick={() => handleEditType(type.id)}
                        className="p-1.5 rounded-lg nm-flat hover:nm-concave text-emerald-500 border border-white/5 transition-all cursor-pointer active:scale-[0.95]"
                      >
                        <Save size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingType(type.id);
                          setEditTypeName(type.name);
                        }}
                        className="p-1.5 rounded-lg nm-flat hover:nm-concave text-zinc-600 hover:text-indigo-400 border border-white/5 transition-all cursor-pointer active:scale-[0.95]"
                      >
                        <Settings size={13} />
                      </button>
                    )}

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
