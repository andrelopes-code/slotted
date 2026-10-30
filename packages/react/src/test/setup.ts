import '@testing-library/jest-dom/vitest';

import { selectorKeyMismatches } from '@slotted/core/selector-key';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

/**
 * The stylesheet matches the selector key (`data-part-cell`), not the public
 * `data-part="cell"`: an element that carries one without the other is drawn
 * unstyled, or with the rules of a part it no longer is. Every test's final
 * document is checked before it is cleaned up.
 */
afterEach(() => {
  const mismatches = selectorKeyMismatches(document);
  cleanup();
  if (mismatches.length > 0) {
    throw new Error(`Selector keys out of line:\n${[...new Set(mismatches)].join('\n')}`);
  }
});

/**
 * Each test starts at the end of the session history, as a page just loaded
 * does. A modal layer that closes takes its entry back with `history.back()`
 * (`@slotted/core/dismissable-layer`), which leaves that entry ahead of the
 * current one: the next layer's `pushState` replaces it rather than adding
 * one, and the next test reads a history one entry short. jsdom lands the
 * traversal two tasks after the call, so a test that ends while it is on its
 * way — the current entry still carries a layer's token, and no layer is open
 * — first waits for it, and then a fresh entry drops whatever stands ahead.
 */
beforeEach(async () => {
  const state: unknown = window.history.state;
  if (typeof state === 'object' && state !== null && '__slottedLayer' in state) {
    await new Promise<void>((resolve) => {
      const done = () => {
        window.removeEventListener('popstate', done);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, 100);
      window.addEventListener('popstate', done);
    });
  }
  window.history.pushState(null, '');
});
