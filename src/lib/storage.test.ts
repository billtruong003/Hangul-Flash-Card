import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_ENABLED_CATEGORIES } from '../data/hangul';
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  createDefaultState,
  loadState,
  parsePersistedState,
  saveState,
} from './storage';

afterEach(() => {
  window.localStorage.clear();
});

describe('parsePersistedState', () => {
  it('falls back to defaults for malformed input', () => {
    const defaults = createDefaultState();
    expect(parsePersistedState(null)).toEqual(defaults);
    expect(parsePersistedState('not json')).toEqual(defaults);
    expect(parsePersistedState([])).toEqual(defaults);
    expect(parsePersistedState({ version: 99 })).toEqual(defaults);
  });

  it('defaults to basic consonants and vowels, sound off, test mode off', () => {
    const defaults = createDefaultState();
    expect(defaults.version).toBe(2);
    expect(defaults.settings.enabledCategories).toEqual(DEFAULT_ENABLED_CATEGORIES);
    expect(defaults.settings.soundEnabled).toBe(false);
    expect(defaults.settings.testMode).toBe(false);
    expect(defaults.bestStreak).toBe(0);
  });

  it('keeps valid version 2 data intact', () => {
    const state = {
      version: 2,
      progress: {
        'c-g': {
          shownCount: 6,
          unassistedCorrectCount: 3,
          assistedCorrectCount: 2,
          incorrectCount: 1,
          currentUnassistedCorrectStreak: 2,
          lastShownAt: 1700000000000,
          lastResult: 'correct-assisted',
        },
      },
      settings: {
        enabledCategories: ['basic-consonant', 'tense-consonant'],
        soundEnabled: true,
        testMode: true,
      },
      bestStreak: 12,
    };
    expect(parsePersistedState(state)).toEqual(state);
  });

  it('drops unknown character ids and repairs broken counters', () => {
    const parsed = parsePersistedState({
      version: 2,
      progress: {
        'c-g': {
          shownCount: -3,
          unassistedCorrectCount: 'x',
          incorrectCount: 1.7,
          lastShownAt: 'nope',
          lastResult: 'made-up',
        },
        'not-a-character': { shownCount: 5 },
      },
      settings: { enabledCategories: ['basic-consonant'], soundEnabled: true },
      bestStreak: -4,
    });

    expect(Object.keys(parsed.progress)).toEqual(['c-g']);
    expect(parsed.progress['c-g']).toEqual({
      shownCount: 0,
      unassistedCorrectCount: 0,
      assistedCorrectCount: 0,
      incorrectCount: 1,
      currentUnassistedCorrectStreak: 0,
      lastShownAt: null,
    });
    expect(parsed.bestStreak).toBe(0);
    expect(parsed.settings.testMode).toBe(false);
  });

  it('rejects unknown categories and never leaves the set empty', () => {
    expect(
      parsePersistedState({
        version: 2,
        settings: { enabledCategories: ['made-up', 42] },
      }).settings.enabledCategories,
    ).toEqual(DEFAULT_ENABLED_CATEGORIES);

    expect(
      parsePersistedState({
        version: 2,
        settings: { enabledCategories: ['compound-vowel', 'compound-vowel', 'bogus'] },
      }).settings.enabledCategories,
    ).toEqual(['compound-vowel']);
  });

  it('treats a non-boolean sound flag as off', () => {
    expect(
      parsePersistedState({ version: 2, settings: { soundEnabled: 'yes' } }).settings.soundEnabled,
    ).toBe(false);
  });
});

describe('migration from version 1', () => {
  const v1State = {
    version: 1,
    progress: {
      'c-g': {
        shownCount: 9,
        correctCount: 7,
        incorrectCount: 2,
        currentCorrectStreak: 4,
        lastShownAt: 1700000000000,
      },
      'c-n': {
        shownCount: 3,
        correctCount: 1,
        incorrectCount: 2,
        currentCorrectStreak: 0,
        lastShownAt: 1700000001000,
      },
      'c-d': { shownCount: 0, correctCount: 0, incorrectCount: 0, currentCorrectStreak: 0 },
    },
    settings: { enabledCategories: ['basic-consonant'], soundEnabled: true },
    bestStreak: 9,
  };

  it('moves correctCount into unassistedCorrectCount and keeps the streak', () => {
    const parsed = parsePersistedState(v1State);

    expect(parsed.version).toBe(2);
    expect(parsed.progress['c-g']).toEqual({
      shownCount: 9,
      unassistedCorrectCount: 7,
      assistedCorrectCount: 0,
      incorrectCount: 2,
      currentUnassistedCorrectStreak: 4,
      lastShownAt: 1700000000000,
      lastResult: 'correct-unassisted',
    });
  });

  it('infers the last result so adaptive priority survives the upgrade', () => {
    const parsed = parsePersistedState(v1State);
    expect(parsed.progress['c-n'].lastResult).toBe('incorrect');
    expect(parsed.progress['c-d'].lastResult).toBeUndefined();
  });

  it('carries settings over and adds test mode as off', () => {
    const parsed = parsePersistedState(v1State);
    expect(parsed.settings).toEqual({
      enabledCategories: ['basic-consonant'],
      soundEnabled: true,
      testMode: false,
    });
    expect(parsed.bestStreak).toBe(9);
  });

  it('loses nothing when the data still sits under the legacy key', () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(v1State));

    const loaded = loadState();
    expect(loaded.progress['c-g'].unassistedCorrectCount).toBe(7);
    expect(loaded.bestStreak).toBe(9);

    saveState(loaded);
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2);
  });

  it('prefers the current key when both exist', () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(v1State));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...createDefaultState(), bestStreak: 42 }),
    );
    expect(loadState().bestStreak).toBe(42);
  });
});
