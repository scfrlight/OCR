import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ScanText, Headphones, Play, Pause, Download, Loader2, AlertCircle, Settings, ChevronDown } from './Icons';
import { Button } from './Button';

interface ExtractionResultProps {
  text: string;
  isPlaceholder?: boolean;
  onGeneratePodcast?: () => void;
  isGeneratingAudio?: boolean;
  audioUrl?: string | null;
  podcastGenerationStep?: 'script' | 'audio' | 'complete' | 'error' | null;
  
  // New props for translation
  translatedText?: string | null;
  onTranslate?: () => void;
  isTranslating?: boolean;
  onToggleOriginal?: () => void;
  isShowingTranslated?: boolean;
  translationError?: string | null;

  // New props for Voice Selection
  host1Voice: string;
  host2Voice: string;
  setHost1Voice: (voice: string) => void;
  setHost2Voice: (voice: string) => void;
  host1Name: string;
  host2Name: string;
}

const AVAILABLE_VOICES = [
  { name: 'Puck', gender: 'Male' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Kore', gender: 'Female' },
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Zephyr', gender: 'Female' }
];

export const ExtractionResult: React.FC<ExtractionResultProps> = ({ 
  text, 
  isPlaceholder, 
  onGeneratePodcast,
  isGeneratingAudio,
  audioUrl,
  podcastGenerationStep, 
  translatedText,
  onTranslate,
  isTranslating,
  onToggleOriginal,
  isShowingTranslated,
  translationError,
  host1Voice,
  host2Voice,
  setHost1Voice,
  setHost2Voice,
  host1Name,
  host2Name
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const displayedText = isShowingTranslated && translatedText ? translatedText : text;
  const podcastGenerationLanguage = isShowingTranslated ? 'Russian' : 'English';
  const podcastButtonText = `Generate ${podcastGenerationLanguage} Podcast`;
  const podcastDownloadFilename = `podcast-overview-${podcastGenerationLanguage.toLowerCase()}.wav`;

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Determine the loading text for the podcast generation button
  const getPodcastLoadingText = () => {
    if (podcastGenerationStep === 'script') return 'Generating Script...';
    if (podcastGenerationStep === 'audio') return 'Synthesizing Audio...';
    return 'Processing...'; // Fallback for unexpected states
  };

  if (isPlaceholder) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
          <ScanText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-2">Ready to Extract</h3>
        <p className="text-slate-400 max-w-xs text-sm">
          Upload a PDF document or use your microphone to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg">
              <ScanText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-slate-700 text-sm">Extracted Content {isShowingTranslated && translatedText && "(Russian Translation)"}</span>
          </div>
          
          <div className="flex items-center space-x-2">
             {/* Audio Controls */}
            {audioUrl ? (
              <div className="flex items-center bg-indigo-50 rounded-lg px-2 py-1 border border-indigo-100 mr-2">
                <button 
                  onClick={toggleAudio}
                  className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <span className="text-xs font-medium text-indigo-900 mx-2">Audio Overview</span>
                <a 
                  href={audioUrl} 
                  download={podcastDownloadFilename}
                  className="p-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                  title="Download Audio"
                  aria-label="Download audio overview"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <audio 
                  ref={audioRef} 
                  onEnded={handleAudioEnded} 
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  onClick={onGeneratePodcast}
                  disabled={isGeneratingAudio || isTranslating || !text}
                  className="!py-1.5 !px-3 !text-xs h-8"
                  isLoading={isGeneratingAudio}
                  loadingText={getPodcastLoadingText()}
                  icon={!isGeneratingAudio ? <Headphones className="w-3 h-3" /> : undefined}
                >
                  {!isGeneratingAudio && podcastButtonText}
                </Button>
                
                {/* Voice Settings Toggle */}
                {!isGeneratingAudio && text && (
                   <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className={`p-1.5 rounded-lg border transition-colors h-8 w-8 flex items-center justify-center
                       ${showSettings 
                         ? 'bg-indigo-50 border-indigo-200 text-primary' 
                         : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                       }`}
                     title="Podcast Voice Settings"
                   >
                     <Settings className="w-4 h-4" />
                   </button>
                )}
              </div>
            )}

            {/* Translate Button */}
            {onTranslate && text && (
              <Button
                variant={isShowingTranslated ? "secondary" : "outline"}
                onClick={isShowingTranslated ? onToggleOriginal : onTranslate}
                disabled={isTranslating || isGeneratingAudio}
                className="!py-1.5 !px-3 !text-xs h-8"
                isLoading={isTranslating} // Use isLoading prop for translation button
                loadingText="Translating..." // Custom loading text for translation
                icon={!isTranslating ? null : undefined}
              >
                {!isTranslating && (isShowingTranslated ? "Original" : "Translate (RU)")}
              </Button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showSettings && !isGeneratingAudio && !audioUrl && (
          <div className="bg-slate-50 border-b border-slate-100 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-4">
              {/* Host 1 Settings */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span>
                  {host1Name} (Voice)
                </label>
                <div className="relative">
                  <select
                    value={host1Voice}
                    onChange={(e) => setHost1Voice(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all cursor-pointer"
                  >
                    {AVAILABLE_VOICES.map((voice) => (
                      <option key={`h1-${voice.name}`} value={voice.name}>
                        {voice.name} ({voice.gender})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Host 2 Settings */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                   <span className="w-2 h-2 rounded-full bg-pink-500 mr-1.5"></span>
                   {host2Name} (Voice)
                </label>
                <div className="relative">
                  <select
                    value={host2Voice}
                    onChange={(e) => setHost2Voice(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all cursor-pointer"
                  >
                    {AVAILABLE_VOICES.map((voice) => (
                      <option key={`h2-${voice.name}`} value={voice.name}>
                        {voice.name} ({voice.gender})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4 custom-scrollbar relative">
        {translationError ? (
           <div className="flex items-center justify-center h-full text-red-500 text-sm p-4 text-center">
             <div>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                <p>{translationError}</p>
             </div>
           </div>
        ) : (
            <div className="prose prose-sm prose-slate max-w-none bg-white p-6 rounded-lg shadow-sm border border-slate-100 min-h-full">
            {displayedText ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                {displayedText}
                </div>
            ) : (
                <div className="text-slate-400 italic text-center mt-20">
                Extracted text will appear here...
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};
