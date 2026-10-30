/**
 * Which commands a palette shows, in which order, under which headings.
 *
 * A command palette is two bindings drawing one list, and the list is decided
 * by five values at once: the items, the query, the page the reader has opened,
 * the ids they ran recently, and the ranker. Deciding it in React and again in
 * Angular would be two orderings with no test able to prove they agree, which
 * is the argument that put `moveIndex` and `createFilter` in this package.
 *
 * Nothing here touches the DOM or a framework. An item is data — `id`, `label`,
 * `keywords` — because the ranker scores values, and a family that read the
 * rendered text would rank what it had just painted.
 */

import type { FilterOptions } from '../collection/filter';
import { createRanker } from '../collection/filter';

export interface CommandItem {
  /** Stable, unique across every page. It is what `recent` and `pages` hold. */
  readonly id: string;
  readonly label: string;
  /** Words the ranker also answers to, never shown. */
  readonly keywords?: readonly string[] | undefined;
  readonly description?: string | undefined;
  /** The id of a group in `groups`, or a heading of its own. */
  readonly group?: string | undefined;
  readonly disabled?: boolean | undefined;
  /** An item that opens a page: its children are the page's items. */
  readonly children?: readonly CommandItem[] | undefined;
}

export interface CommandGroup {
  readonly id: string;
  readonly label: string;
}

/** How well an item answers a query, or `null` when it does not. */
export type CommandRanker<T extends CommandItem = CommandItem> = (
  item: T,
  query: string,
) => number | null;

export interface CommandSection<T extends CommandItem = CommandItem> {
  /** The group's id, or `null` for the ungrouped tail and for the recents. */
  readonly id: string | null;
  readonly label: string | undefined;
  /** The section the recents make, which the family draws first and labels itself. */
  readonly recent: boolean;
  readonly items: readonly T[];
}

export interface CommandTrailEntry {
  readonly id: string;
  readonly label: string;
}

export interface ResolveCommandsInput<T extends CommandItem = CommandItem> {
  readonly items: readonly T[];
  readonly query: string;
  /** The ids of the pages the reader has opened, oldest first. */
  readonly pages?: readonly string[] | undefined;
  /** The ids the reader ran recently, newest first. */
  readonly recent?: readonly string[] | undefined;
  /** The headings and their order. A group not listed here is drawn after them. */
  readonly groups?: readonly CommandGroup[] | undefined;
  /**
   * The adapter. `undefined` takes the package's own ranker; `null` shows the
   * items as they came, for a list a server has already ranked.
   */
  readonly rank?: CommandRanker<T> | null | undefined;
  /** How many rows to draw at most. */
  readonly limit?: number | undefined;
}

export interface ResolvedCommands<T extends CommandItem = CommandItem> {
  readonly sections: readonly CommandSection<T>[];
  /** Every item drawn, in reading order — what the keyboard walks. */
  readonly rows: readonly T[];
  readonly count: number;
  /** The pages that were found, oldest first, for the trail. */
  readonly trail: readonly CommandTrailEntry[];
}

/**
 * The default adapter, over the same collator `createFilter` uses. Built once
 * by the caller and kept, because an `Intl.Collator` is not free.
 */
export function createCommandRanker<T extends CommandItem = CommandItem>(
  options: FilterOptions = {},
): CommandRanker<T> {
  const rank = createRanker(options);
  return (item, query) => rank(query, item.label, item.keywords ?? []);
}

/**
 * The page the trail names, walked from the root. A page that is not found —
 * its children have not arrived, or the items changed under it — ends the
 * walk where the last page was found, so the trail never names a page that
 * does not exist.
 */
export function findPage<T extends CommandItem>(
  items: readonly T[],
  pages: readonly string[],
): { items: readonly T[]; trail: CommandTrailEntry[] } {
  let current = items;
  const trail: CommandTrailEntry[] = [];
  for (const id of pages) {
    const page = current.find((item) => item.id === id);
    if (page === undefined || page.children === undefined) break;
    trail.push({ id: page.id, label: page.label });
    current = page.children as readonly T[];
  }
  return { items: current, trail };
}

