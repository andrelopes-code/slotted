import type { GlyphName } from '@slotted/core/glyph';
import type { FileKind } from '@slotted/core/upload';

/**
 * The mark knocked out of each kind's tile. It is the map `upload` draws its
 * rows with, restated here because that one is private to `upload`; the
 * contract test reads both contracts' `kinds` and refuses a drift, so a PDF
 * never has two marks.
 */
export const ATTACHMENT_KIND_GLYPH: Readonly<Record<FileKind, GlyphName>> = {
  archive: 'file-archive',
  audio: 'file-audio',
  document: 'file-type',
  image: 'file-image',
  other: 'file',
  pdf: 'file-text',
  presentation: 'presentation',
  spreadsheet: 'file-spreadsheet',
  video: 'file-video',
};

/**
 * The controls `removal-focus` counts. An attachment in a set holds the same
 * controls as its neighbours, so the position focus had among them is the
 * position of the same control on the attachment that took its place.
 */
export const ATTACHMENT_CONTROL_SELECTOR =
  '[data-part="trigger"], [data-part="action"], [data-part="remove"]';

/**
 * The extension as the card writes it: `PDF`, or the catalog's `noExtension`
 * word when the name has none.
 */
export function extensionLabel(extension: string, none: string): string {
  return extension === '' ? none : extension.slice(1).toUpperCase();
}
