import type { DefinedProps } from '@slotted/core/selector-key';
import type { NavigationMenuMessages, PartialMessages } from '@slotted/core/i18n';
import type {
  NavigationMenuMotion,
  NavigationMenuOrientation,
} from '@slotted/core/navigation-menu';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  AnchorHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from 'react';

export type { NavigationMenuOrientation };

/** The control step of a trigger and of a top-level link. */
export type NavigationMenuSize = 'sm' | 'md' | 'lg';

/** How many columns of links a panel lays out. */
export type NavigationMenuColumns = 1 | 2 | 3;

/** Why the open section moved. */
export type NavigationMenuValueReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'blur' | 'select' | 'programmatic'
>;

export type NavigationMenuValueRequest = ChangeRequest<string | null>;

/** What an application sets once for every navigation menu under it. */
export interface NavigationMenuDefaults {
  /** Draws the mark on the surface's edge that points at the open trigger. */
  arrow: boolean;
  /** Milliseconds a pointer leaving the root waits before the section closes. */
  closeDelay: number;
  /** A link inside a panel closes the panel when it is followed. */
  closeOnSelect: boolean;
  /** Milliseconds a pointer rests on a trigger before its section opens. */
  openDelay: number;
  size: NavigationMenuSize;
}

export interface NavigationMenuDefaultsProviderProps extends Partial<NavigationMenuDefaults> {
  children?: ReactNode;
}

/** The imperative surface: what a consumer cannot say declaratively. */
export interface NavigationMenuHandle {
  /** Opens one section, with the reason `programmatic`. */
  open: (value: string) => void;
  /** Closes the open section, with the reason `programmatic`. */
  close: () => void;
  /** Focuses one section's trigger, or the first top-level control. */
  focus: (value?: string) => void;
  /** The root element, once it is in the document. */
  readonly root: HTMLElement | null;
}

export interface NavigationMenuRootProps extends HTMLAttributes<HTMLElement> {
  'data-nested'?: '' | undefined;
  'data-orientation': NavigationMenuOrientation;
  'data-part': string;
  'data-size': NavigationMenuSize;
  'data-ui': 'navigation-menu';
  ref: (node: HTMLElement | null) => void;
}

export interface NavigationMenuProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'defaultValue' | 'ref'
> {
  /** Draws the mark on the surface's edge that points at the open trigger. */
  arrow?: boolean | undefined;
  /** Milliseconds a pointer leaving the root waits before the section closes. */
  closeDelay?: number | undefined;
  /** A link inside a panel closes the panel when it is followed. A link's own prop wins. */
  closeOnSelect?: boolean | undefined;
  /** The section open on the first render, when the consumer does not own `value`. */
  defaultValue?: string | null | undefined;
  /** The words the family writes, over the catalog of the language in force. */
  messages?: PartialMessages<NavigationMenuMessages> | undefined;
  /** Called before the open section moves; `request.cancel()` keeps it. */
  onValueChange?: ((value: string | null, request: NavigationMenuValueRequest) => void) | undefined;
  /** Milliseconds a pointer rests on a trigger before its section opens. */
  openDelay?: number | undefined;
  /** A row under which panels open, or a column beside which they open. Nested roots default to `vertical`. */
  orientation?: NavigationMenuOrientation | undefined;
  ref?:
    | RefObject<NavigationMenuHandle | null>
    | ((handle: NavigationMenuHandle | null) => void)
    | undefined;
  /** Renders the root into another element. */
  render?: ((props: NavigationMenuRootProps) => ReactNode) | undefined;
  size?: NavigationMenuSize | undefined;
  /** Present means the consumer owns the open section; `null` is none. */
  value?: string | null | undefined;
}

export interface NavigationMenuPartRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface NavigationMenuListProps extends ComponentPropsWithRef<'ul'> {
  render?: ((props: NavigationMenuPartRootProps) => ReactNode) | undefined;
}

