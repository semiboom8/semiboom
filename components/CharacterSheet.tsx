import React from 'react';
import { Character, Stat } from '../types';

interface CharacterSheetProps {
  character: Character;
}

const ProgressBar = ({ current, max, colorClass }: { current: number; max: number; colorClass: string }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="w-full bg-zinc-800 rounded-full h-2.5 mt-1 overflow-hidden">
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const StatRow: React.FC<{ stat: Stat }> = ({ stat }) => (
  <div className="flex justify-between items-center py-1 border-b border-zinc-800 last:border-0">
    <span className="text-zinc-400 text-sm font-medium">{stat.name}</span>
    <span className="text-zinc-200 font-bold">{stat.value}/10</span>
  </div>
);

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl w-full lg:w-80 flex-shrink-0 h-fit lg:sticky lg:top-6 space-y-6 animate-fade-in border-l-4 border-l-indigo-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{character.classTitle}</h2>
        <div className="mt-2 text-xs uppercase tracking-wider text-indigo-400 font-bold">
          Active Quest
        </div>
        <p className="text-sm text-zinc-300 leading-snug">{character.activeQuest}</p>
      </div>

      {/* Vitals */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-bold uppercase text-zinc-500 mb-1">
            <span>Health</span>
            <span>{character.hp.current} / {character.hp.max}</span>
          </div>
          <ProgressBar current={character.hp.current} max={character.hp.max} colorClass="bg-rose-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold uppercase text-zinc-500 mb-1">
            <span>SP (Stamina/Sanity)</span>
            <span>{character.sp.current} / {character.sp.max}</span>
          </div>
          <ProgressBar current={character.sp.current} max={character.sp.max} colorClass="bg-emerald-500" />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wider">Attributes</h3>
        <div className="space-y-1">
          {character.stats.map((stat) => (
            <StatRow key={stat.name} stat={stat} />
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wider">Inventory</h3>
        {character.inventory.length === 0 ? (
          <p className="text-zinc-600 text-sm italic">Empty...</p>
        ) : (
          <ul className="space-y-2">
            {character.inventory.map((item, idx) => (
              <li key={idx} className="flex items-center text-sm text-zinc-300 bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700/50">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};