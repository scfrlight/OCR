import React from 'react';
import { File, X, Loader2, Check, AlertCircle, ImageIcon, FileText, FileType2 } from './Icons';
import { FileData } from '../types';

interface UploadedFileCardProps {
  fileData: FileData;
  index: number;
  onRemove: (index: number) => void;
  onSelect: (index: number) => void;
  isActive: boolean;
  isProcessing?: boolean;
  hasError?: boolean;
  isProcessed?: boolean;
}

export const UploadedFileCard: React.FC<UploadedFileCardProps> = ({
  fileData,
  index,
  onRemove,
  onSelect,
  isActive,
  isProcessing,
  hasError,
  isProcessed,
}) => {
  const { file } = fileData;
  const isImage = file.type.startsWith('image/');
  const isTxt = file.type === 'text/plain';
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  let FileIcon = File;
  let iconClass = "text-slate-500";

  if (isImage) {
    FileIcon = ImageIcon;
    iconClass = "text-blue-500";
  } else if (isTxt) {
    FileIcon = FileText;
    iconClass = "text-slate-500";
  } else if (isDocx) {
    FileIcon = FileType2;
    iconClass = "text-blue-700";
  }

  const statusIcon = isProcessing ? (
    <Loader2 className="w-4 h-4 animate-spin text-primary" />
  ) : hasError ? (
    <AlertCircle className="w-4 h-4 text-red-500" />
  ) : isProcessed ? (
    <Check className="w-4 h-4 text-green-500" />
  ) : (
    <FileIcon className={`w-4 h-4 ${iconClass}`} />
  );

  return (
    <div
      className={`relative flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer group
        ${isActive ? 'border-primary bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}
        ${hasError ? 'border-red-400 bg-red-50' : ''}
      `}
      onClick={() => onSelect(index)}
    >
      <div className="flex-shrink-0 mr-3">
        {statusIcon}
      </div>
      <div className="flex-1 overflow-hidden">
        <span className="block text-sm font-medium text-slate-700 truncate" title={file.name}>
          {index + 1}. {file.name}
        </span>
        <span className="block text-xs text-slate-500">
          ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when removing
          onRemove(index);
        }}
        className="ml-3 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        title="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
      {isProcessing && (
         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
         </div>
      )}
    </div>
  );
};