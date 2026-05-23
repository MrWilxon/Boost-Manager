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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#101012] rounded-3xl shadow-2xl overflow-hidden border border-white/5"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-main tracking-tight">Load Balance</h3>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Self Top-up Portal</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-muted hover:text-main">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                   <div className="flex gap-3">
                      <History className="text-amber-500 shrink-0" size={16} />
                      <p className="text-xs font-medium text-amber-200/80 leading-relaxed">
                        To add balance to your account, please transfer the desired amount to our Official eSewa ID and submit the request below.
                      </p>
                   </div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 relative group">
                   <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-2">eSewa ID (Send To)</p>
                   <div className="flex items-center justify-between">
                      <span className="text-base font-black text-main tracking-wider">9843398340</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("9843398340");
                          onSuccess("Number copied to clipboard!");
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-muted hover:text-main active:scale-[0.98] active:nm-inset transition-all"
                      >
                         <Copy size={14} />
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Transfer Amount (NPR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">रू</span>
                    <input
                      type="number"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3.5 bg-black/40 border border-white/5 rounded-2xl text-lg font-black text-main outline-none focus:border-indigo-500 transition-all border-l-2 focus:border-l-indigo-500 shadow-inner"
                      placeholder="500"
                    />
                  </div>
                  {error && <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
                </div>

                <button
                  onClick={handleLoadBalance}
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:bg-white/5 disabled:text-zinc-600 disabled:border-white/5 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Request <CheckCircle2 size={16} />
                    </>
                  )}
                </button>

                <p className="text-[9px] text-center text-muted font-black uppercase tracking-widest">
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
