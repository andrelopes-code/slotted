/**
 * The positions a drag can land on, computed from the consumer's model and
 * never from a rectangle. The keyboard walks this list; the pointer resolves
 * a point to one entry of it (`geometry.ts`). Both end on the same target.
 */

import { PAGE_STEP } from '../collection/navigation';
import type { DragOrigin, DropOperation, DropTarget, DropTargetKind, MoveIntent } from './types';

/** What the position list needs to know about the drag in flight. */
export interface DragFacts {
  readonly items: readonly string[];
  readonly source: DragOrigin;
  readonly operation: DropOperation | null;
}

/** What the position list needs to know about a container, read once per ask. */
export interface ContainerFacts {
  readonly key: string;
  readonly items: readonly string[];
  readonly targets: readonly DropTargetKind[];
  readonly disabled?: boolean;
}

export function sameTarget(a: DropTarget | null, b: DropTarget | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.kind !== b.kind || a.container !== b.container) return false;
  if (a.kind === 'between') return a.index === (b as typeof a).index;
  if (a.kind === 'on') return a.key === (b as typeof a).key;
  return true;
}

/**
 * Whether dropping here leaves the model as it is. Only a move within the
 * source container has such a place: the gap before the first dragged item
 * and the gap after the last, when the dragged items are contiguous, both put
 * the items back where they were.
 */
export function isIdentity(target: DropTarget | null, drag: DragFacts): boolean {
  if (target === null || target.kind !== 'between') return false;
  if (drag.operation !== 'move' || target.container !== drag.source.container) return false;
  const { index } = drag.source;
  return target.index >= index && target.index <= index + drag.items.length;
}

function isDragged(key: string, drag: DragFacts, container: string): boolean {
  return container === drag.source.container && drag.items.includes(key);
}

/**
 * The positions a container offers, in reading order and before `accepts`
 * has been asked. An empty container offers its root and nothing else, so a
 * list that lists only `on` still has somewhere to put the first item.
 */
export function containerPositions(container: ContainerFacts, drag: DragFacts): DropTarget[] {
  if (container.disabled === true) return [];
  const { key, items, targets } = container;
  if (items.length === 0) return [{ kind: 'root', container: key }];

  const gaps = targets.includes('between');
  const onto = targets.includes('on');
  const moving = drag.operation === 'move' && key === drag.source.container;
  const positions: DropTarget[] = [];

  for (let index = 0; index <= items.length; index += 1) {
    if (gaps) {
      const identity = moving && isIdentity({ kind: 'between', container: key, index }, drag);
      /* Every identity gap but the first is the same place said again. */
      if (!identity || index === drag.source.index) {
        positions.push({ kind: 'between', container: key, index });
      }
    }
    const item = items[index];
    if (onto && item !== undefined && !isDragged(item, drag, key)) {
      positions.push({ kind: 'on', container: key, key: item });
    }
  }

  return positions;
}

/**
 * Where the reader will find the first item once it lands, one-based, and how
 * many items the container will then hold — the two numbers every surveyed
 * announcement says.
 */
export function resultingPosition(
  target: DropTarget,
  containerItems: readonly string[],
  drag: DragFacts,
): { position: number; total: number } | null {
  if (target.kind !== 'between') return null;

  const moving = drag.operation === 'move';
  const leaving =
    moving && target.container === drag.source.container
      ? drag.items.filter((key) => containerItems.indexOf(key) < target.index).length
      : 0;
  const remaining =
    moving && target.container === drag.source.container
      ? containerItems.filter((key) => !drag.items.includes(key)).length
      : containerItems.length;

  return { position: target.index - leaving + 1, total: remaining + drag.items.length };
}

/**
 * The index a step lands on inside one container's positions. Nothing wraps:
 * the APG's rearrangeable listbox stops at the ends, and a reader who hears
 * the same position twice knows the end was reached.
 */
export function stepWithin(
  positions: readonly DropTarget[],
  current: number,
  intent: Exclude<MoveIntent, 'nextContainer' | 'previousContainer'>,
  columns = 1,
): number {
  const last = positions.length - 1;
  if (last < 0) return -1;
  const from = current < 0 ? -1 : current;
  const clamp = (index: number) => Math.min(last, Math.max(0, index));

  switch (intent) {
    case 'first':
      return 0;
    case 'last':
      return last;
    case 'next':
      return clamp(from + 1);
    case 'previous':
      return clamp(from < 0 ? 0 : from - 1);
    case 'pageNext':
      return clamp(from + PAGE_STEP);
    case 'pagePrevious':
      return clamp(from < 0 ? 0 : from - PAGE_STEP);
    case 'rowNext':
      return from + columns > last ? clamp(from) : from + columns;
    case 'rowPrevious':
      return from - columns < 0 ? clamp(from) : from - columns;
    default:
      return clamp(from);
  }
}
