import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { extractDNA } from "../lib/dnaExtractor";

// ==========================================
// 1. SMART CONFIGURATION ROUTER
// ==========================================
const getProviderConfig = () => {
  const provider = (localStorage.getItem('AK_AI_PROVIDER') || 'google').toLowerCase();
  const key = localStorage.getItem('AK_CUSTOM_API_KEY') ? localStorage.getItem('AK_CUSTOM_API_KEY')!.trim() : (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const userCustomModel = localStorage.getItem('AK_CUSTOM_MODEL') ? localStorage.getItem('AK_CUSTOM_MODEL')!.trim() : "";

  // 🚀 DYNAMIC DEFAULT MODELS (Agar user box khali chhod de)
  let defaultModel = "gemini-2.5-flash"; 
  if (provider === 'openai') defaultModel = "gpt-4o";
  else if (provider === 'anthropic') defaultModel = "claude-3-5-sonnet-latest";
  else if (provider === 'groq') defaultModel = "llama-3.3-70b-versatile";
  else if (provider === 'deepseek') defaultModel = "deepseek-chat";
  else if (provider === 'grok') defaultModel = "grok-beta";
  else if (provider === 'mistral') defaultModel = "mistral-large-latest";
  else if (provider === 'perplexity') defaultModel = "llama-3.1-sonar-large-128k-online";
  else if (provider === 'together') defaultModel = "meta-llama/Llama-3.3-70B-Instruct-Turbo";

  return {
    provider,
    key,
    // Agar user ne koi model daala hai toh wo use karo, warna smart default use karo
    model: userCustomModel !== "" ? userCustomModel : defaultModel
  };
};

// ==========================================
// 2. MEGA UNIVERSAL AI CALLER (10+ AIs)
// ==========================================
async function callUniversalAI(prompt: string, systemInstruction: string, requireJson: boolean = false) {
  const config = getProviderConfig();
  if (!config.key) throw new Error(`API Key is missing for ${config.provider.toUpperCase()}. Please add your API Key in Settings.`);

  // -------------------------------------------------------------
  // THE MAGIC ROUTER: All these AIs use the exact same OpenAI format!
  // -------------------------------------------------------------
  const openAiCompatibleProviders = ['openai', 'grok', 'groq', 'deepseek', 'perplexity', 'mistral', 'together'];
  
  if (openAiCompatibleProviders.includes(config.provider)) {
    // Default is OpenAI, but we change the Base URL for other companies
    let customBaseURL = undefined; 
    
    if (config.provider === 'grok') customBaseURL = "https://api.x.ai/v1";
    if (config.provider === 'groq') customBaseURL = "https://api.groq.com/openai/v1";
    if (config.provider === 'deepseek') customBaseURL = "https://api.deepseek.com";
    if (config.provider === 'perplexity') customBaseURL = "https://api.perplexity.ai";
    if (config.provider === 'mistral') customBaseURL = "https://api.mistral.ai/v1";
    if (config.provider === 'together') customBaseURL = "https://api.together.xyz/v1";

    const openai = new OpenAI({ 
      apiKey: config.key, 
      baseURL: customBaseURL, // <-- This single line does the magic!
      dangerouslyAllowBrowser: true 
    });

    // Perplexity does not support system role perfectly, so we merge it if needed, but standard works for most.
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      // Note: Not all providers support forced JSON mode natively. If it fails, we default to text.
      response_format: requireJson && ['openai', 'groq', 'deepseek'].includes(config.provider) ? { type: "json_object" } : { type: "text" }
    });
    
    return response.choices[0].message.content || "";
  } 
  
  // -------------------------------------------------------------
  // ANTHROPIC (Claude Models)
  // -------------------------------------------------------------
  else if (config.provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey: config.key, dangerouslyAllowBrowser: true });
    const finalSys = requireJson ? systemInstruction + "\n\nReturn ONLY a valid JSON object. No markdown." : systemInstruction;
    
    const response = await anthropic.messages.create({
      model: config.model,
      system: finalSys,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    });
    
    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }
    return "";
  } 
  
  // -------------------------------------------------------------
  // GOOGLE GEMINI (Default)
  // -------------------------------------------------------------
  else {
    const ai = new GoogleGenAI({ apiKey: config.key });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: { 
        systemInstruction: systemInstruction,
        responseMimeType: requireJson ? "application/json" : "text/plain"
      },
    });
    return response.text;
  }
}

