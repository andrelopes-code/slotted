import { createContext, useContext } from 'react';

import type { ColorPickerDefaults, ColorPickerDefaultsProviderProps } from './color-picker.types';

const FALLBACK: ColorPickerDefaults = {
  format: 'hex',
  presets: undefined,
  size: 'md',
};

const ColorPickerDefaultsContext = createContext<ColorPickerDefaults>(FALLBACK);

export function useColorPickerDefaults(): ColorPickerDefaults {
  return useContext(ColorPickerDefaultsContext);
}

/**
 * An application decides once its notation, its palette and its size. The
 * words come from the language in force (`SlottedProvider`).
 */
export function ColorPickerDefaultsProvider({
  children,
  ...defaults
}: ColorPickerDefaultsProviderProps) {
  const inherited = useColorPickerDefaults();
  const value = { ...inherited };
  for (const [key, entry] of Object.entries(defaults)) {
    if (entry !== undefined) (value as Record<string, unknown>)[key] = entry;
  }
  return (
    <ColorPickerDefaultsContext.Provider value={value}>
      {children}
    </ColorPickerDefaultsContext.Provider>
  );
}
