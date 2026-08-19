import { combineCharacter, disassembleCompleteCharacter, romanize } from 'es-hangul';
import { CHARACTERS_BY_ID, HANGUL_CHARACTERS } from '../data/hangul';
import type { HangulCharacter } from '../types';

/**
 * Turning jamo into syllables and back.
 *
 * This wraps es-hangul rather than calling it directly, for one reason worth
 * stating: es-hangul represents a compound vowel as the two letters it was
 * built from — `disassembleCompleteCharacter('위').jungseong` is `'ㅜㅣ'`, not
 * `'ㅟ'`. The app teaches ㅟ as a single letter with its own id, so every
 * boundary crossing has to translate. Compound finals (겹받침 such as ㄺ) come
 * back the same way, and since the app does not teach them, a syllable
 * containing one is reported as unteachable instead of silently half-matching.
 */

/** es-hangul's two-letter spelling → the single letter the app teaches. */
const COMPOUND_VOWELS: Record<string, string> = {
  ㅗㅏ: 'ㅘ',
  ㅗㅐ: 'ㅙ',
  ㅗㅣ: 'ㅚ',
  ㅜㅓ: 'ㅝ',
  ㅜㅔ: 'ㅞ',
  ㅜㅣ: 'ㅟ',
  ㅡㅣ: 'ㅢ',
};

/** The same table read the other way, for handing letters back to es-hangul. */
const EXPANDED_VOWELS: Record<string, string> = Object.fromEntries(
  Object.entries(COMPOUND_VOWELS).map(([expanded, single]) => [single, expanded]),
);

const CHARACTER_BY_JAMO = new Map(
  HANGUL_CHARACTERS.map((character) => [character.character, character]),
);

function toTaughtLetter(jamo: string): HangulCharacter | null {
  return CHARACTER_BY_JAMO.get(COMPOUND_VOWELS[jamo] ?? jamo) ?? null;
}

export type SyllableParts = {
  initial: HangulCharacter;
  medial: HangulCharacter;
  /** Absent for an open syllable — one that ends on its vowel. */
  final: HangulCharacter | null;
};

/**
 * Splits a syllable into the three letters the app teaches, or returns null if
 * any part is something it does not teach (a 겹받침, or a jamo outside the 40).
 */
export function decompose(syllable: string): SyllableParts | null {
  // es-hangul reads only the first character, so a whole word would otherwise
  // come back looking like a single valid syllable.
  if ([...syllable].length !== 1) return null;

  const parts = disassembleCompleteCharacter(syllable);
  if (!parts) return null;

  const initial = toTaughtLetter(parts.choseong);
  const medial = toTaughtLetter(parts.jungseong);
  if (!initial || !medial) return null;

  if (!parts.jongseong) return { initial, medial, final: null };

  const final = toTaughtLetter(parts.jongseong);
  return final ? { initial, medial, final } : null;
}

/**
 * Builds a syllable from letter ids. Returns null when the combination is not a
 * real Korean syllable — a tense consonant that cannot close one, for instance.
 */
export function compose(
  initialId: string,
  medialId: string,
  finalId?: string | null,
): string | null {
  const initial = CHARACTERS_BY_ID[initialId];
  const medial = CHARACTERS_BY_ID[medialId];
  if (!initial || !medial) return null;

  const final = finalId ? CHARACTERS_BY_ID[finalId] : null;
  if (finalId && !final) return null;
  // ㄸ ㅃ ㅉ can start a syllable but never close one.
  if (final && final.finalRomaja === null) return null;

  try {
    const syllable = combineCharacter(
      initial.character,
      // es-hangul wants a compound vowel spelled as its two parts on the way in
      // as well as on the way out. Handing it ㅝ directly returns a *different*
      // valid syllable rather than failing, so this translation is load-bearing.
      EXPANDED_VOWELS[medial.character] ?? medial.character,
      final?.character,
    );

    // Confirm what came back is the syllable that was asked for. A weaker check
    // — "is this a real syllable?" — passes on exactly the garbage above.
    const parts = decompose(syllable);
    if (!parts) return null;
    if (parts.initial.id !== initial.id || parts.medial.id !== medial.id) return null;
    if ((parts.final?.id ?? null) !== (final?.id ?? null)) return null;

    return syllable;
  } catch {
    return null;
  }
}

/**
 * Revised Romanization of a syllable or word, sound changes included.
 *
 * Always call es-hangul's `romanize` directly on the original text. Running
 * `standardizePronunciation` first and romanizing the result gives the wrong
 * answer — 한국 comes out as "hankkuk" instead of "hanguk" — because `romanize`
 * already standardizes internally, with tensification switched off.
 */
export function romanizeKorean(text: string): string {
  return romanize(text);
}

/** The seven sounds every Korean final consonant collapses onto. */
export const BATCHIM_SOUNDS = ['k', 'n', 't', 'l', 'm', 'p', 'ng'] as const;

/** Letters that can close a syllable, in chart order. */
export const POSSIBLE_FINALS: HangulCharacter[] = HANGUL_CHARACTERS.filter(
  (character) => typeof character.finalRomaja === 'string',
);

/** Letters that can open a syllable, in chart order. */
export const POSSIBLE_INITIALS: HangulCharacter[] = HANGUL_CHARACTERS.filter(
  (character) => character.finalRomaja !== undefined,
);

/** Every vowel, which is exactly the set that can be a syllable's medial. */
export const POSSIBLE_MEDIALS: HangulCharacter[] = HANGUL_CHARACTERS.filter(
  (character) => character.category === 'basic-vowel' || character.category === 'compound-vowel',
);
