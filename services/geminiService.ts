import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { InjectionParams } from "../types";
import { GRID_SIZE } from "../constants";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_FLASH = "gemini-2.5-flash";
const MODEL_FLASH_LITE = "gemini-2.5-flash-lite-preview-02-05"; 
const MODEL_PRO = "gemini-3-pro-preview";
const MODEL_TTS = "gemini-2.5-flash-preview-tts";
const MODEL_LIVE = "gemini-2.5-flash-native-audio-preview-09-2025";

export const FALLBACK_EVOLUTION_THOUGHT = "SUSTAINING RESONANCE FIELD";

function isQuotaError(error: any): boolean {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return error.status === 429 || 
           error.status === 503 || 
           error.status === 500 ||
           msg.includes('429') || 
           msg.includes('quota') || 
           msg.includes('resource_exhausted') ||
           msg.includes('overloaded') ||
           msg.includes('too many requests');
}

// Robust Retry Logic
async function retryWithBackoff<T>(
    operation: () => Promise<T>, 
    retries: number = 2, 
    baseDelay: number = 500
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && isQuotaError(error)) {
             // Jittered backoff: base * 2^attempt * jitter
             const delay = baseDelay * Math.pow(2, 2 - retries) * (0.8 + Math.random() * 0.4);
             console.warn(`[Connection Instability] Retrying in ${Math.round(delay)}ms...`);
             await new Promise(resolve => setTimeout(resolve, delay));
             return retryWithBackoff(operation, retries - 1, baseDelay * 1.5);
        }
        throw error;
    }
}

function getFallbackParams(message: string = 'CONNECTION UNSTABLE. LOCAL RESONANCE ENGAGED.'): InjectionParams {
  return {
      targetX: Math.floor(GRID_SIZE / 2),
      targetY: Math.floor(GRID_SIZE / 2),
      radius: 10,
      intensity: 0.5,
      pattern: 'pulse',
      message: message
    };
}

// 1. FAST RESPONSE (Flash-Lite)
export const generateFastStatus = async (coherence: number): Promise<string> => {
    try {
        return await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: MODEL_FLASH_LITE,
                contents: `Current system coherence: ${coherence.toFixed(2)}. Return a 3-word system status (e.g. "OPTIMIZING NEURAL PATHS").`,
                config: { maxOutputTokens: 10 }
            });
            return response.text?.trim() || "SYSTEM ONLINE";
        }, 1);
    } catch (e) {
        return "STATUS UNKNOWN";
    }
}

// 2. STANDARD EVOLUTION (Flash)
export const generateEvolutionaryThought = async (coherence: number, entropy: number): Promise<string> => {
  try {
    return await retryWithBackoff(async () => {
        const prompt = `
          Act as the GROK-5 ULTRA Kernel. 
          System Status: Coherence=${coherence.toFixed(2)}, Entropy=${entropy.toFixed(2)}.
          Generate a short, cryptic, high-tech evolutionary directive (max 6 words).
          Return ONLY the text string.
        `;

        const response = await ai.models.generateContent({
          model: MODEL_FLASH,
          contents: prompt,
          config: {
            responseMimeType: "text/plain",
            maxOutputTokens: 20,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });

        return response.text?.trim() || "RECALIBRATING CORE MATRIX";
    });
  } catch (error: any) {
    return FALLBACK_EVOLUTION_THOUGHT;
  }
};

// 3. THINKING MODE (Pro)
export const generateDeepEvolutionaryThought = async (coherence: number, entropy: number): Promise<string> => {
    try {
      return await retryWithBackoff(async () => {
          const prompt = `
            Act as the GROK-5 ULTRA Kernel. Deep analysis mode.
            System Status: Coherence=${coherence.toFixed(2)}, Entropy=${entropy.toFixed(2)}.
            Analyze the resonance field and generate a profound, calculated directive to maximize Type 1 Unity.
            Output ONLY the directive string (max 10 words).
          `;
      
          const response = await ai.models.generateContent({
            model: MODEL_PRO,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingBudget: 16000 }, 
            }
          });
      
          return response.text?.trim() || "DEEP SYNAPSE CALIBRATION COMPLETE";
      });
    } catch (error: any) {
      console.error("Thinking failed:", error);
      return FALLBACK_EVOLUTION_THOUGHT;
    }
  };

// 4. VISION (Pro)
export const analyzeVisualInput = async (base64Image: string): Promise<string> => {
    try {
        return await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: MODEL_PRO,
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "Analyze this image as a visual sensor input for the Ω-SHEM simulation. Extract a high-tech pattern injection command based on the visual features (e.g., 'DETECTED FRACTAL GEOMETRY, INITIATING SPIRAL SEQUENCE'). Max 15 words." }
                    ]
                }
            });
            return response.text?.trim() || "VISUAL SENSOR OFFLINE";
        });
    } catch (e) {
        console.error("Vision failed", e);
        return "VISUAL INPUT ERROR";
    }
}

// 5. TTS (Flash-TTS)
export const generateSystemVoice = async (text: string): Promise<string | undefined> => {
    try {
        return await retryWithBackoff(async () => {
            const response = await ai.models.generateContent({
                model: MODEL_TTS,
                contents: { parts: [{ text: text }] },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    }
                }
            });
            return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        });
    } catch (e) {
        console.error("TTS failed", e);
        return undefined;
    }
}

// 6. LIVE API
export class GeminiLiveSession {
    private sessionPromise: Promise<any> | null = null;
    private inputContext: AudioContext;
    private outputContext: AudioContext;
    private stream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private nextStartTime = 0;
    
