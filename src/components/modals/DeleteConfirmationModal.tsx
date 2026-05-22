import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, AlertTriangle, X, Clock } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  warning?: string;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this information?",
  warning = "This action will be permanently deleted and cannot be recovered."
}: DeleteConfirmationModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setCountdown(3);
      setCanConfirm(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
             clearInterval(timer);
             setCanConfirm(true);
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#101012] rounded-3xl shadow-2xl overflow-hidden border border-white/5"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
                <p className="text-xs font-medium text-zinc-400 mt-1">{message}</p>
              </div>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-black text-rose-400 flex items-center gap-2 uppercase tracking-widest">
                <Trash2 size={12} /> WARNING
              </p>
              <p className="text-xs font-medium text-rose-400/70 mt-1.5 leading-relaxed">
                {warning}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-black uppercase tracking-widest rounded-xl text-xs transition-all border border-white/5"
              >
                Cancel
              </button>
              <button 
                disabled={!canConfirm}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 font-black uppercase tracking-widest rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${
                  canConfirm 
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-[0.98]" 
                    : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
                }`}
              >
                {!canConfirm && <Clock size={14} className="animate-pulse" />}
                Confirm {!canConfirm && `(${countdown}s)`}
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
