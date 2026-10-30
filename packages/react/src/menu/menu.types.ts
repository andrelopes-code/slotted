import type { PositionerAnchor } from '@slotted/core/positioner';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, RefObject } from 'react';

/**
 * The ref a part hands to `render`. A callback rather than `Ref<HTMLElement>`,
 * so the consumer's own component takes it: a `Ref<HTMLElement>` is not a
 * `Ref<HTMLButtonElement>`, and a trigger rendered as this library's `Button`
 * would not typecheck. `tooltip` and `popover` declare the same shape.
 */
export type PartRef = (node: HTMLElement | null) => void;

/** The surface's measure and the geometry of its items. */
export type MenuSize = 'sm' | 'md' | 'lg';

/**
 * How wide the surface is. `content` is its own measure, between the family's
 * floor and cap; `anchor` is the trigger's width, capped by the room the
 * positioner reports — an account switcher at the foot of a sidebar, as wide
 * as the row that opens it. A submenu is always `content`.
 */
export type MenuWidth = 'content' | 'anchor';

/** Where the surface hangs. The two logical values mirror; the rest do not. */
export type MenuSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

export type MenuAlign = 'start' | 'center' | 'end';

/**
 * When the layer exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and hides it. The same axis `tooltip`, `popover` and
 * `collapsible` declare.
 */
export type MenuMount = 'active' | 'lazy' | 'eager';

export type MenuStrategy = 'absolute' | 'fixed';

/** The five semantic tones. A command that destroys something takes `danger`. */
export type MenuTone = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Why the surface opened or closed. `select` is what tells a consumer that the
 * menu closed because an item ran, rather than because the reader dismissed it.
 */
export type MenuOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'dismiss' | 'programmatic'
>;

export interface MenuChangeRequest extends ChangeRequest<boolean> {
  readonly reason: MenuOpenReason;
}

/** Why a checkbox item or a radio group moved. The device, and nothing else. */
export type MenuValueReason = Extract<ChangeRequest<boolean>['reason'], 'pointer' | 'keyboard'>;

export interface MenuCheckedChangeRequest extends ChangeRequest<boolean> {
  readonly reason: MenuValueReason;
}

export interface MenuValueChangeRequest extends ChangeRequest<string> {
  readonly reason: MenuValueReason;
}

/** Where focus goes when a surface opens. */
export type MenuEntry = 'first' | 'last' | 'trigger';

/**
 * An element, a ref to one, or a selector inside the surface — the shape
 * `popover` declares for the same two escape hatches.
 */
export type MenuFocusTarget = Element | { current: Element | null } | string;

/** The imperative actions a consumer cannot express declaratively. */
export interface MenuHandle {
  /** Opens the surface, carrying `programmatic`. */
  open: () => void;
  /** Closes it, carrying `programmatic`. */
  close: () => void;
  /** Moves focus onto an item, as opening does. */
  focus: (index?: number) => void;
}

/** Every decision an application takes once rather than per menu. */
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
  strategy: MenuStrategy;
  submenuCloseDelay: number;
  submenuOpenDelay: number;
  typeahead: boolean;
  typeaheadTimeout: number;
  width: MenuWidth;
}

export interface MenuDefaultsProviderProps extends Partial<MenuDefaults> {
  children?: ReactNode;
  /**
   * The element every layer under this provider is rendered into. Set once for
   * an application, as `setPortalContainer` holds it for the document.
   */
  container?: Element | null;
}

export interface MenuProps extends Partial<MenuDefaults> {
  children?: ReactNode;
  /**
   * The name this menu is known by on a bar. A `Menubar` holds the identity of
   * the open menu rather than a boolean on each, so a consumer controlling the
   * bar names its menus; on its own, a menu needs no name and generates one.
   */
  value?: string;
  /** The consumer's value. Present at all puts the menu in controlled mode. */
  open?: boolean | undefined;
  /** The value an uncontrolled menu starts from, read once. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, request: MenuChangeRequest) => void;
  /**
   * What the surface is positioned against instead of the trigger: a row the
   * menu hangs from, or a rectangle at the pointer — `context-menu` passes the
   * point the reader pressed. Positioning only: the trigger stays the portal
   * origin, the branch of the layer and the element focus returns to.
   */
  anchor?: PositionerAnchor | null | undefined;
  /**
   * Where focus lands when the surface closes, for a trigger that is gone by
   * then — the row-actions menu whose Delete removed its own row — or one that
   * never held focus, which is a context menu's target. Defaults to the trigger.
   */
  finalFocus?: MenuFocusTarget | undefined;
  ref?: Ref<MenuHandle>;
}

