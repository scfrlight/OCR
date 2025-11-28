

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ScanText, Headphones, Play, Pause, Download, Loader2, AlertCircle, Settings, ChevronDown, FileText } from './Icons';
import { Button } from './Button';
import { translations, Language } from '../utils/translations';
import { countWords } from '../services/geminiService'; // Import word count utility

interface ExtractionResultProps {
  text: string;
  podcastScript?: string | null;
  isPlaceholder?: boolean;
  onGeneratePodcast?: () => void;
  isGeneratingAudio?: boolean;
  audioUrl?: string | null;
  podcastGenerationStep?: 'script' | 'audio' | 'complete' | 'error' | null;
  generationProgress?: number;
  
  translatedText?: string | null;
  onTranslate?: (targetLanguage: 'English' | 'Russian' | 'Slovak') => void;
  isTranslating?: boolean;
  onToggleOriginal?: () => void;
  isShowingTranslated?: boolean;
  translationError?: string | null;
  selectedTranslationLanguage: Language;
  
  host1Voice: string;
  host2Voice: string;
  setHost1Voice: (voice: string) => void;
  setHost2Voice: (voice: string) => void;
  host1Name: string;
  host2Name: string;

  onDownloadText?: (text: string, filename: string) => void;
  language: Language; // Interface language
  smartDescriptionEnabled: boolean; // To change title if smart description
}

