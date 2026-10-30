/**
 * The geometry of one of the library's own icons, drawn from the Lucide icon
 * `packages/themes/src/default/glyphs.json` names for it. A binding renders it
 * as a real `<svg>`: every family draws its own icons through that one element,
 * never through a pseudo-element or a mask of its own.
 */
export interface GlyphDrawing {
  /** `stroke` is Lucide's own rendering; `fill` paints the same geometry solid. */
  readonly paint: 'stroke' | 'fill';
  /** In viewBox units; `0` for a filled glyph. */
  readonly strokeWidth: number;
  /**
   * The optical correction that puts the glyph's main shape on the centre of
   * the 24-unit box (`glyph-ink.mjs`): its whole ink, or the elements its
   * manifest entry names as `body` where a protrusion — a calendar's rings, a
   * pin's needle, a bin's handle — is not what the eye centres.
   */
  readonly offset: readonly [number, number];
  /** One `<path d>` each, in Lucide's drawing order. */
  readonly paths: readonly string[];
}

/** The box every glyph is drawn in. */
export const GLYPH_VIEW_BOX = '0 0 24 24';
