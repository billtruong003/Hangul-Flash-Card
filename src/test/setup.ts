import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetAnalyticsTransport } from '../lib/analytics';

/**
 * jsdom ships no PointerEvent. Testing Library then falls back to a plain
 * Event, which silently drops clientX/clientY — so a test that "draws" on the
 * stroke pad would feed it NaN coordinates and every stroke would be rejected,
 * including the correct ones. Worse, tests asserting a *rejection* would pass
 * for entirely the wrong reason.
 *
 * MouseEvent already carries the coordinate fields, so extending it is enough.
 */
// Typed loosely on purpose: the DOM lib insists PointerEvent always exists on
// Window, which is exactly the assumption jsdom breaks.
const runtime = globalThis as unknown as Record<string, unknown>;

if (typeof window !== 'undefined' && runtime.PointerEvent === undefined) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }

  runtime.PointerEvent = PointerEventPolyfill;
  // Capture is a no-op here; the pad only calls it to keep a stroke alive when
  // a finger slides outside the element.
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
  }
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  // Back to the silent default, so a recording transport cannot leak between files.
  resetAnalyticsTransport();
});
