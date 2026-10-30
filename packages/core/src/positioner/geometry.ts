/**
 * The part of positioning that is arithmetic rather than measurement.
 *
 * Two things live here and nothing else: the translation between the side a
 * consumer names and the side the engine understands, and the transform origin
 * that a scale animation grows from. Both are pure, so both are tested against
 * numbers instead of against a rendered page — which is the only way the
 * mirrored answers can be checked at all, since a headless document has one
 * writing direction and this library supports two.
 */

/**
 * `inline-start` and `inline-end` are the reason this type is not the engine's.
 * Every surveyed positioner names physical sides only and leaves a
 * right-to-left consumer to mirror them in script, in a library whose whole
 * layout law is logical properties.
 */
export type PositionSide = 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';

/** What the engine, and the DOM, actually work in. */
export type PhysicalSide = 'top' | 'bottom' | 'left' | 'right';

export type PositionAlign = 'start' | 'center' | 'end';

export type WritingDirection = 'ltr' | 'rtl';

export interface ArrowGeometry {
  x?: number | undefined;
  y?: number | undefined;
  width: number;
  height: number;
}

export function resolveSide(side: PositionSide, direction: WritingDirection): PhysicalSide {
  if (side === 'inline-start') return direction === 'rtl' ? 'right' : 'left';
  if (side === 'inline-end') return direction === 'rtl' ? 'left' : 'right';
  return side;
}

export function isVertical(side: PhysicalSide): boolean {
  return side === 'top' || side === 'bottom';
}

export function oppositeSide(side: PhysicalSide): PhysicalSide {
  if (side === 'top') return 'bottom';
  if (side === 'bottom') return 'top';
  return side === 'left' ? 'right' : 'left';
}

/**
 * How a side and an alignment are written as one token — `bottom-start`, or
 * `bottom` where the alignment is the center.
 *
 * The type is written here rather than imported. It happens to be the shape
 * every positioning engine uses, and stating it locally is what keeps
 * `docs/component-features.md` §3's rule true: no type of the engine appears in
 * this module's surface.
 */
export type PlacementToken = PhysicalSide | `${PhysicalSide}-start` | `${PhysicalSide}-end`;

export function toPlacement(side: PhysicalSide, align: PositionAlign): PlacementToken {
  return align === 'center' ? side : (`${side}-${align}` as PlacementToken);
}

export function fromPlacement(placement: string): { side: PhysicalSide; align: PositionAlign } {
  const [side, align] = placement.split('-');
  return {
    side: (side ?? 'bottom') as PhysicalSide,
    align: (align as PositionAlign | undefined) ?? 'center',
  };
}

/**
 * Where a layer grows from, which is the edge nearest the anchor.
 *
 * With an arrow it is the arrow's own tip rather than a corner, because that is
 * where the reader's eye says the layer came from. The alignment mirrors with
 * the writing direction on a vertical side, matching how the engine resolves
 * `start` and `end` there; on a horizontal side the alignment is the block axis
 * and mirrors with nothing.
 */
export function transformOrigin(
  side: PhysicalSide,
  align: PositionAlign,
  direction: WritingDirection = 'ltr',
  arrow?: ArrowGeometry | undefined,
): string {
  if (isVertical(side)) {
    const block = side === 'bottom' ? 'top' : 'bottom';
    const inline =
      arrow && arrow.x !== undefined
        ? `${arrow.x + arrow.width / 2}px`
        : inlineKeyword(align, direction);
    return `${inline} ${block}`;
  }

  const inline = side === 'right' ? 'left' : 'right';
  const block =
    arrow && arrow.y !== undefined ? `${arrow.y + arrow.height / 2}px` : blockKeyword(align);
  return `${inline} ${block}`;
}

function inlineKeyword(align: PositionAlign, direction: WritingDirection): string {
  if (align === 'center') return 'center';
  const atStart = align === 'start';
  return (direction === 'rtl') === atStart ? 'right' : 'left';
}

function blockKeyword(align: PositionAlign): string {
  if (align === 'center') return 'center';
  return align === 'start' ? 'top' : 'bottom';
}
