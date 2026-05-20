import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, CheckCircle2, History, X, Copy } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';

interface BalanceTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  user: any;
  onSuccess: (msg: string) => void;
}

export const BalanceTopUpModal: React.FC<BalanceTopUpModalProps> = ({
  isOpen,
  onClose,
  profile,
  user,
  onSuccess,
}) => {
  const [loadAmount, setLoadAmount] = React.useState(500);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLoadBalance = async () => {
    if (loadAmount < 100) {
      setError("Minimum top-up amount is रू100.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('balance_requests').insert({
        user_id: user?.uid || user?.id,
        username: profile?.username || user?.email,
        amount: Number(loadAmount),
        status: "Pending",
      });

      if (insertError) throw insertError;

      onSuccess(`Top-up request for रू${loadAmount} submitted.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100">Load Balance</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Self Top-up Portal</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200/50 dark:border-amber-500/20">
                   <div className="flex gap-3">
                      <History className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                        To add balance to your account, please transfer the desired amount to our Official eSewa ID and submit the request below.
                      </p>
                   </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 relative group">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">eSewa ID (Send To)</p>
                   <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-wider">9843398340</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("9843398340");
                          onSuccess("Number copied to clipboard!");
                        }}
                        className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-indigo-600 dark:text-indigo-400 hover:scale-110 active:scale-95 transition-all shadow-sm"
                      >
                         <Copy size={16} />
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest ml-1">Transfer Amount (NPR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">रू</span>
                    <input
                      type="number"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3.5 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-2xl text-lg font-black text-slate-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                      placeholder="500"
                    />
                  </div>
                  {error && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
                </div>

                <button
                  onClick={handleLoadBalance}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Request <CheckCircle2 size={20} />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  Approval usually takes 5-15 minutes
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
