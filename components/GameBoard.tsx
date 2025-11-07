import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Topic, PlacedItems } from '../types';
import { DraggableItem } from './DraggableItem';
import { DropZone } from './DropZone';
import { CompletionScreen } from './CompletionScreen';

interface GameBoardProps {
  topics: Topic[];
  onReset: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return array.slice().sort(() => Math.random() - 0.5);
};

export const GameBoard: React.FC<GameBoardProps> = ({ topics, onReset }) => {
  const [unplacedPhrases, setUnplacedPhrases] = useState<string[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItems>({});
  const [isComplete, setIsComplete] = useState(false);
  const [incorrectDrop, setIncorrectDrop] = useState<string | null>(null);

  const phraseToTopicMap = useMemo(() => {
    const map: Record<string, string> = {};
    topics.forEach(topic => {
      topic.phrases.forEach(phrase => {
        map[phrase] = topic.id;
      });
    });
    return map;
  }, [topics]);

  useEffect(() => {
    const allPhrases = topics.flatMap(t => t.phrases);
    setUnplacedPhrases(shuffleArray(allPhrases));

    const initialPlacedItems: PlacedItems = {};
    topics.forEach(t => {
      initialPlacedItems[t.id] = [];
    });
    setPlacedItems(initialPlacedItems);
    setIsComplete(false);
  }, [topics]);

  const handleDrop = useCallback((topicId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedPhrase = e.dataTransfer.getData('text/plain');
    if (!droppedPhrase) return;

    const correctTopicId = phraseToTopicMap[droppedPhrase];
    
    if (correctTopicId === topicId) {
      setUnplacedPhrases(prev => prev.filter(p => p !== droppedPhrase));
      setPlacedItems(prev => ({
        ...prev,
        [topicId]: [...prev[topicId], droppedPhrase].sort(),
      }));
    } else {
      setIncorrectDrop(droppedPhrase);
      setTimeout(() => setIncorrectDrop(null), 500); // Animation duration
    }
  }, [phraseToTopicMap]);
  
  useEffect(() => {
    if (unplacedPhrases.length === 0 && topics.length > 0) {
      const totalPhrases = topics.flatMap(t => t.phrases).length;
      // Fix: The type of `sum` was being inferred as `unknown`, causing a type error. Explicitly setting it to `number` resolves the issue.
      const totalPlaced = Object.values(placedItems).reduce((sum: number, arr: string[]) => sum + arr.length, 0);
      if (totalPlaced === totalPhrases && totalPhrases > 0) {
        setIsComplete(true);
      }
    }
  }, [unplacedPhrases, placedItems, topics]);

  if (isComplete) {
    return (
      <CompletionScreen
        onReset={onReset}
        message="You've matched all the phrases correctly."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <style>
        {`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        `}
      </style>
      {/* Draggable Items Column */}
      <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
        <h3 className="text-lg font-bold mb-4 border-b pb-2 dark:text-gray-100 dark:border-gray-700">Phrases to Place</h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
          {unplacedPhrases.map(phrase => (
            <DraggableItem key={phrase} phrase={phrase} isIncorrect={incorrectDrop === phrase} />
          ))}
          {unplacedPhrases.length === 0 && <p className="text-gray-500 italic dark:text-gray-400">No phrases left!</p>}
        </div>
      </div>

      {/* Drop Zones Column */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map(topic => (
          <DropZone
            key={topic.id}
            topic={topic}
            placedPhrases={placedItems[topic.id] || []}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};