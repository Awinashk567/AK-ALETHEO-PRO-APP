import React, { useMemo, useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area, Legend
} from 'recharts';
import { X, Filter, ArrowLeft, BarChart3, Info, Sparkles, AlertCircle, Loader2, Settings2, Check, ChevronDown, Database, Printer, Terminal, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataFile } from '../types';
import { AKAletheoBranding } from './Branding';
import { saveToVault } from '../lib/vault';
import { printPage, printHtmlContent } from '../lib/print';

interface DashboardProps {
  file: DataFile;
  onClose: () => void;
  language?: string;
}

const COLORS = ['#22d3ee', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

// Helper to format values
const formatValue = (val: any, keyNameOrIndex?: string | number) => {
  const isDateColumn = typeof keyNameOrIndex === 'string' && 
    (keyNameOrIndex.toLowerCase().includes('date') || keyNameOrIndex.toLowerCase().includes('time'));
  
  const numVal = Number(val);
  if (isDateColumn && !isNaN(numVal) && numVal > 35000 && numVal < 60000) {
    const date = new Date((numVal - 25569) * 86400 * 1000);
    if (date.getFullYear() > 1990 && date.getFullYear() < 2060) {
      return date.toLocaleDateString();
    }
  }

  if (val !== null && val !== undefined && !isNaN(numVal) && val !== '') {
    const normalized = Number(val);
    if (normalized > 1000000) return `${(normalized / 1000000).toFixed(1)}M`;
    if (normalized > 1000) return `${(normalized / 1000).toFixed(1)}K`;
    return normalized.toLocaleString();
  }
  return val;
};

const systematicSample = (data: any[], targetSizeSize: number = 1000) => {
  if (!data || data.length <= targetSizeSize) return data;
  const step = Math.floor(data.length / targetSizeSize);
  const result = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
    if (result.length >= targetSizeSize) break;
  }
  return result;
};

