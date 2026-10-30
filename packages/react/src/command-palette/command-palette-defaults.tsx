import { createContext, useContext } from 'react';

import type {
  CommandPaletteDefaults,
  CommandPaletteDefaultsProviderProps,
} from './command-palette.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `loop` is `true`, as `menu`'s is and unlike `combobox`'s: a palette is a
 * short list of commands, and wrapping from the last to the first is the
 * gesture a reader holding ArrowDown expects.
 *
 * `autoHighlight` is `true`, unlike `combobox`'s: the first result is what
 * `Enter` runs, which is the whole speed of a palette. A combobox commits a
 * value into a form and cannot afford a highlight nobody looked at; a palette
 * runs a command the reader can see.
 *
 * `hotkey` is `mod+k`, the chord Linear, Slack, GitHub and Vercel answer and
 * Mantine's default. Firefox uses it for its search bar; the family calls
 * `preventDefault` when it matches.
 *
 * `recentLimit` is five: enough to hold what a reader keeps coming back to,
 * and few enough that the recents do not push the first group off the screen.
 */
export const COMMAND_PALETTE_FALLBACK: CommandPaletteDefaults = {
  presentation: 'dialog',
  size: 'md',
  outsidePress: 'close',
  loop: true,
  autoHighlight: true,
  closeOnSelect: true,
  clearOnClose: true,
  highlightMatch: true,
  hotkey: 'mod+k',
  recentLimit: 5,
};

const CommandPaletteDefaultsContext =
  createContext<CommandPaletteDefaults>(COMMAND_PALETTE_FALLBACK);

/** The defaults in force here. A palette reads it; a consumer rarely needs to. */
export function useCommandPaletteDefaults(): CommandPaletteDefaults {
  return useContext(CommandPaletteDefaultsContext);
}

/**
 * The decisions an application takes once — the hotkey, the measure and the
 * behavior. The sentences the family speaks come from the language in force
 * (`SlottedProvider`).
 */
export function CommandPaletteDefaultsProvider({
  children,
  ...overrides
}: CommandPaletteDefaultsProviderProps) {
  const inherited = useCommandPaletteDefaults();
  const value = { ...inherited };
  for (const key of Object.keys(inherited) as (keyof CommandPaletteDefaults)[]) {
    const override = overrides[key];
    if (override !== undefined) (value as Record<string, unknown>)[key] = override;
  }
  return (
    <CommandPaletteDefaultsContext.Provider value={value}>
      {children}
    </CommandPaletteDefaultsContext.Provider>
  );
}
