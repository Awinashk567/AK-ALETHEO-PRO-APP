/**
 * Global Print Utility for AK Aletheo
 * Provides consistent, single-source-of-truth print logic across all modules.
 */

export interface PrintOptions {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  extraStyles?: string;
}

/**
 * Triggers standard system-wide full page print helper with logging
 */
export function printPage(): void {
  console.log("[Print System] Standard page print initiated.");
  try {
    window.focus();
    window.print();
    console.log("[Print System] Standard page print completed.");
  } catch (error) {
    console.error("[Print System] Standard page print failed:", error);
    alert("Printers became unresponsive or blocked. Please check your browser settings.");
  }
}

/**
 * Opens a clean, dedicated print-preview pop-up window and prints the specified HTML content 
 * using a refined high-contrast layout.
 */
export function printHtmlContent(htmlContent: string, options: PrintOptions = {}): void {
  const {
    title = "AK Aletheo Document",
    subtitle = "Advanced Neural Strategy Hub | Master Print Service",
    showHeader = true,
    extraStyles = ""
  } = options;

  console.log(`[Print System] Segmented HTML print initiated for: ${title}`);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error("[Print System] Pop-up window open failed. Pop-up blocker might be active.");
    alert("Could not open print window. Please disable pop-up blockers.");
    return;
  }

  // Extract all stylesheets and style tags from the current main document to replicate perfect styles
  const mainDocStyles = typeof document !== 'undefined'
    ? Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n')
    : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        ${mainDocStyles}
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            background: white !important; 
            color: #0f172a !important; 
            padding: 40px !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .pdf-only { display: block !important; }
          .no-print { display: none !important; }
          
          @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; }
          }
          
          /* --- Master Light Theme Print Overrides --- */
          
          /* 1. Page container and grids print resets */
          .print-container {
            background: white !important;
            background-color: white !important;
            background-image: none !important;
            color: #0f172a !important;
          }
          
          .print-container div, 
          .print-container section, 
          .print-container article {
            background-color: white !important;
            background-image: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border-color: #cbd5e1 !important;
          }

          /* 2. Structured Bento Grid Cards Style */
          .print-container .chart-card {
            background-color: #f8fafc !important;
            background-image: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 1rem !important;
            overflow: hidden !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }

          /* Bottom findings description section in each card */
          .print-container .chart-card > div:last-child {
            background-color: #f1f5f9 !important;
            background-image: none !important;
            border-top: 1px solid #cbd5e1 !important;
            color: #1e293b !important;
          }

          /* 3. Special banner (Strategic Expert Verdict) style */
          .print-container .from-indigo-500\/10 {
            background-color: #f0f4ff !important;
            background-image: none !important;
            border: 1px solid #c7d2fe !important;
            border-radius: 1rem !important;
          }

          .print-container .from-indigo-500\/10 * {
            color: #1e1b4b !important;
          }

          /* 4. Text Typography Readability */
          .print-container h1, 
          .print-container h2, 
          .print-container h3, 
          .print-container h4, 
          .print-container h5, 
          .print-container h6 {
            color: #0f172a !important;
            font-weight: 700 !important;
          }

          .print-container p, 
          .print-container span, 
          .print-container li, 
          .print-container label {
            color: #1e293b !important;
          }

          /* AI-Verified Badge Accents */
          .print-container .text-indigo-400 {
            color: #4f46e5 !important;
            background-color: #e0e7ff !important;
            border-color: #c7d2fe !important;
          }

          /* 5. Master Ledger Table Styling for Prints */
          .print-container table {
            background-color: white !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 1rem !important;
          }

          .print-container th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
          }

          .print-container td {
            color: #334155 !important;
            border: 1px solid #e2e8f0 !important;
            padding: 8px 12px !important;
            background-color: white !important;
          }

          .print-container tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }

          /* 6. Recharts SVG Ticks and Scale Formatting for Crisp Paper Contrast */
          .recharts-text, 
          .recharts-cartesian-axis-tick-value, 
          .recharts-legend-item-text,
          tspan, 
          text {
            fill: #334155 !important;
            font-weight: 500 !important;
            font-size: 10px !important;
          }

          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical line {
            stroke: #e2e8f0 !important;
            stroke-opacity: 1 !important;
            stroke-dasharray: 3 3 !important;
          }

          img { max-width: 100%; }
          .markdown-body { color: black !important; }
          
          .print-header { 
            border-bottom: 4px solid black; 
            padding-bottom: 15px; 
            margin-bottom: 30px; 
          }

          ${extraStyles}
        </style>
      </head>
      <body>
        ${showHeader ? `
        <div class="print-header">
          <h1 class="text-3xl text-black">AK ALETHEO</h1>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">${subtitle}</p>
        </div>
        ` : ''}
        <div class="print-container">
          ${htmlContent}
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
  console.log("[Print System] Segmented HTML print successfully streamed to window.");
}
