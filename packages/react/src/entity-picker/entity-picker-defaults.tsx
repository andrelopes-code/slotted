import { createContext, useContext } from 'react';

import type {
  EntityPickerDefaults,
  EntityPickerDefaultsProviderProps,
} from './entity-picker.types';

/** The contract's defaults, `specs/components/entity-picker/contract.json`. */
export const ENTITY_PICKER_FALLBACK: EntityPickerDefaults = {
  clearable: true,
  disabled: false,
  fullWidth: true,
  highlightMatch: true,
  invalid: false,
  loop: false,
  media: 'avatar',
  minQueryLength: 0,
  openOn: 'input',
  overflow: 'collapse',
  portal: true,
  readOnly: false,
  required: false,
  searchDelay: 250,
  side: 'bottom',
  size: 'md',
  strategy: 'absolute',
  variant: 'outline',
  width: 'content',
};

const EntityPickerDefaultsContext = createContext<EntityPickerDefaults>(ENTITY_PICKER_FALLBACK);

/** What an entity picker renders as here, before it states anything of its own. */
export function useEntityPickerDefaults(): EntityPickerDefaults {
  return useContext(EntityPickerDefaultsContext);
}

/**
 * An application decides once how its pickers look and how long they wait. A
 * picker that states any of it itself still wins, and a nested provider
 * overrides only what it names. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function EntityPickerDefaultsProvider({
  children,
  ...rest
}: EntityPickerDefaultsProviderProps) {
  const inherited = useEntityPickerDefaults();
  const value: EntityPickerDefaults = { ...inherited };
  for (const [key, given] of Object.entries(rest)) {
    if (given !== undefined) (value as unknown as Record<string, unknown>)[key] = given;
  }
  return (
    <EntityPickerDefaultsContext.Provider value={value}>
      {children}
    </EntityPickerDefaultsContext.Provider>
  );
}
