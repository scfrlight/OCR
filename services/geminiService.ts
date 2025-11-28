

import { GoogleGenAI, Modality } from "@google/genai";

// Declare Mammoth globally as it is loaded via CDN
declare var mammoth: any;

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts text from a document or describes an image.
 */
export const extractTextFromDocument = async (
  base64Data: string, 
  mimeType: string,
  mode: 'extract' | 'describe' = 'extract',
  language: string = 'English'
): Promise<string> => {
  try {
    const isPdf = mimeType === 'application/pdf';
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isTxt = mimeType === 'text/plain';
    const isImage = mimeType.startsWith('image/');
    
    // Base prompt instructions for table handling
    const tableInstruction = `
      IMPORTANT: If the document contains tables, do not just transcribe the raw rows and columns. 
      Analyze the data within the tables and provide a detailed textual description of the table's contents. 
      Describe trends, relationships between data points, and key insights as if a human expert were explaining the table in a report. 
      Integrate this analysis naturally into the flow of the text.
    `;

    let systemPrompt = `You are an advanced OCR engine. Extract the content from this document. ${tableInstruction} Preserve the original paragraph structure using Markdown.`;
    
    // Custom prompt for Smart Image Description
    if (isImage && mode === 'describe') {
      systemPrompt = `
        You are an advanced visual analysis AI.
        Task: Provide an extremely detailed description of this image in ${language}.
        
        Instructions:
        1. Identify and describe every visual element, object, and person in the photo.
        2. Describe colors, lighting, style, and context.
        3. If there is text in the image, transcribe it naturally as part of the description (e.g., "The sign says...").
        4. Be descriptive and exhaustive. Do not miss small details.
        5. Write the response entirely in ${language}.
      `;
    } else if (isImage) {
      // Standard OCR for image
      systemPrompt = `You are an advanced OCR engine. Extract all visible text from this image. ${tableInstruction} Return only the extracted text and analysis.`;
    }

    let contents: any = {};

    if (isPdf) {
      systemPrompt = `You are an advanced OCR engine. Extract only the main body text from this PDF document. ${tableInstruction} Explicitly omit headers, footers, page numbers, and colontitles. Return only the extracted text and table analysis.`;
      contents = {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: systemPrompt }
        ]
      };
    } else if (isDocx) {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
      systemPrompt = `You are an advanced document analyzer. The following is the HTML content of a Word document. Extract the main text. ${tableInstruction} Ignore HTML tags in the output, just give the formatted text and analysis.`;
      
      contents = {
        parts: [
          { text: systemPrompt },
          { text: `Document Content (HTML):\n${html}` }
        ]
      };
    } else {
      // Image
      contents = {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: systemPrompt }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        temperature: mode === 'describe' ? 0.6 : 0.1, 
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text was extracted/generated from the document.");
    }

    return text;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};

/**
 * Extracts/Downloads text from a YouTube video or Playlist URL using Google Search Grounding.
 */
