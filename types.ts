export enum GameStatus {
  INIT = 'INIT',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Stat {
  name: string;
  value: number; // 1-10
  max: number;
}

export interface Relationship {
  id: string;
  fullName: string;
  role: string;
  relationshipScore: number; // 0-100
  attitude: string; // e.g. "Friendly", "Hostile"
  lastInteractionSummary: string;
  lastInteractionTime: number; // turn index
  importantFlags: string[];
  history: string[]; // key events
}

export interface Character {
  name: string; // derived from class/premise usually, or generic
  classTitle: string;
  hp: { current: number; max: number };
  sp: { current: number; max: number }; // Stamina/Sanity
  stats: Stat[];
  inventory: string[];
  activeQuest: string;
  relationships: Relationship[];
}

export interface GameState {
  status: GameStatus;
  character: Character | null;
  history: HistoryItem[];
  summary: string; // Long term memory summary
  sceneImage?: string; // Optional place for generated image url
  currentChoices: string[];
  isProcessing: boolean;
  error?: string;
  turnCount: number;
  isRelationshipPanelOpen: boolean;
}

export interface HistoryItem {
  role: 'user' | 'model';
  content: string;
  type: 'narrative' | 'action';
}

// Gemini Response Schemas
export interface InitGameResponse {
  classTitle: string;
  hpMax: number;
  spMax: number;
  stats: { name: string; value: number }[];
  startingInventory: string[];
  initialScene: string;
  firstQuest: string;
  choices: string[];
  relationships: Relationship[];
}

export interface TurnResponse {
  narrative: string;
  hpChange: number;
  spChange: number;
  inventoryAdd: string[];
  inventoryRemove: string[];
  questUpdate?: string;
  choices: string[];
  summaryUpdate?: string; // New facts to add to long-term memory
  isGameOver?: boolean;
  relationships: Relationship[]; // The engine returns the full updated list
}