import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { Mic, Loader2, Play, Pause, X, AlertCircle, Ear } from './Icons';
import { transcribeAudio } from '../services/geminiService';

interface MicrophoneInputCardProps {
  onTranscribedText: (text: string) => void;
  onTranscriptionError: (error: string) => void;
  onClearMainInput: () => void; // Callback to clear other input methods (like PDF)
  isTranscribing: boolean;
  isProcessingOverall: boolean; // Disable controls if app is busy
  currentTranscribedText: string; // The text that App.tsx currently holds from mic input
}

export const MicrophoneInputCard: React.FC<MicrophoneInputCardProps> = ({
  onTranscribedText,
  onTranscriptionError,
  onClearMainInput,
  isTranscribing,
  isProcessingOverall,
  currentTranscribedText,
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


  // Cleanup recorded audio URL when component unmounts or blob changes
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const requestMicrophonePermissionAndStartRecording = useCallback(async () => {
    setMicrophonePermissionError(null);
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setAudioChunks([]); // Clear chunks for next recording
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      onClearMainInput(); // Clear PDF or previous transcription when starting new recording
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError") {
        setMicrophonePermissionError("Microphone access denied. Please allow microphone in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setMicrophonePermissionError("No microphone found. Please connect a microphone.");
      } else {
        setMicrophonePermissionError("Microphone access failed. Please try again.");
      }
      setIsRecording(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [audioChunks, onClearMainInput]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop microphone stream
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  const handleTranscribe = useCallback(async () => {
    if (!recordedAudioBlob) return;

    onTranscriptionError(null); // Clear previous transcription errors

    try {
      // Set transcribing state in App.tsx via callback
      onTranscribedText(''); // Clear existing text in App.tsx's `extractedText` as we're starting new transcription
      onTranscriptionError(null); // Clear previous errors
      // The `isTranscribing` prop from parent (App.tsx) will handle the loading state here.

      const base64Audio = await blobToBase64(recordedAudioBlob);
      const transcribedText = await transcribeAudio(base64Audio, recordedAudioBlob.type);
      onTranscribedText(transcribedText);
    } catch (err: any) {
      console.error("Transcription error:", err);
      onTranscriptionError(err.message || "Failed to transcribe audio.");
    }
  }, [recordedAudioBlob, onTranscribedText, onTranscriptionError]);

  const handleClear = useCallback(() => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setMediaRecorder(null);
    setIsRecording(false);
    setAudioChunks([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setMicrophonePermissionError(null);
    onClearMainInput(); // Clear main extracted text (App.tsx's `extractedText`)
  }, [recordedAudioUrl, onClearMainInput]);

  const togglePlayback = () => {
    if (!audioPlaybackRef.current) return;

    if (isPlayingRecorded) {
      audioPlaybackRef.current.pause();
    } else {
      audioPlaybackRef.current.play();
    }
    setIsPlayingRecorded(!isPlayingRecorded);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URI prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const isAnyProcessing = isTranscribing || isProcessingOverall || isRequestingPermission;

  // Show transcription buttons only if we have recorded audio and no text from microphone is currently active
  // This means `currentTranscribedText` is empty, or we just recorded new audio.
  const showTranscriptionControls = recordedAudioBlob && !currentTranscribedText;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 gap-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Mic className="w-5 h-5 text-primary" /> Audio Input
      </h3>
      <p className="text-sm text-slate-600">
        Record your voice to generate text for transcription, translation, or podcast creation.
      </p>

      {microphonePermissionError && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{microphonePermissionError}</span>
        </div>
      )}

      {/* Show record/stop button if no recorded audio, or if recorded audio but currentTranscribedText is not from *this* audio yet */}
      {(!recordedAudioBlob || currentTranscribedText === '') && (
        <Button
          onClick={isRecording ? stopRecording : requestMicrophonePermissionAndStartRecording}
          isLoading={isRequestingPermission || (isRecording && audioChunks.length === 0)}
          disabled={isAnyProcessing}
          variant={isRecording ? 'danger' : 'primary'}
          icon={isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          className="w-full"
        >
          {isRequestingPermission ? 'Requesting Mic...' : (isRecording ? 'Stop Recording' : 'Start Recording')}
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-700 animate-pulse">
          <Mic className="w-4 h-4 mr-2" /> Recording...
        </div>
      )}

      {recordedAudioBlob && ( // Show recorded audio and transcribe/clear options
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Ear className="w-4 h-4 text-slate-500"/> Recorded Audio
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={togglePlayback}
                    className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    aria-label={isPlayingRecorded ? "Pause audio" : "Play audio"}
                    disabled={isTranscribing}
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
          {/* Only show Transcribe button if no text has been extracted from this recorded audio yet, 
              or if the main input was cleared and we want to transcribe this again. */}
          {currentTranscribedText === '' && (
            <Button
              onClick={handleTranscribe}
              isLoading={isTranscribing}
              disabled={isAnyProcessing || !recordedAudioBlob}
              variant="primary"
              icon={<Ear className="w-4 h-4" />}
              className="w-full"
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
            </Button>
          )}
          <Button
            onClick={handleClear}
            disabled={isAnyProcessing}
            variant="secondary"
            icon={<X className="w-4 h-4" />}
            className="w-full"
          >
            Clear Audio Input
          </Button>
        </div>
      )}
    </div>
  );
};