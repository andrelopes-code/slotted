import { FIXED_TEXT } from './render.ts';
import type { FamilyInput } from './types.ts';

export interface TraceStrings {
  /** Every input value, whitespace collapsed. */
  values: ReadonlySet<string>;
  /** Every line of every multi-line input value, as written. */
  lines: ReadonlySet<string>;
}

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

/** Every string an input reaches: values, object keys, and primitives written as text. */
export function collectStrings(input: FamilyInput): TraceStrings {
  const values = new Set<string>();
  const lines = new Set<string>();
  const visit = (node: unknown): void => {
    if (typeof node === 'string') {
      values.add(normalize(node));
      for (const line of node.split('\n')) lines.add(line);
    } else if (typeof node === 'number' || typeof node === 'boolean') {
      values.add(String(node));
    } else if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node !== null && typeof node === 'object' && !(node instanceof Map)) {
      for (const [key, value] of Object.entries(node)) {
        values.add(key);
        visit(value);
      }
    }
  };
  visit({ ...input, verdicts: undefined });
  return { values, lines };
}

const FIXED_LINES = new Set<string>([
  '',
  FIXED_TEXT.indexLink,
  FIXED_TEXT.label.example,
  FIXED_TEXT.label.excerpt,
  ...FIXED_TEXT.sections.map((section) => `## ${section}`),
  ...Object.values(FIXED_TEXT.headers).map((header) => `| ${header.join(' | ')} |`),
]);

const FIXED_CELLS = new Set<string>([
  FIXED_TEXT.none,
  FIXED_TEXT.required.true,
  FIXED_TEXT.required.false,
]);

/** The text inside a run of code spans (`a`, `b`), or the text itself. */
function fragments(text: string): string[] {
  const spans = /^(?:``? ?[^`]+? ?``?(?:, |$))+$/.test(text)
    ? [...text.matchAll(/(``?) ?([^`]+?) ?\1/g)]
    : [];
  return spans.length > 0 ? spans.map((match) => match[2]!) : [text];
}

function traceable(text: string, strings: TraceStrings): boolean {
  return fragments(text).every((fragment) => strings.values.has(normalize(fragment)));
}

/** Lines of rendered Markdown that are neither fixed text nor a copy of an input value. */
export function untraceableLines(content: string, strings: TraceStrings): string[] {
  const failures: string[] = [];
  let fenceClose: string | null = null;

  for (const line of content.split('\n')) {
    if (fenceClose !== null) {
      if (line === fenceClose) fenceClose = null;
      else if (!strings.lines.has(line)) failures.push(line);
      continue;
    }
    const opener = /^(`{3,})[a-z]*$/.exec(line);
    if (opener !== null) {
      fenceClose = opener[1]!;
      continue;
    }
    if (FIXED_LINES.has(line) || /^\|( --- \|)+$/.test(line)) continue;

    const heading = /^#{1,3} (.+)$/.exec(line);
    const lead = /^`data-ui="([^"]+)"` · (.+)$/.exec(line);
    const angular = /^(?:Selector: (`[^`]+`))?(?: · )?(?:exportAs: (`[^`]+`))?$/.exec(line);
    const link =
      /^See \[([a-z0-9-]+)\.(examples|props|events|anatomy)\.md\]\(\.\/\1\.\2\.md\)\.$/.exec(line);

    let ok: boolean;
    if (heading !== null) ok = traceable(heading[1]!, strings);
    else if (lead !== null) ok = traceable(lead[1]!, strings) && traceable(lead[2]!, strings);
    else if (angular !== null)
      ok = [angular[1], angular[2]].every((part) => part === undefined || traceable(part, strings));
    else if (link !== null) ok = traceable(link[1]!, strings);
    else if (line.startsWith('- ')) ok = traceable(line.slice(2), strings);
    else if (line.startsWith('| ')) {
      const cells = line
        .slice(2, -2)
        .split(/ (?<!\\)\| /)
        .map((value) => value.replace(/\\\|/g, '|'));
      ok = cells.every((value) => FIXED_CELLS.has(value) || traceable(value, strings));
    } else ok = traceable(line, strings);

    if (!ok) failures.push(line);
  }
  return failures;
}
