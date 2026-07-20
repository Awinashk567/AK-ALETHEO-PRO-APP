export interface DNAStats {
  mean: number;
  cleanMean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  nullCount: number;
  outliersRemoved: number;
}

export interface DNAColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'unknown';
  stats?: DNAStats;
  distribution?: Record<string, number>;
  anomalies?: any[];
}

export interface DataDNA {
  rowCount: number;
  columnCount: number;
  columns: DNAColumn[];
  anomaliesCount: number;
  topOutliers: any[];
  summaryText: string;
}

export function extractDNA(data: any[]): DataDNA {
  if (!data || data.length === 0) {
    return { rowCount: 0, columnCount: 0, columns: [], anomaliesCount: 0, topOutliers: [], summaryText: "{}" };
  }
  const extractor = new StreamingDNAExtractor(Object.keys(data[0]));
  data.forEach(row => extractor.processRow(row));
  return extractor.getDNA();
}

export class StreamingDNAExtractor {
  private rowCount = 0;
  private headers: string[] = [];
  private numericStats: Record<string, { sum: number, sumSq: number, min: number, max: number, count: number, values: number[] }> = {};
  private categoricalCounts: Record<string, Record<string, number>> = {};
  
  // EXACT MATH ENGINE (Just like Pandas groupby.mean())
  private crossStats: Record<string, Record<string, Record<string, { sum: number, count: number }>>> = {};
  private corrStats: Record<string, Record<string, { sumX: number, sumY: number, sumXY: number, sumX2: number, sumY2: number, count: number }>> = {};

  constructor(headers: string[]) {
    this.headers = headers;
    headers.forEach(h => {
      this.numericStats[h] = { sum: 0, sumSq: 0, min: Infinity, max: -Infinity, count: 0, values: [] };
      this.categoricalCounts[h] = {};
    });
  }

  processRow(row: any) {
    this.rowCount++;
    const rowNums: Record<string, number> = {};
    const rowCats: Record<string, string> = {};

    // 1. CLEANING & IMPUTATION
    this.headers.forEach(h => {
      let val = row[h];
      if (val === null || val === undefined || val === '' || String(val).trim().toUpperCase() === 'NA' || String(val).trim().toUpperCase() === 'NAN') {
        val = "Unspecified/None"; 
      }

      const num = Number(val);
      if (val !== "Unspecified/None" && !isNaN(num) && typeof val !== 'boolean') {
        rowNums[h] = num;
        const stats = this.numericStats[h];
        stats.sum += num;
        stats.sumSq += num * num;
        if (num < stats.min) stats.min = num;
        if (num > stats.max) stats.max = num;
        stats.count++;
        if(stats.values.length < 2000) stats.values.push(num); 
      } else {
        const catStr = String(val).slice(0, 50);
        rowCats[h] = catStr;
        const counts = this.categoricalCounts[h];
        if (Object.keys(counts).length < 2000) {
          counts[catStr] = (counts[catStr] || 0) + 1;
        } else {
          counts['__AK_HIGH_CARDINALITY__'] = (counts['__AK_HIGH_CARDINALITY__'] || 0) + 1;
        }
      }
    });

    // 2. CORRELATIONS
    const numKeys = Object.keys(rowNums);
    for(let i = 0; i < numKeys.length; i++) {
      for(let j = i + 1; j < numKeys.length; j++) {
        const k1 = numKeys[i];
        const k2 = numKeys[j];
        if (!this.corrStats[k1]) this.corrStats[k1] = {};
        if (!this.corrStats[k1][k2]) {
          this.corrStats[k1][k2] = { sumX: 0, sumY: 0, sumXY: 0, sumX2: 0, sumY2: 0, count: 0 };
        }
        const stat = this.corrStats[k1][k2];
        const x = rowNums[k1];
        const y = rowNums[k2];
        
        stat.sumX += x;
        stat.sumY += y;
        stat.sumXY += (x * y);
        stat.sumX2 += (x * x);
        stat.sumY2 += (y * y);
        stat.count++;
      }
    }

    // 3. PANDAS-STYLE EXACT GROUP AGGREGATIONS (No Limits)
    Object.entries(rowCats).forEach(([catHeader, catVal]) => {
      if (Object.keys(this.categoricalCounts[catHeader]).length <= 25 && catVal !== '__AK_HIGH_CARDINALITY__') {
        if (!this.crossStats[catHeader]) this.crossStats[catHeader] = {};
        if (!this.crossStats[catHeader][catVal]) this.crossStats[catHeader][catVal] = {};

        Object.entries(rowNums).forEach(([numHeader, numVal]) => {
          if (!this.crossStats[catHeader][catVal][numHeader]) {
            this.crossStats[catHeader][catVal][numHeader] = { sum: 0, count: 0 };
          }
          // Yahan hum exactly saare rows ka sum aur count le rahe hain
          this.crossStats[catHeader][catVal][numHeader].sum += numVal;
          this.crossStats[catHeader][catVal][numHeader].count += 1;
        });
      }
    });
  }

