import { describe, expect, it } from 'vitest';
import { CHARACTERS_BY_ID } from '../data/hangul';
import { SYLLABLES, SYLLABLES_BY_ID } from '../data/syllables';
import {
  POSSIBLE_FINALS,
  POSSIBLE_INITIALS,
  POSSIBLE_MEDIALS,
  compose,
  decompose,
  romanizeKorean,
} from './syllable';

describe('decompose', () => {
  it('splits a plain syllable into initial and medial', () => {
    expect(decompose('가')).toMatchObject({
      initial: { id: 'c-g' },
      medial: { id: 'v-a' },
      final: null,
    });
  });

  it('splits a syllable that closes on a batchim', () => {
    expect(decompose('감')).toMatchObject({
      initial: { id: 'c-g' },
      medial: { id: 'v-a' },
      final: { id: 'c-m' },
    });
  });

  it('reports a compound vowel as the single letter the app teaches', () => {
    // es-hangul hands back 'ㅜㅣ' — the two letters ㅟ was built from. The app
    // teaches ㅟ as one letter with its own id, so the wrapper has to translate.
    expect(decompose('위')?.medial.character).toBe('ㅟ');
    expect(decompose('뭐')?.medial.character).toBe('ㅝ');
    expect(decompose('과')?.medial.character).toBe('ㅘ');
    expect(decompose('의')?.medial.character).toBe('ㅢ');
  });

  it('refuses a syllable whose batchim is a cluster the app does not teach', () => {
    // 닭 ends in ㄺ, 값 in ㅄ. Half-matching these would ask the learner to
    // recognise a letter they have never been shown.
    expect(decompose('닭')).toBeNull();
    expect(decompose('값')).toBeNull();
  });

  it('refuses anything that is not one complete syllable', () => {
    expect(decompose('ㄱ')).toBeNull();
    expect(decompose('가나')).toBeNull();
    expect(decompose('a')).toBeNull();
    expect(decompose('')).toBeNull();
  });
});

describe('compose', () => {
  it('builds a syllable from letter ids', () => {
    expect(compose('c-g', 'v-a')).toBe('가');
    expect(compose('c-g', 'v-a', 'c-m')).toBe('감');
    expect(compose('c-ng', 'v-a', 'c-ng')).toBe('앙');
  });

  it('round-trips with decompose across every legal combination', () => {
    for (const initial of POSSIBLE_INITIALS) {
      for (const medial of POSSIBLE_MEDIALS) {
        const built = compose(initial.id, medial.id);
        expect(built, `${initial.character}+${medial.character}`).not.toBeNull();

        const parts = decompose(built as string);
        expect(parts?.initial.id).toBe(initial.id);
        expect(parts?.medial.id).toBe(medial.id);
        expect(parts?.final).toBeNull();
      }
    }
  });

  it('round-trips with a batchim too', () => {
    for (const final of POSSIBLE_FINALS) {
      const built = compose('c-g', 'v-a', final.id);
      expect(built, final.character).not.toBeNull();
      expect(decompose(built as string)?.final?.id).toBe(final.id);
    }
  });

  it('refuses the tense consonants that cannot close a syllable', () => {
    for (const id of ['t-tt', 't-pp', 't-jj']) {
      expect(CHARACTERS_BY_ID[id].finalRomaja).toBeNull();
      expect(compose('c-g', 'v-a', id), id).toBeNull();
    }
  });

  it('refuses a vowel where a consonant belongs, and unknown ids', () => {
    expect(compose('v-a', 'v-a')).toBeNull();
    expect(compose('c-g', 'c-n')).toBeNull();
    expect(compose('nope', 'v-a')).toBeNull();
    expect(compose('c-g', 'v-a', 'nope')).toBeNull();
  });
});

describe('romanizeKorean', () => {
  it('applies the standard sound changes rather than spelling letter by letter', () => {
    // Each of these differs from a naive per-jamo transliteration, which is why
    // the app leans on es-hangul instead of its own lookup table.
    expect(romanizeKorean('신라')).toBe('silla'); // 유음화
    expect(romanizeKorean('국물')).toBe('gungmul'); // 비음화
    expect(romanizeKorean('같이')).toBe('gachi'); // 구개음화
    expect(romanizeKorean('꽃')).toBe('kkot'); // 받침 대표음
    expect(romanizeKorean('좋아요')).toBe('joayo'); // ㅎ 탈락
  });

  it('leaves tensification out of the spelling, as the standard requires', () => {
    // The trap this guards: standardizePronunciation() first, then romanize()
    // yields "hankkuk". romanize() alone is the correct "hanguk".
    expect(romanizeKorean('한국')).toBe('hanguk');
    expect(romanizeKorean('학교')).toBe('hakgyo');
  });
});

describe('the syllable deck', () => {
  it('has no duplicates', () => {
    expect(Object.keys(SYLLABLES_BY_ID)).toHaveLength(SYLLABLES.length);
  });

  it('only uses letters the app actually teaches', () => {
    for (const entry of SYLLABLES) {
      expect(decompose(entry.syllable), `${entry.syllable} (${entry.meaning})`).not.toBeNull();
    }
  });

  it('gives every syllable a Vietnamese meaning', () => {
    for (const entry of SYLLABLES) {
      expect(entry.meaning.trim().length, entry.syllable).toBeGreaterThan(0);
    }
  });

  it('can be rebuilt from its own parts', () => {
    for (const entry of SYLLABLES) {
      const parts = decompose(entry.syllable);
      expect(compose(parts!.initial.id, parts!.medial.id, parts!.final?.id)).toBe(entry.syllable);
    }
  });
});
