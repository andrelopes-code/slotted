import { sizeClassOf } from '@slotted/core/measure';
import type { SizeClass } from '@slotted/core/measure';
import { useSyncExternalStore } from 'react';

import { usePage } from './page';

/**
 * The size class to compose by, from the page's own width: `compact` under 600
 * pixels, `medium` under 1024, `expanded` from there, the thresholds of the
 * page's container queries. A split view narrows the page while the viewport
 * stays, and code that chose by `matchMedia` disagreed with the stylesheet;
 * this follows the page. Outside a `Page`, or before it is measured, it reads
 * the viewport. It changes only when a width crosses a threshold.
 */
export function usePageSizeClass(): SizeClass {
  const page = usePage();
  const viewport = useSyncExternalStore(subscribe, viewportClass, serverClass);

  return page?.sizeClass ?? viewport;
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);

  return () => window.removeEventListener('resize', onChange);
}

function viewportClass(): SizeClass {
  return sizeClassOf(window.innerWidth);
}

/* A server has no width: the class a desktop renders first. */
function serverClass(): SizeClass {
  return 'expanded';
}
