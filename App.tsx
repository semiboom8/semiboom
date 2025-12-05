import React, { useState, useEffect } from 'react';
import { GameState, GameStatus, HistoryItem, Character } from './types';
import { initializeGame, processTurn } from './services/geminiService';
import { CharacterSheet } from './components/CharacterSheet';
import { GameLog } from './components/GameLog';
import { InputArea } from './components/InputArea';
import { RelationshipsPanel } from './components/RelationshipsPanel';

const INITIAL_STATE: GameState = {
  status: GameStatus.INIT,
  character: null,
  history: [],
  summary: '',
  currentChoices: [],
  isProcessing: false,
  turnCount: 0,
  isRelationshipPanelOpen: false,
};

function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [initPrompt, setInitPrompt] = useState('');

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initPrompt.trim()) return;

    setGameState(prev => ({ ...prev, isProcessing: true }));

    try {
      const data = await initializeGame(initPrompt);
      
      const newCharacter: Character = {
        name: "Player",
        classTitle: data.classTitle,
        hp: { current: data.hpMax, max: data.hpMax },
        sp: { current: data.spMax, max: data.spMax },
        stats: data.stats.map(s => ({ ...s, max: 10 })),
        inventory: data.startingInventory,
        activeQuest: data.firstQuest,
        relationships: data.relationships || []
      };

      setGameState({
        status: GameStatus.PLAYING,
        character: newCharacter,
        history: [{ role: 'model', content: data.initialScene, type: 'narrative' }],
        summary: `Game started. Premise: ${initPrompt}. Class: ${data.classTitle}.`,
        currentChoices: data.choices,
        isProcessing: false,
        turnCount: 1,
        isRelationshipPanelOpen: false,
      });

    } catch (error) {
      console.error(error);
      setGameState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: "Failed to initialize game. Please try again." 
      }));
    }
  };

  const handleAction = async (action: string) => {
    if (!gameState.character) return;
    
    // Optimistic Update
    setGameState(prev => ({
      ...prev,
      isProcessing: true,
      history: [...prev.history, { role: 'user', content: action, type: 'action' }],
      currentChoices: [] // Clear choices while thinking
    }));

    try {
      // Get last 5 turns for context
      const recentHistory = gameState.history
        .slice(-5)
        .map(h => `${h.role}: ${h.content}`)
        .join('\n');

      const result = await processTurn(
        action,
        gameState.character,
        gameState.summary,
        recentHistory,
        gameState.turnCount
      );

      setGameState(prev => {
        if (!prev.character) return prev;
        
        // Calculate new stats
        const newHp = Math.min(prev.character.hp.max, Math.max(0, prev.character.hp.current + result.hpChange));
        const newSp = Math.min(prev.character.sp.max, Math.max(0, prev.character.sp.current + result.spChange));
        
        // Update inventory
        let newInventory = [...prev.character.inventory];
        // Remove items
        newInventory = newInventory.filter(item => !result.inventoryRemove.includes(item));
        // Add items
        newInventory = [...newInventory, ...result.inventoryAdd];

        const updatedCharacter: Character = {
          ...prev.character,
          hp: { ...prev.character.hp, current: newHp },
          sp: { ...prev.character.sp, current: newSp },
          inventory: newInventory,
          activeQuest: result.questUpdate ? result.questUpdate : prev.character.activeQuest,
          relationships: result.relationships // The engine returns the full, updated list
        };

        const newSummary = result.summaryUpdate 
          ? prev.summary + "\n" + result.summaryUpdate 
          : prev.summary;

        return {
          ...prev,
          status: result.isGameOver ? GameStatus.GAME_OVER : GameStatus.PLAYING,
          character: updatedCharacter,
          history: [...prev.history, { role: 'model', content: result.narrative, type: 'narrative' }],
          summary: newSummary,
          currentChoices: result.choices,
          isProcessing: false,
          turnCount: prev.turnCount + 1
        };
      });

    } catch (error) {
      console.error(error);
      setGameState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: "The engine stumbled. Try that action again." 
      }));
    }
  };

  // Render Init Screen
  if (gameState.status === GameStatus.INIT) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black">
        <div className="max-w-xl w-full space-y-8 animate-fade-in text-center">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300 pb-2">
              Gemini Studio
            </h1>
            <p className="text-zinc-400 text-lg">Infinite Context RPG Engine</p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl border border-zinc-700/50 shadow-2xl">
            <form onSubmit={handleStartGame} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 text-left">
                  What reality do you want to simulate?
                </label>
                <textarea
                  value={initPrompt}
                  onChange={(e) => setInitPrompt(e.target.value)}
                  placeholder="e.g., I am a nervous squirrel trying to steal a nut from a dragon's hoard..."
                  className="w-full h-32 bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={gameState.isProcessing || !initPrompt}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {gameState.isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initializing World...
                  </span>
                ) : "Initialize Game"}
              </button>
            </form>
          </div>
          
          <div className="text-zinc-500 text-sm">
            Powered by Gemini 2.5 Flash &bull; JSON Mode &bull; Thinking Config
          </div>
        </div>
      </div>
    );
  }

  // Render Game Screen
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Top Right Relationship Button */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setGameState(prev => ({ ...prev, isRelationshipPanelOpen: true }))}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur text-zinc-200 rounded-full border border-zinc-700 shadow-lg transition-all group"
        >
          <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium">Relationships</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-6 gap-6 mb-24 z-10">
        
        {/* Left/Top: Character Sheet */}
        <div className="lg:w-80 w-full">
          {gameState.character && <CharacterSheet character={gameState.character} />}
        </div>

        {/* Center: Game Log */}
        <div className="flex-1 flex flex-col relative rounded-2xl overflow-hidden glass-panel border-0">
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-zinc-900 to-transparent z-10 pointer-events-none"></div>
          <GameLog history={gameState.history} isProcessing={gameState.isProcessing} />
          {gameState.error && (
             <div className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
               {gameState.error}
             </div>
          )}
        </div>

      </div>

      {/* Bottom: Input */}
      <InputArea 
        choices={gameState.currentChoices} 
        onAction={handleAction} 
        disabled={gameState.isProcessing || gameState.status === GameStatus.GAME_OVER} 
      />

      {/* Slide-out Panel */}
      {gameState.character && (
        <RelationshipsPanel 
          relationships={gameState.character.relationships} 
          isOpen={gameState.isRelationshipPanelOpen} 
          onClose={() => setGameState(prev => ({ ...prev, isRelationshipPanelOpen: false }))}
        />
      )}
    </div>
  );
}

export default App;