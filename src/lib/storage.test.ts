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
    expect(defaults.version).toBe(3);
    expect(defaults.settings.enabledCategories).toEqual(DEFAULT_ENABLED_CATEGORIES);
    expect(defaults.settings.soundEnabled).toBe(false);
    expect(defaults.settings.testMode).toBe(false);
    expect(defaults.bestStreak).toBe(0);
    expect(defaults.ui.section).toBe('letters');
    expect(defaults.strokes).toEqual({});
    expect(defaults.syllables).toEqual({});
    expect(defaults.listening).toEqual({});
  });

  it('accepts version 2 data untouched and starts the new surfaces empty', () => {
    // The whole point of making v3 additive: someone mid-way through learning
    // the alphabet must not lose that history to a feature they never used.
    const v2 = {
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

    const parsed = parsePersistedState({ version: 2, ...v2 });

    expect(parsed).toMatchObject(v2);
    expect(parsed.version).toBe(3);
    expect(parsed.strokes).toEqual({});
    expect(parsed.syllables).toEqual({});
    expect(parsed.listening).toEqual({});
    expect(parsed.ui.section).toBe('letters');
  });

  it('keeps valid version 3 data intact', () => {
    const state = {
      version: 3,
      progress: {},
      strokes: {
        'c-g': {
          attemptCount: 4,
          cleanCount: 2,
          bestScore: 91,
          lastScore: 78,
          currentCleanStreak: 1,
          lastPracticedAt: 1700000000000,
        },
      },
      syllables: {
        감: {
          builtCount: 3,
          correctCount: 2,
          incorrectCount: 1,
          currentCorrectStreak: 2,
          lastBuiltAt: 1700000000000,
        },
      },
      listening: {
        s01: {
          heardCount: 5,
          correctCount: 4,
          incorrectCount: 1,
          replayCount: 7,
          currentCorrectStreak: 3,
          lastHeardAt: 1700000000000,
        },
      },
      settings: { enabledCategories: ['basic-vowel'], soundEnabled: true, testMode: false },
      bestStreak: 8,
      ui: { section: 'listening' },
    };
    expect(parsePersistedState(state)).toEqual(state);
  });

  it('drops progress for letters, syllables and sentences it no longer ships', () => {
    // The sentence deck in particular is expected to churn between releases.
    const parsed = parsePersistedState({
      version: 3,
      strokes: { 'c-g': {}, 'not-a-letter': { attemptCount: 9 } },
      syllables: { 감: {}, 뷁: { builtCount: 9 } },
      listening: { s01: {}, 'retired-sentence': { heardCount: 9 } },
    });

    expect(Object.keys(parsed.strokes)).toEqual(['c-g']);
    expect(Object.keys(parsed.syllables)).toEqual(['감']);
    expect(Object.keys(parsed.listening)).toEqual(['s01']);
  });

  it('clamps a stroke score into 0–100 and repairs broken counters', () => {
    const parsed = parsePersistedState({
      version: 3,
      strokes: {
        'c-g': {
          attemptCount: -2,
          cleanCount: 'x',
          bestScore: 5000,
          lastScore: -40,
          currentCleanStreak: 2.9,
          lastPracticedAt: 'nope',
        },
      },
    });

    expect(parsed.strokes['c-g']).toEqual({
      attemptCount: 0,
      cleanCount: 0,
      bestScore: 100,
      lastScore: 0,
      currentCleanStreak: 2,
      lastPracticedAt: null,
    });
  });

  it('falls back to the letters section when the stored one is nonsense', () => {
    expect(parsePersistedState({ version: 3, ui: { section: 'wat' } }).ui.section).toBe('letters');
    expect(parsePersistedState({ version: 3, ui: 'wat' }).ui.section).toBe('letters');
    expect(parsePersistedState({ version: 3 }).ui.section).toBe('letters');
    expect(parsePersistedState({ version: 3, ui: { section: 'writing' } }).ui.section).toBe(
      'writing',
    );
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

    expect(parsed.version).toBe(3);
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
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(3);
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
