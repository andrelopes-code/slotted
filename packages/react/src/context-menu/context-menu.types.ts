import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { MenuChangeRequest, MenuHandle, MenuProps } from '../menu';

/** The ref a part hands to `render`, as `menu` and `popover` declare it. */
export type PartRef = (node: HTMLElement | null) => void;

/** Every decision an application takes once rather than per context menu. */
export interface ContextMenuDefaults {
  /** Whether a long press on touch and pen opens the menu. */
  longPress: boolean;
  /** How long the press is held before the menu opens, in milliseconds. */
  longPressDelay: number;
  /** The family never opens and lets the browser's own menu through. */
  disabled: boolean;
}

export interface ContextMenuDefaultsProviderProps extends Partial<ContextMenuDefaults> {
  children?: ReactNode;
}

/**
 * The menu's own props, minus the two the family decides — the anchor is the
 * point the reader pressed and the focus destination is what held focus when
 * it opened — plus the family's three.
 */
export interface ContextMenuProps
  extends Omit<MenuProps, 'anchor' | 'finalFocus' | 'value' | 'ref'>, Partial<ContextMenuDefaults> {
  children?: ReactNode;
  onOpenChange?: (open: boolean, request: MenuChangeRequest) => void;
  ref?: Ref<MenuHandle>;
}

/**
 * What `render` receives for the target: the native element's props, extended
 * with the identity and the state the family writes. `ref` is part of it
 * because the target is what the keyboard-opened menu hangs from and what
 * focus returns to when nothing else held it.
 */
export interface ContextMenuTriggerRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  'data-ui': 'context-menu';
  'data-part': 'root';
  'data-open'?: '' | undefined;
  'data-pressed'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  id: string;
}

export interface ContextMenuTriggerProps extends ComponentPropsWithRef<'div'> {
  /** The consumer's own element in place of the `div`: a row, a card, a canvas. */
  render?: ((props: ContextMenuTriggerRootProps) => ReactNode) | undefined;
}

/** What the family around the target says. */
export interface ContextMenuContextValue {
  disabled: boolean;
  longPress: boolean;
  longPressDelay: number;
  /** Where the surface hangs from: the point pressed, or the target itself. */
  setAnchor: (anchor: { getBoundingClientRect: () => DOMRect } | null) => void;
  /** What held focus when the menu opened, for the way back. */
  returnTo: { current: Element | null };
}
