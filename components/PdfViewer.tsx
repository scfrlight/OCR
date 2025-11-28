import React, { useEffect, useState } from 'react';
import { File, X, ImageIcon, FileText, FileType2 } from './Icons';
import { FileData } from '../types';

declare var mammoth: any;

interface PdfViewerProps {
  fileData: FileData | null;
  onClear?: () => void;
  isActive?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileData, onClear, isActive }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  useEffect(() => {
    setTextContent(null);
    setHtmlContent(null);

    if (fileData) {
      const { file } = fileData;
      
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent(e.target?.result as string);
        };
        reader.readAsText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then((result: any) => {
              setHtmlContent(result.value);
            })
            .catch((err: any) => {
              console.error("Mammoth preview error:", err);
              setTextContent("Error generating preview for Word document.");
            });
        };
        reader.readAsArrayBuffer(file);
      }
    }
  }, [fileData]);

  if (!fileData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
          <File className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-2">No Document Selected</h3>
        <p className="text-slate-400 max-w-xs text-sm">
          Upload a PDF, Image, Word Doc, or Text file to see its preview here.
        </p>
      </div>
    );
  }

  const { file, previewUrl } = fileData;
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  const isTxt = file.type === 'text/plain';
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  let IconComponent = File;
  let iconColorClass = "text-slate-600";
  let iconBgClass = "bg-slate-100";

  if (isPdf) {
    IconComponent = File;
    iconColorClass = "text-red-600";
    iconBgClass = "bg-red-100";
  } else if (isImage) {
    IconComponent = ImageIcon;
    iconColorClass = "text-blue-600";
    iconBgClass = "bg-blue-100";
  } else if (isTxt) {
    IconComponent = FileText;
    iconColorClass = "text-slate-600";
    iconBgClass = "bg-slate-200";
  } else if (isDocx) {
    IconComponent = FileType2;
    iconColorClass = "text-blue-700";
    iconBgClass = "bg-blue-50";
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className={`${iconBgClass} p-1.5 rounded-lg`}>
            <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
          </div>
          <span className="font-medium text-slate-700 truncate text-sm" title={file.name}>
            {file.name}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
        {onClear && (
          <button 
            onClick={onClear}
            className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex-1 bg-slate-100 relative min-h-[400px] sm:min-h-[500px] flex items-center justify-center overflow-auto p-4">
        {isPdf && (
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full absolute inset-0 border-none"
            title="PDF Preview"
          />
        )}
        {isImage && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain p-2 shadow-sm"
          />
        )}
        {isTxt && textContent && (
           <div className="w-full h-full bg-white p-6 shadow-sm overflow-auto text-sm font-mono whitespace-pre-wrap text-slate-700">
             {textContent}
           </div>
        )}
        {isDocx && htmlContent && (
           <div className="w-full h-full bg-white p-8 shadow-sm overflow-auto prose prose-sm prose-slate max-w-none prose-preview">
             <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
           </div>
        )}
        {!isPdf && !isImage && !isTxt && !isDocx && (
          <div className="text-slate-400">Unsupported preview format</div>
        )}
        {(isTxt && !textContent) || (isDocx && !htmlContent) ? (
            !isPdf && !isImage && <div className="text-slate-400">Loading preview...</div>
        ) : null}
      </div>
    </div>
  );
};