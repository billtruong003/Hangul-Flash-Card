import { describe, expect, it } from 'vitest';
import { SENTENCES, SENTENCES_BY_ID, SENTENCE_TOPICS } from './sentences';
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

  it('gives every topic enough sentences at every level to build a question', () => {
    // Topic and level filter independently, so every combination has to be
    // playable — four options means four sentences minimum in each cell.
    for (const topic of Object.keys(SENTENCE_TOPICS)) {
      for (const level of [1, 2, 3] as const) {
        const count = SENTENCES.filter(
          (entry) => entry.topic === topic && entry.level === level,
        ).length;
        expect(count, `${topic} / level ${level}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('labels every topic it uses, and uses every topic it labels', () => {
    const used = new Set(SENTENCES.map((entry) => entry.topic));
    expect([...used].sort()).toEqual(Object.keys(SENTENCE_TOPICS).sort());
    for (const label of Object.values(SENTENCE_TOPICS)) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps every Vietnamese meaning unique, so options are never ambiguous', () => {
    // Two options reading the same would make a question unanswerable.
    const meanings = SENTENCES.map((entry) => entry.vi);
    expect(new Set(meanings).size).toBe(meanings.length);
  });
});
