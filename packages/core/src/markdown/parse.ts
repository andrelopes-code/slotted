/**
 * A CommonMark subset read into mdast, for a source that arrives as text — a
 * language model's answer — with no parser of the consumer's own.
 *
 * Blocks: paragraphs, ATX headings, fenced code, block quotes, thematic
 * breaks, GFM tables, and bullet and ordered lists nested by indentation.
 * Inline: code spans, strong, emphasis, links, backslash escapes and hard
 * breaks. A construct whose mdast type is outside `allow` is not recognized,
 * so its syntax stays in the text. Anything else — images, HTML, reference
 * links, footnotes, setext headings, indented code — is text too; remark or
 * marked through `fromMarkedTokens` read the whole of CommonMark and GFM.
 */

import { MARKDOWN_TYPES } from './markdown';
import type { MarkdownNode } from './markdown';

export interface ParseMarkdownOptions {
  /** The mdast types whose syntax is read. Defaults to the family's own default allowlist. */
  readonly allow?: readonly string[] | undefined;
}

type Allowed = (type: string) => boolean;

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\s]*)[ \t]*(.*)$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])(?:([ \t]+)(.*)|$)/;
const DELIMITER = /^:?-+:?$/;

export function parseMarkdown(source: string, options: ParseMarkdownOptions = {}): MarkdownNode {
  const allow = new Set(options.allow ?? MARKDOWN_TYPES);
  const allowed: Allowed = (type) => allow.has(type);
  return { type: 'root', children: blocks(source.replace(/\r\n?/g, '\n').split('\n'), allowed) };
}

const blank = (line: string) => line.trim() === '';

/**
 * The cells of a table row: split on every pipe a backslash does not escape,
 * without the pipes that open and close the row, and with `\|` read as `|`.
 */
function cells(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] as string;
    if (char === '\\' && line[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (char === '|') {
      out.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  out.push(cell);
  if (line.trimStart().startsWith('|')) out.shift();
  if (/(?:^|[^\\])\|[ \t]*$/.test(line)) out.pop();
  return out.map((part) => part.trim());
}

/** The alignment of each column when `lines[index]` opens a table, or `null`. */
function tableAt(
  lines: readonly string[],
  index: number,
): ('left' | 'right' | 'center' | null)[] | null {
  const header = lines[index];
  const delimiter = lines[index + 1];
  if (header === undefined || delimiter === undefined) return null;
  if (!header.includes('|') || !delimiter.includes('|')) return null;
  const marks = cells(delimiter);
  if (!marks.every((mark) => DELIMITER.test(mark))) return null;
  if (cells(header).length !== marks.length) return null;
  return marks.map((mark) =>
    mark.startsWith(':') && mark.endsWith(':')
      ? 'center'
      : mark.startsWith(':')
        ? 'left'
        : mark.endsWith(':')
          ? 'right'
          : null,
  );
}

/** Whether a line opens a block that ends the paragraph above it. */
function interrupts(line: string, allowed: Allowed): boolean {
  if (allowed('code') && FENCE.test(line)) return true;
  if (allowed('heading') && HEADING.test(line)) return true;
  if (allowed('thematicBreak') && RULE.test(line)) return true;
  if (allowed('blockquote') && QUOTE.test(line)) return true;
  const item = allowed('list') ? ITEM.exec(line) : null;
  /* CommonMark: an ordered list interrupts a paragraph only from 1, and an empty item never does. */
  return (
    item !== null &&
    item[4] !== undefined &&
    item[4].trim() !== '' &&
    /^(?:[-*+]|1[.)])$/.test(item[2] ?? '')
  );
}

function blocks(lines: readonly string[], allowed: Allowed): MarkdownNode[] {
  const out: MarkdownNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] as string;
    if (blank(line)) {
      index += 1;
      continue;
    }

    const fence = allowed('code') ? FENCE.exec(line) : null;
    if (fence) {
      const mark = fence[1] as string;
      const body: string[] = [];
      index += 1;
      while (index < lines.length) {
        const next = lines[index] as string;
        const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(next);
        if (
          close &&
          (close[1] as string)[0] === mark[0] &&
          (close[1] as string).length >= mark.length
        ) {
          index += 1;
          break;
        }
        body.push(next);
        index += 1;
      }
      out.push({
        type: 'code',
        lang: fence[2] || null,
        meta: fence[3] || null,
        value: body.join('\n'),
      });
      continue;
    }

    const heading = allowed('heading') ? HEADING.exec(line) : null;
    if (heading) {
      out.push({
        type: 'heading',
        depth: (heading[1] as string).length,
        children: inline(heading[2] ?? '', allowed),
      });
      index += 1;
      continue;
    }

    if (allowed('thematicBreak') && RULE.test(line)) {
      out.push({ type: 'thematicBreak' });
      index += 1;
      continue;
    }

    if (allowed('blockquote') && QUOTE.test(line)) {
      const body: string[] = [];
      /* shortcut: no lazy continuation — every line of a quote carries its `>`. */
      while (index < lines.length && QUOTE.test(lines[index] as string)) {
        body.push((lines[index] as string).replace(QUOTE, ''));
        index += 1;
      }
      out.push({ type: 'blockquote', children: blocks(body, allowed) });
      continue;
    }

    const item = allowed('list') ? ITEM.exec(line) : null;
    if (item) {
      index = list(lines, index, allowed, out);
      continue;
    }

    const align = allowed('table') ? tableAt(lines, index) : null;
    if (align) {
      /* GFM: a short row takes empty cells, and a long one drops the excess. */
      const row = (source: string): MarkdownNode => ({
        type: 'tableRow',
        children: align.map((_, column) => ({
          type: 'tableCell',
          children: inline(cells(source)[column] ?? '', allowed),
        })),
      });
      const rows = [row(line)];
      index += 2;
      while (
        index < lines.length &&
        !blank(lines[index] as string) &&
        !interrupts(lines[index] as string, allowed)
      ) {
        rows.push(row(lines[index] as string));
        index += 1;
      }
      out.push({ type: 'table', align, children: rows });
      continue;
    }

    const body: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      !blank(lines[index] as string) &&
      !interrupts(lines[index] as string, allowed) &&
      !(allowed('table') && tableAt(lines, index))
    ) {
      body.push(lines[index] as string);
      index += 1;
    }
    out.push({
      type: 'paragraph',
      children: inline(body.map((part) => part.replace(/^[ \t]+/, '')).join('\n'), allowed),
    });
  }
  return out;
}

