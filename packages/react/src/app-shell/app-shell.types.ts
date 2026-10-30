import type { AppShellMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  RefCallback,
  RefObject,
} from 'react';

import type { ProgressBarProps } from '../progress-indicator';

/**
 * Which region reaches the corner of the screen. `banner` spans the full width
 * and the navigation starts below it; `nav` spans the full height and the
 * banner starts beside it; `main` spans the navigation the full height as well
 * and puts the banner in the plane of the content, inside the card that holds
 * it. The grid changes where a region is drawn and never where it is written,
 * so the focus order is the same under all three.
 */
export type AppShellPrimary = 'banner' | 'nav' | 'main';

/**
 * Which surface carries which plane, for every region at once. `inset` paints
 * the frame with the sunken ground and makes the content a raised card;
 * `flush` runs every region edge to edge, separated at its seams; `floating`
 * makes the navigation a card as well as the content; `panel` holds the
 * navigation, the content and the pane in one card, the banner on the frame
 * above it.
 */
export type AppShellCanvas = 'inset' | 'flush' | 'floating' | 'panel';

/**
 * What draws a seam where two regions touch without a gutter. `rule` is a
 * line; `tone` is a ground of its own on the chrome regions, 0.036 OKLab L
 * from the surface, with the subtle tones inside them recomputed from it.
 */
export type AppShellSeparation = 'rule' | 'tone';

/**
 * How the navigation region occupies space. `inline` makes it a column of the
 * grid, `overlay` takes it out of the grid and over the content as a
 * dismissable layer, and `auto` is `inline` at or above the shell's own
 * `overlayAt` inline size and `overlay` below it.
 */
export type AppShellNavMode = 'inline' | 'overlay' | 'auto';

/**
 * How the secondary pane occupies space: the navigation's pair, resolved on the
 * same width. A detail pane at 1280 pixels is a column and at 600 is a layer.
 */
export type AppShellAsideMode = 'inline' | 'overlay' | 'auto';

/** Which end of the line the navigation region sits at. Logical, so the layout mirrors. */
export type AppShellNavSide = 'start' | 'end';

/**
 * What a closed inline navigation leaves behind. `rail` keeps a strip the width
 * of a target, which keeps the destinations reachable and the region in the tab
 * order; `hidden` takes the region out of the layout and out of the tab order.
 */
export type AppShellCollapsedTo = 'rail' | 'hidden';

/** A step on the region's own width scale. A theme retunes a step; it cannot retune `240px`. */
export type AppShellSize = 'sm' | 'md' | 'lg';

/**
 * Who scrolls. `content` makes the shell the height it was given and lets only
 * the content column scroll; `document` lets the shell grow and the document
 * scroll, and the banner travels with it.
 */
export type AppShellScroll = 'content' | 'document';

/** Whether a dismissal source closes the overlaid navigation. */
export type AppShellDismissPolicy = 'close' | 'none';

/** Why the navigation region opened or closed. */
export type AppShellOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'escape'
  | 'outsidePress'
  | 'back'
  | 'select'
  | 'resize'
  | 'programmatic';

/** Why the secondary pane opened or closed. No `select`: a pane has no destinations. */
export type AppShellAsideOpenReason = Exclude<AppShellOpenReason, 'select'>;

/** Why the pane's extent moved. */
export type AppShellAsideExtentReason = 'pointer' | 'keyboard' | 'programmatic';

/** What an application sets once for every shell under it. */
export interface AppShellDefaults {
  asideMode: AppShellAsideMode;
  asideSize: AppShellSize;
  canvas: AppShellCanvas;
  closeOnNavigate: boolean;
  collapsedTo: AppShellCollapsedTo;
  separation: AppShellSeparation;
  escape: AppShellDismissPolicy;
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: AppShellDismissPolicy;
  modal: boolean;
  navMode: AppShellNavMode;
  navSide: AppShellNavSide;
  navSize: AppShellSize;
  outsidePress: AppShellDismissPolicy;
  primary: AppShellPrimary;
  scroll: AppShellScroll;
}

export interface AppShellDefaultsProviderProps extends Partial<AppShellDefaults> {
  children?: ReactNode | undefined;
}

/**
 * The request the shell makes before the navigation region moves. Cancel it and
 * nothing commits; read `reason` to tell the reader's own choice from the one
 * the layout forced.
 */
export interface AppShellOpenRequest extends Omit<ChangeRequest<boolean>, 'reason'> {
  reason: AppShellOpenReason;
}

/** The request the shell makes before the secondary pane moves. */
export interface AppShellAsideOpenRequest extends Omit<ChangeRequest<boolean>, 'reason'> {
  reason: AppShellAsideOpenReason;
}

