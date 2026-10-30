import type { FileKind } from './types';

/**
 * What kind of file this is, from its media type and its name.
 *
 * The kind decides the colour of the tile and the mark knocked out of it, and
 * at thirty-two pixels that pair is what a reader picking one attachment out of
 * nine reads first — before the truncated name and before the three characters
 * of extension.
 *
 * A PDF and a word-processed document are two kinds rather than one because
 * they are the pair a reader most often has to tell apart, and every product
 * they use has already given the two different colours.
 */

/** The extensions a kind claims when the platform gave no useful media type. */
const BY_EXTENSION: ReadonlyArray<readonly [FileKind, readonly string[]]> = [
  ['pdf', ['.pdf']],
  ['document', ['.doc', '.docx', '.odt', '.rtf', '.txt', '.md', '.pages']],
  ['spreadsheet', ['.xls', '.xlsx', '.ods', '.csv', '.tsv', '.numbers']],
  ['presentation', ['.ppt', '.pptx', '.odp', '.key']],
  ['image', ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.heic', '.heif']],
  ['video', ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v']],
  ['audio', ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac']],
  ['archive', ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz']],
];

/**
 * The media types a kind claims outright. Checked before the extension,
 * because the platform's own answer beats a guess from a name — and a `.png`
 * full of something else is exactly what a name cannot catch.
 */
const BY_TYPE: ReadonlyArray<readonly [FileKind, (type: string) => boolean]> = [
  ['pdf', (type) => type === 'application/pdf'],
  ['image', (type) => type.startsWith('image/')],
  ['video', (type) => type.startsWith('video/')],
  ['audio', (type) => type.startsWith('audio/')],
  [
    'spreadsheet',
    (type) =>
      type === 'text/csv' ||
      type === 'text/tab-separated-values' ||
      type.includes('spreadsheet') ||
      type.includes('ms-excel'),
  ],
  ['presentation', (type) => type.includes('presentation') || type.includes('ms-powerpoint')],
  [
    'document',
    (type) =>
      type.startsWith('text/') ||
      type.includes('wordprocessing') ||
      type === 'application/msword' ||
      type === 'application/rtf',
  ],
  [
    'archive',
    (type) =>
      type === 'application/zip' ||
      type === 'application/x-tar' ||
      type === 'application/gzip' ||
      type.includes('compressed'),
  ],
];

/** The media type without the parameters it may carry, folded to lower case. */
function mediaType(type: string) {
  return (type.split(';')[0] ?? '').trim().toLowerCase();
}

export function fileKind(file: { name: string; type: string }): FileKind {
  const type = mediaType(file.type);
  if (type !== '') {
    for (const [kind, matches] of BY_TYPE) if (matches(type)) return kind;
  }

  const name = file.name.toLowerCase();
  for (const [kind, extensions] of BY_EXTENSION) {
    if (extensions.some((extension) => name.endsWith(extension))) return kind;
  }

  return 'other';
}

/**
 * The five types the viewer renders on its own. Everything else gets the tile,
 * the sentence, and one press to the file.
 *
 * A `.docx` is not here and cannot be: a browser does not draw one, and drawing
 * one needs a server or a megabyte of engine.
 */
export function isViewable(file: { type: string }): boolean {
  const type = mediaType(file.type);
  return (
    type === 'application/pdf' ||
    type.startsWith('image/') ||
    type.startsWith('text/') ||
    type.startsWith('video/') ||
    type.startsWith('audio/')
  );
}

/**
 * The stem and the extension, split at the last dot.
 *
 * CSS cannot truncate in the middle, so the split is made here and the two
 * halves are drawn as separate elements: the stem shrinks to an ellipsis and
 * the extension does not, which is what keeps the part that says what the file
 * is. A name with no dot, or one that begins with a dot, is one piece.
 */
export function splitName(name: string): { stem: string; extension: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return { stem: name, extension: '' };
  return { stem: name.slice(0, dot), extension: name.slice(dot) };
}