/**
 * What `render` receives for the control that opens the surface: the native
 * element's own props, extended with the wiring and the state the family
 * writes. `ref` is part of it because the trigger is the anchor the layer is
 * measured against, so the family has to reach the element however the consumer
 * rendered it.
 */
export interface MenuTriggerRootProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The trigger's label, always handed on: a rendered `Button` requires it. */
  children: ReactNode;
  ref?: PartRef | undefined;
  'data-disabled'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part'?: string | undefined;
}

export interface MenuTriggerProps extends ComponentPropsWithRef<'button'> {
  /** The mark in the first column, when the trigger is a submenu's item. */
  icon?: ReactNode;
  /** The value the submenu is set to, before the chevron, when the trigger is an item. */
  meta?: ReactNode;
  /**
   * Renders the consumer's own control instead of the family's `button`. The
   * wiring, the state attribute and the handlers come with it.
   */
  render?: (props: MenuTriggerRootProps) => ReactNode;
}

/** What `render` receives for the layer the positioner writes on. */
export interface MenuContentRootProps extends HTMLAttributes<HTMLElement> {
  ref?: PartRef | undefined;
  inert?: boolean | undefined;
  'data-align': MenuAlign;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': MenuSize;
  'data-ui': string;
  'data-width': MenuWidth;
}

export interface MenuContentProps extends ComponentPropsWithRef<'div'> {
  /**
   * The surface is waiting for its items. It keeps its measure, says so with
   * `aria-busy`, and shows whatever the consumer put in `MenuEmpty` — which is
   * what a reader sees instead of a box that flashes empty and then fills.
   */
  loading?: boolean;
  render?: (props: MenuContentRootProps) => ReactNode;
}

/** What `render` receives for one item. */
export interface MenuItemRootProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  ref?: PartRef | undefined;
  'data-checked'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-part': string;
  'data-text-value'?: string | undefined;
  'data-tone'?: MenuTone | undefined;
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  tabIndex: number;
  type?: 'button' | 'reset' | 'submit' | undefined;
}

export interface MenuItemProps extends Omit<ComponentPropsWithRef<'button'>, 'onSelect' | 'role'> {
  /** A disabled item stays focusable and runs nothing, as the pattern asks. */
  disabled?: boolean;
  /** The mark in the item's first column. */
  icon?: ReactNode;
  /** The second line, under the label. */
  description?: ReactNode;
  /**
   * What the item holds or counts — a number, a status, the value a submenu
   * is set to — in a column of its own before the shortcut. It reads as part
   * of the item's name; typeahead matches the label alone.
   */
  meta?: ReactNode;
  /**
   * A shortcut in this library's own notation — `Mod+K`. It is printed with the
   * platform's own legends and announced with `aria-keyshortcuts`; the family
   * does not listen for it.
   */
  shortcut?: string;
  /** What typeahead matches on, when the visible label is not the word. */
  textValue?: string;
  tone?: MenuTone;
  /** Whether running this item closes the menu. Defaults to the menu's own. */
  closeOnSelect?: boolean;
  onSelect?: (event: MenuSelectEvent) => void;
  render?: (props: MenuItemRootProps) => ReactNode;
}

/**
 * What an item reports when it runs. `preventDefault()` keeps the menu open,
 * which is the one thing `closeOnSelect` cannot express per interaction.
 */
export interface MenuSelectEvent {
  readonly reason: MenuValueReason;
  readonly source: Event | undefined;
  readonly defaultPrevented: boolean;
  preventDefault: () => void;
}

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'onSelect'> {
  checked?: boolean | undefined;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean, request: MenuCheckedChangeRequest) => void;
  onSelect?: (event: MenuSelectEvent) => void;
}

export interface MenuRadioGroupProps extends ComponentPropsWithRef<'div'> {
  value?: string | undefined;
  defaultValue?: string;
  onValueChange?: (value: string, request: MenuValueChangeRequest) => void;
}

export interface MenuRadioItemProps extends Omit<MenuItemProps, 'onSelect'> {
  value: string;
  onSelect?: (event: MenuSelectEvent) => void;
}

