import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { UploadFile } from '@slotted/core/upload';

export type PromptComposerSize = 'sm' | 'md' | 'lg';
/**
 * `raised` is the chat composer, a surface lifted off the page; `outline` and
 * `subtle` are a composer inside a form, with a one-line control's geometry.
 */
export type PromptComposerVariant = 'raised' | 'outline' | 'subtle';
/**
 * `ring` marks an AI input with a ring of turning hues and a soft glow, which
 * replace its border, its focus outline and its raised shadow.
 */
export type PromptComposerEmphasis = 'none' | 'ring';
/** Whether Enter sends, or only Mod+Enter does. Shift+Enter always breaks a line. */
export type PromptComposerSubmitOn = 'enter' | 'mod-enter';
/** Where the request stands. The application owns it. */
export type PromptComposerStatus = 'ready' | 'submitted' | 'streaming' | 'error';
export type PromptComposerSubmitReason = 'keyboard' | 'pointer';

/** Files from the attach button, a paste or a drop, after the selection rules. */
export interface PromptComposerAttachEvent {
  files: File[];
  reason: 'pointer' | 'paste' | 'drop';
  rejected: UploadFile[];
  source: Event;
}

export interface PromptComposerStopEvent {
  reason: PromptComposerSubmitReason;
  source: Event;
}

export interface PromptComposerDefaults {
  size: PromptComposerSize;
  submitOn: PromptComposerSubmitOn;
  variant: PromptComposerVariant;
  emphasis: PromptComposerEmphasis;
}

const FALLBACK: PromptComposerDefaults = {
  size: 'md',
  submitOn: 'enter',
  variant: 'raised',
  emphasis: 'none',
};

export const PROMPT_COMPOSER_DEFAULTS = new InjectionToken<PromptComposerDefaults>(
  'slotted prompt composer defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its composers look and which key sends. A
 * composer that states any of them itself still wins. What the buttons say
 * comes from the language in force (`provideSlotted`).
 */
export function providePromptComposerDefaults(defaults: Partial<PromptComposerDefaults>) {
  return {
    provide: PROMPT_COMPOSER_DEFAULTS,
    useFactory: (): PromptComposerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectPromptComposerDefaults(): PromptComposerDefaults {
  return inject(PROMPT_COMPOSER_DEFAULTS);
}

/**
 * What the composer needs of the textarea inside it. An abstract class rather
 * than an import, so the two directives depend on each other without a cycle.
 */
export abstract class SlPromptComposerControl {
  /** What the element shows. */
  abstract readonly current: Signal<string>;
  abstract readonly resolvedDisabled: Signal<boolean | undefined>;
  abstract readonly resolvedReadOnly: Signal<boolean | undefined>;
  abstract readonly resolvedInvalid: Signal<boolean | undefined>;
  /** Empties the value after an accepted send, with reason `submit`. */
  abstract clearAfterSubmit(source: Event): void;
  /** Writes a phrase the reader spoke at the end of the value, with reason `dictation`. */
  abstract dictate(phrase: string): void;
  abstract focus(): void;
}
