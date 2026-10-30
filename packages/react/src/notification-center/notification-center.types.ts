import type { NotificationCenterMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { TimestampValue } from '@slotted/core/timeline';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The popover's step and the page's. */
export type NotificationCenterSize = 'sm' | 'md';

/** The rank of the header's heading; group labels take the rank below. */
export type NotificationCenterLevel = '2' | '3' | '4';

/** How more is loaded: never, on a button, or when the end scrolls into view. */
export type NotificationCenterGrowing = 'none' | 'button' | 'scroll';

/** Whether keys that arrive while the reader reads are held behind `fresh`. */
export type NotificationCenterArrivals = 'hold' | 'show';

/** How the item's time is written. */
export type NotificationCenterTimeFormat = 'relative' | 'absolute';

/** Which of the family's two item controls are drawn. */
export type NotificationCenterControls = 'both' | 'read' | 'dismiss' | 'none';

/** The item's tone: the family's visual and the wash an unread item stands on. */
export type NotificationCenterTone =
  'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** Why the view moved. */
export type NotificationCenterViewReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** The request a view change carries. */
export type NotificationCenterViewRequest = ChangeRequest<string>;

/** Why an item was pressed, marked or removed. */
export type NotificationCenterPressReason = 'pointer' | 'keyboard';

/** Why a read change was asked for: the two presses, or the handle. */
export type NotificationCenterReadReason = NotificationCenterPressReason | 'programmatic';

/** Why more was asked for: the two presses, or the end scrolling into view. */
export type NotificationCenterLoadReason = NotificationCenterPressReason | 'scroll';

/** A request the family makes that carries no value of its own: a reason, a source, a refusal. */
export interface NotificationCenterRequest<Reason extends string> {
  readonly reason: Reason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  /** Refuses the request. The family does nothing further with it. */
  cancel(): void;
}

/** What `onReadChange` asks: these keys become this. */
export interface NotificationCenterReadChange {
  keys: readonly string[];
  read: boolean;
}

/** One notification as the consumer's store holds it. */
export interface NotificationItem {
  /** Identifies the item across renders; what every request names. */
  key: string;
  /** The words that name it: a link when `href`, text otherwise. */
  title: ReactNode;
  /** The body, clamped at three lines by the stylesheet. */
  description?: ReactNode | undefined;
  /** When it happened: a plain date-time or an ISO instant. */
  time: TimestampValue;
  /** Whether the reader has seen it. The consumer's fact; the family asks to change it. */
  read: boolean;
  /** Where the title goes. */
  href?: string | undefined;
  /** The visual's glyph and the unread wash. Accent when unstated. */
  tone?: NotificationCenterTone | undefined;
  /** The consumer's avatar or icon. Absent with a tone, the family draws the tone's glyph. */
  visual?: ReactNode | undefined;
  /** The consumer's controls for this item, under its body. */
  actions?: ReactNode | undefined;
}

/** One entry of the views strip. */
export interface NotificationView {
  value: string;
  label: ReactNode;
  /** A count drawn as a chip after the label. */
  count?: number | undefined;
}

/** What an application sets once for every center under it. */
export interface NotificationCenterDefaults {
  arrivals: NotificationCenterArrivals;
  controls: NotificationCenterControls;
  growing: NotificationCenterGrowing;
  level: NotificationCenterLevel;
  size: NotificationCenterSize;
  timeFormat: NotificationCenterTimeFormat;
  timeZone?: string | undefined;
}

export interface NotificationCenterDefaultsProviderProps extends Partial<NotificationCenterDefaults> {
  children?: ReactNode | undefined;
}

/** What `renderItem` is told about the item it substitutes. */
export interface NotificationItemState {
  /** Its position in the feed, from one. */
  position: number;
  /** The tone the family resolved for it. */
  tone: NotificationCenterTone;
  /** The formatted time: the machine value and the words. */
  time: { dateTime: string; text: string; title: string | null };
  /** The ids the family wrote, for `aria-labelledby` and `aria-describedby`. */
  ids: { title: string; description: string };
}

/** What `render` receives for the root. */
export interface NotificationCenterRootProps extends HTMLAttributes<HTMLElement> {
  'data-arrivals': NotificationCenterArrivals;
  'data-controls': NotificationCenterControls;
  'data-growing': NotificationCenterGrowing;
  'data-level': NotificationCenterLevel;
  'data-loading'?: '' | undefined;
  'data-part': 'root';
  'data-size': NotificationCenterSize;
  'data-time-format': NotificationCenterTimeFormat;
  'data-ui': 'notification-center';
  'data-view': string;
  ref?: Ref<HTMLElement> | undefined;
}

/** What the `ref` reaches. */
export interface NotificationCenterHandle {
  /** The root element, once mounted. */
  readonly element: HTMLElement | null;
  /** Moves focus to the first article, or to `fresh` when arrivals are held. */
  focus(): void;
  /** Shows the held arrivals, as a press of `fresh` would with the reason `programmatic`. */
  reveal(): void;
  /** Asks to mark every unread shown item read, with the reason `programmatic`. */
  markAllRead(): void;
}

export interface NotificationCenterProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'children' | 'ref' | 'title'
> {
  /** The consumer's controls in the header, after mark-all: a preferences link, a menu. */
  actions?: ReactNode | undefined;
  /** Defaults to the provider, then to `hold`. */
  arrivals?: NotificationCenterArrivals | undefined;
  /** Defaults to the provider, then to `both`. */
  controls?: NotificationCenterControls | undefined;
  /**
   * How many items exist in all, for `aria-setsize`. Unstated, the loaded
   * number under `growing="none"` and `-1` while more may come.
   */
  count?: number | undefined;
  /** The view an uncontrolled center starts on, read once. */
  defaultView?: string | undefined;
  /** In place of the feed when it holds nothing: a `ResultState`. Unstated, the family's words. */
  empty?: ReactNode | undefined;
  /** The consumer's link from the popover to the page. */
  footer?: ReactNode | undefined;
  /** Groups the feed: the label an item is filed under, in the order the items give. */
  groupBy?: ((item: NotificationItem) => ReactNode) | undefined;
  /** Defaults to the provider, then to `none`. */
  growing?: NotificationCenterGrowing | undefined;
  /** The consumer's array. The family holds none of its facts. */
  items: readonly NotificationItem[];
  /** Defaults to the provider, then to `2`. */
  level?: NotificationCenterLevel | undefined;
  /** `aria-busy` on the feed; skeleton rows while nothing is loaded, the waiting row under growing otherwise. */
  loading?: boolean | undefined;
  /** For the time; defaults to the language in force (`SlottedProvider`). */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * heading, the controls, the views, the empty pages and the announcements.
   */
  messages?: PartialMessages<NotificationCenterMessages> | undefined;
  /** The instant a relative time is measured from. State it for a stable server render. */
  now?: number | undefined;
  /** Called before a page is asked for, with the request that carries the reason. */
  onLoadMore?:
    ((request: NotificationCenterRequest<NotificationCenterLoadReason>) => void) | undefined;
  /** Called before a title link navigates. Cancelling keeps the reader here. */
  onOpen?:
    | ((key: string, request: NotificationCenterRequest<NotificationCenterPressReason>) => void)
    | undefined;
  /** Called with the keys and the value the family asks for. The store answers by changing `items`. */
  onReadChange?:
    | ((
        change: NotificationCenterReadChange,
        request: NotificationCenterRequest<NotificationCenterReadReason>,
      ) => void)
    | undefined;
  /** Called before an item is removed. The family removes nothing. */
  onRemove?:
    | ((key: string, request: NotificationCenterRequest<NotificationCenterPressReason>) => void)
    | undefined;
  /** Called before held arrivals are shown, with their count. */
  onReveal?:
    | ((count: number, request: NotificationCenterRequest<NotificationCenterReadReason>) => void)
    | undefined;
  /** A fact for the bell: the unread count among the items, whenever it changes. */
  onUnreadChange?: ((count: number) => void) | undefined;
  /** Called before the view moves, with the request that carries the reason. */
  onViewChange?: ((view: string, request: NotificationCenterViewRequest) => void) | undefined;
  ref?: Ref<NotificationCenterHandle> | undefined;
  /** Renders the root into another element. */
  render?: ((props: NotificationCenterRootProps) => ReactNode) | undefined;
  /** Substitutes an item's content; the article, its wiring and its controls stay the family's. */
  renderItem?: ((item: NotificationItem, state: NotificationItemState) => ReactNode) | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: NotificationCenterSize | undefined;
  /** Defaults to the provider, then to `relative`. */
  timeFormat?: NotificationCenterTimeFormat | undefined;
  /** For the time; defaults to the provider, then to the runtime's. */
  timeZone?: string | undefined;
  /** Present means controlled, for the life of the component. */
  view?: string | undefined;
  /** The strip's entries. Unstated, the built-in `all` and `unread`; one entry draws no strip. */
  views?: readonly NotificationView[] | undefined;
}
