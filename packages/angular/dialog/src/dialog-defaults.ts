import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * The panel's measure. Five named steps rather than the pixel string Material,
 * Carbon and Ant all take: a theme can retune a step and cannot retune
 * `width: '600px'`, and a family that accepted one would carry a second scale.
 */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Where the panel sits in the layer. `top` is for content that grows. */
export type DialogPlacement = 'center' | 'top';

/**
 * What scrolls. `content` bounds the panel to the layer and scrolls its body,
 * which is what keeps the footer on screen; `viewport` scrolls the whole panel,
 * for content that is a document rather than a task.
 */
export type DialogScroll = 'content' | 'viewport';

/**
 * Whether the family paints the panel at all. `plain` turns off the surface,
 * the border, the radius, the shadow, the rows and the padding, and keeps
 * everything that is not paint: the portal, the scrim, presence, the focus
 * containment and restoration, the dismissal policy and the z-index stack.
 *
 * It is what a consumer reaches for to put the layer around a box of their own
 * — a `slCard`, a media viewer, an image at its own aspect ratio. The cost is
 * that a plain panel does not keep its footer on screen for a long body,
 * because the three rows go with the paint.
 */
export type DialogSurface = 'panel' | 'plain';

/**
 * When the layer exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and hides it.
 *
 * The default is the opposite of `collapsible`'s, and for the same reason: a
 * disclosure's panel transitions its own height and has to be in the DOM, while
 * a layer transitions opacity and `@slotted/core/presence` already keeps it
 * mounted for its own exit.
 */
export type DialogMount = 'active' | 'lazy' | 'eager';

/**
 * When the panel spends the whole layer. `narrow` is a container query at a
 * literal breakpoint, which is what `docs/component-features.md` §2.7 means by
 * a responsive mode that can be tested deterministically.
 */
export type DialogFullScreen = 'never' | 'narrow' | 'always';

/** Whether a dismissal source closes the layer. */
export type DialogDismissPolicy = 'close' | 'none';

/** The five semantic tones. An alert dialog draws its mark from this. */
export type DialogTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** Where focus goes when the layer opens. */
export type DialogInitialFocus = 'first' | 'container' | 'cancel' | HTMLElement | false;

/** Where focus goes when the layer closes. Defaults to the trigger. */
export type DialogFinalFocus = HTMLElement | false;

/** Why the layer opened or closed. */
export type DialogOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'dismiss'
  | 'escape'
  | 'outsidePress'
  | 'back'
  | 'submit'
  | 'programmatic';

/**
 * The request the family emits before the layer moves, with the result the
 * close carried. `result` is what the platform calls `returnValue` and what
 * Angular Material returns from `afterClosed()`; it rides on the request rather
 * than declaring a second state model, because nothing about it is controlled.
 */
export interface DialogChangeRequest {
  readonly value: boolean;
  readonly previous: boolean;
  readonly reason: DialogOpenReason;
  readonly result?: string | undefined;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

/** Why the panel took the layer, or gave it back. */
export type DialogFullscreenReason = 'pointer' | 'keyboard' | 'programmatic';

export interface DialogFullscreenRequest {
  readonly value: boolean;
  readonly previous: boolean;
  readonly reason: DialogFullscreenReason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

export interface DialogDefaults {
  /** The platform's way back — a phone's gesture, a browser's button — closes a modal layer. */
  back: DialogDismissPolicy;
  escape: DialogDismissPolicy;
  fullScreen: DialogFullScreen;
  modal: boolean;
  mount: DialogMount;
  outsidePress: DialogDismissPolicy;
  placement: DialogPlacement;
  scroll: DialogScroll;
  size: DialogSize;
  surface: DialogSurface;
}

const FALLBACK: DialogDefaults = {
  back: 'close',
  escape: 'close',
  fullScreen: 'narrow',
  modal: true,
  mount: 'active',
  outsidePress: 'close',
  placement: 'center',
  scroll: 'content',
  size: 'md',
  surface: 'panel',
};

export const DIALOG_DEFAULTS = new InjectionToken<DialogDefaults>('slotted dialog defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its dialogs behave and look, rather than
 * repeating the same eight inputs on every one in a product. Angular Material
 * is the only surveyed implementation with an equivalent —
 * `MAT_DIALOG_DEFAULT_OPTIONS` — and React gets one here too rather than being
 * levelled down to the smaller shape.
 */
export function provideDialogDefaults(defaults: Partial<DialogDefaults>) {
  return {
    provide: DIALOG_DEFAULTS,
    useFactory: (): DialogDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a dialog renders as here, before it states anything of its own. */
export function injectDialogDefaults(): DialogDefaults {
  return inject(DIALOG_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlDialogIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-dialog-${this.count}`;
  }
}
