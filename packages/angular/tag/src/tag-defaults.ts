import { inject, Injectable, InjectionToken } from '@angular/core';

/** Which of the five semantic colours the tag speaks in. */
export type TagTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted chip a tag usually is. */
export type TagVariant = 'solid' | 'soft' | 'outline' | 'dashed';

export type TagSize = 'sm' | 'md' | 'lg';

export type TagShape = 'pill' | 'square';

export type TagOrientation = 'horizontal' | 'vertical';

export interface TagDefaults {
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

const FALLBACK: TagDefaults = {
  shape: 'pill',
  size: 'md',
  tone: 'secondary',
  variant: 'soft',
};

export const TAG_DEFAULTS = new InjectionToken<TagDefaults>('slotted tag defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its tags are painted and how large they are,
 * rather than repeating four inputs on every chip in a filter bar. A tag that
 * states any of them itself still wins: an explicit input is never overridden
 * by the token. The remove control's word comes from the language in force
 * (`provideSlotted`).
 */
export function provideTagDefaults(defaults: Partial<TagDefaults>) {
  return {
    provide: TAG_DEFAULTS,
    useFactory: (): TagDefaults => ({
      shape: defaults.shape ?? FALLBACK.shape,
      size: defaults.size ?? FALLBACK.size,
      tone: defaults.tone ?? FALLBACK.tone,
      variant: defaults.variant ?? FALLBACK.variant,
    }),
  };
}

/** What a tag renders as here, before it states anything of its own. */
export function injectTagDefaults(): TagDefaults {
  return inject(TAG_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason the field
 * primitive records: a module-level counter produces colliding sequences when
 * two applications render in one server process, and the server and the client
 * sequences must match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTagIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tag-${this.count}`;
  }
}
