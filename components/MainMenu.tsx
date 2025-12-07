import React from 'react';
import { GameState, Language } from '../types';

interface MainMenuProps {
  setGameState: (state: GameState) => void;
  highScore: number;
  language: Language;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setGameState, highScore, language }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-4">
      <div className="animate-pulse mb-8 text-center">
        <h2 className="text-cyan-400 font-tech text-xl tracking-[0.3em] mb-2">SHINWAR GAMES</h2>
        <h1 className="text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 font-extrabold drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          KNIFE<br/>MASTER
        </h1>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-xs">
        <button 
          onClick={() => setGameState(GameState.PLAYING)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-8 rounded-lg shadow-[0_0_20px_rgba(8,145,178,0.6)] transform hover:scale-105 transition-all text-2xl"
        >
          PLAY
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setGameState(GameState.SHOP)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white py-3 rounded-lg transform hover:scale-105 transition-all"
          >
            🛒 SHOP
          </button>
          <button 
            onClick={() => setGameState(GameState.SETTINGS)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white py-3 rounded-lg transform hover:scale-105 transition-all"
          >
            ⚙️ SETTINGS
          </button>
        </div>
      </div>

      <div className="mt-12 text-gray-400 font-tech">
        High Score: <span className="text-yellow-400 text-2xl ml-2">{highScore}</span>
      </div>
      
      <div className="absolute bottom-4 text-gray-600 text-xs font-tech">
        v1.0.0 PC BUILD • {language}
      </div>
    </div>
  );
};