/** Reads the list that starts at `start` into `out` and returns the index after it. */
function list(
  lines: readonly string[],
  start: number,
  allowed: Allowed,
  out: MarkdownNode[],
): number {
  const first = ITEM.exec(lines[start] as string) as RegExpExecArray;
  const marker = first[2] as string;
  const ordered = /\d/.test(marker);
  const delimiter = marker.slice(-1);
  const sameKind = (other: string) =>
    ordered ? /\d/.test(other) && other.slice(-1) === delimiter : other === marker;

  const items: string[][] = [];
  let index = start;
  let spread = false;
  while (index < lines.length) {
    const match = ITEM.exec(lines[index] as string);
    if (!match || !sameKind(match[2] as string)) break;
    const gap = (match[3] ?? ' ').length;
    /* A gap of five or more is a gap of one followed by indented content. */
    const indent = (match[1] as string).length + (match[2] as string).length + (gap > 4 ? 1 : gap);
    const body = [
      match[4] === undefined ? '' : gap > 4 ? ' '.repeat(gap - 1) + match[4] : match[4],
    ];
    index += 1;
    let blanks = 0;
    while (index < lines.length) {
      const next = lines[index] as string;
      if (blank(next)) {
        blanks += 1;
        body.push('');
        index += 1;
        continue;
      }
      const leading = (/^ */.exec(next) as RegExpExecArray)[0].length;
      if (leading >= indent) {
        /* A blank line between two blocks of one item makes the list loose. */
        if (blanks > 0) spread = true;
        blanks = 0;
        body.push(next.slice(indent));
        index += 1;
        continue;
      }
      /* A lazy line continues the item's paragraph. */
      if (blanks === 0 && !interrupts(next, allowed) && !ITEM.test(next)) {
        body.push(next.trimStart());
        index += 1;
        continue;
      }
      break;
    }
    while (body.length > 0 && body.at(-1) === '') body.pop();
    items.push(body);
    if (blanks > 0) {
      const next = lines[index];
      const match = next === undefined ? null : ITEM.exec(next);
      if (!match || !sameKind(match[2] as string)) break;
      spread = true;
    }
  }

  out.push({
    type: 'list',
    ordered,
    start: ordered ? Number.parseInt(marker, 10) : null,
    spread,
    children: items.map((body) => ({
      type: 'listItem',
      spread: false,
      checked: null,
      children: blocks(body, allowed),
    })),
  });
  return index;
}

