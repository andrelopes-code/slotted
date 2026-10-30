import { createContext, useContext } from 'react';

import type { ButtonDefaults, ButtonDefaultsProviderProps } from './button.types';

const ButtonDefaultsContext = createContext<ButtonDefaults>({});

/**
 * What a button paints itself as here, before it states anything of its own.
 *
 * Every axis is optional, and that is the difference from a family with one
 * member. The four members disagree about their own defaults on purpose — a
 * primary action is accent and solid, an icon button is neutral and ghost — so
 * a provider that filled every axis would flatten them into one appearance the
 * moment an application set a single value.
 */
export function useButtonDefaults(): ButtonDefaults {
  return useContext(ButtonDefaultsContext);
}

/**
 * An application decides once how its actions are painted and how large they
 * are, rather than repeating three props on every button. A button that states
 * an axis itself still wins: an explicit value is never overridden by context.
 */
export function ButtonDefaultsProvider({ children, ...defaults }: ButtonDefaultsProviderProps) {
  const inherited = useButtonDefaults();

  return (
    <ButtonDefaultsContext.Provider
      value={{
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </ButtonDefaultsContext.Provider>
  );
}
