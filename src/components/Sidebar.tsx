import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Database, Clock, Trash2, Globe, Sparkles, Pin, PinOff, Search, FileX, Archive, RefreshCw, Settings, Save, X, Folder, ChevronDown, ChevronRight, FileSpreadsheet, Check } from 'lucide-react';
import { DataFile } from '../types';
import { AKAletheoBranding } from './Branding';
import { motion, AnimatePresence } from 'motion/react';
import { LANGUAGES } from '../constants';
import { getVaultSnapshots, deleteFromVault, VaultSnapshot } from '../lib/vault';

// UPDATED PROPS TO INCLUDE CHECKBOX LOGIC
interface SidebarProps {
  workspaces?: {id: string, name: string, timestamp: string}[];
  files: DataFile[];
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onTogglePin: (fileId: string) => void;
  onRestoreSnapshot: (snapshot: VaultSnapshot) => void;
  selectedFileId?: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  checkedFileIds?: string[]; // NEW PROP
  onToggleFileCheck?: (fileId: string) => void; // NEW PROP
}

// --- Data Mesh Background Component (Unchanged) ---
export const DataMesh = ({ opacity = 0.4 }: { opacity?: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];
    const particleCount = 20;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p2.x - p.x;
          const dy2 = p2.y - p.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" style={{ opacity }} />;
};

