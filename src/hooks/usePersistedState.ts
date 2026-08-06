import { useCallback, useEffect, useState } from 'react';
import { clearState, createDefaultState, loadState, saveState } from '../lib/storage';
import type { PersistedState } from '../types';

/** Owns the long-term state and mirrors every change into LocalStorage. */
export function usePersistedState() {
  const [state, setState] = useState<PersistedState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const resetAll = useCallback(() => {
    clearState();
    setState(createDefaultState());
  }, []);

  return { state, setState, resetAll };
}
