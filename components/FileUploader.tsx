
import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, ImageIcon, FileType2, Camera } from './Icons';
import { translations, Language } from '../utils/translations';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  error?: string | null;
  uploadedFileCount: number;
  onCameraOpen?: () => void;
  language: Language;
  smartDescriptionEnabled: boolean;
  onToggleSmartDescription: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  error, 
  uploadedFileCount, 
  onCameraOpen,
  language,
  smartDescriptionEnabled,
  onToggleSmartDescription
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const MAX_FILES = 10;
  const MAX_FILE_SIZE_MB = 50;

  useEffect(() => {
    // Add paste event listener for handling screenshots
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        validateAndProcessFiles(Array.from(e.clipboardData.files));
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [uploadedFileCount]); // Dependency to ensure count check is accurate

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(Array.from(e.target.files));
    }
  };

  const validateAndProcessFiles = (newFiles: File[]) => {
    const totalFiles = uploadedFileCount + newFiles.length;
    if (totalFiles > MAX_FILES) {
      alert(`Max ${MAX_FILES} files allowed.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of newFiles) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      const isTxt = file.type === 'text/plain';
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!isPdf && !isImage && !isTxt && !isDocx) {
        alert(`File '${file.name}' not supported.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File '${file.name}' too large.`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-primary bg-indigo-50/50 scale-[1.01]' 
            : 'border-slate-300 bg-white hover:border-primary hover:bg-slate-50'
          }
          ${error ? 'border-red-300 bg-red-50/10' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()} 
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 w-full">
          <div className="flex flex-col items-center w-full">
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-100 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-primary'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <p className="mb-2 text-lg font-semibold text-slate-700">
              {t.clickToUpload}
            </p>
            <p className="text-sm text-slate-500 mb-1">
              {t.supportedFormats}
            </p>
            <p className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
              Tip: Paste (Ctrl+V) images directly!
            </p>
          </div>

          {onCameraOpen && (
             <button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 onCameraOpen();
               }}
               className="mt-4 flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 hover:shadow-sm transition-all text-sm font-medium border border-indigo-200"
             >
               <Camera className="w-4 h-4 mr-2" />
               {t.takePhoto}
             </button>
          )}

          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex-wrap gap-y-1">
            <FileText className="w-3 h-3" />
            <span>+</span>
            <ImageIcon className="w-3 h-3" />
            <span>+</span>
            <FileType2 className="w-3 h-3" />
            <span>{t.aiAnalysis}</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf, .jpg, .jpeg, .png, .webp, .heic, .txt, .docx"
          onChange={handleFileInput}
          multiple
        />
      </div>

      {/* Smart Description Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-slate-800 text-sm">{t.smartDescription}</h4>
            <p className="text-xs text-slate-500">{t.smartDescriptionDesc}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={smartDescriptionEnabled} 
            onChange={onToggleSmartDescription}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
      
      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
