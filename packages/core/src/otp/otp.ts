/**
 * The pure half of a one-time code control: what the input accepts, how the
 * value is cut to it, and where the selection has to be for typing to work.
 * No DOM is touched here; the two bindings read the element and call these.
 */

/** Which characters a code takes. `pattern` outranks it in the set accepted. */
export type OtpType = 'numeric' | 'alphanumeric';

export interface OtpAcceptOptions {
  readonly type: OtpType;
  /** Tested against one character at a time. A pattern outranks the type. */
  readonly pattern?: RegExp | undefined;
}

export interface OtpSanitizeOptions extends OtpAcceptOptions {
  readonly length: number;
  /**
   * Run over the whole text before the filter: strip a `G-` prefix, uppercase
   * a code the reader typed in lowercase. Applied to every edit — typing,
   * paste, autofill — not to paste alone.
   */
  readonly transform?: ((text: string) => string) | undefined;
}

export interface OtpSanitized {
  readonly value: string;
  /** Every character the filter or the length dropped, in order. */
  readonly rejected: string;
}

const DIGIT = /^[0-9]$/;
const DIGIT_OR_LETTER = /^[0-9A-Za-z]$/;

/**
 * A code is ASCII: the digits an SMS carries, or the letters and digits a
 * backup code is printed in. A consumer whose codes hold more says so with
 * `pattern`, which is tested with `lastIndex` reset so a global flag cannot
 * make the same character pass once and fail once.
 */
export function acceptsCharacter(character: string, options: OtpAcceptOptions): boolean {
  const { pattern, type } = options;
  if (pattern !== undefined) {
    pattern.lastIndex = 0;
    return pattern.test(character);
  }
  return (type === 'numeric' ? DIGIT : DIGIT_OR_LETTER).test(character);
}

/** What the value becomes after one edit, and what the edit lost. */
export function sanitize(text: string, options: OtpSanitizeOptions): OtpSanitized {
  const transformed = options.transform === undefined ? text : options.transform(text);
  let value = '';
  let rejected = '';
  for (const character of transformed) {
    if (value.length < options.length && acceptsCharacter(character, options)) {
      value += character;
    } else {
      rejected += character;
    }
  }
  return { value, rejected };
}

/** One character per box: a single character repeats, several distribute. */
export function spreadPlaceholder(placeholder: string | undefined, length: number): string[] {
  const characters = placeholder === undefined ? [] : [...placeholder];
  if (characters.length === 1) return Array.from({ length }, () => characters[0] ?? '');
  return Array.from({ length }, (_, index) => characters[index] ?? '');
}

export interface OtpSelection {
  readonly start: number;
  readonly end: number;
}

export interface OtpSelectionInput extends OtpSelection {
  readonly valueLength: number;
  readonly length: number;
  /** The selection as it was before this change, when the caller has one. */
  readonly previous?: OtpSelection | undefined;
}

export interface OtpSelectionRange extends OtpSelection {
  readonly direction: 'forward' | 'backward';
}

/**
 * Where the selection has to be for typing to replace rather than be refused.
 *
 * A native text control at `maxlength` refuses every key once it is full, and
 * a collapsed caret inside a value inserts, pushing the last character off the
 * end. Neither is what a reader expects from a row of boxes, so the rule is
 * input-otp's: inside the value there is always one character selected — the
 * one in front of a collapsed caret, the last one at the end of a full value,
 * and the one *behind* the caret when the caret collapsed backward out of a
 * one-character selection, which is what ArrowLeft leaves. A caret at the end
 * of a short value is inserting, and a range the reader made is theirs.
 *
 * `null` says the selection is already where it should be.
 */
export function normalizeSelection(input: OtpSelectionInput): OtpSelectionRange | null {
  const { end, length, previous, start, valueLength } = input;
  if (valueLength === 0 || start !== end) return null;

  const inserting = start === valueLength && valueLength < length;
  if (inserting) return null;

  if (start === 0) return { start: 0, end: 1, direction: 'forward' };
  if (start >= length) return { start: length - 1, end: length, direction: 'backward' };

  let offset = 0;
  let direction: OtpSelectionRange['direction'] = 'forward';
  if (previous !== undefined) {
    direction = start < previous.end ? 'backward' : 'forward';
    const wasInserting = previous.start === previous.end && previous.start < length;
    if (direction === 'backward' && !wasInserting) offset = -1;
  }
  const from = Math.min(Math.max(start + offset, 0), valueLength - 1);
  return { start: from, end: from + 1, direction };
}

/**
 * The boxes that carry `data-current`: every box inside a range, or the box a
 * collapsed caret is in, which at the end of a full value is the last box.
 */
export function currentSlots(
  selection: (OtpSelection & { readonly length: number; readonly valueLength: number }) | null,
): number[] {
  if (selection === null) return [];
  const { end, length, start } = selection;
  if (start === end) return [Math.min(start, length - 1)];
  const slots: number[] = [];
  for (let index = start; index < end && index < length; index += 1) slots.push(index);
  return slots;
}
