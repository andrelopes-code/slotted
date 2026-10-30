import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

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
 * The heading level every item's header renders as. `3` is the default, which
 * is the level the APG's own example uses for a set inside a section.
 */
export type AccordionHeadingLevel = 'none' | '1' | '2' | '3' | '4' | '5' | '6';

/** When each panel exists. Handed to every item. */
export type AccordionMount = 'active' | 'lazy' | 'eager' | 'until-found';

/** Why the set of open panels moved. */
export type AccordionSelectionReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'pointer' | 'keyboard' | 'select' | 'programmatic'
>;

/** The request the family emits before the value moves. */
export type AccordionChangeRequest = ChangeRequest<readonly string[]>;

/** What an application sets once for every accordion under it. */
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

export interface AccordionDefaultsProviderProps extends Partial<AccordionDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What the set hands every disclosure inside it.
 *
 * The appearance is handed over as a value rather than reached for with a
 * descendant rule: a stylesheet selecting `[data-ui='collapsible']` from the
 * group would make one family's DOM part of another's contract.
 */
export interface AccordionContextValue {
  disabled: boolean;
  indicator: AccordionIndicator;
  /** The heading level, under the name the item reads it by. */
  level: AccordionHeadingLevel;
  mount: AccordionMount;
  size: AccordionSize;
  togglePlacement: AccordionTogglePlacement;
  truncate: boolean;
  /** The item's own variant, which is not always the set's. */
  variant: 'plain' | 'ruled' | 'framed';
  /** Whether this value is one of the open ones. */
  isOpen: (value: string) => boolean;
  /** Whether this value is open and the set refuses to let it close. */
  isHeld: (value: string) => boolean;
  /** Asks the set to open or close one value. */
  toggle: (value: string, reason: AccordionSelectionReason, source: unknown) => void;
}

/** What `render` receives for the set's root. */
export interface AccordionRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-part': string;
  'data-size': AccordionSize;
  'data-ui': string;
  'data-variant': AccordionVariant;
}

/** The two moves an array cannot express while the family owns the array. */
export interface AccordionHandle {
  /** Opens every item that is not disabled, with the reason `programmatic`. */
  openAll: () => void;
  /** Closes every item, unless `requireOpen` holds the last one. */
  closeAll: () => void;
}

export interface AccordionProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /** The set an uncontrolled accordion starts from, read once. */
  defaultValue?: readonly string[] | undefined;
  /** Reaches every item, and every trigger as the native attribute. */
  disabled?: boolean | undefined;
  /**
   * The two moves an array cannot express while the family owns the array.
   * They are on a handle of their own so `ref` keeps reaching the element,
   * which is the library's rule for every other family.
   */
  handle?: Ref<AccordionHandle> | undefined;
  /** Defaults to the provider, then to `3`. */
  headingLevel?: AccordionHeadingLevel | undefined;
  /** Defaults to the provider, then to `chevron`. */
  indicator?: AccordionIndicator | undefined;
  /** Whether the arrow keys wrap past the ends of the set. */
  loop?: boolean | undefined;
  /** Defaults to the provider, then to `eager`. */
  mount?: AccordionMount | undefined;
  /** Whether more than one panel may be open at once. */
  multiple?: boolean | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: readonly string[], request: AccordionChangeRequest) => void) | undefined;
  /**
   * Whether the set refuses to empty. The one open header then carries
   * `aria-disabled="true"`, which is what the pattern asks of an accordion that
   * does not permit its panel to be collapsed.
   */
  requireOpen?: boolean | undefined;
  /** Renders the set's root into another element. */
  render?: ((props: AccordionRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: AccordionSize | undefined;
  /** Defaults to the provider, then to `end`. */
  togglePlacement?: AccordionTogglePlacement | undefined;
  /** Clips every title to one line instead of letting the row grow. */
  truncate?: boolean | undefined;
  /** Present means controlled, for the life of the component. */
  value?: readonly string[] | undefined;
  /** Defaults to the provider, then to `ruled`. */
  variant?: AccordionVariant | undefined;
}
