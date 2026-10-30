import type { ChangeRequest } from '@slotted/core/state';
import type { ButtonHTMLAttributes, ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

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
 * The heading the trigger is wrapped in. `none` renders a `div` and writes no
 * heading semantics, which is the standalone disclosure that is not part of an
 * outline; everything else renders that heading element.
 */
export type CollapsibleLevel = 'none' | '1' | '2' | '3' | '4' | '5' | '6';

/**
 * When the panel exists. `active` builds it on opening and drops it after,
 * `lazy` builds it on the first open and keeps it, `eager` builds it up front,
 * and `until-found` builds it up front and hides it with `hidden="until-found"`
 * so the browser's own page search opens it.
 *
 * The default is `eager`, because a panel that is not in the DOM has nothing to
 * transition closed.
 */
export type CollapsibleMount = 'active' | 'lazy' | 'eager' | 'until-found';

/** Why the panel opened or closed. */
export type CollapsibleOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'select' | 'programmatic'
>;

/** The request the family emits before the panel moves. */
export type CollapsibleChangeRequest = ChangeRequest<boolean>;

/** What an application sets once for every disclosure under it. */
export interface CollapsibleDefaults {
  indicator: CollapsibleIndicator;
  level: CollapsibleLevel;
  mount: CollapsibleMount;
  size: CollapsibleSize;
  togglePlacement: CollapsibleTogglePlacement;
  truncate: boolean;
  variant: CollapsibleVariant;
}

export interface CollapsibleDefaultsProviderProps extends Partial<CollapsibleDefaults> {
  children?: ReactNode | undefined;
}

/** What the family hands its own header, trigger and panel. */
export interface CollapsibleContextValue {
  /** Whether the family as a whole is out of action. */
  disabled: boolean;
  /** The identifiers that wire the trigger to its panel. */
  ids: { panelId: string; triggerId: string };
  indicator: CollapsibleIndicator;
  level: CollapsibleLevel;
  /** Whether the panel's content has not arrived yet. */
  loading: boolean;
  mount: CollapsibleMount;
  open: boolean;
  /** Whether the group refuses to let this one close, which the APG marks. */
  held: boolean;
  /** Whether the panel is a landmark. Off unless the consumer asks. */
  region: boolean;
  /** Asks to open or close, carrying the reason and the originating event. */
  toggle: (next: boolean, reason: CollapsibleOpenReason, source: unknown) => void;
  /** Whether this panel has ever been open, which is what `lazy` reads. */
  seen: boolean;
}

/** What `render` receives for the family's root. */
export interface CollapsibleRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-indicator': CollapsibleIndicator;
  'data-loading'?: '' | undefined;
  'data-mount': CollapsibleMount;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': CollapsibleSize;
  'data-toggle-placement': CollapsibleTogglePlacement;
  'data-truncate'?: '' | undefined;
  'data-ui': string;
  'data-value': string;
  'data-variant': CollapsibleVariant;
}

/** What `render` receives for the heading. */
export interface CollapsibleHeaderRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

/**
 * What `render` receives for the trigger. It is the `button` element's own
 * attribute set, extended — `aria-disabled` and `disabled` are the platform's
 * and are not restated here.
 */
export interface CollapsibleTriggerRootProps extends ButtonHTMLAttributes<HTMLElement> {
  'aria-controls': string;
  'aria-expanded': boolean;
  'data-part': string;
  id: string;
  type: 'button';
}

/**
 * What `render` receives for the panel. `role` and `aria-busy` are the
 * platform's own, written only when the family has something to say with them.
 */
export interface CollapsiblePanelRootProps extends HTMLAttributes<HTMLElement> {
  'aria-labelledby': string;
  'data-part': string;
  id: string;
}

export interface CollapsibleProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  /** The value an uncontrolled disclosure starts from, read once. */
  defaultOpen?: boolean | undefined;
  /**
   * Unstated rather than `false`, so the disclosure defers to the accordion
   * around it. It reaches the trigger as the native attribute.
   */
  disabled?: boolean | undefined;
  /** Defaults to the accordion, then the provider, then `chevron`. */
  indicator?: CollapsibleIndicator | undefined;
  /** Defaults to the accordion, then the provider, then `none`. */
  level?: CollapsibleLevel | undefined;
  /**
   * Whether the panel's content is still on its way. The panel keeps a line's
   * height and carries `aria-busy`; what stands in for the content is
   * `Skeleton`, composed by the consumer.
   */
  loading?: boolean | undefined;
  /** Defaults to the accordion, then the provider, then `eager`. */
  mount?: CollapsibleMount | undefined;
  /** Called before the panel moves, with the request that carries the reason. */
  onOpenChange?: ((open: boolean, request: CollapsibleChangeRequest) => void) | undefined;
  /** Present means controlled, for the life of the component. */
  open?: boolean | undefined;
  /**
   * Whether the panel is a `region` landmark. Off by default: the APG's own
   * example warns that a landmark per panel fills the landmark list, so it is
   * for the two or three disclosures on a page a reader navigates to directly.
   */
  region?: boolean | undefined;
  /** Renders the family's root into another element. */
  render?: ((props: CollapsibleRootProps) => ReactNode) | undefined;
  /** Defaults to the accordion, then the provider, then `md`. */
  size?: CollapsibleSize | undefined;
  /** Defaults to the accordion, then the provider, then `end`. */
  togglePlacement?: CollapsibleTogglePlacement | undefined;
  /**
   * Clips the title to one line instead of letting the row grow. The whole
   * string stays in the DOM, which the library decided once for every family.
   */
  truncate?: boolean | undefined;
  /**
   * What this disclosure is called inside an accordion. It is identity rather
   * than state — the state model is `open` — and the group's array holds it.
   * A disclosure that states none is given one from `useId`, which is Base UI's
   * answer and saves a consumer naming panels a page never addresses.
   */
  value?: string | undefined;
  /** Defaults to the accordion, then the provider, then `plain`. */
  variant?: CollapsibleVariant | undefined;
}

export interface CollapsibleHeaderProps extends ComponentPropsWithRef<'div'> {
  /**
   * Renders the heading into another element. The trigger has to stay its only
   * child: the pattern requires the button to be the only element inside the
   * heading.
   */
  render?: ((props: CollapsibleHeaderRootProps) => ReactNode) | undefined;
}

export interface CollapsibleTriggerProps extends ComponentPropsWithRef<'button'> {
  /** The title. Wrapped in the `label` part, which is what clips and isolates it. */
  children?: ReactNode | undefined;
  /**
   * A second line under the title. It is inside the trigger, so it is part of
   * the accessible name — "Delivery, 3 of 12 items" is what a reader hears.
   */
  description?: ReactNode | undefined;
  /** Renders the control into another element. */
  render?: ((props: CollapsibleTriggerRootProps) => ReactNode) | undefined;
}

export interface CollapsibleActionsProps extends ComponentPropsWithRef<'div'> {
  /** Renders the slot into another element — a `Toolbar`, usually. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface CollapsiblePanelProps extends ComponentPropsWithRef<'div'> {
  /** Renders the panel into another element. */
  render?: ((props: CollapsiblePanelRootProps) => ReactNode) | undefined;
}