/**
 * The request the shell makes before the pane's extent moves. `undefined` is
 * the pane back on the measure its size step gives it.
 */
export interface AppShellAsideExtentRequest extends Omit<
  ChangeRequest<number | undefined>,
  'reason'
> {
  reason: AppShellAsideExtentReason;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface AppShellHandle {
  /** Asks to show the navigation region, with the reason `programmatic`. */
  openNav: () => void;
  /** Asks to hide it, with the reason `programmatic`. */
  closeNav: () => void;
  /** Asks to show the secondary pane, with the reason `programmatic`. */
  openAside: () => void;
  /** Asks to hide it, with the reason `programmatic`. */
  closeAside: () => void;
  /** Moves focus into the content region, which is where a skip link sends it. */
  focusMain: () => void;
  /** The root element, once it is in the document. */
  readonly root: HTMLElement | null;
}

/** What every part of the family reads from the shell around it. */
export interface AppShellContextValue {
  /** The resolved pane mode, which is `auto` answered against the shell's own width. */
  asideMode: Exclude<AppShellAsideMode, 'auto'> | undefined;
  asideOpen: boolean;
  asideSize: AppShellSize;
  /** The pane's measure as a fraction of the shell, or `undefined` while the size step decides. */
  asideExtent: number | undefined;
  minAsideExtent: number;
  maxAsideExtent: number;
  /** Whether a pointer is moving the pane's edge, which the root reports as `data-dragging`. */
  asideDragging: boolean;
  canvas: AppShellCanvas;
  closeOnNavigate: boolean;
  collapsedTo: AppShellCollapsedTo;
  separation: AppShellSeparation;
  escape: AppShellDismissPolicy;
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: AppShellDismissPolicy;
  /** The family's words in the language in force, with this shell's `messages` laid over them. */
  t: FamilyTranslator<AppShellMessages>;
  modal: boolean;
  /** The resolved mode, which is `auto` answered against the shell's own width. */
  navMode: Exclude<AppShellNavMode, 'auto'> | undefined;
  navSide: AppShellNavSide;
  navSize: AppShellSize;
  open: boolean;
  outsidePress: AppShellDismissPolicy;
  primary: AppShellPrimary;
  scroll: AppShellScroll;
  /** The ids the toggles and the regions use to point at each other. */
  navId: string;
  toggleId: string;
  mainId: string;
  asideId: string;
  asideToggleId: string;
  /** Asks to move the navigation region. A consumer's own handler runs first and may cancel. */
  setOpen: (next: boolean, reason: AppShellOpenReason, source?: unknown) => void;
  /** Asks to move the secondary pane. */
  setAsideOpen: (next: boolean, reason: AppShellAsideOpenReason, source?: unknown) => void;
  /** Asks to move the pane's extent, held inside the limits. */
  setAsideExtent: (
    next: number | undefined,
    reason: AppShellAsideExtentReason,
    source?: unknown,
  ) => void;
  setAsideDragging: (dragging: boolean) => void;
  /** The root, which the pane's extent is a fraction of. */
  root: HTMLElement | null;
  /** A region says it exists, so a skip link is never written to a target nobody rendered. */
  register: (region: 'nav' | 'main' | 'aside') => () => void;
  /** Whether the bar on the content's edge is painted, which `main` reports as `aria-busy`. */
  busy: boolean;
  /** The progress part says when its bar is painted and when it is withdrawn. */
  setBusy: (busy: boolean) => void;
  /** The nodes the layer and the focus scope need, and nothing else reads. */
  nodes: {
    aside: HTMLElement | null;
    asideToggle: HTMLElement | null;
    banner: HTMLElement | null;
    footer: HTMLElement | null;
    main: HTMLElement | null;
    nav: HTMLElement | null;
    toggle: HTMLElement | null;
  };
}

/** What `render` receives for the root. */
/** What `render` receives for a part: its attributes, and the ref the shell registers it through. */
export interface AppShellPartProps<E extends HTMLElement = HTMLElement> extends HTMLAttributes<E> {
  /** The callback the part reads its element through; a substituted element attaches it. */
  ref?: RefCallback<E> | undefined;
}

export interface AppShellRootProps extends HTMLAttributes<HTMLElement> {
  /** The callback the root reads its element through; a substituted element attaches it. */
  ref?: RefCallback<HTMLElement> | undefined;
  'data-aside-mode'?: 'inline' | 'overlay' | undefined;
  'data-aside-size': AppShellSize;
  'data-canvas': AppShellCanvas;
  'data-collapsed-to': AppShellCollapsedTo;
  'data-dragging'?: '' | undefined;
  'data-nav-mode'?: 'inline' | 'overlay' | undefined;
  'data-nav-side': AppShellNavSide;
  'data-nav-size': AppShellSize;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-primary': AppShellPrimary;
  'data-scroll': AppShellScroll;
  'data-separation': AppShellSeparation;
  'data-ui': 'app-shell';
}

type Native<T extends keyof HTMLElementTagNameMap> = Omit<
  ComponentPropsWithRef<T>,
  'children' | 'className' | 'style'
>;

interface Common {
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export interface AppShellProps extends Omit<Native<'div'>, 'ref'>, Common {
  /**
   * How much of the shell's inline size the pane takes as a column, in
   * `[0, 1]`. Unset means `asideSize` decides. Passing anything but
   * `undefined` puts the extent in controlled mode.
   */
  asideExtent?: number | undefined;
  asideMode?: AppShellAsideMode | undefined;
  /** The controlled value of the secondary pane. */
  asideOpen?: boolean | undefined;
  asideSize?: AppShellSize | undefined;
  canvas?: AppShellCanvas | undefined;
  /** A click on an `a[href]` inside the overlaid region asks to close, with the reason `select`. */
  closeOnNavigate?: boolean | undefined;
  collapsedTo?: AppShellCollapsedTo | undefined;
  /** The uncontrolled starting extent of the pane, read once. */
  defaultAsideExtent?: number | undefined;
  /** The uncontrolled starting value of the pane, read once. */
  defaultAsideOpen?: boolean | undefined;
  /** The uncontrolled starting value, read once. */
  defaultNavOpen?: boolean | undefined;
  escape?: AppShellDismissPolicy | undefined;
  /**
   * The platform's way back — a phone's gesture, a browser's button — closes
   * a modal layer instead of leaving the page. Defaults to the provider, then `close`.
   */
  back?: AppShellDismissPolicy | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmarks' names, the toggles and the skip links. A native `aria-label` on
   * a part still wins.
   */
  messages?: PartialMessages<AppShellMessages> | undefined;
  /** The largest extent the reader may give the pane. Defaults to `0.6`. */
  maxAsideExtent?: number | undefined;
  /** The smallest extent the reader may give the pane. Defaults to `0.16`. */
  minAsideExtent?: number | undefined;
  /** Whether the overlaid region contains focus and makes the rest of the shell `inert`. */
  modal?: boolean | undefined;
  /** The controlled value. Passing anything but `undefined` puts the shell in controlled mode. */
  navOpen?: boolean | undefined;
  navMode?: AppShellNavMode | undefined;
  navSide?: AppShellNavSide | undefined;
  navSize?: AppShellSize | undefined;
  onAsideExtentChange?:
    ((extent: number | undefined, request: AppShellAsideExtentRequest) => void) | undefined;
  onAsideOpenChange?: ((open: boolean, request: AppShellAsideOpenRequest) => void) | undefined;
  onNavOpenChange?: ((open: boolean, request: AppShellOpenRequest) => void) | undefined;
  outsidePress?: AppShellDismissPolicy | undefined;
  primary?: AppShellPrimary | undefined;
  ref?: RefObject<AppShellHandle | null> | ((handle: AppShellHandle | null) => void) | undefined;
  /** Substitutes the rendered element, keeping every attribute and listener. */
  render?: ((props: AppShellRootProps) => ReactNode) | undefined;
  scroll?: AppShellScroll | undefined;
  /** What draws a seam where two regions touch without a gutter. Defaults to the provider, then `rule`. */
  separation?: AppShellSeparation | undefined;
}

export interface AppShellBannerProps extends Native<'header'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellBrandProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellActionsProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellCenterProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellNavProps extends Native<'nav'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellNavSectionProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
/**
 * The bar's own props, less the placement the shell decides. `size` defaults
 * to `sm`, `delay` to 200 and `minDuration` to 400 milliseconds; a value set
 * here, then one set through `ProgressIndicatorDefaultsProvider`, wins.
 */
export type AppShellProgressProps = Omit<ProgressBarProps, 'placement'>;

export interface AppShellMainProps extends Native<'main'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellAsideProps extends Native<'aside'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellAsideSectionProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellAsideBodyProps extends AppShellAsideSectionProps {
  /** `none` drops the body's own padding, for content that brings its own inset. */
  inset?: 'none' | undefined;
}
export interface AppShellAsideResizerProps extends Native<'div'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellAsideToggleProps extends Native<'button'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellFooterProps extends Native<'footer'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
export interface AppShellNavToggleProps extends Native<'button'>, Common {
  render?: ((props: AppShellPartProps) => ReactNode) | undefined;
}
