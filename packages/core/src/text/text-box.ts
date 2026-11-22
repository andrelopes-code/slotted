/**
 * The trim of a text's box: which of its half-leadings are taken away, so a
 * text placed beside an icon, a control or a text of another size shares a top
 * edge, a bottom edge and an optical center with it. CSS Inline Layout Level 3
 * (`text-box-trim`, `text-box-edge`).
 */
export type TextBoxTrim = 'none' | 'start' | 'end' | 'both';

/** The edges the over side of a trimmed box may stand on. */
export type TextBoxOverEdge = 'text' | 'cap' | 'ex' | 'ideographic' | 'ideographic-ink';

/** The edges the under side of a trimmed box may stand on. */
export type TextBoxUnderEdge = 'text' | 'alphabetic' | 'ideographic' | 'ideographic-ink';

/**
 * Where the trim stops. A single over edge sets the under edge to `text`, as
 * the CSS shorthand does; a pair names both, and a pair the specification
 * rejects (`alphabetic` over, `cap` under) does not typecheck.
 */
export type TextBoxEdge =
  'auto' | TextBoxOverEdge | { readonly over: TextBoxOverEdge; readonly under: TextBoxUnderEdge };

export interface TextBoxConfig {
  readonly trim: TextBoxTrim;
  /** Defaults to the theme's `--slotted-text-box-edge`, `cap alphabetic`. */
  readonly edge?: TextBoxEdge | undefined;
}

export type TextBox = TextBoxTrim | TextBoxConfig;

export interface TextBoxValues {
  /** The `text-box-trim` keyword, or `null` when nothing is trimmed. */
  readonly trim: 'trim-start' | 'trim-end' | 'trim-both' | null;
  /** The `text-box-edge` value, or `null` to read the theme's token. */
  readonly edge: string | null;
}

/** The two CSS values a `textBox` prop stands for. */
export function textBoxValues(textBox: TextBox | undefined): TextBoxValues {
  const config = typeof textBox === 'object' ? textBox : { trim: textBox ?? 'none' };

  return { trim: TRIM[config.trim], edge: edgeOf(config.edge) };
}

const TRIM = {
  none: null,
  start: 'trim-start',
  end: 'trim-end',
  both: 'trim-both',
} as const satisfies Record<TextBoxTrim, TextBoxValues['trim']>;

/* A single over edge is written as the pair the CSS shorthand expands it to:
   the same keyword under where it is valid there, `text` otherwise. A browser
   that reads only pairs then reads every edge. */
function edgeOf(edge: TextBoxEdge | undefined): string | null {
  if (edge === undefined) return null;
  if (typeof edge === 'object') return `${edge.over} ${edge.under}`;
  if (edge === 'auto') return edge;

  return `${edge} ${edge === 'cap' || edge === 'ex' ? 'text' : edge}`;
}
