/**
 * Web Speech API wrapper, narrowed to what this app needs: reading Korean out
 * loud, reliably, across browsers that each break it in a different way.
 *
 * Everything passed to `speak` must be real Hangul. A bare jamo such as ㄱ
 * (U+3131) is read as the letter's *name* — "기역" — or skipped entirely, which
 * is why `HangulCharacter` carries a `demoSyllable` for every letter.
 */

export type SpeechCapability = {
  supported: boolean;
  /** False when synthesis exists but the device ships no Korean voice at all. */
  hasKoreanVoice: boolean;
};

export type SpeakOptions = {
  /** 1 is the engine default; the app slows things down so learners can follow. */
  rate?: number;
};

export const NORMAL_RATE = 0.85;
export const SLOW_RATE = 0.55;

const VOICE_POLL_INTERVAL_MS = 250;
const VOICE_LOAD_TIMEOUT_MS = 5000;
/** Chrome and Firefox both drop a speak() issued in the same tick as a cancel(). */
const CANCEL_SETTLE_MS = 120;

const UNSUPPORTED: SpeechCapability = { supported: false, hasKoreanVoice: false };

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Android reports `ko_KR` with an underscore; the spec says `ko-KR`. */
function normalizeLang(lang: string): string {
  return lang.replace('_', '-').toLowerCase();
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Chrome, Edge and Android populate the voice list asynchronously and return an
 * empty array on the first call. `voiceschanged` is the documented signal, but
 * it can fire with an empty list, fire before a listener is attached, or never
 * fire at all — so the poll and the timeout are load-bearing, not belt-and-braces.
 * An empty list is a legitimate final answer: Chrome on Linux ships no voices.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const immediate = synth.getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }

    let pollId = 0;
    let timeoutId = 0;
    let settled = false;

    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      synth.removeEventListener('voiceschanged', check);
      resolve(voices);
    };

    function check() {
      const voices = synth.getVoices();
      if (voices.length > 0) finish(voices);
    }

    synth.addEventListener('voiceschanged', check);
    pollId = window.setInterval(check, VOICE_POLL_INTERVAL_MS);
    timeoutId = window.setTimeout(() => finish(synth.getVoices()), VOICE_LOAD_TIMEOUT_MS);
  });

  return voicesPromise;
}

let koreanVoice: SpeechSynthesisVoice | null = null;
let capability: SpeechCapability = UNSUPPORTED;

/** Resolves once the voice list has settled. Safe to call more than once. */
export async function initSpeech(): Promise<SpeechCapability> {
  if (!isSpeechSupported()) return UNSUPPORTED;

  try {
    const korean = (await loadVoices()).filter((voice) =>
      normalizeLang(voice.lang).startsWith('ko'),
    );
    koreanVoice =
      korean.find((voice) => normalizeLang(voice.lang) === 'ko-kr') ?? korean[0] ?? null;
    capability = { supported: true, hasKoreanVoice: koreanVoice !== null };
  } catch {
    capability = UNSUPPORTED;
  }

  return capability;
}

// Chrome garbage-collects an utterance held only by a local variable, cutting
// playback short mid-word. Keeping the live one referenced here prevents that.
let activeUtterance: SpeechSynthesisUtterance | null = null;
let pendingSpeakId: number | null = null;

/**
 * Speaks Hangul. Does nothing when the device has no Korean voice — an English
 * voice reading Hangul produces noise, which is worse for a learner than silence.
 */
export function speak(text: string, { rate = NORMAL_RATE }: SpeakOptions = {}): void {
  if (!text || !capability.hasKoreanVoice) return;

  try {
    const synth = window.speechSynthesis;

    if (pendingSpeakId !== null) {
      window.clearTimeout(pendingSpeakId);
      pendingSpeakId = null;
    }

    const start = () => {
      pendingSpeakId = null;
      const utterance = new SpeechSynthesisUtterance(text);
      // Chrome on Android needs an explicit lang even when a voice is assigned.
      utterance.lang = 'ko-KR';
      utterance.voice = koreanVoice;
      utterance.rate = rate;
      // Released once playback ends, so a finished utterance is not pinned here
      // forever — the reference exists only to outlive the garbage collector.
      utterance.onend = () => {
        if (activeUtterance === utterance) activeUtterance = null;
      };
      activeUtterance = utterance;
      synth.speak(utterance);
    };

    if (synth.speaking || synth.pending) {
      // Interrupting takes a moment to settle; speaking immediately after
      // cancel() gets the new utterance silently dropped.
      synth.cancel();
      pendingSpeakId = window.setTimeout(start, CANCEL_SETTLE_MS);
      return;
    }

    start();
  } catch {
    // Some browsers throw when synthesis is blocked; audio is optional here.
  }
}

let primed = false;

/**
 * iOS Safari and Chrome 71+ refuse speech that does not originate in a user
 * gesture. Speaking a silent utterance during the first tap unlocks the queue,
 * so later calls — including ones a timer fires — are allowed through.
 * Call this from a real event handler, not an effect.
 */
export function primeSpeechOnGesture(): void {
  if (primed || !isSpeechSupported()) return;
  primed = true;

  try {
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Priming is opportunistic; a failure just means the first tap is silent.
  }
}

/** Test seam — drops every cached decision so a suite can start from scratch. */
export function resetSpeechForTests(): void {
  voicesPromise = null;
  koreanVoice = null;
  capability = UNSUPPORTED;
  activeUtterance = null;
  pendingSpeakId = null;
  primed = false;
}
