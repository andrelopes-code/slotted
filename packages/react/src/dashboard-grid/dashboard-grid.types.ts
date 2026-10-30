import type {
  DashboardColumnsInput,
  DashboardLayout,
  DashboardLayoutChange,
} from '@slotted/core/dashboard-grid';
import type { DashboardGridMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  AnchorHTMLAttributes,
  ComponentPropsWithRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';

import type { CardFill, CardSize } from '../card';

export type {
  DashboardColumnsInput,
  DashboardLayout,
  DashboardLayoutChange,
  DashboardLayoutItem,
} from '@slotted/core/dashboard-grid';

/** `auto` follows the heading outline, as `Section` does, and is never above 2. */
export type DashboardHeadingLevel = 'auto' | 2 | 3 | 4 | 5 | 6;

export type DashboardLayoutReason = 'pointer' | 'keyboard' | 'remove' | 'dismiss' | 'programmatic';

export type DashboardEditingReason = 'pointer' | 'keyboard' | 'submit' | 'dismiss' | 'programmatic';

/** The request for a new layout: the layout, why, and what the gesture was. */
export type DashboardLayoutRequest = ChangeRequest<DashboardLayout> & {
  readonly change: DashboardLayoutChange;
};

export type DashboardEditingRequest = ChangeRequest<boolean>;

export interface DashboardGridDefaults {
  columns: DashboardColumnsInput;
  editBar: boolean;
  headingLevel: DashboardHeadingLevel;
}

export interface DashboardGridDefaultsProviderProps extends Partial<DashboardGridDefaults> {
  children?: ReactNode;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DashboardGridHandle {
  readonly element: HTMLDivElement | null;
  /** Focuses a widget's handle while editing, or the widget's first control. */
  focusWidget: (key: string) => void;
  /** Leaves editing with the reason `submit`, as Done does. */
  commitEditing: () => void;
  /** Asks for the layout editing began from, then leaves, as Cancel does. */
  cancelEditing: () => void;
}

export type DashboardGridRootProps = ComponentPropsWithRef<'div'> & {
  'data-ui': 'dashboard-grid';
  'data-part': 'root';
  'data-editing'?: '' | undefined;
};

export interface DashboardGridProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'defaultValue' | 'onChange' | 'ref'
> {
  /** The widgets: `DashboardWidget` elements, each with its own `value`. */
  children?: ReactNode;
  /** The consumer's layout. Present at all puts the layout in controlled mode. */
  layout?: DashboardLayout | undefined;
  /** The layout an uncontrolled grid starts from, read once. Default: every widget at its defaults. */
  defaultLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout, request: DashboardLayoutRequest) => void;
  /** The consumer's edit mode. Present at all puts the mode in controlled mode. */
  editing?: boolean | undefined;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean, request: DashboardEditingRequest) => void;
  /** Columns of the expanded class, or one count per class. Default 12, 6, 1. */
  columns?: DashboardColumnsInput | undefined;
  /** Whether the family draws its edit bar while editing. Default true. */
  editBar?: boolean | undefined;
  /**
   * The grid's own width, in pixels, from which the expanded class applies. Default 1024. A grid
   * beside a navigation rail is narrower than its page, so a lower threshold keeps its layout.
   */
  expandedFrom?: number | undefined;
  /** The level of every widget's title. Default `auto`: one rank under the heading around the grid. */
  headingLevel?: DashboardHeadingLevel | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<DashboardGridMessages> | undefined;
  /** Replaces the root `div`. */
  render?: ((props: DashboardGridRootProps) => ReactElement) | undefined;
  ref?: Ref<DashboardGridHandle>;
}

export type DashboardWidgetRootProps = ComponentPropsWithRef<'li'> & {
  'data-part': 'widget';
  'data-key': string;
  'data-rows'?: 'auto' | undefined;
  'data-status': DashboardWidgetStatus;
  'data-loading'?: '' | undefined;
  'data-movable'?: '' | undefined;
  'data-resizable'?: '' | undefined;
  'data-dragging'?: '' | undefined;
  'data-resizing'?: '' | undefined;
};

export type DashboardWidgetStatus = 'ready' | 'empty' | 'error';

/** What the detail link carries: its `href`, its name, its part and the button's look. */
export type DashboardDetailProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export interface DashboardWidgetProps extends Omit<
  ComponentPropsWithRef<'li'>,
  'children' | 'title' | 'value'
> {
  /** The widget's key in the layout. */
  value: string;
  /** The widget's name: its heading, its accessible name and its entry in Add widget. */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  headingLevel?: DashboardHeadingLevel | undefined;
  /** Columns of the expanded class a widget with no layout entry takes. Default 4. */
  defaultColumns?: number;
  /** Default 2. */
  defaultRows?: number;
  /**
   * `auto` draws the widget as tall as its content, to a twelfth of a row's step, and the widgets
   * below rise or make room. At least one sub-row, or `minRows` when stated; at most `maxRows`.
   * The rows a move or a resize reads are the content's, rounded up to whole rows.
   */
  rows?: 'auto' | undefined;
  minColumns?: number;
  maxColumns?: number;
  minRows?: number;
  maxRows?: number;
  /** Default true. A widget that cannot move keeps its place. */
  movable?: boolean;
  /** Default true. */
  resizable?: boolean;
  /** Default true. */
  removable?: boolean;
  /** The first answer has not arrived: the body shows a skeleton. */
  loading?: boolean;
  /** A refresh of data already shown: the content stays and the region is busy. */
  busy?: boolean;
  status?: DashboardWidgetStatus;
  /** The skeleton of the body's own anatomy. Default: one block filling the body. */
  skeleton?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  /** The action that creates the first one, under the empty message. */
  emptyAction?: ReactNode;
  errorTitle?: ReactNode;
  errorDescription?: ReactNode;
  /** Draws Try again under the error message. */
  onRetry?: (event: MouseEvent) => void;
  /** The widget's own page. */
  detailHref?: string;
  /**
   * Renders the detail link — a router's link — from the props the family gives it, `href`
   * included; spread them all on the element returned.
   */
  renderDetail?: ((props: DashboardDetailProps) => ReactElement) | undefined;
  /** The widget's own view, when it is not a page. */
  onDetail?: (event: MouseEvent) => void;
  /** The consumer's controls in the header's corner, before the detail action. */
  actions?: ReactNode;
  footer?: ReactNode;
  fill?: CardFill | undefined;
  size?: CardSize | undefined;
  /** Replaces the `li`. */
  render?: ((props: DashboardWidgetRootProps) => ReactElement) | undefined;
}

export interface UsePersistedDashboardLayoutOptions {
  /** The key the layout is stored under. */
  key: string;
  /** Default `localStorage`, when the platform has it. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** What the grid shows when nothing is stored. Default: every widget at its defaults. */
  defaultLayout?: DashboardLayout;
}

export interface PersistedDashboardLayout {
  readonly layout: DashboardLayout;
  /** The layout given to the hook, which the grid's Reset asks for once spread on it. */
  readonly defaultLayout: DashboardLayout;
  /** Hand to `onLayoutChange`: it stores what it is given and renders it. */
  readonly onLayoutChange: (layout: DashboardLayout) => void;
  /** Forgets what is stored and returns to the default. */
  readonly clear: () => void;
}
