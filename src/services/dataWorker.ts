import { StreamingDNAExtractor } from '../lib/dnaExtractor';
import Papa from 'papaparse';

// Systematic sampling for massive datasets
const systematicSample = (data: any[], targetSize: number = 1000) => {
  if (!data || data.length <= targetSize) return data;
  const step = Math.floor(data.length / targetSize);
  const result = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
    if (result.length >= targetSize) break;
  }
  return result;
};

// 🌟 NAYA ENGINE 1: Semantic Header Normalizer (Schema Matching)
// Ye alag-alag columns (jaise staff_no aur emp_id) ko ek same naam dega
const normalizeHeader = (header: string): string => {
  const h = header.toLowerCase().trim();
  
  if (h.match(/^(emp.*id|employee.*number|staff.*no|id)$/)) return 'Employee_ID';
  if (h.match(/^(salary|compensation|pay|wage.*)$/)) return 'Salary';
  if (h.match(/^(role|title|job.*title|designation|position)$/)) return 'Job_Role';
  if (h.match(/^(dept|department|team|business.*unit)$/)) return 'Department';
  if (h.match(/^(hours|work.*hours|hours.*week|time.*logged)$/)) return 'Hours_Per_Week';
  if (h.match(/^(stress|burnout|mental.*health.*score)$/)) return 'Stress_Score';
  if (h.match(/^(wlb|work.*life.*balance)$/)) return 'Work_Life_Balance_Rating';
  if (h.match(/^(loc|location|region|country|city)$/)) return 'Region';
  
  // Agar list me nahi hai, toh spaces hata kar clean naam dega
  return header.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
};

// 🌟 NAYA ENGINE 2: Data Type Checker (For "No Header" condition)
const isDataRow = (headers: string[]) => {
  let dataLikeCount = 0;
  headers.forEach(h => {
    // Agar header ka naam number ya date lag raha hai
    if (!isNaN(Number(h)) || !isNaN(Date.parse(h))) dataLikeCount++;
  });
  // Agar 50% se zyada headers numbers/dates hain, toh matlab heading hai hi nahi!
  return dataLikeCount > (headers.length / 2);
};

self.onmessage = async (e) => {
  const { type, data, filters, headers, targetSize = 1000, taskId, file } = e.data;

  if (type === 'PARSE_FILE_STREAMING') {
    let extractor: StreamingDNAExtractor | null = null;
    let originalHeaders: string[] = [];
    let normalizedHeaders: string[] = [];
    let hasNoHeader = false;
    const sample: any[] = [];
    let rowCount = 0;

    Papa.parse(file as File, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      chunk: (results) => {
        if (!originalHeaders.length && results.meta.fields) {
          originalHeaders = results.meta.fields;
          
          // 1. Check if file has NO HEADERS
          hasNoHeader = isDataRow(originalHeaders);
          
          if (hasNoHeader) {
            // Khud se dummy headers generate karo
            normalizedHeaders = originalHeaders.map((_, idx) => `Feature_${idx + 1}`);
          } else {
            // 2. Semantic Mapping se columns ko unify karo
            normalizedHeaders = originalHeaders.map(normalizeHeader);
          }
          
          extractor = new StreamingDNAExtractor(normalizedHeaders);
        }

        results.data.forEach((row: any) => {
          rowCount++;
          const normalizedRow: any = {};
          
          // Purane ajeeb columns ko naye clean columns me map karna
          originalHeaders.forEach((orig, i) => {
             normalizedRow[normalizedHeaders[i]] = row[orig];
          });
          
          extractor?.processRow(normalizedRow);
          if (sample.length < targetSize) {
            sample.push(normalizedRow);
          }
        });
      },
      complete: () => {
        const dna = extractor?.getDNA();
        self.postMessage({
          type: 'PARSE_COMPLETE',
          payload: {
            dna: { summaryText: dna?.summaryText, rowCount: dna?.rowCount }, 
            headers: normalizedHeaders, // AI aur Dashboard ko unified headers bheje jayenge
            sample: sample, 
            rowCount
          },
          taskId
        });
      },
      error: (error) => {
        self.postMessage({ type: 'ERROR', error: error.message, taskId });
      }
    });
    return;
  }

  if (type === 'PROCESS_DATA_OFF_THREAD') {
    const filtered = data.filter((row: any) => {
      if (!filters) return true;
      return Object.entries(filters).every(([col, selectedValues]) => {
        const values = selectedValues as string[];
        if (!values || values.length === 0) return true;
        return values.includes(String(row[col]));
      });
    });

    const extractor = new StreamingDNAExtractor(headers);
    filtered.forEach((row: any) => extractor.processRow(row));
    const dna = extractor.getDNA();
    const sampled = systematicSample(filtered, targetSize);

    self.postMessage({ 
      type: 'PROCESSING_COMPLETE', 
      payload: { 
        sampled, 
        totalFiltered: filtered.length,
        dna 
      },
      taskId
    });
  }
};