/** `id` moved to the front, and the list cut at `limit`. */
export function pushRecent(recent: readonly string[], id: string, limit: number): string[] {
  const next = [id, ...recent.filter((entry) => entry !== id)];
  return next.slice(0, Math.max(0, limit));
}

interface Scored<T> {
  item: T;
  score: number;
  index: number;
}

export function resolveCommands<T extends CommandItem>({
  items,
  query,
  pages = [],
  recent = [],
  groups = [],
  rank,
  limit,
}: ResolveCommandsInput<T>): ResolvedCommands<T> {
  const page = findPage(items, pages);
  const trimmed = query.trim();
  const ranker = rank === undefined ? createCommandRanker<T>() : rank;

  /* Score, or keep, every item of the page. */
  const scored: Scored<T>[] = [];
  page.items.forEach((item, index) => {
    if (trimmed === '' || ranker === null) {
      scored.push({ item, score: 0, index });
      return;
    }
    const score = ranker(item, trimmed);
    if (score !== null) scored.push({ item, score, index });
  });

  /* Within a group by score, ties by the consumer's order. */
  if (trimmed !== '' && ranker !== null) {
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
  }

  /* The recents open the list only at the root, with nothing typed. */
  const sections: CommandSection<T>[] = [];
  const seen = new Set<string>();
  if (trimmed === '' && page.trail.length === 0 && recent.length > 0) {
    const recents: T[] = [];
    for (const id of recent) {
      const found = page.items.find((item) => item.id === id);
      if (found !== undefined && !recents.includes(found)) recents.push(found);
    }
    if (recents.length > 0) {
      sections.push({ id: null, label: undefined, recent: true, items: recents });
      for (const item of recents) seen.add(item.id);
    }
  }

  /* Bucket by group, keeping each bucket's own order. */
  const buckets = new Map<string | null, Scored<T>[]>();
  for (const entry of scored) {
    if (seen.has(entry.item.id)) continue;
    const key = entry.item.group ?? null;
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [entry]);
    else bucket.push(entry);
  }

  /* Order the groups: as declared without a query, by their best item with one. */
  const declared = new Map(groups.map((group) => [group.id, group.label]));
  let keys = [...buckets.keys()];
  if (trimmed !== '' && ranker !== null) {
    const best = (key: string | null) => buckets.get(key)?.[0]?.score ?? -1;
    keys.sort((a, b) => best(b) - best(a));
  } else {
    const order = (key: string | null) => {
      if (key === null) return groups.length + 1;
      const at = groups.findIndex((group) => group.id === key);
      return at === -1 ? groups.length : at;
    };
    keys.sort((a, b) => order(a) - order(b));
  }
  /* The ungrouped tail stays last whatever the scores say: a heading is what
     tells a reader where they are, and a nameless block above a named one
     reads as a heading that was forgotten. */
  keys = [...keys.filter((key) => key !== null), ...keys.filter((key) => key === null)];

  for (const key of keys) {
    const bucket = buckets.get(key) ?? [];
    sections.push({
      id: key,
      label: key === null ? undefined : (declared.get(key) ?? key),
      recent: false,
      items: bucket.map((entry) => entry.item),
    });
  }

  /* The cap, applied across sections in reading order. */
  let rows = sections.flatMap((section) => section.items);
  let capped = sections;
  if (limit !== undefined && limit >= 0 && rows.length > limit) {
    let left = limit;
    capped = [];
    for (const section of sections) {
      if (left <= 0) break;
      const kept = section.items.slice(0, left);
      left -= kept.length;
      capped.push({ ...section, items: kept });
    }
    rows = capped.flatMap((section) => section.items);
  }

  return { sections: capped, rows, count: rows.length, trail: page.trail };
}