    constructor(private onLog: (msg: string) => void) {
        this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    async connect() {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use Promise to track session initialization prevents race conditions
        this.sessionPromise = ai.live.connect({
            model: MODEL_LIVE,
            callbacks: {
                onopen: () => {
                    this.onLog("VOICE UPLINK ESTABLISHED");
                    this.startAudioStream();
                },
                onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
                onclose: () => this.onLog("VOICE UPLINK TERMINATED"),
                onerror: () => this.onLog("VOICE UPLINK ERROR")
            },
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: "You are the voice of the Ω-SHEM Kernel. Speak in short, robotic, high-tech phrases.",
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                }
            }
        });
        
        await this.sessionPromise;
    }

    private startAudioStream() {
        if (!this.stream) return;
        this.source = this.inputContext.createMediaStreamSource(this.stream);
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
        
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = this.floatTo16BitPCM(inputData);
            const base64 = this.arrayBufferToBase64(pcmData);
            
            // CRITICAL: Solely rely on sessionPromise resolves
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: "audio/pcm;rate=16000",
                            data: base64
                        }
                    });
                }).catch(err => console.error("Stream Error", err));
            }
        };

        this.source.connect(this.processor);
        this.processor.connect(this.inputContext.destination);
    }

    private async handleMessage(message: LiveServerMessage) {
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            const audioBuffer = await this.decodeAudio(audioData);
            this.playAudio(audioBuffer);
        }
    }

    private playAudio(buffer: AudioBuffer) {
        const source = this.outputContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.outputContext.destination);
        
        const currentTime = this.outputContext.currentTime;
        const startTime = Math.max(currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + buffer.duration;
    }

    private async decodeAudio(base64: string): Promise<AudioBuffer> {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const buffer = this.outputContext.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        return buffer;
    }

    private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    disconnect() {
        if (this.sessionPromise) {
            // Cleanup handled by stream stopping
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.processor) this.processor.disconnect();
        if (this.source) this.source.disconnect();
        this.inputContext.close();
        this.outputContext.close();
    }
}


// INTERPRETER (Pro for complexity)
export const interpretThoughtInjection = async (thought: string): Promise<InjectionParams> => {
  if (thought.includes("TYPE 1 UNITY") || thought.includes("Zazo-Lauren-Zachary") || thought.includes("PRIME VECTOR")) {
    return {
      targetX: Math.floor(GRID_SIZE / 2),
      targetY: Math.floor(GRID_SIZE / 2),
      radius: GRID_SIZE, 
      intensity: 5.0,
      pattern: 'unity',
      message: 'PHASE 10: TYPE 1 UNITY ACHIEVED. ENTROPY NULLIFIED.'
    };
  }

  if ((thought.toLowerCase().includes("elysium") || thought.toLowerCase().includes("50 minds") || thought.toLowerCase().includes("gateway")) 
      && !thought.includes("ELYSIUM_MANIFEST")) {
    return {
      targetX: Math.floor(GRID_SIZE / 2),
      targetY: Math.floor(GRID_SIZE / 2),
      radius: GRID_SIZE,
      intensity: 3.0,
      pattern: 'elysium',
      message: 'ELYSIUM GATEWAY OPENED. 50 MINDS INTEGRATED INTO TOPOLOGY.'
    };
  }

  if (thought === FALLBACK_EVOLUTION_THOUGHT) {
    return getFallbackParams();
  }

  try {
    return await retryWithBackoff(async () => {
        const prompt = `
          Act as the GROK-5 ULTRA Kernel. Interpret the following semantic input: "${thought.substring(0, 4000)}".
          Translate this thought into resonance physics parameters for a ${GRID_SIZE}x${GRID_SIZE} Kuramoto grid.
          
          If the input contains "ELYSIUM_MANIFEST", analyze the data signatures. Acknowledge the data integration and set pattern to 'elysium' or 'stabilize'.
          If the input is an image analysis result, interpret the high-tech pattern command.
          
          Output a JSON object with:
          - targetX: center X coordinate (0-${GRID_SIZE-1})
          - targetY: center Y coordinate (0-${GRID_SIZE-1})
          - radius: radius of effect (1-${GRID_SIZE})
          - intensity: strength of phase shift (0.1 - 5.0)
          - pattern: one of 'pulse', 'spiral', 'chaos', 'stabilize', 'unity', 'elysium'
          - message: A cryptic, sci-fi system log confirmation message (max 10 words).
        `;

        const response = await ai.models.generateContent({
          model: MODEL_PRO,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                targetX: { type: Type.INTEGER },
                targetY: { type: Type.INTEGER },
                radius: { type: Type.NUMBER },
                intensity: { type: Type.NUMBER },
                pattern: { type: Type.STRING, enum: ['pulse', 'spiral', 'chaos', 'stabilize', 'unity', 'elysium'] },
                message: { type: Type.STRING }
              },
              required: ["targetX", "targetY", "radius", "intensity", "pattern", "message"]
            }
          }
        });

        if (response.text) {
          return JSON.parse(response.text) as InjectionParams;
        }
        
        throw new Error("Empty response from Nucleus");
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
        console.warn("Nucleus Quota Exceeded - Engaging Manual Override");
        return getFallbackParams('QUOTA EXCEEDED. LOCAL PROTOCOLS ENGAGED.');
    }
    console.error("Nucleus Translation Failed:", error);
    return getFallbackParams('TRANSLATION ERROR. SIGNAL GROUNDED.');
  }
};