import type { MessageSlots } from './types';

/*
 * The message grammar: a subset of ICU MessageFormat.
 *
 *   {name}                                   the slot, a number in the locale's digits
 *   {name, plural, =0 {…} one {…} other {…}}  exact branch, then Intl.PluralRules, then other
 *   {name, select, copy {…} other {…}}        the branch whose key equals the slot
 *   #                                         inside a plural branch, the number
 *   '{'  '}'  '#'  ''                          a literal brace, hash or apostrophe
 *
 * A branch holds text and simple slots; it does not hold another plural or
 * select. Anything the grammar does not read is written as it stands, so a
 * malformed message shows its own source rather than an empty string.
 */

type Node =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'slot'; readonly name: string; readonly source: string }
  | { readonly kind: 'hash' }
  | {
      readonly kind: 'plural' | 'select';
      readonly name: string;
      readonly source: string;
      readonly branches: ReadonlyMap<string, readonly Node[]>;
    };

interface Parsed {
  readonly nodes: readonly Node[];
  readonly wellFormed: boolean;
}

const parsed = new Map<string, Parsed>();
const numbers = new Map<string, Intl.NumberFormat>();
const plurals = new Map<string, Intl.PluralRules>();

function numberFormat(locale: string): Intl.NumberFormat {
  let format = numbers.get(locale);
  if (format === undefined) numbers.set(locale, (format = new Intl.NumberFormat(locale)));
  return format;
}

function pluralRules(locale: string): Intl.PluralRules {
  let rules = plurals.get(locale);
  if (rules === undefined) plurals.set(locale, (rules = new Intl.PluralRules(locale)));
  return rules;
}

class Parser {
  index = 0;
  /** Set when a brace was written as text because the grammar could not read it. */
  malformed = false;

  constructor(readonly source: string) {}

  /** Nodes up to the end, or up to the `}` that closes a branch when `inBranch`. */
  message(inBranch: 'plural' | 'select' | undefined): Node[] {
    const nodes: Node[] = [];
    let text = '';
    const flush = () => {
      if (text !== '') nodes.push({ kind: 'text', value: text });
      text = '';
    };
    while (this.index < this.source.length) {
      const char = this.source[this.index]!;
      if (char === "'") {
        text += this.quoted();
        continue;
      }
      if (char === '}') {
        if (inBranch !== undefined) break;
        this.malformed = true;
      }
      if (char === '#' && inBranch === 'plural') {
        flush();
        nodes.push({ kind: 'hash' });
        this.index++;
        continue;
      }
      if (char === '{') {
        const start = this.index;
        const argument = this.argument(inBranch === undefined);
        if (argument === undefined) {
          this.malformed = true;
          this.index = start + 1;
          text += '{';
          continue;
        }
        flush();
        nodes.push(argument);
        continue;
      }
      text += char;
      this.index++;
    }
    flush();
    return nodes;
  }

  /** An apostrophe: `''` is one, `'{…'` quotes up to the next lone apostrophe, else it is text. */
  private quoted(): string {
    const next = this.source[this.index + 1];
    if (next === "'") {
      this.index += 2;
      return "'";
    }
    if (next !== '{' && next !== '}' && next !== '#') {
      this.index++;
      return "'";
    }
    this.index++;
    let out = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index]!;
      if (char === "'") {
        if (this.source[this.index + 1] === "'") {
          out += "'";
          this.index += 2;
          continue;
        }
        this.index++;
        return out;
      }
      out += char;
      this.index++;
    }
    return out;
  }

  private whitespace(): void {
    while (/\s/.test(this.source[this.index] ?? '')) this.index++;
  }

  private word(): string {
    const match = /^[^\s{},]+/.exec(this.source.slice(this.index));
    if (match === null) return '';
    this.index += match[0].length;
    return match[0];
  }

  /** `{name}` or `{name, plural|select, …}`, or `undefined` when the braces do not read. */
  private argument(complex: boolean): Node | undefined {
    const start = this.index;
    this.index++;
    this.whitespace();
    const name = this.word();
    if (!/^\w+$/.test(name)) return undefined;
    this.whitespace();
    if (this.source[this.index] === '}') {
      this.index++;
      return { kind: 'slot', name, source: this.source.slice(start, this.index) };
    }
    if (!complex || this.source[this.index] !== ',') return undefined;
    this.index++;
    this.whitespace();
    const kind = this.word();
    if (kind !== 'plural' && kind !== 'select') return undefined;
    this.whitespace();
    if (this.source[this.index] !== ',') return undefined;
    this.index++;
    const branches = new Map<string, readonly Node[]>();
    for (;;) {
      this.whitespace();
      if (this.source[this.index] === '}') {
        this.index++;
        break;
      }
      const key = this.word();
      if (key === '') return undefined;
      this.whitespace();
      if (this.source[this.index] !== '{') return undefined;
      this.index++;
      const body = this.message(kind);
      if (this.source[this.index] !== '}') return undefined;
      this.index++;
      branches.set(key, body);
    }
    if (!branches.has('other')) return undefined;
    return { kind, name, source: this.source.slice(start, this.index), branches };
  }
}

function parse(template: string): Parsed {
  let result = parsed.get(template);
  if (result === undefined) {
    const parser = new Parser(template);
    const nodes = parser.message(undefined);
    result = { nodes, wellFormed: !parser.malformed };
    parsed.set(template, result);
  }
  return result;
}

function write(
  nodes: readonly Node[],
  slots: MessageSlots,
  locale: string,
  count?: number,
): string {
  let out = '';
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
        out += node.value;
        break;
      case 'hash':
        out += count === undefined ? '#' : numberFormat(locale).format(count);
        break;
      case 'slot': {
        const value = slots[node.name];
        out +=
          value === undefined
            ? node.source
            : typeof value === 'number'
              ? numberFormat(locale).format(value)
              : value;
        break;
      }
      case 'plural': {
        const value = slots[node.name];
        if (typeof value !== 'number') {
          out += node.source;
          break;
        }
        const branch =
          node.branches.get(`=${value}`) ??
          node.branches.get(pluralRules(locale).select(value)) ??
          node.branches.get('other')!;
        out += write(branch, slots, locale, value);
        break;
      }
      case 'select': {
        const value = slots[node.name];
        if (typeof value !== 'string') {
          out += node.source;
          break;
        }
        out += write(node.branches.get(value) ?? node.branches.get('other')!, slots, locale);
        break;
      }
    }
  }
  return out;
}

/** A message filled from its slots, in the locale's digits and plural forms. */
export function formatMessage(template: string, slots: MessageSlots, locale: string): string {
  return write(parse(template).nodes, slots, locale);
}

/**
 * Every slot name a message reads, in order of first use, including the names
 * a plural or select branches on. Two translations of one message read the
 * same set.
 */
export function messageSlots(template: string): string[] {
  const names: string[] = [];
  const visit = (nodes: readonly Node[]) => {
    for (const node of nodes) {
      if (node.kind === 'text' || node.kind === 'hash') continue;
      if (!names.includes(node.name)) names.push(node.name);
      if (node.kind === 'plural' || node.kind === 'select') node.branches.forEach(visit);
    }
  };
  visit(parse(template).nodes);
  return names;
}

/** Whether the grammar reads every brace of a message; a stray one would be written as text. */
export function isWellFormed(template: string): boolean {
  return parse(template).wellFormed;
}
