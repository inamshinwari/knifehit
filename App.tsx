import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { Shop, KNIVES_DB } from './components/Shop';
import { loadGameData, saveGameData } from './services/storage';
import { audioManager } from './services/audio';
import { GameState, Language, Knife } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Persistent Data
  const [highScore, setHighScore] = useState(0);
  const [apples, setApples] = useState(0);
  const [unlockedKnives, setUnlockedKnives] = useState<string[]>(['knife_default']);
  const [selectedKnifeId, setSelectedKnifeId] = useState('knife_default');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);

  // Load Data on Mount
  useEffect(() => {
    const data = loadGameData();
    setHighScore(data.highScore);
    setApples(data.apples);
    setUnlockedKnives(data.unlockedKnives);
    setSelectedKnifeId(data.selectedKnifeId);
    setLanguage(data.language);
    audioManager.setEnabled(data.soundEnabled);
  }, []);

  // Save Data on Change
  useEffect(() => {
    saveGameData({
        highScore,
        apples,
        unlockedKnives,
        selectedKnifeId,
        soundEnabled: true,
        language
    });
  }, [highScore, apples, unlockedKnives, selectedKnifeId, language]);

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
    if (score > highScore) setHighScore(score);
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setGameState(GameState.PLAYING);
  };

  const getSelectedKnife = (): Knife => {
    return KNIVES_DB.find(k => k.id === selectedKnifeId) || KNIVES_DB[0];
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-900 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900 to-transparent"></div>
      </div>

      {/* Game Layer */}
      <GameCanvas 
         gameState={gameState}
         setGameState={setGameState}
         level={level}
         setLevel={setLevel}
         score={score}
         setScore={setScore}
         apples={apples}
         setApples={setApples}
         selectedKnife={getSelectedKnife()}
         onGameOver={handleGameOver}
      />

      {/* UI Overlays */}
      {gameState === GameState.MENU && (
        <MainMenu 
            setGameState={setGameState} 
            highScore={highScore}
            language={language}
        />
      )}

      {gameState === GameState.SHOP && (
        <Shop 
            setGameState={setGameState}
            apples={apples}
            setApples={setApples}
            unlockedKnives={unlockedKnives}
            setUnlockedKnives={setUnlockedKnives}
            selectedKnifeId={selectedKnifeId}
            setSelectedKnifeId={setSelectedKnifeId}
        />
      )}

      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col">
                <div className="text-gray-400 text-sm font-tech">LEVEL {level}</div>
                <div className="text-white text-4xl font-bold">{score}</div>
            </div>
            <div className="text-yellow-400 font-bold text-xl flex items-center gap-2">
                 🍎 {apples}
            </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 animate-fade-in">
           <h2 className="text-red-500 text-6xl font-black mb-4 tracking-tighter shadow-red-500 drop-shadow-lg">GAME OVER</h2>
           <div className="text-white text-xl mb-8 font-tech">SCORE: {score}</div>
           
           <button 
             onClick={resetGame}
             className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-12 rounded-full mb-4 text-xl shadow-lg transform hover:scale-105 transition-all"
           >
             RETRY
           </button>
           <button 
             onClick={() => setGameState(GameState.MENU)}
             className="text-gray-400 hover:text-white underline"
           >
             MAIN MENU
           </button>
        </div>
      )}

      {gameState === GameState.SETTINGS && (
         <div className="absolute inset-0 bg-gray-900 flex flex-col p-8 z-20">
             <h2 className="text-3xl text-white font-bold mb-8">SETTINGS</h2>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded">
                    <span className="text-white">Language</span>
                    <button 
                        onClick={() => {
                            const langs = Object.values(Language);
                            const nextIndex = (langs.indexOf(language) + 1) % langs.length;
                            setLanguage(langs[nextIndex]);
                        }}
                        className="text-cyan-400 font-bold"
                    >
                        {language}
                    </button>
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded">
                    <span className="text-white">Sound FX</span>
                    <span className="text-green-400">ON (Always)</span>
                </div>
             </div>

             <button onClick={() => setGameState(GameState.MENU)} className="mt-auto bg-gray-700 text-white py-4 rounded font-bold">
                 BACK
             </button>
         </div>
      )}
    </div>
  );
}

export default App;
