import { createContext, useContext } from 'react';

import type { CodeBlockDefaults, CodeBlockDefaultsProviderProps } from './code-block.types';

const CodeBlockDefaultsContext = createContext<CodeBlockDefaults>({});

export function useCodeBlockDefaults(): CodeBlockDefaults {
  return useContext(CodeBlockDefaultsContext);
}

/**
 * An application that has loaded an engine once hands it to every block on
 * the page here — Mantine's `CodeHighlightAdapterProvider` — along with
 * whether blocks number their lines and whether they carry a copy control. A
 * block that states any of those itself still wins. Its words come from the
 * language in force (`SlottedProvider`).
 */
export function CodeBlockDefaultsProvider({
  children,
  ...defaults
}: CodeBlockDefaultsProviderProps) {
  const inherited = useCodeBlockDefaults();

  return (
    <CodeBlockDefaultsContext.Provider
      value={{
        copy: defaults.copy ?? inherited.copy,
        highlight: defaults.highlight ?? inherited.highlight,
        lineNumbers: defaults.lineNumbers ?? inherited.lineNumbers,
      }}
    >
      {children}
    </CodeBlockDefaultsContext.Provider>
  );
}
