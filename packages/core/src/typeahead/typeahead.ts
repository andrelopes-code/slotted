/**
 * Which item a sequence of printable characters selects.
 *
 * The WAI-ARIA Authoring Practices marks typeahead optional for a menu — "Any
 * key that corresponds to a printable character (Optional): Move focus to the
 * next item in the current menu whose label begins with that printable
 * character" — and four of the five implementations surveyed for `menu` ship
 * it, because a menu of twenty commands is unusable by keyboard without it.
 *
 * The module knows nothing about menus, items or the DOM. It is handed labels
 * and a starting index, and it answers with an index. `listbox`, `select`,
 * `combobox` and `tree` all ask the same question of the same answer, which is
 * why it is here rather than inside the family that needed it first.
 */

/** Milliseconds of silence before a new search begins. */
export const DEFAULT_TYPEAHEAD_TIMEOUT = 500;

export interface TypeaheadOptions {
  /**
   * How long the sequence survives without another key. Every surveyed
   * implementation uses between 350 and 1000 milliseconds; this is the middle,
   * and it is the value a consumer retunes for a locale that types slower.
   */
  timeout?: number;
  /**
   * The locale the labels are compared in, read at each search so an
   * application that switches locale at runtime is answered.
   *
   * Comparison is at `base` sensitivity, so `Ä` matches `a` and `E` matches
   * `e`. `docs/component-features.md` §2.9 asks for exactly this: "Search,
   * sorting, and typeahead use locale-sensitive comparison."
   */
  locale?: () => string | undefined;
  /** The clock, for a test that does not want to wait half a second. */
  now?: () => number;
}

export interface TypeaheadHandle {
  /** What has been typed so far, or an empty string once it has expired. */
  readonly query: string;
  /**
   * Takes one printable character and answers with the index of the item it
   * selects, or `-1` when nothing matches.
   *
   * `from` is where the search starts — the item that holds focus. A sequence
   * of different characters searches from `from` itself, so that typing `s`,
   * `a` and `v` keeps refining onto `Save` rather than walking past it. A
   * character repeated searches from the item *after* `from`, which is what
   * cycles a reader through four commands that all begin with `S`.
   */
  match: (character: string, labels: readonly string[], from: number) => number;
  /** Ends the current sequence. A menu closing calls it. */
  reset: () => void;
  destroy: () => void;
}

/**
 * Whether a key types a character rather than commanding something.
 *
 * A space is both, and which one it is depends on whether the reader is already
 * typing: idle, it is the key that toggles the checkbox item under focus;
 * mid-sequence, it is the space in `New Tab`. Every surveyed implementation
 * splits it the same way, and a family that did not would make every command
 * whose name has two words unreachable.
 */
export function isPrintable(key: string, sequenceOpen = false): boolean {
  if (key.length !== 1) return false;
  if (key === ' ') return sequenceOpen;
  return true;
}

function collator(locale: string | undefined) {
  return new Intl.Collator(locale, { sensitivity: 'base', usage: 'search' });
}

export function createTypeahead(options: TypeaheadOptions = {}): TypeaheadHandle {
  const timeout = options.timeout ?? DEFAULT_TYPEAHEAD_TIMEOUT;
  const now = options.now ?? (() => Date.now());

  let query = '';
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const reset = () => {
    clear();
    query = '';
  };

  const schedule = () => {
    clear();
    /* A timer as well as the clock: the clock expires a sequence at the next
       key, and the timer expires one nobody follows up. Without it, a reader
       who types `s`, walks away and comes back an hour later continues a
       search they have forgotten. */
    timer = setTimeout(reset, timeout);
    if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
      (timer as { unref: () => void }).unref();
    }
  };

  return {
    get query() {
      return query;
    },

    match(character, labels, from) {
      const moment = now();
      query = moment - last > timeout ? character : query + character;
      last = moment;
      schedule();

      if (labels.length === 0) return -1;

      /* One character typed over and over is a request for the next item
         beginning with it, not for a longer word. Radix, Zag and React Aria all
         collapse the buffer this way, and a reader pressing `s` four times to
         reach the fourth `Save…` is why. */
      const repeated = query.length > 1 && [...query].every((one) => one === query[0]);
      const needle = repeated ? (query[0] as string) : query;
      const start = repeated || query.length === 1 ? from + 1 : from;

      const compare = collator(options.locale?.());
      const offset = Math.max(0, start);

      for (let step = 0; step < labels.length; step += 1) {
        const index = (offset + step) % labels.length;
        const label = labels[index] ?? '';
        if (label.length < needle.length) continue;
        if (compare.compare(label.slice(0, needle.length), needle) === 0) return index;
      }

      return -1;
    },

    reset,
    destroy: clear,
  };
}
