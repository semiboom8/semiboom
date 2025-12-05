import React, { useEffect, useRef } from 'react';
import { HistoryItem } from '../types';

interface GameLogProps {
  history: HistoryItem[];
  isProcessing: boolean;
}

export const GameLog: React.FC<GameLogProps> = ({ history, isProcessing }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scroll-smooth" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {history.map((item, index) => (
        <div 
          key={index} 
          className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
        >
          <div 
            className={`max-w-2xl p-6 rounded-2xl text-lg leading-relaxed shadow-lg ${
              item.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'glass-panel text-zinc-200 rounded-bl-none border-zinc-700'
            }`}
          >
             {item.role === 'model' && (
               <div className="text-xs uppercase tracking-widest text-indigo-400 mb-2 font-bold">Game Engine</div>
             )}
            <div className="whitespace-pre-wrap font-serif">
              {item.content}
            </div>
          </div>
        </div>
      ))}
      
      {isProcessing && (
        <div className="flex justify-start animate-pulse">
           <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
           </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
