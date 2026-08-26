import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Globe, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { saveAppsScriptUrl } from '../config';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onUrlUpdate: (newUrl: string) => void;
  onTestConnection: (testUrl: string) => Promise<boolean>;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onUrlUpdate,
  onTestConnection,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentUrl);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const trimmed = urlInput.trim();
    saveAppsScriptUrl(trimmed);
    onUrlUpdate(trimmed);
    
    const ok = await onTestConnection(trimmed);
    setTestResult(ok ? 'success' : 'error');
    setIsTesting(false);
  };

  const sampleAppsScriptCode = `/**
 * GOOGLE APPS SCRIPT: NSE RSI & SHEET DATA API (code.js)
 * Paste into: Extensions > Apps Script in Google Sheets
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    if (!data || data.length === 0) {
      return createJsonResponse({ status: "error", message: "No data", data: [] });
    }

    // Locate header row containing 'NSE Code', 'CMP', 'RSI'
    let headerRowIndex = 1;
    let nseCol = 0, cmpCol = 1, rsiCol = 2;

    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(c => String(c || "").toLowerCase().trim());
      if (row.some(c => c.includes("nse code") || c.includes("symbol"))) {
        headerRowIndex = i;
        for (let j = 0; j < row.length; j++) {
          if (row[j].includes("nse code") || row[j].includes("symbol")) nseCol = j;
          else if (row[j].includes("cmp") || row[j].includes("price")) cmpCol = j;
          else if (row[j].includes("rsi")) rsiCol = j;
        }
        break;
      }
    }

    // Parse records
    const records = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const code = String(data[i][nseCol] || "").trim();
      const cmp = parseFloat(String(data[i][cmpCol]).replace(/[^0-9.-]+/g, ""));
      const rsi = parseFloat(String(data[i][rsiCol]).replace(/[^0-9.-]+/g, ""));
      if (code && !isNaN(rsi)) {
        records.push({ code, cmp: isNaN(cmp) ? 0 : cmp, rsi });
      }
    }

    const sorted = [...records].sort((a, b) => a.rsi - b.rsi);

    return createJsonResponse({
      status: "success",
      lastUpdate: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      totalCount: records.length,
      topFiveLowestRsi: sorted.slice(0, 5),
      items: records
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function createJsonResponse(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Apps Script Integration (code.js)
              </h3>
              <p className="text-xs text-slate-500">
                Connect your live Google Sheet using a Web App Deployment URL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Deployed Web App URL Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Google Apps Script Web App Deployment URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
              <button
                onClick={handleSaveAndTest}
                disabled={isTesting || !urlInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isTesting ? 'Testing...' : 'Save & Connect'}
              </button>
            </div>

            {testResult === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Successfully connected to Google Apps Script live Web App!</span>
              </div>
            )}

            {testResult === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Could not fetch from URL. Using pre-loaded sheet snapshot. Ensure &quot;Who has access&quot; is set to &quot;Anyone&quot; in Apps Script deployment.</span>
              </div>
            )}
          </div>

          {/* 4-Step Instructions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              1-Minute Setup in Google Sheets
            </h4>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside font-normal">
              <li>Open your Google Sheet containing the NSE ETF / Stock data.</li>
              <li>Click <strong>Extensions &gt; Apps Script</strong> from the top menu.</li>
              <li>Paste the code from <code className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[11px]">code.js</code> below.</li>
              <li>Click <strong>Deploy &gt; New deployment &gt; Select type: Web app</strong>.</li>
              <li>Set <strong>Execute as: &quot;Me&quot;</strong> and <strong>Who has access: &quot;Anyone&quot;</strong>.</li>
              <li>Copy the generated <strong>Web app URL</strong> and paste it above!</li>
            </ol>
          </div>

          {/* Script Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono">code.js (Google Apps Script)</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy code.js</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-56 border border-slate-800">
              <code>{sampleAppsScriptCode}</code>
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
