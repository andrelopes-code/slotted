/**
 * The vocabulary a drag is described in: keys, containers, positions and the
 * one event every consumer receives. No pixel appears in it. A pointer is one
 * of two ways of driving a session, and the session is defined over the
 * consumer's model — an ordered list of keys per container — rather than over
 * the geometry of whatever rendered it.
 */

import type { DragMessages, FamilyTranslator } from '../i18n';
import type { ChangeReason } from '../state';
import type { Point } from '../pointer-intent';
import type { MeasuredContainer } from './geometry';

export type { Point };

/** What a drop does to the items. The platform's three, without `none`. */
export type DropOperation = 'move' | 'copy' | 'link';

/** How the session was driven; the subset of the closed vocabulary a drag can emit. */
export type DragReason = Extract<ChangeReason, 'keyboard' | 'pointer' | 'programmatic'>;

export type DragOrientation = 'vertical' | 'horizontal' | 'grid';

/** The kinds of position a container may offer. */
export type DropTargetKind = 'between' | 'on' | 'root';

export interface DragOrigin {
  readonly container: string;
  /** Index of the first dragged item in the source container's list. */
  readonly index: number;
}

/**
 * Where the items would land. `between` is a splice index in the container's
 * list, `0..length`; `on` is an item that takes the drop as its own — a
 * folder; `root` is an empty container.
 */
export type DropTarget =
  | { readonly kind: 'between'; readonly container: string; readonly index: number }
  | { readonly kind: 'on'; readonly container: string; readonly key: string }
  | { readonly kind: 'root'; readonly container: string };

export interface DragState {
  readonly status: 'idle' | 'dragging';
  readonly reason: DragReason | null;
  readonly items: readonly string[];
  readonly source: DragOrigin | null;
  /** `null` while the pointer is over no container. */
  readonly target: DropTarget | null;
  /** Whether the target takes the drop. Always true on the identity position. */
  readonly valid: boolean;
  readonly operation: DropOperation | null;
  /** The pointer, for a preview a family draws itself; `null` on the keyboard. */
  readonly point: Point | null;
}

export interface DragContainerOptions {
  readonly key: string;
  /** The ordered keys, read at pick-up and at every move. */
  items: () => readonly string[];
  /** Default `vertical`. Decides which arrows move inside the container. */
  readonly orientation?: DragOrientation;
  /** Columns of a `grid`, so a row step is known. */
  columns?: () => number;
  /** Default `['between']`. An empty container offers `root` whatever this says. */
  readonly targets?: readonly DropTargetKind[];
  /** Refuses a position. Not asked about the identity position. */
  accepts?: (state: DragState, target: DropTarget) => boolean;
  /** The operation this container performs; the modifiers decide when it names none. */
  operation?: (state: DragState, target: DropTarget) => DropOperation | null;
  disabled?: () => boolean;
  /** The box the pointer is resolved against, and the writing direction is read from. */
  element?: () => Element | null;
  /** An item's box, its focus destination, and what is scrolled into view. */
  itemElement?: (key: string) => Element | null;
  label?: () => string;
  itemLabel?: (key: string) => string;
}

/**
 * An announcement the controller makes: picking up, each move, the drop, the
 * cancel, and a move with no position left to take.
 */
export type DragAnnouncement = 'pickedUp' | 'moved' | 'dropped' | 'cancelled' | 'nowhere';

export interface DragStartRequest {
  readonly items: readonly string[];
  readonly source: DragOrigin;
  readonly reason: DragReason;
  readonly event: Event | undefined;
  readonly cancelled: boolean;
  cancel(): void;
}

export interface DragTargetEvent {
  readonly state: DragState;
  readonly event: Event | undefined;
}

export interface DropEvent {
  readonly items: readonly string[];
  readonly source: DragOrigin;
  readonly target: DropTarget;
  readonly operation: DropOperation;
  readonly reason: DragReason;
  readonly event: Event | undefined;
}

export interface DragEndEvent {
  readonly state: DragState;
  readonly dropped: boolean;
  readonly reason: DragReason;
  readonly event: Event | undefined;
}

export type MoveIntent =
  | 'next'
  | 'previous'
  | 'first'
  | 'last'
  | 'pageNext'
  | 'pagePrevious'
  | 'rowNext'
  | 'rowPrevious'
  | 'nextContainer'
  | 'previousContainer';

