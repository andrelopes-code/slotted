import { inject, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';
import type { ClipboardOutcome } from '@slotted/core/clipboard';
import type { TagsRefuseCause, TagsValidator } from '@slotted/core/tags';

export type TagsInputSize = 'sm' | 'md' | 'lg';
export type TagsInputVariant = 'outline' | 'subtle' | 'plain';

/** What the row does with more chips than fit on one line. */
export type TagsInputOverflow = 'wrap' | 'collapse';
/** What becomes of a value that fails the judgement: a marked chip, or a report. */
export type TagsInputInvalidValues = 'keep' | 'refuse';
/** What becomes of the pending text when focus leaves the control. */
export type TagsInputPendingOnBlur = 'commit' | 'keep' | 'discard';

/**
 * Why the list moved. The five words the React binding states in full, and
 * for the same reason: a consumer writes a different handler for each, and
 * `keyboard` is reorder alone.
 */
export type TagsInputValueReason = 'submit' | 'remove' | 'clear' | 'keyboard' | 'programmatic';
export type TagsInputInputReason = 'keyboard' | 'submit' | 'clear' | 'blur' | 'programmatic';
export type TagsInputRefuseCause = TagsRefuseCause;
export type TagsInputValidator = TagsValidator;
export type TagsInputCopyOutcome = ClipboardOutcome;

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

/**
 * The numbers, and why they are these numbers. The React binding's
 * `TAGS_INPUT_FALLBACK` states the reasoning; the values are the same, and
 * they have to be — an application that renders both bindings would otherwise
 * ship two controls that behave differently under the same name.
 */
export const TAGS_INPUT_FALLBACK: TagsInputDefaults = {
  addOnPaste: true,
  allowDuplicates: false,
  clearable: true,
  delimiters: [','],
  disabled: false,
  editable: false,
  fullWidth: true,
  invalid: false,
  invalidValues: 'keep',
  max: null,
  overflow: 'wrap',
  pendingOnBlur: 'commit',
  readOnly: false,
  reorderable: false,
  required: false,
  size: 'md',
  variant: 'outline',
};

export const TAGS_INPUT_DEFAULTS = new InjectionToken<TagsInputDefaults>('TAGS_INPUT_DEFAULTS', {
  providedIn: 'root',
  factory: () => TAGS_INPUT_FALLBACK,
});

/**
 * The decisions an application takes once. Its words come from the language in
 * force (`provideSlotted`).
 */
export function provideTagsInputDefaults(defaults: Partial<TagsInputDefaults>): Provider {
  return { provide: TAGS_INPUT_DEFAULTS, useValue: { ...TAGS_INPUT_FALLBACK, ...defaults } };
}

export function injectTagsInputDefaults(): TagsInputDefaults {
  return inject(TAGS_INPUT_DEFAULTS);
}