export interface NavigationMenuItemRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-value': string;
}

export interface NavigationMenuItemProps extends ComponentPropsWithRef<'li'> {
  /** The section or the top-level link refuses interaction. */
  disabled?: boolean | undefined;
  render?: ((props: NavigationMenuItemRootProps) => ReactNode) | undefined;
  /** The item's identity: what `value` names it by. */
  value: string;
}

export type NavigationMenuTriggerProps = ComponentPropsWithRef<'button'>;

export interface NavigationMenuContentRootProps extends HTMLAttributes<HTMLElement> {
  'data-columns': string;
  'data-motion'?: NavigationMenuMotion | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  hidden: boolean;
  id: string;
}

export interface NavigationMenuContentProps extends ComponentPropsWithRef<'div'> {
  /** How many columns of links or groups the panel lays out. */
  columns?: NavigationMenuColumns | undefined;
  render?: ((props: NavigationMenuContentRootProps) => ReactNode) | undefined;
}

/**
 * A link's attributes, typed for any element: `render` draws a router's link
 * as readily as an `a`.
 */
export interface NavigationMenuLinkRootProps extends Omit<
  AnchorHTMLAttributes<HTMLElement>,
  'aria-current' | 'aria-disabled'
> {
  'aria-current'?: 'page' | undefined;
  'aria-disabled'?: 'true' | undefined;
  'data-current'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-part': string;
  ref?: (node: HTMLElement | null) => void;
}

export interface NavigationMenuLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'aria-current' | 'aria-disabled'
> {
  /** Following this link closes the panel. Wins over the root's `closeOnSelect`. */
  closeOnSelect?: boolean | undefined;
  /** This link is the page the reader is on — what a router's own link writes. */
  current?: boolean | undefined;
  /** The destination is unavailable: the click is refused and the `href` kept. */
  disabled?: boolean | undefined;
  render?: ((props: DefinedProps<NavigationMenuLinkRootProps>) => ReactNode) | undefined;
}

export interface NavigationMenuLinksProps extends ComponentPropsWithRef<'ul'> {
  render?: ((props: NavigationMenuPartRootProps) => ReactNode) | undefined;
}

export interface NavigationMenuGroupRootProps extends HTMLAttributes<HTMLElement> {
  'aria-labelledby': string;
  'data-part': string;
  role: 'group';
}

export interface NavigationMenuGroupProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: NavigationMenuGroupRootProps) => ReactNode) | undefined;
}

export interface NavigationMenuPartProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: NavigationMenuPartRootProps) => ReactNode) | undefined;
}

export type NavigationMenuSpanPartProps = ComponentPropsWithRef<'span'>;

export interface NavigationMenuContextValue {
  arrow: boolean;
  closeOnSelect: boolean;
  /** The crossing between the section that left and the one that arrived. */
  motion: {
    from: string | null;
    to: string | null;
    enter: NavigationMenuMotion | null;
    exit: NavigationMenuMotion | null;
  };
  nested: boolean;
  orientation: NavigationMenuOrientation;
  /** The pointer entered a trigger. */
  hover: (value: string, pointerType: string) => void;
  /** A section says where its panel is, wherever another family moves it. */
  register: (value: string, contentId: string) => () => void;
  /** Asks the outer root to measure its open panel again. */
  remeasure: () => void;
  request: (next: string | null, reason: NavigationMenuValueReason, source?: unknown) => void;
  root: HTMLElement | null;
  /** A panel link was followed: every level closes, with the reason `select`. */
  select: (source?: unknown) => void;
  value: string | null;
}

export interface NavigationMenuItemContextValue {
  contentId: string;
  disabled: boolean;
  /** Whether a link inside this item's panel is the current page. */
  hasCurrent: boolean;
  open: boolean;
  reportCurrent: (key: string, current: boolean) => void;
  setTrigger: (node: HTMLElement | null) => void;
  trigger: HTMLElement | null;
  value: string;
}
