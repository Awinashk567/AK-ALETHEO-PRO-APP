import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Grid, Layers, Sparkles, Send, Loader2, TrendingUp, Check, 
  BarChart3, FileText, LayoutGrid, Zap, Target, ArrowRight,
  Database, AlertCircle, ChevronDown, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, Cell, CartesianGrid 
} from 'recharts';
import { DataFile } from '../types';
import { generateInsight, summarizeData, generateMultiDatasetSynthesis, calculateSectionScore } from '../services/aiService';
import { AKAletheoBranding } from './Branding';
import { Dashboard } from './Dashboard';
import Markdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { saveToVault, ThreadItem } from '../lib/vault';
import { useConnectivity } from '../lib/connectivity';
import { printHtmlContent } from '../lib/print';
import { LANGUAGES } from '../constants';

interface ComparisonHubProps {
  files: DataFile[];
  onClose: () => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

interface DatasetSection {
  fileId: string;
  threads: ThreadItem[];
  isLoading: boolean;
  score: number;
}

export const ComparisonHub: React.FC<ComparisonHubProps> = ({ files, onClose, language = 'english', onLanguageChange }) => {
  const { isOnline } = useConnectivity();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sections, setSections] = useState<Record<string, DatasetSection>>({});
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab ] = useState<'comparison' | 'synthesis'>('comparison');
  const [showDashboard, setShowDashboard] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);

  const compositeFile = useMemo(() => {
    if (selectedFileIds.length === 0) return null;
    
    // Combine all selected files' data
    const mergedData = selectedFileIds.flatMap(id => {
      const f = files.find(file => file.id === id);
      if (!f) return [];
      return f.data.map(row => ({
        ...row,
        dataset_source: f.name // Ensure source column for categorization
      }));
    });

    const mergedHeaders = Array.from(new Set([
      'dataset_source',
      ...selectedFileIds.flatMap(id => {
        const f = files.find(file => file.id === id);
        return f ? f.headers : [];
      })
    ]));

    const combinedDna = "This is a composite multi-dataset synthesis consisting of the following sources:\n" +
      selectedFileIds.map(id => {
        const f = files.find(file => file.id === id);
        return f ? `- ${f.name} (${f.data.length} records, ${f.headers.length} metrics)` : '';
      }).filter(Boolean).join('\n') +
      `\n\nSynthesis Summary Strategy Verdict:\n${synthesis || ''}`;

    const combinedFile: DataFile = {
      id: 'composite-synthesis',
      name: 'Composite Workspace Synthesis',
      timestamp: new Date().toISOString(),
      isPinned: false,
      data: mergedData,
      headers: mergedHeaders,
      messages: [],
      steps: [],
      dnaSummary: combinedDna
    };

    return combinedFile;
  }, [selectedFileIds, files, synthesis]);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const handleLanguageChange = async (newLang: string) => {
    setCurrentLanguage(newLang);
    onLanguageChange?.(newLang);
    
    // If we have selected datasets and we have already synthesized, trigger a new synthesis
    if (synthesis && selectedFileIds.length > 0) {
      setIsSynthesizing(true);
      try {
        const datasetsToSynthesize = selectedFileIds.map(id => {
          const file = files.find(f => f.id === id)!;
          const section = sections[id];
          const fullThreadHistory = section.threads.map(t => `Query: ${t.query} -> Result: ${t.insight}`).join(' | ');
          
          return {
            name: file.name,
            summary: summarizeData(file.data),
            query: "Consolidated Thread History",
            insight: fullThreadHistory
          };
        });

        const result = await generateMultiDatasetSynthesis(datasetsToSynthesize, newLang);
        setSynthesis(result);
      } catch (err) {
        console.error("Multi-dataset re-synthesis failed on language change", err);
      } finally {
        setIsSynthesizing(false);
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleInitialize = () => {
    const initialSections: Record<string, DatasetSection> = {};
    selectedFileIds.forEach(id => {
      const file = files.find(f => f.id === id);
      if (file) {
        initialSections[id] = {
          fileId: id,
          threads: [{
            query: 'INITIAL_AUTOSCAN',
            insight: file.analysis || 'Intelligence matrix baseline established.',
            score: 100,
            timestamp: Date.now()
          }],
          score: 85,
          isLoading: false
        };
      }
    });
    setSections(initialSections);
    setIsInitialized(true);
  };

  const handleLocalQuery = async (id: string, query: string) => {
    const file = files.find(f => f.id === id);
    if (!file || !query.trim()) return;

    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], isLoading: true }
    }));

    try {
      const summary = summarizeData(file.data);
      const history = sections[id].threads
        .filter(t => t.query !== 'INITIAL_AUTOSCAN')
        .map(t => `Q: ${t.query}\nA: ${t.insight}`)
        .join('\n\n');
      
      const prompt = `CONTEXT PREVIOUS QUERIES:\n${history}\n\nCURRENT QUERY: ${query}`;
      const insight = await generateInsight(prompt, summary, currentLanguage);
      const score = await calculateSectionScore(query, insight, summary);
      
      const newThread: ThreadItem = {
        query,
        insight,
        score,
        timestamp: Date.now()
      };

      setSections(prev => ({
        ...prev,
        [id]: { 
          ...prev[id], 
          threads: [...prev[id].threads, newThread],
          score,
          isLoading: false
        }
      }));
    } catch (err) {
      console.error("Local query failed", err);
      setSections(prev => ({ ...prev, [id]: { ...prev[id], isLoading: false } }));
    }
  };

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    setActiveTab('synthesis');
    try {
      const datasetsToSynthesize = selectedFileIds.map(id => {
        const file = files.find(f => f.id === id)!;
        const section = sections[id];
        const fullThreadHistory = section.threads.map(t => `Query: ${t.query} -> Result: ${t.insight}`).join(' | ');
        
        return {
          name: file.name,
          summary: summarizeData(file.data),
          query: "Consolidated Thread History",
          insight: fullThreadHistory
        };
      });

      const result = await generateMultiDatasetSynthesis(datasetsToSynthesize, currentLanguage);
      setSynthesis(result);
    } catch (err) {
      console.error("Synthesis failed", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!hubRef.current) return;
    try {
      const element = hubRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
        onclone: (clonedDoc) => {
          try {
            const fixOklab = (str: string) => {
              return str.replace(/(oklch|oklab)\s*\([^;!}]*\)/gi, '#1e293b');
            };

            const styleElements = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styleElements.length; i++) {
              const style = styleElements[i];
              if (style.textContent) {
                style.textContent = fixOklab(style.textContent);
              }
            }

            const allElements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const el = allElements[i] as HTMLElement;
              if (el.style && el.style.cssText) {
                el.style.cssText = fixOklab(el.style.cssText);
              }
              if (el instanceof SVGElement) {
                ['fill', 'stroke'].forEach(attr => {
                  const val = el.getAttribute(attr);
                  if (val && (val.includes('oklch') || val.includes('oklab'))) {
                    el.setAttribute(attr, '#1e293b');
                  }
                });
              }
            }
          } catch (e) {
            console.error("Style cleanup failed in clone", e);
          }
        }
      });
      const link = document.createElement('a');
      link.download = `AK_Aletheo_Enterprise_Comparison_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Capture failed", e);
    }
  };

  const handlePrintReport = () => {
    const content = hubRef.current?.innerHTML || '';
    printHtmlContent(content, {
      title: "AK Aletheo - Diagnostic Master Document",
      subtitle: "Advanced Neural Strategy Hub | Master Print Service",
      extraStyles: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        h1, h2, h3 { font-weight: 900; text-transform: uppercase; }
        .bg-slate-900, .bg-slate-950, .bg-black/40 { background: white !important; border: 1px solid #eee !important; color: black !important; }
        .text-white, .text-indigo-400, .text-slate-300, .text-slate-500 { color: black !important; }
        .markdown-body { color: black !important; }
      `
    });
  };

  const handleSaveToVault = async () => {
    setIsSaving(true);
    try {
      const threads: Record<string, ThreadItem[]> = {};
      selectedFileIds.forEach(id => {
        threads[id] = sections[id].threads;
      });

      await saveToVault({
        id: crypto.randomUUID(),
        name: `Multi-Comparison: ${selectedFileIds.length} Assets`,
        timestamp: Date.now(),
        data: {}, // Summary is stored in threads/analysis
        analysis: synthesis || '',
        query: 'Multi-Thread Synthesis',
        threads
      });
      alert('Strategic Threads archived in AK Vault.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const crossDatasetData = useMemo(() => {
    if (!isInitialized) return [];
    return selectedFileIds.map(id => {
      const file = files.find(f => f.id === id)!;
      const section = sections[id];
      const numericHeaders = file.headers.filter(h => typeof file.data[0][h] === 'number');
      const avg = numericHeaders.length > 0 
        ? file.data.reduce((acc, curr) => acc + (curr[numericHeaders[0]] || 0), 0) / file.data.length
        : 0;
      
      return {
        name: file.name.substring(0, 12),
        score: section.score,
        performance: parseFloat(avg.toFixed(2))
      };
    });
  }, [isInitialized, selectedFileIds, sections, files]);

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-[70] bg-slate-50 flex flex-col font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.05),transparent)] pointer-events-none" />
        
        <div className="flex justify-between items-center p-8 border-b border-slate-200 relative z-10 bg-white/90 backdrop-blur-md">
          <AKAletheoBranding />
          <button onClick={onClose} className="p-3 bg-white text-slate-600 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-all border border-slate-200 shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-16 relative z-10">
          <div className="max-w-6xl mx-auto">
            <header className="mb-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full mb-6"
              >
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700">Phase 1: Project Selection Matrix</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">Select Your Intelligence sources</h2>
              <p className="text-slate-500 text-sm md:text-lg font-medium max-w-2xl mx-auto">Cross-examine multiple datasets to identify optimal strategies and hidden correlations across your workspace.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSelection(file.id)}
                  className={`relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 ${
                    selectedFileIds.includes(file.id) 
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {selectedFileIds.includes(file.id) && (
                    <div className="absolute top-6 right-6 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
                    <Database size={24} className={selectedFileIds.includes(file.id) ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                  <h4 className="text-slate-900 font-black text-lg uppercase tracking-tight mb-2 truncate">{file.name}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{file.data.length} Records</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{file.headers.length} Metrics</span>
                  </div>
                  
                  {file.analysis && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-600 line-clamp-2 italic font-medium leading-relaxed">
                        {file.analysis}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {selectedFileIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
                >
                  <button
                    onClick={handleInitialize}
                    className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center gap-4 transition-all group active:scale-95"
                  >
                    Initialize Multi-Analysis Matrix ({selectedFileIds.length})
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 flex flex-col font-sans overflow-hidden" ref={hubRef}>
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-center p-6 md:p-8 bg-white/95 backdrop-blur-md border-b border-slate-200 relative z-20 gap-6 no-print">
        <div className="flex items-center gap-6">
          <AKAletheoBranding />
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full h-fit">
            <Sparkles size={12} className="text-indigo-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-700">Neural Comparison Hub</span>
          </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full md:w-auto shadow-inner">
          <button 
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutGrid size={14} />
            Execution Matrix
          </button>
          <button 
            onClick={() => setActiveTab('synthesis')}
            className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'synthesis' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Zap size={14} />
            Optimal Synthesis
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Language Selection Option */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-2 rounded-2xl border border-slate-200 shadow-sm no-print">
            <span className="text-[10px] font-black uppercase text-slate-500 pl-2 tracking-wider">Linguistic Protocol:</span>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isSynthesizing}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:bg-slate-50 transition-all focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Suite */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={handleSaveToVault}
              disabled={isSaving}
              className="p-2.5 bg-white text-amber-600 rounded-xl hover:bg-amber-500/10 transition-all border border-slate-200 shadow-sm"
              title="Save to Vault"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            </button>
            <button 
              onClick={handlePrintReport}
              className="p-2.5 bg-white text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
              title="Print Report"
            >
              <FileText size={16} />
            </button>
            {synthesis && (
              <button 
                onClick={() => setShowDashboard(true)}
                className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl border border-indigo-200 shadow-sm transition-all flex items-center gap-1.5"
                title="Launch Strategic Dashboard"
              >
                <BarChart3 size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Dashboard</span>
              </button>
            )}
          </div>

          <div className="h-8 w-[1px] bg-slate-250 mx-1 hidden md:block" />

          <button 
            onClick={handleSynthesize}
            disabled={isSynthesizing || !isOnline}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md shadow-indigo-500/10"
          >
            {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {!isOnline ? 'Synthesis Paused (Offline)' : 'Combine & Compare'}
          </button>
          
          <button onClick={onClose} className="p-3 bg-white text-slate-500 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-all border border-slate-200 shadow-sm">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'comparison' ? (
            <motion.div 
              key="comparison"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar flex"
            >
              <div className="flex h-full p-8 md:p-12 gap-8 min-w-max">
                {selectedFileIds.map((id) => {
                  const file = files.find(f => f.id === id)!;
                  const section = sections[id];
                  
                  return (
                    <motion.div
                      key={id}
                      layout
                      className="w-[450px] md:w-[600px] h-full bg-white rounded-[3rem] border border-slate-200 flex flex-col overflow-hidden shadow-lg relative"
                    >
                       {/* Section Header */}
                      <div className="p-8 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                            <TrendingUp size={20} className="text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-slate-900 font-black text-lg uppercase tracking-tight truncate max-w-[200px]">{file.name}</h3>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Diagnostic Thread Active</p>
                          </div>
                        </div>
                        <div className="text-center bg-slate-100 p-3 rounded-2xl border border-slate-200 min-w-[80px]">
                          <div className={`text-2xl font-black ${section.score > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {section.score}
                          </div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Confidence</div>
                        </div>
                      </div>

                      {/* Threaded Section Content */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                        <AnimatePresence initial={false}>
                          {[...section.threads].reverse().map((thread, idx) => (
                            <motion.div 
                              key={thread.timestamp}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`p-6 rounded-[2rem] border relative overflow-hidden group transition-all ${
                                thread.query === 'INITIAL_AUTOSCAN' 
                                  ? 'bg-indigo-50/30 border-indigo-100' 
                                  : 'bg-slate-50/50 border-slate-150/80'
                              }`}
                            >
                              {thread.query !== 'INITIAL_AUTOSCAN' && (
                                <div className="mb-4">
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">User Query</div>
                                  <div className="text-indigo-800 font-bold text-sm italic">"{thread.query}"</div>
                                </div>
                              )}
                              
                              <div className="markdown-body text-slate-750 text-sm font-medium leading-relaxed prose prose-slate max-w-none prose-p:mb-0">
                                <Markdown>{thread.insight}</Markdown>
                              </div>

                              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  {new Date(thread.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-12 bg-slate-150 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500" style={{ width: `${thread.score}%` }} />
                                  </div>
                                  <span className="text-[8px] font-black text-indigo-600 uppercase">{thread.score}%</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {section.isLoading && (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">Synthesizing Verdict...</p>
                          </div>
                        )}
                      </div>

                      {/* Section Query Box */}
                      <div className="p-6 bg-slate-50/50 border-t border-slate-150 no-print">
                        {!isOnline ? (
                          <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <AlertCircle size={16} className="text-amber-600" />
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Diagnostic Injector Paused (Offline Mode)</p>
                          </div>
                        ) : (
                          <form 
                            className="relative"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem('query') as HTMLInputElement;
                              if (input.value) {
                                handleLocalQuery(id, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <input 
                              name="query"
                              placeholder={`Inject query into ${file.name.substring(0, 15)} thread...`}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-5 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium shadow-inner"
                            />
                            <button 
                              type="submit"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-md"
                            >
                              <Send size={14} />
                            </button>
                          </form>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="synthesis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto p-8 md:p-12 custom-scrollbar"
            >
              <div className="max-w-5xl mx-auto space-y-12">
                {/* Synthesis Content */}
                <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-12 min-h-[600px] relative shadow-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                        <Zap size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-black text-2xl uppercase tracking-tighter italic">AK Optimal Strategy Report</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Multi-Thread Composite intelligence</p>
                      </div>
                    </div>
                    {synthesis && (
                      <button
                        onClick={() => setShowDashboard(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 no-print"
                      >
                        <BarChart3 size={14} />
                        Launch Composite Dashboard
                      </button>
                    )}
                  </div>

                  {isSynthesizing ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-6 text-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={32} />
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-black uppercase tracking-widest text-lg mb-2">Engaging Optimal Engine...</h4>
                        <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">Merging all threaded queries and localized insights</p>
                      </div>
                    </div>
                  ) : synthesis ? (
                    <div className="markdown-body prose prose-slate max-w-none prose-headings:text-indigo-900 prose-strong:text-slate-900 prose-p:text-slate-800 prose-li:text-slate-800">
                      <Markdown>{synthesis}</Markdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-6 text-center">
                      <Target size={48} className="text-slate-300" />
                      <p className="text-slate-400 text-[11px] font-black tracking-[0.2em] uppercase max-w-xs">Threads captured. Initiate "Combine & Compare" to generate the final Expert Verdict.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showDashboard && compositeFile && (
        <Dashboard 
          file={compositeFile} 
          onClose={() => setShowDashboard(false)} 
          language={currentLanguage}
        />
      )}
    </div>
  );
};
