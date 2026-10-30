import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the heading sits at, independent of its rank. */
export type SectionSize = 'sm' | 'md' | 'lg';

/** The rank of the heading. `auto` takes the one the outline gives. */
export type SectionLevel = 'auto' | '1' | '2' | '3' | '4' | '5' | '6';

/** The ground: nothing, or a surface with an edge and a radius and no shadow. */
export type SectionGround = 'none' | 'surface';

export interface SectionDefaults {
  divider: boolean;
  ground: SectionGround;
  size: SectionSize;
  sticky: boolean;
}

const FALLBACK: SectionDefaults = {
  divider: false,
  ground: 'none',
  size: 'md',
  sticky: false,
};

export const SECTION_DEFAULTS = new InjectionToken<SectionDefaults>('slotted section defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its sections separate — a rule, a surface,
 * the step of their headings — rather than repeating the same inputs on every
 * one. A section that states any of them itself still wins.
 */
export function provideSectionDefaults(defaults: Partial<SectionDefaults>) {
  return {
    provide: SECTION_DEFAULTS,
    useFactory: (): SectionDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a section renders as here, before it states anything of its own. */
export function injectSectionDefaults(): SectionDefaults {
  return inject(SECTION_DEFAULTS);
}

/** Application-scoped, for the reason `field` records: the server and the client sequences must match. */
@Injectable({ providedIn: 'root' })
export class SlSectionIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-section-${this.count}`;
  }
}
