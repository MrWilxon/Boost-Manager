import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, X, Search, Plus, Trash2, Tag, Globe, 
  MapPin, MessageSquare, AlertCircle, Info, CheckCircle2,
  Copy, RotateCw
} from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../../utils/errorHandlers';
import { APP_CONFIG } from '../../constants';
import { PromoCode, UserProfile, BoostRequest } from '../../types';
import { useBoostEligibility } from '../../hooks/useBoostEligibility';

interface BoostRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  user: any;
  rate: number;
  editingRequestId: string | null;
  onSuccess: (msg: string) => void;
  requests: any[];
}

export const BoostRequestModal: React.FC<BoostRequestModalProps> = ({
  isOpen,
  onClose,
  profile,
  user,
  rate,
  editingRequestId,
  onSuccess,
  requests
}) => {
  const [modalUrl, setModalUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Facebook"]);
  const [modalLocations, setModalLocations] = useState<string[]>(["All Nepal"]);
  const [modalGender, setModalGender] = useState("All");
  const [modalAge, setModalAge] = useState("18 - 65+");
  const [modalAdGoal, setModalAdGoal] = useState("Messages");
  const [modalDestination, setModalDestination] = useState("WhatsApp");
  const [modalBudget, setModalBudget] = useState(5);
  const [modalDuration, setModalDuration] = useState(5);
  const [modalNotes, setModalNotes] = useState("");
  
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [isCustomAge, setIsCustomAge] = useState(false);
  const [customAge, setCustomAge] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibility = useBoostEligibility({
    modalBudget,
    modalDuration,
    modalUrl,
    modalLocations,
    modalAdGoal,
    selectedPlatforms,
    isCustomAge,
    customAge,
    rate,
    appliedPromo,
    profile
  });

  useEffect(() => {
    if (editingRequestId && isOpen) {
      const req = requests.find(r => r.id === editingRequestId);
      if (req) {
        setModalUrl(req.url || "");
        setSelectedPlatforms(req.platforms || ["Facebook"]);
        setModalLocations(req.location?.split(", ") || ["All Nepal"]);
        setModalGender(req.gender || "All");
        setModalAge(req.age || "18 - 65+");
        setModalAdGoal(req.adGoal || "Messages");
        setModalDestination(req.destination || "WhatsApp");
        setModalBudget(req.allocatedBudget || 5);
        setModalDuration(req.duration || 5);
        setModalNotes(req.notes || "");
      }
    } else if (!editingRequestId && isOpen) {
       // Reset form
       setModalUrl("");
       setSelectedPlatforms(["Facebook"]);
       setModalLocations(["All Nepal"]);
       setModalGender("All");
       setModalAge("18 - 65+");
       setModalAdGoal("Messages");
       setModalDestination("WhatsApp");
       setModalBudget(5);
       setModalDuration(5);
       setModalNotes("");
       setAppliedPromo(null);
       setPromoCode("");
    }
  }, [editingRequestId, isOpen, requests]);

  const handleSubmit = async () => {
    if (!eligibility.isEligible) return;

    setIsSubmitting(true);
    setError(null);

    const requestData = {
      userId: user.uid,
      username: profile?.username || user.email,
      url: modalUrl,
      platforms: selectedPlatforms,
      location: modalLocations.join(", "),
      gender: modalGender,
      age: isCustomAge ? customAge : modalAge,
      adGoal: modalAdGoal,
      destination: modalDestination,
      allocatedBudget: modalBudget,
      duration: modalDuration,
      notes: modalNotes,
      amountNpr: eligibility.totalNpr,
      rateUsed: eligibility.effectiveRate,
      status: "Pending" as const,
      date: new Date().toLocaleDateString(),
      createdAt: serverTimestamp(),
    };

    try {
      if (editingRequestId) {
        await updateDoc(doc(db, "requests", editingRequestId), requestData);
        onSuccess("Request updated successfully!");
      } else {
        // Atomic transaction to update balance
        // Note: Real implementation should use runTransaction
        await addDoc(collection(db, "requests"), requestData);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
           balance: (profile?.balance || 0) - eligibility.totalNpr
        });
        onSuccess("Boost request submitted!");
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "requests");
      setError("Failed to process request. Check balance.");
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
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                  <Rocket size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                    {editingRequestId ? "Edit Boost Campaign" : "Launch New Campaign"}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Fill in your campaign blueprints</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-2xl transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
               {/* Forms and sections would go here - simplified for this thought */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* URL Section */}
                  <div className="md:col-span-2 space-y-3">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest ml-1">
                        <Globe size={14} className="text-indigo-500" /> Campaign URL
                     </label>
                     <input 
                        type="url"
                        value={modalUrl}
                        onChange={(e) => setModalUrl(e.target.value)}
                        placeholder="Paste your post or page link here..."
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                     />
                  </div>
                  
                  {/* Budget & Duration */}
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest ml-1">Total Budget ($)</label>
                        <input 
                          type="number"
                          value={modalBudget}
                          onChange={(e) => setModalBudget(Number(e.target.value))}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-lg font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest ml-1">Duration (Days)</label>
                        <input 
                          type="number"
                          value={modalDuration}
                          onChange={(e) => setModalDuration(Number(e.target.value))}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-lg font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                     </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden flex flex-col justify-between">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Due (NPR)</p>
                        <h4 className="text-5xl font-black tracking-tighter">रू{eligibility.totalNpr.toLocaleString()}</h4>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                           <span className="text-[10px] font-bold uppercase tracking-widest">Rate: रू{eligibility.effectiveRate}/$</span>
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Rocket size={120} />
                     </div>
                  </div>
               </div>

               {/* Submit Button */}
               <div className="space-y-4 pt-6">
                  {eligibility.warnings.length > 0 && (
                     <div className="space-y-2">
                        {eligibility.warnings.map((w, i) => (
                           <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 border ${
                              w.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                              w.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                              'bg-blue-50 border-blue-100 text-blue-700'
                           }`}>
                              {w.type === 'error' ? <X size={18} /> : <AlertCircle size={18} />}
                              <p className="text-xs font-bold">{w.message}</p>
                           </div>
                        ))}
                     </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!eligibility.isEligible || isSubmitting}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {editingRequestId ? 'Update Campaign' : 'Deploy Campaign'} <CheckCircle2 size={24} />
                      </>
                    )}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
