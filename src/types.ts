export interface NseAsset {
  code: string;
  cmp: number;
  rsi: number;
  status?: 'Extremely Oversold' | 'Oversold' | 'Neutral' | 'Bullish' | 'Overbought';
}

export type SortField = 'rank' | 'code' | 'cmp' | 'rsi';
export type SortDirection = 'asc' | 'desc';

export type ViewFilter = 'top5' | 'all' | 'oversold' | 'neutral' | 'overbought';

export interface SheetApiResponse {
  status: 'success' | 'error';
  lastUpdate?: string;
  sheetUrl?: string;
  totalCount?: number;
  topFiveLowestRsi?: NseAsset[];
  items?: NseAsset[];
  message?: string;
}

export interface ScreenerStats {
  totalTracked: number;
  oversoldBelow40: number;
  neutralCount: number;
  overboughtAbove60: number;
  lowestRsiItem: NseAsset | null;
  averageRsi: number;
}
