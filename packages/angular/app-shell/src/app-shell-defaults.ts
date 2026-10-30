import { inject, InjectionToken } from '@angular/core';

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
 * How the navigation region occupies space. `auto` is `inline` at or above the
 * shell's own `APP_SHELL_OVERLAY_AT` inline size and `overlay` below it.
 */
export type AppShellNavMode = 'inline' | 'overlay' | 'auto';

/** How the secondary pane occupies space: the navigation's pair, resolved on the same width. */
export type AppShellAsideMode = 'inline' | 'overlay' | 'auto';

/** Which end of the line the navigation region sits at. Logical, so the layout mirrors. */
export type AppShellNavSide = 'start' | 'end';

/** What a closed inline navigation leaves behind. */
export type AppShellCollapsedTo = 'rail' | 'hidden';

/** A step on the region's own width scale. */
export type AppShellSize = 'sm' | 'md' | 'lg';

/** Who scrolls: the content column, or the document. */
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

/**
 * The request the shell makes before the pane's extent moves. `undefined` is
 * the pane back on the measure its size step gives it.
 */
export interface AppShellAsideExtentRequest {
  readonly value: number | undefined;
  readonly previous: number | undefined;
  readonly reason: AppShellAsideExtentReason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/** The request the shell makes before the region moves. Cancel it and nothing commits. */
export interface AppShellOpenRequest {
  readonly value: boolean;
  readonly previous: boolean;
  readonly reason: AppShellOpenReason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

export interface AppShellDefaults {
  asideMode: AppShellAsideMode;
  asideSize: AppShellSize;
  canvas: AppShellCanvas;
  closeOnNavigate: boolean;
  collapsedTo: AppShellCollapsedTo;
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
  separation: AppShellSeparation;
}

const FALLBACK: AppShellDefaults = {
  asideMode: 'auto',
  asideSize: 'md',
  canvas: 'inset',
  closeOnNavigate: true,
  collapsedTo: 'rail',
  escape: 'close',
  back: 'close',
  modal: true,
  navMode: 'auto',
  navSide: 'start',
  navSize: 'md',
  outsidePress: 'close',
  primary: 'banner',
  scroll: 'content',
  separation: 'rule',
};

export const APP_SHELL_DEFAULTS = new InjectionToken<AppShellDefaults>(
  'slotted app shell defaults',
  {
    providedIn: 'root',
    factory: () => FALLBACK,
  },
);

/**
 * An application decides once how its shell is arranged — which region reaches
 * the corner, which plane the content sits on, how the navigation behaves when
 * the space runs out — rather than repeating the same inputs on every route. A
 * shell that states any of them itself still wins. Its words come from the
 * language in force (`provideSlotted`).
 */
export function provideAppShellDefaults(defaults: Partial<AppShellDefaults>) {
  return {
    provide: APP_SHELL_DEFAULTS,
    useFactory: (): AppShellDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a shell renders as here, before it states anything of its own. */
export function injectAppShellDefaults(): AppShellDefaults {
  return inject(APP_SHELL_DEFAULTS);
}
