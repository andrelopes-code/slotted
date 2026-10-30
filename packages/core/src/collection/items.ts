/**
 * What a collection of options is made of, resolved once for every family that
 * has one.
 *
 * `listbox`, `select`, `combobox`, `multi-select`, `tree` and `table` all ask
 * the same six questions of the same data — what is this item's key, what is
 * its label, is it disabled, which section is it in, where does it sit in the
 * set, and how large is the set — and six copies of the answers would be six
 * chances for two families to disagree about what a key is.
 *
 * ── Two index spaces, named apart ─────────────────────────────────────────
 *
 * A grouped collection has more rows than options: a section label is a row and
 * is not an option. Keeping one number for both is the defect that makes a
 * windowed, grouped list drift — the window counts rows and the keyboard counts
 * options. So every option carries both: `index` is its place among the
 * options, and `row` is its place among the rows.
 *
 * Nothing here touches the DOM or a framework.
 */

/** One group of options, with the name the pattern requires of it. */
export interface CollectionSection<T> {
  /** Stable across renders. It names the group's label element. */
  key: string;
  /** The group's accessible name. A group without one is a group nobody hears. */
  label?: string | undefined;
  items: readonly T[];
}

export interface CollectionOptions<T> {
  /** A flat collection. Mutually exclusive with `sections`. */
  items?: readonly T[] | undefined;
  /** A grouped collection. Mutually exclusive with `items`. */
  sections?: readonly CollectionSection<T>[] | undefined;
  /** The identity that survives a reorder. It is a string, always. */
  getKey: (item: T, index: number) => string;
  /**
   * What the reader sees and what typeahead matches. Defaults to the key, which
   * is wrong often enough that a family passing nothing is worth noticing, and
   * harmless enough that it never throws.
   */
  getLabel?: ((item: T) => string) | undefined;
  isDisabled?: ((item: T) => boolean) | undefined;
  /**
   * How large the set is, when more of it exists than has been loaded.
   *
   * The Listbox pattern requires `aria-setsize` and `aria-posinset` exactly
   * when "the complete set of available options is not present in the DOM due
   * to dynamic loading", and this is the only place that number can come from:
   * the collection knows what it holds and the consumer knows what it has.
   */
  totalCount?: number | undefined;
}

export interface CollectionOption<T> {
  key: string;
  label: string;
  item: T;
  /** Its place among the options, which is what the keyboard counts. */
  index: number;
  /** Its place among the rows, which is what the window counts. */
  row: number;
  disabled: boolean;
  /** The key of the section holding it, or `undefined` in a flat collection. */
  section: string | undefined;
}

export interface CollectionSectionInfo {
  key: string;
  label: string | undefined;
  /** The row the label occupies. */
  row: number;
  /** The first and last option index in the section, or -1 when it holds none. */
  firstIndex: number;
  lastIndex: number;
}

export type CollectionRow<T> =
  | { kind: 'section-label'; row: number; section: CollectionSectionInfo }
  | { kind: 'option'; row: number; option: CollectionOption<T> };

export interface Collection<T> {
  readonly rows: readonly CollectionRow<T>[];
  readonly options: readonly CollectionOption<T>[];
  readonly sections: readonly CollectionSectionInfo[];
  /** Option keys in order. The canonical order every selection is sorted into. */
  readonly keys: readonly string[];
  /** Option labels in order, which is what `@slotted/core/typeahead` takes. */
  readonly labels: readonly string[];
  /** What `aria-setsize` reports: the whole set, loaded or not. */
  readonly setSize: number;
  /** Whether more of the set exists than this collection holds. */
  readonly partial: boolean;
  indexOf: (key: string) => number;
  keyAt: (index: number) => string | undefined;
  optionAt: (index: number) => CollectionOption<T> | undefined;
  optionFor: (key: string) => CollectionOption<T> | undefined;
  isDisabled: (key: string) => boolean;
  /** What `aria-posinset` reports, one-based, or -1 for a key not held. */
  posInSet: (key: string) => number;
}

/**
 * A collection over a flat list or a grouped one.
 *
 * A duplicate key is not silently tolerated: the second option carrying a key
 * the collection already holds keeps its place in the rows and is refused a
 * place in the index, so `indexOf` answers the first. Two options that select
 * each other is the defect a `Map` built from the last writer produces, and it
 * only ever appears in a consumer's data rather than in a demo.
 */
export function createCollection<T>({
  items,
  sections,
  getKey,
  getLabel,
  isDisabled,
  totalCount,
}: CollectionOptions<T>): Collection<T> {
  const rows: CollectionRow<T>[] = [];
  const options: CollectionOption<T>[] = [];
  const sectionInfos: CollectionSectionInfo[] = [];
  const byKey = new Map<string, CollectionOption<T>>();

  const label = getLabel ?? ((item: T) => String(getKey(item, 0)));
  const disabled = isDisabled ?? (() => false);

  const push = (item: T, section: string | undefined) => {
    const index = options.length;
    const key = getKey(item, index);
    const option: CollectionOption<T> = {
      key,
      label: label(item),
      item,
      index,
      row: rows.length,
      disabled: disabled(item) === true,
      section,
    };
    options.push(option);
    rows.push({ kind: 'option', row: option.row, option });
    if (!byKey.has(key)) byKey.set(key, option);
    return option;
  };

  if (sections !== undefined) {
    for (const section of sections) {
      const info: CollectionSectionInfo = {
        key: section.key,
        label: section.label,
        row: rows.length,
        firstIndex: -1,
        lastIndex: -1,
      };
      rows.push({ kind: 'section-label', row: info.row, section: info });
      for (const item of section.items) {
        const option = push(item, section.key);
        if (info.firstIndex === -1) info.firstIndex = option.index;
        info.lastIndex = option.index;
      }
      sectionInfos.push(info);
    }
  } else {
    for (const item of items ?? []) push(item, undefined);
  }

  const keys = options.map((option) => option.key);
  const labels = options.map((option) => option.label);
  const setSize =
    totalCount !== undefined && Number.isFinite(totalCount) && totalCount > options.length
      ? Math.floor(totalCount)
      : options.length;

  const indexOf = (key: string) => byKey.get(key)?.index ?? -1;

  return {
    rows,
    options,
    sections: sectionInfos,
    keys,
    labels,
    setSize,
    partial: setSize > options.length,
    indexOf,
    keyAt: (index) => options[index]?.key,
    optionAt: (index) => options[index],
    optionFor: (key) => byKey.get(key),
    isDisabled: (key) => byKey.get(key)?.disabled ?? false,
    posInSet: (key) => {
      const index = indexOf(key);
      return index === -1 ? -1 : index + 1;
    },
  };
}
