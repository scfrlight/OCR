


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { Mic, Loader2, Play, Pause, X, AlertCircle, Ear } from './Icons';
import { transcribeAudio, countWords } from '../services/geminiService'; // Import countWords
import { translations, Language } from '../utils/translations';

interface MicrophoneInputCardProps {
  onTranscribedText: (text: string) => void;
  onTranscriptionError: (error: string) => void;
  onClearMainInput: () => void;
  isTranscribing: boolean;
  isProcessingOverall: boolean;
  currentTranscribedText: string;
  language: Language;
}

export const MicrophoneInputCard: React.FC<MicrophoneInputCardProps> = ({
  onTranscribedText,
  onTranscriptionError,
  onClearMainInput,
  isTranscribing,
  isProcessingOverall,
  currentTranscribedText,
  language
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  
  const t = translations[language];
  const wordCount = countWords(currentTranscribedText);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const requestMicrophonePermissionAndStartRecording = useCallback(async () => {
    setMicrophonePermissionError(null);
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => setAudioChunks((prev) => [...prev, event.data]);
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        setAudioChunks([]);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      onClearMainInput();
    } catch (err: any) {
      setMicrophonePermissionError("Microphone access denied.");
      setIsRecording(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [audioChunks, onClearMainInput]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  const handleTranscribe = useCallback(async () => {
    if (!recordedAudioBlob) return;
    onTranscribedText('');
    onTranscriptionError('');
    try {
      const base64Audio = await blobToBase64(recordedAudioBlob);
      const transcribedText = await transcribeAudio(base64Audio, recordedAudioBlob.type);
      onTranscribedText(transcribedText);
    } catch (err: any) {
      onTranscriptionError(err.message || "Failed to transcribe audio.");
    }
  }, [recordedAudioBlob, onTranscribedText, onTranscriptionError]);

  const handleClear = useCallback(() => {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setMediaRecorder(null);
    setIsRecording(false);
    setAudioChunks([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setMicrophonePermissionError(null);
    onClearMainInput();
  }, [recordedAudioUrl, onClearMainInput]);

  const togglePlayback = () => {
    if (!audioPlaybackRef.current) return;
    isPlayingRecorded ? audioPlaybackRef.current.pause() : audioPlaybackRef.current.play();
    setIsPlayingRecorded(!isPlayingRecorded);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 gap-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Mic className="w-5 h-5 text-primary" /> {t.micTitle}
      </h3>
      <p className="text-sm text-slate-600">{t.micDesc}</p>

      {microphonePermissionError && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{microphonePermissionError}</span>
        </div>
      )}

      {(!recordedAudioBlob || currentTranscribedText === '') && (
        <Button
          onClick={isRecording ? stopRecording : requestMicrophonePermissionAndStartRecording}
          isLoading={isRequestingPermission || (isRecording && audioChunks.length === 0)}
          disabled={isProcessingOverall}
          variant={isRecording ? 'danger' : 'primary'}
          icon={isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          className="w-full"
        >
          {isRequestingPermission ? t.requestMic : (isRecording ? t.stopRecord : t.startRecord)}
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-700 animate-pulse">
          <Mic className="w-4 h-4 mr-2" /> Recording...
        </div>
      )}

      {recordedAudioBlob && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Ear className="w-4 h-4 text-slate-500"/> {t.recordedAudio}
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={togglePlayback}
                    className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    {isPlayingRecorded ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <audio
                    ref={audioPlaybackRef}
                    src={recordedAudioUrl || ''}
                    onEnded={() => setIsPlayingRecorded(false)}
                    onPlay={() => setIsPlayingRecorded(true)}
                    onPause={() => setIsPlayingRecorded(false)}
                    className="hidden"
                />
            </div>
          </div>
          {currentTranscribedText === '' && (
            <Button
              onClick={handleTranscribe}
              isLoading={isTranscribing}
              disabled={isProcessingOverall || !recordedAudioBlob}
              variant="primary"
              icon={<Ear className="w-4 h-4" />}
              className="w-full"
            >
              {t.transcribe}
            </Button>
          )}
          <Button
            onClick={handleClear}
            disabled={isProcessingOverall}
            variant="secondary"
            icon={<X className="w-4 h-4" />}
            className="w-full"
          >
            {t.clearMic}
          </Button>
          {currentTranscribedText && (
            <p className="text-right text-xs text-slate-500 mt-1">
              {t.wordCount}: {wordCount}
            </p>
          )}
        </div>
      )}
    </div>
  );
};