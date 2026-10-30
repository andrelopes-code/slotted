/**
 * The arithmetic of a list of typed values, stated once so the two bindings
 * of `tags-input` cannot disagree about it: how a paste is split, in what
 * order a candidate is normalised, judged, deduplicated and capped, and how
 * the platform is asked whether a text is a valid value.
 *
 * Nothing here holds state and nothing here touches the DOM except
 * `constraintVerdict`, which builds one detached input to ask the browser a
 * question the browser already knows the answer to.
 */

/** Whether a text may be a value, and — when it may not — why, in words. */
export type TagsVerdict = { valid: true } | { valid: false; message: string };

/**
 * The consumer's judgement. `true` is valid; `false` is invalid with the
 * family's generic label; a string is invalid with that reason.
 */
export type TagsValidator = (text: string) => boolean | string;

export type TagsRefuseCause = 'duplicate' | 'limit' | 'invalid';

export const VALID: TagsVerdict = { valid: true };

/**
 * The values a text holds when it is pasted or committed: split on every
 * delimiter and on every line break, trimmed, with empties dropped.
 *
 * Line breaks always split, whatever the delimiters are: a column copied out
 * of a spreadsheet arrives one value per line, and no surveyed implementation
 * says so. A text with nothing to split on is one value.
 */
export function splitValues(text: string, delimiters: readonly string[]): string[] {
  const marks = delimiters.map((mark) => mark.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')).join('');
  const pattern = marks === '' ? /\r\n|\r|\n/ : new RegExp(`[${marks}]|\r\n|\r|\n`);
  return text
    .split(pattern)
    .map((piece) => piece.trim())
    .filter((piece) => piece !== '');
}

/**
 * The list as one text, for the clipboard: the first delimiter and a space
 * between values, which is the shape `splitValues` reads back.
 */
export function joinValues(values: readonly string[], delimiters: readonly string[]): string {
  return values.join(`${delimiters[0] ?? ','} `);
}

/**
 * The platform's judgement of one text as a value of the input it would be
 * typed into. A detached input carries the visible one's `type` and `pattern`,
 * takes the text, and answers `validity.valid` with its own
 * `validationMessage` — already in the reader's language.
 *
 * `minlength` and `maxlength` are judged here rather than by the clone: a
 * browser flags `tooShort` and `tooLong` only for a value the reader typed,
 * never for one set by script, so the clone would pass a text it should not.
 * Their message is empty, which the caller replaces with its generic label;
 * the platform has no sentence for a length it did not itself refuse.
 *
 * With no input to read constraints from, everything is valid.
 */
export function constraintVerdict(input: HTMLInputElement | null, text: string): TagsVerdict {
  if (input === null) return VALID;

  const minLength = input.minLength;
  const maxLength = input.maxLength;
  if (minLength > 0 && text.length < minLength) return { valid: false, message: '' };
  if (maxLength >= 0 && text.length > maxLength) return { valid: false, message: '' };

  const probe = input.ownerDocument.createElement('input');
  probe.type = input.type;
  const pattern = input.getAttribute('pattern');
  if (pattern !== null) probe.setAttribute('pattern', pattern);
  probe.value = text;
  if (probe.validity.valid) return VALID;
  return { valid: false, message: probe.validationMessage };
}

/**
 * One judgement from the two sources: the consumer's `validate` when it is
 * given, and the platform's constraints when it is not. An empty message is
 * the caller's cue to use its own generic label.
 */
export function judgeValue(
  text: string,
  validate: TagsValidator | undefined,
  input: HTMLInputElement | null,
): TagsVerdict {
  if (validate === undefined) return constraintVerdict(input, text);
  const answer = validate(text);
  if (answer === true) return VALID;
  return { valid: false, message: answer === false ? '' : answer };
}

export interface AdmitOptions {
  /** The list as it stands. */
  values: readonly string[];
  /** What the reader offered, in order. */
  candidates: readonly string[];
  /** The most values the list may hold, or `null` for no limit. */
  max: number | null;
  allowDuplicates: boolean;
  /** Whether a value that fails the judgement is held and marked, or refused. */
  invalidValues: 'keep' | 'refuse';
  normalize: (text: string) => string;
  judge: (text: string) => TagsVerdict;
  /** Locale-sensitive equality, for the duplicate rule. */
  equals: (a: string, b: string) => boolean;
  /**
   * The index of a value being replaced by an edit, excluded from the
   * duplicate check — or every edit would be a duplicate of itself.
   */
  replacing?: number;
}

export interface AdmitResult {
  /** The list after the candidates that got in. */
  next: readonly string[];
  /** The candidates that got in, normalised, in order. */
  added: readonly string[];
  /** The candidates that did not, under the cause that refused them. */
  refused: Record<TagsRefuseCause, string[]>;
  /** For each refused duplicate, the value already in the list that it matched. */
  existing: readonly string[];
}

/**
 * The sequence every commit, paste and edit runs: normalise, judge,
 * deduplicate, cap. Each refusal is collected under its cause rather than
 * thrown away — which is what makes a paste of two hundred addresses into a
 * list of fifty report the hundred and fifty that did not fit instead of
 * dropping them.
 *
 * Under `invalidValues: 'keep'` a value that fails the judgement is in `next`
 * like any other, and the caller marks it; under `'refuse'` it is in
 * `refused.invalid` and nowhere else.
 */
export function admitValues(options: AdmitOptions): AdmitResult {
  const base =
    options.replacing === undefined
      ? [...options.values]
      : options.values.filter((_, index) => index !== options.replacing);
  const next = [...base];
  const added: string[] = [];
  const existing: string[] = [];
  const refused: Record<TagsRefuseCause, string[]> = { duplicate: [], limit: [], invalid: [] };

  for (const candidate of options.candidates) {
    const text = options.normalize(candidate);
    if (text === '') continue;

    if (options.invalidValues === 'refuse' && !options.judge(text).valid) {
      refused.invalid.push(text);
      continue;
    }

    if (!options.allowDuplicates) {
      const match = next.find((value) => options.equals(value, text));
      if (match !== undefined) {
        refused.duplicate.push(text);
        existing.push(match);
        continue;
      }
    }

    if (options.max !== null && next.length >= options.max) {
      refused.limit.push(text);
      continue;
    }

    /* An edit's first admitted value takes the place the edited one had; a
       second one — an edit that typed a delimiter — follows it. */
    if (options.replacing !== undefined && added.length === 0) {
      next.splice(Math.min(options.replacing, next.length), 0, text);
    } else if (options.replacing !== undefined) {
      const anchor = next.indexOf(added[added.length - 1] as string);
      next.splice(anchor + 1, 0, text);
    } else {
      next.push(text);
    }
    added.push(text);
  }

  return { next, added, refused, existing };
}
