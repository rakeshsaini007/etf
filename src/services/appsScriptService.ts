import { NseAsset, SheetApiResponse } from '../types';
import { enrichAssetWithStatus, getInitialEnrichedData, INITIAL_LAST_UPDATE } from '../data/initialData';

export async function fetchSheetDataFromAppsScript(
  url: string,
  topLimit?: number
): Promise<{
  success: boolean;
  data: NseAsset[];
  lastUpdate: string;
  source: 'live' | 'cache' | 'error';
  errorMessage?: string;
}> {
  if (!url || url.includes('AKfycbz_SAMPLE_DEPLOYMENT_ID')) {
    // Return seeded dataset directly if URL is sample/unset
    const baseData = getInitialEnrichedData();
    const sorted = [...baseData].sort((a, b) => a.rsi - b.rsi);
    return {
      success: true,
      data: topLimit ? sorted.slice(0, topLimit) : baseData,
      lastUpdate: INITIAL_LAST_UPDATE,
      source: 'cache'
    };
  }

  try {
    const fetchUrl = new URL(url);
    if (topLimit) {
      fetchUrl.searchParams.set('top', topLimit.toString());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(fetchUrl.toString(), {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json: SheetApiResponse = await response.json();

    if (json.status === 'error' || !json.items) {
      throw new Error(json.message || 'Apps script returned an error status');
    }

    const enrichedItems = json.items.map(enrichAssetWithStatus);

    return {
      success: true,
      data: enrichedItems,
      lastUpdate: json.lastUpdate || new Date().toLocaleString('en-IN'),
      source: 'live'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure';
    console.warn('Apps script fetch failed, falling back to local sheet snapshot:', errorMsg);
    
    const fallbackData = getInitialEnrichedData();
    return {
      success: false,
      data: fallbackData,
      lastUpdate: INITIAL_LAST_UPDATE,
      source: 'error',
      errorMessage: errorMsg
    };
  }
}
