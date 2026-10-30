import { createContext, useContext } from 'react';

import type { AccordionDefaults, AccordionDefaultsProviderProps } from './accordion.types';

const FALLBACK: AccordionDefaults = {
  headingLevel: '3',
  indicator: 'chevron',
  loop: true,
  mount: 'eager',
  multiple: false,
  requireOpen: false,
  size: 'md',
  togglePlacement: 'end',
  truncate: false,
  variant: 'ruled',
};

const AccordionDefaultsContext = createContext<AccordionDefaults>(FALLBACK);

/** What an accordion renders as here, before it states anything of its own. */
export function useAccordionDefaults(): AccordionDefaults {
  return useContext(AccordionDefaultsContext);
}

/**
 * An application decides once how its accordions look and behave, rather than
 * repeating the same ten props on every set in a product. A set that states any
 * of them itself still wins.
 */
export function AccordionDefaultsProvider({
  children,
  ...defaults
}: AccordionDefaultsProviderProps) {
  const inherited = useAccordionDefaults();

  return (
    <AccordionDefaultsContext.Provider
      value={{
        headingLevel: defaults.headingLevel ?? inherited.headingLevel,
        indicator: defaults.indicator ?? inherited.indicator,
        loop: defaults.loop ?? inherited.loop,
        mount: defaults.mount ?? inherited.mount,
        multiple: defaults.multiple ?? inherited.multiple,
        requireOpen: defaults.requireOpen ?? inherited.requireOpen,
        size: defaults.size ?? inherited.size,
        togglePlacement: defaults.togglePlacement ?? inherited.togglePlacement,
        truncate: defaults.truncate ?? inherited.truncate,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </AccordionDefaultsContext.Provider>
  );
}
