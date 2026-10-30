/**
 * What is covered. `region` is the box the family wraps and the safe default;
 * `page` is the whole viewport, and `docs/component-features.md` §9 warns
 * against reaching for it over a local operation.
 */
export type LoadingOverlayScope = 'region' | 'page';

/** How the covered content is obscured. `none` blocks and dims nothing. */
export type LoadingOverlayVeil = 'wash' | 'blur' | 'none';

export type LoadingOverlaySize = 'sm' | 'md' | 'lg';

/**
 * Whether the wait announces itself. `skeleton`'s own axis and vocabulary:
 * `off` is for a page that already says the same thing somewhere else.
 */
export type LoadingOverlayLive = 'polite' | 'off';

/**
 * Why a cancellation was asked for. `dismiss` is the reader pressing the
 * control; `escape` is the key. There is no third: the family holds no timer
 * and the application does not ask itself to cancel.
 */
export type LoadingOverlayCancelReason = 'dismiss' | 'escape';

/**
 * The ask, and it commits nothing.
 *
 * There is deliberately no `cancel()` on it, which is the one place this
 * request differs from every other in the library. A request can be refused
 * only where something would otherwise commit, and nothing does here: the
 * family does not lower `loading`, does not hide itself and does not move
 * focus. The consumer aborts its own work and lowers `loading` when it has.
 */
export interface LoadingOverlayCancelRequest {
  readonly reason: LoadingOverlayCancelReason;
  /** The event the ask came from: a press on the control, or the key. */
  readonly source: Event;
}

export const LOADING_OVERLAY_DEFAULT_LIVE: LoadingOverlayLive = 'polite';
export const LOADING_OVERLAY_DEFAULT_SIZE: LoadingOverlaySize = 'md';
export const LOADING_OVERLAY_DEFAULT_VEIL: LoadingOverlayVeil = 'wash';
