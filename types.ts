export interface Topic {
  id: string;
  title: string;
  phrases: string[];
}

export type GameMode = '5s' | '10s';

export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface PlacedItems {
  [key: string]: string[];
}

// New interface for user performance data stored in localStorage
export interface UserPerformanceData {
  [topicId: string]: {
    [phrase: string]: {
      failedWords: { [word: string]: number }; // Count of how many times this word was failed for this phrase
    };
  };
}

// New interface for fill-in-the-blank questions
export interface BlankQuestion {
  id: string; // Unique ID for the question
  originalPhrase: string;
  topicTitle: string;
  topicId: string; // Add this for consistent performance tracking
  displayPhraseParts: Array<string | null>; // Parts of the phrase, null for blank
  correctAnswers: string[]; // The words that fill the blanks (can be multiple)
}