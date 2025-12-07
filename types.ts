export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP',
  SETTINGS = 'SETTINGS',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

export enum Language {
  ENGLISH = 'English',
  URDU = 'Urdu',
  PASHTO = 'Pashto'
}

export interface Knife {
  id: string;
  name: string;
  color: string;
  cost: number;
  unlocked: boolean;
  bladeWidth: number; // Visual width
  bladeLength: number; // Visual length
}

export interface StoredData {
  highScore: number;
  apples: number;
  unlockedKnives: string[];
  selectedKnifeId: string;
  soundEnabled: boolean;
  language: Language;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  vy: number;
}
