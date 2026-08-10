import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetAnalyticsTransport } from '../lib/analytics';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  // Back to the silent default, so a recording transport cannot leak between files.
  resetAnalyticsTransport();
});
