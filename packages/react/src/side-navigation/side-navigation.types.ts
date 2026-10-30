import type { DefinedProps } from '@slotted/core/selector-key';
import type { PartialMessages, SideNavigationMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from 'react';

/** The row height step. `md` reads the geometry `app-shell` publishes. */
export type SideNavigationSize = 'sm' | 'md' | 'lg';

/**
 * How the column reads the room it has. `auto` is compact below `compactAt`
 * pixels of its own width and labelled above; the other two force one.
 */
export type SideNavigationMode = 'auto' | 'expanded' | 'compact';

/**
 * Where a label that does not fit is cut. `end` is the stylesheet's ellipsis;
 * `middle` keeps the start and the tail, measured by the binding; `none` wraps.
 */
export type SideNavigationTruncate = 'end' | 'middle' | 'none';

/** Why the set of open groups moved. */
export type SideNavigationExpandedReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'select' | 'escape' | 'programmatic'
>;

/** Why the flyout opened or closed. */
export type SideNavigationFlyoutReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'select' | 'escape' | 'outsidePress' | 'blur' | 'resize' | 'programmatic'
>;

/** Why the current destination moved. */
export type SideNavigationValueReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

export type SideNavigationExpandedRequest = ChangeRequest<readonly string[]>;
export type SideNavigationFlyoutRequest = ChangeRequest<string | null>;
export type SideNavigationValueRequest = ChangeRequest<string | null>;

/** What an application sets once for every column under it. */
export interface SideNavigationDefaults {
  autoExpand: boolean;
  compactAt: number;
  guides: boolean;
  landmark: boolean;
  mode: SideNavigationMode;
  multiple: boolean;
  size: SideNavigationSize;
  truncate: SideNavigationTruncate;
}

export interface SideNavigationDefaultsProviderProps extends Partial<SideNavigationDefaults> {
  children?: ReactNode | undefined;
}

/** What the root hands every part under it. */
export interface SideNavigationContextValue {
  autoExpand: boolean;
  /** Whether the column is a rail right now: the mode, or the width under `compactAt`. */
  compact: boolean;
  expanded: readonly string[];
  flyout: string | null;
  guides: boolean;
  mode: SideNavigationMode;
  multiple: boolean;
  size: SideNavigationSize;
  truncate: SideNavigationTruncate;
  value: string | null;
  /** A counter that moves when the root was resized or the fonts arrived, so a label measures again. */
  measureTick: number;
  isExpanded: (value: string) => boolean;
  /** Asks the set of open groups to include or drop one value. */
  toggleExpanded: (
    value: string,
    next: boolean,
    reason: SideNavigationExpandedReason,
    source?: unknown,
  ) => void;
  /** Asks the flyout to show one group, or none. */
  setFlyout: (value: string | null, reason: SideNavigationFlyoutReason, source?: unknown) => void;
  /** Asks the current destination to move. */
  select: (value: string, reason: SideNavigationValueReason, source?: unknown) => void;
  /** An item says where it stands, so the root can open the ancestors of the current destination. */
  registerItem: (value: string, parent: string | null) => () => void;
  /** The layer the flyout is drawn in, so the keyboard can walk into it. */
  flyoutNode: HTMLElement | null;
  setFlyoutNode: (node: HTMLElement | null) => void;
}

/** What an item hands its own row, group and parts. */
export interface SideNavigationItemContextValue {
  value: string;
  /** Whether the group is open inline. */
  expanded: boolean;
  /** Whether the group is shown in the flyout. */
  flyoutOpen: boolean;
  /** Whether the current destination is this item's own link. */
  current: boolean;
  /** Whether the current destination is somewhere under this item. */
  holdsCurrent: boolean;
  disabled: boolean;
  hasLink: boolean;
  hasGroup: boolean;
  /** Whether the label was measured as clipped, which is what opens the tooltip. */
  clipped: boolean;
  /** The label's whole text, for the tooltip and for `aria-label` under a middle cut. */
  labelText: string;
  descriptionText: string;
  ids: { groupId: string; labelId: string; triggerId: string };
  triggerNode: HTMLElement | null;
  setHasLink: (present: boolean) => void;
  setHasGroup: (present: boolean) => void;
  setClipped: (clipped: boolean) => void;
  setLabelText: (text: string) => void;
  setDescriptionText: (text: string) => void;
  setTriggerNode: (node: HTMLElement | null) => void;
  /** A descendant says whether it holds the current destination. */
  reportCurrent: (value: string, current: boolean) => void;
}

export interface SideNavigationRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label'?: string | undefined;
  'data-compact'?: '' | undefined;
  'data-guides'?: '' | undefined;
  'data-mode': SideNavigationMode;
  'data-part': string;
  'data-size': SideNavigationSize;
  'data-truncate': SideNavigationTruncate;
  'data-ui': string;
}

