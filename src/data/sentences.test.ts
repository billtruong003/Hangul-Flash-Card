import { describe, expect, it } from 'vitest';
import { SENTENCES, SENTENCES_BY_ID } from './sentences';
import { romanizeKorean } from '../lib/syllable';

const HANGUL_SYLLABLE = /^[가-힣]+$/;

describe('the listening deck', () => {
  it('gives every sentence a unique id', () => {
    expect(Object.keys(SENTENCES_BY_ID)).toHaveLength(SENTENCES.length);
  });

  it('has no duplicate Korean text', () => {
    const korean = SENTENCES.map((entry) => entry.ko);
    expect(new Set(korean).size).toBe(korean.length);
  });

  it('keeps the word breakdown in sync with the sentence', () => {
    // The breakdown drives tap-to-hear, so a mismatch would play something the
    // learner never saw. Rejoining is the cheapest way to keep them honest.
    for (const entry of SENTENCES) {
      expect(entry.words.map((word) => word.ko).join(' '), entry.id).toBe(entry.ko);
    }
  });

  it('writes every word in Hangul only', () => {
    for (const entry of SENTENCES) {
      for (const word of entry.words) {
        expect(word.ko, `${entry.id}: ${word.ko}`).toMatch(HANGUL_SYLLABLE);
      }
    }
  });

  it('translates every sentence and every word', () => {
    for (const entry of SENTENCES) {
      expect(entry.vi.trim().length, entry.id).toBeGreaterThan(0);
      for (const word of entry.words) {
        expect(word.vi.trim().length, `${entry.id}: ${word.ko}`).toBeGreaterThan(0);
      }
    }
  });

  it('can be romanized, so the reveal panel always has something to show', () => {
    for (const entry of SENTENCES) {
      expect(romanizeKorean(entry.ko).trim().length, entry.id).toBeGreaterThan(0);
    }
  });

  it('covers all three levels, easiest first within the file', () => {
    const levels = SENTENCES.map((entry) => entry.level);
    expect(new Set(levels)).toEqual(new Set([1, 2, 3]));
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });

  it('keeps level 1 to single words and level 3 to real sentences', () => {
    for (const entry of SENTENCES) {
      if (entry.level === 1) expect(entry.words, entry.id).toHaveLength(1);
      if (entry.level === 3) expect(entry.words.length, entry.id).toBeGreaterThan(1);
    }
  });

  it('has at least four sentences per level, so a quiz can build distractors', () => {
    for (const level of [1, 2, 3] as const) {
      const count = SENTENCES.filter((entry) => entry.level === level).length;
      expect(count, `level ${level}`).toBeGreaterThanOrEqual(4);
    }
  });
});
