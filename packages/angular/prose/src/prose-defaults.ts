import { inject, InjectionToken } from '@angular/core';

/**
 * The type-scale step the body text takes. Named for the scale's own steps, as
 * `slText` names its own, so the offset from control type is visible rather
 * than hidden: `lg` is one rem, and `--slotted-font-size-md` is the size a
 * button label is set in.
 */
export type ProseSize = 'md' | 'lg' | 'xl';

/**
 * The space between blocks, from which every other distance in the region
 * derives. `tight` is a message in a thread, `normal` a documentation page,
 * `loose` an article.
 */
export type ProseFlow = 'tight' | 'normal' | 'loose';

export interface ProseDefaults {
  flow: ProseFlow;
  size: ProseSize;
}

/**
 * `lg` rather than the control step: the family exists for text a reader stays
 * with, and 0.875rem is the size a button label is set in. `normal` is the
 * documentation rhythm, which is what a region of rendered Markdown is in
 * unless the application says otherwise.
 *
 * The scrolling region's name comes from the catalog rather than a required
 * input because a Markdown renderer's component map cannot supply one per
 * table.
 */
const FALLBACK: ProseDefaults = {
  flow: 'normal',
  size: 'lg',
};

export const PROSE_DEFAULTS = new InjectionToken<ProseDefaults>('slotted prose defaults', {
  providedIn: 'root',
  factory: (): ProseDefaults => ({ ...FALLBACK }),
});

/**
 * An application decides once how its rendered content reads — Typeset's
 * presets, as a provider rather than as a class. A region that states any of
 * them itself still wins: an explicit input is never overridden by the token.
 */
export function provideProseDefaults(defaults: Partial<ProseDefaults>) {
  return {
    provide: PROSE_DEFAULTS,
    useFactory: (): ProseDefaults => ({
      flow: defaults.flow ?? FALLBACK.flow,
      size: defaults.size ?? FALLBACK.size,
    }),
  };
}

/** What a region is set in here, before it states anything of its own. */
export function injectProseDefaults(): ProseDefaults {
  return inject(PROSE_DEFAULTS);
}
