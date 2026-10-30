import type { ChangeRequest } from '@slotted/core/state';
import type { MenuSize } from '../menu';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type MenubarOrientation = 'horizontal' | 'vertical';

/** Why the open menu changed. The same vocabulary a menu reports. */
export type MenubarValueReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'dismiss' | 'programmatic'
>;

export interface MenubarChangeRequest extends ChangeRequest<string> {
  readonly reason: MenubarValueReason;
}

/** Every decision an application takes once rather than per bar. */
export interface MenubarDefaults {
  disabled: boolean;
  loop: boolean;
  orientation: MenubarOrientation;
  size: MenuSize;
  typeahead: boolean;
}

export interface MenubarDefaultsProviderProps extends Partial<MenubarDefaults> {
  children?: ReactNode;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface MenubarHandle {
  /** Moves focus onto the bar, where the reader last left it. */
  focus: () => void;
  /** Closes whichever menu is open, carrying `programmatic`. */
  close: () => void;
}

export interface MenubarProps
  extends
    Partial<MenubarDefaults>,
    Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'ref'> {
  children?: ReactNode;
  /**
   * The menu now open, named by its own `value`. A bar has at most one, so its
   * state is that name rather than a boolean on each menu — which is the one
   * model that cannot represent two open menus at once.
   */
  value?: string | undefined;
  /** The menu an uncontrolled bar starts with open, read once. */
  defaultValue?: string;
  onValueChange?: (value: string, request: MenubarChangeRequest) => void;
  ref?: Ref<MenubarHandle>;
  render?: (props: MenubarRootProps) => ReactNode;
}

/** What `render` receives for the bar itself. */
export interface MenubarRootProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  ref?: ((node: HTMLElement | null) => void) | undefined;
  'data-disabled'?: '' | undefined;
  'data-orientation': MenubarOrientation;
  'data-part': string;
  'data-size': MenuSize;
  'data-ui': string;
  role: 'menubar';
}