export const extractTextFromYouTube = async (input: string, language: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert content extractor for YouTube videos. Your task is to provide a comprehensive text document based on the given input, in ${language}.

      Input: "${input}"

      Your output must contain two clearly distinct sections:
      1.  **Detailed Video Content**: A synthesized, long-form, and highly detailed analysis or full transcript of the video's content. Elaborate on key points, discussions, and technical details. This section should be as extensive and detailed as possible, akin to a thorough research paper or detailed lecture notes, without timestamps or speaker labels.
      2.  **Raw Subtitle Text**: The *entire, unedited, verbatim* subtitle text available for the video, specifically in ${language}. Do NOT summarize, rephrase, or interpret this section. It must be a direct, continuous dump of the text. If multiple segments are found, concatenate them without alteration. If the raw subtitle text is not available in ${language} after exhaustive searching, state: "Not available in ${language}".

      Instructions for extraction:
      -   First, identify the most relevant YouTube video based on the input (URL or title).
      -   Use the 'googleSearch' tool to find the video's exact title, creator, and original URL.
      -   For "Detailed Video Content": Prioritize finding full transcripts or very detailed summaries. If a complete transcript is not available, meticulously combine information from multiple reliable textual sources (e.g., video descriptions, detailed blog posts, reviews that deeply analyze the video's content) to reconstruct the video's narrative as comprehensively as possible. This section is about understanding and synthesizing the *meaning* and *information* from the video.
      -   For "Raw Subtitle Text": Actively search for and extract the raw, continuous subtitle text *specifically* in ${language}. This might involve searching for "YouTube [video title] transcript ${language}" or similar queries. If found, provide it as a plain, continuous block of text, exactly as it appears. If absolutely no raw subtitles are found in ${language} after exhaustive searching, explicitly state: "Not available in ${language}". This section is a direct data retrieval task, not a generative task.
      -   Filter out irrelevant search results, such as "YouTube title generators," video editing tools, or unrelated articles; focus only on results providing actual video content, related textual analysis, or raw subtitle files.

      OUTPUT FORMAT (in ${language}):
      ---
      **Video Title**: [Exact Video Title from identified video]
      **Channel/Creator**: [Exact Channel/Creator Name from identified video]
      **Original URL**: [Full YouTube URL of identified video]

      **Detailed Video Content**:
      [Start the comprehensive, in-depth text here. Ensure it's a long-form, polished document representing the video's narrative or information. Maintain paragraph structure and important details. If content was synthesized from multiple sources, ensure a seamless flow and high level of detail.]

      **Raw Subtitle Text (${language})**:
      [Provide the entire, unedited, verbatim subtitle text found for the video in ${language}, as a continuous block of plain text without timestamps or speaker labels. If no raw subtitles are found in ${language}, explicitly state: "Not available in ${language}".]
      ---
    `;

    // We use gemini-2.5-flash as it is highly effective with Search Grounding
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Could not retrieve content. Please check if the video is public or try a different link/title.");
    }
    
    return text;
  } catch (error) {
    console.error("YouTube Extraction Error:", error);
    throw error;
  }
};

const introPhrases: { [key: string]: string } = {
  English: "This is a Deep Dive.",
  Russian: "Это глубокий разбор.",
  Slovak: "Toto je hĺbkový rozbor.",
};

export const generatePodcastScript = async (
  text: string, 
  targetLanguage: 'English' | 'Russian' | 'Slovak', 
  host1Name: string,
  host2Name: string
): Promise<string> => {
  try {
    const safeText = text.length > 800000 ? text.substring(0, 800000) + "...[truncated]" : text;
    // introPhrase is used to prime the model, but we tell it to be natural below
    const introPhrase = introPhrases[targetLanguage] || introPhrases['English'];

    const prompt = `
      Act as an AI Podcast Generator creating a "Deep Dive" Audio Overview (similar to NotebookLM).
      The podcast is by VD.

      SOURCE MATERIAL:
      ${safeText}
      
      HOSTS:
      1. ${host1Name} (Male): The "Guide". Energetic, curious, sets the stage. Loves a good metaphor.
      2. ${host2Name} (Female): The "Analyst". Sharp, thoughtful, connects the dots. Asks "Wait, seriously?" to clarify points.
      
      STYLE & TONE INSTRUCTIONS (CRITICAL):
      - **Conversational Realism**: Use fillers naturally ("Um", "Like", "You know", "I mean"). 
      - **No "Hello and Welcome"**: Start mid-thought or with a strong hook. E.g., "So, I was reading this document, and honestly, it completely changed how I think about X."
      - **Dynamic Flow**: Interrupt each other politely. "Wait, hang on, are you saying..." 
      - **Analogies**: Explain complex data using everyday situations. "It's like buying a gym membership but never going."
      - **Reactions**: If the text has a surprising fact, REACT to it. Don't just read it.
      - **Deep Dive**: Do not just summarize. Pick the most interesting insights and drill down into *why* they matter. Provide a full, important, and detailed overview of the initial text content without any shortcuts.
      
      TASK:
      Generate a script in ${targetLanguage} that sounds exactly like two smart friends discussing this content over coffee.
      
      FORMAT:
      ${host1Name}: [Text]
      ${host2Name}: [Text]
    `;

    // Use gemini-3-pro-preview for maximum creative writing capability and context understanding
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.75, // High temperature for natural, varied speech patterns
      }
    });

    const script = response.text;
    if (!script || script.trim().length === 0) {
      throw new Error("Failed to generate podcast script.");
    }

    return script;
  } catch (error) {
    console.error("Script Generation Error:", error);
    throw error;
  }
};

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
        parts: [{ text: `TTS the following conversation between ${host1Name} and ${host2Name}. Speak naturally/informally:\n\n${script}` }]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: host1Name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: host1Voice } } // Dynamic voice
              },
              {
                speaker: host2Name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: host2Voice } } // Dynamic voice
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio content generated.");

    const pcmData = base64ToUint8Array(base64Audio);
    const wavBlob = pcmToWav(pcmData, 24000, 1); 
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("Audio Generation Error:", error);
    throw error;
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const prompt = `Translate the following text into ${targetLanguage}. Preserve the original formatting. Do not add any remarks:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    return response.text || "";
  } catch (error) {
    console.error(`Translation to ${targetLanguage} Error:`, error);
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Audio } },
          { text: "Transcribe the audio accurately. Focus on the spoken content and return only the transcribed text." }
        ],
      },
      config: { temperature: 0.1 },
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw error;
  }
};

// Declare `bytes` variable
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
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true);
  wavBuffer.set(pcmData, 44);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Counts words in a given string.
 * @param text The input string.
 * @returns The number of words.
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  // Use a regex to split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
};