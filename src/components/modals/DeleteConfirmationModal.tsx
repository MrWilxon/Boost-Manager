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
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-full text-rose-600 dark:text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">{title}</h3>
                <p className="text-sm text-slate-500">{message}</p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 size={14} /> WARNING
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                {warning}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={!canConfirm}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  canConfirm 
                    ? "bg-rose-600 hover:bg-rose-700 text-white" 
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                {!canConfirm && <Clock size={16} className="animate-pulse" />}
                Confirm {!canConfirm && `(${countdown}s)`}
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
