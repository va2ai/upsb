import React from 'react';

interface CompletionScreenProps {
  onReset: () => void;
  message?: string;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ onReset, message }) => {
  return (
    <div className="text-center p-8 bg-green-100 border-2 border-green-400 rounded-lg shadow-lg max-w-lg mx-auto animate-fade-in dark:bg-green-900 dark:border-green-700">
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
      <h3 className="text-3xl font-bold text-green-700 mb-4 dark:text-green-300">Congratulations!</h3>
      <p className="text-lg text-green-600 mb-6 dark:text-green-200">
        {message || "You've completed the challenge successfully."}
      </p>
      <button
        onClick={onReset}
        className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
      >
        Play Again
      </button>
    </div>
  );
};