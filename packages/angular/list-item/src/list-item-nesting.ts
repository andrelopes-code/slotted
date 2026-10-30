import { isDevMode } from '@angular/core';

/** Provided by `slListItemContent` for the text parts inside it. */
export abstract class SlListItemBox {}
/** Provided by `slListItemBody`, so a box written inside it can say so. */
export abstract class SlListItemBodyScope {}

const warned = new Set<string>();

/**
 * In development, one `console.error` per part the first time it is written
 * where the stylesheet cannot lay it out. The check reads the injector, not
 * the DOM; a production build drops it.
 */
export function warnNesting(part: string, misplaced: boolean, message: string): void {
  if (!isDevMode() || !misplaced || warned.has(part)) return;
  warned.add(part);
  console.error(message);
}
