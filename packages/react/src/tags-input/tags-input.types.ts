import type { PartialMessages, TagsInputMessages } from '@slotted/core/i18n';
import type { ClipboardOutcome } from '@slotted/core/clipboard';
import type { ChangeRequest } from '@slotted/core/state';
import type { TagsRefuseCause, TagsValidator } from '@slotted/core/tags';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type TagsInputSize = 'sm' | 'md' | 'lg';
export type TagsInputVariant = 'outline' | 'subtle' | 'plain';

/** What the row does with more chips than fit on one line. */
export type TagsInputOverflow = 'wrap' | 'collapse';

/** What becomes of a value that fails the judgement: a marked chip, or a report. */
export type TagsInputInvalidValues = 'keep' | 'refuse';

/** What becomes of the pending text when focus leaves the control. */
export type TagsInputPendingOnBlur = 'commit' | 'keep' | 'discard';

/**
 * Why the list moved. Five words rather than one boolean, because a consumer
 * writes a different handler for each:
 *
 * - `submit` — typed text became a value: `Enter`, a delimiter, a paste, blur
 *   under `pendingOnBlur="commit"`, or a chip's edit committed.
 * - `remove` — one value left, by its control, by `Delete`, by `Backspace`
 *   or by `Ctrl+X`.
 * - `clear` — every value left at once.
 * - `keyboard` — the list is the same and its order changed. Reorder emits no
 *   other reason, so a consumer persisting an order listens for exactly this.
 * - `programmatic` — the imperative handle.
 */
export type TagsInputValueReason = 'submit' | 'remove' | 'clear' | 'keyboard' | 'programmatic';

export type TagsInputInputReason = 'keyboard' | 'submit' | 'clear' | 'blur' | 'programmatic';

export type TagsInputRefuseCause = TagsRefuseCause;

export interface TagsInputDefaults {
  addOnPaste: boolean;
  allowDuplicates: boolean;
  clearable: boolean;
  /** The characters that commit the typed text, and split a paste. */
  delimiters: readonly string[];
  disabled: boolean;
  editable: boolean;
  fullWidth: boolean;
  invalid: boolean;
  invalidValues: TagsInputInvalidValues;
  /** The most values the list may hold, or `null` for no limit. */
  max: number | null;
  overflow: TagsInputOverflow;
  pendingOnBlur: TagsInputPendingOnBlur;
  readOnly: boolean;
  reorderable: boolean;
  required: boolean;
  size: TagsInputSize;
  variant: TagsInputVariant;
}

export interface TagsInputDefaultsProviderProps extends Partial<TagsInputDefaults> {
  children?: ReactNode;
}

export interface TagsInputHandle {
  /** Empties the list and the pending text, with reason `clear`. */
  clear: () => void;
  focus: () => void;
  /** The escape hatch a declarative prop cannot express: setting the whole list. */
  setValue: (values: readonly string[], reason?: TagsInputValueReason) => void;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a type step. `value` and `defaultValue` are
 * omitted and redeclared as lists, because the value of this control is the
 * list and not the input's text. `type` is narrowed to the text-like types a
 * value can be judged as. `disabled`, `readOnly`, `required` and `max` are the
 * family's axes, resolved through the field and the provider before they
 * reach the element.
 *
 * Everything else is the element's, and it reaches the element: `pattern`,
 * `minLength`, `maxLength`, `list`, `inputMode`, `enterKeyHint`,
 * `autoComplete`, `placeholder`, `name`, `form`, every `aria-*` and every
 * handler. `className` and `style` are the exception, and they reach the
 * frame, because the frame is what a consumer sees.
 */
export type TagsInputNativeProps = Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'disabled' | 'max' | 'readOnly' | 'required' | 'size' | 'type' | 'value'
>;

export interface TagsInputProps extends TagsInputNativeProps, Partial<TagsInputDefaults> {
  defaultInputValue?: string | undefined;
  defaultValue?: readonly string[] | undefined;
  /** The chip's text for a value, for a value that is an address and a label that is a name. */
  formatLabel?: ((value: string) => string) | undefined;
  /** The imperative handle; `ref` is the input. */
  handleRef?: Ref<TagsInputHandle> | undefined;
  inputValue?: string | undefined;
  /** BCP 47, for the comparison the duplicate rule makes. The language in force when absent. */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear button, the chips, the counter, the hint, and the sentences the
   * announcer says.
   */
  messages?: PartialMessages<TagsInputMessages> | undefined;
  /** The values the reader may not remove: a mandatory recipient, an inherited tag. */
  lockedValues?: readonly string[] | undefined;
  /** Runs before a value is judged. Trim by default. */
  normalize?: ((text: string) => string) | undefined;
  /** What was put on the clipboard, and whether it got there. */
  onValueCopy?: ((values: readonly string[], outcome: ClipboardOutcome) => void) | undefined;
  onInputValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  onValueChange?:
    ((value: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;
  /**
   * What the family refused, and why. It holds no state and cancels nothing:
   * the values never entered the list, and this says which and on what grounds.
   */
  onValueRefuse?:
    | ((
        values: readonly string[],
        details: { cause: TagsInputRefuseCause; source?: unknown },
      ) => void)
    | undefined;
  /** Renders the frame into another element. */
  render?: ((props: TagsInputRootProps) => ReactNode) | undefined;
  /**
   * Values the reader may choose instead of typing them whole. Present, the
   * input is a combobox: a listbox under the field holds the suggestions the
   * typed text matches by the locale's collator, minus the values already
   * chosen; ArrowDown and ArrowUp move through it and Enter adds the
   * highlighted one. A chosen suggestion is normalized, judged, deduplicated
   * and capped like typed text, and typed text still commits as it does
   * without suggestions.
   */
  suggestions?: readonly string[] | undefined;
  /** How a paste is split. The default splits on the delimiters and on line breaks. */
  split?: ((text: string) => readonly string[]) | undefined;
  type?: 'text' | 'email' | 'url' | 'tel' | 'search' | undefined;
  /**
   * Whether a text may be a value. `true`, or `false` with the generic label,
   * or a string saying why not. Absent, the input's own constraints judge.
   */
  validate?: TagsValidator | undefined;
  value?: readonly string[] | undefined;
}

/** What `render` receives for the frame around the control. */
export interface TagsInputRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-complete'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-expanded'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-narrow'?: '' | undefined;
  'data-overflow': TagsInputOverflow;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': TagsInputSize;
  'data-ui': string;
  'data-variant': TagsInputVariant;
  ref?: Ref<HTMLDivElement> | undefined;
}