const ALL_AVAILABLE_VOICES = [
  { name: 'Puck', gender: 'Male' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Kore', gender: 'Female' },
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Zephyr', gender: 'Female' }
];

export const ExtractionResult: React.FC<ExtractionResultProps> = ({ 
  text, 
  podcastScript,
  isPlaceholder, 
  onGeneratePodcast,
  isGeneratingAudio,
  audioUrl,
  podcastGenerationStep, 
  generationProgress = 0,
  translatedText,
  onTranslate,
  isTranslating,
  onToggleOriginal,
  isShowingTranslated,
  translationError,
  selectedTranslationLanguage,
  host1Voice,
  host2Voice,
  setHost1Voice,
  setHost2Voice,
  host1Name,
  host2Name,
  onDownloadText,
  language,
  smartDescriptionEnabled
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'script'>('text');
  const [showTranslationLanguageDropdown, setShowTranslationLanguageDropdown] = useState(false); // New state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const translationDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside

  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);


  const t = translations[language];

  useEffect(() => {
    if (podcastScript) {
      setViewMode('script');
    } else {
      setViewMode('text');
    }
  }, [podcastScript]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (translationDropdownRef.current && !translationDropdownRef.current.contains(event.target as Node)) {
        setShowTranslationLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayedContent = viewMode === 'script' && podcastScript ? podcastScript : (isShowingTranslated && translatedText ? translatedText : text);
  const wordCount = countWords(displayedContent);
  
  const downloadFilename = viewMode === 'script' 
    ? `podcast-script-${selectedTranslationLanguage}.txt` 
    : `extracted-${smartDescriptionEnabled ? 'description' : 'text'}.txt`;

  const podcastGenerationLanguage = isShowingTranslated ? selectedTranslationLanguage : 'English';
  const podcastDownloadFilename = `podcast-${podcastGenerationLanguage.toLowerCase()}.wav`;

  const viktorVoices = ALL_AVAILABLE_VOICES.filter(voice => voice.gender === 'Male');
  const juliaVoices = ALL_AVAILABLE_VOICES.filter(voice => voice.gender === 'Female');

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.onloadedmetadata = () => {
        setAudioDuration(audioRef.current?.duration || 0);
        setAudioCurrentTime(0); // Reset current time when new audio loads
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => {
        setAudioCurrentTime(audioRef.current?.currentTime || 0);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setAudioCurrentTime(0); // Reset to start
      };
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
    }
  }, []); // Only run once for initial setup


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
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

  const handleTranslateClick = (lang: Language) => {
    if (onTranslate) {
      onTranslate(lang);
      setShowTranslationLanguageDropdown(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const clickX = e.clientX - progressBar.getBoundingClientRect().left;
      const percentage = clickX / progressBar.offsetWidth;
      audioRef.current.currentTime = audioDuration * percentage;
    }
  };

  if (isPlaceholder) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
          <ScanText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-2">{t.readyToExtract}</h3>
        <p className="text-slate-400 max-w-xs text-sm">{t.readyToExtractDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
             {podcastScript ? (
               <div className="flex bg-slate-200/50 p-1 rounded-lg">
                 <button 
                   onClick={() => setViewMode('text')}
                   className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {smartDescriptionEnabled ? t.imageDesc : t.sourceText}
                 </button>
                 <button 
                   onClick={() => setViewMode('script')}
                   className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'script' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {t.podcastScript}
                 </button>
               </div>
             ) : (
                <div className="flex items-center space-x-2">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <ScanText className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-slate-700 text-sm">
                    {isShowingTranslated ? `${t.translated} (${selectedTranslationLanguage})` : (smartDescriptionEnabled ? t.imageDesc : t.extractedContent)}
                  </span>
                </div>
             )}
          </div>
          
          <div className="flex items-center space-x-2">
            {audioUrl ? (
              <div className="flex items-center bg-indigo-50 rounded-lg px-2 py-1 border border-indigo-100 mr-2 w-full sm:w-auto">
                <button 
                  onClick={toggleAudio}
                  className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <div className="flex-1 flex flex-col mx-2 min-w-[100px] sm:min-w-[150px]">
                  <div 
                    ref={progressBarRef}
                    onClick={handleProgressBarClick}
                    className="w-full bg-indigo-200 rounded-full h-1.5 cursor-pointer relative group"
                  >
                    <div className="bg-primary h-full rounded-full" style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}></div>
                    <div 
                      className="absolute -top-1.5 -ml-1 h-4 w-4 rounded-full bg-primary shadow transition-all duration-100 ease-linear group-hover:scale-110" 
                      style={{ left: `${(audioCurrentTime / audioDuration) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-indigo-800 mt-1">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>
                <a 
                  href={audioUrl} 
                  download={podcastDownloadFilename}
                  className="p-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                  title={t.download}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <audio 
                  ref={audioRef} 
                  className="hidden" 
                />
              </div>
            ) : isGeneratingAudio ? (
              <div className="flex flex-col w-32 sm:w-48 gap-1 mr-2">
                  <div className="flex justify-between text-[10px] text-slate-500 leading-none mb-0.5">
                    <span className="truncate pr-1">Generating...</span>
                    <span className="font-bold text-primary">{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${generationProgress}%` }}></div>
                  </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {/* Generate Podcast Button */}
                <Button
                  variant="outline"
                  onClick={onGeneratePodcast}
                  disabled={isGeneratingAudio || isTranslating || !text}
                  className="!py-1.5 !px-3 !text-xs h-8" // Adjusted styling
                  isLoading={isGeneratingAudio}
                  loadingText={t.generatePodcast}
                  icon={<Headphones className="w-3 h-3" />}
                >
                  {!isGeneratingAudio && t.generatePodcast}
                </Button>
                
                {text && (
                   <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className={`p-1.5 rounded-lg border transition-colors h-8 w-8 flex items-center justify-center
                       ${showSettings ? 'bg-indigo-50 border-indigo-200 text-primary' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     title={t.settings}
                   >
                     <Settings className="w-4 h-4" />
                   </button>
                )}
              </div>
            )}

            {onTranslate && text && viewMode === 'text' && (
              <div className="relative inline-flex" ref={translationDropdownRef}>
                {/* Translate Button */}
                <Button
                  variant={isShowingTranslated ? "secondary" : "outline"}
                  onClick={isShowingTranslated ? onToggleOriginal : () => {}}
                  disabled={isTranslating || isGeneratingAudio}
                  className={`!py-1.5 !px-3 !text-xs h-8
                    ${!isShowingTranslated ? 'rounded-r-none border-r-0' : ''}
                    ${isTranslating ? 'border-primary' : ''}
                    ${isShowingTranslated ? 'bg-white text-slate-700 hover:bg-slate-50' : ''}
                  `}
                  isLoading={isTranslating} 
                  loadingText={t.translate} // Show "Translate" text during loading
                  icon={isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : undefined}
                >
                  {!isTranslating && (isShowingTranslated ? t.original : t.translate)}
                </Button>
                
                {/* Language Selection Button */}
                {!isShowingTranslated && (
                  <button
                    onClick={() => setShowTranslationLanguageDropdown(!showTranslationLanguageDropdown)}
                    className={`relative px-2 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-r-lg focus:outline-none block h-8 outline-none cursor-pointer bg-white hover:bg-slate-50 flex items-center gap-1
                      ${isTranslating ? 'border-primary' : 'border-l-0'} 
                      ${isTranslating ? 'focus:ring-2 focus:ring-offset-2 focus:ring-primary/20' : 'focus:ring-primary focus:border-primary'}
                    `}
                    disabled={isTranslating || isGeneratingAudio}
                    aria-label={`Select translation language, current: ${selectedTranslationLanguage}`}
                  >
                    {selectedTranslationLanguage === 'English' && 'EN'}
                    {selectedTranslationLanguage === 'Russian' && 'RU'}
                    {selectedTranslationLanguage === 'Slovak' && 'SK'}
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showTranslationLanguageDropdown ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Translation Language Dropdown */}
                {showTranslationLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 animate-in fade-in slide-in-from-top-1">
                    {['English', 'Russian', 'Slovak'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleTranslateClick(lang as Language)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        disabled={isTranslating || isGeneratingAudio}
                      >
                        {lang === 'English' && 'EN'}
                        {lang === 'Russian' && 'RU'}
                        {lang === 'Slovak' && 'SK'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {onDownloadText && displayedContent && (
               <button 
                 onClick={() => onDownloadText(displayedContent, downloadFilename)}
                 className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors ml-1"
                 title={t.download}
               >
                 <Download className="w-4 h-4" />
               </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
              title={t.copy}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showSettings && !isGeneratingAudio && !audioUrl && (
          <div className="bg-slate-50 border-b border-slate-100 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.voiceSettings}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span>
                  {host1Name} ({t.voice})
                </label>
                <div className="relative">
                  <select
                    value={host1Voice}
                    onChange={(e) => setHost1Voice(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg block p-2 pr-8"
                  >
                    {viktorVoices.map((voice) => (
                      <option key={`h1-${voice.name}`} value={voice.name}>{voice.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 flex items-center">
                   <span className="w-2 h-2 rounded-full bg-pink-500 mr-1.5"></span>
                   {host2Name} ({t.voice})
                </label>
                <div className="relative">
                  <select
                    value={host2Voice}
                    onChange={(e) => setHost2Voice(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg block p-2 pr-8"
                  >
                    {juliaVoices.map((voice) => (
                      <option key={`h2-${voice.name}`} value={voice.name}>{voice.name}</option>
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

      <div className="flex-1 overflow-auto bg-slate-50 p-4 custom-scrollbar relative">
        {translationError ? (
           <div className="flex items-center justify-center h-full text-red-500 text-sm p-4 text-center">
             <div>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                <p>{translationError}</p>
             </div>
           </div>
        ) : (
            <div className={`prose prose-sm max-w-none bg-white p-6 rounded-lg shadow-sm border border-slate-100 min-h-full ${viewMode === 'script' ? 'prose-indigo bg-indigo-50/10' : 'prose-slate'}`}>
            {displayedContent ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  {displayedContent}
                </div>
            ) : (
                <div className="text-slate-400 italic text-center mt-20">
                {smartDescriptionEnabled ? t.imageDesc : t.extractedContent} will appear here...
                </div>
            )}
            </div>
        )}
        {displayedContent && (
          <p className="text-right text-xs text-slate-500 mt-2 px-1">
            {t.wordCount}: {wordCount}
          </p>
        )}
      </div>
    </div>
  );
}