export interface PickUpOptions {
  readonly items: readonly string[];
  readonly source: DragOrigin;
  /** Default `programmatic`. */
  readonly reason?: DragReason;
  readonly event?: Event;
  /** Default `['move']`. */
  readonly allowedOperations?: readonly DropOperation[];
}

export interface MoveByOptions extends PickUpOptions {
  readonly intent: MoveIntent;
}

export interface DraggableOptions {
  readonly container: string;
  readonly key: string;
  /** The items the drag carries, read at the press. Default `[key]`. */
  items?: () => readonly string[];
  /** The element a press has to start on. Default: the draggable itself. */
  handle?: () => Element | null;
  disabled?: () => boolean;
  /**
   * Whether this press may become a drag, asked after the handle and the
   * control under it have been checked. A control the selector cannot name —
   * a column's resize handle, a slider's thumb — is refused here. Default:
   * every press.
   */
  canDrag?: (event: PointerEvent) => boolean;
  /** Pixels of travel before a press is a drag. Default 5. */
  readonly distance?: number;
  /** Milliseconds of holding before a press is a drag, per pointer type. Default touch 250. */
  readonly delay?:
    number | { readonly mouse?: number; readonly touch?: number; readonly pen?: number };
  readonly allowedOperations?: readonly DropOperation[];
}

export interface DragPreviewOptions {
  /** The element shown under the pointer. Default: a clone of the source item. */
  render?: (state: DragState) => Element | null;
  /** Where it is appended. Default `document.body`. */
  container?: () => Element | null;
}

export interface DragAutoScrollOptions {
  /**
   * The axes scrolled. A row of headers drags along one axis with the pointer
   * held at the scroller's top edge the whole time, so a drag along `x` must
   * not read that edge as a request to scroll up. Default `both`.
   */
  readonly axis?: 'x' | 'y' | 'both';
  /** Pixels from an edge inside which scrolling starts. Default 40. */
  readonly threshold?: number;
  /** Pixels per frame at the edge. Default 12. */
  readonly speed?: number;
}

export interface DragControllerOptions {
  onDragStart?: (request: DragStartRequest) => void;
  onTargetChange?: (event: DragTargetEvent) => void;
  onDwell?: (event: DragTargetEvent) => void;
  onDrop?: (event: DropEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  /**
   * The drag's words in the language in force (`dragMessages` from
   * `@slotted/core/i18n`), read at every announcement, so a binding passes a
   * translator that follows the locale. Absent, nothing is announced.
   */
  t?: FamilyTranslator<DragMessages> | undefined;
  /** The announcements the family makes in its own words, and the controller leaves unsaid. */
  readonly silent?: readonly DragAnnouncement[];
  /** Default: the document's shared live announcer. */
  announce?: (message: string) => void;
  /** Default true. */
  readonly restoreFocus?: boolean;
  /** Milliseconds over one unchanged valid `on` target before `onDwell`. Default 600. */
  readonly dwellDelay?: number;
  readonly preview?: DragPreviewOptions | false;
  readonly autoScroll?: DragAutoScrollOptions | false;
  /**
   * Turns the pointer into a position. Default: the container whose box holds
   * the point, then the item midpoints along its axis (`resolvePoint`). A
   * family with another rule — nearest centre, a hit box per cell — replaces
   * it here and keeps everything else.
   */
  resolveTarget?: (point: Point, containers: readonly MeasuredContainer[]) => DropTarget | null;
  readonly document?: Document;
}

export interface DragController {
  readonly state: DragState;
  subscribe(listener: (state: DragState) => void): () => void;
  registerContainer(options: DragContainerOptions): () => void;
  /** Opens a session. Returns false when refused or one is already open. */
  pickUp(options: PickUpOptions): boolean;
  /** Moves the target by intent. Returns whether it moved. */
  move(intent: MoveIntent, event?: Event): boolean;
  /** Sets the target directly, as the pointer does. */
  moveTo(target: DropTarget | null, event?: Event, point?: Point | null): void;
  drop(event?: Event): boolean;
  cancel(event?: Event): void;
  /** Pick up, move once, drop: the APG one-call reorder. */
  moveBy(options: MoveByOptions): boolean;
  /** Maps a key to a verb while a session is open. Returns whether it was taken. */
  handleKeydown(event: KeyboardEvent): boolean;
  attachDraggable(element: Element, options: DraggableOptions): () => void;
  destroy(): void;
}
