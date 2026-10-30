import { createContext, useContext } from 'react';

import type { MarkdownDefaults, MarkdownDefaultsProviderProps } from './markdown.types';

const MarkdownDefaultsContext = createContext<MarkdownDefaults>({});

export function useMarkdownDefaults(): MarkdownDefaults {
  return useContext(MarkdownDefaultsContext);
}

/**
 * An application decides once how its documents treat links, alerts, anchors
 * and URLs. A document that states any of them itself still wins; a nested
 * provider narrows the decision for one part of the page. Its words come from
 * the language in force (`SlottedProvider`).
 */
export function MarkdownDefaultsProvider({ children, ...defaults }: MarkdownDefaultsProviderProps) {
  const inherited = useMarkdownDefaults();

  return (
    <MarkdownDefaultsContext.Provider
      value={{
        alerts: defaults.alerts ?? inherited.alerts,
        allow: defaults.allow ?? inherited.allow,
        external: defaults.external ?? inherited.external,
        headingAnchors: defaults.headingAnchors ?? inherited.headingAnchors,
        isExternal: defaults.isExternal ?? inherited.isExternal,
        transformUrl: defaults.transformUrl ?? inherited.transformUrl,
      }}
    >
      {children}
    </MarkdownDefaultsContext.Provider>
  );
}
