'use client';

import React from "react";
import { Shield, ArrowLeft, Lock, Eye, Trash2, Mail } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-bold text-sm"
        >
          <ArrowLeft size={16} /> Back to App
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-main tracking-tight">Privacy Policy</h1>
              <p className="text-slate-500 dark:text-muted font-medium">Last updated: May 11, 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-slate-600 dark:text-muted leading-relaxed">
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-main mb-4">
                <Eye size={20} className="text-indigo-500" /> Information We Collect
              </h2>
              <p className="mb-4">
                To provide our digital boost services, we collect several types of information from and about users of our app, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-bold">Personal Identifiers:</span> Your name, email address, and unique user ID (UID) provided during authentication.</li>
                <li><span className="font-bold">Service Data:</span> Social media URLs and profile information you provide to fulfill boost requests.</li>
                <li><span className="font-bold">Payment Information:</span> Records of balance loads and transaction history (payment processing handled securely via third parties).</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-main mb-4">
                <Lock size={20} className="text-indigo-500" /> How We Use Your Data
              </h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>To provide and maintain our service.</li>
                <li>To process and fulfill your boost requests.</li>
                <li>To provide customer support and notify you about changes to our app.</li>
                <li>To monitor the usage of our service and detect/prevent technical issues or fraud.</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-main mb-4">
                <Trash2 size={20} className="text-rose-500" /> Data Retention & Deletion
              </h2>
              <p className="mb-4">
                We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy.
              </p>
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-6 rounded-2xl">
                <p className="font-bold text-rose-700 dark:text-rose-400 mb-2">Right to Deletion</p>
                <p className="text-sm">
                  User data and privacy are our top priorities. You have full control over your data. 
                  You can delete your entire profile and all associated data directly from the 
                  <span className="font-bold italic"> Settings</span> menu within the app dashboard. 
                  This action is permanent and will remove:
                </p>
                <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
                  <li>Your user profile and account information.</li>
                  <li>Your boost request history.</li>
                  <li>Your balance transaction history.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-main mb-4">
                <Mail size={20} className="text-indigo-500" /> Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, you can contact us:
              </p>
              <p className="mt-2 font-bold text-indigo-600 dark:text-indigo-400">
                Email: wilxon.xtha@gmail.com
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Boost Manager © 2026
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
