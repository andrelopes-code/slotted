import type { DefinedProps } from '@slotted/core/selector-key';
import type { FamilyTranslator, PageHeaderMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';

import type { ProgressBarProps } from '../progress-indicator';
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react';

/** The type step the title sits at. The snapped title takes the step below it. */
export type PageHeaderSize = 'sm' | 'md' | 'lg';

/** The rank of the heading. A page's own header is `1`. */
export type PageHeaderLevel = '1' | '2' | '3';

/**
 * What collapses the header area. `scroll` collapses it when it leaves the
 * scrollport and re-opens it when it returns; `manual` leaves it to the toggle,
 * the pin and the application, and the whole header stays while the page
 * scrolls — sap.f's `preserveHeaderStateOnScroll`.
 */
export type PageHeaderCollapse = 'scroll' | 'manual';

/**
 * The ground and the frame. `band` is a strip of the surface with a hairline
 * under it; `plain` paints no ground at rest and takes the surface back once
 * content passes under it; `floating` is a box of its own, rounded, that
 * slides to an inset below the scroller's edge once stuck.
 */
export type PageHeaderVariant = 'band' | 'plain' | 'floating';

/** Why the header area opened or closed. */
export type PageHeaderExpandedReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'scroll' | 'programmatic'
>;

/** Why the pin took hold or let go. */
export type PageHeaderPinnedReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** The request the family emits before either value moves. */
export type PageHeaderChangeRequest = ChangeRequest<boolean>;

/** What an application sets once for every page header under it. */
export interface PageHeaderDefaults {
  collapse: PageHeaderCollapse;
  level: PageHeaderLevel;
  /** Stuck, the chrome is the theme's material: a translucent ground over a blurred backdrop. */
  material: boolean;
  size: PageHeaderSize;
  variant: PageHeaderVariant;
}

export interface PageHeaderDefaultsProviderProps extends Partial<PageHeaderDefaults> {
  children?: ReactNode | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface PageHeaderHandle {
  /** The `header` element. */
  element: HTMLElement | null;
  /** Opens the header area, carrying `programmatic`. Scrolled past, it reveals it in place. */
  expand: () => void;
  /** Closes the header area, carrying `programmatic`. */
  collapse: () => void;
  /** Takes hold, carrying `programmatic`; a collapsed area opens with it. */
  pin: () => void;
  /** Lets go, carrying `programmatic`. */
  unpin: () => void;
}

/** What the family hands its own parts. */
export interface PageHeaderContextValue {
  collapse: PageHeaderCollapse;
  expanded: boolean;
  /** The identifier of the header area, which the toggle names through `aria-controls`. */
  ids: { areaId: string; headingId: string };
  level: PageHeaderLevel;
  loading: boolean;
  /** The family's words in the language in force, with this header's `messages` laid over them. */
  t: FamilyTranslator<PageHeaderMessages>;
  pinned: boolean;
  /** Whether the area is shown whole in place although the scroll has passed it. */
  revealed: boolean;
  /** Whether the scroll has passed the area. */
  scrolled: boolean;
  size: PageHeaderSize;
  /** Asks the header area to open or close, carrying the reason and the originating event. */
  setExpanded: (next: boolean, reason: PageHeaderExpandedReason, source: unknown) => void;
  /** Asks the pin to take hold or let go, carrying the reason and the originating event. */
  setPinned: (next: boolean, reason: PageHeaderPinnedReason, source: unknown) => void;
}

/** What `render` receives for the root. */
export interface PageHeaderRootProps extends HTMLAttributes<HTMLElement> {
  'data-collapse': PageHeaderCollapse;
  'data-compact'?: '' | undefined;
  'data-expanded'?: '' | undefined;
  'data-level': PageHeaderLevel;
  'data-loading'?: '' | undefined;
  'data-material'?: '' | undefined;
  'data-part': string;
  'data-revealed'?: '' | undefined;
  'data-scrolled'?: '' | undefined;
  'data-size': PageHeaderSize;
  'data-stuck'?: '' | undefined;
  'data-ui': string;
  'data-variant': PageHeaderVariant;
}

/** What `render` receives for a plain part. */
export interface PageHeaderPartProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

/** What `render` receives for the heading. */
export interface PageHeaderHeadingRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  id: string;
  title?: string | undefined;
}

/** What `render` receives for the header area. */
export interface PageHeaderAreaRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label': string;
  'data-part': string;
  id: string;
  role: 'region';
}

