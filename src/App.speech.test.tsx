import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { resetSpeechForTests } from './lib/speech';
import { readStoredState } from './test/appHarness';

/**
 * jsdom has no speechSynthesis at all, so these tests install a fake one. The
 * point is the *timing*: a phone routinely reports an empty voice list until
 * speech has been triggered from a real tap.
 */
type FakeVoice = { lang: string; name: string };

function installSynth(initialVoices: FakeVoice[]) {
  const listeners = new Set<() => void>();
  let voices = initialVoices;

  const synth = {
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
    speaking: false,
    pending: false,
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'voiceschanged') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'voiceschanged') listeners.delete(listener);
    },
  };

  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      lang = '';
      rate = 1;
      volume = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );

  return {
    synth,
    /** Mimics the voice list arriving late, as it does on a phone. */
    arrive(next: FakeVoice[]) {
      voices = next;
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

const KOREAN: FakeVoice[] = [{ lang: 'ko-KR', name: 'Korean' }];

function soundToggle(): HTMLElement {
  return screen.getByRole('button', { name: /âm thanh phát âm/i });
}

beforeEach(() => {
  resetSpeechForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSpeechForTests();
});

describe('the sound control on a device with no voices yet', () => {
  it('stays usable even when no Korean voice has been found', () => {
    // The regression this pins: gating the control on "a Korean voice exists"
    // deadlocks a phone, because tapping it is what reveals the voices.
    installSynth([]);
    render(<App />);

    expect(soundToggle()).toBeEnabled();
    expect(soundToggle()).toHaveAttribute('title', expect.stringMatching(/giọng tiếng Hàn/));
  });

  it('lets sound be switched on, and says why nothing is being read', () => {
    installSynth([]);
    render(<App />);

    fireEvent.click(soundToggle());

    expect(readStoredState().settings.soundEnabled).toBe(true);
    expect(screen.getByRole('region', { name: 'Vì sao chưa nghe được' })).toBeInTheDocument();
    expect(screen.getByText(/Máy chưa có giọng đọc tiếng Hàn/)).toBeInTheDocument();
  });

  it('picks the voices up when they arrive late and drops the warning', () => {
    const fake = installSynth([]);
    render(<App />);
    fireEvent.click(soundToggle());
    expect(screen.getByRole('region', { name: 'Vì sao chưa nghe được' })).toBeInTheDocument();

    fake.arrive(KOREAN);

    expect(screen.queryByRole('region', { name: 'Vì sao chưa nghe được' })).not.toBeInTheDocument();
  });

  it('says nothing at all while sound is off', () => {
    installSynth([]);
    render(<App />);

    expect(screen.queryByRole('region', { name: 'Vì sao chưa nghe được' })).not.toBeInTheDocument();
  });
});

describe('the sound control on a device that already has Korean', () => {
  it('offers no warning and speaks a real syllable', () => {
    const fake = installSynth(KOREAN);
    render(<App />);

    fireEvent.click(soundToggle());

    expect(screen.queryByRole('region', { name: 'Vì sao chưa nghe được' })).not.toBeInTheDocument();

    // Priming aside, whatever reaches synthesis must be Hangul, never romaja.
    const spoken = fake.synth.speak.mock.calls.map((call) => (call[0] as { text: string }).text);
    for (const text of spoken) {
      expect(text).toMatch(/^[\s가-힣]*$/);
    }
  });

  it('recognises the underscored locale Android reports', () => {
    installSynth([{ lang: 'ko_KR', name: 'Android Korean' }]);
    render(<App />);

    fireEvent.click(soundToggle());

    expect(screen.queryByRole('region', { name: 'Vì sao chưa nghe được' })).not.toBeInTheDocument();
  });

  it('treats a browser with no speech synthesis as unsupported', () => {
    // No stubGlobal here: jsdom genuinely has none.
    render(<App />);

    expect(soundToggle()).toBeDisabled();
  });
});
