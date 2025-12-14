export enum ViewState {
  HOME = 'HOME',
  GENERATOR = 'GENERATOR',
  PLAYER = 'PLAYER',
  CHAT = 'CHAT',
  LIVE = 'LIVE'
}

export interface MeditationSession {
  id: string;
  title: string;
  script: string;
  durationSeconds: number;
  imageUrl?: string;
  audioBuffer?: AudioBuffer; // Decoded audio ready to play
  createdAt: number;
}

export interface GenerationParams {
  mood: string;
  duration: number; // in minutes
  focus: string;
  voice: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
