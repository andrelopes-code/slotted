import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type {
  ButtonProps,
  ButtonRootProps,
  ButtonSize,
  ButtonTone,
  ButtonVariant,
  IconButtonProps,
} from '../button/button.types';
import type { MenuHandle, MenuProps, MenuRadioGroupProps } from '../menu/menu.types';

/**
 * Why the remembered value moved. The menu's radio group produces exactly
 * these two, and the family surfaces them unchanged.
 */
export type SplitButtonValueReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard'
>;

export interface SplitButtonChangeRequest extends ChangeRequest<string> {
  readonly reason: SplitButtonValueReason;
}

/** What an application sets once for every split button under it. */
export interface SplitButtonDefaults {
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

export interface SplitButtonDefaultsProviderProps extends SplitButtonDefaults {
  children?: ReactNode | undefined;
}

/** What the root hands its halves and its menu. */
export interface SplitButtonContextValue {
  disabled: boolean;
  loading: boolean;
  remember: boolean;
  /** Asks the family to remember one alternative as the action. */
  select: (value: string, reason: SplitButtonValueReason, source: unknown) => void;
  /** The remembered value, under `remember`. */
  value: string | undefined;
}

/** What `render` receives for the root. */
export interface SplitButtonRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-size': ButtonSize;
  'data-tone': ButtonTone;
  'data-ui': string;
  'data-variant': ButtonVariant;
}

export interface SplitButtonProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'>, SplitButtonDefaults {
  /** The value an uncontrolled split button remembers first, read once. */
  defaultValue?: string | undefined;
  /** Takes both halves out. Each half keeps the native attribute for itself. */
  disabled?: boolean | undefined;
  /** The action takes the line; the menu trigger stays square. */
  fullWidth?: boolean | undefined;
  /**
   * The action is in flight: the primary shows `button`'s indicator with its
   * width and name held, and the menu trigger is `aria-disabled` for the
   * duration — still in the tab sequence, still named, still painted — so a
   * second alternative cannot be chosen while the first runs.
   */
  loading?: boolean | undefined;
  onValueChange?: ((value: string, request: SplitButtonChangeRequest) => void) | undefined;
  /**
   * The choice in the menu becomes the action. Off, the menu's items are
   * actions and the primary does what its label says; on, the items inside
   * `SplitButtonChoices` are radio items bound to `value`, and the consumer
   * renders the primary's label from it. A silent update was refused because
   * it changes what the next click does.
   */
  remember?: boolean | undefined;
  render?: ((props: SplitButtonRootProps) => ReactNode) | undefined;
  /** The remembered value. Present at all puts it in controlled mode. */
  value?: string | undefined;
}

/**
 * `button`'s Button, carrying this family's part. The three appearance axes
 * are the root's; everything else — `start`, `end`, `type`, `loadingDelay`,
 * `focusableWhenDisabled`, the native attributes — is Button's own.
 */
export type SplitButtonPrimaryProps = Omit<ButtonProps, 'size' | 'tone' | 'variant' | 'fullWidth'>;

/**
 * The menu's state owner, rendered around the trigger and the consumer's
 * `MenuContent`. Every prop is `Menu`'s: `open`, `defaultOpen`,
 * `onOpenChange`, `side`, `align`, `size`, `closeOnSelect` and the rest.
 */
export interface SplitButtonMenuProps extends Omit<MenuProps, 'anchor' | 'ref' | 'value'> {
  ref?: Ref<MenuHandle> | undefined;
}

/**
 * `button`'s IconButton, rendered as `menu`'s trigger and carrying this
 * family's part. The accessible name is mandatory at the type level: a split
 * button whose second half is named by nothing announces "button" beside
 * "Save". The chevron is the family's, and children the consumer passes
 * replace it.
 */
export type SplitButtonMenuTriggerProps = Omit<
  IconButtonProps,
  | 'children'
  | 'defaultPressed'
  | 'onPressedChange'
  | 'pressed'
  | 'shape'
  | 'size'
  | 'tone'
  | 'variant'
  | 'loading'
  | 'loadingDelay'
  | 'messages'
> & {
  /** Replaces the family's chevron. */
  children?: ReactNode | undefined;
  render?: ((props: ButtonRootProps) => ReactNode) | undefined;
};

/**
 * The alternatives under `remember`: `menu`'s radio group bound to the
 * family's value. Its children are `MenuRadioItem`s.
 */
export type SplitButtonChoicesProps = Omit<
  MenuRadioGroupProps,
  'defaultValue' | 'onValueChange' | 'value'
>;
