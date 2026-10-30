import { inject, Injectable, InjectionToken } from '@angular/core';

/** Which of the five semantic colors the message speaks in. */
export type InlineMessageTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/**
 * The type step the message sits at. `sm` sits beside a compact field; `md`
 * beside a large field. A message about a section is an alert. Both read the control scales, which the theme
 * restates per density.
 */
export type InlineMessageSize = 'sm' | 'md';

/**
 * Which mark the message draws. `glyph` is the tone's own silhouette — the
 * circled information, check, diamond and circled exclamation. `dot` is a
 * neutral bullet in the tone's ink, the same shape for every tone including
 * the help tone that draws no silhouette at all, so a column of messages under
 * one field starts on one left edge. `none` draws nothing, and the tone is
 * then said by the ink and by the weight of the sentence: it is what `field`
 * and `field-group` ask for, because a silhouette repeated under every control
 * of a form is texture rather than a warning (F2).
 */
export type InlineMessageMark = 'glyph' | 'dot' | 'none';

/**
 * Whether the message announces itself, and how loudly. `off` is the default,
 * because the WAI-ARIA APG records that a message already present when the page
 * finishes loading is not announced whatever role it carries.
 */
export type InlineMessageLive = 'off' | 'polite' | 'assertive';

/**
 * The word a reader hears before the message. `null` is a tone that is not a
 * severity — help and information announce themselves by their sentence.
 */
export type InlineMessagePrefixes = Record<InlineMessageTone, string | null>;

/**
 * The word a reader hears before the message, per tone.
 *
 * GOV.UK's Error message component publishes the idea and hard-codes the word;
 * this table generalizes it to every tone that is a severity and puts it behind
 * the token below, which is the only translation surface this library has
 * today. `accent`, `secondary` and `info` carry none: information and help announce
 * themselves by their sentence, and a reader told “Information:” before every
 * hint hears one more word per field for nothing.
 */
export const INLINE_MESSAGE_PREFIXES: InlineMessagePrefixes = {
  accent: null,
  secondary: null,
  info: null,
  success: 'Success:',
  warning: 'Warning:',
  danger: 'Error:',
};

export interface InlineMessageDefaults {
  live: InlineMessageLive;
  mark: InlineMessageMark;
  prefixes: InlineMessagePrefixes;
  size: InlineMessageSize;
  tone: InlineMessageTone;
}

const FALLBACK: InlineMessageDefaults = {
  live: 'off',
  mark: 'glyph',
  prefixes: INLINE_MESSAGE_PREFIXES,
  size: 'sm',
  tone: 'secondary',
};

export const INLINE_MESSAGE_DEFAULTS = new InjectionToken<InlineMessageDefaults>(
  'slotted inline message defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its messages are painted like and — the one
 * that matters — what its severities are called, rather than repeating the same
 * inputs on every field in a form. A message that states any of them itself
 * still wins: an explicit input is never overridden by the token.
 *
 * `prefixes` is merged over the shipped table rather than replacing it, so a
 * Portuguese application writes the three words it has and inherits the shape.
 */
export function provideInlineMessageDefaults(
  defaults: Partial<Omit<InlineMessageDefaults, 'prefixes'>> & {
    prefixes?: Partial<InlineMessagePrefixes>;
  },
) {
  return {
    provide: INLINE_MESSAGE_DEFAULTS,
    useFactory: (): InlineMessageDefaults => ({
      live: defaults.live ?? FALLBACK.live,
      mark: defaults.mark ?? FALLBACK.mark,
      prefixes: { ...FALLBACK.prefixes, ...defaults.prefixes },
      size: defaults.size ?? FALLBACK.size,
      tone: defaults.tone ?? FALLBACK.tone,
    }),
  };
}

/** What a message renders as here, before it states anything of its own. */
export function injectInlineMessageDefaults(): InlineMessageDefaults {
  return inject(INLINE_MESSAGE_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `tag` records: a
 * module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlInlineMessageIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-inline-message-${this.count}`;
  }
}
