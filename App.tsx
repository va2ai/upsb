import React, { useState, useCallback, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { MultipleChoiceGame } from './components/MultipleChoiceGame';
import { FillInTheBlankGame } from './components/FillInTheBlankGame';
import { RecallGame } from './components/RecallGame';
import { FIVE_SEEING_HABITS, TEN_POINT_COMMENTARY } from './constants';
import type { GameMode, DifficultyLevel } from './types';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('5s');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [gameId, setGameId] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleReset = useCallback(() => {
    setGameId(prevId => prevId + 1);
  }, []);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficulty(level);
    handleReset();
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const gameData = gameMode === '5s' ? FIVE_SEEING_HABITS : TEN_POINT_COMMENTARY;
  const gameTitle = gameMode === '5s' ? '5 Seeing Habits' : '10 Point Commentary';

  const difficultyLevels: { level: DifficultyLevel; label: string; description: string }[] = [
    { level: 1, label: 'Level 1: Match', description: 'Drag and drop phrases into the correct categories.' },
    { level: 2, label: 'Level 2: Identify', description: 'Select the correct phrase from a list of options.' },
    { level: 3, label: 'Level 3: Complete', description: 'Fill in the blanks for each phrase.' },
    { level: 4, label: 'Level 4: Recall', description: 'Type out all phrases for a category from memory.' },
  ];

  const renderGame = () => {
    const props = {
      key: gameId,
      topics: gameData,
      onReset: handleReset,
    };
    switch (difficulty) {
      case 1:
        return <GameBoard {...props} />;
      case 2:
        return <MultipleChoiceGame {...props} />;
      case 3:
        return <FillInTheBlankGame {...props} />;
      case 4:
        return <RecallGame {...props} />;
      default:
        return <GameBoard {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-white shadow-md dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 md:py-6 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#351C15] dark:text-gray-100">
            UPS Driving Habits Memorizer
          </h1>
          <nav className="mt-4 sm:mt-0 flex space-x-2 items-center">
            <button
              onClick={() => { setGameMode('5s'); handleReset(); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
                gameMode === '5s' ? 'bg-[#FFB500] text-[#351C15] shadow-sm' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              5 Seeing Habits
            </button>
            <button
              onClick={() => { setGameMode('10s'); handleReset(); }}
              className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
                gameMode === '10s' ? 'bg-[#FFB500] text-[#351C15] shadow-sm' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              10 Point Commentary
            </button>
            <button
              onClick={toggleDarkMode}
              className="ml-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.5-4.5L5.049 19.049M3.75 12H6m-.386-6.364l1.591 1.591M12 12a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 21.75c-3.617 0-6.945-1.428-9.397-3.75a.75.75 0 00-1.04.094A7.534 7.534 0 0012 22.5c2.75 0 5.422-1.025 7.46-2.9 1.492-1.41 2.57-3.227 3-5.228a.75.75 0 00-.14- হট.351z" />
                </svg>
              )}
            </button>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-xl font-semibold mb-3 text-center text-gray-700 dark:text-gray-100">Select a Difficulty Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {difficultyLevels.map(({ level, label }) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-4 py-3 rounded-md font-semibold text-center transition-all duration-200 transform hover:scale-105 ${
                  difficulty === level ? 'bg-[#FFB500] text-[#351C15] shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">{gameTitle} - {difficultyLevels.find(d => d.level === difficulty)?.label}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
            {difficultyLevels.find(d => d.level === difficulty)?.description}
          </p>
        </div>
        
        {renderGame()}
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm dark:text-gray-400">
        <p>Built for learning and practice. Good luck!</p>
      </footer>
    </div>
  );
};

export default App;