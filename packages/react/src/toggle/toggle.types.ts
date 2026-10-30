import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the control sits at. */
export type ToggleSize = 'sm' | 'md' | 'lg';

/**
 * Whether the control is framed or bare. `ghost` is the toggle that sits
 * inside something already framed — a toolbar, a card header. There is no
 * tone axis: a mode is one colour when it is on, and an action that persists
 * in one of five tones is `button`'s ToggleButton.
 */
export type ToggleVariant = 'outline' | 'ghost' | 'chips';

/** Why the state moved. A toggle can produce exactly these two. */
export type TogglePressedReason = Extract<ChangeRequest<boolean>['reason'], 'pointer' | 'keyboard'>;

export interface ToggleChangeRequest extends ChangeRequest<boolean> {
  readonly reason: TogglePressedReason;
}

/**
 * A change is a request. It carries the value, the value it replaces, the
 * reason, the originating event and `cancel()`. The value comes first because
 * reading it is what almost every consumer does — the shape `button`'s
 * ToggleButton hands its own consumers.
 */
export type TogglePressedChangeHandler = (pressed: boolean, request: ToggleChangeRequest) => void;

/** What an application sets once for every toggle under it. */
export interface ToggleDefaults {
  size: ToggleSize;
  variant: ToggleVariant;
}

export interface ToggleDefaultsProviderProps extends Partial<ToggleDefaults> {
  children?: ReactNode | undefined;
}

/** What `render` receives for the root. */
export interface ToggleRootProps extends HTMLAttributes<HTMLElement> {
  'aria-pressed': boolean;
  'data-disabled'?: '' | undefined;
  'data-part': string;
  'data-pressed'?: '' | undefined;
  'data-size': ToggleSize;
  'data-ui': string;
  'data-variant': ToggleVariant;
}

export interface ToggleProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'aria-pressed' | 'children' | 'type'
> {
  /** The words. Absent on an icon-only toggle, which then draws square and needs `aria-label`. */
  children?: ReactNode | undefined;
  /** The value an uncontrolled toggle starts from, read once. */
  defaultPressed?: boolean | undefined;
  disabled?: boolean | undefined;
  /** The mark, aligned to the label's text. */
  icon?: ReactNode | undefined;
  onPressedChange?: TogglePressedChangeHandler | undefined;
  /**
   * The consumer's value. Passing it puts the state in controlled mode for
   * good; `undefined` is written explicitly because absence decides the mode.
   */
  pressed?: boolean | undefined;
  /**
   * Renders the wiring into the consumer's own element. It stays a `button`:
   * `aria-pressed` on a link is a link announcing a state a link does not
   * hold.
   */
  render?: ((props: ToggleRootProps) => ReactNode) | undefined;
  size?: ToggleSize | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  variant?: ToggleVariant | undefined;
}
