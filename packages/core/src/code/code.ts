/**
 * What a block of source is made of once it reaches a `code-block`: lines of
 * tokens, each token a piece of text and, when an engine has said so, one of
 * twelve scopes.
 *
 * The engine is outside this package. Shiki and Prism are a grammar per
 * language and a theme per scope, and neither is written or bundled here —
 * `docs/component-features.md` §10 makes the highlight engine an optional
 * package. What is written here is the shape the family draws and the two
 * mappings that reduce the engines' token shapes to it, importing neither.
 *
 * Twelve scopes rather than Prism's sixteen standard names or TextMate's
 * hundreds, because twelve is what a theme can paint apart from each other on
 * one ground at 4.5:1, and what a reader can tell apart. The scopes are the
 * theme's own scale — `--slotted-code-<scope>` — and an engine's inline color
 * never reaches the DOM, so a scheme switch reaches every one of them.
 */

export type CodeScope =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'type'
  | 'variable'
  | 'property'
  | 'punctuation'
  | 'tag'
  | 'attribute'
  | 'constant';

export const CODE_SCOPES: readonly CodeScope[] = [
  'comment',
  'keyword',
  'string',
  'number',
  'function',
  'type',
  'variable',
  'property',
  'punctuation',
  'tag',
  'attribute',
  'constant',
];

export interface CodeToken {
  readonly text: string;
  readonly scope?: CodeScope;
}

export type CodeLine = readonly CodeToken[];

export type CodeHighlighter = (
  code: string,
  language: string,
) => readonly CodeLine[] | Promise<readonly CodeLine[]>;

/** The lines of a string. A trailing newline is not an extra line. */
export function splitLines(code: string): string[] {
  const lines = code.split(/\r\n|\r|\n/);
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** One unscoped token per line: what the block draws before an engine answers. */
export function plainLines(code: string): CodeLine[] {
  return splitLines(code).map((text) => [{ text }]);
}

/** The text of a line, joined back from its tokens. */
export function lineText(line: CodeLine): string {
  return line.map((token) => token.text).join('');
}

/*
 * ── Prism ────────────────────────────────────────────────────────────────
 *
 * `Prism.tokenize(code, grammar)` gives `(string | Token)[]`, a `Token` being
 * `{ type, content, alias }` where `content` is a string or nested tokens.
 * The standard token names — https://prismjs.com/tokens.html — fold onto the
 * twelve scopes through one table, and `alias` is consulted first, because
 * Prism's own advice for a granular name is to alias it to a standard one.
 */

export interface PrismTokenLike {
  readonly type: string;
  readonly alias?: string | readonly string[] | undefined;
  readonly content: string | PrismTokenLike | readonly (string | PrismTokenLike)[];
}

const PRISM_SCOPES: Readonly<Record<string, CodeScope>> = {
  comment: 'comment',
  prolog: 'comment',
  doctype: 'comment',
  cdata: 'comment',
  keyword: 'keyword',
  'control-flow': 'keyword',
  important: 'keyword',
  atrule: 'keyword',
  rule: 'keyword',
  selector: 'tag',
  string: 'string',
  char: 'string',
  'attr-value': 'string',
  'template-string': 'string',
  regex: 'string',
  url: 'string',
  number: 'number',
  unit: 'number',
  function: 'function',
  'function-name': 'function',
  'class-name': 'type',
  builtin: 'type',
  'maybe-class-name': 'type',
  namespace: 'type',
  variable: 'variable',
  parameter: 'variable',
  property: 'property',
  'property-access': 'property',
  key: 'property',
  symbol: 'property',
  punctuation: 'punctuation',
  operator: 'punctuation',
  tag: 'tag',
  'attr-name': 'attribute',
  'attr-equals': 'punctuation',
  boolean: 'constant',
  constant: 'constant',
  null: 'constant',
  entity: 'constant',
};

function prismScope(token: PrismTokenLike): CodeScope | undefined {
  const aliases = token.alias === undefined ? [] : ([] as string[]).concat(token.alias);
  for (const alias of aliases) {
    const scope = PRISM_SCOPES[alias];
    if (scope) return scope;
  }
  return PRISM_SCOPES[token.type];
}

/**
 * Prism's token stream as lines of scoped text. A token that spans a newline
 * — a block comment, a template string — is split at it, so every line holds
 * only its own text and the block's grid can lay each line out on its own.
 */
export function fromPrismTokens(tokens: readonly (string | PrismTokenLike)[]): CodeLine[] {
  const lines: CodeToken[][] = [[]];

  const push = (text: string, scope: CodeScope | undefined) => {
    const parts = text.split(/\r\n|\r|\n/);
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part !== '')
        lines[lines.length - 1]!.push(scope ? { text: part, scope } : { text: part });
    });
  };

  const walk = (node: string | PrismTokenLike, inherited: CodeScope | undefined) => {
    if (typeof node === 'string') {
      push(node, inherited);
      return;
    }
    const scope = prismScope(node) ?? inherited;
    if (typeof node.content === 'string') {
      push(node.content, scope);
    } else if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child, scope);
    } else {
      walk(node.content as PrismTokenLike, scope);
    }
  };

  for (const token of tokens) walk(token, undefined);
  if (lines.length > 1 && lines[lines.length - 1]!.length === 0) lines.pop();
  return lines;
}