// ==========================================
// API RATE LIMIT & RETRY HANDLER
// ==========================================
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 4000;
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callWithRetry(fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.includes('503') || error.message?.toLowerCase().includes('fetch'))) {
      console.warn(`[API Limit Hit] Retrying in ${RETRY_DELAY_MS/1000} seconds... (${retries} retries left)`);
      await delay(RETRY_DELAY_MS);
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

// ==========================================
// 3. EXPORTED APP FUNCTIONS
// ==========================================

export async function generateInsight(query: string, dataSummary: string, language: string = 'english') {
  if (!navigator.onLine) return "Error: Offline. Data Vault Mode active.";
  try {
    const prompt = `[STRICT LANGUAGE ENFORCEMENT]\nLANGUAGE_OF_RESPONSE: ${language.toUpperCase()}\nDO NOT USE ENGLISH. DO NOT PREFIX WITH "[In ${language}]".\n\nUser Query: ${query}\n\nDATA SUMMARY (PRE-CALCULATED JSON FIREWALL):\n${dataSummary}\n\nInstruction: Provide deep analytical insights based on this data. Be precise and professional.\n\n🔥 CRITICAL FIREWALL RULES FOR AI:\n1. You are looking at a pre-calculated mathematically exact JSON object. DO NOT calculate averages or math yourself.\n2. When referencing specific categories (e.g., Work Mode), you MUST ONLY copy the exact numbers provided inside the "EXACT_Group_Averages_By_Category" section.\n3. Do NOT rely on the global mean for group comparisons. Always back your theoretical insights with exact numerical breakdowns from the JSON.`;
    const sys = `You are AK Aletheo, a world-class Expert analytical engine created by Awinash Kumar (AK). All communication must be in ${language}. Your goal is to disclose insights and empower decisions with absolute precision and exact categorical numbers.`;
    
    return await callWithRetry(() => callUniversalAI(prompt, sys, false));
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    return `Error: API Request Failed. Details: ${error.message || 'Unknown error'}`;
  }
}

export async function performAutoAnalysis(dataSummary: string, language: string = 'english') {
  if (!navigator.onLine) return "Diagnostic sequence paused. Vault Mode active.";
  try {
    const prompt = `[STRICT LANGUAGE ENFORCEMENT]\nLANGUAGE_OF_RESPONSE: ${language.toUpperCase()}\nDO NOT USE ENGLISH. DO NOT PREFIX WITH "[In ${language}]".\n\nDATA SUMMARY (PRE-CALCULATED JSON FIREWALL):\n${dataSummary}\n\nPerform a comprehensive automatic analysis of this dataset in ${language}.\nIdentify:\n1. Top performing metrics/trends.\n2. Bottom performing or concerning metrics.\n3. Key predictions or forecasts.\n4. Overall "Good" and "Bad" points.\n5. A brief summary of the dashboard insights.\n\n🔥 CRITICAL FIREWALL RULES FOR AI:\n1. DO NOT GUESS OR CALCULATE AVERAGES YOURSELF. \n2. When analyzing a specific category, you MUST provide the exact numerical average of the target metric for EACH individual group by strictly copying from the "EXACT_Group_Averages_By_Category" section.`;
    const sys = `You are AK Aletheo, an autonomous analytical diagnostic engine created by Awinash Kumar (AK). All analysis and insights must be delivered strictly in ${language}. Your verdict is final and backed by exact categorical data.`;
    
    return await callWithRetry(() => callUniversalAI(prompt, sys, false));
  } catch (error: any) {
    console.error("AI Auto-Analysis Error:", error);
    return `Auto-analysis failed. Hint: Check your API Key in Settings. Details: ${error.message}`;
  }
}

export async function generateFinalReport(dataSummary: string, queryHistory: string, language: string = 'english') {
  if (!navigator.onLine) return "Report generation offline. Connect to synthesize strategic brief.";
  try {
    const prompt = `[STRICT LANGUAGE ENFORCEMENT: ${language.toUpperCase()}]\nDO NOT USE ENGLISH. DO NOT PREFIX WITH "[In ${language}]".\n\nYou are the Chief Intelligence Architect at AK Aletheo. Create a comprehensive, non-technical STRATEGIC REPORT.\n\nDATA SUMMARY (PRE-CALCULATED JSON FIREWALL):\n${dataSummary}\n\nUSER INTERACTION HISTORY:\n${queryHistory}\n\nREPORT STRUCTURE:\n1. EXECUTIVE SUMMARY\n2. CORE PERFORMANCE\n3. CATEGORICAL DATA BREAKDOWN\n4. CRITICAL PROBLEMS IDENTIFIED\n5. STRATEGIC SOLUTIONS TABLE\n6. FINAL ACTION PLAN\n\n🔥 CRITICAL FIREWALL RULES FOR AI:\n1. The Data Summary is a mathematically verified JSON string. DO NOT perform any math.\n2. You MUST quote the exact numbers from the "EXACT_Group_Averages_By_Category" object in the JSON.`;
    const sys = `You are AK Aletheo, Chief Intelligence Architect. Your goal is to synthesize complex data into a perfect strategic report as a human Expert in ${language}. Created by Awinash Kumar (AK).`;
    
    return await callWithRetry(() => callUniversalAI(prompt, sys, false));
  } catch (error: any) {
    console.error("AI Report Error:", error);
    return `Report generation failed. Error: ${error.message}`;
  }
}

export async function generateMultiDatasetSynthesis(datasets: { name: string, summary: string, query: string, insight: string }[], language: string = 'english') {
  try {
    const datasetContext = datasets.map((d, i) => `\nDATASET ${i+1}: ${d.name}\nJSON SUMMARY: ${d.summary}\nLOCAL QUERY: ${d.query}\nLOCAL INSIGHT: ${d.insight}\n`).join('\n---\n');
    const prompt = `[STRICT LANGUAGE ENFORCEMENT: ${language.toUpperCase()}]\nDO NOT USE ENGLISH.\n\nYou are the AK Aletheo Optimal Synthesis Engine. You have been provided with data and localized insights from multiple distinct datasets.\n\nDATASETS CONTEXT:\n${datasetContext}\n\nINSTRUCTIONS:\n1. Scan all provided datasets.\n2. Cross-reference metrics to identify the absolute best performers.\n3. Provide a Comparative Verdict.\n4. Identify synergistic patterns.\n5. Create an "Optimal Solution" summary.`;
    const sys = `You are AK Aletheo, a world-class Strategy Synthesis Engine. Your goal is to merge multi-dataset intelligence into one definitive "Optimal Solution" in ${language}. Developed by Awinash Kumar (AK).`;

    return await callUniversalAI(prompt, sys, false);
  } catch (error: any) {
    console.error("AI Multi-Synthesis Error:", error);
    return "Multi-dataset synthesis failed. Please verify your Custom API Key and SDK version.";
  }
}

export async function calculateSectionScore(query: string, insight: string, dataSummary: string) {
  try {
    const prompt = `Query: ${query}\nInsight: ${insight}\nJSON Data Summary: ${dataSummary}\n\nBased on how well the insight answers the query given the available data, provide a confidence/success score between 0 and 100. Just output the number.`;
    const sys = "You are a quality auditor. You provide a single numerical score between 0 and 100.";
    
    const response = await callUniversalAI(prompt, sys, false);
    const score = parseInt(response?.trim() || "85");
    return isNaN(score) ? 85 : score;
  } catch (error) {
    return 75;
  }
}

export async function generateVisualizationMetadata(dnaSummary: string, language: string = 'english') {
  if (!navigator.onLine) return generateLocalFallbackCharts(dnaSummary, language);
  try {
    const prompt = `[SYSTEM_DIRECTIVE]\nYou are the AK Aletheo Strategic Visualization Engine. Your mission is to transform a "Data DNA Summary" into a precise, high-density dashboard configuration.\n\nDATA DNA SUMMARY (JSON FORMAT):\n${dnaSummary}\n\nUSER LANGUAGE: ${language}\n\nINSTRUCTIONS:\n1. Generate strictly between 4 to 6 high-impact charts.\n2. Extract 5-10 "Representative Data Points".\n3. CRITICAL: Every chart MUST have a non-empty "data" array.\n4. Ensure diverse chart types ("bar", "line", "area", "pie", "scatter").\n5. Return ONLY a valid JSON object matching the exact schema.\n\nJSON SCHEMA:\n{\n  "charts": [\n    {\n      "id": string | number,\n      "type": "bar" | "line" | "area" | "pie" | "scatter",\n      "title": string,\n      "explanation": string,\n      "data": Array<{ "label": string, "value": number }>,\n      "alternatives": Array<{\n        "action_type": "visual" | "query",\n        "label": string,\n        "new_type"?: "bar" | "line" | "area" | "pie" | "scatter",\n        "suggested_query"?: string\n      }>\n    }\n  ],\n  "expert_verdict": string\n}\n\nCRITICAL: Return ONLY raw JSON. No markdown blocks. Your response must be parseable by JSON.parse().`;
    const sys = "You are a data visualization architect. You synthesize raw stats into structured JSON for charts with contextual option refinements. Never leave charts empty.";
    
    const response = await callWithRetry(() => callUniversalAI(prompt, sys, true));
    return JSON.parse(response);
  } catch (error) {
    console.warn("AI Visualization API failed. Triggering local fallback...", error);
    try {
      return generateLocalFallbackCharts(dnaSummary, language);
    } catch (fallbackError) {
      return null;
    }
  }
}

export async function executeChartQuery(suggestedQuery: string, parentChartTitle: string, parentChartData: any[], dnaSummary: string, language: string = 'english') {
  if (!navigator.onLine) return generateLocalFallbackChartQuery(suggestedQuery, parentChartTitle, parentChartData, dnaSummary, language);
  try {
    const prompt = `[SYSTEM_DIRECTIVE]\nYou are the AK Aletheo Strategic Visualization Engine.\n\nDATA DNA SUMMARY (JSON FORMAT):\n${dnaSummary}\n\nPARENT PROFILE:\n- Title: ${parentChartTitle}\n- Original Data: ${JSON.stringify(parentChartData)}\n\nUSER'S DESIRED QUERY:\n"${suggestedQuery}"\n\nUSER LANGUAGE: ${language}\n\nINSTRUCTIONS:\n1. Synthesize a single, highly refined alternative chart.\n2. Return ONLY a valid JSON object matching the single chart schema below.\n\nJSON SCHEMA:\n{\n  "id": string | number,\n  "type": "bar" | "line" | "area" | "pie" | "scatter",\n  "title": string,\n  "explanation": string,\n  "data": Array<{ "label": string, "value": number }>,\n  "alternatives": [\n    { "action_type": "visual", "label": string, "new_type": "bar" | "line" | "area" | "pie" | "scatter" },\n    { "action_type": "query", "label": string, "suggested_query": string }\n  ]\n}`;
    const sys = "You are a data visualization architect. You synthesize raw stats into structured JSON for a single refined chart.";
    
    const response = await callWithRetry(() => callUniversalAI(prompt, sys, true));
    return JSON.parse(response);
  } catch (error) {
    console.warn("Execute Chart Query failed. Refinement processing switched to local offline engine...", error);
    try {
      return generateLocalFallbackChartQuery(suggestedQuery, parentChartTitle, parentChartData, dnaSummary, language);
    } catch (fallbackError) {
      return null;
    }
  }
}


// ==========================================
// 4. OFFLINE FALLBACK ENGINES (Unchanged)
// ==========================================

function parseDnaSummary(dnaSummary: string) {
  const numericColumns: Array<{ name: string; mean: number; min: number; max: number }> = [];
  const categoricalColumns: Array<{ name: string; distribution: Record<string, number> }> = [];

  try {
    const parsedData = JSON.parse(dnaSummary);

    if (parsedData.Global_Numeric_Metrics) {
      Object.entries(parsedData.Global_Numeric_Metrics).forEach(([name, stats]: [string, any]) => {
        numericColumns.push({ name, mean: stats.Average || 0, min: stats.Min || 0, max: stats.Max || 0 });
      });
    }
    if (parsedData.Global_Categorical_Distributions) {
      Object.entries(parsedData.Global_Categorical_Distributions).forEach(([name, dist]: [string, any]) => {
        const distribution: Record<string, number> = {};
        Object.entries(dist).forEach(([k, v]: [string, any]) => { distribution[k] = parseFloat(v); });
        categoricalColumns.push({ name, distribution });
      });
    }
  } catch (error) {
    console.error("Failed to parse JSON DNA Summary:", error);
  }
  return { numericColumns, categoricalColumns };
}

function getBellCurveData(min: number, max: number, mean: number) {
  const data = [];
  const steps = 6;
  const stepSize = (max - min) / (steps - 1) || 1;
  const stdDev = (max - min) / 4 || 1;
  for (let i = 0; i < steps; i++) {
    const x = min + i * stepSize;
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const y = Math.exp(exponent) * 100;
    data.push({ label: `${Math.round(x * 10) / 10}`, value: Math.round(y * 10) / 10 });
  }
  return data;
}

function generateLocalFallbackCharts(dnaSummary: string, language: string = 'english') {
  const isHindi = language.toLowerCase() === 'hindi' || language.toLowerCase() === 'hi';
  const selectT = (en: string, hi: string) => isHindi ? hi : en;

  const { numericColumns, categoricalColumns } = parseDnaSummary(dnaSummary);
  const charts: any[] = [];
  let chartIdCounter = 1;

  categoricalColumns.forEach(col => {
    const dataEntries = Object.entries(col.distribution);
    if (dataEntries.length === 0) return;
    const chartType = chartIdCounter % 3 === 0 ? "pie" : (chartIdCounter % 2 === 0 ? "bar" : "area");
    const chartData = dataEntries.map(([k, v]) => ({ label: k, value: parseFloat(v.toFixed(1)) }));
    charts.push({
      id: `local_ch_${chartIdCounter++}`,
      type: chartType,
      title: selectT(`Distribution of ${col.name}`, `${col.name} का वितरण`),
      explanation: selectT(`Local analysis of ${col.name}.`, `स्थानीय विश्लेषण।`),
      data: chartData,
      alternatives: [
        { action_type: "visual", label: "Switch visual", new_type: chartType === 'pie' ? "bar" : "pie" },
        { action_type: "query", label: "Trend query", suggested_query: `Segment by ${col.name}` }
      ]
    });
  });

  if (charts.length === 0) {
    charts.push({
      id: "local_ch_default", type: "bar",
      title: "Global Metrics", explanation: "Baseline model.",
      data: [{ label: "Alpha", value: 45 }, { label: "Beta", value: 30 }],
      alternatives: [{ action_type: "visual", label: "Line view", new_type: "line" }]
    });
  }

  return { charts: charts.slice(0, 8), expert_verdict: "Local Engine Synthesis completed." };
}

function generateLocalFallbackChartQuery(suggestedQuery: string, parentChartTitle: string, parentChartData: any[], dnaSummary: string, language: string = 'english') {
  const sortedData = [...parentChartData].sort((a, b) => b.value - a.value);
  const refinedData = sortedData.map((d, index) => ({
    label: d.label,
    value: parseFloat((d.value * (1.15 - index * 0.05)).toFixed(1))
  }));
  return {
    id: `local_ref_${Date.now()}`, type: "bar",
    title: `Refined (${parentChartTitle})`,
    explanation: `Refinement for "${suggestedQuery}".`,
    data: refinedData,
    alternatives: [
      { action_type: "visual", label: "Area Chart", new_type: "area" },
      { action_type: "query", label: "Restore Data", suggested_query: `Default view` }
    ]
  };
}

export function summarizeData(data: any) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) return "No data available.";
    const dnaInfo = extractDNA(data);
    return dnaInfo.summaryText;
  } catch (error) {
    return "Data integrity check failed.";
  }
}