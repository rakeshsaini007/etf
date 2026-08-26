import React from 'react';
import { NseAsset } from '../types';
import { TrendingDown, Flame, Copy, Check, ShieldAlert } from 'lucide-react';

interface TopFiveRsiCardsProps {
  topAssets: NseAsset[];
  onSelectCode?: (code: string) => void;
}

export const TopFiveRsiCards: React.FC<TopFiveRsiCardsProps> = ({
  topAssets,
  onSelectCode,
}) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20';
      case 2:
        return 'bg-emerald-500 text-white';
      case 3:
        return 'bg-teal-600 text-white';
      case 4:
        return 'bg-cyan-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-100 text-emerald-800">
            <Flame className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Top 5 Lowest RSI (14) — Key Buying / Oversold Watchlist
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Ranked from lowest relative strength index (most oversold)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {topAssets.slice(0, 5).map((asset, index) => {
          const rank = index + 1;
          const rsiPercent = Math.min(Math.max(asset.rsi, 0), 100);
          const isCopied = copiedCode === asset.code;

          return (
            <div
              key={asset.code}
              id={`top-card-${asset.code.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={() => onSelectCode && onSelectCode(asset.code)}
              className="relative group bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              {/* Top Row: Rank & Oversold Tag */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankBadgeColor(
                      rank
                    )}`}
                  >
                    #{rank}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                    {asset.rsi <= 35 ? 'Deep Oversold' : 'Oversold'}
                  </span>
                </div>

                {/* Symbol & Copy */}
                <div className="flex items-baseline justify-between gap-1 mb-1">
                  <h3 className="font-mono text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-emerald-700 transition-colors">
                    {asset.code}
                  </h3>
                  <button
                    onClick={(e) => handleCopy(e, asset.code)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                    title="Copy symbol"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* CMP Price */}
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-xs text-slate-500 font-medium">CMP</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{asset.cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bottom: RSI Value & Visual Gauge */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-500">RSI (14)</span>
                  <span className="text-base font-extrabold font-mono text-emerald-700">
                    {asset.rsi.toFixed(2)}
                  </span>
                </div>

                {/* RSI Gauge Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    {/* Oversold guide line at 40% */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10"
                      style={{ left: '40%' }}
                      title="Oversold boundary (40)"
                    />
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${rsiPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0</span>
                    <span className="text-emerald-600 font-semibold">40 (OS)</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
