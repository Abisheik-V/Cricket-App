import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectMatch } from '../redux/slices/matchSlice';

const STORAGE_KEY = 'cricket_live_match';

export const useOfflineSync = () => {
  const matchState = useSelector(selectMatch);

  // Save to localStorage on every state change
  useEffect(() => {
    if (matchState.status === 'live') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matchState));
      } catch (e) {
        console.warn('LocalStorage write failed:', e);
      }
    }
  }, [matchState]);

  // Restore from localStorage
  const restoreMatch = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const clearSaved = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasSavedMatch = useCallback(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  }, []);

  return { restoreMatch, clearSaved, hasSavedMatch };
};
