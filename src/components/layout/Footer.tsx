import React from 'react';
import { Rocket } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-zinc-900 text-center">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Rocket className="text-indigo-600" size={24} />
        <span className="text-xl font-black tracking-tight">Boost Manager</span>
      </div>
      <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">
        © {new Date().getFullYear()} Boost Manager. All rights reserved.
      </p>
    </footer>
  );
};
