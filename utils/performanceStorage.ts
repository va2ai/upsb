import { UserPerformanceData } from '../types';

let performanceData: UserPerformanceData | null = null;

const STORAGE_KEY = 'upsMemorizerPerformance';

export function getUserPerformanceData(): UserPerformanceData {
  if (performanceData) {
    return performanceData;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    performanceData = data ? JSON.parse(data) : {};
    return performanceData;
  } catch (error) {
    console.error('Error parsing performance data from localStorage:', error);
    performanceData = {};
    return performanceData;
  }
}

export function updatePhrasePerformance(topicId: string, originalPhrase: string, failedWords: string[]): void {
  const data = getUserPerformanceData();

  if (!data[topicId]) {
    data[topicId] = {};
  }
  if (!data[topicId][originalPhrase]) {
    data[topicId][originalPhrase] = { failedWords: {} };
  }

  failedWords.forEach(word => {
    const normalizedWord = word.toLowerCase().trim(); // Normalize word for consistent tracking
    data[topicId][originalPhrase].failedWords[normalizedWord] = 
      (data[topicId][originalPhrase].failedWords[normalizedWord] || 0) + 1;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    performanceData = data; // Update in-memory cache
  } catch (error) {
    console.error('Error saving performance data to localStorage:', error);
  }
}

// Function to reset all performance data (optional, but good for testing/development)
export function resetUserPerformanceData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    performanceData = {};
  } catch (error) {
    console.error('Error resetting performance data in localStorage:', error);
  }
}