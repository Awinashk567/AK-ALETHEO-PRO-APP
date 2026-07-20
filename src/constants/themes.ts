export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    sidebar: string;
    sidebarText: string;
    sidebarTextMuted: string;
    accent: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'aletheo-default',
    name: 'Aletheo Default',
    colors: {
      primary: '#6366f1', // indigo-500
      primaryForeground: '#ffffff',
      background: '#f8fafc', // slate-50
      surface: '#ffffff',
      border: '#e2e8f0', // slate-200
      text: '#0f172a', // slate-900
      textMuted: '#64748b', // slate-500
      sidebar: '#0f172a',
      sidebarText: '#f1f5f9',
      sidebarTextMuted: '#94a3b8',
      accent: '#818cf8'
    }
  },
  {
    id: 'midnight-pro',
    name: 'Midnight Pro',
    colors: {
      primary: '#94a3b8',
      primaryForeground: '#ffffff',
      background: '#020617',
      surface: '#0f172a',
      border: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      sidebar: '#000000',
      sidebarText: '#f1f5f9',
      sidebarTextMuted: '#94a3b8',
      accent: '#64748b'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    colors: {
      primary: '#2aa198',
      primaryForeground: '#ffffff',
      background: '#fdf6e3',
      surface: '#eee8d5',
      border: '#d5d1c1',
      text: '#073642',
      textMuted: '#586e75',
      sidebar: '#002b36',
      sidebarText: '#93a1a1',
      sidebarTextMuted: '#586e75',
      accent: '#268bd2'
    }
  },
  {
    id: 'carbon',
    name: 'Carbon',
    colors: {
      primary: '#f97316',
      primaryForeground: '#ffffff',
      background: '#1a1a1a',
      surface: '#262626',
      border: '#404040',
      text: '#e5e5e5',
      textMuted: '#737373',
      sidebar: '#111111',
      sidebarText: '#e5e5e5',
      sidebarTextMuted: '#737373',
      accent: '#fb923c'
    }
  },
  {
    id: 'oceanic',
    name: 'Oceanic',
    colors: {
      primary: '#0d9488',
      primaryForeground: '#ffffff',
      background: '#f0f9ff',
      surface: '#ffffff',
      border: '#e0f2fe',
      text: '#082f49',
      textMuted: '#64748b',
      sidebar: '#082f49',
      sidebarText: '#f0f9ff',
      sidebarTextMuted: '#94a3b8',
      accent: '#0e7490'
    }
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    colors: {
      primary: '#9333ea',
      primaryForeground: '#ffffff',
      background: '#faf5ff',
      surface: '#ffffff',
      border: '#f3e8ff',
      text: '#3b0764',
      textMuted: '#7c3aed',
      sidebar: '#3b0764',
      sidebarText: '#faf5ff',
      sidebarTextMuted: '#a855f7',
      accent: '#a855f7'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#16a34a',
      primaryForeground: '#ffffff',
      background: '#f0fdf4',
      surface: '#ffffff',
      border: '#dcfce7',
      text: '#064e3b',
      textMuted: '#15803d',
      sidebar: '#064e3b',
      sidebarText: '#f0fdf4',
      sidebarTextMuted: '#4ade80',
      accent: '#22c55e'
    }
  },
  {
    id: 'classic-office',
    name: 'Classic Office',
    colors: {
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      background: '#f1f5f9',
      surface: '#ffffff',
      border: '#cbd5e1',
      text: '#1e293b',
      textMuted: '#475569',
      sidebar: '#1e293b',
      sidebarText: '#f8fafc',
      sidebarTextMuted: '#94a3b8',
      accent: '#3b82f6'
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    colors: {
      primary: '#000000',
      primaryForeground: '#ffffff',
      background: '#ffffff',
      surface: '#ffffff',
      border: '#f1f5f9',
      text: '#000000',
      textMuted: '#94a3b8',
      sidebar: '#f8fafc',
      sidebarText: '#000000',
      sidebarTextMuted: '#64748b',
      accent: '#64748b'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      primary: '#ff00ff',
      primaryForeground: '#ffffff',
      background: '#050505',
      surface: '#0a0a0a',
      border: '#1a1a1a',
      text: '#00ff00',
      textMuted: '#39ff14',
      sidebar: '#000000',
      sidebarText: '#00ff00',
      sidebarTextMuted: '#39ff14',
      accent: '#00ffff'
    }
  },
  {
    id: 'retrowave',
    name: 'Retrowave',
    colors: {
      primary: '#ff007f',
      primaryForeground: '#ffffff',
      background: '#24142c',
      surface: '#2d1b33',
      border: '#3d2b43',
      text: '#00f2ff',
      textMuted: '#ff00de',
      sidebar: '#1a0b22',
      sidebarText: '#00ccff',
      sidebarTextMuted: '#8b5cf6',
      accent: '#8b5cf6'
    }
  },
  {
    id: 'sakura',
    name: 'Sakura',
    colors: {
      primary: '#f472b6',
      primaryForeground: '#ffffff',
      background: '#fff1f2',
      surface: '#ffffff',
      border: '#ffe4e6',
      text: '#881337',
      textMuted: '#fb7185',
      sidebar: '#881337',
      sidebarText: '#fff1f2',
      sidebarTextMuted: '#f472b6',
      accent: '#ec4899'
    }
  },
  {
    id: 'espresso',
    name: 'Espresso',
    colors: {
      primary: '#92400e',
      primaryForeground: '#ffffff',
      background: '#fafaf9',
      surface: '#ffffff',
      border: '#e7e5e4',
      text: '#44403c',
      textMuted: '#a8a29e',
      sidebar: '#292524',
      sidebarText: '#fafaf9',
      sidebarTextMuted: '#d6d3d1',
      accent: '#78350f'
    }
  },
  {
    id: 'glacier',
    name: 'Glacier',
    colors: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      background: '#f0f9ff',
      surface: '#ffffff',
      border: '#e0f2fe',
      text: '#0c4a6e',
      textMuted: '#38bdf8',
      sidebar: '#0c4a6e',
      sidebarText: '#f0f9ff',
      sidebarTextMuted: '#7dd3fc',
      accent: '#0284c7'
    }
  },
  {
    id: 'monolith',
    name: 'Monolith',
    colors: {
      primary: '#fbbf24',
      primaryForeground: '#000000',
      background: '#0a0a0a',
      surface: '#121212',
      border: '#262626',
      text: '#ffffff',
      textMuted: '#737373',
      sidebar: '#000000',
      sidebarText: '#fbbf24',
      sidebarTextMuted: '#a16207',
      accent: '#f59e0b'
    }
  }
];
