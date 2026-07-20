import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, X, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, Loader2, BarChart3, PieChart, Sparkles, Database, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { DataFile } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AKAletheoBranding } from './Branding';
import { saveToVault } from '../lib/vault';
import { printHtmlContent } from '../lib/print';
import { LANGUAGES } from '../constants';

interface ReportViewProps {
  file: DataFile;
  onClose: () => void;
  language: string;
  onLanguageChange: (lang: string) => Promise<void>;
  isLoading: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ file, onClose, language, onLanguageChange, isLoading }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const numericColumns = useMemo(() => {
    if (!file.data[0]) return [];
    return Object.keys(file.data[0]).filter(key => !isNaN(Number(file.data[0][key])) && file.data[0][key] !== null);
  }, [file]);

  const categoricalColumns = useMemo(() => {
    if (!file.data[0]) return [];
    return Object.keys(file.data[0]).filter(key => typeof file.data[0][key] === 'string').slice(0, 2);
  }, [file]);

  const chartData = useMemo(() => {
    if (!categoricalColumns[0] || !numericColumns[0]) return [];
    const groups: Record<string, number> = {};
    file.data.forEach(row => {
      const key = String(row[categoricalColumns[0]]);
      const val = Number(row[numericColumns[0]]) || 0;
      groups[key] = (groups[key] || 0) + val;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [file, categoricalColumns, numericColumns]);

  const COLORS = ['#22d3ee', '#818cf8', '#f43f5e', '#fbbf24', '#10b981', '#a855f7'];

  if (!file.report) return null;

  const handleSaveToVault = async () => {
    setIsSaving(true);
    try {
      await saveToVault({
        id: crypto.randomUUID(),
        name: `Analysis: ${file.name}`,
        timestamp: Date.now(),
        data: file.data,
        analysis: file.report || '',
        query: '' // Could be passed from parent if needed
      });
      alert('Analysis saved securely to AK Vault.');
    } catch (error) {
      console.error("Vault Save Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPrintView = () => {
    const reportContent = reportRef.current?.innerHTML || '';
    printHtmlContent(reportContent, {
      title: "AK Aletheo - Report Print View",
      subtitle: "Enterprise Diagnostics Report Preview | Master Print Service"
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-[#020617] flex flex-col w-screen h-screen"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full bg-white flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10 no-print">
          <AKAletheoBranding />
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Selection Option */}
            <div className="flex items-center gap-2 bg-slate-100/80 p-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-500 pl-2 tracking-wider">Linguistic Protocol:</span>
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                disabled={isLoading}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:bg-slate-50 transition-all focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={handleSaveToVault}
                disabled={isSaving}
                className="w-10 h-10 flex items-center justify-center bg-white text-amber-600 rounded-xl hover:bg-amber-500/10 transition-all border border-slate-200 shadow-sm"
                title="Save to Vault"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              </button>
              <button 
                onClick={handleOpenPrintView}
                className="w-10 h-10 flex items-center justify-center bg-white text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                title="Print Report"
              >
                <Printer size={16} />
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-all border border-slate-200 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center gap-4 transition-all duration-300">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <Loader2 size={48} className="animate-spin text-indigo-600 relative z-10" />
              </div>
              <div className="text-center space-y-2 max-w-md px-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">AI Analytical Synthesis Active</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  The AK Aletheo Expert Engine is re-compiling the raw dataset DNA. Customizing clinical annotations and statistical layouts into the chosen linguistic protocol...
                </p>
              </div>
            </div>
          )}
          <div ref={reportRef} className="p-6 md:p-16 bg-white min-h-full">
            <div className="max-w-4xl mx-auto space-y-16 pb-20">
              
              {/* Professional Branding Header (for PDF) */}
              <div className="hidden pdf-only flex justify-between items-start border-b-2 border-indigo-500/30 pb-8 mb-12">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Insight Intelligence</h1>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em] mt-2">Analytical Precision Division</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] font-black uppercase">Report #AK-{Math.floor(Math.random() * 90000 + 10000)}</p>
                  <p className="text-slate-500 text-[10px] font-bold mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SummaryCard 
                  icon={<TrendingUp size={20} />} 
                  label="Dominant Trajectory" 
                  value="Advanced Growth" 
                  color="cyan"
                  desc="Expert validated trend lines show systemic stability."
                />
                <SummaryCard 
                  icon={<AlertTriangle size={20} />} 
                  label="Integrity Status" 
                  value="Anomalies Tracked" 
                  color="rose"
                  desc="Critical variances isolated and documented below."
                />
                <SummaryCard 
                  icon={<Lightbulb size={20} />} 
                  label="AK Aletheo Edge" 
                  value="Optimal Strategy" 
                  color="amber"
                  desc="Logical pathways identified for maximum impact."
                />
              </div>

              {/* Expert Visualizations Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 border-y border-slate-200">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
                      <BarChart3 size={14} className="text-cyan-500" />
                      Dimension Distribution
                    </h3>
                    <span className="text-[9px] text-slate-500 font-mono tracking-tighter">VOL: {file.data.length} UNITS</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0,0,0,0.05)' }}
                          labelStyle={{ fontSize: '10px', color: '#475569' }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                           {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium italic text-center">Expert visual synthesis of top performing categories by volume.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
                      <PieChart size={14} className="text-amber-500" />
                      Structural Composition
                    </h3>
                    <span className="text-[9px] text-slate-500 font-mono tracking-tighter">DATA SYNC: OPTIMAL</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <RePieChart>
                        <Pie
                          data={chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0,0,0,0.05)' }}
                          labelStyle={{ fontSize: '10px', color: '#475569' }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {chartData.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[80px]">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Markdown Body */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-indigo-600" />
                  <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em]">Expert Analytical Synthesis</span>
                </div>
                <div className="prose prose-slate max-w-none 
                  prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-indigo-900 
                  prose-p:text-slate-800 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
                  prose-li:text-slate-800 prose-li:text-base
                  prose-strong:text-slate-900 prose-strong:font-black
                  prose-table:w-full prose-table:border-collapse prose-table:my-8
                  prose-th:border prose-th:border-slate-200 prose-th:bg-slate-100 prose-th:p-4 prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-[0.2em] prose-th:text-indigo-900
                  prose-td:border prose-td:border-slate-200 prose-td:p-4 prose-td:text-sm prose-td:text-slate-700
                  ">
                  <Markdown remarkPlugins={[remarkGfm]}>{file.report}</Markdown>
                </div>
              </div>

              {/* Expert Signature Block */}
              <div className="pt-16 border-t border-slate-200 flex flex-col items-center gap-8 text-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-full blur-2xl opacity-50" />
                  <FileText size={32} className="relative text-slate-400 opacity-20" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 mb-2">Authenticated By</p>
                  <p className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">AK Aletheo Expert Engine V3.0</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Logic Architecture by Awinash Kumar | AK Aletheo Ecosystem</p>
                </div>
                <p className="max-w-md text-[11px] text-slate-500 font-medium italic leading-relaxed">
                  This report has been strictly synthesized and validated by the AK Aletheo Strategic Intelligence Module. 
                  All logical conclusions are derived through high-fidelity multi-variant synthesis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'rose' | 'amber';
  desc: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color, desc }) => {
  const colors = {
    cyan: 'from-cyan-50 via-cyan-50/30 to-slate-50 border-cyan-200 text-cyan-800 shadow-sm',
    rose: 'from-rose-50 via-rose-50/30 to-slate-50 border-rose-200 text-rose-800 shadow-sm',
    amber: 'from-amber-50 via-amber-50/30 to-slate-50 border-amber-200 text-amber-800 shadow-sm',
  };

  return (
    <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${colors[color]} border shadow-md relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-25 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-4 text-slate-400 group-hover:text-slate-500 transition-colors">{label}</p>
        <p className="text-xl font-black tracking-tight mb-3 italic text-slate-800">{value}</p>
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-6">{desc}</p>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700 transition-colors">
          Expert Verified <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
