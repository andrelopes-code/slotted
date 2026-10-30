import { inject, InjectionToken } from '@angular/core';

/** The surface's measure and the geometry of its items. */
export type MenuSize = 'sm' | 'md' | 'lg';

/**
 * How wide the surface is. `content` is its own measure, between the family's
 * floor and cap; `anchor` is the trigger's width, capped by the room the
 * positioner reports. A submenu is always `content`.
 */
export type MenuWidth = 'content' | 'anchor';

/** Where the surface hangs. The two logical values mirror; the rest do not. */
export type MenuSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

export type MenuAlign = 'start' | 'center' | 'end';

/** When the layer exists, as `tooltip`, `popover` and `collapsible` declare it. */
export type MenuMount = 'active' | 'lazy' | 'eager';

export type MenuStrategy = 'absolute' | 'fixed';

/** The five semantic tones. A command that destroys something takes `danger`. */
export type MenuTone = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';

/** Why the surface opened or closed. */
export type MenuOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'dismiss' | 'programmatic';

/** Why a checkbox item or a radio group moved: the device, and nothing else. */
export type MenuValueReason = 'pointer' | 'keyboard';

export interface MenuDefaults {
  align: MenuAlign;
  alignOffset: number;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  disabled: boolean;
  flip: boolean;
  hideWhenDetached: boolean;
  loop: boolean;
  mount: MenuMount;
  openOnHover: boolean;
  portal: boolean;
  shift: boolean;
  side: MenuSide;
  sideOffset: number;
  size: MenuSize;
  width: MenuWidth;
  strategy: MenuStrategy;
  submenuCloseDelay: number;
  submenuOpenDelay: number;
  typeahead: boolean;
  typeaheadTimeout: number;
}

/**
 * The numbers, and why they are these numbers: `side` and `align` hang the
 * surface under the start edge of its own control, where the control's text and
 * the items' labels share one edge; `submenuOpenDelay` is short enough that a
 * deliberate hover is answered and long enough that a pointer crossing three
 * items opens none of them; `hideWhenDetached` is `true` where `popover`'s is
 * `false`, because a menu whose control has scrolled away commands nothing.
 */
const FALLBACK: MenuDefaults = {
  align: 'start',
  alignOffset: 0,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  hideWhenDetached: true,
  loop: true,
  mount: 'active',
  openOnHover: true,
  portal: true,
  shift: true,
  side: 'bottom',
  sideOffset: 0,
  size: 'md',
  width: 'content',
  strategy: 'absolute',
  submenuCloseDelay: 300,
  submenuOpenDelay: 150,
  typeahead: true,
  typeaheadTimeout: 500,
};

export const MENU_DEFAULTS = new InjectionToken<MenuDefaults>('slotted menu defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its menus open, where they hang and how long
 * a submenu waits. A menu that states any of them itself still wins.
 */
export function provideMenuDefaults(defaults: Partial<MenuDefaults>) {
  return {
    provide: MENU_DEFAULTS,
    useFactory: (): MenuDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a menu renders as here, before it states anything of its own. */
export function injectMenuDefaults(): MenuDefaults {
  return inject(MENU_DEFAULTS);
}
