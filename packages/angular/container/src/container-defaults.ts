import { inject, InjectionToken } from '@angular/core';

/**
 * What the column bounds, rather than how big it is. `sm`/`md`/`lg` is this
 * library's word for control geometry; a container's maximum is chosen by what
 * is inside it, and a letter hides the choice.
 *
 * `measure` is the comfortable reading line, counted in characters so it
 * follows the inherited type and the reader's zoom. `full` removes the
 * maximum and keeps the inset.
 */
export type ContainerSize = 'measure' | 'content' | 'wide' | 'full' | 'bleed';

/**
 * The gap between the column and the edge of the space the container was
 * given, as a step on the space scale — the same scale Stack, Inline and Grid
 * take their `gap` from. `0` is the absence of an inset.
 */
export type ContainerInset = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Where the column sits when there is space left over. */
export type ContainerAlign = 'center' | 'start' | 'end';

export interface ContainerDefaults {
  align: ContainerAlign;
  inset: ContainerInset;
  size: ContainerSize;
}

/**
 * `content` rather than the widest bounded step, which is what the four
 * surveyed libraries that state a default all choose. A dashboard that
 * inherits `content` looks too narrow the first time it is opened and is
 * corrected; a settings page that inherits `wide` merely has lines that are
 * somewhat too long, which nobody reports.
 */
const FALLBACK: ContainerDefaults = { align: 'center', inset: 6, size: 'content' };

export const CONTAINER_DEFAULTS = new InjectionToken<ContainerDefaults>(
  'slotted container defaults',
  { providedIn: 'root', factory: (): ContainerDefaults => ({ ...FALLBACK }) },
);

/**
 * An application decides once what its pages are bounded to and how far they
 * are inset, rather than repeating three inputs on every container. A
 * container that states any of them itself still wins: an explicit input is
 * never overridden by the token.
 */
export function provideContainerDefaults(defaults: Partial<ContainerDefaults>) {
  return {
    provide: CONTAINER_DEFAULTS,
    useFactory: (): ContainerDefaults => ({
      align: defaults.align ?? FALLBACK.align,
      inset: defaults.inset ?? FALLBACK.inset,
      size: defaults.size ?? FALLBACK.size,
    }),
  };
}

/** What a container bounds here, before it states anything of its own. */
export function injectContainerDefaults(): ContainerDefaults {
  return inject(CONTAINER_DEFAULTS);
}
