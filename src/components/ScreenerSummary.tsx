import React from 'react';
import { NseAsset } from '../types';
import { ShieldCheck, TrendingDown, Activity, AlertTriangle, Layers } from 'lucide-react';

interface ScreenerSummaryProps {
  assets: NseAsset[];
}

export const ScreenerSummary: React.FC<ScreenerSummaryProps> = ({ assets }) => {
  const total = assets.length;
  const deepOversold = assets.filter((a) => a.rsi <= 38).length;
  const oversold = assets.filter((a) => a.rsi <= 40).length;
  const neutral = assets.filter((a) => a.rsi > 40 && a.rsi <= 60).length;
  const overbought = assets.filter((a) => a.rsi > 60).length;

  const avgRsi = total > 0 ? assets.reduce((sum, a) => sum + a.rsi, 0) / total : 0;
  const lowest = total > 0 ? [...assets].sort((a, b) => a.rsi - b.rsi)[0] : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Lowest RSI Leader */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
          <span>Lowest RSI Asset</span>
          <TrendingDown className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-emerald-700">
            {lowest ? lowest.rsi.toFixed(2) : '-'}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-700 truncate">
            {lowest ? lowest.code.replace('NSE:', '') : ''}
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/80 mt-0.5">#1 Most Oversold</p>
      </div>

      {/* Oversold Count (<= 40) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
          <span>Oversold Zone (≤40)</span>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-slate-900">{oversold}</span>
          <span className="text-xs text-slate-400">({((oversold / total) * 100).toFixed(0)}%)</span>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
          {deepOversold} deep oversold (&lt;38)
        </p>
      </div>

      {/* Neutral Zone (40-60) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
          <span>Neutral Zone (40-60)</span>
          <Activity className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-slate-900">{neutral}</span>
          <span className="text-xs text-slate-400">({((neutral / total) * 100).toFixed(0)}%)</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Fair value consolidation</p>
      </div>

      {/* Overbought (>60) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
          <span>Overbought (&gt;60)</span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-slate-900">{overbought}</span>
          <span className="text-xs text-slate-400">({((overbought / total) * 100).toFixed(0)}%)</span>
        </div>
        <p className="text-[11px] text-rose-600 font-medium mt-0.5">Elevated momentum</p>
      </div>

      {/* Average RSI */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
          <span>Market Avg RSI</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-slate-900">{avgRsi.toFixed(2)}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Macro sentiment index</p>
      </div>
    </div>
  );
};
