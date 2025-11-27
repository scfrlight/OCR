import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from './Icons';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  error?: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    // Limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Please upload a PDF smaller than 50MB.');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="w-full">
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
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-100 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-primary'}`}>
            <Upload className="w-8 h-8" />
          </div>
          <p className="mb-2 text-lg font-semibold text-slate-700">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-slate-500 mb-4">
            PDF files only (max 50MB)
          </p>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            <FileText className="w-3 h-3" />
            <span>AI-Powered Text Extraction</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileInput}
        />
      </div>
      
      {error && (
        <div className="mt-3 flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};