'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Globe, Users, Wallet, Search, AlertCircle, Info, Ticket, ChevronDown
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import { useBoostEligibility } from '../../hooks/useBoostEligibility';

interface BoostRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  user: any;
  rate: number;
  platformRates?: Record<string, number>;
  editingRequestId: string | null;
  onSuccess: (msg: string) => void;
  requests: any[];
  allowedPlatforms?: string[];
  whatsappNumber?: string;
}

export const BoostRequestModal: React.FC<BoostRequestModalProps> = ({
  isOpen,
  onClose,
  profile,
  user,
  rate,
  platformRates,
  editingRequestId,
  onSuccess,
  requests,
  allowedPlatforms = ["Facebook", "Instagram"],
  whatsappNumber
}) => {
  const [modalUrl, setModalUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(allowedPlatforms.length > 0 ? [allowedPlatforms[0]] : []);
  const [modalLocations, setModalLocations] = useState<string[]>(["All Nepal"]);
  const [modalGender, setModalGender] = useState("Both");
  const [modalAge, setModalAge] = useState("18-65");
  const [modalAdGoal, setModalAdGoal] = useState("Get Message");
  const [modalDestinations, setModalDestinations] = useState<string[]>(["Messenger"]);
  const [modalBudget, setModalBudget] = useState(5);
  const [modalDuration, setModalDuration] = useState(5);
  const [modalNotes, setModalNotes] = useState("");

  const [campaignTypes, setCampaignTypes] = useState<string[]>(["Get Message", "Engagement", "Website Traffic", "Page Likes"]);

  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [savedCustomLocations, setSavedCustomLocations] = useState<string[]>([]);
  const [isCustomAge, setIsCustomAge] = useState(false);
  const [customAge, setCustomAge] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showTextFormat, setShowTextFormat] = useState(false);

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
    platformRates,
    appliedPromo,
    profile
  });

  // Load active campaign types from DB once on mount
  useEffect(() => {
    supabase
      .from('campaign_types')
      .select('name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const names = data.map((t: { name: string }) => t.name);
          setCampaignTypes(names);
          // Update default ad goal if current value is not in the list
          setModalAdGoal(prev => names.includes(prev) ? prev : names[0]);
        }
      });

    // Load saved custom locations
    const saved = localStorage.getItem('saved_custom_locations');
    if (saved) {
      try {
        setSavedCustomLocations(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (editingRequestId && isOpen) {
      const req = requests.find(r => r.id === editingRequestId);
      if (req) {
        setModalUrl(req.url || "");
        setSelectedPlatforms(req.platforms || (allowedPlatforms.length > 0 ? [allowedPlatforms[0]] : []));
        
        // Handle Location (Custom vs Default)
        const loc = req.location || "All Nepal";
        const defaultLocs = ["All Nepal", "Kathmandu", "Bhaktapur", "Lalitpur", "Pokhara", "Biratnagar", "Jhapa"];
        const savedLocsStr = localStorage.getItem('saved_custom_locations');
        let savedLocs: string[] = [];
        try { if(savedLocsStr) savedLocs = JSON.parse(savedLocsStr); } catch(e){}
        const allKnownLocs = [...defaultLocs, ...savedLocs];
        
        if (!allKnownLocs.includes(loc)) {
          setIsCustomLocation(true);
          setCustomLocation(loc);
        } else {
          setIsCustomLocation(false);
          setModalLocations([loc]);
        }

        setModalGender(req.gender || "Both");
        
        // Handle Age (Custom vs Default)
        const age = req.age || "18-65";
        const defaultAges = ["13-17", "18-65", "18-24", "25-34", "35-44", "45-54", "55-64"];
        if (!defaultAges.includes(age)) {
           setIsCustomAge(true);
           setCustomAge(age);
        } else {
           setIsCustomAge(false);
           setModalAge(age);
        }

        setModalAdGoal(req.adGoal || "Get Message");
        setModalDestinations(req.destination ? req.destination.split(', ') : ["Messenger"]);
        setModalBudget(req.allocatedBudget || 5);
        setModalDuration(req.duration || 5);
        setModalNotes(req.remarks || "");
      }
    } else if (!editingRequestId && isOpen) {
       setModalUrl("");
       setSelectedPlatforms(allowedPlatforms.length > 0 ? [allowedPlatforms[0]] : []);
       setModalLocations(["All Nepal"]);
       setIsCustomLocation(false);
       setCustomLocation("");
       setModalGender("Both");
       setModalAge("18-65");
       setIsCustomAge(false);
       setCustomAge("");
       setModalAdGoal(campaignTypes[0] || "Get Message");
       setModalDestinations(["Messenger"]);
       setModalBudget(5);
       setModalDuration(5);
       setModalNotes("");
       setAppliedPromo(null);
       setPromoCode("");
       setShowPromoInput(false);
       setShowTextFormat(false);
    }
  }, [editingRequestId, isOpen, requests]);

  // Removed auto-set destination for Website Traffic as it is irrelevant

  const handleSubmit = async () => {
    if (!eligibility.isEligible) return;

    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const requestData = {
      user_id: user?.uid || user?.id,
      username: profile?.username || user?.email,
      url: modalUrl,
      platform: selectedPlatforms.join(", "),
      platforms: selectedPlatforms,
      location: isCustomLocation ? customLocation : modalLocations.join(", "),
      gender: modalGender,
      age: isCustomAge ? customAge : modalAge,
      ad_goal: modalAdGoal,
      destination: modalAdGoal === "Get Message" ? modalDestinations.join(", ") : "",
      budget: modalBudget,
      allocated_budget: modalBudget,
      duration: modalDuration,
      remarks: modalNotes,
      amount_npr: eligibility.totalNpr,
      rate_used: eligibility.effectiveRate,
      status: "Pending" as const,
    };

    try {
      if (editingRequestId) {
        // Calculate difference for editing
        const oldRequest = requests.find(r => r.id === editingRequestId);
        const oldAmount = oldRequest ? (oldRequest.amountNpr || 0) : 0;
        const diff = eligibility.totalNpr - oldAmount;
        
        // Ensure user has enough balance for the difference
        if (diff > 0 && (profile?.balance || 0) < diff) {
          setError(`Insufficient balance to cover the difference of रू${diff}.`);
          setIsSubmitting(false);
          return;
        }

        const { error: updateErr } = await supabase
          .from('boost_requests')
          .update(requestData)
          .eq('id', editingRequestId);
        if (updateErr) throw updateErr;

        if (diff !== 0) {
          await supabase.rpc('increment_balance', { user_id: requestData.user_id, amount: -diff });
        }
        onSuccess("Request updated successfully!");
      } else {
        const { error: insertErr } = await supabase
          .from('boost_requests')
          .insert(requestData);
        if (insertErr) throw insertErr;
        
        // Deduct balance immediately
        await supabase.rpc('increment_balance', { user_id: requestData.user_id, amount: -eligibility.totalNpr });
        onSuccess("Boost request submitted!");
      }

      // Save custom location if entered
      if (isCustomLocation && customLocation.trim() !== "") {
        const loc = customLocation.trim();
        const defaultLocs = ["All Nepal", "Kathmandu", "Bhaktapur", "Lalitpur", "Pokhara", "Biratnagar", "Jhapa"];
        if (!defaultLocs.includes(loc) && !savedCustomLocations.includes(loc)) {
          const newSaved = [...savedCustomLocations, loc];
          setSavedCustomLocations(newSaved);
          localStorage.setItem('saved_custom_locations', JSON.stringify(newSaved));
        }
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to process request. Check balance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      setError(null);
      const { data, error: promoErr } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .single();
        
      if (promoErr || !data) {
        setError("Invalid promo code.");
        setAppliedPromo(null);
        return;
      }
      if (!data.is_active) {
        setError("Promo code is no longer active.");
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({
        id: data.id,
        code: data.code,
        discountType: data.discount_type,
        value: data.value,
        isActive: data.is_active,
        usageCount: data.usage_count,
        maxUsage: data.max_usage
      });
      setPromoSuccess(true);
    } catch (err: any) {
      setError("Error applying promo code.");
      setAppliedPromo(null);
    }
  };

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(prev => prev.filter(x => x !== p));
    } else {
      setSelectedPlatforms(prev => [...prev, p]);
    }
  };

  const isAllPlatforms = allowedPlatforms.length > 0 && allowedPlatforms.length === selectedPlatforms.length && allowedPlatforms.every(p => selectedPlatforms.includes(p));

  const dailyBudget = modalBudget && modalDuration ? (modalBudget / modalDuration).toFixed(2) : "0.00";

  const generateTextFormat = () => {
    let text = '';
    if (modalUrl) {
      text += `${modalUrl}\n`;
    }
    text += `Platforms: ${selectedPlatforms.join(', ')}\n`;
    text += `Total Budget: $${modalBudget}\n`;
    text += `Duration: ${modalDuration} days\n`;
    text += `Location: ${isCustomLocation ? customLocation : modalLocations.join(', ')}\n`;
    text += `Gender: ${modalGender}\n`;
    text += `Age: ${isCustomAge ? customAge : modalAge}\n`;
    text += `Ad Goal: ${modalAdGoal}\n`;
    
    if (modalAdGoal === 'Get Message' && modalDestinations.length > 0) {
      text += `Destination: ${modalDestinations.join(', ')}`;
    } else {
      text += `Destination: None`;
    }
    
    return text;
  };

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(generateTextFormat());
    // Use the admin whatsapp number from props, stripping non-numeric chars except leading + if needed
    const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : "9779843398340";
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const DEFAULT_AGES = ["13-17", "18-65", "18-24", "25-34", "35-44", "45-54", "55-64"];

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
            className="relative w-full max-w-5xl max-h-[90vh] nm-flat rounded-3xl overflow-hidden flex flex-col text-main border border-white/5"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 flex justify-between items-start border-b border-black/30 bg-black/5 dark:bg-white/5">
              <div>
                <h3 className="text-xl font-black text-main tracking-tight">
                  {editingRequestId ? "Edit Boost Campaign" : "Create Boost Campaign"}
                </h3>
                <p className="text-xs font-medium text-muted mt-1">Configure your boost request with maximum targeting options.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:nm-flat hover:text-main rounded-xl transition-all duration-200 text-muted cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  
                  {/* Campaign Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/10">
                        <Globe size={16} className="text-indigo-400" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-main">Campaign Details</h4>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">URL TO BOOST</label>
                      <input 
                        type="url"
                        value={modalUrl}
                        onChange={(e) => setModalUrl(e.target.value)}
                        placeholder="https://facebook.com/posts/..."
                        className="input-base border-l-2 border-l-indigo-500/40 border-black/25"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">PLATFORM</label>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            if (isAllPlatforms) {
                              setSelectedPlatforms([]);
                            } else {
                              setSelectedPlatforms([...allowedPlatforms]);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer active:scale-[0.95] ${
                            isAllPlatforms 
                              ? 'nm-inset text-indigo-400 border border-indigo-500/20' 
                              : 'nm-flat hover:nm-concave text-muted hover:text-main border border-white/5'
                          }`}
                        >
                          All
                        </button>
                        {Array.from(new Set(allowedPlatforms)).map(p => {
                          const isSelected = selectedPlatforms.includes(p);
                          return (
                            <button 
                              key={p}
                              onClick={() => togglePlatform(p)}
                              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer active:scale-[0.95] ${
                                isSelected 
                                  ? 'nm-inset text-indigo-400 border border-indigo-500/20' 
                                  : 'nm-flat hover:nm-concave text-muted hover:text-main border border-white/5'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Filters & Targeting Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/10">
                        <Users size={16} className="text-indigo-400" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-main">Filters & Targeting</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">LOCATION</label>
                          {!isCustomLocation ? (
                            <div className="relative">
                              <select 
                                value={modalLocations[0]}
                                onChange={(e) => setModalLocations([e.target.value])}
                                className="input-base border-l-2 border-l-indigo-500/40 border-black/25 appearance-none cursor-pointer pr-10"
                              >
                                {Array.from(new Set(["All Nepal", "Kathmandu", "Bhaktapur", "Lalitpur", "Pokhara", "Biratnagar", "Jhapa", ...savedCustomLocations])).map(loc => (
                                  <option key={loc} value={loc} className="bg-surface">{loc}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            </div>
                          ) : (
                            <input 
                              type="text"
                              value={customLocation}
                              onChange={(e) => setCustomLocation(e.target.value)}
                              placeholder="e.g. Dharan, Chitwan"
                              className="input-base border-l-2 border-l-indigo-500/40 border-black/25"
                            />
                          )}
                          <div className="flex items-center gap-2 pt-1.5 pl-1">
                            <input 
                              type="checkbox" 
                              id="customLocationToggle"
                              checked={isCustomLocation}
                              onChange={(e) => setIsCustomLocation(e.target.checked)}
                              className="accent-indigo-500 cursor-pointer w-3.5 h-3.5 rounded border-white/10"
                            />
                            <label htmlFor="customLocationToggle" className="text-[10px] font-bold text-muted cursor-pointer uppercase tracking-widest">Custom Location</label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">GENDER</label>
                        <div className="relative">
                          <select 
                            value={modalGender}
                            onChange={(e) => setModalGender(e.target.value)}
                            className="input-base border-l-2 border-l-indigo-500/40 border-black/25 appearance-none cursor-pointer pr-10"
                          >
                            <option className="bg-surface">Both</option>
                            <option className="bg-surface">Male</option>
                            <option className="bg-surface">Female</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">AGE</label>
                          {!isCustomAge ? (
                            <div className="relative">
                              <select 
                                value={modalAge}
                                onChange={(e) => setModalAge(e.target.value)}
                                className="input-base border-l-2 border-l-indigo-500/40 border-black/25 appearance-none cursor-pointer pr-10"
                              >
                                {DEFAULT_AGES.map(ageOpt => (
                                  <option key={ageOpt} className="bg-surface">{ageOpt}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                            </div>
                          ) : (
                            <input 
                              type="text"
                              value={customAge}
                              onChange={(e) => setCustomAge(e.target.value)}
                              placeholder="e.g. 21-30"
                              className="input-base border-l-2 border-l-indigo-500/40 border-black/25"
                            />
                          )}
                          <div className="flex items-center gap-2 pt-1.5 pl-1">
                            <input 
                              type="checkbox" 
                              id="customAgeToggle"
                              checked={isCustomAge}
                              onChange={(e) => setIsCustomAge(e.target.checked)}
                              className="accent-indigo-500 cursor-pointer w-3.5 h-3.5 rounded border-white/10"
                            />
                            <label htmlFor="customAgeToggle" className="text-[10px] font-bold text-muted cursor-pointer uppercase tracking-widest">Custom Age</label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">AD GOAL</label>
                        <div className="relative">
                          <select
                            value={modalAdGoal}
                            onChange={(e) => setModalAdGoal(e.target.value)}
                            className="input-base border-l-2 border-l-indigo-500/40 border-black/25 appearance-none cursor-pointer pr-10"
                          >
                            {campaignTypes.map(type => (
                              <option key={type} value={type} className="bg-surface">{type}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {modalAdGoal === "Get Message" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">DEST.</label>
                        <div className="flex flex-wrap gap-2">
                          {["Messenger", "WhatsApp", "Instagram Direct"].map(dest => {
                            const isSelected = modalDestinations.includes(dest);
                            return (
                              <button
                                key={dest}
                                onClick={() => {
                                  const next = isSelected
                                    ? modalDestinations.filter(d => d !== dest)
                                    : [...modalDestinations, dest];
                                  setModalDestinations(next.length ? next : ["Messenger"]); // Prevent empty selection
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50"
                                    : "bg-black/20 text-muted border border-black/20 hover:text-main"
                                }`}
                              >
                                {dest}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setShowTextFormat(!showTextFormat)}
                      className="flex items-center justify-center gap-2 px-4 py-2 nm-flat hover:nm-concave rounded-full text-xs font-bold text-muted hover:text-main transition-all w-fit cursor-pointer active:scale-[0.95]"
                    >
                      <Search size={14} /> {showTextFormat ? 'Hide Text Format' : 'Show Text Format'}
                    </button>

                    <AnimatePresence>
                      {showTextFormat && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 nm-inset border border-black/20 rounded-2xl space-y-3 mt-4">
                            <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap">
                              {generateTextFormat()}
                            </pre>
                            <div className="flex gap-3 pt-3 border-t border-black/20">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(generateTextFormat());
                                  onSuccess("Copied to clipboard!");
                                }}
                                className="btn-ghost flex-1 py-2.5 cursor-pointer"
                              >
                                Copy Text
                              </button>
                              <button 
                                onClick={handleWhatsAppSupport}
                                className="flex-1 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer"
                              >
                                Send to WhatsApp
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                  
                  {/* Budget & Payment Box */}
                  <div className="nm-flat border border-white/5 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg nm-inset flex items-center justify-center border border-indigo-500/10">
                        <Wallet size={16} className="text-indigo-400" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-main">Budget & Payment</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">TOTAL BUDGET ($)</label>
                          <span className="text-[10px] font-bold text-rose-500">${dailyBudget}/d</span>
                        </div>
                        <input 
                          type="number"
                          min="1"
                          value={modalBudget}
                          onChange={(e) => setModalBudget(Math.max(1, Number(e.target.value)))}
                          className="input-base border-l-2 border-l-indigo-500/40 border-black/25 text-lg font-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">DURATION (D)</label>
                        <input 
                          type="number"
                          min="1"
                          value={modalDuration}
                          onChange={(e) => setModalDuration(Math.max(1, Number(e.target.value)))}
                          className="input-base border-l-2 border-l-indigo-500/40 border-black/25 text-lg font-black"
                        />
                      </div>
                    </div>

                    <div>
                      {!showPromoInput ? (
                        <button 
                          onClick={() => setShowPromoInput(true)}
                          className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                        >
                          I HAVE A PROMO CODE
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="ENTER CODE"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              className="flex-1 input-base border-l-2 border-l-indigo-500/40 border-black/25 text-xs font-black uppercase"
                            />
                            <button 
                              onClick={handleApplyPromo} 
                              className="btn-primary py-2.5 cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                          {appliedPromo && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20 w-fit"
                            >
                              🎉 Promo Applied: {appliedPromo.code}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-black/25 pt-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">RATE</span>
                        <span className="text-sm font-black text-main">रू{eligibility.effectiveRate}/$</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">PAYABLE</span>
                        <span className="text-4xl font-black text-rose-500 tracking-tighter">रू{eligibility.totalNpr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${eligibility.isEligible ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {eligibility.isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                        </span>
                        <span className="text-xs font-medium text-muted">
                          Balance: रू{(profile?.balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Operational Logic Checks */}
                    <div className="space-y-3 pt-2">
                      <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">OPERATIONAL LOGIC CHECK</h5>
                      
                      {/* Show eligibility warnings using the hook */}
                      {eligibility.warnings.map((warning, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border flex gap-3 text-sm font-medium ${
                          warning.type === 'error' 
                            ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' 
                            : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'
                        }`}>
                          <div className="mt-0.5">
                            {warning.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
                          </div>
                          <p className="leading-tight">{warning.message}</p>
                        </div>
                      ))}

                      {/* Display an error from submission if any */}
                      {error && (
                         <div className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/10 text-rose-400 flex gap-3 text-sm font-medium">
                            <div className="mt-0.5"><AlertCircle size={16} /></div>
                            <p className="leading-tight">{error}</p>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.15em] ml-1">NOTES</label>
                    <textarea 
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      placeholder="Instructions..."
                      className="input-base border-l-2 border-l-indigo-500/40 border-black/25 min-h-[100px] resize-none"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-8 py-5 bg-black/5 dark:bg-white/5 border-t border-black/30 flex gap-4 mt-auto">
              <button 
                onClick={onClose}
                className="btn-ghost px-8 py-3.5 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!eligibility.isEligible || isSubmitting}
                className="btn-primary flex-1 py-3.5 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-white/5 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  editingRequestId ? 'Update Request' : 'Submit Request'
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