export interface SideNavigationProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onChange' | 'defaultValue' | 'ref'
> {
  /** Whether the ancestors of the current destination open by themselves. */
  autoExpand?: boolean | undefined;
  /** The width, in CSS pixels, under which `mode="auto"` is compact. */
  compactAt?: number | undefined;
  /** The set of open groups an uncontrolled column starts with, read once. */
  defaultExpanded?: readonly string[] | undefined;
  /** The group an uncontrolled column starts with in the flyout, read once. */
  defaultFlyout?: string | null | undefined;
  /** The current destination an uncontrolled column starts with, read once. */
  defaultValue?: string | null | undefined;
  /** Present means the consumer owns the set of open groups. */
  expanded?: readonly string[] | undefined;
  /** Present means the consumer owns the flyout. */
  flyout?: string | null | undefined;
  /** Whether a guide runs down each open group. */
  guides?: boolean | undefined;
  /**
   * Whether the root is a `nav` landmark. Unstated, it is one on its own and
   * a `div` inside `app-shell`'s nav region, which is already the landmark.
   */
  landmark?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force: the landmark's name
   * (`navigation`). A native `aria-label` still wins.
   */
  messages?: PartialMessages<SideNavigationMessages> | undefined;
  mode?: SideNavigationMode | undefined;
  /** Whether more than one group may be open at once. */
  multiple?: boolean | undefined;
  /** Called before the set of open groups moves, with the request that carries the reason. */
  onExpandedChange?:
    ((expanded: readonly string[], request: SideNavigationExpandedRequest) => void) | undefined;
  /** Called before the flyout moves. */
  onFlyoutChange?:
    ((flyout: string | null, request: SideNavigationFlyoutRequest) => void) | undefined;
  /** Called before the current destination moves. */
  onValueChange?: ((value: string | null, request: SideNavigationValueRequest) => void) | undefined;
  /** The imperative surface, as `app-shell` hands its own: the root is on it. */
  ref?:
    | RefObject<SideNavigationHandle | null>
    | ((handle: SideNavigationHandle | null) => void)
    | undefined;
  /** Renders the root into another element. */
  render?: ((props: SideNavigationRootProps) => ReactNode) | undefined;
  size?: SideNavigationSize | undefined;
  truncate?: SideNavigationTruncate | undefined;
  /** Present means the consumer owns the current destination. */
  value?: string | null | undefined;
}

/** The imperative surface: what a consumer cannot say declaratively. */
export interface SideNavigationHandle {
  /** Focuses the first link or trigger in the column. */
  focus: () => void;
  /** Opens one group, with the reason `programmatic`. */
  expand: (value: string) => void;
  /** Closes one group, with the reason `programmatic`. */
  collapse: (value: string) => void;
  /** The root element, once it is in the document. */
  readonly root: HTMLElement | null;
}

export interface SideNavigationPartProps extends ComponentPropsWithRef<'div'> {
  render?:
    ((props: HTMLAttributes<HTMLElement> & { 'data-part': string }) => ReactNode) | undefined;
}

export interface SideNavigationSpanPartProps extends ComponentPropsWithRef<'span'> {
  render?:
    ((props: HTMLAttributes<HTMLElement> & { 'data-part': string }) => ReactNode) | undefined;
}

export interface SideNavigationListProps extends ComponentPropsWithRef<'ul'> {
  render?:
    ((props: HTMLAttributes<HTMLElement> & { 'data-part': string }) => ReactNode) | undefined;
}

export interface SideNavigationItemRootProps extends HTMLAttributes<HTMLElement> {
  'data-current'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-expanded'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-value': string;
}

export interface SideNavigationItemProps extends ComponentPropsWithRef<'li'> {
  /** The row and everything in it refuse interaction. */
  disabled?: boolean | undefined;
  render?: ((props: SideNavigationItemRootProps) => ReactNode) | undefined;
  /** The item's identity: what `value`, `expanded` and `flyout` name it by. */
  value: string;
}

/**
 * The row's attributes, typed for any element: `render` draws an `a` for a
 * router's link and a `button` for an application that routes in state, and
 * handlers typed for an anchor alone would refuse the second.
 */
export interface SideNavigationLinkRootProps extends Omit<
  AnchorHTMLAttributes<HTMLElement>,
  'aria-current' | 'aria-disabled'
> {
  'aria-current'?: 'page' | undefined;
  'aria-disabled'?: 'true' | undefined;
  'aria-label'?: string | undefined;
  'data-current'?: '' | undefined;
  'data-part': string;
  ref?: (node: HTMLElement | null) => void;
}

export interface SideNavigationLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'aria-current' | 'aria-disabled'
> {
  /**
   * Whether this is the current destination, stated on the row itself — what
   * a router's own link writes. It wins over the root's `value`.
   */
  current?: boolean | undefined;
  /** Renders the row into another element: a router's link, or a `button` for a command. */
  render?: ((props: DefinedProps<SideNavigationLinkRootProps>) => ReactNode) | undefined;
}

export interface SideNavigationTriggerRootProps extends ButtonHTMLAttributes<HTMLElement> {
  'aria-controls': string;
  'aria-expanded': boolean;
  'aria-labelledby'?: string | undefined;
  'data-part': string;
  id: string;
  ref?: (node: HTMLElement | null) => void;
  type: 'button';
}

export interface SideNavigationTriggerProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: SideNavigationTriggerRootProps) => ReactNode) | undefined;
}

export interface SideNavigationGroupRootProps extends HTMLAttributes<HTMLElement> {
  'aria-labelledby': string;
  'data-part': string;
  id: string;
}

export interface SideNavigationGroupProps extends ComponentPropsWithRef<'ul'> {
  render?: ((props: SideNavigationGroupRootProps) => ReactNode) | undefined;
}

export interface SideNavigationDividerProps extends ComponentPropsWithRef<'li'> {
  render?:
    ((props: HTMLAttributes<HTMLElement> & { 'data-part': string }) => ReactNode) | undefined;
}

export interface SideNavigationSkeletonProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  /** How wide the label's bar is drawn, as any CSS length. */
  labelSize?: number | string | undefined;
}
