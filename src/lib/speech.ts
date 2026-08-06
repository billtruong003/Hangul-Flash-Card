export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === 'ko-KR') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ko')) ??
    null
  );
}

/** Speaks a Hangul glyph. Silently does nothing when the browser has no support. */
export function speakHangul(text: string): void {
  if (!isSpeechSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85;
    const voice = pickKoreanVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Some browsers throw when synthesis is blocked; audio is optional here.
  }
}
