import React, { useState, useEffect, useCallback } from 'react';
import { fileToBase64, extractTextFromPdf, generatePodcastScript, generatePodcastAudio, translateText } from './services/geminiService';
import { AppStatus, FileData } from './types';
import { FileUploader } from './components/FileUploader';
import { PdfPreview } from './components/PdfPreview';
import { ExtractionResult } from './components/ExtractionResult';
import { Button } from './components/Button';
import { ScanText, Loader2, AlertCircle } from './components/Icons';
import { MicrophoneInputCard } from './components/MicrophoneInputCard'; // Import the new component

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Audio Podcast State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastGenerationStep, setPodcastGenerationStep] = useState<'script' | 'audio' | 'complete' | 'error' | null>(null);
  const [host1Voice, setHost1Voice] = useState<string>('Puck');
  const [host2Voice, setHost2Voice] = useState<string>('Kore');

  // Translation State
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslatedText, setShowTranslatedText] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Microphone/Transcription State
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Determine host names based on current language context
  const isRussian = showTranslatedText;
  const host1Name = isRussian ? "Виктор" : "Viktor";
  const host2Name = isRussian ? "Юлия" : "Julia";

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileData?.previewUrl) {
        URL.revokeObjectURL(fileData.previewUrl);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [fileData, audioUrl]);

  const clearAllAppStates = useCallback(() => {
    if (fileData?.previewUrl) {
      URL.revokeObjectURL(fileData.previewUrl);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setFileData(null);
    setExtractedText("");
    setAudioUrl(null);
    setPodcastGenerationStep(null);
    setTranslatedText(null);
    setShowTranslatedText(false);
    setTranslationError(null);
    setIsTranscribingAudio(false);
    setTranscriptionError(null);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  }, [fileData, audioUrl]);

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.UPLOADING);
    clearAllAppStates(); // Clear all existing states, including microphone related
    setErrorMsg(null);

    try {
      const previewUrl = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      
      setFileData({
        file,
        previewUrl,
        base64
      });
      setStatus(AppStatus.IDLE);
    } catch (e) {
      console.error("File processing error", e);
      setErrorMsg("Failed to process the file. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleClearInput = useCallback(() => { // Renamed from handleClearFile for broader use
    clearAllAppStates();
  }, [clearAllAppStates]);

  const handleExtract = async () => {
    if (!fileData) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    setAudioUrl(null); // Reset audio on new extraction
    setPodcastGenerationStep(null); // Reset podcast step on new extraction
    setTranslatedText(null); // Reset translation on new extraction
    setShowTranslatedText(false);
    setTranslationError(null); // Reset translation error
    setTranscriptionError(null); // Reset transcription error

    try {
      const text = await extractTextFromPdf(fileData.base64);
      setExtractedText(text);
      setStatus(AppStatus.SUCCESS);
    } catch (e: any) {
      console.error("Extraction error", e);
      const msg = e.message || "An unexpected error occurred during extraction.";
      setErrorMsg(msg.includes('429') ? "Too many requests. Please wait a moment and try again." : msg);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGeneratePodcast = async () => {
    if (!extractedText && !translatedText) return; // Ensure there's text to work with

    setIsGeneratingAudio(true);
    setTranslationError(null); // Clear previous errors (including podcast-related)
    setTranscriptionError(null); // Clear transcription errors as well
    setPodcastGenerationStep('script'); // Start with script generation step

    try {
      const textForPodcast = showTranslatedText && translatedText ? translatedText : extractedText;
      const podcastGenerationLanguage: 'English' | 'Russian' = showTranslatedText ? 'Russian' : 'English';

      // Step 1: Generate Script
      const script = await generatePodcastScript(textForPodcast, podcastGenerationLanguage, host1Name, host2Name);
      if (!script) {
        throw new Error("Failed to generate podcast script: The AI did not return a valid script.");
      }
      
      setPodcastGenerationStep('audio'); // Update step to audio synthesis

      // Step 2: Synthesize Audio
      const url = await generatePodcastAudio(script, host1Voice, host2Voice, host1Name, host2Name);
      setAudioUrl(url);
      setPodcastGenerationStep('complete'); // Podcast generation complete
    } catch (e: any) {
      console.error("Podcast Generation error", e);
      const msg = e.message || "Failed to generate podcast due to an unexpected error.";
      setTranslationError(msg); // Use translationError for podcast errors for simplicity
      setPodcastGenerationStep('error'); // Mark as error
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleTranslate = async () => {
    if (!extractedText) return;

    setIsTranslating(true);
    setTranslationError(null); 
    setTranscriptionError(null); // Clear transcription errors

    try {
      const russianText = await translateText(extractedText, "Russian");
      setTranslatedText(russianText);
      setShowTranslatedText(true);
    } catch (e: any) {
      console.error("Translation error", e);
      const msg = e.message || "Failed to translate text to Russian.";
      setTranslationError(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleOriginal = () => {
    setShowTranslatedText(false);
    setTranslationError(null); // Clear translation error when switching back
  };

  // Handlers for MicrophoneInputCard
  const handleTranscribedText = useCallback((text: string) => {
    // Note: clearAllAppStates is called *before* starting transcription in MicrophoneInputCard
    // so we just need to set the text here.
    setExtractedText(text);
    setStatus(AppStatus.SUCCESS);
    setIsTranscribingAudio(false);
    // Reset other states that might be related to previous PDF or translation
    setFileData(null);
    setTranslatedText(null);
    setShowTranslatedText(false);
    setTranslationError(null);
    setPodcastGenerationStep(null);
    setAudioUrl(null);
  }, []);

  const handleTranscriptionError = useCallback((error: string) => {
    setTranscriptionError(error);
    setIsTranscribingAudio(false);
    setStatus(AppStatus.ERROR);
  }, []);

  // This clear is called by MicrophoneInputCard when its internal "Clear Audio Input" button is pressed.
  const handleClearMicrophoneInput = useCallback(() => {
    clearAllAppStates(); 
  }, [clearAllAppStates]);

  const currentDisplayError = errorMsg || translationError || transcriptionError;
  const isAnyProcessing = status === AppStatus.PROCESSING || isGeneratingAudio || isTranslating || isTranscribingAudio;
  const showInitialInputChoice = !fileData && !extractedText; // Show choice if neither PDF nor extracted text is present (from PDF or mic)

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ScanText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-800">
              Gemini PDF OCR
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero / Upload / Microphone Section */}
        {showInitialInputChoice && ( // Show choice if neither PDF nor mic text is present
          <div className="max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                Extract text from PDFs <br/>
                <span className="text-primary">instantly with AI</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload your scanned documents or PDFs (up to 50MB) or use your microphone to transcribe audio into text. Our advanced AI will process your content.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-100">
                <FileUploader onFileSelect={handleFileSelect} error={currentDisplayError} />
              </div>
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-100">
                <MicrophoneInputCard
                  onTranscribedText={handleTranscribedText}
                  onTranscriptionError={handleTranscriptionError}
                  onClearMainInput={handleClearInput} // Use general clear function
                  isTranscribing={isTranscribingAudio}
                  isProcessingOverall={isAnyProcessing}
                  currentTranscribedText={extractedText}
                />
              </div>
            </div>
          </div>
        )}

        {/* Workspace Section */}
        {(!showInitialInputChoice || fileData || (extractedText && !fileData)) && ( // Show workspace if either PDF or extracted text is present (but not the initial choice screen)
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {fileData ? 'Document Loaded' : 'Audio Transcribed'}
                  </h3>
                  <p className="text-xs text-slate-500">Ready to process</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  onClick={handleClearInput} 
                  disabled={isAnyProcessing}
                  className="flex-1 sm:flex-none"
                >
                  Change Input
                </Button>
                {fileData && ( // Only show extract button if a PDF is loaded
                  <Button 
                    onClick={handleExtract} 
                    isLoading={status === AppStatus.PROCESSING}
                    disabled={(status === AppStatus.SUCCESS && extractedText.length > 0 && !translationError && !transcriptionError) || isAnyProcessing}
                    className="flex-1 sm:flex-none min-w-[140px]"
                    icon={<ScanText className="w-4 h-4"/>}
                  >
                    {status === AppStatus.SUCCESS ? 'Extract Again' : 'Extract Text'}
                  </Button>
                )}
                 {extractedText && !fileData && ( // Show a "Re-transcribe" or "Clear Transcription" button for microphone input
                  <Button
                    onClick={() => { /* Optionally implement re-transcribe or clear current mic input */ }}
                    disabled={true} // For now, disable if we want to force re-record
                    variant="outline"
                    className="flex-1 sm:flex-none min-w-[140px]"
                    icon={<ScanText className="w-4 h-4" />}
                  >
                    Transcribed
                  </Button>
                 )}
              </div>
            </div>

            {/* Error Message for Extraction Failures */}
            {currentDisplayError && (
               <div className="mb-6 flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                 <span>{currentDisplayError}</span>
               </div>
             )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
              {/* Left Column: PDF Preview or Microphone Card */}
              <div className="min-h-[400px]">
                {fileData ? (
                  <PdfPreview file={fileData.file} previewUrl={fileData.previewUrl} onClear={handleClearInput} />
                ) : (
                  <MicrophoneInputCard
                    onTranscribedText={handleTranscribedText}
                    onTranscriptionError={handleTranscriptionError}
                    onClearMainInput={handleClearInput}
                    isTranscribing={isTranscribingAudio}
                    isProcessingOverall={isAnyProcessing}
                    currentTranscribedText={extractedText}
                  />
                )}
              </div>

              {/* Right Column: Extraction Result */}
              <div className="min-h-[400px]">
                <ExtractionResult
                  text={extractedText}
                  isPlaceholder={status === AppStatus.IDLE && extractedText.length === 0}
                  onGeneratePodcast={handleGeneratePodcast}
                  isGeneratingAudio={isGeneratingAudio}
                  audioUrl={audioUrl}
                  podcastGenerationStep={podcastGenerationStep}
                  translatedText={translatedText}
                  onTranslate={handleTranslate}
                  isTranslating={isTranslating}
                  onToggleOriginal={handleToggleOriginal}
                  isShowingTranslated={showTranslatedText}
                  translationError={translationError} // Pass translation-related error here
                  
                  // New Props for voice selection
                  host1Voice={host1Voice}
                  setHost1Voice={setHost1Voice}
                  host2Voice={host2Voice}
                  setHost2Voice={setHost2Voice}
                  host1Name={host1Name}
                  host2Name={host2Name}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-slate-500 border-t border-slate-200 bg-white/80 backdrop-blur-md">
        <p>&copy; {new Date().getFullYear()} Gemini PDF OCR. All rights reserved.</p>
      </footer>
    </div>
  );
}