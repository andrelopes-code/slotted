import { createContext, useContext } from 'react';

import type {
  PromptComposerDefaults,
  PromptComposerDefaultsProviderProps,
} from './prompt-composer.types';

const FALLBACK: PromptComposerDefaults = {
  emphasis: 'none',
  size: 'md',
  submitOn: 'enter',
  variant: 'raised',
};

const PromptComposerDefaultsContext = createContext<PromptComposerDefaults>(FALLBACK);

export function usePromptComposerDefaults(): PromptComposerDefaults {
  return useContext(PromptComposerDefaultsContext);
}

/**
 * An application decides once how its composers look and which key sends. A
 * composer that states any of them itself still wins. What the buttons say
 * comes from the language in force (`SlottedProvider`).
 */
export function PromptComposerDefaultsProvider({
  children,
  ...defaults
}: PromptComposerDefaultsProviderProps) {
  const inherited = usePromptComposerDefaults();
  const value = { ...inherited };
  for (const [key, entry] of Object.entries(defaults)) {
    if (entry !== undefined) (value as Record<string, unknown>)[key] = entry;
  }
  return (
    <PromptComposerDefaultsContext.Provider value={value}>
      {children}
    </PromptComposerDefaultsContext.Provider>
  );
}
