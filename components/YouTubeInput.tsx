

import React, { useState } from 'react';
import { Youtube, Loader2, AlertCircle } from './Icons';
import { Button } from './Button';
import { translations, Language } from '../utils/translations';
import { extractTextFromYouTube } from '../services/geminiService';

interface YouTubeInputProps {
  onExtract: (text: string) => void;
  onError: (error: string) => void;
  onClearMainInput: () => void;
  isProcessingOverall: boolean; // Renamed from isProcessing to avoid conflict with localProcessing
  language: Language;
  onClose?: () => void; // Added for modal context
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({
  onExtract,
  onError,
  onClearMainInput,
  isProcessingOverall,
  language,
  onClose
}) => {
  const [inputValue, setInputValue] = useState('');
  const [localProcessing, setLocalProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null); // Local error state
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setLocalError("Input cannot be empty."); // Set local error
      return;
    }

    onClearMainInput(); // Clear main app state first
    setLocalProcessing(true);
    setLocalError(null); // Clear local error before new request
    onError(''); // Clear parent error

    try {
      const text = await extractTextFromYouTube(inputValue, language);
      onExtract(text);
      setInputValue('');
      if (onClose) onClose(); // Close modal on success
    } catch (err: any) {
      setLocalError(err.message || "Failed to process YouTube request"); // Set local error on failure
      onError(err.message || "Failed to process YouTube request"); // Also pass to parent
    } finally {
      setLocalProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Moved title/description to YouTubeModal component */}
      
      {localError && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t.ytModalInputPlaceholder}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
            disabled={isProcessingOverall || localProcessing}
            required
            aria-label={t.ytModalInputPlaceholder}
          />
        </div>
        
        <Button
          type="submit"
          disabled={isProcessingOverall || localProcessing || !inputValue.trim()}
          isLoading={localProcessing}
          variant="primary"
          className="w-full !bg-red-600 hover:!bg-red-700"
          icon={<Youtube className="w-4 h-4"/>}
        >
          {localProcessing ? t.ytProcessing : t.ytButton}
        </Button>
      </form>
    </div>
  );
};