import React, { useState } from 'react';

interface InputAreaProps {
  choices: string[];
  onAction: (action: string) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ choices, onAction, disabled }) => {
  const [customInput, setCustomInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim() && !disabled) {
      onAction(customInput);
      setCustomInput('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-[#09090b] to-transparent pt-12 pb-6 px-4 z-20">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Choice Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => onAction(choice)}
              disabled={disabled}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {idx + 1}. {choice}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <form onSubmit={handleCustomSubmit} className="relative w-full max-w-3xl mx-auto">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={disabled}
            placeholder="Or type your own action..."
            className="w-full bg-zinc-900/90 text-white placeholder-zinc-500 border border-zinc-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-2xl backdrop-blur-sm transition-all"
          />
          <button
            type="submit"
            disabled={disabled || !customInput.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:bg-zinc-700"
          >
            Act
          </button>
        </form>
      </div>
    </div>
  );
};