export const Sidebar: React.FC<SidebarProps> = ( { 
  workspaces = [], 
  files, 
  onSelectFile, 
  onDeleteFile,
  onTogglePin,
  onRestoreSnapshot,
  selectedFileId,
  language,
  onLanguageChange,
  checkedFileIds = [], // INITIALIZED
  onToggleFileCheck
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'vault'>('active');
  const [vaultSnapshots, setVaultSnapshots] = useState<VaultSnapshot[]>([]);
  
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // DYNAMIC STATES FOR CONFIGURATION
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('');

  // Auto-open folder if a file inside it is selected
  useEffect(() => {
    if (selectedFileId) {
      const activeFile = files.find(f => f.id === selectedFileId);
      if (activeFile && activeFile.workspaceId && !openFolders.includes(activeFile.workspaceId)) {
        setOpenFolders(prev => [...prev, activeFile.workspaceId]);
      }
    }
  }, [selectedFileId, files]);

  useEffect(() => {
    if (activeTab === 'vault') {
      loadVault();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isSettingsOpen) {
      const savedKey = localStorage.getItem('AK_CUSTOM_API_KEY') || '';
      const savedModel = localStorage.getItem('AK_CUSTOM_MODEL') || '';
      setTempApiKey(savedKey);
      setTempModel(savedModel);
    }
  }, [isSettingsOpen]);

  const loadVault = async () => {
    const snapshots = await getVaultSnapshots();
    setVaultSnapshots(snapshots.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently purge this snapshot from the AK Vault?')) {
      await deleteFromVault(id);
      loadVault();
    }
  };

  const saveConfiguration = () => {
    if (tempApiKey.trim() === '') {
      localStorage.removeItem('AK_CUSTOM_API_KEY');
    } else {
      localStorage.setItem('AK_CUSTOM_API_KEY', tempApiKey.trim());
    }

    if (tempModel.trim() === '') {
      localStorage.removeItem('AK_CUSTOM_MODEL');
    } else {
      localStorage.setItem('AK_CUSTOM_MODEL', tempModel.trim());
    }
    
    alert('System Configuration updated successfully! Please refresh the application for changes to take effect.');
    setIsSettingsOpen(false);
  };

  const toggleFolder = (workspaceId: string) => {
    setOpenFolders(prev => 
      prev.includes(workspaceId) 
        ? prev.filter(id => id !== workspaceId) 
        : [...prev, workspaceId]
    );
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const pinnedFiles = useMemo(() => filteredFiles.filter(f => f.isPinned), [filteredFiles]);
  
  const groupedWorkspaces = useMemo(() => {
    const groups: { workspace: any, files: DataFile[] }[] = [];
    
    const legacyFiles = filteredFiles.filter(f => !f.isPinned && !f.workspaceId);
    if (legacyFiles.length > 0) {
       groups.push({
           workspace: { id: 'legacy', name: 'Unassigned Files', timestamp: '' },
           files: legacyFiles
       });
    }

    workspaces.forEach(ws => {
        const wsFiles = filteredFiles.filter(f => !f.isPinned && f.workspaceId === ws.id);
        if (wsFiles.length > 0) {
            groups.push({ workspace: ws, files: wsFiles });
        }
    });

    return groups;
  }, [filteredFiles, workspaces]);

  // NEW: Updated FileItem with Checkbox
  const FileItem = ({ file, isNested = false }: { file: DataFile, isNested?: boolean }) => {
    const isChecked = checkedFileIds.includes(file.id);

    return (
      <li key={file.id} className="relative group">
        <div
          className={`w-full py-2 transition-all rounded-xl flex items-center gap-2 pr-20 relative overflow-hidden ${
            selectedFileId === file.id 
              ? 'shadow-lg border ring-1 ring-white/10' 
              : 'hover:bg-black/10'
          } ${isNested ? 'pl-8' : 'px-4'}`}
          style={{ 
            backgroundColor: selectedFileId === file.id ? 'var(--theme-surface)' : 'transparent',
            borderColor: selectedFileId === file.id ? 'var(--theme-primary)' : 'transparent'
          }}
        >
          {selectedFileId === file.id && (
            <motion.div 
              layoutId="active-pill"
              className="absolute left-0 top-0 bottom-0 w-1" 
              style={{ backgroundColor: 'var(--theme-primary)' }}
            />
          )}

          {/* THE CUSTOM CHECKBOX */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFileCheck) onToggleFileCheck(file.id);
            }}
            className={`w-[14px] h-[14px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0 z-10 ${
              isChecked 
                ? 'bg-cyan-500 border-cyan-500' 
                : 'border-slate-500 hover:border-slate-300 bg-black/20'
            }`}
          >
            {isChecked && <Check size={10} className="text-black font-bold" />}
          </button>
          
          {/* THE CLICKABLE FILE NAME AREA */}
          <button
            onClick={() => onSelectFile(file.id)}
            className="flex-1 flex items-center gap-2.5 overflow-hidden text-left py-1"
          >
            <FileSpreadsheet size={14} className={selectedFileId === file.id ? '' : 'opacity-40'} style={{ color: selectedFileId === file.id ? 'var(--theme-primary)' : 'inherit' }} />
            
            <div className="flex flex-col overflow-hidden">
              <span className={`font-bold text-[12px] truncate ${selectedFileId === file.id ? '' : 'opacity-80 group-hover:opacity-100'}`} style={{ color: selectedFileId === file.id ? 'var(--theme-primary)' : 'inherit' }}>
                {file.name}
              </span>
              {!isNested && (
                <span className="flex items-center gap-1.5 mt-0.5 text-[9px] opacity-40 uppercase tracking-tighter font-bold">
                  <Clock size={10} className="opacity-50" />
                  {file.timestamp}
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(file.id);
            }}
            className="p-1.5 rounded-lg transition-all"
            style={{ 
              color: file.isPinned ? '#fbbf24' : 'inherit',
              backgroundColor: file.isPinned ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
            }}
            title={file.isPinned ? 'Unpin Asset' : 'Pin Asset'}
          >
            {file.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.id);
            }}
            className="p-1.5 opacity-50 hover:opacity-100 hover:bg-rose-400/10 hover:text-rose-400 rounded-lg transition-all"
            title="Permanently Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div 
      className="w-80 h-full flex flex-col border-r shrink-0 shadow-2xl z-20 overflow-hidden font-sans relative"
      style={{ backgroundColor: 'var(--theme-sidebar)', color: 'var(--theme-sidebar-text)', borderColor: 'var(--theme-border)' }}
    >
      <DataMesh opacity={0.3} />
      <div className="p-6 border-b flex flex-col gap-6 relative z-10" style={{ borderColor: 'var(--theme-border)' }}>
        <AKAletheoBranding showTagline={false} />
        
        <div className="space-y-4">
          <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-slate-800 text-indigo-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sparkles size={12} />
              Active
            </button>
            <button 
              onClick={() => setActiveTab('vault')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vault' ? 'bg-slate-800 text-amber-500 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Archive size={12} />
              Vault
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
            <input 
              type="text"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/10 border rounded-xl pl-9 pr-4 py-2.5 text-[11px] outline-none transition-all"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-sidebar-text)' }}
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-lg blur group-hover:blur-md transition-all opacity-50" />
            <div className="relative flex items-center gap-3 bg-black/10 border rounded-lg px-4 py-2 group-hover:border-white/20 transition-colors" style={{ borderColor: 'var(--theme-border)' }}>
              <Globe size={14} style={{ color: 'var(--theme-primary)' }} />
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full bg-transparent text-[11px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer"
                style={{ color: 'var(--theme-sidebar-text)' }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id} style={{ backgroundColor: 'var(--theme-sidebar)', color: 'var(--theme-sidebar-text)' }} className="font-sans uppercase">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-4">
        {activeTab === 'active' ? (
          <>
            {pinnedFiles.length > 0 && (
              <div className="mb-6">
                <div className="px-6 mb-2 flex items-center gap-2">
                  <Pin size={10} className="text-amber-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--theme-sidebar-text-muted)' }}>Pinned Assets</h3>
                </div>
                <ul className="px-3 space-y-1">
                  {pinnedFiles.map(file => <FileItem key={file.id} file={file} />)}
                </ul>
              </div>
            )}

            <div className="flex-1 relative z-10">
              <div className="px-6 mb-3 flex items-center gap-2">
                <Database size={10} style={{ color: 'var(--theme-sidebar-text-muted)' }} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--theme-sidebar-text-muted)' }}>Data Workspaces</h3>
              </div>
              
              <AnimatePresence mode="popLayout">
                {files.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] italic p-10 text-center uppercase tracking-[0.2em] leading-relaxed flex flex-col items-center gap-4"
                    style={{ color: 'var(--theme-sidebar-text-muted)' }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: 'var(--theme-sidebar)', borderColor: 'var(--theme-border)' }}>
                      <FileX size={20} style={{ color: 'var(--theme-sidebar-text-muted)' }} />
                    </div>
                    Workspace awaiting data ingestion
                  </motion.div>
                ) : groupedWorkspaces.length === 0 && pinnedFiles.length > 0 ? (
                  <div className="text-slate-700 text-[9px] italic px-10 text-center uppercase tracking-widest mt-4">
                    No active workspaces
                  </div>
                ) : (
                  <div className="px-3 space-y-2 pb-6">
                    {groupedWorkspaces.map(({ workspace, files }) => {
                      const isOpen = openFolders.includes(workspace.id);
                      return (
                        <div key={workspace.id} className="bg-black/10 border rounded-xl overflow-hidden transition-colors" style={{ borderColor: isOpen ? 'var(--theme-border)' : 'transparent' }}>
                          <button 
                            onClick={() => toggleFolder(workspace.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-black/20 transition-colors"
                          >
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--theme-surface)' }}>
                              <Folder size={14} style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="text-xs font-bold truncate" style={{ color: 'var(--theme-text)' }}>{workspace.name}</h4>
                              <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-50">{files.length} File{files.length !== 1 ? 's' : ''}</p>
                            </div>
                            {isOpen ? <ChevronDown size={14} className="opacity-40" /> : <ChevronRight size={14} className="opacity-40" />}
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.ul 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/5 py-1"
                              >
                                {files.map(file => <FileItem key={file.id} file={file} isNested={true} />)}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col relative z-10">
            <div className="px-6 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={10} className="text-amber-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">Secured Snapshots</h3>
              </div>
              <button 
                onClick={loadVault}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-all text-slate-500 hover:text-white"
                title="Sync Vault"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-2">
              {vaultSnapshots.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                  <Archive size={32} className="mx-auto text-slate-800" />
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-loose">Vault is currently empty. Save reports or dashboards to archive them here.</p>
                </div>
              ) : (
                vaultSnapshots.map(snap => (
                  <div 
                    key={snap.id}
                    onClick={() => onRestoreSnapshot(snap)}
                    className="group relative bg-black/10 border border-white/5 hover:border-amber-500/30 rounded-xl p-4 cursor-pointer transition-all hover:bg-black/20 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-2xl -mr-8 -mt-8" />
                    <div className="flex flex-col gap-1 relative z-10">
                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight group-hover:text-amber-400 transition-colors truncate pr-8">
                        {snap.name}
                      </span>
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock size={8} />
                        {new Date(snap.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t relative z-10" style={{ backgroundColor: 'var(--theme-sidebar)', borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: 'var(--theme-sidebar-text-muted)' }}>Environment Live</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="System Settings"
            >
              <Settings size={14} />
            </button>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--theme-primary)' }}>AK ALETHEO v3.0</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings size={14} className="text-indigo-400" />
                  System Settings
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Custom Gemini API Key
                  </label>
                  <input 
                    type="password"
                    placeholder="Enter new API Key (starts with AIza...)"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                  />
                  <p className="text-[9px] text-slate-500 leading-relaxed pt-1">
                    Provide a custom API key to override the default environment key. Leave empty and save to revert to default.
                  </p>
                </div>
                
                {/* NEW FIELD FOR CUSTOM MODEL */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Custom Model Version
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. gemini-2.5-flash or gemini-2.0-pro"
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                  />
                  <p className="text-[9px] text-slate-500 leading-relaxed pt-1">
                    Specify the AI model version. Leave empty to use the default optimized model.
                  </p>
                </div>
                
                <button 
                  onClick={saveConfiguration}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors mt-2"
                >
                  <Save size={14} />
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};