/** What `render` receives for the toggle. */
export interface PageHeaderToggleRootProps extends ButtonHTMLAttributes<HTMLElement> {
  'aria-controls': string;
  'aria-expanded': boolean;
  'aria-label': string;
  'data-part': string;
  type: 'button';
}

/** What `render` receives for the pin. */
export interface PageHeaderPinRootProps extends ButtonHTMLAttributes<HTMLElement> {
  'aria-label': string;
  'aria-pressed': boolean;
  'data-part': string;
  'data-pressed'?: '' | undefined;
  type: 'button';
}

export interface PageHeaderProps extends Omit<ComponentPropsWithRef<'header'>, 'ref' | 'onChange'> {
  /** Defaults to the provider, then `scroll`. */
  collapse?: PageHeaderCollapse | undefined;
  /** The value an uncontrolled header area starts from, read once. */
  defaultExpanded?: boolean | undefined;
  /** The value an uncontrolled pin starts from, read once. */
  defaultPinned?: boolean | undefined;
  /** Present means the consumer owns the header area's state, for the life of the component. */
  expanded?: boolean | undefined;
  /** Defaults to the provider, then `1`. */
  level?: PageHeaderLevel | undefined;
  /**
   * Whether the title has not arrived yet. The heading, the subheading and the
   * description render Skeleton's text shape in place of their words; the
   * actions stay operable; the root carries `aria-busy`.
   */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toggle, the pin and the header area's name. A native `aria-label` on a
   * part still wins.
   */
  /**
   * Stuck, the chrome is the theme's material — `--slotted-surface-material`
   * behind `--slotted-material-backdrop` — in every variant; at rest each
   * variant keeps its ground. Defaults to the provider, then `false`.
   */
  material?: boolean | undefined;
  messages?: PartialMessages<PageHeaderMessages> | undefined;
  /** Called before the header area moves, with the request that carries the reason. */
  onExpandedChange?: ((expanded: boolean, request: PageHeaderChangeRequest) => void) | undefined;
  /** Called before the pin moves, with the request that carries the reason. */
  onPinnedChange?: ((pinned: boolean, request: PageHeaderChangeRequest) => void) | undefined;
  /** Present means the consumer owns the pin's state, for the life of the component. */
  pinned?: boolean | undefined;
  /** The handle: the element, and the four moves that carry `programmatic`. */
  ref?: Ref<PageHeaderHandle> | undefined;
  /** Renders the root into another element. */
  render?: ((props: PageHeaderRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then `md`. */
  size?: PageHeaderSize | undefined;
  /** Defaults to the provider, then `band`. */
  variant?: PageHeaderVariant | undefined;
}

/**
 * The bar's own props, less the placement the header decides. `size` defaults
 * to `sm`, `delay` to 200 and `minDuration` to 400 milliseconds; a value set
 * here, then one set through `ProgressIndicatorDefaultsProvider`, wins.
 */
export type PageHeaderProgressProps = Omit<ProgressBarProps, 'placement'>;

export interface PageHeaderPartComponentProps extends ComponentPropsWithRef<'div'> {
  /** Renders the part into another element. */
  render?: ((props: PageHeaderPartProps) => ReactNode) | undefined;
}

export interface PageHeaderBackProps extends ComponentPropsWithRef<'a'> {
  /** Renders the way back into another element — a router's link, or a button. */
  render?: ((props: DefinedProps<PageHeaderPartProps>) => ReactNode) | undefined;
}

export interface PageHeaderHeadingProps extends ComponentPropsWithRef<'h1'> {
  /** Renders the heading into another element — an editable field, a link. The rank stays the family's. */
  render?: ((props: PageHeaderHeadingRootProps) => ReactNode) | undefined;
}

export interface PageHeaderSubheadingProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: PageHeaderPartProps) => ReactNode) | undefined;
}

export interface PageHeaderDescriptionProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: PageHeaderPartProps) => ReactNode) | undefined;
}

export interface PageHeaderAreaProps extends ComponentPropsWithRef<'div'> {
  /** Renders the region into another element. */
  render?: ((props: PageHeaderAreaRootProps) => ReactNode) | undefined;
}

export interface PageHeaderToggleProps extends ComponentPropsWithRef<'button'> {
  /** Renders the control into another element. */
  render?: ((props: PageHeaderToggleRootProps) => ReactNode) | undefined;
}

export interface PageHeaderPinProps extends ComponentPropsWithRef<'button'> {
  /** Renders the control into another element. */
  render?: ((props: PageHeaderPinRootProps) => ReactNode) | undefined;
}
