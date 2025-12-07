import React from 'react';
import { GameState, Knife } from '../types';
import { audioManager } from '../services/audio';

interface ShopProps {
  setGameState: (state: GameState) => void;
  apples: number;
  setApples: (n: number) => void;
  unlockedKnives: string[];
  setUnlockedKnives: (ids: string[]) => void;
  selectedKnifeId: string;
  setSelectedKnifeId: (id: string) => void;
}

export const KNIVES_DB: Knife[] = [
    { id: 'knife_default', name: 'Standard Issue', color: '#cbd5e0', cost: 0, unlocked: true, bladeWidth: 10, bladeLength: 40 },
    { id: 'knife_gold', name: 'Midas Touch', color: '#ecc94b', cost: 50, unlocked: false, bladeWidth: 12, bladeLength: 45 },
    { id: 'knife_blood', name: 'Crimson Edge', color: '#e53e3e', cost: 100, unlocked: false, bladeWidth: 8, bladeLength: 50 },
    { id: 'knife_void', name: 'Void Walker', color: '#805ad5', cost: 200, unlocked: false, bladeWidth: 14, bladeLength: 55 },
    { id: 'knife_neon', name: 'Cyber Blade', color: '#0bc5ea', cost: 300, unlocked: false, bladeWidth: 6, bladeLength: 40 },
    { id: 'knife_emerald', name: 'Forest Keeper', color: '#48bb78', cost: 500, unlocked: false, bladeWidth: 16, bladeLength: 35 },
    { id: 'knife_obsidian', name: 'Obsidian Shard', color: '#1a202c', cost: 1000, unlocked: false, bladeWidth: 20, bladeLength: 60 },
];

export const Shop: React.FC<ShopProps> = ({ 
    setGameState, apples, setApples, unlockedKnives, setUnlockedKnives, selectedKnifeId, setSelectedKnifeId 
}) => {

  const buyKnife = (knife: Knife) => {
    if (knife.unlocked) {
        setSelectedKnifeId(knife.id);
        audioManager.playHit();
    } else if (apples >= knife.cost) {
        setApples(apples - knife.cost);
        setUnlockedKnives([...unlockedKnives, knife.id]);
        setSelectedKnifeId(knife.id);
        audioManager.playUnlock();
    } else {
        audioManager.playFail();
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col p-6 z-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setGameState(GameState.MENU)} className="text-white text-2xl">← BACK</button>
        <div className="bg-gray-800 px-4 py-2 rounded-full border border-yellow-500 text-yellow-400 font-bold">
           🍎 {apples}
        </div>
      </div>

      <h2 className="text-3xl text-white font-bold mb-6 text-center">WEAPONRY</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pb-20">
        {KNIVES_DB.map(knife => {
            const isUnlocked = unlockedKnives.includes(knife.id);
            const isSelected = selectedKnifeId === knife.id;
            
            return (
                <div 
                    key={knife.id}
                    onClick={() => buyKnife({...knife, unlocked: isUnlocked})}
                    className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105
                        flex flex-col items-center justify-between h-40
                        ${isSelected ? 'border-cyan-400 bg-gray-800 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-gray-700 bg-gray-800'}
                        ${!isUnlocked && apples < knife.cost ? 'opacity-50' : 'opacity-100'}
                    `}
                >
                    {isSelected && <div className="absolute top-2 right-2 text-cyan-400 text-xs">EQUIPPED</div>}
                    
                    {/* Knife Preview */}
                    <div className="flex-1 flex items-center justify-center">
                         <div style={{
                             width: knife.bladeWidth + 'px',
                             height: knife.bladeLength + 'px',
                             backgroundColor: knife.color,
                             borderRadius: '2px'
                         }} className="shadow-lg transform rotate-[-45deg]"></div>
                    </div>

                    <div className="text-center">
                        <div className="text-white font-bold text-sm">{knife.name}</div>
                        <div className="text-yellow-500 text-sm">
                            {isUnlocked ? 'OWNED' : `${knife.cost} 🍎`}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
