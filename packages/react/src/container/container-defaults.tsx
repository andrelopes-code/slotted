import { createContext, useContext } from 'react';

import type { ContainerDefaults, ContainerDefaultsProviderProps } from './container.types';

/**
 * `content` rather than the widest bounded step, which is what the four
 * surveyed libraries that state a default all choose. A dashboard that
 * inherits `content` looks too narrow the first time it is opened and is
 * corrected; a settings page that inherits `wide` merely has lines that are
 * somewhat too long, which nobody reports.
 */
const FALLBACK: ContainerDefaults = { align: 'center', inset: 6, size: 'content' };

const ContainerDefaultsContext = createContext<ContainerDefaults>(FALLBACK);

/** What a container bounds here, before it states anything of its own. */
export function useContainerDefaults(): ContainerDefaults {
  return useContext(ContainerDefaultsContext);
}

/**
 * An application decides once what its pages are bounded to and how far they
 * are inset, rather than repeating three props on every container. A container
 * that states any of them itself still wins: an explicit value is never
 * overridden by context.
 */
export function ContainerDefaultsProvider({
  children,
  ...defaults
}: ContainerDefaultsProviderProps) {
  const inherited = useContainerDefaults();

  return (
    <ContainerDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        inset: defaults.inset ?? inherited.inset,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </ContainerDefaultsContext.Provider>
  );
}
