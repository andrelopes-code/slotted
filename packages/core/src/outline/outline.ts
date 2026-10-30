/**
 * The headings of a region, as a tree a table of contents can draw.
 *
 * Two ways in, one shape out. `collectOutline` reads the headings a region
 * holds — `h1` to `h6`, between two levels, in document order — and writes an
 * `id` on each one that has none, because a link needs somewhere to go.
 * `nestOutline` takes a flat list with a level on each entry, which is what a
 * Markdown pipeline hands over (Docusaurus' `toc`, Mantine's `data`), and
 * folds it into the same tree. A binding draws the tree and never asks which
 * way it came.
 *
 * Nothing here observes anything. Which heading is in view is
 * `@slotted/core/scroll-spy`'s question.
 */

export interface OutlineEntry {
  /** The target's id, and the value a table of contents holds for it. */
  id: string;
  /** The text of the link. */
  label: string;
  /** 1 to 6: the heading's own level, or the depth a flat list stated. */
  level: number;
  /** The heading, when the entry was read from the DOM. */
  element?: HTMLElement;
  children: OutlineEntry[];
}

export interface OutlineSource {
  id?: string | null | undefined;
  label: string;
  level: number;
}

export interface CollectOutlineOptions {
  /** The lowest and highest heading level to keep, inclusive. Both 1 to 6; `[2, 3]` by default. */
  levels?: readonly [number, number];
  /** A heading matching this selector, or inside an element matching it, is left out. */
  exclude?: string;
}

export const DEFAULT_LEVELS: readonly [number, number] = [2, 3];

/** The longest id derived from a heading's text. */
export const SLUG_LENGTH = 64;

/**
 * An id from a heading's text: lower case, letters and digits of any script
 * that has a lower case, hyphens between words, at most `SLUG_LENGTH`
 * characters. Diacritics are stripped, so `Königsallee tours` becomes
 * `konigsallee-tours` and a link to it survives a keyboard without them.
 * A text that leaves nothing — punctuation only, or a script the rule cannot
 * fold — gives an empty string, and the caller names the section by its
 * number instead.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_LENGTH)
    .replace(/-+$/, '');
}

/** A heading's level from its tag, or `null` for an element that is not one. */
export function headingLevel(element: Element): number | null {
  const match = /^h([1-6])$/i.exec(element.tagName);
  return match === null ? null : Number(match[1]);
}

/**
 * Gives every entry an id nobody else in the document holds. An id the
 * heading already carries is never rewritten: it may be the target of a link
 * written elsewhere. A generated one is the slug, then the slug with `-2`,
 * `-3`, and `section-<n>` when the text left no slug at all.
 */
function assignIds(entries: { id: string; label: string; element: HTMLElement }[], doc: Document) {
  const taken = new Set<string>();
  for (const entry of entries) if (entry.id !== '') taken.add(entry.id);

  let unnamed = 0;
  for (const entry of entries) {
    if (entry.id !== '') continue;
    const base = slugify(entry.label);
    let candidate = base;
    if (candidate === '') {
      unnamed += 1;
      candidate = `section-${unnamed}`;
    }
    for (let n = 2; taken.has(candidate) || doc.getElementById(candidate) !== null; n += 1) {
      candidate = `${base === '' ? 'section' : base}-${n}`;
    }
    taken.add(candidate);
    entry.id = candidate;
    entry.element.id = candidate;
  }
}

/**
 * Folds a list in document order into a tree by level. An entry whose level
 * is deeper than the one before it becomes its child; a gap in the ladder —
 * an `h4` straight under an `h2` — is closed rather than reported, so a
 * document whose author skipped a level still lists every heading.
 */
export function nestOutline(flat: readonly OutlineSource[]): OutlineEntry[] {
  const roots: OutlineEntry[] = [];
  const stack: OutlineEntry[] = [];
  for (const source of flat) {
    const entry: OutlineEntry = {
      id: source.id ?? '',
      label: source.label,
      level: source.level,
      children: [],
    };
    while (stack.length > 0 && (stack[stack.length - 1] as OutlineEntry).level >= entry.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent === undefined) roots.push(entry);
    else parent.children.push(entry);
    stack.push(entry);
  }
  return roots;
}

/**
 * The headings under `root` between `levels`, as a tree, each with an id.
 *
 * A heading inside `exclude`, or matching it, is left out: a heading inside
 * a card's own title, a heading the author marked `data-toc-ignore`. A
 * heading with no text is left out as well, because a link with no name is
 * a link nobody can choose.
 */
export function collectOutline(root: Element, options: CollectOutlineOptions = {}): OutlineEntry[] {
  const [min, max] = options.levels ?? DEFAULT_LEVELS;
  const found: { id: string; label: string; level: number; element: HTMLElement }[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')) {
    const level = headingLevel(element);
    if (level === null || level < min || level > max) continue;
    if (options.exclude !== undefined && element.closest(options.exclude) !== null) continue;
    const label = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (label === '') continue;
    found.push({ id: element.id, label, level, element });
  }
  assignIds(found, root.ownerDocument);
  const tree = nestOutline(found);
  /* The elements ride along: nestOutline reads only id, label and level. */
  const byId = new Map(found.map((entry) => [entry.id, entry.element]));
  const attach = (entries: OutlineEntry[]) => {
    for (const entry of entries) {
      const element = byId.get(entry.id);
      if (element !== undefined) entry.element = element;
      attach(entry.children);
    }
  };
  attach(tree);
  return tree;
}

/** Every entry of a tree in document order, for the spy and the keyboard. */
export function flattenOutline(entries: readonly OutlineEntry[]): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  const walk = (list: readonly OutlineEntry[]) => {
    for (const entry of list) {
      out.push(entry);
      walk(entry.children);
    }
  };
  walk(entries);
  return out;
}