/*
 * ── Shiki ────────────────────────────────────────────────────────────────
 *
 * `codeToTokens(code, { lang, theme, includeExplanation: 'scopeName' })`
 * gives `{ tokens: ThemedToken[][] }`, one array per line, each token
 * `{ content, explanation?: [{ scopes: [{ scopeName }] }] }`. The last
 * TextMate scope of the last explanation is the most specific, and it folds
 * onto the twelve scopes by its leading segments. Without `includeExplanation`
 * Shiki gives a color and no scope, and the mapping leaves the token plain
 * rather than guessing from a color.
 */

export interface ShikiTokenLike {
  readonly content: string;
  readonly explanation?:
    readonly { readonly scopes: readonly { readonly scopeName: string }[] }[] | undefined;
}

const TEXTMATE_SCOPES: readonly (readonly [string, CodeScope])[] = [
  ['comment', 'comment'],
  ['punctuation.definition.comment', 'comment'],
  ['string', 'string'],
  ['constant.numeric', 'number'],
  ['constant.language', 'constant'],
  ['constant.character', 'string'],
  ['constant', 'constant'],
  ['entity.name.function', 'function'],
  ['support.function', 'function'],
  ['meta.function-call', 'function'],
  ['entity.name.type', 'type'],
  ['entity.name.class', 'type'],
  ['entity.name.namespace', 'type'],
  ['support.type', 'type'],
  ['support.class', 'type'],
  ['storage.type', 'keyword'],
  ['storage.modifier', 'keyword'],
  ['keyword.operator', 'punctuation'],
  ['keyword', 'keyword'],
  ['entity.name.tag', 'tag'],
  ['punctuation.definition.tag', 'punctuation'],
  ['entity.other.attribute-name', 'attribute'],
  ['variable.other.property', 'property'],
  ['variable.other.object.property', 'property'],
  ['support.type.property-name', 'property'],
  ['meta.object-literal.key', 'property'],
  ['variable', 'variable'],
  ['punctuation', 'punctuation'],
  ['meta.brace', 'punctuation'],
];

function textMateScope(scopeName: string): CodeScope | undefined {
  for (const [prefix, scope] of TEXTMATE_SCOPES) {
    if (scopeName === prefix || scopeName.startsWith(`${prefix}.`)) return scope;
  }
  return undefined;
}

function shikiScope(token: ShikiTokenLike): CodeScope | undefined {
  const explanations = token.explanation ?? [];
  for (let index = explanations.length - 1; index >= 0; index -= 1) {
    const scopes = explanations[index]!.scopes;
    for (let inner = scopes.length - 1; inner >= 0; inner -= 1) {
      const scope = textMateScope(scopes[inner]!.scopeName);
      if (scope) return scope;
    }
  }
  return undefined;
}

type ShikiLines = readonly (readonly ShikiTokenLike[])[];

