import type { ExtentSide } from '@slotted/core/extent';
import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * Whether the drawer is a layer over the page or a box beside it.
 *
 * One axis rather than two components, because the switch is the point: an
 * application binds it to its own breakpoint, and swapping one element for
 * another there would destroy the view — taking the panel's scroll position,
 * focus and every uncontrolled control inside it.
 */
export type DrawerMode = 'overlay' | 'inline';

/**
 * Which edge the panel comes from. Logical, so the whole layout mirrors in a
 * right-to-left document without a second stylesheet.
 */
export type DrawerSide = ExtentSide;

/**
 * The panel's resting measure. Five named steps rather than a pixel string: a
 * theme retunes a step and cannot retune `width: 400px`.
 */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content';

/** When the panel exists. */
/**
 * What a hand moves an overlay sheet from the bottom by. `panel` lets a touch
 * anywhere on it move it and hand itself to the scroll of what it holds;
 * `resizer` leaves the separator the only target. Only a bottom overlay sheet
 * reads it.
 */
export type DrawerDrag = 'panel' | 'resizer';

export type DrawerMount = 'active' | 'lazy' | 'eager';

/** Whether a dismissal source closes the drawer. */
export type DrawerDismissPolicy = 'close' | 'none';

/** Where focus goes when an overlay drawer opens. */
export type DrawerInitialFocus =
  'first' | 'container' | HTMLElement | (() => HTMLElement | null) | false;

/** Where focus goes when the drawer closes. Defaults to the trigger. */
export type DrawerFinalFocus = HTMLElement | false;

/** Why the drawer opened or closed. */
export type DrawerOpenReason =
  'pointer' | 'keyboard' | 'dismiss' | 'escape' | 'outsidePress' | 'back' | 'programmatic';

/** Why the panel's measure moved. */
export type DrawerExtentReason = 'pointer' | 'keyboard' | 'programmatic';

interface Request<Value, Reason> {
  readonly value: Value;
  readonly previous: Value;
  readonly reason: Reason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/**
 * The request the family emits before the drawer moves, with the result the
 * close carried. `result` is what the platform calls `returnValue` and what
 * Angular Material returns from `afterClosed()`; it rides on the request rather
 * than declaring a second state model, because nothing about it is controlled.
 */
export interface DrawerChangeRequest extends Request<boolean, DrawerOpenReason> {
  readonly result?: string | undefined;
}

/** The request the separator emits before the measure moves. */
/**
 * `undefined` is a value of this state and not the absence of one: it is the
 * panel back on the measure its size step gives it, which is where it starts
 * and where a double click on the separator puts it again.
 */
export type DrawerExtentRequest = Request<number | undefined, DrawerExtentReason>;

export interface DrawerDefaults {
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: DrawerDismissPolicy;
  escape: DrawerDismissPolicy;
  mode: DrawerMode;
  modal: boolean;
  mount: DrawerMount;
  outsidePress: DrawerDismissPolicy;
  side: DrawerSide;
  /**
   * Unset, the size the side gives: `content` on `top` and `bottom`, where
   * every native sheet measures what it holds, and `md` on `start` and `end`.
   */
  size: DrawerSize | undefined;
  drag: DrawerDrag;
}

const FALLBACK: DrawerDefaults = {
  back: 'close',
  escape: 'close',
  modal: true,
  mode: 'overlay',
  mount: 'active',
  outsidePress: 'close',
  side: 'end',
  size: undefined,
  drag: 'panel',
};

export const DRAWER_DEFAULTS = new InjectionToken<DrawerDefaults>('slotted drawer defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its drawers behave and look, rather than
 * repeating the same seven inputs on every one in a product. Ant reaches the
 * same place through `ConfigProvider`; no React drawer in the surveyed set has
 * an equivalent, and React gets one here too rather than being levelled down.
 */
export function provideDrawerDefaults(defaults: Partial<DrawerDefaults>) {
  return {
    provide: DRAWER_DEFAULTS,
    useFactory: (): DrawerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a drawer renders as here, before it states anything of its own. */
export function injectDrawerDefaults(): DrawerDefaults {
  return inject(DRAWER_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlDrawerIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-drawer-${this.count}`;
  }
}
