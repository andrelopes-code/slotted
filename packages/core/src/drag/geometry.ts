/**
 * The one place a pixel becomes a position. The pointer sensor measures the
 * containers and the items the family points it at, and this file turns the
 * point into the same `DropTarget` the keyboard walks to — so the consumer's
 * event never learns which of the two produced it.
 */

import type { Point } from '../pointer-intent';
import type { Rect } from '../pointer-intent';
import type { WritingDirection } from './keys';
import type { DragOrientation, DropTarget, DropTargetKind } from './types';

export type { Point, Rect };

export interface MeasuredContainer {
  readonly key: string;
  readonly rect: Rect | null;
  readonly items: readonly string[];
  /** One rect per item, `null` for an item with no element on screen. */
  readonly rects: readonly (Rect | null)[];
  readonly targets: readonly DropTargetKind[];
  readonly orientation?: DragOrientation;
  /** The container's writing direction: a right-to-left row's first item is its rightmost. Default `ltr`. */
  readonly direction?: WritingDirection;
}

export function contains(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

/** The band of an item that is the item itself rather than one of its edges. */
const ON_BAND = 0.25;

/* The inline axis of a right-to-left row is mirrored: the arithmetic on
   start, end and the point is the same once every x is negated. */
function alongAxis(
  orientation: DragOrientation,
  rect: Rect,
  point: Point,
  direction: WritingDirection = 'ltr',
) {
  if (orientation === 'vertical') return { start: rect.top, end: rect.bottom, at: point.y };
  if (direction === 'rtl') return { start: -rect.right, end: -rect.left, at: -point.x };
  return { start: rect.left, end: rect.right, at: point.x };
}

function resolveWithin(
  point: Point,
  container: MeasuredContainer,
  orientation: DragOrientation,
): DropTarget {
  const { key, items, rects, targets, direction } = container;
  if (items.length === 0) return { kind: 'root', container: key };

  const gaps = targets.includes('between');
  const onto = targets.includes('on');

  /* A grid is read as its nearest cell, and then as a row on the inline axis. */
  let candidate = -1;
  if (orientation === 'grid') {
    let best = Number.POSITIVE_INFINITY;
    rects.forEach((rect, index) => {
      if (rect === null) return;
      const dx = (rect.left + rect.right) / 2 - point.x;
      const dy = (rect.top + rect.bottom) / 2 - point.y;
      const distance = dx * dx + dy * dy;
      if (distance < best) {
        best = distance;
        candidate = index;
      }
    });
  } else {
    /* Walk the measured items: the point is before, inside or past each one. */
    for (let index = 0; index < items.length; index += 1) {
      const rect = rects[index];
      if (rect === null || rect === undefined) continue;
      const { end, at } = alongAxis(orientation, rect, point, direction);
      if (at <= end) {
        candidate = index;
        break;
      }
    }
    if (candidate === -1) {
      /* Past every measured item. */
      return gaps
        ? { kind: 'between', container: key, index: items.length }
        : { kind: 'on', container: key, key: lastMeasured(items, rects) };
    }
  }

  const rect = rects[candidate];
  const item = items[candidate];
  if (rect === null || rect === undefined || item === undefined) {
    return { kind: 'root', container: key };
  }

  const axis = orientation === 'grid' ? 'horizontal' : orientation;
  const { start, end, at } = alongAxis(axis, rect, point, direction);
  const size = end - start;
  const fraction = size > 0 ? (at - start) / size : 0.5;

  if (onto && (!gaps || (fraction >= ON_BAND && fraction <= 1 - ON_BAND))) {
    return { kind: 'on', container: key, key: item };
  }
  return { kind: 'between', container: key, index: fraction < 0.5 ? candidate : candidate + 1 };
}

function lastMeasured(items: readonly string[], rects: readonly (Rect | null)[]): string {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (rects[index] !== null && item !== undefined) return item;
  }
  return items[items.length - 1] ?? '';
}

/**
 * The position under a point, or `null` when no container holds it. When two
 * containers hold it, the smaller box wins: a list nested inside a card, a
 * lane inside a board. Registration order is not a rule a family can keep
 * while it re-renders, and the smaller box is the one drawn on top in every
 * nesting there is. A tie goes to the last registered.
 */
export function resolvePoint(
  point: Point,
  containers: readonly MeasuredContainer[],
  orientation: DragOrientation,
): DropTarget | null {
  let chosen: MeasuredContainer | null = null;
  let smallest = Number.POSITIVE_INFINITY;
  for (const container of containers) {
    if (container.rect === null || !contains(container.rect, point)) continue;
    const { rect } = container;
    const area = (rect.right - rect.left) * (rect.bottom - rect.top);
    if (area <= smallest) {
      smallest = area;
      chosen = container;
    }
  }
  return chosen === null ? null : resolveWithin(point, chosen, chosen.orientation ?? orientation);
}

/**
 * How far a scroll container moves this frame: nothing until the point is
 * within `threshold` of an edge, then rising linearly to `speed` on the edge.
 * A point outside the box scrolls nothing — the pointer left the container.
 */
export function autoScrollDelta(point: Point, rect: Rect, threshold: number, speed: number): Point {
  if (!contains(rect, point) || threshold <= 0) return { x: 0, y: 0 };

  const rate = (distance: number) =>
    distance >= threshold ? 0 : Math.round(speed * (1 - distance / threshold));

  const x = rate(point.x - rect.left) > 0 ? -rate(point.x - rect.left) : rate(rect.right - point.x);
  const y = rate(point.y - rect.top) > 0 ? -rate(point.y - rect.top) : rate(rect.bottom - point.y);
  return { x, y };
}
