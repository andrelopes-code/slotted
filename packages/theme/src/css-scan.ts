/**
 * Walks CSS text once, tracking whether each character sits inside a quoted
 * string or a `/* ... *\/` comment, or follows a `\` that escapes it. Every
 * reader of raw, interpolated CSS text — splitting a theme's rules into
 * statements, or checking that a value carries no structural character —
 * needs the same state, because `;`, `{` and `}` only mean what they look
 * like when neither a string nor a comment is open and no `\` precedes them.
 * `handlers.onCodeChar` runs for every other character; `handlers.onComment`
 * runs once a comment closes, with its start index and the index right after
 * it.
 *
 * The tokenizer rules followed are CSS Syntax Level 3 § 4.3: a `\` outside a
 * string escapes the character after it, and a newline (`\n`, `\r`, `\f`)
 * not preceded by `\` ends a string as a bad string, which this scan reports
 * as a string left open.
 */

export interface ScanHandlers {
  readonly onCodeChar?: (char: string, index: number) => void;
  readonly onComment?: (start: number, end: number) => void;
}

export interface ScanEnd {
  /** The quote character of a string a newline or the end of the text left open, or `null`. */
  readonly openQuote: string | null;
  /** The index of a `/*` that never found its `*\/`, or `null`. */
  readonly openCommentAt: number | null;
  /** The text ends in a `\` outside a string, which escapes whatever is written after it. */
  readonly openEscape: boolean;
}

const NEWLINE = new Set(['\n', '\r', '\f']);

/** The length of the escaped character after a `\` at `index`: `\r\n` counts as one newline. */
const escapedLength = (text: string, index: number) =>
  text[index + 1] === '\r' && text[index + 2] === '\n' ? 2 : 1;

export function scanCssText(text: string, handlers: ScanHandlers = {}): ScanEnd {
  let quote: string | null = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quote) {
      if (char === '\\') index += escapedLength(text, index);
      else if (char === quote) quote = null;
      else if (NEWLINE.has(char))
        return { openQuote: quote, openCommentAt: null, openEscape: false };
      continue;
    }
    if (char === '\\') {
      if (index === text.length - 1)
        return { openQuote: null, openCommentAt: null, openEscape: true };
      index += escapedLength(text, index);
      continue;
    }
    if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2);
      if (end === -1) return { openQuote: null, openCommentAt: index, openEscape: false };
      handlers.onComment?.(index, end + 2);
      index = end + 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    handlers.onCodeChar?.(char, index);
  }
  return { openQuote: quote, openCommentAt: null, openEscape: false };
}
