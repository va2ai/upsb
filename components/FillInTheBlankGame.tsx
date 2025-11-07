import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Topic, UserPerformanceData, BlankQuestion } from '../types';
import { CompletionScreen } from './CompletionScreen';
import { GoogleGenAI, Type } from "@google/genai";
import { getUserPerformanceData, updatePhrasePerformance } from '../utils/performanceStorage';

interface GameProps {
  topics: Topic[];
  onReset: () => void;
}

const normalize = (str: string) => str.toLowerCase().replace(/[.,"?']/g, '').trim();

export const FillInTheBlankGame: React.FC<GameProps> = ({ topics, onReset }) => {
  const [questions, setQuestions] = useState<BlankQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]); // Array to store input for each blank
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [correctness, setCorrectness] = useState<boolean[]>([]); // To track correctness of each blank
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const firstBlankInputRef = useRef<HTMLInputElement>(null); // Ref for the first blank input
  const nextButtonRef = useRef<HTMLButtonElement>(null); // Ref for the "Next" button

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  const generateAdaptiveBlankQuestions = useCallback(async (gameTopics: Topic[]) => {
    setLoadingQuestions(true);
    setError(null);
    const generatedQuestions: BlankQuestion[] = [];
    const userPerformance = getUserPerformanceData();

    try {
      for (const topic of gameTopics) {
        for (const phrase of topic.phrases) {
          const phrasePerformance = userPerformance[topic.id]?.[phrase];
          let struggleInfo = '';

          // Construct struggle info for the AI
          if (phrasePerformance && Object.keys(phrasePerformance.failedWords).length > 0) {
            const difficultWords = Object.entries(phrasePerformance.failedWords)
              .sort(([, countA], [, countB]) => countB - countA) // Sort by most failed
              .map(([word]) => `'${word}'`)
              .join(', ');
            struggleInfo = ` The user has previously struggled with these words for this phrase: ${difficultWords}. Please prioritize blanking one or more of these if appropriate, or other key words if not.`;
          }

          const prompt = `Given the original phrase: "${phrase}" from the topic: "${topic.title}",
                          identify 1 to 3 key words to replace with '[BLANK]' markers.
                          Return the modified phrase and the original blanked words in JSON format.
                          ${struggleInfo}
                          Ensure the blanked phrase uses '[BLANK]' for each word to be filled.
                          Example JSON output: { "blankedPhrase": "REMEMBER [BLANK] AND SEE IT ALL", "blankedWords": ["STAY BACK"] }
                          `;

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  blankedPhrase: { type: Type.STRING },
                  blankedWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["blankedPhrase", "blankedWords"],
              },
            },
          });

          const jsonStr = response.text.trim();
          const { blankedPhrase, blankedWords } = JSON.parse(jsonStr);

          // Split the blanked phrase into parts and nulls for blanks
          const displayPhraseParts: Array<string | null> = blankedPhrase.split(/\[BLANK\]/g).flatMap((part, i, arr) => {
            if (i < arr.length - 1) { // If it's not the last part, add a blank after it
              return [part.trim(), null];
            }
            return [part.trim()];
          }).filter(p => p !== ''); // Remove any empty string parts from split

          generatedQuestions.push({
            id: `${topic.id}-${phrase}-${Math.random()}`, // Unique ID for the question
            originalPhrase: phrase,
            topicTitle: topic.title,
            topicId: topic.id, // Assign topic.id for performance tracking
            displayPhraseParts,
            correctAnswers: blankedWords,
          });
        }
      }
      setQuestions(generatedQuestions.sort(() => Math.random() - 0.5)); // Shuffle all generated questions
    } catch (e) {
      console.error("Error generating questions with AI:", e);
      setError("Failed to generate questions. Please try again or check your API key.");
      setQuestions([]); // Clear questions on error
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    generateAdaptiveBlankQuestions(topics);
    // Reset game state when topics change
    setCurrentQuestionIndex(0);
    setUserInputs([]);
    setIsSubmitted(false);
    setCorrectness([]);
  }, [topics, generateAdaptiveBlankQuestions]);

  useEffect(() => {
    if (currentQuestion) {
      // Initialize user inputs for the new question based on the number of blanks
      const numBlanks = currentQuestion.displayPhraseParts.filter(part => part === null).length;
      setUserInputs(Array(numBlanks).fill(''));
      setIsSubmitted(false);
      setCorrectness([]);
      
      // Auto-focus the first blank input when a new question loads
      firstBlankInputRef.current?.focus();
    }
  }, [currentQuestion]);

  // Effect to focus the "Next" button when all answers are correct
  useEffect(() => {
    if (isSubmitted && correctness.every(Boolean) && nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [isSubmitted, correctness]);

  const handleInputChange = (blankIndex: number, value: string) => {
    const newInputs = [...userInputs];
    newInputs[blankIndex] = value;
    setUserInputs(newInputs);
  };

  const allInputsFilled = useMemo(() => userInputs.every(input => input.trim() !== ''), [userInputs]);

  const checkAnswer = useCallback(() => {
    if (!currentQuestion || !allInputsFilled) return; // Prevent checking empty answers

    const newCorrectness: boolean[] = [];
    const failedWordsForPerformance: string[] = [];

    currentQuestion.correctAnswers.forEach((correctAnswer, idx) => {
      const userAnswer = normalize(userInputs[idx] || ''); // Ensure idx exists, provide empty string if not
      const normalizedCorrectAnswer = normalize(correctAnswer);
      const isCorrect = userAnswer === normalizedCorrectAnswer;
      newCorrectness.push(isCorrect);

      if (!isCorrect) {
        failedWordsForPerformance.push(correctAnswer); // Store original word that was failed
      }
    });
    
    setCorrectness(newCorrectness);
    setIsSubmitted(true);

    // Update performance data if there were any incorrect answers for this phrase
    if (failedWordsForPerformance.length > 0) {
        updatePhrasePerformance(currentQuestion.topicId, currentQuestion.originalPhrase, failedWordsForPerformance);
    }
  }, [currentQuestion, userInputs, allInputsFilled]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Game over
      setCurrentQuestionIndex(questions.length); // Indicate completion
    }
  }, [currentQuestionIndex, questions.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission or new line in textarea if it were one
      if (isSubmitted) {
        // If already submitted, and 'Enter' is pressed, proceed to next question
        handleNext();
      } else if (allInputsFilled) {
        // If all inputs filled and not submitted, check answer
        checkAnswer();
      }
    }
  }, [isSubmitted, allInputsFilled, checkAnswer, handleNext]);

  if (loadingQuestions || questions.length === 0) {
    return (
      <div className="text-center p-6 text-gray-700 dark:text-gray-100">
        {error ? (
          <p className="text-red-500 dark:text-red-300">{error}</p>
        ) : (
          <>
            <svg className="animate-spin h-8 w-8 text-[#FFB500] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating adaptive questions...
          </>
        )}
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    return <CompletionScreen onReset={onReset} message="You've completed the fill-in-the-blank challenge!" />;
  }
  
  let blankInputCounter = 0; // To correctly map userInputs to the right blank

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 dark:bg-gray-700">
          <div className="bg-[#FFB500] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Fill in the blank for the phrase related to{' '}
          <span className="font-bold text-[#FFB500]">{currentQuestion.topicTitle}</span>:
        </h3>
        <p className="mt-4 text-xl font-medium text-gray-800 dark:text-gray-100 flex flex-wrap justify-center gap-1">
          {currentQuestion.displayPhraseParts.map((part, index) => {
            if (part === null) {
              const blankIdx = blankInputCounter++; // Use and then increment
              return (
                <input
                  key={`blank-${currentQuestion.id}-${blankIdx}`} // Unique key for input
                  ref={blankIdx === 0 ? firstBlankInputRef : null} // Assign ref only to the first blank
                  type="text"
                  value={userInputs[blankIdx] || ''} // Ensure value is defined
                  onChange={(e) => handleInputChange(blankIdx, e.target.value)}
                  onKeyDown={handleKeyDown} // Add onKeyDown handler
                  disabled={isSubmitted}
                  className={`flex-grow min-w-[80px] max-w-[200px] p-2 border-b-2 text-center text-gray-800 dark:text-gray-100
                    ${isSubmitted
                      ? (correctness[blankIdx] ? 'border-green-500 bg-green-50 dark:bg-green-900' : 'border-red-500 bg-red-50 dark:bg-red-900')
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                    }
                    focus:outline-none focus:border-[#FFB500] transition-colors duration-200 rounded-sm`}
                  placeholder="..."
                  aria-label={`Blank for ${currentQuestion.topicTitle}`}
                />
              );
            } else {
              return (
                <span key={`text-${currentQuestion.id}-${index}`} className="mx-0.5">{part}</span>
              );
            }
          })}
        </p>
        {isSubmitted && correctness.some(isCorrect => !isCorrect) && ( // Show correct answers if any are incorrect
          <div className="mt-2 text-sm text-red-600 dark:text-red-300">
            {correctness.map((isCorrect, idx) => !isCorrect && (
              <p key={`feedback-correct-${idx}`}>
                For blank {idx + 1}, correct was: <span className="font-bold">{currentQuestion.correctAnswers[idx]}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        {!isSubmitted ? (
          <button
            onClick={checkAnswer}
            disabled={!allInputsFilled} // Disable if any input is empty
            className="bg-[#FFB500] text-[#351C15] font-bold py-2 px-8 rounded-lg hover:bg-[#E6A300] transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        ) : (
          <button
            ref={nextButtonRef} {/* Assign the ref to the Next button */}
            onClick={handleNext}
            className="bg-green-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};