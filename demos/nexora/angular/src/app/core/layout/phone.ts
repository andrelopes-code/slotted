import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import { COMPACT_BELOW } from '@slotted/core/measure';

/** The compact size class the page families share: below it a grid keeps two columns (LP-01). */
export const PHONE_QUERY = `(width < ${COMPACT_BELOW}px)`;

/**
 * Whether the screen is in the compact size class, as a signal that follows
 * the window. Called from an injection context: it registers its listener
 * against the caller's `DestroyRef`.
 */
export function phoneSignal(query = PHONE_QUERY): Signal<boolean> {
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);
  const phone = signal(false);
  const media = document.defaultView?.matchMedia?.(query);
  if (media) {
    phone.set(media.matches);
    const listen = (event: MediaQueryListEvent) => phone.set(event.matches);
    media.addEventListener('change', listen);
    destroyRef.onDestroy(() => media.removeEventListener('change', listen));
  }
  return phone.asReadonly();
}
