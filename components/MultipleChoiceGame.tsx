import React, { useState, useEffect, useMemo } from 'react';
import type { Topic } from '../types';
import { CompletionScreen } from './CompletionScreen';

interface GameProps {
  topics: Topic[];
  onReset: () => void;
}

type Question = {
  topicTitle: string;
  correctPhrase: string;
  options: string[];
};

const shuffleArray = <T,>(array: T[]): T[] => {
  return array.slice().sort(() => Math.random() - 0.5);
};

export const MultipleChoiceGame: React.FC<GameProps> = ({ topics, onReset }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const allPhrases = useMemo(() => topics.flatMap(t => t.phrases), [topics]);

  useEffect(() => {
    const generatedQuestions = topics.flatMap(topic =>
      topic.phrases.map(phrase => {
        const distractors = shuffleArray(allPhrases.filter(p => p !== phrase)).slice(0, 3);
        return {
          topicTitle: topic.title,
          correctPhrase: phrase,
          options: shuffleArray([...distractors, phrase]),
        };
      })
    );
    setQuestions(shuffleArray(generatedQuestions));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
  }, [topics, allPhrases]);

  const handleAnswer = (answer: string) => {
    if (feedback) return; // Don't allow changing answer after submission
    setSelectedAnswer(answer);
    if (answer === questions[currentQuestionIndex].correctPhrase) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNext = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  if (currentQuestionIndex >= questions.length) {
    return <CompletionScreen onReset={onReset} message="You've finished the quiz!" />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionText = `Which phrase belongs to ${currentQuestion.topicTitle}?`; // Retained for context, not used for TTS.

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 dark:bg-gray-700">
          <div className="bg-[#FFB500] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>
      <div className="flex items-center justify-center mb-2">
        <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-200">
          Which phrase belongs to <span className="font-bold text-[#FFB500]">{currentQuestion.topicTitle}</span>?
        </h3>
      </div>
      <div className="space-y-3 mt-4">
        {currentQuestion.options.map(option => {
          const isCorrect = option === currentQuestion.correctPhrase;
          const isSelected = option === selectedAnswer;
          let buttonClass = 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100';
          if (feedback) {
            if (isCorrect) buttonClass = 'bg-green-500 text-white';
            else if (isSelected && !isCorrect) buttonClass = 'bg-red-500 text-white';
            else buttonClass = 'bg-gray-100 opacity-60 dark:bg-gray-700 dark:text-gray-100'; // Ensure disabled options look appropriate in dark mode
          }
          return (
            <div key={option} className="flex items-center justify-between">
                <button
                onClick={() => handleAnswer(option)}
                disabled={!!feedback}
                className={`w-full text-left p-4 rounded-md transition-all duration-200 ${buttonClass}`}
                >
                {option}
                </button>
            </div>
          );
        })}
      </div>
      {feedback && (
        <div className="text-center mt-6">
          <button
            onClick={handleNext}
            className="bg-[#FFB500] text-[#351C15] font-bold py-2 px-8 rounded-lg hover:bg-[#E6A300] transition-transform transform hover:scale-105"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};