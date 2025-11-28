import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, Check, AlertCircle, Loader2 } from './Icons';
import { Button } from './Button';

interface CameraCaptureModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      let msg = "Could not access the camera.";
      if (err.name === 'NotAllowedError') msg = "Camera access denied. Please allow permissions.";
      if (err.name === 'NotFoundError') msg = "No camera found on this device.";
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert data URL to File object
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Take Photo
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
          {error ? (
            <div className="text-center p-6 text-white">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p>{error}</p>
              <Button variant="secondary" onClick={startCamera} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
          ) : (
            <>
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-contain"
              />
            </>
          )}
          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-white border-t border-slate-100">
          {capturedImage ? (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleRetake} className="flex-1">
                Retake
              </Button>
              <Button onClick={handleConfirm} className="flex-1" icon={<Check className="w-4 h-4" />}>
                Use Photo
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
               <button
                 onClick={handleCapture}
                 disabled={isInitializing || !!error}
                 className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center hover:border-primary transition-colors focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
               >
                 <div className="w-12 h-12 bg-primary rounded-full group-hover:scale-90 transition-transform" />
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};