const PUNCTUATION = /[!-/:-@[-`{-~]/;
const SPACE = /\s/;
const WORD = /[\p{L}\p{N}]/u;

function inline(source: string, allowed: Allowed): MarkdownNode[] {
  const out: MarkdownNode[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer !== '') out.push({ type: 'text', value: buffer });
    buffer = '';
  };
  const push = (node: MarkdownNode) => {
    flush();
    out.push(node);
  };

  let index = 0;
  while (index < source.length) {
    const char = source[index] as string;

    if (char === '\\') {
      const next = source[index + 1];
      if (next === '\n' && allowed('break')) {
        push({ type: 'break' });
        index += 2;
        continue;
      }
      if (next !== undefined && PUNCTUATION.test(next)) {
        buffer += next;
        index += 2;
        continue;
      }
    }

    if (char === '\n') {
      const trailing = /( {2,})$/.exec(buffer);
      if (trailing && allowed('break')) {
        buffer = buffer.slice(0, -trailing[1]!.length);
        push({ type: 'break' });
      } else {
        buffer = buffer.replace(/ +$/, '') + '\n';
      }
      index += 1;
      continue;
    }

    if (char === '`') {
      const run = (/^`+/.exec(source.slice(index)) as RegExpExecArray)[0];
      const close = codeClose(source, index + run.length, run.length);
      if (close !== -1 && allowed('inlineCode')) {
        let value = source.slice(index + run.length, close).replace(/\n/g, ' ');
        if (value.startsWith(' ') && value.endsWith(' ') && value.trim() !== '')
          value = value.slice(1, -1);
        push({ type: 'inlineCode', value });
        index = close + run.length;
        continue;
      }
      /* An unmatched run is literal, and so is everything a matched one would have held. */
      buffer += close === -1 ? run : source.slice(index, close + run.length);
      index = close === -1 ? index + run.length : close + run.length;
      continue;
    }

    if (char === '[' && allowed('link')) {
      const link = readLink(source, index);
      if (link) {
        push({
          type: 'link',
          url: link.url,
          title: link.title,
          children: inline(link.label, allowed),
        });
        index = link.end;
        continue;
      }
    }

    if (char === '*' || char === '_') {
      const run = (new RegExp(`^\\${char}+`).exec(source.slice(index)) as RegExpExecArray)[0];
      const emphasis = readEmphasis(source, index, run.length, char, allowed);
      if (emphasis) {
        push(emphasis.node);
        index = emphasis.end;
        continue;
      }
      buffer += run;
      index += run.length;
      continue;
    }

    buffer += char;
    index += 1;
  }
  flush();
  return out;
}

/** Where the backtick run of exactly `length` that closes a code span starts, or -1. */
function codeClose(source: string, from: number, length: number): number {
  let index = from;
  while (index < source.length) {
    if (source[index] === '`') {
      const run = (/^`+/.exec(source.slice(index)) as RegExpExecArray)[0];
      if (run.length === length) return index;
      index += run.length;
    } else index += 1;
  }
  return -1;
}

function readLink(
  source: string,
  start: number,
): { label: string; url: string; title: string | null; end: number } | null {
  let depth = 0;
  let index = start;
  for (; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') index += 1;
    else if (char === '`') {
      const run = (/^`+/.exec(source.slice(index)) as RegExpExecArray)[0];
      const close = codeClose(source, index + run.length, run.length);
      if (close !== -1) index = close + run.length - 1;
    } else if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  if (depth !== 0 || source[index + 1] !== '(') return null;
  const label = source.slice(start + 1, index);
  const rest = source.slice(index + 2);
  const destination =
    /^[ \t\n]*(?:<([^<>\n]*)>|((?:[^\s()\\]|\\.|\((?:[^\s()\\]|\\.)*\))*))(?:[ \t\n]+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))?[ \t\n]*\)/.exec(
      rest,
    );
  if (!destination) return null;
  const url = (destination[1] ?? destination[2] ?? '').replace(/\\([!-/:-@[-`{-~])/g, '$1');
  const title = destination[3]
    ? destination[3].slice(1, -1).replace(/\\([!-/:-@[-`{-~])/g, '$1')
    : null;
  return { label, url, title, end: index + 2 + destination[0].length };
}

/**
 * Emphasis and strong by matching runs: an opener run of one, two or three
 * delimiters closes on the next run of the same character and length, read
 * past code spans and escapes. A run is an opener when the character after it
 * is not a space, and a closer when the one before it is not; `_` also
 * refuses to open or close inside a word, so `snake_case` stays text.
 * shortcut: not CommonMark's delimiter stack — runs of unequal length
 * (`**a*`) and the rule of three stay text; upgrade to the stack if a consumer
 * meets one in a real answer.
 */
function readEmphasis(
  source: string,
  start: number,
  length: number,
  char: string,
  allowed: Allowed,
): { node: MarkdownNode; end: number } | null {
  if (length > 3) return null;
  const types = length === 1 ? ['emphasis'] : length === 2 ? ['strong'] : ['emphasis', 'strong'];
  if (!types.every(allowed)) return null;
  const after = source[start + length];
  const before = source[start - 1];
  if (after === undefined || SPACE.test(after)) return null;
  if (char === '_' && before !== undefined && WORD.test(before)) return null;

  let index = start + length;
  while (index < source.length) {
    const current = source[index];
    if (current === '\\') {
      index += 2;
      continue;
    }
    if (current === '`') {
      const run = (/^`+/.exec(source.slice(index)) as RegExpExecArray)[0];
      const close = codeClose(source, index + run.length, run.length);
      index = close === -1 ? index + run.length : close + run.length;
      continue;
    }
    if (current === char) {
      const run = (new RegExp(`^\\${char}+`).exec(source.slice(index)) as RegExpExecArray)[0];
      const previous = source[index - 1] as string;
      const next = source[index + run.length];
      const closes =
        run.length === length &&
        !SPACE.test(previous) &&
        !(char === '_' && next !== undefined && WORD.test(next));
      if (closes) {
        const children = inline(source.slice(start + length, index), allowed);
        const node: MarkdownNode =
          length === 3
            ? { type: 'emphasis', children: [{ type: 'strong', children }] }
            : { type: types[0] as string, children };
        return { node, end: index + run.length };
      }
      index += run.length;
      continue;
    }
    index += 1;
  }
  return null;
}
