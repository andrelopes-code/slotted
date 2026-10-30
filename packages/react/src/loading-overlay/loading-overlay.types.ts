import type { LoadingOverlayMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, SyntheticEvent } from 'react';

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
export type LoadingOverlayCancelReason = Extract<ChangeReason, 'dismiss' | 'escape'>;

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
  readonly source: SyntheticEvent | KeyboardEvent;
}

/** What an application sets once for every overlay under it. */
export interface LoadingOverlayDefaults {
  /** How long the wait has to last before anything is painted. */
  delay?: number | undefined;
  live?: LoadingOverlayLive | undefined;
  /** What a screen reader hears when the wait ends. Nothing by default. */
  loadedLabel?: string | undefined;
  /** How long a painted layer is held once it has appeared. */
  minDuration?: number | undefined;
  size?: LoadingOverlaySize | undefined;
  veil?: LoadingOverlayVeil | undefined;
}

export interface LoadingOverlayDefaultsProviderProps extends LoadingOverlayDefaults {
  children?: ReactNode | undefined;
}

/** Props the family writes on whichever element `render` returns for the root. */
export interface LoadingOverlayRootProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
  'data-scope': LoadingOverlayScope;
  'data-size': LoadingOverlaySize;
  'data-ui': string;
  'data-veil': LoadingOverlayVeil;
}

/**
 * Props the family writes on whichever element `renderCancel` returns.
 *
 * `children` is required rather than optional, which is the one place these
 * part props differ from the native element's. The family always supplies the
 * control's words, and a consumer spreading them into a component that
 * requires children — this library's own Button — would otherwise be told the
 * spread might supply none.
 */
export interface LoadingOverlayCancelProps extends ComponentPropsWithRef<'button'> {
  children: ReactNode;
  'data-part': string;
}

export interface LoadingOverlayProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * The content the layer covers. It stays in the document, keeps its
   * geometry, and goes `inert` while the layer blocks.
   *
   * Ignored under `scope="page"`, where what is covered is the application and
   * this family owns no part of it.
   */
  children?: ReactNode | undefined;
  /**
   * Whether the data is still on its way. The consumer's own fact: the family
   * never moves it, so there is no controlled and uncontrolled pair and no
   * request for it.
   *
   * Blocking is the default, because a consumer who forgets the prop sees a
   * covered region on the first render, while the other default leaves a
   * region reachable during a real wait and says nothing.
   */
  loading?: boolean | undefined;
  /** Defaults to `region`. */
  scope?: LoadingOverlayScope | undefined;
  /** Defaults to the provider, then to `wash`. */
  veil?: LoadingOverlayVeil | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: LoadingOverlaySize | undefined;
  /** Defaults to the provider, then to `polite`. */
  live?: LoadingOverlayLive | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * short line (`label`), painted in the panel and announced once, and the
   * cancel control's words (`cancel`).
   */
  messages?: PartialMessages<LoadingOverlayMessages> | undefined;
  /** What a screen reader hears when the wait ends. Announced only if given. */
  loadedLabel?: string | undefined;
  /** The second line, for what the first cannot hold. Painted, never announced. */
  description?: ReactNode | undefined;
  /**
   * Replaces the mark. The default is `progress-indicator`'s contained loader;
   * a determinate wait passes `<ProgressBar value={n} />` here.
   */
  indicator?: ReactNode | undefined;
  /** Renders the control that asks to stop. Absent by default. */
  cancellable?: boolean | undefined;
  /** What that control says, in place of the catalog's `cancel`. */
  cancelLabel?: ReactNode | undefined;
  /**
   * Asks to stop, carrying the reason and the event. The family commits
   * nothing: abort the work and lower `loading` when it has stopped.
   */
  onCancel?: ((request: LoadingOverlayCancelRequest) => void) | undefined;
  /**
   * The moment the covered content is reachable again, which is later than
   * `loading` turning false whenever `minDuration` is holding the layer. An
   * application moving focus on the prop would move it under the wash.
   */
  onReveal?: (() => void) | undefined;
  /** Defaults to the provider, then to `0`. */
  delay?: number | undefined;
  /** Defaults to the provider, then to `0`. */
  minDuration?: number | undefined;
  /**
   * Where the page-scoped layer is portalled. Defaults to the document body.
   * Meaningless under `scope="region"`, where the layer belongs to the region.
   */
  container?: HTMLElement | null | undefined;
  /** Renders the region into another element — a `section`, a `li`, a card. */
  render?: ((props: LoadingOverlayRootProps) => ReactNode) | undefined;
  /** Renders the control into another element — this library's own Button. */
  renderCancel?: ((props: LoadingOverlayCancelProps) => ReactNode) | undefined;
}
