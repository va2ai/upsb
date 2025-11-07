import React, { useState, useEffect } from 'react';
import type { Topic } from '../types';
import { CompletionScreen } from './CompletionScreen';
import { GoogleGenAI } from "@google/genai";

interface GameProps {
  topics: Topic[];
  onReset: () => void;
}

const normalize = (str: string) => str.toLowerCase().replace(/[.,"?']/g, '').trim();

export const RecallGame: React.FC<GameProps> = ({ topics, onReset }) => {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ correct: string[], incorrect: string[], missing: string[] } | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintGivenForCurrentTopic, setHintGivenForCurrentTopic] = useState(false);

  const currentTopic = topics[currentTopicIndex];

  useEffect(() => {
    setUserInput('');
    setFeedback(null);
    setHintText(null);
    setIsHintLoading(false);
    setHintGivenForCurrentTopic(false);
  }, [currentTopicIndex, topics]);

  const generateHint = async () => {
    setIsHintLoading(true);
    setHintText(null); // Clear previous hint
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are playing a memorization game about UPS Driving Habits. You need to recall phrases for the category: "${currentTopic.title}".
                      The user is having trouble recalling all phrases. Provide a subtle hint to help recall ONE missing phrase for this category, without giving away the exact answer.
                      For example, if the category is "AIM HIGH IN STEERING" and a missing phrase is "Imaginary target baseball dartboard", a hint could be "Think about where you're looking on the road, like a specific sports target."
                      Do not reveal the exact phrase. Provide only the hint.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // As requested, using gemini-2.5-flash
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 } // For quicker responses
        }
      });
      setHintText(response.text);
      setHintGivenForCurrentTopic(true);
    } catch (error) {
      console.error('Error generating hint:', error);
      setHintText('Failed to get a hint. Please try again.');
    } finally {
      setIsHintLoading(false);
    }
  };

  const checkAnswer = () => {
    const correctPhrases = new Set(currentTopic.phrases.map(normalize));
    const userPhrases = userInput.split('\n').filter(p => p.trim() !== '').map(normalize);

    const correct: string[] = [];
    const incorrect: string[] = [];
    
    userPhrases.forEach(up => {
        if (correctPhrases.has(up)) {
            correct.push(currentTopic.phrases.find(p => normalize(p) === up)!);
        } else {
            incorrect.push(userInput.split('\n').find(p => normalize(p) === up)!);
        }
    });

    const missing = currentTopic.phrases.filter(cp => !correct.includes(cp));
    
    setFeedback({ correct, incorrect, missing });

    if (missing.length > 0 && !hintGivenForCurrentTopic) {
      // The hint is now also available via button, so auto-hint might be less critical.
      // Keeping it here for now as specified "when wrong".
      // generateHint(); // Removed auto-hint after check, as "Get Hint" button is primary.
    }
  };
  
  const handleNext = () => {
    setCurrentTopicIndex(prev => prev + 1);
  };
  
  if (currentTopicIndex >= topics.length) {
    return <CompletionScreen onReset={onReset} message="You've completed the final recall challenge!" />;
  }

  const canGetHint = !hintGivenForCurrentTopic && !isHintLoading; // Allow hint if not already given and not loading

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <div className="text-center mb-4">
        <p className="text-gray-500 dark:text-gray-400">Category {currentTopicIndex + 1} of {topics.length}</p>
        <div className="flex items-center justify-center">
            <h3 className="text-xl font-bold text-[#FFB500]">{currentTopic.title}</h3>
        </div>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Type all associated phrases below, each on a new line.</p>
      </div>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={!!feedback}
        rows={currentTopic.phrases.length + 2}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FFB500] focus:outline-none bg-white text-[#351C15] disabled:bg-gray-100 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
        placeholder="Start typing here..."
        aria-label={`Type phrases for ${currentTopic.title}`}
      />

      <div className="text-center mt-4 flex justify-center space-x-4">
        {!feedback ? (
          <>
            <button onClick={checkAnswer} className="bg-[#FFB500] text-[#351C15] font-bold py-2 px-8 rounded-lg hover:bg-[#E6A300] transition-transform transform hover:scale-105">Check Answer</button>
            {canGetHint && ( // Only show hint button if not given for current topic and not loading
                 <button
                    onClick={generateHint}
                    disabled={isHintLoading}
                    className={`font-bold py-2 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center 
                                ${isHintLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    aria-label="Get a hint"
                 >
                    {isHintLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Get Hint'}
                 </button>
            )}
          </>
        ) : (
          <button onClick={handleNext} className="bg-green-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">Next Category</button>
        )}
      </div>

      {hintText && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 italic dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100">
          <h4 className="font-bold mb-2">Hint:</h4>
          <p>{hintText}</p>
        </div>
      )}

      {feedback && (
        <div className="mt-6 border-t pt-4 dark:border-gray-700">
          <h4 className="font-bold text-lg mb-2 dark:text-gray-100">Feedback</h4>
          <div>
            <h5 className="font-semibold text-green-600 dark:text-green-300">Correct ({feedback.correct.length}/{currentTopic.phrases.length}):</h5>
            {feedback.correct.length > 0 ? (
                <ul className="list-disc list-inside text-green-700 dark:text-green-200">
                    {feedback.correct.map(p => <li key={p}>{p}</li>)}
                </ul>
            ) : <p className="text-gray-500 italic dark:text-gray-400">None correct yet.</p>}
          </div>
          {(feedback.missing.length > 0 || hintGivenForCurrentTopic) && ( // Show missing if there are missing or a hint was given
            <div className="mt-3">
              <h5 className="font-semibold text-blue-600 dark:text-blue-300">Missing:</h5>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-200">
                {feedback.missing.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
          {feedback.incorrect.length > 0 && (
            <div className="mt-3">
              <h5 className="font-semibold text-red-600 dark:text-red-300">Incorrect/Unrecognized:</h5>
              <ul className="list-disc list-inside text-red-700 dark:text-red-200">
                {feedback.incorrect.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};