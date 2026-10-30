import '@slotted/theme/styles.css';

import { selectorKeyMismatches } from '@slotted/core/selector-key';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/* The selector-key invariant (`setup.ts`), checked in Chromium as well. */
afterEach(() => {
  const mismatches = selectorKeyMismatches(document);
  cleanup();
  if (mismatches.length > 0) {
    throw new Error(`Selector keys out of line:\n${[...new Set(mismatches)].join('\n')}`);
  }
});
