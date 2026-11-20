/**
 * Configuration for Google Apps Script Web App Integration
 * 
 * You can set your deployed Web App URL here directly,
 * or enter it dynamically through the in-app connection settings.
 */

// Default deployed URL (Users can replace this or configure via UI)
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-iUvSAC3RXEzXa_TMN7Aoc_IpjJtAzhfVR4HzyLbWfBwWv6SJLsw5FxNrfAoSO_n7/exec';

export const STORAGE_KEY_APPS_SCRIPT_URL = 'nse_rsi_apps_script_url';
export const STORAGE_KEY_GOOGLE_SHEET_URL = 'nse_rsi_google_sheet_url';
export const STORAGE_KEY_AUTO_REFRESH = 'nse_rsi_auto_refresh';
export const STORAGE_KEY_REFRESH_INTERVAL = 'nse_rsi_refresh_interval';

export function isValidSheetUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getStoredAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_APPS_SCRIPT_URL);
    if (saved && saved.trim().length > 0) return saved.trim();
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export function saveAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, url.trim());
  }
}

export function getStoredGoogleSheetUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_GOOGLE_SHEET_URL);
    if (saved && saved.trim().length > 0 && isValidSheetUrl(saved)) {
      return saved.trim();
    }
  }
  return '';
}

export function saveGoogleSheetUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = url.trim();
    if (trimmed.length === 0) {
      localStorage.removeItem(STORAGE_KEY_GOOGLE_SHEET_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_GOOGLE_SHEET_URL, trimmed);
    }
  }
}
