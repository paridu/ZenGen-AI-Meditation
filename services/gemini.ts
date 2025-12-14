import { GoogleGenAI, Type, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

// Helper to get API key safely
const getApiKey = () => process.env.API_KEY || '';

// 1. Generate Meditation Script (Thai)
export const generateMeditationScript = async (mood: string, duration: number, focus: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `Create a guided meditation script in THAI Language (ภาษาไทย). 
  Mood: ${mood}. 
  Focus: ${focus}. 
  Target Duration: ${duration} minutes. 
  
  Return a JSON object with:
  1. 'title': A creative title for the session in Thai.
  2. 'script': The full spoken text script in Thai. It should be soothing, paced, and natural.
  3. 'imagePrompt': A detailed visual description to generate an accompanying image (abstract, calming, nature-based, minimal).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ['title', 'script', 'imagePrompt']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

// 2. Generate Image
export const generateMeditationImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt + ", spiritual, soft lighting, high quality, 4k, abstract art style" }]
    },
    config: {
      // No schema for image models
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// 3. Generate Speech (TTS)
export const generateMeditationAudio = async (text: string, voiceName: string = 'Kore') => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // Note: Current preview-tts models primarily support English. 
  // We send Thai text, it might try to read it or fall back. 
  // Ideally, we would use a Thai-specific model, but we will use the available one.
  // We prompt the model to speak Thai if possible.
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) throw new Error("No audio data generated");
  
  return base64Audio; 
};

// 4. Chat Bot (Thai context)
export const sendChatMessage = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "คุณคือผู้เชี่ยวชาญด้านการฝึกสติและการทำสมาธิ ตอบคำถามเป็นภาษาไทย ด้วยน้ำเสียงที่สงบ นุ่มนวล และให้คำแนะนำที่เป็นประโยชน์"
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};

// 5. Live API Connector (Thai context)
export const connectLiveSession = async (
  onOpen: () => void,
  onMessage: (message: any) => void,
  onClose: (event: CloseEvent) => void,
  onError: (event: ErrorEvent) => void
) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      },
      systemInstruction: "คุณคือโค้ชฝึกสมาธิส่วนตัว พูดคุยกับผู้ใช้เป็นภาษาไทย รับฟังและแนะนำเทคนิคการหายใจสั้นๆ หรือตอบคำถามเกี่ยวกับสติ ด้วยน้ำเสียงที่ผ่อนคลาย",
    }
  });
};