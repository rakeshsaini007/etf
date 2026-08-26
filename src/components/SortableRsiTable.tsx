import React, { useState, useMemo } from 'react';
import { NseAsset, SortField, SortDirection, ViewFilter } from '../types';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Copy,
  Check,
  Filter,
  ExternalLink,
  Info,
} from 'lucide-react';

interface SortableRsiTableProps {
  assets: NseAsset[];
  initialFilter?: ViewFilter;
  selectedSearch?: string;
}

export const SortableRsiTable: React.FC<SortableRsiTableProps> = ({
  assets,
  initialFilter = 'top5',
  selectedSearch = '',
}) => {
  const [sortField, setSortField] = useState<SortField>('rsi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeFilter, setActiveFilter] = useState<ViewFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>(selectedSearch);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Update search query if parent updates it
  React.useEffect(() => {
    if (selectedSearch) {
      setSearchQuery(selectedSearch);
      setActiveFilter('all');
    }
  }, [selectedSearch]);

  // Handle Sort Column Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to ascending for RSI & Rank, descending for CMP, ascending for Code
      setSortDirection(field === 'cmp' ? 'desc' : 'asc');
    }
  };

  // Base list ranked by lowest RSI
  const globallyRanked = useMemo(() => {
    const sorted = [...assets].sort((a, b) => a.rsi - b.rsi);
    return sorted.map((item, idx) => ({
      ...item,
      originalRank: idx + 1,
    }));
  }, [assets]);

  // Filter and sort items
  const processedData = useMemo(() => {
    let list = [...globallyRanked];

    // Apply Tab/Filter Mode
    if (activeFilter === 'top5') {
      list = list.slice(0, 5);
    } else if (activeFilter === 'oversold') {
      list = list.filter((item) => item.rsi <= 40);
    } else if (activeFilter === 'neutral') {
      list = list.filter((item) => item.rsi > 40 && item.rsi <= 60);
    } else if (activeFilter === 'overbought') {
      list = list.filter((item) => item.rsi > 60);
    }

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.code.toLowerCase().includes(q));
    }

    // Apply Selected Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        comparison = a.originalRank - b.originalRank;
      } else if (sortField === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortField === 'cmp') {
        comparison = a.cmp - b.cmp;
      } else if (sortField === 'rsi') {
        comparison = a.rsi - b.rsi;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [globallyRanked, activeFilter, searchQuery, sortField, sortDirection]);

  // Copy symbol handler
  const handleCopySymbol = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Copy Table Data as TSV
  const handleCopyTable = () => {
    const headers = 'Rank\tNSE Code\tCMP (INR)\tRSI (14)\tStatus\n';
    const rows = processedData
      .map(
        (item) =>
          `${item.originalRank}\t${item.code}\t${item.cmp.toFixed(2)}\t${item.rsi.toFixed(2)}\t${item.status || ''}`
      )
      .join('\n');
    navigator.clipboard.writeText(headers + rows);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Export as CSV
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Rank,NSE Code,CMP,RSI (14),Status\n' +
      processedData
        .map(
          (item) =>
            `${item.originalRank},"${item.code}",${item.cmp.toFixed(2)},${item.rsi.toFixed(2)},"${item.status || ''}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NSE_RSI_${activeFilter}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRsiBadge = (rsi: number) => {
    if (rsi <= 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          Extremely Oversold
        </span>
      );
    }
    if (rsi <= 40) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Oversold (&lt;40)
        </span>
      );
    }
    if (rsi <= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Neutral (40-60)
        </span>
      );
    }
    if (rsi <= 70) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Bullish (60-70)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Overbought (&gt;70)
      </span>
    );
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 font-bold" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Controls Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
            <button
              id="filter-top-5"
              onClick={() => {
                setActiveFilter('top5');
                setSortField('rsi');
                setSortDirection('asc');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'top5'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Top 5 Lowest RSI
            </button>
            <button
              id="filter-all"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              All Assets ({assets.length})
            </button>
            <button
              id="filter-oversold"
              onClick={() => {
                setActiveFilter('oversold');
                setSortField('rsi');
                setSortDirection('asc');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'oversold'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Oversold (≤ 40)
            </button>
            <button
              id="filter-neutral"
              onClick={() => setActiveFilter('neutral')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'neutral'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Neutral (40-60)
            </button>
            <button
              id="filter-overbought"
              onClick={() => {
                setActiveFilter('overbought');
                setSortField('rsi');
                setSortDirection('desc');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeFilter === 'overbought'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Overbought (&gt; 60)
            </button>
          </div>

          {/* Search & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-nse-code"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NSE code or ETF..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              id="btn-copy-table"
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              title="Copy visible table rows to clipboard"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              id="btn-export-csv"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              title="Export as CSV file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Informational Sub-bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-slate-800">{processedData.length}</strong> of{' '}
              <strong className="text-slate-800">{assets.length}</strong> items
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3 h-3" />
            <span>Click any column header to sort</span>
          </div>
        </div>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="nse-rsi-table">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 select-none">
              {/* Rank Column */}
              <th
                onClick={() => handleSort('rank')}
                className="py-3 px-4 w-20 cursor-pointer hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Rank</span>
                  {renderSortIcon('rank')}
                </div>
              </th>

              {/* NSE Code Column */}
              <th
                onClick={() => handleSort('code')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group min-w-[200px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>NSE Code / Symbol</span>
                  {renderSortIcon('code')}
                </div>
              </th>

              {/* CMP Column */}
              <th
                onClick={() => handleSort('cmp')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-right w-36"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>CMP (₹)</span>
                  {renderSortIcon('cmp')}
                </div>
              </th>

              {/* RSI (14) Column */}
              <th
                onClick={() => handleSort('rsi')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group min-w-[220px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>RSI (14-Period)</span>
                  {renderSortIcon('rsi')}
                </div>
              </th>

              {/* Status / Condition Badge */}
              <th className="py-3 px-4 text-center w-40">
                <span>Signal Zone</span>
              </th>

              {/* Quick Actions */}
              <th className="py-3 px-4 text-right w-24">
                <span>Action</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-700">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-semibold text-slate-600">No matching NSE assets found</p>
                    <p className="text-xs">Try clearing the search query or changing the filter tab.</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((item) => {
                const isCopied = copiedCode === item.code;
                const isTop5 = item.originalRank <= 5;
                const rsiPercent = Math.min(Math.max(item.rsi, 0), 100);

                return (
                  <tr
                    key={item.code}
                    id={`row-${item.code.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    className={`hover:bg-slate-50/90 transition-colors ${
                      isTop5 && activeFilter !== 'top5' ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                          item.originalRank <= 3
                            ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                            : item.originalRank <= 5
                            ? 'bg-slate-100 text-slate-800 font-bold'
                            : 'text-slate-400 font-medium'
                        }`}
                      >
                        #{item.originalRank}
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {item.code}
                        </span>
                        {isTop5 && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            TOP 5
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CMP */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{item.cmp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* RSI (14) with meter */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              item.rsi <= 40
                                ? 'text-emerald-700'
                                : item.rsi <= 60
                                ? 'text-slate-800'
                                : 'text-rose-700'
                            }`}
                          >
                            {item.rsi.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.rsi <= 40 ? 'Oversold' : item.rsi > 60 ? 'Overbought' : 'Neutral'}
                          </span>
                        </div>

                        {/* Visual RSI bar */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          {/* 40 oversold threshold marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10"
                            style={{ left: '40%' }}
                          />
                          <div
                            className={`h-full rounded-full ${
                              item.rsi <= 40
                                ? 'bg-emerald-500'
                                : item.rsi <= 60
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${rsiPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {getRsiBadge(item.rsi)}
                    </td>

                    {/* Quick Action (Copy Symbol) */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCopySymbol(item.code)}
                        className="inline-flex items-center gap-1 p-1.5 rounded-md hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 transition-colors"
                        title="Copy Symbol"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          <span>Top 5 Lowest RSI: </span>
          <strong className="text-emerald-700 font-mono">
            {globallyRanked.slice(0, 5).map((x) => `${x.code.replace('NSE:', '')} (${x.rsi.toFixed(1)})`).join(', ')}
          </strong>
        </div>
        <div className="text-[11px] text-slate-400">
          RSI standard threshold: Oversold &lt;= 40.00 • Overbought &gt;= 70.00
        </div>
      </div>
    </div>
  );
};
