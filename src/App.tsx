import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';
import { ComparisonHub } from './components/ComparisonHub';
import { OnboardingModal } from './components/OnboardingModal';
import { generateInsight, summarizeData, performAutoAnalysis, generateFinalReport } from './services/geminiService';
import { DataFile, ChatMessage, Step } from './types';
import { workspaceStorage } from './services/storage';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompare, Plus, FileText, Sparkles, Palette, Folder, X, Loader2 } from 'lucide-react';
import { AKAletheoBranding } from './components/Branding';
import { LANGUAGES } from './constants';
import { THEMES } from './constants/themes';
import { VaultSnapshot } from './lib/vault';
import { extractDNA, StreamingDNAExtractor } from './lib/dnaExtractor';

import { useConnectivity } from './lib/connectivity';
import { AlertCircle, WifiOff } from 'lucide-react';

function App() {
  const { isOnline } = useConnectivity();
  const [offlineAlert, setOfflineAlert] = useState<string | null>(null);
  
  const [workspaces, setWorkspaces] = useState<{id: string, name: string, timestamp: string}[]>(() => {
    const saved = localStorage.getItem('ak-workspaces');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const [files, setFiles] = useState<DataFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [checkedFileIds, setCheckedFileIds] = useState<string[]>([]);

  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [isComparisonVisible, setIsComparisonVisible] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [themeId, setThemeId] = useState(() => localStorage.getItem('ak-aletheo-theme') || 'aletheo-default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ingestState, setIngestState] = useState({ active: false, progress: 0, text: '' });

  const selectedFile = files.find(f => f.id === selectedFileId);
  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentTheme;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--theme-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`;
      root.style.setProperty(cssVarName, value);
    });
    localStorage.setItem('ak-aletheo-theme', themeId);
  }, [themeId, currentTheme]);

  useEffect(() => {
    localStorage.setItem('ak-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedFiles = await workspaceStorage.getAllFiles();
        if (storedFiles && storedFiles.length > 0) {
          const sorted = storedFiles.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setFiles(sorted);
        }
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      }
    };
    loadInitialData();
  }, []);

  const updateFileData = async (fileId: string, updates: Partial<DataFile>) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const updated = { ...f, ...updates };
        workspaceStorage.updateFile(updated);
        return updated;
      }
      return f;
    }));
  };

  const addStep = (fileId: string, type: Step['type'], description: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const newStep: Step = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          description,
          timestamp: new Date().toLocaleTimeString()
        };
        const updated = { ...f, steps: [newStep, ...f.steps] };
        workspaceStorage.updateFile(updated);
        return updated;
      }
      return f;
    }));
  };

  const handleFileUploadInterception = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length === 0) return;
    
    setPendingFiles(uploaded);
    setWorkspaceName(`Project - ${new Date().toLocaleDateString('en-GB')}`);
    setIsWorkspaceModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startIngestion = async () => {
    if (pendingFiles.length === 0) return;
    setIsWorkspaceModalOpen(false);
    
    const totalFiles = pendingFiles.length;
    let completedFiles = 0;

    setIngestState({ active: true, progress: 5, text: 'Initializing Data Extraction Matrix...' });

    const workspaceId = Math.random().toString(36).substr(2, 9);
    const finalWorkspaceName = workspaceName.trim() || `Untitled Project`;
    setWorkspaces(prev => [{ id: workspaceId, name: finalWorkspaceName, timestamp: new Date().toISOString() }, ...prev]);

    let newlyCreatedFiles: DataFile[] = [];

    const filePromises = pendingFiles.map(file => {
      return new Promise<DataFile>((resolve, reject) => {
        const newFileId = Math.random().toString(36).substr(2, 9);
        
        if (file.name.endsWith('.csv')) {
          const worker = new Worker(new URL('./services/dataWorker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            if (e.data.type === 'PARSE_COMPLETE') {
              const { dna, headers, sample, rowCount } = e.data.payload;
              const newFile: DataFile = {
                id: newFileId, workspaceId, name: file.name, timestamp: new Date().toLocaleString(),
                isPinned: false, data: sample.slice(0, 1500), headers, dnaSummary: dna?.summaryText,
                messages: [{ 
                  id: Date.now().toString(), 
                  role: 'assistant', 
                  content: `Project [${finalWorkspaceName}] Linked. High-Scale DNA extracted for ${file.name}. Validated ${rowCount.toLocaleString()} records.` 
                }],
                steps: [{ id: Math.random().toString(), type: 'upload', description: `DNA extracted for ${rowCount} rows.`, timestamp: new Date().toLocaleTimeString() }]
              };
              worker.terminate();
              
              completedFiles++;
              setIngestState(prev => ({ ...prev, progress: 5 + Math.round((completedFiles / totalFiles) * 60), text: `Parsing & Extracting DNA: ${completedFiles}/${totalFiles} files completed...` }));
              
              resolve(newFile);
            } else if (e.data.type === 'ERROR') {
              worker.terminate();
              reject(e.data.error);
            }
          };
          worker.postMessage({ type: 'PARSE_FILE_STREAMING', file, targetSize: 500000 });
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const parsedData = XLSX.utils.sheet_to_json(sheet);
            const headers = parsedData.length > 0 ? Object.keys(parsedData[0] as object) : [];
            const dna = extractDNA(parsedData);
            const newFile: DataFile = {
              id: newFileId, workspaceId, name: file.name, timestamp: new Date().toLocaleString(),
              isPinned: false, data: parsedData.slice(0, 1500), headers, dnaSummary: dna.summaryText,
              messages: [{ 
                id: Date.now().toString(), 
                role: 'assistant', 
                content: `Project [${finalWorkspaceName}] Linked. High-Scale DNA extracted for ${file.name}. Validated ${parsedData.length.toLocaleString()} records.` 
              }],
              steps: [{ id: Math.random().toString(), type: 'upload', description: `Initial ingestion successful.`, timestamp: new Date().toLocaleTimeString() }]
            };
            
            completedFiles++;
            setIngestState(prev => ({ ...prev, progress: 5 + Math.round((completedFiles / totalFiles) * 60), text: `Parsing & Extracting DNA: ${completedFiles}/${totalFiles} files completed...` }));
            
            resolve(newFile);
          };
          reader.readAsBinaryString(file);
        }
      });
    });

    try {
      newlyCreatedFiles = await Promise.all(filePromises);
      
      setIngestState({ active: true, progress: 75, text: 'Mapping Relational Schema & Connecting to Expert AI...' });

      for (const f of newlyCreatedFiles) await workspaceStorage.saveFile(f);
      setFiles(prev => [...newlyCreatedFiles, ...prev]);
      
      const newFileIds = newlyCreatedFiles.map(f => f.id);
      setSelectedFileId(newFileIds[newFileIds.length - 1]);
      setCheckedFileIds(newFileIds); 

      // FIX: Perfectly Balanced Prompt (Text + Tables + Charts)
      let masterDNA = "";
      if (newlyCreatedFiles.length === 1) {
        masterDNA = newlyCreatedFiles[0].dnaSummary || "";
      } else {
        masterDNA = `WORKSPACE/PROJECT NAME: "${finalWorkspaceName}"\n`;
        masterDNA += `CRITICAL UI INSTRUCTION: You are generating a comprehensive Multi-Dataset Analysis. Your response MUST be a balanced mix of 3 elements: 1. Deep Textual Insights (Executive Summary), 2. Detailed Markdown Tables (comparing exact numbers), and 3. Powerful Charts/Graphs. To prevent blank charts, ensure your chart 'dataKey' aligns with universal metrics shared across these files, or base your charts on the exact column schema of the primary dataset (${newlyCreatedFiles[0].name}). Do NOT skip text or tables.\n\n`;
        masterDNA += "WORKSPACE MASTER SCHEMA (Initial Relational Auto-Analysis):\n\n" + 
                    newlyCreatedFiles.map(f => `--- DATASET: ${f.name} ---\n${f.dnaSummary}`).join("\n\n");
      }

      setIngestState({ active: true, progress: 85, text: 'Synthesizing Intelligence... (This may take a moment for large workspaces)' });

      const autoAnalysisResult = await performAutoAnalysis(masterDNA, language);

      setIngestState({ active: true, progress: 95, text: 'Finalizing Workspace Insights...' });

      const updatedFiles = newlyCreatedFiles.map(f => {
        const prefix = newlyCreatedFiles.length > 1 ? `[Project: ${finalWorkspaceName} - Master Insight]:\n` : "";
        const updated = { 
          ...f, 
          analysis: autoAnalysisResult,
          messages: [...f.messages, { id: Date.now().toString(), role: 'assistant' as const, content: prefix + autoAnalysisResult }]
        };
        workspaceStorage.updateFile(updated);
        return updated;
      });

      setFiles(prev => prev.map(p => updatedFiles.find(u => u.id === p.id) || p));
      
      setIngestState({ active: true, progress: 100, text: 'Complete!' });
      setTimeout(() => setIngestState({ active: false, progress: 0, text: '' }), 1000);

    } catch (err) {
      console.error("Ingestion or Initial Auto-Analysis Failed:", err);
      setOfflineAlert("Some files failed to process or AI Engine is busy.");
      setIngestState({ active: false, progress: 0, text: '' });
      setTimeout(() => setOfflineAlert(null), 3000);
    }
  };

  const handleAutoAnalyze = async () => {
    const targetIds = checkedFileIds.length > 0 ? checkedFileIds : (selectedFileId ? [selectedFileId] : []);
    if (targetIds.length === 0) return;

    if (!isOnline) {
      setOfflineAlert("AI Engine is offline. Cannot perform Analysis in Vault Mode.");
      setTimeout(() => setOfflineAlert(null), 3000);
      return;
    }

    setIsLoading(true);
    setIngestState({ active: true, progress: 30, text: 'Compiling Selection DNA...' });
    const targetFiles = files.filter(f => targetIds.includes(f.id));

    try {
      let masterDNA = "";
      let systemLog = "";

      if (targetFiles.length === 1) {
        masterDNA = targetFiles[0].dnaSummary || "";
        systemLog = `Regenerating deep auto-analysis on ${targetFiles[0].name}...`;
        addStep(targetFiles[0].id, 'analysis', systemLog);
      } else {
        // FIX: Perfectly Balanced Prompt (Text + Tables + Charts)
        masterDNA = `WORKSPACE/PROJECT NAME: "Multiple Selected Files"\n`;
        masterDNA += `CRITICAL UI INSTRUCTION: You are generating a comprehensive Multi-Dataset Analysis. Your response MUST be a balanced mix of 3 elements: 1. Deep Textual Insights (Executive Summary), 2. Detailed Markdown Tables (comparing exact numbers), and 3. Powerful Charts/Graphs. To prevent blank charts, ensure your chart 'dataKey' aligns with universal metrics shared across these files, or base your charts on the exact column schema of the primary dataset (${targetFiles[0].name}). Do NOT skip text or tables.\n\n`;
        masterDNA += "WORKSPACE MASTER SCHEMA (Relational Analysis Requested):\n\n" + 
                    targetFiles.map(f => `--- DATASET: ${f.name} ---\n${f.dnaSummary}`).join("\n\n");
        systemLog = `Executing Master Auto-Analysis on ${targetFiles.length} selected files...`;
        targetFiles.forEach(f => addStep(f.id, 'analysis', systemLog));
      }

      setIngestState({ active: true, progress: 70, text: 'Synthesizing On-Demand Intelligence...' });
      const analysisResult = await performAutoAnalysis(masterDNA, language);

      setIngestState({ active: true, progress: 95, text: 'Updating Dashboards...' });

      for (const file of targetFiles) {
        const prefix = targetFiles.length > 1 ? `[Master Workspace Insight spanning ${targetFiles.length} files]:\n` : "";
        await updateFileData(file.id, {
          analysis: analysisResult,
          messages: [...file.messages, { id: Date.now().toString(), role: 'assistant', content: prefix + analysisResult }]
        });
      }

      setIngestState({ active: true, progress: 100, text: 'Analysis Complete!' });
      setTimeout(() => setIngestState({ active: false, progress: 0, text: '' }), 1000);

    } catch (err) {
      console.error("Manual Auto-analysis failed:", err);
      setOfflineAlert("The AI Engine is momentarily overloaded. Please try again.");
      setIngestState({ active: false, progress: 0, text: '' });
      setTimeout(() => setOfflineAlert(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFileCheck = (fileId: string) => {
    setCheckedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleQuery = async (query: string) => {
    if (!selectedFile) return;
    if (!isOnline) {
      setOfflineAlert("AI Synthesis is paused. Using Local Vault Mode.");
      setTimeout(() => setOfflineAlert(null), 3000);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: query };
    const updatedMessages = [...selectedFile.messages, userMsg];
    await updateFileData(selectedFileId!, { messages: updatedMessages });

    setIsLoading(true);
    addStep(selectedFileId!, 'query', `Executing deep-search for: "${query}"`);
    
    try {
      const summary = selectedFile.dnaSummary || "No Data Summary Available";
      const insight = await generateInsight(query, summary, language);
      if (insight.includes("Error") || insight.includes("failed")) throw new Error("API Failure");

      const dataArray = Array.isArray(selectedFile.data) ? selectedFile.data : [];
      const words = query.toLowerCase().split(/[\s,._-]+/);
      const matchedNumeric = selectedFile.headers.filter(h => 
        words.some(w => (h.toLowerCase().includes(w) || w.includes(h.toLowerCase())) && w.length > 3)
      ).slice(0, 2);

      const categoricalColumns = selectedFile.headers.filter(h => {
        const uniqueVals = new Set(dataArray.slice(0, 500).map(d => String(d[h])));
        return uniqueVals.size > 1 && (uniqueVals.size < 35 || (uniqueVals.size < dataArray.length * 0.25));
      });

      let filters: Record<string, string[]> | undefined = undefined;
      selectedFile.headers.forEach(h => {
        if (categoricalColumns.includes(h)) {
          const uniqueVals = Array.from(new Set(dataArray.map(d => String(d[h]))));
          const matchedVals = uniqueVals.filter(v => words.some(w => v.toLowerCase().includes(w) && w.length >= 1));
          if (matchedVals.length > 0) filters = { ...filters, [h]: matchedVals };
        }
      });

      const newSettings = {
        ...selectedFile.dashboardSettings,
        primaryNumeric: matchedNumeric[0] || selectedFile.dashboardSettings?.primaryNumeric,
        secondaryNumeric: matchedNumeric[1] || selectedFile.dashboardSettings?.secondaryNumeric,
        filters: filters || selectedFile.dashboardSettings?.filters
      };
      
      const assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: insight };
      await updateFileData(selectedFileId!, { 
         messages: [...updatedMessages, assistantMsg], dashboardSettings: newSettings, report: undefined, analysis: undefined
      });
    } catch (err) {
      console.error("Query synthesis failed:", err);
      setOfflineAlert("The Expert Engine is momentarily busy. Your local data remains secure. Retrying in 5s...");
      setTimeout(() => { setOfflineAlert(null); handleQuery(query); }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) await updateFileData(fileId, { isPinned: !file.isPinned });
  };

  const handleDeleteFile = async (fileId: string) => {
    await workspaceStorage.deleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setCheckedFileIds(prev => prev.filter(id => id !== fileId));
    if (selectedFileId === fileId) setSelectedFileId(undefined);
  };

  const handleClearView = () => {
    setSelectedFileId(undefined);
    setIsDashboardVisible(false); setIsComparisonVisible(false); setIsReportVisible(false);
    if (selectedFileId) {
      updateFileData(selectedFileId, { messages: [], steps: [], report: undefined, dashboardSettings: undefined });
    }
  };

  const handleGenerateReport = async () => { 
    const targetIds = checkedFileIds.length > 0 ? checkedFileIds : (selectedFileId ? [selectedFileId] : []);
    if (targetIds.length === 0) return;
    const targetFiles = files.filter(f => targetIds.includes(f.id));

    setIsLoading(true);
    addStep(selectedFileId!, 'dashboard', 'Synthesizing global report context...');

    try {
      let masterSummary = "";
      if (targetFiles.length === 1) {
        masterSummary = targetFiles[0].dnaSummary || "No Data Summary Available";
      } else {
        // FIX: Perfectly Balanced Prompt (Text + Tables + Charts)
        masterSummary = `WORKSPACE/PROJECT: Multi-File Report\n`;
        masterSummary += `CRITICAL UI INSTRUCTION: You are generating a comprehensive Multi-Dataset Report. Your response MUST be a balanced mix of 3 elements: 1. Deep Textual Insights (Executive Summary), 2. Detailed Markdown Tables (comparing exact numbers), and 3. Powerful Charts/Graphs. To prevent blank charts, ensure your chart 'dataKey' aligns with universal metrics shared across these files, or base your charts on the exact column schema of the primary dataset (${targetFiles[0].name}). Do NOT skip text or tables.\n\n`;
        masterSummary += targetFiles.map(f => `--- DATASET: ${f.name} ---\n${f.dnaSummary}`).join("\n\n");
      }

      const queryHistory = selectedFile!.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Query' : 'Insight'}: ${m.content}`)
        .join('\n\n');
      
      const report = await generateFinalReport(masterSummary, queryHistory, language);
      
      await updateFileData(selectedFileId!, { report });
      setIsReportVisible(true);
      addStep(selectedFileId!, 'dashboard', 'Intelligence Report finalized and rendered.');
    } catch (err) {
      console.error("Report generation failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReportInLanguage = async (newLang: string) => { 
    if (!selectedFile) return;
    setLanguage(newLang);
    setIsLoading(true);
    const langName = LANGUAGES.find(l => l.id === newLang)?.name || newLang;
    addStep(selectedFileId!, 'dashboard', `Re-synthesizing report context in [${langName}]...`);
    try {
      const summary = selectedFile.dnaSummary || "No Data Summary Available";
      const queryHistory = selectedFile.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Query' : 'Insight'}: ${m.content}`)
        .join('\n\n');
      
      const report = await generateFinalReport(summary, queryHistory, newLang);
      await updateFileData(selectedFileId!, { report });
      addStep(selectedFileId!, 'dashboard', `Intelligence Report finalized in [${langName}].`);
    } catch (err) {
      console.error("Report generation in new language failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = () => {
    setIsComparisonVisible(true);
    if (selectedFileId) addStep(selectedFileId, 'comparison', 'Multi-source comparison sequence initiated.');
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    addStep(fileId, 'analysis', 'Switched focus to this dataset. Environment synchronized.');
  };

  const handleRestoreSnapshot = async (snapshot: VaultSnapshot) => { 
    const restoredFile: DataFile = {
      id: Math.random().toString(36).substr(2, 9),
      workspaceId: 'vault-restored',
      name: `${snapshot.name} (Restored)`,
      timestamp: new Date().toLocaleString(),
      isPinned: false,
      data: snapshot.data,
      headers: snapshot.data.length > 0 ? Object.keys(snapshot.data[0]) : [],
      messages: [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Restored session from AK Vault. [Source: ${snapshot.name}]`
      }],
      steps: [{
        id: 'restore-step',
        type: 'analysis',
        description: 'Atmospheric restoration of archived intelligence successful.',
        timestamp: new Date().toLocaleTimeString()
      }],
      report: snapshot.analysis
    };

    await workspaceStorage.saveFile(restoredFile);
    setFiles(prev => [restoredFile, ...prev]);
    setSelectedFileId(restoredFile.id);
    alert('Snapshot restored from AK Vault.');
  };

  const handleLanguageChange = async (newLang: string) => { 
    setLanguage(newLang);
    if (selectedFileId && selectedFile) {
      const langName = LANGUAGES.find(l => l.id === newLang)?.name || newLang;
      addStep(selectedFileId, 'analysis', `Operational language switched to ${langName}. Re-syncing intelligence...`);
      
      const systemUpdate: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Intelligence Core re-synchronized. System language set to [${langName}]. All subsequent queries and dashboard insights will be delivered in this linguistic protocol.`
      };

      setFiles(prev => prev.map(f => f.id === selectedFileId 
        ? { ...f, messages: [...f.messages, systemUpdate] } 
        : f
      ));

      setIsLoading(true);
      setIngestState({ active: true, progress: 50, text: `Re-translating intelligence to ${langName}...` });
      try {
        const summary = selectedFile.dnaSummary || "No Data Summary Available";
        const newAnalysis = await performAutoAnalysis(summary, newLang);
        
        setFiles(prev => prev.map(f => f.id === selectedFileId 
          ? { ...f, analysis: newAnalysis } 
          : f
        ));
        addStep(selectedFileId, 'analysis', `Intelligence Matrix re-built for [${langName}] context.`);
        setIngestState({ active: true, progress: 100, text: 'Complete!' });
        setTimeout(() => setIngestState({ active: false, progress: 0, text: '' }), 1000);
      } catch (err) {
        console.error("Language sync failed", err);
        setIngestState({ active: false, progress: 0, text: '' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen w-full selection:bg-indigo-500/30 overflow-hidden font-sans" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
      <Sidebar 
        workspaces={workspaces} files={files} onSelectFile={handleSelectFile} onDeleteFile={handleDeleteFile}
        onTogglePin={handleTogglePin} onRestoreSnapshot={handleRestoreSnapshot} selectedFileId={selectedFileId} 
        language={language} onLanguageChange={handleLanguageChange}
        checkedFileIds={checkedFileIds} onToggleFileCheck={handleToggleFileCheck}
      />
      
      <ChatArea 
        messages={selectedFile?.messages || []} steps={selectedFile?.steps || []} onQuery={handleQuery}
        onUploadClick={() => fileInputRef.current?.click()}
        onLaunchDashboard={() => { setIsDashboardVisible(true); if (selectedFileId) addStep(selectedFileId, 'dashboard', 'Bridge established.'); }}
        onClearAll={handleClearView} onGenerateReport={handleGenerateReport} onCompare={handleCompare}
        isDashboardEnabled={!!selectedFile} isComparisonEnabled={files.length > 0} isLoading={isLoading}
        currentThemeId={themeId} onThemeChange={setThemeId}
        onAutoAnalyze={handleAutoAnalyze} checkedFilesCount={checkedFileIds.length}
      />

      <input type="file" ref={fileInputRef} onChange={handleFileUploadInterception} className="hidden" accept=".csv,.xlsx,.xls" multiple />

      <AnimatePresence>
        {ingestState.active && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <motion.div 
                  className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${ingestState.progress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                <Loader2 size={32} className="text-cyan-400 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide mb-2">Processing Data Matrix</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-6">{ingestState.text}</p>
              <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>{ingestState.progress}% Complete</span>
                <span>Please wait...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWorkspaceModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setIsWorkspaceModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20"><Folder className="text-cyan-400" size={24} /></div>
                <div><h3 className="text-lg font-bold text-white">Create Workspace</h3><p className="text-xs text-slate-400">Group {pendingFiles.length} file(s) into a project folder.</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Workspace Name</label>
                  <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="e.g. Q3 Sales Data" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 outline-none focus:border-cyan-500 transition-colors text-sm font-medium" autoFocus onKeyDown={(e) => e.key === 'Enter' && startIngestion()} />
                </div>
                <button onClick={startIngestion} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"><Sparkles size={16} />Start Data Ingestion</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDashboardVisible && selectedFile && <Dashboard file={selectedFile} onClose={() => setIsDashboardVisible(false)} language={language} />}
      {isReportVisible && selectedFile && <ReportView file={selectedFile} onClose={() => setIsReportVisible(false)} language={language} onLanguageChange={handleGenerateReportInLanguage} isLoading={isLoading} />}
      {isComparisonVisible && <ComparisonHub files={checkedFileIds.length > 0 ? files.filter(f => checkedFileIds.includes(f.id)) : files} language={language} onLanguageChange={setLanguage} onClose={() => setIsComparisonVisible(false)} />}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
}

export default App;