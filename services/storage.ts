import { StoredData, Language } from '../types';

const STORAGE_KEY = 'SHINWAR_KNIFE_MASTER_V1';

const DEFAULT_DATA: StoredData = {
  highScore: 0,
  apples: 0,
  unlockedKnives: ['knife_default'],
  selectedKnifeId: 'knife_default',
  soundEnabled: true,
  language: Language.ENGLISH
};

export const saveGameData = (data: StoredData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save game data", e);
  }
};

export const loadGameData = (): StoredData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load game data", e);
  }
  return DEFAULT_DATA;
};
