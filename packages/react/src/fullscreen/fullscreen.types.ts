import type {
  FullscreenError,
  FullscreenMode,
  FullscreenNavigationUI,
  FullscreenPolicy,
} from '@slotted/core/fullscreen';
import type { FamilyTranslator, FullscreenMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, RefObject } from 'react';

export type { FullscreenError, FullscreenMode, FullscreenNavigationUI };

/** `auto` asks the platform first and falls back to the layout; `layout` never asks. */
export type FullscreenPolicyMode = FullscreenPolicy;

export type FullscreenTriggerSize = 'sm' | 'md' | 'lg';

/** `ghost` inside a bar that is already framed; `outline` over content. */
export type FullscreenTriggerVariant = 'ghost' | 'outline';

/**
 * Why the state moved. `escape` is the leave nobody asked for: `Escape` in
 * the layout, or the agent's own exit in native — a key, F11, its interface.
 */
export type FullscreenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'programmatic'
>;

export interface FullscreenChangeRequest extends ChangeRequest<boolean> {
  readonly reason: FullscreenReason;
}

export type FullscreenChangeHandler = (
  fullscreen: boolean,
  request: FullscreenChangeRequest,
) => void;

/** What an application sets once for every region and control under it. */
export interface FullscreenDefaults {
  mode: FullscreenPolicyMode;
  navigationUI: FullscreenNavigationUI;
  size: FullscreenTriggerSize;
  variant: FullscreenTriggerVariant;
}

export interface FullscreenDefaultsProviderProps extends Partial<FullscreenDefaults> {
  children?: ReactNode | undefined;
}

export interface UseFullscreenOptions {
  /** The consumer's value; passing it puts the state in controlled mode for good. */
  fullscreen?: boolean | undefined;
  /** The value an uncontrolled region starts from, read once. */
  defaultFullscreen?: boolean | undefined;
  onFullscreenChange?: FullscreenChangeHandler | undefined;
  /** The platform was absent or refused. The region is in the layout by then. */
  onFullscreenError?: ((error: FullscreenError) => void) | undefined;
  mode?: FullscreenPolicyMode | undefined;
  navigationUI?: FullscreenNavigationUI | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * control's (`enter`, `exit`) and the announcements (`entered`, `exited`).
   */
  messages?: PartialMessages<FullscreenMessages> | undefined;
}

/**
 * What `useFullscreen` returns, and what a control outside the region takes
 * as its `target`.
 */
export interface FullscreenHandle {
  readonly fullscreen: boolean;
  /** The way that answered, or `null` while the region is not full screen. */
  readonly mode: FullscreenMode | null;
  /** Whether the page may ask for native full screen. `false` until mounted. */
  readonly supported: boolean;
  /** The last refusal, cleared on the next entry. */
  readonly error: FullscreenError | null;
  /** The family's words in the language in force, with the region's `messages` laid over them. */
  readonly t: FamilyTranslator<FullscreenMessages>;
  enter: (reason?: FullscreenReason, source?: unknown) => void;
  exit: (reason?: FullscreenReason, source?: unknown) => void;
  toggle: (reason?: FullscreenReason, source?: unknown) => void;
}

export type FullscreenTarget = RefObject<HTMLElement | null> | HTMLElement | null;

/** What `render` receives for the region. */
export interface FullscreenRootProps extends HTMLAttributes<HTMLElement> {
  'data-fullscreen'?: '' | undefined;
  'data-mode'?: FullscreenMode | undefined;
  'data-part': 'root';
  'data-ui': 'fullscreen';
  /** Attach it: the region is the element this callback receives. */
  ref: (node: HTMLElement | null) => void;
}

export interface FullscreenProps
  extends Omit<ComponentPropsWithRef<'div'>, 'onError'>, UseFullscreenOptions {
  /** Renders the wiring into the consumer's own element: a `section`, a `figure`. */
  render?: ((props: FullscreenRootProps) => ReactNode) | undefined;
}

/** What `render` receives for the content part. */
export interface FullscreenContentRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': 'content';
  'data-ui': 'fullscreen';
}

export interface FullscreenContentProps extends ComponentPropsWithRef<'div'> {
  /** Renders the wiring into the consumer's own element: a `main`, a `figure`. */
  render?: ((props: FullscreenContentRootProps) => ReactNode) | undefined;
}

/** What `render` receives for the control. */
export interface FullscreenTriggerRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-fullscreen'?: '' | undefined;
  'data-icon-only'?: '' | undefined;
  'data-part': 'trigger';
  'data-size': FullscreenTriggerSize;
  'data-ui': 'fullscreen';
  'data-variant': FullscreenTriggerVariant;
}

export interface FullscreenTriggerProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'type'
> {
  /**
   * The words, in place of the message the state picks. A function receives
   * the state, so a consumer's label still follows it.
   */
  children?: ReactNode | ((fullscreen: boolean) => ReactNode) | undefined;
  disabled?: boolean | undefined;
  /** A mark in place of the family's; a function receives the state. */
  icon?: ReactNode | ((fullscreen: boolean) => ReactNode) | undefined;
  /** The mark alone; the words stay, visually hidden, as the accessible name. */
  iconOnly?: boolean | undefined;
  /** It stays a `button`: the control acts, it does not navigate. */
  render?: ((props: FullscreenTriggerRootProps) => ReactNode) | undefined;
  size?: FullscreenTriggerSize | undefined;
  /** The region's handle, for a control outside `Fullscreen`. */
  target?: FullscreenHandle | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  variant?: FullscreenTriggerVariant | undefined;
}
