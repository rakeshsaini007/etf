import React from 'react';
import { RefreshCw, Code2, Database, Clock, ArrowDownNarrowWide } from 'lucide-react';

interface HeaderProps {
  lastUpdate: string;
  isLive: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAppsScriptModal: () => void;
  totalCount: number;
  oversoldBelow40Count: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdate,
  isLive,
  isLoading,
  onRefresh,
  onOpenAppsScriptModal,
  totalCount,
  oversoldBelow40Count,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10">
            <ArrowDownNarrowWide className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                NSE RSI Screener
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Top 5 Lowest RSI
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{totalCount} Total Tracked NSE ETFs & Equities</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">
                {oversoldBelow40Count} in Oversold Zone (≤40 RSI)
              </span>
            </p>
          </div>
        </div>

        {/* Sync status & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Source Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-700">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Source:</span>
            {isLive ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Apps Script Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Sheet Snapshot
              </span>
            )}
          </div>

          {/* Last Update timestamp */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated:</span>
            <span className="font-mono font-medium text-slate-800">{lastUpdate}</span>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-sheet"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 disabled:opacity-60 transition-colors shadow-2xs"
            title="Refresh data from Google Apps Script"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Google Apps Script Modal Trigger */}
          <button
            id="btn-open-apps-script-modal"
            onClick={onOpenAppsScriptModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Apps Script (code.js)</span>
          </button>
        </div>

      </div>
    </header>
  );
};
