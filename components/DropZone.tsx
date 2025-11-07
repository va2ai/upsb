import React, { useState } from 'react';
import type { Topic } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { playBase64Audio } from '../utils/audio';

interface DropZoneProps {
  topic: Topic;
  placedPhrases: string[];
  onDrop: (topicId: string, e: React.DragEvent<HTMLDivElement>) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ topic, placedPhrases, onDrop }) => {
  const [isOver, setIsOver] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSpeakTitle = async () => {
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: topic.title }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playBase64Audio(base64Audio);
      }
    } catch (error) {
      console.error('Error generating or playing speech:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        setIsOver(false);
        onDrop(topic.id, e);
      }}
      className={`bg-white rounded-lg shadow-md p-4 transition-all duration-300 min-h-[150px] flex flex-col dark:bg-gray-800 ${isOver ? 'ring-2 ring-[#FFB500] bg-yellow-50 dark:bg-yellow-900' : 'ring-1 ring-gray-200 dark:ring-gray-700'}`}
    >
      <h4 className="font-bold text-center text-[#351C15] bg-[#FFB500] p-2 rounded-t-md -mx-4 -mt-4 mb-4 shadow text-sm uppercase tracking-wide flex items-center justify-center">
        <span>{topic.title}</span>
        <button
            onClick={handleSpeakTitle}
            disabled={isSpeaking}
            className="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-label={`Read aloud: ${topic.title}`}
        >
            {isSpeaking ? (
                <svg className="animate-spin h-4 w-4 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600 dark:text-gray-400">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.618 1.79l-.053.192a2.863 2.863 0 00-.318.907c-.25.866-.279 1.751-.038 2.606.247.848.799 1.575 1.491 2.094l.319.232c.334.246.51.654.51.108v6a30.072 30.072 0 002.504 2.227 2.847 2.847 0 002.342.067c1.11-.341 2.043-1.074 2.522-2.062v-1.5H9.75v-5.25H13.5v-7.94zM20.25 8.06v11.25c0 .621-.504 1.125-1.125 1.125H17.25v-13.5h1.875c.621 0 1.125.504 1.125 1.125z" />
                </svg>
            )}
        </button>
      </h4>
      <div className="flex-grow space-y-2">
        {placedPhrases.map(phrase => (
          <div key={phrase} className="p-2 bg-green-100 text-green-800 rounded text-sm border border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700">
            {phrase}
          </div>
        ))}
        {placedPhrases.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-full text-gray-400 italic text-center text-sm dark:text-gray-500">
            Drop phrases here
          </div>
        )}
      </div>
    </div>
  );
};

export { DropZone };