export interface MenuGroupProps extends ComponentPropsWithRef<'div'> {
  /** Names the group. A label outside a group is a heading nothing owns. */
  label?: ReactNode;
}

export type MenuGroupLabelProps = ComponentPropsWithRef<'div'>;
export type MenuSeparatorProps = ComponentPropsWithRef<'hr'>;
export type MenuEmptyProps = ComponentPropsWithRef<'div'>;
export type MenuItemIconProps = ComponentPropsWithRef<'span'>;
export type MenuItemLabelProps = ComponentPropsWithRef<'span'>;
export type MenuItemDescriptionProps = ComponentPropsWithRef<'span'>;
export type MenuItemMetaProps = ComponentPropsWithRef<'span'>;
export type MenuHeaderProps = ComponentPropsWithRef<'div'>;

export interface MenuItemShortcutProps extends ComponentPropsWithRef<'span'> {
  /** The shortcut in this library's notation. Printed for the platform. */
  keys?: string;
}

/** What the menu around a part says. */
export interface MenuContextValue {
  align: MenuAlign;
  alignOffset: number;
  /** What the layer is measured against when it is not the trigger. */
  anchor: PositionerAnchor | null;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  contentId: string;
  /** The name this menu answers to on a bar: its `value`, or a generated one. */
  identity: string;
  /** The painted surface, once it exists. The grace area is measured off it. */
  contentNode: HTMLElement | null;
  disabled: boolean;
  flip: boolean;
  hideWhenDetached: boolean;
  loop: boolean;
  mount: MenuMount;
  open: boolean;
  openOnHover: boolean;
  portal: boolean;
  seen: boolean;
  setContentNode: (node: HTMLElement | null) => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  shift: boolean;
  side: MenuSide;
  sideOffset: number;
  size: MenuSize;
  strategy: MenuStrategy;
  submenuCloseDelay: number;
  submenuOpenDelay: number;
  toggle: (open: boolean, reason: MenuOpenReason, source?: unknown) => void;
  triggerId: string;
  triggerNode: HTMLElement | null;
  typeahead: boolean;
  typeaheadTimeout: number;
  width: MenuWidth;
  /**
   * Where focus lands when the surface opens. `trigger` is the pattern's
   * recommended answer for a menu opened by arrowing along a bar: the menu
   * appears and focus stays on the trigger, so the reader can keep moving.
   */
  entry: RefObject<MenuEntry>;
  /** The surface this menu is a submenu of, when it is one. */
  parent: MenuSurfaceValue | null;
  /** The bar in scope, which a submenu of a bar's menu can still see. */
  menubar: MenubarSurfaceValue | null;
  /** Whether this menu is one of the bar's own, rather than nested in one. */
  onBar: boolean;
}

/** What a surface offers the items inside it, and the menus nested in it. */
export interface MenuSurfaceValue {
  /** Closes this surface and every surface above it. */
  closeAll: (reason: MenuOpenReason, source?: unknown) => void;
  /** Closes this one alone, returning focus to the item that opened it. */
  close: (reason: MenuOpenReason, source?: unknown) => void;
  /** Moves focus onto an item of this surface. */
  focusItem: (index: number) => void;
  node: HTMLElement | null;
  /** The control that opened the outermost surface of this stack. */
  rootTrigger: HTMLElement | null;
  /** The item of this surface that opened the submenu now showing. */
  openItem: HTMLElement | null;
  setOpenItem: (node: HTMLElement | null) => void;
  depth: number;
  /** A header names itself here, and the surface is described by it. */
  setHeaderId: (id: string | null) => void;
}

/**
 * What a bar offers the menus on it. Declared here rather than imported from
 * the menubar, so the menu family depends on nothing above it.
 */
export interface MenubarSurfaceValue {
  /** The identifier of the menu now open, or `undefined`. */
  value: string | undefined;
  /** Where focus goes when the bar opens one of its menus. */
  entry: RefObject<MenuEntry>;
  open: (value: string, reason: MenuOpenReason, source?: unknown) => void;
  close: (reason: MenuOpenReason, source?: unknown) => void;
  /** Moves to the neighbouring trigger, opening its menu. */
  step: (direction: 1 | -1, options?: { open?: boolean; focus?: boolean }) => void;
  register: (value: string, node: HTMLElement | null) => void;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  size: MenuSize;
}