export function fromShikiTokens(result: { readonly tokens: ShikiLines } | ShikiLines): CodeLine[] {
  const lines: ShikiLines = 'tokens' in result ? result.tokens : result;
  return lines.map((line) =>
    line
      .filter((token) => token.content !== '')
      .map((token) => {
        const scope = shikiScope(token);
        return scope ? { text: token.content, scope } : { text: token.content };
      }),
  );
}

/*
 * ── Marks ────────────────────────────────────────────────────────────────
 */

export type LineRanges = string | readonly number[];

/**
 * `'1,4-6'` or `[1, 4, 5, 6]` as a set of one-based line numbers. Whitespace
 * is ignored, a reversed range is ordered, and anything that is not a number
 * is skipped rather than thrown, because a mark is decoration and a typo in
 * one is not worth a broken page.
 */
export function parseLineRanges(ranges: LineRanges | null | undefined): ReadonlySet<number> {
  const lines = new Set<number>();
  if (ranges === null || ranges === undefined) return lines;
  if (typeof ranges !== 'string') {
    for (const line of ranges) if (Number.isInteger(line) && line > 0) lines.add(line);
    return lines;
  }
  for (const part of ranges.split(',')) {
    const [from, to] = part.split('-').map((piece) => Number.parseInt(piece.trim(), 10));
    if (from === undefined || Number.isNaN(from)) continue;
    if (to === undefined || Number.isNaN(to)) {
      if (from > 0) lines.add(from);
      continue;
    }
    const [start, end] = from <= to ? [from, to] : [to, from];
    for (let line = Math.max(start, 1); line <= end; line += 1) lines.add(line);
  }
  return lines;
}

export type CodeMark = 'highlight' | 'add' | 'remove' | 'error' | 'warning';

export interface CodeMarks {
  readonly highlight?: LineRanges | undefined;
  readonly add?: LineRanges | undefined;
  readonly remove?: LineRanges | undefined;
  readonly focus?: LineRanges | undefined;
  readonly error?: LineRanges | undefined;
  readonly warning?: LineRanges | undefined;
}

/** Strongest first: a removed line that is also highlighted reads as removed. */
export const CODE_MARK_PRECEDENCE: readonly CodeMark[] = [
  'remove',
  'add',
  'error',
  'warning',
  'highlight',
];

export interface LineMark {
  readonly mark?: CodeMark | undefined;
  /** Outside the focus range, while one exists. */
  readonly dim: boolean;
}

/** One resolved mark per line, by one-based number, for `count` lines. */
export function lineMarks(marks: CodeMarks | null | undefined, count: number): LineMark[] {
  const sets = new Map<CodeMark, ReadonlySet<number>>();
  for (const mark of CODE_MARK_PRECEDENCE) sets.set(mark, parseLineRanges(marks?.[mark]));
  const focus = parseLineRanges(marks?.focus);

  const resolved: LineMark[] = [];
  for (let line = 1; line <= count; line += 1) {
    const mark = CODE_MARK_PRECEDENCE.find((candidate) => sets.get(candidate)!.has(line));
    resolved.push({ mark, dim: focus.size > 0 && !focus.has(line) });
  }
  return resolved;
}

export interface CopyTextOptions {
  /** Keep the lines marked `remove`. Off by default: the code after the change is what a reader pastes. */
  includeRemoved?: boolean | undefined;
}

/** What the copy control puts on the clipboard: the code, never the DOM. */
export function copyText(
  code: string,
  marks: CodeMarks | null | undefined,
  { includeRemoved = false }: CopyTextOptions = {},
): string {
  if (includeRemoved) return code;
  const removed = parseLineRanges(marks?.remove);
  if (removed.size === 0) return code;
  return splitLines(code)
    .filter((_, index) => !removed.has(index + 1))
    .join('\n');
}

/**
 * The leading whitespace of a line in columns, tabs counted at `tabSize`, so a
 * wrapped continuation can be indented to the code's own indent.
 */
export function leadingColumns(text: string, tabSize = 2): number {
  let columns = 0;
  for (const character of text) {
    if (character === ' ') columns += 1;
    else if (character === '\t') columns += tabSize;
    else break;
  }
  return columns;
}

/** The digits the widest line number needs, for the gutter's width. */
export function gutterDigits(count: number, start = 1): number {
  const last = Math.max(start + count - 1, start, 1);
  return String(last).length;
}
