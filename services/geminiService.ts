import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the Gemini API client
// The API key is guaranteed to be in process.env.API_KEY per the runtime environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts text from a PDF file using Gemini 2.5 Flash, focusing on main content.
 */
export const extractTextFromPdf = async (base64Data: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          },
          {
            text: "You are an advanced OCR engine. Extract only the main body text from this PDF document, focusing on narrative content suitable for an audio summary. Explicitly omit headers, footers, page numbers, colontitles, and structured data like tables or figures. Return only the extracted text, preserving its original paragraph and list structure using Markdown formatting. Do not summarize or truncate; extract everything up to 50,000 words if present."
          }
        ]
      },
      config: {
        temperature: 0.1, // Low temperature for more deterministic/factual output
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text was extracted from the document.");
    }

    return text;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};

const introPhrases: { [key: string]: string } = {
  English: "This is VD podcast.",
  Russian: "Это VD подкаст.",
};

/**
 * Generates a podcast script from the extracted text in a specified language.
 */
export const generatePodcastScript = async (
  text: string, 
  targetLanguage: 'English' | 'Russian',
  host1Name: string,
  host2Name: string
): Promise<string> => {
  try {
    // Truncate text if extremely long to avoid context limits, though 1M is large.
    // Safe guard at 300k chars (~50-60k words)
    const safeText = text.length > 300000 ? text.substring(0, 300000) + "...[truncated]" : text;
    const introPhrase = introPhrases[targetLanguage] || introPhrases['English']; // Default to English if language not found

    const prompt = `
      ${introPhrase}
      Based on the following document text, create a "Deep Dive" podcast conversation script between two hosts, '${host1Name}' and '${host2Name}', in ${targetLanguage}.
      
      The podcast should:
      1. Be engaging, lively, and conversational (similar to popular tech podcasts).
      2. Summarize the key insights and most important details of the document.
      3. Use analogies and simple language to explain complex topics.
      4. Have the hosts banter slightly and ask each other clarifying questions.
      5. The conversation should be substantial but focused (approx 5-10 minutes spoken).

      Format the output strictly as a dialogue:
      ${host1Name}: [Line]
      ${host2Name}: [Line]
      ...

      Document Text:
      ${safeText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    const script = response.text;
    if (!script || script.trim().length === 0) {
      throw new Error("Failed to generate podcast script. The AI returned an empty or malformed script.");
    }

    return script;
  } catch (error) {
    console.error("Script Generation Error:", error);
    throw error;
  }
};

/**
 * Generates audio from a dialogue script using Gemini TTS.
 * Returns a Blob URL for a WAV file.
 */
export const generatePodcastAudio = async (
  script: string, 
  host1Voice: string, 
  host2Voice: string,
  host1Name: string,
  host2Name: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: `TTS the following conversation between ${host1Name} and ${host2Name}:\n\n${script}` }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: host1Name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: host1Voice } }
              },
              {
                speaker: host2Name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: host2Voice } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio || base64Audio.trim().length === 0) {
      throw new Error("No audio content generated. The TTS model did not return any audio data.");
    }

    // Convert Base64 PCM to WAV Blob
    const pcmData = base64ToUint8Array(base64Audio);
    const wavBlob = pcmToWav(pcmData, 24000, 1); // 24kHz mono is standard for this model output
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("Audio Generation Error:", error);
    throw error;
  }
};

/**
 * Translates the given text into the target language.
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const prompt = `Translate the following text into ${targetLanguage}. Preserve the original formatting (paragraphs, lists) as much as possible. Do not add any introductory or concluding remarks, just the translated text:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for more accurate translation
      }
    });

    const translated = response.text;
    if (!translated) {
      throw new Error("No translation was generated.");
    }

    return translated;
  } catch (error) {
    console.error(`Translation to ${targetLanguage} Error:`, error);
    throw error;
  }
};

/**
 * Transcribes audio from a base64 encoded audio blob to text using Gemini 2.5 Flash.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the audio accurately. Focus on the spoken content and return only the transcribed text. Do not add any introductory or concluding remarks.",
          },
        ],
      },
      config: {
        temperature: 0.1, // Low temperature for accurate transcription
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text was transcribed from the audio.");
    }

    return text;
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw error;
  }
};


// --- Utils for Audio ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob {
  const bufferLength = pcmData.length;
  const headerLength = 44;
  const wavBuffer = new Uint8Array(headerLength + bufferLength);
  const view = new DataView(wavBuffer.buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + bufferLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, bufferLength, true);

  // write the PCM samples
  wavBuffer.set(pcmData, 44);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}