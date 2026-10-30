/**
 * The marks that say how serious something is, drawn by hand on the grid they
 * are shown at rather than reduced from Lucide's 24-unit box. A 24-unit
 * drawing at 12 pixels puts every 2-unit stroke on a pixel and a half; these
 * put every cut on whole units of their own grid, two units wide, so at the
 * grid's own size each edge lands on a device pixel.
 *
 * Each mark is solid: the silhouette filled, the symbol cut out of it. The
 * silhouette fills its grid edge to edge — a circle, or the warning's diamond,
 * symmetric on both axes so its centre is the box's centre.
 *
 * A binding's `Glyph` draws all three grids and `icon.css` shows the one the
 * icon box is sized for.
 */
export interface StatusGlyphGrid {
  /** Filled, and stroked `shapeStroke` wide with round joins to round its corners. */
  readonly shape: string;
  readonly shapeStroke: number;
  /** Filled cuts. */
  readonly holes: readonly string[];
  /** Stroked cuts, 2 units wide with round caps and joins. */
  readonly strokes: readonly string[];
}

export const STATUS_GLYPH_GRIDS = [12, 14, 16] as const;
export type StatusGlyphGridSize = (typeof STATUS_GLYPH_GRIDS)[number];

/** A disc of radius `r` centred on `(c, c)`. */
function disc(c: number, r: number): string {
  return `M${c - r} ${c}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

/** A 2-unit vertical bar with round ends: the stem and the point of `!` and `i`. */
function bar(x: number, y: number, height: number): string {
  return `M${x + 1} ${y}a1 1 0 0 1 1 1v${height - 2}a1 1 0 0 1 -2 0v${2 - height}a1 1 0 0 1 1 -1Z`;
}

function circled(
  grid: StatusGlyphGridSize,
  cuts: { holes?: string[]; strokes?: string[] },
): StatusGlyphGrid {
  return {
    shape: disc(grid / 2, grid / 2),
    shapeStroke: 0,
    holes: cuts.holes ?? [],
    strokes: cuts.strokes ?? [],
  };
}

export const STATUS_GLYPHS = {
  'status-danger': {
    12: circled(12, { holes: [bar(5, 2, 5), bar(5, 8, 2)] }),
    14: circled(14, { holes: [bar(6, 3, 5), bar(6, 9, 2)] }),
    16: circled(16, { holes: [bar(7, 3, 6), bar(7, 11, 2)] }),
  },
  /** The diamond of a warning sign: symmetric on both axes, which the triangle is not. */
  'status-warning': {
    12: {
      shape: 'M6 .9L11.1 6L6 11.1L.9 6Z',
      shapeStroke: 1.8,
      holes: [bar(5, 3, 3), bar(5, 7, 2)],
      strokes: [],
    },
    14: {
      shape: 'M7 1.05L12.95 7L7 12.95L1.05 7Z',
      shapeStroke: 2.1,
      holes: [bar(6, 3, 5), bar(6, 9, 2)],
      strokes: [],
    },
    16: {
      shape: 'M8 1.2L14.8 8L8 14.8L1.2 8Z',
      shapeStroke: 2.4,
      holes: [bar(7, 4, 5), bar(7, 10, 2)],
      strokes: [],
    },
  },
  'status-success': {
    12: circled(12, { strokes: ['M3.2 6.2l1.9 1.9 3.7-4.1'] }),
    14: circled(14, { strokes: ['M3.9 7.4l2.2 2.2 4-4.4'] }),
    16: circled(16, { strokes: ['M4.5 8.5l2.5 2.5 4.5-5'] }),
  },
  'status-info': {
    12: circled(12, { holes: [bar(5, 2, 2), bar(5, 5, 5)] }),
    14: circled(14, { holes: [bar(6, 3, 2), bar(6, 6, 5)] }),
    16: circled(16, { holes: [bar(7, 3, 2), bar(7, 7, 6)] }),
  },
  'status-failed': {
    12: circled(12, { strokes: ['M4 4l4 4M8 4l-4 4'] }),
    14: circled(14, { strokes: ['M4.75 4.75l4.5 4.5M9.25 4.75l-4.5 4.5'] }),
    16: circled(16, { strokes: ['M5.5 5.5l5 5M10.5 5.5l-5 5'] }),
  },
  'status-unknown': {
    12: circled(12, {
      holes: [bar(5, 8, 2)],
      strokes: ['M4.5 4a1.5 1.5 0 1 1 2.1 1.38c-.35.16-.6.32-.6.62'],
    }),
    14: circled(14, {
      holes: [bar(6, 9, 2)],
      strokes: ['M5.25 4.75a1.75 1.75 0 1 1 2.4 1.62c-.4.18-.65.3-.65.63'],
    }),
    16: circled(16, {
      holes: [bar(7, 11, 2)],
      strokes: ['M6 6a2 2 0 1 1 2.75 1.85c-.45.2-.75.6-.75 1.15'],
    }),
  },
  /** A ring two units wide: nothing is happening, said by shape as well as by colour. */
  'status-neutral': {
    12: circled(12, { holes: [disc(6, 4)] }),
    14: circled(14, { holes: [disc(7, 5)] }),
    16: circled(16, { holes: [disc(8, 6)] }),
  },
} as const satisfies Record<string, Record<StatusGlyphGridSize, StatusGlyphGrid>>;

export type StatusGlyphName = keyof typeof STATUS_GLYPHS;

export function isStatusGlyph(name: string): name is StatusGlyphName {
  return Object.hasOwn(STATUS_GLYPHS, name);
}
