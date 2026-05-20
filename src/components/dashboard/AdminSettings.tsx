import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Zap, Settings, Tag, Save, Plus, Trash2, 
  AlertCircle, Globe, Smartphone, Bell, Receipt
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { OperationType, handleFirestoreError } from '../../utils/errorHandlers';
import { ALL_PLATFORMS } from '../../constants';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  rate: number | null;
  whatsappNumber: string;
  pageRoleInfo: string;
  allowedPlatforms: string[];
  adminAlertMessage: string;
  invoiceConfig: {
    companyName: string;
    companySubtitle: string;
    billToLocation: string;
  };
  onUpdateRate: (val: number) => void;
  onUpdateWhatsApp: (val: string) => void;
  onUpdatePageRole: (val: string) => void;
  onUpdateAllowedPlatforms: (val: string[]) => void;
  onUpdateAlert: (val: string) => void;
  onUpdateInvoiceConfig: (val: any) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  isOpen,
  onClose,
  rate,
  whatsappNumber,
  pageRoleInfo,
  allowedPlatforms,
  adminAlertMessage,
  invoiceConfig,
  onUpdateRate,
  onUpdateWhatsApp,
  onUpdatePageRole,
  onUpdateAllowedPlatforms,
  onUpdateAlert,
  onUpdateInvoiceConfig
}) => {
  const [localRate, setLocalRate] = useState(rate || 165);
  const [localWhatsApp, setLocalWhatsApp] = useState(whatsappNumber);
  const [localPageRole, setLocalPageRole] = useState(pageRoleInfo);
  const [localAllowedPlatforms, setLocalAllowedPlatforms] = useState(allowedPlatforms);
  const [localAlert, setLocalAlert] = useState(adminAlertMessage);
  const [localInvoice, setLocalInvoice] = useState(invoiceConfig);

  const [isDataSaver, setIsDataSaver] = useState(() => localStorage.getItem("data_saver") === "true");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative bg-white dark:bg-zinc-950 p-8 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-zinc-800 ring-1 dark:ring-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Control Panel</h2>
                <p className="text-slate-500 dark:text-zinc-400 text-sm">Global System Configurations</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-12">
               {/* Bandwidth Saver */}
               <section className="bg-orange-50 dark:bg-orange-500/5 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-500/10">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-2xl text-orange-600 dark:text-orange-400">
                           <Zap size={24} />
                        </div>
                        <div>
                           <h4 className="text-slate-900 dark:text-zinc-100 font-bold">Bandwidth Saver Mode</h4>
                           <p className="text-sm text-slate-500 dark:text-zinc-400">Reduce cloud syncing for slower connections.</p>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                          const newValue = !isDataSaver;
                          setIsDataSaver(newValue);
                          localStorage.setItem("data_saver", String(newValue));
                          window.location.reload();
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          isDataSaver ? 'bg-orange-500' : 'bg-slate-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDataSaver ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                  </div>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Global Rates */}
                  <div className="space-y-6">
                     <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Settings size={14} /> System Rates & Support
                     </h5>
                     <div className="p-6 bg-slate-50 dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800 space-y-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Exchange Rate (NPR/$)</label>
                           <div className="flex gap-2">
                              <input 
                                type="number"
                                value={localRate}
                                onChange={(e) => setLocalRate(Number(e.target.value))}
                                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-black"
                              />
                              <button 
                                onClick={() => onUpdateRate(localRate)}
                                className="px-6 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                              >SET</button>
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">WhatsApp Support</label>
                           <div className="flex gap-2">
                              <input 
                                type="text"
                                value={localWhatsApp}
                                onChange={(e) => setLocalWhatsApp(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold"
                              />
                              <button 
                                onClick={() => onUpdateWhatsApp(localWhatsApp)}
                                className="px-6 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                              >SET</button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Platforms & Announcements */}
                  <div className="space-y-6">
                     <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <AlertCircle size={14} /> Service Management
                     </h5>
                     <div className="p-6 bg-slate-50 dark:bg-zinc-900/40 rounded-3xl border border-slate-100 dark:border-zinc-800 space-y-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Active Campaign Platforms</label>
                           <div className="flex flex-wrap gap-2">
                              {ALL_PLATFORMS.map(p => (
                                <button 
                                  key={p}
                                  onClick={() => {
                                    const next = localAllowedPlatforms.includes(p)
                                      ? localAllowedPlatforms.filter(x => x !== p)
                                      : [...localAllowedPlatforms, p];
                                    setLocalAllowedPlatforms(next);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                    localAllowedPlatforms.includes(p)
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'bg-white dark:bg-zinc-950 text-slate-400 border-slate-200'
                                  }`}
                                >{p}</button>
                              ))}
                           </div>
                           <button 
                             onClick={() => onUpdateAllowedPlatforms(localAllowedPlatforms)}
                             className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                           >UPDATE PLATFORMS</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
