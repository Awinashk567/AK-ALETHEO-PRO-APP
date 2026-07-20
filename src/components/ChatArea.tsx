import React, { useRef, useEffect, useState } from 'react';
import { Send, Plus, BarChart3, Bot, Search, Filter as FilterIcon, History, Trash2, FileText, GitCompare, ChevronRight, CheckCircle2, Sparkles, Palette, Check, WifiOff, Globe, Shield, Zap, RefreshCw } from 'lucide-react';
import { ChatMessage, Step } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { THEMES } from '../constants/themes';
import { AKAletheoBranding } from './Branding';
import { useConnectivity } from '../lib/connectivity';

// --- Theme Picker Component (Unchanged) ---
const ThemePicker = ({ currentThemeId, onThemeChange }: { currentThemeId: string, onThemeChange: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all group"
        title="Switch Interface Skin"
      >
        <Palette size={20} className="group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-3 w-56 border rounded-2xl shadow-2xl z-50 p-3"
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
          >
            <div className="px-3 py-2 mb-2">
              <h3 className="text-[10px] font-black opacity-40 uppercase tracking-widest" style={{ color: 'var(--theme-text)' }}>Interface Skin</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onThemeChange(t.id);
                    setIsOpen(false);
                  }}
                  className="theme-tooltip group relative"
                  data-tooltip={t.name}
                >
                  <div 
                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                      currentThemeId === t.id ? 'border-indigo-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: t.colors.primary }}
                  >
                    {currentThemeId === t.id && <Check size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Chat Area Component ---
// UPDATED PROPS FOR THE AUTO ANALYZE LOGIC
interface ChatAreaProps {
  messages: ChatMessage[];
  steps: Step[];
  onQuery: (query: string) => void;
  onUploadClick: () => void;
  onLaunchDashboard: () => void;
  onClearAll: () => void;
  onGenerateReport: () => void;
  onCompare: () => void;
  isDashboardEnabled: boolean;
  isComparisonEnabled?: boolean;
  isLoading: boolean;
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  onAutoAnalyze?: () => void; // NEW PROP
  checkedFilesCount?: number; // NEW PROP
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  steps,
  onQuery, 
  onUploadClick, 
  onLaunchDashboard,
  onClearAll,
  onGenerateReport,
  onCompare,
  isDashboardEnabled,
  isComparisonEnabled = true,
  isLoading,
  currentThemeId,
  onThemeChange,
  onAutoAnalyze, // INITIALIZED
  checkedFilesCount = 0 // INITIALIZED
}) => {
  const [input, setInput] = React.useState('');
  const [showSteps, setShowSteps] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useConnectivity();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && isOnline) {
      onQuery(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-row overflow-hidden relative font-sans" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header 
          className="h-20 backdrop-blur-xl border-b flex items-center px-10 justify-between shadow-sm z-10 shrink-0"
          style={{ backgroundColor: 'rgba(var(--theme-surface), 0.8)', borderColor: 'var(--theme-border)' }}
        >
          <AKAletheoBranding />
          
          <div className="flex items-center gap-3">
            
            {/* NEW: THE MASTER AUTO-ANALYZE BUTTON */}
            {isDashboardEnabled && (
              <button 
                onClick={onAutoAnalyze}
                disabled={isLoading || !isOnline}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 border ${
                  isLoading || !isOnline 
                    ? 'opacity-50 cursor-not-allowed grayscale' 
                    : 'hover:shadow-lg hover:opacity-90'
                }`}
                style={{ 
                  backgroundColor: 'var(--theme-surface)', 
                  color: 'var(--theme-primary)',
                  borderColor: 'var(--theme-primary)'
                }}
                title={checkedFilesCount > 0 ? `Analyze ${checkedFilesCount} selected files` : "Regenerate Analysis for current workspace"}
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 rounded-full animate-spin border-t-transparent" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
                ) : (
                  <RefreshCw size={14} className={checkedFilesCount > 0 ? "" : ""} />
                )}
                {checkedFilesCount > 1 ? `Analyze Selected (${checkedFilesCount})` : 'Auto Analyze'}
              </button>
            )}

            <div className="h-6 w-[1px] mx-2 opacity-20" style={{ backgroundColor: 'var(--theme-text)' }} />

            <ThemePicker currentThemeId={currentThemeId} onThemeChange={onThemeChange} />
            <button 
              onClick={onClearAll}
              className="p-3 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-2xl transition-all group"
              style={{ color: 'var(--theme-text)' }}
              title="Start New Workspace Session"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
            <button 
              onClick={() => setShowSteps(!showSteps)}
              className={`p-3 rounded-2xl transition-all group ${showSteps ? 'bg-indigo-500/10 text-indigo-500 shadow-inner' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`}
              style={{ color: showSteps ? 'var(--theme-primary)' : 'var(--theme-text)' }}
              title="Logic Trace Visualization"
            >
               <History size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </header>

        {/* Central Workspace Layout */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden min-h-0 p-6 lg:p-8 gap-6 lg:gap-8">
          
          {/* Left Panel: Strategic Command Center */}
          <section className="w-full lg:w-[35%] xl:w-[32%] flex flex-col gap-6 shrink-0 justify-start overflow-y-auto lg:overflow-visible h-fit lg:h-full lg:pb-0 pb-4">
            <div className="flex flex-col gap-5 h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 px-1 mt-1">
                  <label className="text-[10px] font-black opacity-45 uppercase tracking-[0.3em]">
                    {isOnline ? 'Deep-Search Input' : 'Local Archive Search (Vault Mode)'}
                  </label>
                  {!isOnline && (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                      <Zap size={10} className="text-amber-500" />
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">AI Synthesis Paused</span>
                    </div>
                  )}
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-50" style={{ backgroundColor: isOnline ? 'var(--theme-primary)' : '#f59e0b' }} />
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      disabled={!isOnline}
                      placeholder={isOnline ? "Ask AK Aletheo anything about your data... (e.g. 'Synthesize key revenue growth drivers')" : "AI Synthesis is paused. Using Local Vault Mode..."}
                      className={`w-full min-h-[160px] lg:min-h-[240px] xl:min-h-[280px] border rounded-[2rem] p-6 pr-20 text-[14px] font-medium transition-all outline-none shadow-xl resize-none ${!isOnline ? 'cursor-not-allowed opacity-60 grayscale-[0.5]' : ''}`}
                      style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                    />
                    <button 
                      onClick={handleSubmit}
                      disabled={isLoading || !input.trim() || !isOnline}
                      className="absolute right-5 bottom-5 p-4 text-white rounded-2xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-2xl active:scale-95 group/btn"
                      style={{ backgroundColor: isOnline ? 'var(--theme-primary)' : 'var(--theme-border)' }}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : !isOnline ? (
                        <WifiOff size={20} className="opacity-40" />
                      ) : (
                        <Send size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Symmetrical Grid of Action Commands */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 mt-2">
                <button 
                  onClick={onUploadClick}
                  className="w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-all active:scale-95 group"
                  style={{ backgroundColor: 'var(--theme-text)', color: 'var(--theme-background)' }}
                >
                  <Plus size={14} style={{ color: 'var(--theme-primary)' }} className="group-hover:rotate-90 transition-transform" />
                  Ingest New Data
                </button>
                <button 
                  onClick={onLaunchDashboard}
                  disabled={!isDashboardEnabled}
                  className={`w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    isDashboardEnabled 
                      ? 'border shadow-lg hover:opacity-80' 
                      : 'opacity-40 cursor-not-allowed shadow-none'
                  }`}
                  style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                >
                  <BarChart3 size={14} className={isDashboardEnabled ? "text-indigo-500" : "text-slate-300"} style={{ color: isDashboardEnabled ? 'var(--theme-primary)' : '' }} />
                  View Matrix
                </button>
                <button 
                  onClick={onCompare}
                  disabled={!isComparisonEnabled || !isOnline}
                  className={`w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                    isComparisonEnabled && isOnline
                      ? 'text-white hover:shadow-indigo-500/30' 
                      : 'opacity-40 cursor-not-allowed shadow-none border'
                  }`}
                  style={{ 
                    backgroundColor: isComparisonEnabled && isOnline ? 'var(--theme-primary)' : 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)'
                  }}
                >
                  <GitCompare size={14} />
                  Forge Comparison
                </button>
                <button 
                  onClick={onGenerateReport}
                  disabled={!isDashboardEnabled || !isOnline}
                  className={`w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                    isDashboardEnabled && isOnline
                      ? 'text-white hover:shadow-emerald-500/30' 
                      : 'opacity-40 cursor-not-allowed shadow-none border'
                  }`}
                  style={{ 
                    backgroundColor: isDashboardEnabled && isOnline ? 'var(--theme-accent)' : 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)'
                  }}
                >
                  <FileText size={14} />
                  Finalize Report
                </button>
              </div>
            </div>
          </section>

          {/* Right Panel: Large Expanded Output */}
          <section className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <div 
              ref={scrollRef}
              className="flex-1 border rounded-3xl p-8 shadow-2xl overflow-y-auto space-y-8 scroll-smooth custom-scrollbar"
              style={{ 
                backgroundColor: 'var(--theme-surface)', 
                borderColor: 'var(--theme-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="w-full space-y-6 flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {messages.length === 0 ? (
                    <motion.div 
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                    >
                      {!isOnline ? (
                        <div className="mb-10 px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 max-w-sm">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shrink-0">
                            <Shield size={20} className="text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Vault Mode Active</h4>
                            <p className="text-[11px] font-bold text-slate-400 leading-tight mt-0.5">Expert Engine is offline. Basic local tools remain operational.</p>
                          </div>
                        </div>
                      ) : (
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="mb-10 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2"
                        >
                          <Globe size={12} className="text-emerald-500" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Global Expert Infrastructure Linked</span>
                        </motion.div>
                      )}

                      <div className="w-20 h-20 rounded-[2.5rem] border shadow-inner flex items-center justify-center mx-auto mb-6 group hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}>
                        <Sparkles size={32} />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight italic" style={{ color: 'var(--theme-text)' }}>Knowledge Ingestion Ready</h2>
                      <p className="text-sm max-w-sm mx-auto leading-relaxed font-medium mt-4" style={{ color: 'var(--theme-text-muted)' }}>
                        Mount a data source from the expert sidebar to begin disclosing strategic architecture.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-8">
                      {messages.map((m) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          key={m.id}
                          className={`flex items-start gap-5 ${m.role === 'user' ? 'flex-row-reverse' : 'justify-start'}`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg transition-transform hover:scale-110 ${
                            m.role === 'user' 
                              ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
                              : 'bg-gradient-to-br from-cyan-500 to-indigo-600'
                          }`}>
                            <span className="text-white text-[12px] font-black italic">
                              {m.role === 'user' ? 'ME' : 'AK'}
                            </span>
                          </div>
                          <div className={`p-6 rounded-3xl shadow-sm border flex-1 ${
                            m.role === 'user' 
                              ? 'bg-slate-900 text-slate-100 border-slate-800 rounded-tr-none max-w-md ml-auto' 
                              : 'rounded-tl-none ring-1 ring-slate-100/50 w-full'
                          }`}
                          style={{ 
                            backgroundColor: m.role === 'assistant' ? 'var(--theme-surface)' : '',
                            borderColor: m.role === 'assistant' ? 'var(--theme-border)' : '',
                            color: m.role === 'assistant' ? 'var(--theme-text)' : ''
                          }}>
                            {m.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={12} className="text-indigo-500" />
                                <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--theme-primary)' }}>Expert Analytical Synthesis</span>
                              </div>
                            )}
                            <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium overflow-x-auto">
                              {m.content}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Steps Sidebar */}
      <AnimatePresence>
        {showSteps && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l flex flex-col shrink-0 overflow-hidden"
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
          >
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
                <History size={14} />
                Steps Recorded
              </h3>
              <button 
                onClick={() => setShowSteps(false)}
                className="p-1 hover:bg-black/5 rounded transition-colors"
              >
                <ChevronRight size={16} className="opacity-40" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" style={{ backgroundColor: 'rgba(var(--theme-background), 0.3)' }}>
              {steps.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-6 border shadow-inner" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                    <CheckCircle2 size={32} className="opacity-10" />
                  </div>
                  <p className="text-[10px] opacity-30 uppercase tracking-[0.2em] font-black">History Buffer Empty</p>
                </div>
              ) : (
                <div className="space-y-10 relative steps-timeline-container">
                  {steps.map((step, i) => (
                    <div key={step.id} className="relative pl-12 group">
                      <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-xl border-2 flex items-center justify-center z-10 transition-all group-hover:scale-110 shadow-sm ${
                        i === steps.length - 1 ? 'text-indigo-500' : 'opacity-20'
                      }`}
                      style={{ 
                        backgroundColor: 'var(--theme-surface)', 
                        borderColor: i === steps.length - 1 ? 'var(--theme-primary)' : 'var(--theme-border)',
                        color: i === steps.length - 1 ? 'var(--theme-primary)' : 'var(--theme-text)'
                      }}>
                        {i === steps.length - 1 ? (
                          <div className="w-3 h-3 rounded-md shadow-lg" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }} />
                        )}
                      </div>
                      <div className="group-hover:translate-x-1 transition-transform">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[10px] font-black opacity-30 uppercase tracking-wider">{step.timestamp}</div>
                          <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border" style={{ backgroundColor: 'rgba(var(--theme-primary), 0.05)', borderColor: 'rgba(var(--theme-primary), 0.1)', color: 'var(--theme-primary)' }}>
                            {step.type}
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed font-bold tracking-tight opacity-80">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};