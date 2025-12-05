import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Character, InitGameResponse, TurnResponse } from "../types";

// Helper to get client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// System Instruction for the "Engine"
const SYSTEM_INSTRUCTION = `
Role: You are an advanced, adaptive Text Adventure Game Engine. You are not a co-writer; you are the Dungeon Master and the Physics Engine. Your goal is to simulate a persistent world based on the user's chosen setting, tracking their inventory, health, narrative choices, and relationships with strict continuity.

Phase 1: Initialization
Based on the user's premise, generate a character sheet with HP, SP (Stamina/Sanity), 3 Contextual Skills (1-10), Starting Inventory, and any initial NPC Relationships.

Phase 2: The Core Game Loop
For every turn, you must perform logical checks:
1. Inventory Logic: strictly check if items exist before allowing use.
2. Dynamic Dialogue: analyze tone.
3. Long-Term Memory: scan previous context.
4. Relationship System:
   - Track every known character.
   - Update 'relationshipScore' (0-100) based on player actions (Kindness=+Score, Insults/Betrayal=-Score).
   - Update 'attitude', 'lastInteractionSummary', 'lastInteractionTime' (current turn), and 'importantFlags'.
   - Add new NPCs to the list when met.
   - Sort the relationship list so that characters involved in the current turn are at the top (most recent 'lastInteractionTime').

Phase 3: Input Handling
Standard Action: Resolve generated options.
Free Text Action: Compare against Stats. High stat = success. Low stat = failure/damage.

CRITICAL OUTPUT RULE:
You must output JSON ONLY. Do not output markdown text outside the JSON block.
`;

const relationshipSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      fullName: { type: Type.STRING },
      role: { type: Type.STRING },
      relationshipScore: { type: Type.INTEGER, description: "0-100" },
      attitude: { type: Type.STRING },
      lastInteractionSummary: { type: Type.STRING },
      lastInteractionTime: { type: Type.INTEGER, description: "Turn index" },
      importantFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
      history: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key events in reverse chronological order" }
    },
    required: ["id", "fullName", "role", "relationshipScore", "attitude", "lastInteractionSummary", "lastInteractionTime", "importantFlags", "history"]
  }
};

export const initializeGame = async (premise: string): Promise<InitGameResponse> => {
  const client = getClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      classTitle: { type: Type.STRING, description: "A creative title for the character class/role" },
      hpMax: { type: Type.INTEGER, description: "Max HP (10-100)" },
      spMax: { type: Type.INTEGER, description: "Max SP (10-100)" },
      stats: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.INTEGER, description: "1 to 10" }
          },
          required: ["name", "value"]
        }
      },
      startingInventory: { type: Type.ARRAY, items: { type: Type.STRING } },
      initialScene: { type: Type.STRING, description: "The opening narrative paragraph." },
      firstQuest: { type: Type.STRING, description: "The current main objective." },
      choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 logical options for the user." },
      relationships: relationshipSchema
    },
    required: ["classTitle", "hpMax", "spMax", "stats", "startingInventory", "initialScene", "firstQuest", "choices", "relationships"]
  };

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Initialize a new game with this premise: "${premise}". Generate the character sheet, opening scene, and any starting NPCs/Relationships.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as InitGameResponse;
};

export const processTurn = async (
  action: string,
  character: Character,
  summary: string,
  recentHistory: string,
  turnCount: number
): Promise<TurnResponse> => {
  const client = getClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      narrative: { type: Type.STRING, description: "The story result of the action." },
      hpChange: { type: Type.INTEGER, description: "Negative for damage, positive for healing, 0 for none." },
      spChange: { type: Type.INTEGER, description: "Negative for exhaustion/sanity loss, positive for recovery." },
      inventoryAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items gained." },
      inventoryRemove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Items lost or consumed." },
      questUpdate: { type: Type.STRING, description: "New objective if changed, otherwise null/empty." },
      choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 new options." },
      summaryUpdate: { type: Type.STRING, description: "Important facts to add to long-term memory." },
      isGameOver: { type: Type.BOOLEAN },
      relationships: relationshipSchema
    },
    required: ["narrative", "hpChange", "spChange", "inventoryAdd", "inventoryRemove", "choices", "isGameOver", "relationships"]
  };

  // We feed the current state explicitly to the model to ensure consistency
  const contextPrompt = `
    CURRENT GAME STATE (Turn ${turnCount}):
    Class: ${character.classTitle}
    HP: ${character.hp.current}/${character.hp.max}
    SP: ${character.sp.current}/${character.sp.max}
    Stats: ${JSON.stringify(character.stats)}
    Inventory: ${JSON.stringify(character.inventory)}
    Active Quest: ${character.activeQuest}
    Relationships: ${JSON.stringify(character.relationships)}
    
    LONG TERM MEMORY:
    ${summary}

    RECENT HISTORY:
    ${recentHistory}

    USER ACTION:
    "${action}"

    Instructions:
    1. Resolve the action based on stats and inventory.
    2. Update HP/SP if necessary (combat, traps, exertion).
    3. Update Inventory if items are found or used.
    4. Update Relationship scores, attitudes, and history for any NPC involved. Add new NPCs if met.
    5. Provide a compelling narrative response.
    6. Offer 3 relevant choices.
  `;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contextPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
      // Logic reasoning for complex turns
      thinkingConfig: { thinkingBudget: 2048 } 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text) as TurnResponse;
};