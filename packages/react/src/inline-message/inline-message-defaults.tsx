import { createContext, useContext, useMemo } from 'react';

import type {
  InlineMessageDefaults,
  InlineMessageDefaultsProviderProps,
  InlineMessagePrefixes,
} from './inline-message.types';

/**
 * The word a reader hears before the message, per tone.
 *
 * GOV.UK's Error message component publishes the idea and hard-codes the word;
 * this table generalizes it to every tone that is a severity and puts it behind
 * the provider below, which is the only translation surface this library has
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

const FALLBACK: InlineMessageDefaults = {
  live: 'off',
  mark: 'glyph',
  prefixes: INLINE_MESSAGE_PREFIXES,
  size: 'sm',
  tone: 'secondary',
};

const InlineMessageDefaultsContext = createContext<InlineMessageDefaults>(FALLBACK);

/** What a message renders as here, before it states anything of its own. */
export function useInlineMessageDefaults(): InlineMessageDefaults {
  return useContext(InlineMessageDefaultsContext);
}

/**
 * An application decides once what its messages are painted like and — the one
 * that matters — what its severities are called, rather than repeating the same
 * props on every field in a form. A message that states any of them itself
 * still wins: an explicit prop is never overridden by context.
 *
 * `prefixes` is merged over the inherited table rather than replacing it, so a
 * Portuguese application writes the four words it has and inherits the shape.
 */
export function InlineMessageDefaultsProvider({
  children,
  live,
  mark,
  prefixes,
  size,
  tone,
}: InlineMessageDefaultsProviderProps) {
  const inherited = useInlineMessageDefaults();
  const value = useMemo<InlineMessageDefaults>(
    () => ({
      live: live ?? inherited.live,
      mark: mark ?? inherited.mark,
      prefixes: { ...inherited.prefixes, ...prefixes },
      size: size ?? inherited.size,
      tone: tone ?? inherited.tone,
    }),
    [inherited, live, mark, prefixes, size, tone],
  );

  return (
    <InlineMessageDefaultsContext.Provider value={value}>
      {children}
    </InlineMessageDefaultsContext.Provider>
  );
}
