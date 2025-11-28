export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ExtractionResult {
  text: string;
  confidence?: number;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
}

export type InputTab = 'files' | 'mic' | 'youtube' | 'text'; // Added 'text'