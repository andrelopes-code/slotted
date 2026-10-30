import type { PartialMessages, ScrollAreaMessages } from '@slotted/core/i18n';
import type { LogicalEdge, ScrollEdgesState, ScrollPosition } from '@slotted/core/overflow';
import type { ComponentPropsWithRef, ReactNode, RefObject, UIEvent } from 'react';

/** Which axes scroll. Logical, so a vertical writing mode needs no second vocabulary. */
export type ScrollAreaAxis = 'block' | 'inline' | 'both';

/**
 * What the scrollbar does. `auto` is `overflow: auto`; `always` is
 * `overflow: scroll`; `hover` paints the bar transparent until a pointer or the
 * keyboard is inside; `none` removes the bar and leaves the scrolling.
 *
 * `scroll` — visible only while scrolling, which Radix and Mantine both ship —
 * is folded into `hover`, because it is what a platform overlay scrollbar
 * already does on its own.
 */
export type ScrollAreaScrollbars = 'auto' | 'always' | 'hover' | 'none';

/** `scrollbar-gutter`, and `stable` is the default because content that shifts is the defect. */
export type ScrollAreaGutter = 'auto' | 'stable' | 'both-edges';

/**
 * Where the veil is drawn. `both` dims what the reader has passed as well as
 * what is ahead; `end` only what is ahead; `none` leaves the scrollbar to say
 * there is more.
 */
export type ScrollAreaFade = 'both' | 'end' | 'none';

/** `overscroll-behavior`, and `contain` is the default. */
export type ScrollAreaOverscroll = 'contain' | 'auto' | 'none';

export type { LogicalEdge, ScrollEdgesState, ScrollPosition };

/** The imperative actions a consumer cannot express declaratively. */
export interface ScrollAreaHandle {
  /** The frame, once it is in the document. */
  readonly root: HTMLElement | null;
  /** The scrollport, once it is in the document. It is the element that takes focus. */
  readonly viewport: HTMLElement | null;
  /** The last measurement: whether each axis overflows, and which of its ends show. */
  state: () => ScrollEdgesState;
  /** The distance from each logical start, read now. */
  position: () => ScrollPosition;
  /** Moves to a logical position. An axis left out is an axis left alone. */
  scrollTo: (target: Partial<ScrollPosition>) => void;
  /** Moves to one end of one axis. */
  scrollToEdge: (edge: LogicalEdge) => void;
  /** Brings one element into view by the shortest movement that does it, without moving anything else. */
  reveal: (element: Element) => void;
  /** Measures again, after content the observer could not see changed. */
  refresh: () => void;
  /** Moves focus to the scrollport. */
  focus: () => void;
}

/** What a scroll area is here, before it states anything of its own. */
export interface ScrollAreaDefaults {
  readonly axis: ScrollAreaAxis;
  readonly scrollbars: ScrollAreaScrollbars;
  readonly gutter: ScrollAreaGutter;
  readonly fade: ScrollAreaFade;
  readonly overscroll: ScrollAreaOverscroll;
}

export interface ScrollAreaDefaultsProviderProps extends Partial<ScrollAreaDefaults> {
  readonly children?: ReactNode;
}

/** The props the scrollport takes from the consumer, apart from the ones the family writes. */
export type ScrollAreaViewportProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'role' | 'tabIndex' | 'aria-label' | 'aria-labelledby'
>;

export interface ScrollAreaProps extends Omit<ComponentPropsWithRef<'div'>, 'ref'> {
  axis?: ScrollAreaAxis | undefined;
  scrollbars?: ScrollAreaScrollbars | undefined;
  gutter?: ScrollAreaGutter | undefined;
  fade?: ScrollAreaFade | undefined;
  overscroll?: ScrollAreaOverscroll | undefined;

  /**
   * Scroll only past this size, as any CSS length. It is Mantine's
   * `ScrollArea.Autosize` as one declaration rather than a second component.
   */
  maxBlockSize?: string | undefined;
  maxInlineSize?: string | undefined;

  /**
   * Whether the scrollport joins the tab sequence while it overflows.
   *
   * On by default, because content that scrolls has to be scrollable by
   * keyboard and a scrollport with no tab stop is not — unless a child of it
   * already takes focus. A consumer who knows the content is reachable another
   * way turns it off and carries the reason.
   */
  tabbable?: boolean | undefined;

  /**
   * The name the region is announced by. Resolved in one order: `labelledBy`,
   * then `messages.label`, then the catalog of the language in force.
   */
  labelledBy?: string | undefined;
  /** Words laid over the catalog of the language in force: the region's name (`label`). */
  messages?: PartialMessages<ScrollAreaMessages> | undefined;

  /**
   * Reports the position, as a distance from each logical start, on every
   * scroll. It is a report and not a request: the browser moves the position
   * on a wheel, a fling, a `Tab` into a child and a printed page, and a
   * consumer holding it would have to accept every one of those.
   */
  onScrollChange?: ((position: ScrollPosition, event: UIEvent<HTMLDivElement>) => void) | undefined;

  /** Reports the measurement, and only a new one: which axes overflow, and which ends show. */
  onOverflowChange?: ((state: ScrollEdgesState) => void) | undefined;

  /**
   * Native props for the scrollport. The family writes its role, its tab stop
   * and its name; everything else — a `className`, a `ref`, an `onScroll` —
   * reaches the element that scrolls.
   */
  viewportProps?: ScrollAreaViewportProps | undefined;

  /** Substitutes the element the frame renders as. */
  render?: ((props: ComponentPropsWithRef<'div'>) => ReactNode) | undefined;

  ref?:
    RefObject<ScrollAreaHandle | null> | ((handle: ScrollAreaHandle | null) => void) | undefined;
}

export interface ScrollAreaContentProps extends ComponentPropsWithRef<'div'> {
  /** Substitutes the element the inset renders as. */
  render?: ((props: ComponentPropsWithRef<'div'>) => ReactNode) | undefined;
}
