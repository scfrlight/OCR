
import React from 'react';
import { X, ArrowLeft, Youtube } from './Icons';
import { YouTubeInput } from './YouTubeInput';
import { translations, Language } from '../utils/translations';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (text: string) => void;
  onError: (error: string) => void;
  onClearMainInput: () => void;
  isProcessingOverall: boolean;
  language: Language;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  onExtract,
  onError,
  onClearMainInput,
  isProcessingOverall,
  language,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition-colors"
              aria-label={t.changeInput}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xl">
              {t.ytModalTitle}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          <p className="text-slate-600 text-base">
            {t.ytModalInstructions}
          </p>

          <YouTubeInput 
            onExtract={onExtract}
            onError={onError}
            onClearMainInput={onClearMainInput}
            isProcessingOverall={isProcessingOverall}
            language={language}
            onClose={onClose} // Pass onClose to close modal on successful extract
          />

          {/* Notes Section */}
          <div className="mt-4">
            <h4 className="font-semibold text-slate-800 mb-2">{t.ytModalNotes}</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>{t.ytNote1}</li>
              <li>{t.ytNote2}</li>
              <li>{t.ytNote3}</li>
              <li>
                <a href="https://support.google.com/notebooklm/answer/13926615" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {t.ytNoteMoreInfo}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