  getDNA(): DataDNA {
    const columns: DNAColumn[] = [];
    
    // Yahan hum JSON format banayenge jo LLM kabhi galat nahi padh sakta
    const firewallJSON: any = {
      Dataset_Info: { Total_Rows: this.rowCount, Features_Count: this.headers.length },
      Global_Numeric_Metrics: {},
      Global_Categorical_Distributions: {},
      Predictive_Correlations: [],
      EXACT_Group_Averages_By_Category: {}
    };

    this.headers.forEach(h => {
      const stats = this.numericStats[h];
      if (stats.count > 0 && (stats.count > this.rowCount * 0.1 || stats.values.length > 50)) {
        const mean = stats.sum / stats.count;
        firewallJSON.Global_Numeric_Metrics[h] = {
          Average: Number(mean.toFixed(2)),
          Max: stats.max,
          Min: stats.min
        };
        columns.push({ name: h, type: 'numeric', stats: { mean, cleanMean: mean, median: 0, stdDev: 0, min: stats.min, max: stats.max, nullCount: this.rowCount - stats.count, outliersRemoved: 0 }});
      } else {
        const counts = this.categoricalCounts[h];
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        
        // Save percentages to JSON
        const topDist: Record<string, string> = {};
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([k, v]) => {
            topDist[k] = `${((v / (total || 1)) * 100).toFixed(1)}%`;
          });
          
        firewallJSON.Global_Categorical_Distributions[h] = topDist;
        columns.push({ name: h, type: 'categorical' });
      }
    });

    Object.entries(this.corrStats).forEach(([k1, targets]) => {
      Object.entries(targets).forEach(([k2, stat]) => {
        if(stat.count > 10) {
          const numerator = (stat.count * stat.sumXY) - (stat.sumX * stat.sumY);
          const denomX = (stat.count * stat.sumX2) - (stat.sumX * stat.sumX);
          const denomY = (stat.count * stat.sumY2) - (stat.sumY * stat.sumY);
          if(denomX > 0 && denomY > 0) {
            const r = numerator / Math.sqrt(denomX * denomY);
            if (Math.abs(r) >= 0.5) {
              firewallJSON.Predictive_Correlations.push(`[${k1}] & [${k2}] = ${r.toFixed(2)}`);
            }
          }
        }
      });
    });

    // PANDAS-STYLE GROUP BY (Strict Average calculation)
    Object.entries(this.crossStats).forEach(([catHeader, catVals]) => {
      firewallJSON.EXACT_Group_Averages_By_Category[catHeader] = {};
      Object.entries(catVals).forEach(([catName, numCols]) => {
        firewallJSON.EXACT_Group_Averages_By_Category[catHeader][catName] = {};
        Object.entries(numCols)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 4) // Keep it focused on top 4 numerical metrics per group
          .forEach(([numHeader, data]) => {
             const exactAverage = data.sum / data.count;
             firewallJSON.EXACT_Group_Averages_By_Category[catHeader][catName][numHeader] = Number(exactAverage.toFixed(2));
          });
      });
    });

    return { 
      rowCount: this.rowCount, 
      columnCount: this.headers.length, 
      columns, 
      anomaliesCount: 0, 
      topOutliers: [], 
      summaryText: JSON.stringify(firewallJSON, null, 2) // 🔥 BOOM! STRICT JSON STRING!
    };
  }
}
