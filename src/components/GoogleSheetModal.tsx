import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, ExternalLink, Check, Trash2 } from 'lucide-react';
import { isValidSheetUrl } from '../config';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  currentSheetUrl,
  onSaveSheetUrl,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentSheetUrl);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(currentSheetUrl);
      setSavedNotice(false);
    }
  }, [isOpen, currentSheetUrl]);

  if (!isOpen) return null;

  const trimmed = urlInput.trim();
  const isValid = isValidSheetUrl(trimmed);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSaveSheetUrl(trimmed);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleClear = () => {
    setUrlInput('');
    onSaveSheetUrl('');
    setSavedNotice(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-sheet-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 id="google-sheet-modal-title" className="text-base font-bold text-slate-900">
                Google Sheet Navigation
              </h3>
              <p className="text-xs text-slate-500">
                Link your Google Sheet to open it directly from the header
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="input-google-sheet-url"
              className="block text-xs font-bold text-slate-900 uppercase tracking-wider"
            >
              Google Sheet URL
            </label>
            <input
              id="input-google-sheet-url"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              autoFocus
            />
            <p className="text-[11px] text-slate-500">
              Paste the URL from your browser address bar while viewing your NSE RSI Google Sheet.
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Sheet link saved! You can now open it directly anytime.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div>
              {currentSheetUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Link</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!isValid}
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Save URL
              </button>

              {isValid ? (
                <a
                  href={trimmed}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    onSaveSheetUrl(trimmed);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Save &amp; Open Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed">
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
