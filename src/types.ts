import { Type } from "@google/genai";

export interface Step {
  id: string;
  type: 'upload' | 'query' | 'analysis' | 'dashboard' | 'comparison';
  description: string;
  timestamp: string;
}

export interface DashboardSettings {
  primaryNumeric?: string;
  secondaryNumeric?: string;
  primaryCategorical?: string;
  filters?: Record<string, string[]>;
}

export interface DataFile {
  id: string;
  workspaceId: string; // <-- NEW: Har file ko pata hoga wo kis folder (workspace) ki hai
  name: string;
  timestamp: string;
  isPinned: boolean;
  data: any[];
  headers: string[];
  messages: ChatMessage[];
  steps: Step[];
  analysis?: string; // Auto-analysis result
  report?: string; // Final generated report
  dnaSummary?: string; // Statistical DNA for AI logic
  dashboardSettings?: DashboardSettings;
}

// <-- NEW: Workspace (Folder) Interface -->
export interface Workspace {
  id: string;
  name: string;
  timestamp: string;
  files: DataFile[]; // Is workspace ke andar ki saari files
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DashboardFilter {
  column: string;
  value: string | number | null;
}

export const INSIGHT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "The textual insight generated from the data.",
    },
    suggestedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Related questions or actions the user might want to take.",
    }
  },
  required: ["text"]
};