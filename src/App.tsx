/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NseAsset } from './types';
import { getInitialEnrichedData, INITIAL_LAST_UPDATE } from './data/initialData';
import { getStoredAppsScriptUrl, saveAppsScriptUrl, getStoredGoogleSheetUrl, saveGoogleSheetUrl, isValidSheetUrl } from './config';
import { fetchSheetDataFromAppsScript } from './services/appsScriptService';
import { Header } from './components/Header';
import { TopFiveRsiCards } from './components/TopFiveRsiCards';
import { SortableRsiTable } from './components/SortableRsiTable';
import { ScreenerSummary } from './components/ScreenerSummary';
import { AppsScriptModal } from './components/AppsScriptModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { Sparkles, Info, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [assets, setAssets] = useState<NseAsset[]>(() => getInitialEnrichedData());
  const [lastUpdate, setLastUpdate] = useState<string>(INITIAL_LAST_UPDATE);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => getStoredAppsScriptUrl());
  const [sheetUrl, setSheetUrl] = useState<string>(() => getStoredGoogleSheetUrl());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [selectedSearch, setSelectedSearch] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Top 5 assets ranked by lowest RSI
  const topFiveLowest = React.useMemo(() => {
    const sorted = [...assets].sort((a, b) => a.rsi - b.rsi);
    return sorted.slice(0, 5);
  }, [assets]);

  const oversoldBelow40Count = React.useMemo(() => {
    return assets.filter((a) => a.rsi <= 40).length;
  }, [assets]);

  // Fetch / Refresh Data function
  const loadData = useCallback(async (urlToUse?: string) => {
    const targetUrl = urlToUse !== undefined ? urlToUse : appsScriptUrl;
    setIsLoading(true);
    try {
      const result = await fetchSheetDataFromAppsScript(targetUrl);
      if (result.success && result.data && result.data.length > 0) {
        setAssets(result.data);
        setLastUpdate(result.lastUpdate);
        setIsLive(result.source === 'live');
        if (result.sheetUrl && isValidSheetUrl(result.sheetUrl) && !getStoredGoogleSheetUrl()) {
          setSheetUrl(result.sheetUrl);
          saveGoogleSheetUrl(result.sheetUrl);
        }
        if (result.source === 'live') {
          setNotification({
            message: `Updated live data (${result.data.length} NSE assets) via Google Apps Script`,
            type: 'success',
          });
        }
      } else {
        setIsLive(false);
      }
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [appsScriptUrl]);

  // Initial load
  useEffect(() => {
    if (appsScriptUrl && !appsScriptUrl.includes('AKfycbz_SAMPLE_DEPLOYMENT_ID')) {
      loadData(appsScriptUrl);
    }
  }, []); // Run on mount

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Test connection handler for AppsScriptModal
  const handleTestConnection = async (testUrl: string): Promise<boolean> => {
    try {
      const res = await fetchSheetDataFromAppsScript(testUrl);
      if (res.success && res.source === 'live') {
        setAssets(res.data);
        setLastUpdate(res.lastUpdate);
        setIsLive(true);
        setAppsScriptUrl(testUrl);
        saveAppsScriptUrl(testUrl);
        if (res.sheetUrl && isValidSheetUrl(res.sheetUrl) && !getStoredGoogleSheetUrl()) {
          setSheetUrl(res.sheetUrl);
          saveGoogleSheetUrl(res.sheetUrl);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCardSelect = (code: string) => {
    setSelectedSearch(code);
    // Smooth scroll down to table
    const el = document.getElementById('nse-rsi-table');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        lastUpdate={lastUpdate}
        isLive={isLive}
        isLoading={isLoading}
        onRefresh={() => loadData()}
        onOpenAppsScriptModal={() => setIsModalOpen(true)}
        sheetUrl={sheetUrl}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        totalCount={assets.length}
        oversoldBelow40Count={oversoldBelow40Count}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Alert Notification */}
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs transition-all">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Informational Hero Card for Quick Apps Script Connect */}
        {!isLive && (
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm ring-1 ring-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>NSE Sheet Data Loaded</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    70+ ETFs &amp; Equities
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Displaying top lowest RSI assets from the provided Google Sheet dataset. Connect your deployed Google Apps Script (<code className="text-emerald-300 font-mono">code.js</code>) for automated live sync.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shrink-0 shadow-2xs"
            >
              Deploy &amp; Connect code.js
            </button>
          </div>
        )}

        {/* 1. TOP 5 LOWEST RSI SPOTLIGHT CARDS */}
        <section aria-labelledby="top-five-heading">
          <TopFiveRsiCards
            topAssets={topFiveLowest}
            onSelectCode={handleCardSelect}
          />
        </section>

        {/* 2. SUMMARY METRICS BREAKDOWN */}
        <section aria-label="Screener Summary Stats">
          <ScreenerSummary assets={assets} />
        </section>

        {/* 3. SORTABLE RSI TABLE COMPONENT */}
        <section aria-labelledby="table-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="table-heading" className="text-base font-bold text-slate-900 tracking-tight">
              Interactive Sortable NSE Assets Table
            </h2>
            <span className="text-xs text-slate-500">
              Sorted by default by Lowest RSI (Ascending)
            </span>
          </div>

          <SortableRsiTable
            assets={assets}
            initialFilter="top5"
            selectedSearch={selectedSearch}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">NSE RSI Screener</span>
            <span>•</span>
            <span>RSI (14-period standard)</span>
            <span>•</span>
            <span className="text-slate-400">Google Apps Script (<code className="font-mono text-[11px]">code.js</code>)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Data snapshot timestamp: {lastUpdate}
          </div>
        </div>
      </footer>

      {/* Google Apps Script Modal */}
      <AppsScriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUrl={appsScriptUrl}
        onUrlUpdate={(url) => {
          setAppsScriptUrl(url);
          loadData(url);
        }}
        onTestConnection={handleTestConnection}
      />

      {/* Google Sheet Link Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        currentSheetUrl={sheetUrl}
        onSaveSheetUrl={(url) => {
          setSheetUrl(url);
          saveGoogleSheetUrl(url);
          if (url) {
            setNotification({
              message: 'Google Sheet link saved! Click "Google Sheet" anytime to open it.',
              type: 'success',
            });
          }
        }}
      />
    </div>
  );
}
