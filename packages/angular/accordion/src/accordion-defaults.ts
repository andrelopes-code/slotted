import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the set and its items sit at. */
export type AccordionSize = 'sm' | 'md' | 'lg';

/**
 * How the set is drawn. `plain` paints nothing, `ruled` puts one hairline per
 * seam, `framed` wraps the ruled set in one frame, and `separated` gives every
 * item a card of its own.
 */
export type AccordionVariant = 'plain' | 'ruled' | 'framed' | 'separated';

/** The mark each header carries. Handed to every item. */
export type AccordionIndicator = 'chevron' | 'plus-minus' | 'none';

/** Which side of the words that mark stands on. Handed to every item. */
export type AccordionTogglePlacement = 'end' | 'start';

/**
 * The heading level every item's header answers to. `3` is the default, which
 * is the level the APG's own example uses for a set inside a section.
 */
export type AccordionHeadingLevel = 'none' | '1' | '2' | '3' | '4' | '5' | '6';

/** When each panel's content exists. Handed to every item. */
export type AccordionMount = 'active' | 'lazy' | 'eager' | 'until-found';

/** Why the set of open panels moved. */
export type AccordionSelectionReason = 'pointer' | 'keyboard' | 'select' | 'programmatic';

export interface AccordionDefaults {
  headingLevel: AccordionHeadingLevel;
  indicator: AccordionIndicator;
  loop: boolean;
  mount: AccordionMount;
  multiple: boolean;
  requireOpen: boolean;
  size: AccordionSize;
  togglePlacement: AccordionTogglePlacement;
  truncate: boolean;
  variant: AccordionVariant;
}

const FALLBACK: AccordionDefaults = {
  headingLevel: '3',
  indicator: 'chevron',
  loop: true,
  mount: 'eager',
  multiple: false,
  requireOpen: false,
  size: 'md',
  togglePlacement: 'end',
  truncate: false,
  variant: 'ruled',
};

export const ACCORDION_DEFAULTS = new InjectionToken<AccordionDefaults>(
  'slotted accordion defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its accordions look and behave, rather than
 * repeating the same ten inputs on every set in a product. A set that states
 * any of them itself still wins.
 */
export function provideAccordionDefaults(defaults: Partial<AccordionDefaults>) {
  return {
    provide: ACCORDION_DEFAULTS,
    useFactory: (): AccordionDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What an accordion renders as here, before it states anything of its own. */
export function injectAccordionDefaults(): AccordionDefaults {
  return inject(ACCORDION_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlAccordionIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-collapsible-${this.count}`;
  }
}
