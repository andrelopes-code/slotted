import type { GLYPHS } from './glyphs';
import type { StatusGlyphName } from './status-glyphs';

export { GLYPH_VIEW_BOX } from './glyph';
export type { GlyphDrawing } from './glyph';
export { GLYPHS } from './glyphs';
export { isStatusGlyph, STATUS_GLYPH_GRIDS, STATUS_GLYPHS } from './status-glyphs';
export type { StatusGlyphGrid, StatusGlyphGridSize, StatusGlyphName } from './status-glyphs';

/**
 * The name of one of the library's own icons: its glyph token without
 * `--slotted-icon-`, or one of the hand-drawn status marks.
 */
export type GlyphName = keyof typeof GLYPHS | StatusGlyphName;
