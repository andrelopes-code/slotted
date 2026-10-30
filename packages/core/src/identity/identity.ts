/**
 * What a name reduces to when there is no picture, which colour that name is
 * always drawn in, and how several names are read as one.
 *
 * All three are decisions Avatar and Avatar Group would otherwise take twice —
 * once in React and once in Angular — and two copies of a rule that has to
 * agree character for character is one copy too many. The reduction also has to
 * agree with itself across a server render and the hydration that follows it,
 * so nothing here reads the DOM, the clock, or a random source.
 *
 * The surveyed implementations that derive initials — Chakra, Vaadin, Polaris,
 * Fluent — all use `charAt(0)` and `toUpperCase()`. That returns half of a
 * surrogate pair, drops a combining mark onto the wrong letter, and turns
 * Turkish `i` into `I` where the language writes `İ`. This module segments by
 * grapheme and upper-cases for the locale instead.
 */

export interface InitialsRequest {
  /** The person's or entity's name. Absent or blank, there are no initials. */
  name?: string | undefined;
  /** How many graphemes at most. The smallest avatar asks for one. */
  max?: number | undefined;
  /** BCP 47, for the upper-casing. Absent, the runtime's own default. */
  locale?: string | undefined;
}

export interface ToneRequest<Tone extends string> {
  /** A stable identifier, or the name when there is nothing better. */
  seed?: string | undefined;
  /** The palette to choose from, in a fixed order. */
  tones: readonly Tone[];
}

export interface NameListRequest {
  names: readonly (string | undefined)[];
  /** BCP 47. Absent, the runtime's own default writes the conjunction. */
  locale?: string | undefined;
}

/** An address is a name a product passes when it has nothing better. */
const EMAIL = /^([^\s@]+)@[^\s@]+\.[^\s@]+$/;

/** What separates the parts of an address's local part into words. */
const LOCAL_PART_SEPARATORS = /[._+-]+/g;

/** A word worth an initial contains at least one letter or one figure. */
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

const IS_LETTER = /\p{L}/u;

/**
 * What a name carries beside itself: a pronoun set, a role, a team, or the
 * address a mail header appends. `Ada Lovelace (she/her)` reduced to `AS`
 * before this was removed — the last "word" of a real name is very often not
 * part of the name, and taking its first letter puts a stranger's initial on
 * the person's face. Fluent removes parenthesised content for the same reason.
 */
const BRACKETED = /[([{<][^)\]}>]*[)\]}>]/g;

/**
 * One segmenter per locale. Constructing `Intl.Segmenter` is expensive enough
 * to be measurable in a table rendering a hundred avatars, and the segmentation
 * of a grapheme cluster does not actually vary by locale — the parameter is
 * carried only so the cache key matches the upper-casing beside it.
 */
const segmenters = new Map<string, Intl.Segmenter>();

const listFormatters = new Map<string, Intl.ListFormat>();

function graphemes(value: string): string[] {
  if (typeof Intl.Segmenter !== 'function') {
    /* Code-point aware, which keeps a surrogate pair whole; a combining mark
       still separates, and that is the most a runtime without `Intl.Segmenter`
       can be asked for. */
    return [...value];
  }
  let segmenter = segmenters.get('');
  if (segmenter === undefined) {
    segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    segmenters.set('', segmenter);
  }
  return [...segmenter.segment(value)].map((segment) => segment.segment);
}

/**
 * The letter a word begins with, whatever it opens with: a bracket, a
 * quotation mark, an inverted question mark, an at sign, a hash, an emoji. The
 * whole grapheme cluster is returned, so a letter carrying a combining mark
 * arrives whole.
 *
 * A figure is content rather than punctuation — `3M` and `7-Eleven` are names
 * whose initial is one — so it is taken only when the word holds no letter at
 * all, which is what makes `3M` read `M` and `Studio 54` read `S5`.
 */
function leadingGrapheme(word: string): string {
  const clusters = graphemes(word);
  for (const grapheme of clusters) {
    if (IS_LETTER.test(grapheme)) return grapheme;
  }
  for (const grapheme of clusters) {
    if (HAS_LETTER_OR_NUMBER.test(grapheme)) return grapheme;
  }
  return '';
}

function split(source: string): string[] {
  return source.split(/\s+/).filter((word) => HAS_LETTER_OR_NUMBER.test(word));
}

function words(name: string): string[] {
  const localPart = EMAIL.exec(name)?.[1];
  const source = localPart === undefined ? name : localPart.replace(LOCAL_PART_SEPARATORS, ' ');
  /* A name that is nothing but a bracketed word still has a word in it, so the
     stripped form is used only when it left something behind. */
  const stripped = split(source.replace(BRACKETED, ' '));
  return stripped.length > 0 ? stripped : split(source);
}

/**
 * The initials an avatar shows when it has no picture: the first letter of the
 * first word and the first letter of the last one.
 *
 * A name with one word gives one letter. A name with none — blank, or made
 * entirely of punctuation or emoji — gives none at all, and the avatar draws
 * the person glyph instead of an empty circle.
 */
export function initialsFrom({ name, max = 2, locale }: InitialsRequest): string {
  if (typeof name !== 'string') return '';
  const parts = words(name.trim());
  const first = parts.at(0);
  if (first === undefined || max < 1) return '';

  const last = parts.at(-1);
  const second = max < 2 || parts.length < 2 || last === undefined ? '' : leadingGrapheme(last);

  return `${leadingGrapheme(first)}${second}`.toLocaleUpperCase(locale);
}

/**
 * Which of a palette a name is always drawn in.
 *
 * FNV-1a over the seed's code points: a hash rather than a counter, because the
 * same person has to keep the same colour in a list that is re-sorted, in a
 * table that is paged, and between a server render and the hydration after it.
 *
 * A palette of five means collisions are frequent by construction. The colour
 * is an aid to scanning a list of faces; the name is what identifies the
 * person, and it is on every avatar in every one of its states.
 */
export function toneFrom<Tone extends string>({
  seed,
  tones,
}: ToneRequest<Tone>): Tone | undefined {
  if (typeof seed !== 'string' || seed.trim() === '' || tones.length === 0) return undefined;

  let hash = 0x811c9dc5;
  for (const character of seed.trim()) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return tones[hash % tones.length];
}

/**
 * Several names read as one, in the order they were given and with the
 * conjunction the locale writes.
 *
 * It is what the `+3` in an avatar group is called for a screen reader.
 * Atlassian's default there is the English string “N more people”, Vaadin's
 * needs a tooltip opened to reach, and the other surveyed groups leave `+3` as
 * the whole announcement. The names are the announcement here, and no English
 * is shipped to make it.
 */
export function formatNameList({ names, locale }: NameListRequest): string | undefined {
  const present = names.filter(
    (name): name is string => typeof name === 'string' && name.trim() !== '',
  );
  if (present.length === 0) return undefined;
  if (typeof Intl.ListFormat !== 'function') return present.join(', ');

  const key = locale ?? '';
  let formatter = listFormatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });
    listFormatters.set(key, formatter);
  }
  return formatter.format(present);
}
