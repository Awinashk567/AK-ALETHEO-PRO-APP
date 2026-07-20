import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Wifi, WifiOff, Globe, Shield } from 'lucide-react';
import { useConnectivity } from '../lib/connectivity';

export const TypewriterTagline = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.substring(0, i + 1));
      i++;
      if (i === text.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [text]);

  return <>{displayText}</>;
};

export const AKAletheoBranding: React.FC<{ className?: string, showTagline?: boolean }> = ({ className = "", showTagline = true }) => {
  const { isOnline } = useConnectivity();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="relative group h-12 w-12"
      >
        <div className="absolute inset-0 rounded-2xl blur group-hover:blur-md transition-all opacity-40 group-hover:opacity-60" style={{ backgroundColor: 'var(--theme-primary)' }} />
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white shadow-xl overflow-hidden">
          <div className="flex flex-col -space-y-0.5 items-center">
            <span className="text-[10px] font-black tracking-tighter italic">AK</span>
            <span className="text-[6px] font-bold uppercase tracking-[0.2em] leading-none" style={{ color: 'var(--theme-primary)' }}>ALETHEO</span>
          </div>
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Connectivity Indicator Badge */}
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
          {isOnline ? (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-lg"
              title="Expert Engine Connected"
            >
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-emerald-500"
              />
              <Globe size={8} className="text-white relative z-10" />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 rounded-md bg-amber-500 border border-slate-800 flex items-center gap-1 shadow-lg -mr-8 mb-1"
              title="Data Vault Mode Active"
            >
              <Shield size={8} className="text-white" />
              <span className="text-[6px] font-black uppercase text-white tracking-widest leading-none">Vault Mode</span>
            </motion.div>
          )}
        </div>
      </motion.div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-black tracking-tight leading-none italic uppercase"
              style={{ color: 'var(--theme-text)' }}
            >
              AK Aletheo
            </motion.h1>
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-[0.1em] text-emerald-500">Expert Engine Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Shield size={8} className="text-amber-500" />
                <span className="text-[7px] font-black uppercase tracking-[0.1em] text-amber-500">Data Vault Mode Active</span>
              </div>
            )}
          </div>
          {showTagline && (
            <>
              <div className="h-4 w-[1px] mx-1 opacity-20" style={{ backgroundColor: 'var(--theme-text)' }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] italic" style={{ color: 'var(--theme-primary)' }}>
                <TypewriterTagline text="Disclosing Insights, Empowering Decisions" />
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-0.5 h-3 ml-1"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                />
              </p>
            </>
          )}
        </div>
        <p className="text-[9px] opacity-60 font-black uppercase tracking-[0.2em] mt-1">Expert Analytical Intelligence Engine v4.0</p>
      </div>
    </div>
  );
};

