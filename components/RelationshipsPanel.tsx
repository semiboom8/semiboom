import React, { useState } from 'react';
import { Relationship } from '../types';

interface RelationshipsPanelProps {
  relationships: Relationship[];
  isOpen: boolean;
  onClose: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-lime-400';
  if (score >= 40) return 'bg-yellow-400';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-600';
};

const getScoreGradient = (score: number) => {
    // Return a gradient string for the background
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-lime-400 to-green-500';
    if (score >= 40) return 'from-yellow-400 to-yellow-600';
    if (score >= 20) return 'from-orange-500 to-orange-700';
    return 'from-red-600 to-rose-700';
};

export const RelationshipsPanel: React.FC<RelationshipsPanelProps> = ({ relationships, isOpen, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedRel = relationships.find(r => r.id === selectedId);

  // Sort relationships by lastInteractionTime descending (newest first)
  const sortedRelationships = [...relationships].sort((a, b) => b.lastInteractionTime - a.lastInteractionTime);

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-zinc-700 shadow-2xl pointer-events-auto flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md z-10">
          <h2 className="text-2xl font-bold text-white font-display tracking-tight">Relationships</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {selectedRel ? (
            // Detail View
            <div className="p-6 space-y-8 animate-fade-in">
              <button 
                onClick={() => setSelectedId(null)}
                className="flex items-center text-zinc-400 hover:text-white text-sm mb-4 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to List
              </button>

              <div className="text-center space-y-2">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br ${getScoreGradient(selectedRel.relationshipScore)} text-white shadow-xl mb-4`}>
                  {selectedRel.relationshipScore}
                </div>
                <h3 className="text-3xl font-bold text-white font-display">{selectedRel.fullName}</h3>
                <p className="text-indigo-400 font-medium tracking-wide uppercase text-sm">{selectedRel.role}</p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                 <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">Current Attitude</h4>
                 <p className="text-zinc-200">{selectedRel.attitude}</p>
              </div>

              {selectedRel.importantFlags.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3">Key Traits & Flags</h4>
                   <div className="flex flex-wrap gap-2">
                     {selectedRel.importantFlags.map((flag, idx) => (
                       <span key={idx} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-700">{flag}</span>
                     ))}
                   </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3">Interaction History</h4>
                <div className="relative border-l border-zinc-700 ml-2 space-y-6">
                  {selectedRel.history.map((event, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-600 border-2 border-zinc-900"></div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{event}</p>
                    </div>
                  ))}
                  {selectedRel.history.length === 0 && <p className="pl-6 text-sm text-zinc-500 italic">No history recorded yet.</p>}
                </div>
              </div>

            </div>
          ) : (
            // List View
            <div className="p-4 space-y-3">
              {sortedRelationships.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>You haven't met anyone yet.</p>
                </div>
              ) : (
                sortedRelationships.map((rel) => (
                  <div key={rel.id} className="group bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-4 transition-all flex items-start gap-4">
                    {/* Score Indicator */}
                    <div className={`w-1.5 self-stretch rounded-full ${getScoreColor(rel.relationshipScore)}`}></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-zinc-200 truncate">{rel.fullName}</h4>
                          <span className="text-xs text-indigo-400 font-medium">{rel.role}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getScoreColor(rel.relationshipScore)} text-black/80`}>
                          {rel.relationshipScore}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 line-clamp-2 leading-snug">
                        {rel.lastInteractionSummary}
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedId(rel.id)}
                      className="mt-1 p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};