


import React, { useState, useEffect, useCallback } from 'react';
import { fileToBase64, extractTextFromDocument, generatePodcastScript, generatePodcastAudio, translateText } from './services/geminiService';
import { AppStatus, FileData, InputTab } from './types';
import { FileUploader } from './components/FileUploader';
import { PdfViewer } from './components/PdfViewer';
import { UploadedFileCard } from './components/UploadedFileCard';
import { ExtractionResult } from './components/ExtractionResult';
import { Button } from './components/Button';
import { ScanText, Loader2, AlertCircle, Camera, Mic, FileText, Youtube, ChevronDown, ImageIcon } from './components/Icons';
import { MicrophoneInputCard } from './components/MicrophoneInputCard';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { YouTubeInput } from './components/YouTubeInput'; // Still imported, but used conditionally
import { YouTubeModal } from './components/YouTubeModal'; // New import
import { TextInputCard } from './components/TextInputCard'; // New import
import { LanguageDropdown } from './components/LanguageDropdown'; // New import
import { translations, Language } from './utils/translations';

const ALL_AVAILABLE_VOICES = [
  { name: 'Puck', gender: 'Male' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Kore', gender: 'Female' },
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Zephyr', gender: 'Female' }
];

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  // Global Interface Language
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('interfaceLanguage');
    return (savedLang as Language) || 'English';
  });
  const t = translations[interfaceLanguage];

  const [activeTab, setActiveTab] = useState<InputTab>('files');
  
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]); 
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileProcessingStatus, setFileProcessingStatus] = useState<('idle' | 'processing' | 'success' | 'error')[]>([]);
  
  // Smart Description Mode for Images
  const [smartDescriptionEnabled, setSmartDescriptionEnabled] = useState(false);

  // Audio Podcast State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null); 
  const [podcastGenerationStep, setPodcastGenerationStep] = useState<'script' | 'audio' | 'complete' | 'error' | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  // Voices
  const [host1Voice, setHost1Voice] = useState<string>(() => localStorage.getItem('host1Voice') || 'Puck');
  const [host2Voice, setHost2Voice] = useState<string>(() => localStorage.getItem('host2Voice') || 'Kore');

  // Translation State (for output)
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslatedText, setShowTranslatedText] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState<Language>('English'); // Default to English for translation, can be changed.

  // Microphone
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // YouTube Modal
  const [showYouTubeModal, setShowYouTubeModal] = useState(false); // New state for modal visibility

  useEffect(() => {
    localStorage.setItem('host1Voice', host1Voice);
    localStorage.setItem('host2Voice', host2Voice);
  }, [host1Voice, host2Voice]);

  useEffect(() => {
    localStorage.setItem('interfaceLanguage', interfaceLanguage);
  }, [interfaceLanguage]);

  // Sync translation language with interface language initially, but user can change it independently for translation
  useEffect(() => {
    // Only set if not already translated or if the interface language is truly different
    if (!translatedText || selectedTranslationLanguage === interfaceLanguage) {
      setSelectedTranslationLanguage(interfaceLanguage);
    }
  }, [interfaceLanguage, translatedText, selectedTranslationLanguage]);


  const getHostNames = useCallback((isShowingTranslated: boolean, currentLang: Language) => {
    // If showing translation, assume podcast language matches translation language
    // If not showing translation, assume podcast language matches extracted content language (or interface default)
    const lang = isShowingTranslated ? currentLang : interfaceLanguage;

    if (lang === 'Russian') {
      return { host1Name: "Виктор", host2Name: "Юлия" };
    } else if (lang === 'Slovak') {
      return { host1Name: "Viktor", host2Name: "Júlia" };
    }
    return { host1Name: "Viktor", host2Name: "Julia" };
  }, [interfaceLanguage]);

  const { host1Name, host2Name } = getHostNames(showTranslatedText, selectedTranslationLanguage);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(fd => URL.revokeObjectURL(fd.previewUrl));
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [uploadedFiles, audioUrl]);

  const clearAllAppStates = useCallback(() => {
    setUploadedFiles([]);
    setCurrentFileIndex(0);
    setFileProcessingStatus([]);
    setExtractedText("");
    setAudioUrl(null);
    setPodcastScript(null);
    setPodcastGenerationStep(null);
    setGenerationProgress(0);
    setTranslatedText(null);
    setShowTranslatedText(false);
    setTranslationError(null);
    setIsTranscribingAudio(false);
    setTranscriptionError(null);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  }, []);

  const handleTabChange = (tab: InputTab) => {
    setActiveTab(tab);
    if (tab === 'youtube') {
      setShowYouTubeModal(true); // Open modal when YouTube tab is selected
    } else {
      setShowYouTubeModal(false); // Ensure modal is closed when switching tabs
    }
    // Optional: clear input when switching tabs? No, let's keep it sticky unless explicit clear
  };

  const handleFileSelect = async (files: File[]) => {
    setStatus(AppStatus.UPLOADING);
    if (uploadedFiles.length === 0 && !extractedText) clearAllAppStates(); // Clear only if no text and no files
    setErrorMsg(null);

    const newFileDataArray: FileData[] = [];
    const newFileStatuses: ('idle' | 'processing' | 'success' | 'error')[] = [];

    for (const file of files) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        newFileDataArray.push({ file, previewUrl, base64 });
        newFileStatuses.push('idle');
      } catch (e) {
        setErrorMsg(`Failed to process ${file.name}`);
        setStatus(AppStatus.ERROR);
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newFileDataArray]);
    setFileProcessingStatus(prev => [...prev, ...newFileStatuses]);
    if (newFileDataArray.length > 0) setStatus(AppStatus.IDLE);
  };

  const handleRemoveFile = useCallback((indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setFileProcessingStatus(prev => prev.filter((_, i) => i !== indexToRemove));
    setCurrentFileIndex(prev => (prev >= indexToRemove && prev > 0 ? prev - 1 : prev));
    if (uploadedFiles.length === 1 && !extractedText) clearAllAppStates(); // Clear all if last file removed and no text
  }, [uploadedFiles, extractedText, clearAllAppStates]);

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) return;
    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    setAudioUrl(null);
    setPodcastScript(null);
    setTranslatedText(null); // Clear translation on new extraction
    setShowTranslatedText(false);

    let combinedText = "";
    const newStatuses = [...fileProcessingStatus];

    for (let i = 0; i < uploadedFiles.length; i++) {
      setCurrentFileIndex(i);
      newStatuses[i] = 'processing';
      setFileProcessingStatus([...newStatuses]);
      
      try {
        const mode = smartDescriptionEnabled ? 'describe' : 'extract';
        const text = await extractTextFromDocument(uploadedFiles[i].base64, uploadedFiles[i].file.type, mode, interfaceLanguage);
        combinedText += text + "\n\n---\n\n";
        newStatuses[i] = 'success';
      } catch (e: any) {
        setErrorMsg(`Error processing ${uploadedFiles[i].file.name}: ${e.message}`);
        newStatuses[i] = 'error';
      }
      setFileProcessingStatus([...newStatuses]);
    }

    setExtractedText(combinedText.trim());
    setStatus(combinedText ? AppStatus.SUCCESS : AppStatus.ERROR);
  };

  const handleGeneratePodcast = async () => {
    const textToUse = showTranslatedText && translatedText ? translatedText : extractedText;
    if (!textToUse) return;

    setIsGeneratingAudio(true);
    setPodcastGenerationStep('script');
    setGenerationProgress(10);
    
    // Simulate progress
    const timer = setInterval(() => setGenerationProgress(p => (p < 90 ? p + 5 : p)), 500);

    try {
      const lang = showTranslatedText ? selectedTranslationLanguage : interfaceLanguage;
      const script = await generatePodcastScript(textToUse, lang, host1Name, host2Name);
      setPodcastScript(script);
      setPodcastGenerationStep('audio');
      setGenerationProgress(50);

      const url = await generatePodcastAudio(script, host1Voice, host2Voice, host1Name, host2Name);
      setAudioUrl(url);
      setPodcastGenerationStep('complete');
      setGenerationProgress(100);
    } catch (e: any) {
      setTranslationError(e.message); // Use translationError for podcast too, or create a separate podcastError state
      setPodcastGenerationStep('error');
    } finally {
      clearInterval(timer);
      setIsGeneratingAudio(false);
    }
  };

  const handleTranslate = async (targetLanguage: Language) => {
    if (!extractedText) return;
    setIsTranslating(true);
    setTranslationError(null);
    setSelectedTranslationLanguage(targetLanguage);

    try {
      const translated = await translateText(extractedText, targetLanguage);
      setTranslatedText(translated);
      setShowTranslatedText(true);
    } catch (e: any) {
      setTranslationError(e.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTextProcessing = (text: string) => {
    setExtractedText(text);
    setStatus(AppStatus.SUCCESS);
    setTranslatedText(null); // Clear previous translation
    setShowTranslatedText(false);
  };

  const currentDisplayError = errorMsg || translationError || transcriptionError;
  const isAnyProcessing = status === AppStatus.PROCESSING || isGeneratingAudio || isTranslating || isTranscribingAudio;
  const showInitialInputChoice = uploadedFiles.length === 0 && !extractedText;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {isCameraOpen && (
        <CameraCaptureModal 
          onCapture={(file) => { handleFileSelect([file]); setIsCameraOpen(false); }} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={showYouTubeModal}
        onClose={() => {setShowYouTubeModal(false); setActiveTab('files');}} // Close modal and reset active tab
        onExtract={handleTextProcessing} // Use handleTextProcessing
        onError={setErrorMsg}
        onClearMainInput={clearAllAppStates}
        isProcessingOverall={isAnyProcessing}
        language={interfaceLanguage}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ScanText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-800 hidden sm:block">
              {t.title}
            </h1>
            <h1 className="text-lg font-bold text-primary sm:hidden">VD OCR</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageDropdown 
              currentLanguage={interfaceLanguage} 
              onSelectLanguage={setInterfaceLanguage} 
            />
            
            <div className="text-xs font-medium text-slate-400 hidden md:block">
              {t.poweredBy}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {showInitialInputChoice ? (
          <div className="max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                {t.heroTitle} <br/>
                <span className="text-primary">{t.heroSubtitle}</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t.heroDesc}
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <button
                  onClick={() => handleTabChange('files')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'files' ? 'bg-indigo-50 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileText className="w-4 h-4" /> {t.tabFiles}
                </button>
                <button
                  onClick={() => handleTabChange('mic')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'mic' ? 'bg-indigo-50 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Mic className="w-4 h-4" /> {t.tabMic}
                </button>
                <button
                  onClick={() => handleTabChange('youtube')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'youtube' ? 'bg-indigo-50 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Youtube className="w-4 h-4" /> {t.tabYoutube}
                </button>
                <button
                  onClick={() => handleTabChange('text')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'text' ? 'bg-indigo-50 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileText className="w-4 h-4" /> {t.tabText}
                </button>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-100 min-h-[300px]">
              {activeTab === 'files' && (
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  error={currentDisplayError} 
                  uploadedFileCount={uploadedFiles.length}
                  onCameraOpen={() => setIsCameraOpen(true)}
                  language={interfaceLanguage}
                  smartDescriptionEnabled={smartDescriptionEnabled}
                  onToggleSmartDescription={() => setSmartDescriptionEnabled(!smartDescriptionEnabled)}
                />
              )}
              {activeTab === 'mic' && (
                <MicrophoneInputCard
                  onTranscribedText={handleTextProcessing} // Use handleTextProcessing
                  onTranscriptionError={setTranscriptionError}
                  onClearMainInput={clearAllAppStates}
                  isTranscribing={isTranscribingAudio}
                  isProcessingOverall={isAnyProcessing}
                  currentTranscribedText={extractedText}
                  language={interfaceLanguage}
                />
              )}
              {/* YouTubeInput is no longer rendered directly here, only the modal is triggered */}
              {activeTab === 'youtube' && !showYouTubeModal && (
                 <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 min-h-[300px]">
                   <Youtube className="w-12 h-12 text-slate-300 mb-4" />
                   <h3 className="text-lg font-medium text-slate-600 mb-2">{t.ytModalTitle}</h3>
                   <p className="text-slate-400 max-w-xs text-sm">{t.ytModalInstructions}</p>
                   <Button onClick={() => setShowYouTubeModal(true)} className="mt-4" icon={<Youtube className="w-4 h-4"/>}>
                     {t.ytButton}
                   </Button>
                 </div>
              )}
              {activeTab === 'text' && (
                <TextInputCard
                  onProcessText={handleTextProcessing}
                  onTextProcessingError={setErrorMsg} // Using general errorMsg
                  onClearMainInput={clearAllAppStates}
                  isProcessingOverall={isAnyProcessing}
                  currentTextInput={extractedText}
                  language={interfaceLanguage}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {uploadedFiles.length > 0 ? t.filesLoaded : (activeTab === 'youtube' ? t.videoProcessed : (activeTab === 'mic' ? t.audioTranscribed : t.textInputTitle))}
                  </h3>
                  <p className="text-xs text-slate-500">{t.readyToExtract}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  onClick={clearAllAppStates} 
                  disabled={isAnyProcessing}
                  className="flex-1 sm:flex-none"
                >
                  {t.changeInput}
                </Button>
                {uploadedFiles.length > 0 && (
                  <Button 
                    onClick={handleExtract} 
                    isLoading={status === AppStatus.PROCESSING}
                    disabled={(status === AppStatus.SUCCESS && extractedText.length > 0 && !translationError) || isAnyProcessing}
                    className="flex-1 sm:flex-none min-w-[140px]"
                    icon={smartDescriptionEnabled ? <ImageIcon className="w-4 h-4"/> : <ScanText className="w-4 h-4"/>}
                  >
                    {status === AppStatus.SUCCESS 
                      ? (smartDescriptionEnabled ? t.analyzeAgain : t.extractAgain) 
                      : (smartDescriptionEnabled ? t.analyzeImage : t.extractText)}
                  </Button>
                )}
              </div>
            </div>

            {currentDisplayError && (
               <div className="mb-6 flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                 <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                 <span>{currentDisplayError}</span>
               </div>
             )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
              <div className="min-h-[400px]">
                {uploadedFiles.length > 0 ? (
                  <div className="flex flex-col h-full gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-700">{t.uploadedFiles} ({uploadedFiles.length})</h3>
                        <Button 
                           variant="secondary" 
                           onClick={() => setIsCameraOpen(true)}
                           className="!py-1 !px-2 !text-xs h-7"
                           icon={<Camera className="w-3 h-3" />}
                        >
                          {t.addPhoto}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {uploadedFiles.map((fileData, index) => (
                          <UploadedFileCard
                            key={fileData.file.name + index}
                            fileData={fileData}
                            index={index}
                            onRemove={handleRemoveFile}
                            onSelect={setCurrentFileIndex}
                            isActive={index === currentFileIndex}
                            isProcessing={fileProcessingStatus[index] === 'processing'}
                            hasError={fileProcessingStatus[index] === 'error'}
                            isProcessed={fileProcessingStatus[index] === 'success'}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <PdfViewer fileData={uploadedFiles[currentFileIndex]} />
                    </div>
                  </div>
                ) : activeTab === 'youtube' ? ( // Display placeholder/button for YouTube if not already extracted
                   <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                   <Youtube className="w-12 h-12 text-slate-300 mb-4" />
                   <h3 className="text-lg font-medium text-slate-600 mb-2">{t.ytModalTitle}</h3>
                   <p className="text-slate-400 max-w-xs text-sm">{t.ytModalInstructions}</p>
                   <Button onClick={() => setShowYouTubeModal(true)} className="mt-4" icon={<Youtube className="w-4 h-4"/>}>
                     {t.ytButton}
                   </Button>
                 </div>
                ) : activeTab === 'mic' ? (
                  <MicrophoneInputCard
                    onTranscribedText={handleTextProcessing} // Use handleTextProcessing
                    onTranscriptionError={setTranscriptionError}
                    onClearMainInput={clearAllAppStates}
                    isTranscribing={isTranscribingAudio}
                    isProcessingOverall={isAnyProcessing}
                    currentTranscribedText={extractedText}
                    language={interfaceLanguage}
                  />
                ) : ( // Default to text input card if no files and no special active tab with a specific display
                  <TextInputCard
                    onProcessText={handleTextProcessing}
                    onTextProcessingError={setErrorMsg} // Using general errorMsg
                    onClearMainInput={clearAllAppStates}
                    isProcessingOverall={isAnyProcessing}
                    currentTextInput={extractedText}
                    language={interfaceLanguage}
                  />
                )}
              </div>

              <div className="min-h-[400px]">
                <ExtractionResult
                  text={extractedText}
                  podcastScript={podcastScript}
                  isPlaceholder={status === AppStatus.IDLE && !extractedText}
                  onGeneratePodcast={handleGeneratePodcast}
                  isGeneratingAudio={isGeneratingAudio}
                  audioUrl={audioUrl}
                  podcastGenerationStep={podcastGenerationStep}
                  generationProgress={generationProgress}
                  translatedText={translatedText}
                  onTranslate={handleTranslate}
                  isTranslating={isTranslating}
                  onToggleOriginal={() => setShowTranslatedText(false)}
                  isShowingTranslated={showTranslatedText}
                  translationError={translationError}
                  selectedTranslationLanguage={selectedTranslationLanguage}
                  
                  host1Voice={host1Voice}
                  setHost1Voice={setHost1Voice}
                  host2Voice={host2Voice}
                  setHost2Voice={setHost2Voice}
                  host1Name={host1Name}
                  host2Name={host2Name}
                  onDownloadText={(txt, name) => {
                     const element = document.createElement("a");
                     const file = new Blob([txt], {type: 'text/plain'});
                     element.href = URL.createObjectURL(file);
                     element.download = name;
                     document.body.appendChild(element);
                     element.click();
                     document.body.removeChild(element);
                  }}
                  language={interfaceLanguage}
                  smartDescriptionEnabled={smartDescriptionEnabled}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-slate-500 border-t border-slate-200 bg-white/80 backdrop-blur-md">
        <p>&copy; {new Date().getFullYear()} VD super OCR PDF.</p>
      </footer>
    </div>
  );
}