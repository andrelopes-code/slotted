import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the header and its panel sit at. */
export type CollapsibleSize = 'sm' | 'md' | 'lg';

/**
 * How the disclosure is drawn. `plain` paints no chrome at all, `ruled` draws a
 * hairline above the header so a stack of them reads as one list, and `framed`
 * is its own card.
 */
export type CollapsibleVariant = 'plain' | 'ruled' | 'framed';

/**
 * The mark that says whether the panel is open. `chevron` turns between down
 * and up, `plus-minus` swaps the one bar for the pair, and `none` draws nothing
 * — which is Angular Material's `hideToggle` and Carbon's chevron-less header.
 */
export type CollapsibleIndicator = 'chevron' | 'plus-minus' | 'none';

/** Which side of the words the mark stands on. */
export type CollapsibleTogglePlacement = 'end' | 'start';

/**
 * The heading level the header answers to. `none` writes no heading semantics
 * at all, which is the standalone disclosure that belongs to no outline.
 *
 * The element is the consumer's own: `<h3 slCollapsibleHeader>` is a native
 * heading and the directive adds nothing, while `<div slCollapsibleHeader>`
 * gets `role="heading"` and `aria-level` — the alternative the pattern itself
 * names. React reads the element off this value instead, and the two reach the
 * same accessibility tree.
 */
export type CollapsibleLevel = 'none' | '1' | '2' | '3' | '4' | '5' | '6';

/**
 * When the panel's content exists. The box always does, so the trigger's
 * `aria-controls` never names an element that is gone.
 */
export type CollapsibleMount = 'active' | 'lazy' | 'eager' | 'until-found';

/** Why the panel opened or closed. */
export type CollapsibleOpenReason = 'pointer' | 'keyboard' | 'select' | 'programmatic';

export interface CollapsibleDefaults {
  indicator: CollapsibleIndicator;
  level: CollapsibleLevel;
  mount: CollapsibleMount;
  size: CollapsibleSize;
  togglePlacement: CollapsibleTogglePlacement;
  truncate: boolean;
  variant: CollapsibleVariant;
}

const FALLBACK: CollapsibleDefaults = {
  indicator: 'chevron',
  level: 'none',
  mount: 'eager',
  size: 'md',
  togglePlacement: 'end',
  truncate: false,
  variant: 'plain',
};

export const COLLAPSIBLE_DEFAULTS = new InjectionToken<CollapsibleDefaults>(
  'slotted collapsible defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its disclosures look, rather than repeating
 * the same seven inputs on every one in a product. A disclosure that states any
 * of them itself still wins, and so does the accordion between the two.
 */
export function provideCollapsibleDefaults(defaults: Partial<CollapsibleDefaults>) {
  return {
    provide: COLLAPSIBLE_DEFAULTS,
    useFactory: (): CollapsibleDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a disclosure renders as here, before it states anything of its own. */
export function injectCollapsibleDefaults(): CollapsibleDefaults {
  return inject(COLLAPSIBLE_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlCollapsibleIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-collapsible-${this.count}`;
  }
}
