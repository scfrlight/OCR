import React from 'react';
import { File, X } from './Icons';

interface PdfPreviewProps {
  file: File;
  previewUrl: string;
  onClear: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ file, previewUrl, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="bg-red-100 p-1.5 rounded-lg">
            <File className="w-4 h-4 text-red-600" />
          </div>
          <span className="font-medium text-slate-700 truncate text-sm" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
        <button 
          onClick={onClear}
          className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 bg-slate-100 relative min-h-[400px] sm:min-h-[500px]">
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full absolute inset-0 border-none"
          title="PDF Preview"
        />
      </div>
    </div>
  );
};