import { InjectionToken } from '@angular/core';

import type { MenuOpenReason, MenuSize } from './menu-defaults';

/**
 * What a bar offers the menus on it.
 *
 * Declared here rather than in the menubar entry point, so the menu family
 * depends on nothing above it: `@slotted/angular/menubar` imports this token
 * and provides itself against it, and the dependency runs one way.
 */
export interface MenubarSurface {
  /** The name of the menu now open, or `undefined`. */
  readonly value: () => string | undefined;
  /** Where focus goes when the bar opens one of its menus. */
  readonly entry: { current: 'first' | 'last' | 'trigger' };
  open(value: string, reason: MenuOpenReason, source?: Event): void;
  close(reason: MenuOpenReason, source?: Event): void;
  /** Moves to the neighbouring trigger, and opens its menu when asked. */
  step(direction: 1 | -1, options?: { open?: boolean }): void;
  register(value: string, trigger: HTMLElement | null): void;
  readonly orientation: () => 'horizontal' | 'vertical';
  readonly disabled: () => boolean;
  readonly size: () => MenuSize;
}

export const MENUBAR_SURFACE = new InjectionToken<MenubarSurface>('slotted menubar surface');
