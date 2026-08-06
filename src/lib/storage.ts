import { CATEGORY_ORDER, CHARACTERS_BY_ID, DEFAULT_ENABLED_CATEGORIES } from '../data/hangul';
import type { AnswerResult, CharacterProgress, PersistedState, ProgressMap } from '../types';

export const STORAGE_KEY = 'hangul-flashcards';
/** Where version 1 lived. Read once, then folded into STORAGE_KEY. */
export const LEGACY_STORAGE_KEY = 'hangul-flashcards:v1';
export const STORAGE_VERSION = 2;

const ANSWER_RESULTS: AnswerResult[] = ['correct-unassisted', 'correct-assisted', 'incorrect'];

export function createDefaultState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    progress: {},
    settings: {
      enabledCategories: [...DEFAULT_ENABLED_CATEGORIES],
      soundEnabled: false,
      testMode: false,
    },
    bestStreak: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toAnswerResult(value: unknown): AnswerResult | undefined {
  return ANSWER_RESULTS.find((result) => result === value);
}

function parseCharacterProgress(value: unknown): CharacterProgress | null {
  if (!isRecord(value)) return null;
  const lastResult = toAnswerResult(value.lastResult);
  return {
    shownCount: toCount(value.shownCount),
    unassistedCorrectCount: toCount(value.unassistedCorrectCount),
    assistedCorrectCount: toCount(value.assistedCorrectCount),
    incorrectCount: toCount(value.incorrectCount),
    currentUnassistedCorrectStreak: toCount(value.currentUnassistedCorrectStreak),
    lastShownAt: toTimestamp(value.lastShownAt),
    ...(lastResult ? { lastResult } : {}),
  };
}

/**
 * Version 1 knew nothing about the chart, so every recorded answer was made
 * without help: `correctCount` becomes `unassistedCorrectCount` and the old
 * streak carries over untouched. `lastResult` is inferred so migrated
 * characters keep their adaptive priority instead of falling back to neutral.
 */
function migrateCharacterProgressV1(value: unknown): CharacterProgress | null {
  if (!isRecord(value)) return null;
  const unassistedCorrectCount = toCount(value.correctCount);
  const incorrectCount = toCount(value.incorrectCount);
  const currentUnassistedCorrectStreak = toCount(value.currentCorrectStreak);
  const lastResult: AnswerResult | undefined =
    currentUnassistedCorrectStreak > 0
      ? 'correct-unassisted'
      : incorrectCount > 0
        ? 'incorrect'
        : undefined;

  return {
    shownCount: toCount(value.shownCount),
    unassistedCorrectCount,
    assistedCorrectCount: 0,
    incorrectCount,
    currentUnassistedCorrectStreak,
    lastShownAt: toTimestamp(value.lastShownAt),
    ...(lastResult ? { lastResult } : {}),
  };
}

function parseProgress(
  value: unknown,
  parseEntry: (entry: unknown) => CharacterProgress | null,
): ProgressMap {
  if (!isRecord(value)) return {};
  const progress: ProgressMap = {};
  for (const [characterId, entry] of Object.entries(value)) {
    if (!CHARACTERS_BY_ID[characterId]) continue;
    const parsed = parseEntry(entry);
    if (parsed) progress[characterId] = parsed;
  }
  return progress;
}

function parseEnabledCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_ENABLED_CATEGORIES];
  const categories = value.filter(
    (category): category is string =>
      typeof category === 'string' && (CATEGORY_ORDER as string[]).includes(category),
  );
  return categories.length > 0 ? Array.from(new Set(categories)) : [...DEFAULT_ENABLED_CATEGORIES];
}

/** Turns anything found in storage into a usable state, falling back per field. */
export function parsePersistedState(raw: unknown): PersistedState {
  if (!isRecord(raw)) return createDefaultState();
  if (raw.version !== 1 && raw.version !== STORAGE_VERSION) return createDefaultState();

  const settings = isRecord(raw.settings) ? raw.settings : {};
  return {
    version: STORAGE_VERSION,
    progress:
      raw.version === 1
        ? parseProgress(raw.progress, migrateCharacterProgressV1)
        : parseProgress(raw.progress, parseCharacterProgress),
    settings: {
      enabledCategories: parseEnabledCategories(settings.enabledCategories),
      soundEnabled: settings.soundEnabled === true,
      testMode: settings.testMode === true,
    },
    bestStreak: toCount(raw.bestStreak),
  };
}

export function loadState(): PersistedState {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultState();
    return parsePersistedState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Private mode or a full quota — the app keeps working from memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Nothing to recover from; in-memory state is reset by the caller anyway.
  }
}
