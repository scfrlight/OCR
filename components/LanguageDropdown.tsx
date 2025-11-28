// components/LanguageDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from './Icons';
import { Language } from '../utils/translations';

interface LanguageDropdownProps {
  currentLanguage: Language;
  onSelectLanguage: (language: Language) => void;
}

const languageOptions: { code: Language; label: string }[] = [
  { code: 'English', label: 'EN' },
  { code: 'Slovak', label: 'SK' },
  { code: 'Russian', label: 'RU' },
];

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  currentLanguage,
  onSelectLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguageLabel = languageOptions.find(opt => opt.code === currentLanguage)?.label || 'EN';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (language: Language) => {
    onSelectLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {selectedLanguageLabel}
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-24 bg-white border border-slate-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-1">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleSelect(option.code)}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 first:rounded-t-lg last:rounded-b-lg"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
