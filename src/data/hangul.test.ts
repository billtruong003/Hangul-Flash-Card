import { romanize } from 'es-hangul';
import { describe, expect, it } from 'vitest';
import { CATEGORY_ORDER, CHARACTERS_BY_ID, HANGUL_CHARACTERS } from './hangul';
import type { HangulCharacter } from '../types';

/**
 * This table is hand-written, and a wrong letter here teaches someone the wrong
 * sound with no other symptom. So rather than restating the romanization in the
 * assertions — which would just be the same typo twice — every claim is checked
 * against es-hangul's `romanize`, an independent implementation of the official
 * Revised Romanization.
 */

const VOWEL_CATEGORIES = new Set(['basic-vowel', 'compound-vowel']);

const isVowel = (character: HangulCharacter) => VOWEL_CATEGORIES.has(character.category);

const consonants = HANGUL_CHARACTERS.filter((character) => !isVowel(character));
const vowels = HANGUL_CHARACTERS.filter(isVowel);

describe('the Hangul table', () => {
  it('covers all 40 letters exactly once', () => {
    expect(HANGUL_CHARACTERS).toHaveLength(40);
    expect(new Set(HANGUL_CHARACTERS.map((character) => character.id)).size).toBe(40);
    expect(new Set(HANGUL_CHARACTERS.map((character) => character.character)).size).toBe(40);
  });

  it('gives every letter a romanization no other letter shares', () => {
    // Two options carrying the same label would make a question unanswerable,
    // and buildAnswerOptions leans on this to keep distractors distinct.
    const romaja = HANGUL_CHARACTERS.map((character) => character.romaja);
    expect(new Set(romaja).size).toBe(romaja.length);
  });

  it('only uses categories the app knows how to render', () => {
    for (const character of HANGUL_CHARACTERS) {
      expect(CATEGORY_ORDER).toContain(character.category);
    }
  });

  it('points every confusable at a letter that exists', () => {
    for (const character of HANGUL_CHARACTERS) {
      for (const id of character.confusableIds ?? []) {
        expect(CHARACTERS_BY_ID[id], `${character.character} → ${id}`).toBeDefined();
        expect(id).not.toBe(character.id);
      }
    }
  });
});

describe('demoSyllable — what speech synthesis actually reads', () => {
  it('is always a single composed Hangul syllable, never a bare jamo', () => {
    // A bare jamo (U+3131–U+3163) is read as the letter's *name*, which is the
    // bug this field exists to avoid. Composed syllables live in U+AC00–U+D7A3.
    for (const character of HANGUL_CHARACTERS) {
      expect(character.demoSyllable, character.id).toHaveLength(1);
      const code = character.demoSyllable.codePointAt(0) ?? 0;
      expect(code, `${character.character} → ${character.demoSyllable}`).toBeGreaterThanOrEqual(
        0xac00,
      );
      expect(code).toBeLessThanOrEqual(0xd7a3);
    }
  });

  it('demonstrates each consonant as that consonant followed by "a"', () => {
    for (const character of consonants) {
      // ㅇ is the exception, and deliberately so: it is silent as an initial, so
      // its demo syllable 아 romanizes to just the vowel. Its 'ng' only ever
      // appears as a batchim, which a single syllable cannot demonstrate.
      const expected = character.id === 'c-ng' ? 'a' : `${character.romaja}a`;
      expect(romanize(character.demoSyllable), character.character).toBe(expected);
    }
  });

  it('demonstrates each vowel as exactly its own romanization', () => {
    for (const character of vowels) {
      expect(romanize(character.demoSyllable), character.character).toBe(character.romaja);
    }
  });
});

describe('positional romanization', () => {
  it('matches romaja at the start of a syllable, except for the silent ㅇ', () => {
    for (const character of consonants) {
      const expected = character.id === 'c-ng' ? null : character.romaja;
      expect(character.initialRomaja, character.character).toBe(expected);
    }
  });

  it('only allows batchim sounds Korean actually permits', () => {
    // Korean neutralises every final consonant to one of seven sounds, and the
    // tense consonants ㄸ ㅃ ㅉ cannot close a syllable at all.
    const SEVEN_FINALS = ['k', 'n', 't', 'l', 'm', 'p', 'ng'];
    for (const character of consonants) {
      if (character.finalRomaja === null) {
        expect(['t-tt', 't-pp', 't-jj'], character.character).toContain(character.id);
        continue;
      }
      expect(SEVEN_FINALS, character.character).toContain(character.finalRomaja);
    }
  });

  it('leaves vowels out of the positional fields entirely', () => {
    for (const character of vowels) {
      expect(character.initialRomaja, character.character).toBeUndefined();
      expect(character.finalRomaja, character.character).toBeUndefined();
    }
  });
});
