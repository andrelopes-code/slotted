import { selectorKeyMismatches } from '@slotted/core/selector-key';
import { afterAll, afterEach, beforeEach } from 'vitest';

/**
 * A layer that closes takes its history entry back with `history.back()`, and
 * `@slotted/core/dismissable-layer` waits up to 500ms for that traversal. A
 * file whose last test closed a layer was torn down before the traversal
 * landed, and the wait's timer then fired on a window with no listener API:
 * an unhandled error that failed the whole run. While the current entry still
 * carries a layer's token, the file waits for the traversal, bounded past the
 * library's own wait.
 */
afterAll(async () => {
  const state: unknown = window.history.state;
  if (typeof state !== 'object' || state === null || !('__slottedLayer' in state)) return;

  await new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener('popstate', done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 600);
    window.addEventListener('popstate', done);
  });
});

/**
 * The stylesheet matches the selector key (`data-part-cell`), not the public
 * `data-part="cell"`: an element that carries one without the other is drawn
 * unstyled, or with the rules of a part it no longer is.
 *
 * TestBed may tear a fixture down before this file's `afterEach` runs, so the
 * elements are checked as they are written: every element a mutation touched
 * is checked once the task that wrote it has finished.
 */
let observer: MutationObserver | null = null;
let found: string[] = [];

function check(records: readonly MutationRecord[]) {
  for (const record of records) {
    if (record.type === 'attributes') {
      const node = record.target;
      if (!(node instanceof Element) || !node.isConnected) continue;
      const host = document.createElement('div');
      host.append(node.cloneNode(false));
      found.push(...selectorKeyMismatches(host));
      continue;
    }
    for (const added of record.addedNodes) {
      if (!(added instanceof Element) || !added.isConnected) continue;
      const host = document.createElement('div');
      host.append(added.cloneNode(true));
      found.push(...selectorKeyMismatches(host));
    }
  }
}

beforeEach(() => {
  found = [];
  observer = new MutationObserver(check);
  observer.observe(document, { attributes: true, childList: true, subtree: true });
});

afterEach(() => {
  if (observer !== null) {
    check(observer.takeRecords());
    observer.disconnect();
  }
  found.push(...selectorKeyMismatches(document));
  if (found.length > 0) {
    throw new Error(`Selector keys out of line:\n${[...new Set(found)].join('\n')}`);
  }
});
