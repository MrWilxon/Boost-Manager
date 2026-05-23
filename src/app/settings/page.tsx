'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { Navbar } from '@/src/components/layout/Navbar';
import { Settings, Lock, Phone, User, Camera, Save, Building } from 'lucide-react';
import { SettingsSkeleton } from '@/src/components/common/SettingsSkeleton';

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [whatsapp, setWhatsapp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (profile) {
      setWhatsapp(profile.whatsapp || '');
      setBusinessName(profile.businessName || '');
    }
  }, [user, profile, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          whatsapp,
          business_name: businessName,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      setMessage('Password updated successfully!');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Please create a public storage bucket named "avatars" in your Supabase dashboard first.');
        }
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setMessage('Profile picture updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface selection:bg-indigo-500/30">
        <Navbar />
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-muted font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-8 pb-24">
        {/* Header */}
        <div className="nm-flat rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl nm-inset flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]">
              <Settings size={28} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-main tracking-tight flex items-center gap-3">
                Profile Settings
              </h1>
              <p className="text-muted text-sm font-bold mt-1">Manage your account details and security.</p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 nm-inset p-4 rounded-xl border border-emerald-500/20 text-emerald-400 font-bold text-sm shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 nm-inset p-4 rounded-xl border border-rose-500/20 text-rose-400 font-bold text-sm shadow-[inset_0_0_10px_rgba(244,63,94,0.05)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="nm-flat rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full nm-inset flex items-center justify-center text-indigo-500 border border-white/5 overflow-hidden shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)]">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="opacity-50" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 nm-flat rounded-full flex items-center justify-center text-indigo-400 cursor-pointer hover:text-indigo-300 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all">
                  <Camera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={loading} />
                </label>
              </div>
              <h3 className="text-lg font-black text-main">{profile?.username || 'User'}</h3>
              <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">{profile?.role}</p>
            </div>
          </div>

          {/* Forms Section */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Profile Info Form */}
            <form onSubmit={handleUpdateProfile} className="nm-flat rounded-3xl p-6 md:p-8 border border-white/5">
              <h3 className="text-lg font-black text-main mb-6 flex items-center gap-2">
                <User size={20} className="text-indigo-500" />
                Personal Information
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">WhatsApp Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-muted" size={16} />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all placeholder-zinc-600 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)]"
                      placeholder="e.g. +977 9800000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Business Name (Optional)</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 text-muted" size={16} />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all placeholder-zinc-600 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)]"
                      placeholder="Your Agency / Business Name"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 nm-flat rounded-xl flex items-center justify-center gap-2 text-indigo-400 font-black tracking-widest uppercase hover:text-indigo-300 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all disabled:opacity-50"
                >
                  <Save size={18} /> Update Profile
                </button>
              </div>
            </form>

            {/* Security Form */}
            <form onSubmit={handleUpdatePassword} className="nm-flat rounded-3xl p-6 md:p-8 border border-white/5">
              <h3 className="text-lg font-black text-main mb-6 flex items-center gap-2">
                <Lock size={20} className="text-rose-500" />
                Security
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-muted" size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 nm-inset text-main rounded-xl text-sm font-bold outline-none border border-transparent focus:border-rose-500/30 transition-all placeholder-zinc-600 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6)]"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-4 nm-flat rounded-xl flex items-center justify-center gap-2 text-rose-500 font-black tracking-widest uppercase hover:text-rose-400 hover:nm-concave active:scale-[0.98] active:nm-inset transition-all disabled:opacity-50"
                >
                  <Lock size={18} /> Update Password
                </button>
              </div>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
