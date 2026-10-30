import { createContext, useContext } from 'react';

import type { TextareaDefaults, TextareaDefaultsProviderProps } from './textarea.types';

const FALLBACK: TextareaDefaults = {
  mono: false,
  resize: 'block',
  size: 'md',
  variant: 'outline',
};

const TextareaDefaultsContext = createContext<TextareaDefaults>(FALLBACK);

/** What a textarea renders as here, before it states anything of its own. */
export function useTextareaDefaults(): TextareaDefaults {
  return useContext(TextareaDefaultsContext);
}

/**
 * An application decides once what its multi-line controls look like and
 * whether their handle drags, rather than repeating the same props on every
 * control. A control that states any of them itself still wins, and a control
 * inside a field takes the field's step over this provider's.
 */
export function TextareaDefaultsProvider({ children, ...defaults }: TextareaDefaultsProviderProps) {
  const inherited = useTextareaDefaults();

  return (
    <TextareaDefaultsContext.Provider
      value={{
        mono: defaults.mono ?? inherited.mono,
        resize: defaults.resize ?? inherited.resize,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TextareaDefaultsContext.Provider>
  );
}