const GraphContainer = ({ title, children, explanation, delay = 0, isAiVerified = false }: { title: string, children: React.ReactNode, explanation?: string, delay?: number, isAiVerified?: boolean }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleBeforePrint = () => {
      setIsVisible(true);
      setIsLoaded(true);
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsLoaded(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay]);

  React.useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        const finalWidth = width > 0 ? width : 400;
        const finalHeight = height > 0 ? height : 300;
        setDimensions({ width: finalWidth, height: finalHeight });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isLoaded]);

  return (
    <div ref={containerRef} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 min-h-[500px] flex flex-col shadow-2xl hover:border-cyan-500/30 transition-all group relative overflow-hidden chart-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -mr-16 -mt-16" />
      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-slate-600 opacity-50 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity mr-1" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h4>
            {isAiVerified && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[7px] font-black text-indigo-400 tracking-tighter">
                <Sparkles size={8} /> AI-VERIFIED
              </span>
            )}
          </div>
          <div className="h-0.5 w-8 bg-cyan-500/30 group-hover:w-16 transition-all ml-6" />
        </div>
        <div className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-600 hover:text-cyan-400 transition-all cursor-help border border-slate-700/50 group/info" title={explanation || "AK Aletheo Engine Syncing..."}>
          <Info size={14} className="group-hover/info:rotate-12 transition-transform" />
        </div>
      </div>
      <div className="flex-1 w-full min-h-[280px] h-[280px] relative mt-4">
        {isLoaded && dimensions.width > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-4 w-full px-10">
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
                />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 text-center animate-pulse">AK Aletheo Processing DNA...</p>
            </div>
          </div>
        )}
      </div>
      {explanation && (
        <div className="mt-8 pt-6 border-t border-slate-800/50 shrink-0 bg-slate-900/50 -mx-6 -mb-6 p-6">
          <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium line-clamp-3">
              {explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ file, onClose, language = 'english' }) => {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [draggedChartId, setDraggedChartId] = useState<string | null>(null);

  const [overrides, setOverrides] = useState<Record<string, string>>({
    primaryNumeric: file.dashboardSettings?.primaryNumeric || '',
    secondaryNumeric: file.dashboardSettings?.secondaryNumeric || '',
    primaryCategorical: file.dashboardSettings?.primaryCategorical || '',
  });

  const [processedPayload, setProcessedPayload] = useState<{ sampled: any[], totalFiltered: number, dna: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMetadata, setAiMetadata] = useState<any>(null);
  const [dashboardCharts, setDashboardCharts] = useState<any[]>([]);
  const [loadingChartIds, setLoadingChartIds] = useState<Record<string, boolean>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [filterDebounce, setFilterDebounce] = useState(filters);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilterDebounce(filters);
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  React.useEffect(() => {
    if (aiMetadata?.charts) {
      setDashboardCharts(aiMetadata.charts);
    }
  }, [aiMetadata]);

  React.useEffect(() => {
    return () => {
      setProcessedPayload(null);
      setAiMetadata(null);
      setDashboardCharts([]);
    };
  }, []);

  React.useEffect(() => {
    setAiMetadata(null);
    setDashboardCharts([]);
    setLoadingChartIds({});

    const hasFilters = Object.values(filterDebounce).some(f => f.length > 0);
    
    if (!hasFilters) {
      setProcessedPayload({
        sampled: file.data || [],
        totalFiltered: file.data?.length || 0,
        dna: { summaryText: file.dnaSummary } 
      });
      setIsProcessing(false);
      return;
    }

    const worker = new Worker(new URL('../services/dataWorker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      if (e.data.type === 'PROCESSING_COMPLETE') {
        setProcessedPayload(e.data.payload);
        setIsProcessing(false);
      }
    };

    setIsProcessing(true);
    worker.postMessage({
      type: 'PROCESS_DATA_OFF_THREAD',
      data: file.data, 
      filters: filterDebounce,
      headers: file.headers,
      targetSize: 1000
    });

    return () => worker.terminate();
  }, [file.data, filterDebounce, file.dnaSummary]);

  React.useEffect(() => {
    const dnaToUse = processedPayload?.dna?.summaryText || file.dnaSummary;
    if (!dnaToUse || isSynthesizing || aiMetadata) return;

    const synthesize = async () => {
      const { generateVisualizationMetadata } = await import('../services/geminiService');
      setIsSynthesizing(true);
      try {
        const metadata = await generateVisualizationMetadata(dnaToUse, language);
        if (metadata) {
          setAiMetadata(metadata);
        }
      } catch (err) {
        console.error("AI Synthesis failed", err);
      } finally {
        setIsSynthesizing(false);
      }
    };

    synthesize();
  }, [processedPayload?.dna, file.dnaSummary, language, aiMetadata]);

  // Handle Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedChartId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedChartId || draggedChartId === targetId) return;

    setDashboardCharts(prev => {
      const newCharts = [...prev];
      const draggedIdx = newCharts.findIndex(c => c.id === draggedChartId);
      const targetIdx = newCharts.findIndex(c => c.id === targetId);

      if (draggedIdx !== -1 && targetIdx !== -1) {
        // Aapas mein position swap karna
        const temp = newCharts[draggedIdx];
        newCharts[draggedIdx] = newCharts[targetIdx];
        newCharts[targetIdx] = temp;
      }
      return newCharts;
    });
    setDraggedChartId(null);
  };

  const handleAlternativeAction = async (chart: any, altIndexStr: string) => {
    const altIndex = parseInt(altIndexStr);
    if (isNaN(altIndex)) return;
    const alternative = chart.alternatives?.[altIndex];
    if (!alternative) return;

    if (alternative.action_type === 'visual') {
      setDashboardCharts(prevCharts => prevCharts.map(c => {
        if (c.id === chart.id) {
          return {
            ...c,
            type: alternative.new_type
          };
        }
        return c;
      }));
    } else if (alternative.action_type === 'query') {
      const chartId = chart.id;
      setLoadingChartIds(prev => ({ ...prev, [chartId]: true }));
      
      try {
        const { executeChartQuery } = await import('../services/geminiService');
        const dnaToUse = processedPayload?.dna?.summaryText || file.dnaSummary;
        if (!dnaToUse) return;

        const newChartData = await executeChartQuery(
          alternative.suggested_query,
          chart.title,
          chart.data,
          dnaToUse,
          language
        );
        
        if (newChartData) {
          setDashboardCharts(prevCharts => prevCharts.map(c => {
            if (c.id === chart.id) {
              return {
                ...newChartData,
                id: chart.id
              };
            }
            return c;
          }));
        }
      } catch (err) {
        console.error("Alternative query action failed", err);
      } finally {
        setLoadingChartIds(prev => ({ ...prev, [chartId]: false }));
      }
    }
  };

  const ShimmerBar = ({ delay }: { delay: number }) => (
    <div className="flex-1 bg-slate-800/40 rounded-t-lg relative overflow-hidden h-full">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: '10%' }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          repeatType: 'reverse', 
          delay: delay,
          ease: "easeInOut"
        }}
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500/20 via-cyan-500/10 to-transparent"
        style={{ height: '90%' }}
      />
    </div>
  );

  const numericColumns = useMemo(() => {
    if (!file.data || file.data.length === 0) return [];
    const keys = file.headers;
    return keys.slice(0, 50).filter(key => {
      const sample = file.data.slice(0, 50);
      return sample.every(d => {
        const val = d[key];
        return val === null || val === undefined || val === '' || typeof val === 'number' || !isNaN(Number(val));
      });
    });
  }, [file.data, file.headers]);

  const categoricalColumns = useMemo(() => {
    if (!file.data || file.data.length === 0) return [];
    const keys = file.headers;
    return keys.slice(0, 50).filter(key => {
      const sample = file.data.slice(0, 100);
      const uniqueVals = new Set(sample.map(d => String(d[key])));
      return uniqueVals.size > 1 && uniqueVals.size < 20;
    });
  }, [file.data, file.headers]);

  const mainNumeric = overrides.primaryNumeric || file.dashboardSettings?.primaryNumeric || numericColumns[0] || "";
  const secondaryNumeric = overrides.secondaryNumeric || file.dashboardSettings?.secondaryNumeric || (numericColumns[1] !== mainNumeric ? numericColumns[1] : numericColumns[2]) || mainNumeric;
  const categoricalHeader = overrides.primaryCategorical || file.dashboardSettings?.primaryCategorical || categoricalColumns[0] || file.headers[0] || "";

  const chartData = useMemo(() => {
    if (!processedPayload) return [];
    return processedPayload.sampled.map(item => {
      const newItem = { ...item };
      Object.keys(newItem).forEach(key => {
        const val = newItem[key];
        const numVal = Number(val);
        
        if (numericColumns.includes(key) && typeof val !== 'number' && !isNaN(numVal)) {
          newItem[key] = numVal;
        }

        const isDateColumn = key.toLowerCase().includes('date') || key.toLowerCase().includes('time');
        if (isDateColumn && !isNaN(numVal) && numVal > 35000 && numVal < 60000) {
          const date = new Date((numVal - 25569) * 86400 * 1000);
          if (date.getFullYear() > 1990 && date.getFullYear() < 2060) {
            newItem[key] = date.toLocaleDateString();
          }
        }
      });
      return newItem;
    });
  }, [processedPayload, numericColumns]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      distribution: {
        english: `Statistical spread of ${mainNumeric} segmented by ${categoricalHeader}.`,
        hindi: `${categoricalHeader} के आधार पर ${mainNumeric} का सांख्यिकीय वितरण।`,
      },
    };
    const lang = (language === 'hinglish' || language === 'hindi' || language === 'tamil' || language === 'marathi' || language === 'kannada') ? language : 'english';
    return (translations[key] && translations[key][lang]) || translations[key]?.english || "Analytical sync in progress...";
  };

  const handleSaveToVault = async () => {
    setIsSaving(true);
    try {
      await saveToVault({
        id: crypto.randomUUID(),
        name: `Dashboard: ${file.name}`,
        timestamp: Date.now(),
        data: file.data,
        analysis: '', 
        query: ''
      });
      alert('Dashboard State saved to AK Vault.');
    } catch (error) {
      console.error("Vault Save Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const chartColors = [
    'var(--theme-primary)', 
    'var(--theme-accent)', 
    '#f43f5e', 
    '#10b981', 
    '#f59e0b', 
    '#ec4899', 
    '#06b6d4', 
    '#6366f1'
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-[#020617] text-white flex flex-col font-sans overflow-hidden">
      <header className="h-24 px-10 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-3xl flex items-center justify-between shrink-0 z-20 no-print">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-3 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all border border-slate-700/50 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-10 w-[1px] bg-slate-800" />
          <AKAletheoBranding showTagline={false} />
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveToVault}
              disabled={isSaving}
              className="p-3 bg-slate-800/50 hover:bg-amber-500/10 text-amber-400 rounded-xl border border-slate-700/50 transition-all"
              title="Save to Vault"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            </button>

            <button 
              onClick={() => {
                const content = dashboardRef.current?.innerHTML || '';
                printHtmlContent(content, {
                  title: "AK Aletheo - Dashboard Diagnostics",
                  subtitle: "Enterprise Diagnostics Dashboard | Master Print Service",
                  extraStyles: `
                    body { padding: 40px; }
                    .grid { display: grid !important; }
                    .gap-6 { gap: 1.5rem !important; }
                    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                    @media (min-width: 768px) {
                      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                      .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    }
                    select, button, .no-print, [role="button"] { display: none !important; }
                  `
                });
              }}
              className="p-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 rounded-xl border border-slate-700/50 transition-all"
              title="Print Report"
            >
              <Printer size={16} />
            </button>
          </div>

          <button 
            onClick={() => setShowOverride(!showOverride)}
            className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              showOverride ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 size={16} className={showOverride ? "animate-spin-slow" : ""} />
            {showOverride ? 'Close Controller' : 'Modify Dashboard'}
          </button>
          
          <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-inner shadow-indigo-500/5">
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">AK Aletheo Metrics</span>
          </div>
          <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />
          <button onClick={onClose} className="p-3 bg-slate-800/50 hover:bg-rose-500/10 rounded-xl border border-slate-700/50 text-slate-400 hover:text-rose-400 transition-all">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800/60 p-8 space-y-10 overflow-y-auto bg-slate-900/20 backdrop-blur-sm no-print">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Controller</h3>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[8px] font-black text-slate-400 border border-slate-700">STABLE</span>
          </div>
          
          {categoricalColumns.map(col => {
            const options = Array.from(new Set(file.data.map(d => String(d[col])))).sort();
            const selected = filters[col] || [];
            
            return (
              <div key={col} className="space-y-3 px-1">
                <label className="text-[11px] font-black text-slate-400 block uppercase tracking-wider truncate" title={col}>{col}</label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {options.map(val => (
                    <label key={val} className="flex items-center gap-3 cursor-pointer group/item">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox"
                          checked={selected.includes(val)}
                          onChange={(e) => {
                            const newSelected = e.target.checked 
                              ? [...selected, val]
                              : selected.filter(s => s !== val);
                            setFilters(prev => ({ ...prev, [col]: newSelected }));
                          }}
                          className="peer appearance-none w-4 h-4 rounded border border-slate-700 bg-slate-950 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover/item:text-slate-200 transition-colors truncate">
                        {val}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <button 
            onClick={() => setFilters({})}
            className="w-full py-4 bg-slate-800/30 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:text-white transition-all text-slate-500 group flex items-center justify-center gap-2"
          >
            <AlertCircle size={14} className="group-hover:rotate-12 transition-transform" />
            Reset Matrix
          </button>
        </div>

        <div id="dashboard-export-area" ref={dashboardRef} className="flex-1 overflow-y-auto p-6 md:p-10 bg-gradient-to-br from-[#020617] to-[#0f172a] custom-scrollbar relative">
          
          <AnimatePresence>
            {aiMetadata?.expert_verdict && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-3xl backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles size={24} className="text-indigo-400 opacity-20" />
                </div>
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                  <Terminal size={14} /> Strategic Expert Verdict
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {aiMetadata.expert_verdict}
                </p>
              </motion.div>
            )}

            {showOverride && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 inset-x-0 mx-10 p-6 bg-slate-900/95 border border-indigo-500/30 rounded-b-3xl shadow-3xl z-30 backdrop-blur-3xl flex gap-10 items-end"
              >
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    Primary X-Axis (Category)
                    <ChevronDown size={12} />
                  </label>
                  <select 
                    value={categoricalHeader}
                    onChange={(e) => setOverrides(prev => ({ ...prev, primaryCategorical: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  >
                    {file.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    Primary Metric
                    <ChevronDown size={12} />
                  </label>
                  <select 
                    value={mainNumeric}
                    onChange={(e) => setOverrides(prev => ({ ...prev, primaryNumeric: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  >
                    <option value="">None</option>
                    {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    Secondary Metric
                    <ChevronDown size={12} />
                  </label>
                  <select 
                    value={secondaryNumeric}
                    onChange={(e) => setOverrides(prev => ({ ...prev, secondaryNumeric: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  >
                    <option value="">None</option>
                    {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => setShowOverride(false)}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest px-8"
                >
                  Apply Logic
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 chart-grid">
            {isSynthesizing || !aiMetadata ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 h-[450px] flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between z-10">
                    <div className="space-y-2 w-1/2">
                      <div className="h-2 w-full bg-slate-800 rounded animate-pulse" />
                      <div className="h-1.5 w-1/2 bg-slate-800/50 rounded animate-pulse" />
                    </div>
                    <div className="w-10 h-10 bg-slate-800 rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex-1 flex items-end gap-3 px-2 py-8">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <ShimmerBar key={j} delay={j * 0.05} />
                    ))}
                  </div>
                  <div className="space-y-4 z-10">
                    <div className="h-2 w-full bg-slate-800 rounded animate-pulse" />
                    <div className="flex gap-2">
                       <div className="h-5 w-5 rounded bg-slate-800 animate-pulse" />
                       <div className="h-2 w-1/3 bg-slate-800 rounded animate-pulse mt-1.5" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              dashboardCharts.map((chart: any, i: number) => {
                const isLoading = loadingChartIds[chart.id];

                const ChartComponent = {
                  bar: BarChart,
                  line: LineChart,
                  area: AreaChart,
                  pie: PieChart,
                  scatter: ScatterChart
                }[chart.type as 'bar' | 'line' | 'area' | 'pie' | 'scatter'] || BarChart;

                if (isLoading) {
                  return (
                    <div key={chart.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 h-[550px] flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between z-10">
                        <div className="space-y-2 w-1/2 animate-pulse">
                          <div className="h-2 w-full bg-slate-800 rounded" />
                          <div className="h-1.5 w-1/2 bg-slate-800/50 rounded" />
                        </div>
                        <Loader2 className="animate-spin text-cyan-400" size={20} />
                      </div>
                      <div className="flex-1 flex items-end gap-3 px-2 py-8 h-full w-full">
                        {Array.from({ length: 12 }).map((_, j) => (
                          <ShimmerBar key={j} delay={j * 0.05} />
                        ))}
                      </div>
                      <div className="space-y-2 z-10 animate-pulse">
                        <div className="h-2 w-full bg-slate-800 rounded" />
                        <div className="h-2 w-2/3 bg-slate-800 rounded" />
                      </div>
                    </div>
                  );
                }

                if (!chart.data || chart.data.length === 0) {
                  return (
                    <div 
                      key={chart.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, chart.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, chart.id)}
                      className={`min-h-[550px] flex flex-col justify-between gap-4 chart-card cursor-grab active:cursor-grabbing transition-all ${draggedChartId === chart.id ? 'opacity-40 scale-[0.98]' : ''}`}
                    >
                      <GraphContainer title={chart.title} explanation={chart.explanation} isAiVerified={true}>
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic space-y-4 h-full">
                          <AlertCircle size={32} className="opacity-20" />
                          <p className="text-[10px] uppercase tracking-widest font-black">Limited Signal Detected in DNA</p>
                        </div>
                      </GraphContainer>
                    </div>
                  );
                }

                return (
                  <div 
                    key={chart.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, chart.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, chart.id)}
                    className={`min-h-[550px] flex flex-col justify-between gap-4 chart-card cursor-grab active:cursor-grabbing transition-all ${draggedChartId === chart.id ? 'opacity-40 scale-[0.98] z-50 shadow-2xl' : ''}`}
                  >
                    <GraphContainer title={chart.title} explanation={chart.explanation} isAiVerified={true}>
                      <ChartComponent data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                        <XAxis dataKey="label" stroke="#475569" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatValue} width={35} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          itemStyle={{ color: '#22d3ee', fontSize: '11px', fontWeight: '600' }}
                        />
                        {chart.type === 'bar' && <Bar dataKey="value" fill={chartColors[i % chartColors.length]} radius={[4, 4, 0, 0]} />}
                        {chart.type === 'line' && <Line type="monotone" dataKey="value" stroke={chartColors[i % chartColors.length]} strokeWidth={3} dot={{ r: 3, fill: chartColors[i % chartColors.length], strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 5, strokeWidth: 0 }} />}
                        {chart.type === 'area' && (
                          <>
                            <defs>
                              <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke={chartColors[i % chartColors.length]} strokeWidth={3} fill={`url(#grad-${i})`} />
                          </>
                        )}
                        {chart.type === 'pie' && (
                          <Pie data={chart.data} dataKey="value" nameKey="label" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none" cornerRadius={6}>
                            {chart.data.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        )}
                        {chart.type === 'scatter' && <Scatter name={chart.title} data={chart.data} fill={chartColors[i % chartColors.length]} shape="circle" />}
                      </ChartComponent>
                    </GraphContainer>
                    
                    <div className="bg-slate-900 border border-slate-800/80 rounded-[1.5rem] p-4 flex flex-col gap-2 shadow-lg hover:border-slate-700 transition-all shrink-0 no-print">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Settings2 size={10} className="text-cyan-400" /> Change View / Explore More
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-cyan-500/50 hover:border-slate-700 transition-all appearance-none cursor-pointer pr-8 font-medium"
                          onChange={(e) => {
                            handleAlternativeAction(chart, e.target.value);
                            e.target.value = "";
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select exploration path...</option>
                          {(chart.alternatives || []).map((alt: any, altIdx: number) => (
                            <option key={altIdx} value={altIdx}>
                              {alt.action_type === 'visual' ? '📊 [Visual] ' : '🧠 [Explore] '} {alt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                          <ChevronDown size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Master Audit Table</h4>
              <span className="text-[10px] text-slate-500 font-mono italic">Validated for {language} context</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/20 text-slate-400">
                    {file.headers.slice(0, 8).map(h => (
                      <th key={h} className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {chartData.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                      {file.headers.slice(0, 8).map(h => (
                        <td key={h} className="px-6 py-4 text-slate-400 font-sans group-hover:text-cyan-400 text-[11px]">
                          {formatValue(row[h], h)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};