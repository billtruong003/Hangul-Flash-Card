import {
  resetAnalyticsTransport,
  setAnalyticsTransport,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '../lib/analytics';
import { createEmptyProgress } from '../lib/progress';
import type { CharacterProgress, HangulCharacter } from '../types';

export type RecordedEvent = { name: AnalyticsEventName; properties?: AnalyticsProperties };

/**
 * Installs a recording transport for one test. Analytics is a no-op by default
 * under Vitest, so only the tests that care about events opt in here — no other
 * test file has to know analytics exists.
 */
export function recordAnalytics(): RecordedEvent[] {
  const events: RecordedEvent[] = [];
  setAnalyticsTransport((name, properties) => events.push({ name, properties }));
  return events;
}

/** Makes every event throw, to prove analytics failures cannot reach the UI. */
export function breakAnalytics(): void {
  setAnalyticsTransport(() => {
    throw new Error('analytics beacon exploded');
  });
}

export function restoreAnalytics(): void {
  resetAnalyticsTransport();
}

export function eventNames(events: RecordedEvent[]): AnalyticsEventName[] {
  return events.map((event) => event.name);
}

export function eventsNamed(events: RecordedEvent[], name: AnalyticsEventName): RecordedEvent[] {
  return events.filter((event) => event.name === name);
}

/** Deterministic PRNG (mulberry32) so shuffling is reproducible inside tests. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeProgress(overrides: Partial<CharacterProgress> = {}): CharacterProgress {
  return { ...createEmptyProgress(), ...overrides };
}

export function makeCharacter(
  id: string,
  overrides: Partial<HangulCharacter> = {},
): HangulCharacter {
  return {
    id,
    character: id.toUpperCase(),
    romaja: id,
    category: 'basic-consonant',
    ...overrides,
  };
}
