
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { FileText, X, AlertCircle } from './Icons';
import { translations, Language } from '../utils/translations';
import { countWords } from '../services/geminiService'; // Import countWords

interface TextInputCardProps {
  onProcessText: (text: string) => void;
  onTextProcessingError: (error: string) => void;
  onClearMainInput: () => void;
  isProcessingOverall: boolean;
  currentTextInput: string; // The text currently loaded into the main app state
  language: Language;
}

export const TextInputCard: React.FC<TextInputCardProps> = ({
  onProcessText,
  onTextProcessingError,
  onClearMainInput,
  isProcessingOverall,
  currentTextInput,
  language,
}) => {
  const [localTextInput, setLocalTextInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const t = translations[language];
  const wordCount = countWords(localTextInput);

  // Sync local state with currentTextInput if it's from another source
  useEffect(() => {
    if (currentTextInput && currentTextInput !== localTextInput) {
      setLocalTextInput(currentTextInput);
    } else if (!currentTextInput && localTextInput) {
        // If main text is cleared externally, clear local text input
        setLocalTextInput('');
    }
  }, [currentTextInput]);

  const handleProcessText = () => {
    if (!localTextInput.trim()) {
      setLocalError(t.textInputPlaceholder); // Re-use placeholder text as error
      return;
    }
    setLocalError(null);
    onClearMainInput(); // Clear previous extraction results
    onProcessText(localTextInput);
  };

  const handleClear = () => {
    setLocalTextInput('');
    setLocalError(null);
    onClearMainInput(); // Clear main app state
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 gap-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" /> {t.textInputTitle}
      </h3>
      <p className="text-sm text-slate-600">{t.textInputDesc}</p>

      {localError && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <div className="flex-1 min-h-[150px]">
        <textarea
          value={localTextInput}
          onChange={(e) => {
            setLocalTextInput(e.target.value);
            if (localError) setLocalError(null); // Clear error on typing
          }}
          placeholder={t.textInputPlaceholder}
          className="w-full h-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-base resize-none custom-scrollbar"
          disabled={isProcessingOverall}
          aria-label={t.textInputPlaceholder}
        />
      </div>

      <div className="flex gap-3 mt-auto">
        <Button
          onClick={handleProcessText}
          disabled={isProcessingOverall || !localTextInput.trim()}
          variant="primary"
          icon={<FileText className="w-4 h-4" />}
          className="flex-1"
        >
          {t.processText}
        </Button>
        <Button
          onClick={handleClear}
          disabled={isProcessingOverall || !localTextInput.trim()}
          variant="secondary"
          icon={<X className="w-4 h-4" />}
          className="flex-1"
        >
          {t.clearText}
        </Button>
      </div>
      {localTextInput.trim() && (
        <p className="text-right text-xs text-slate-500 mt-1">
          {t.wordCount}: {wordCount}
        </p>
      )}
    </div>
  );
};