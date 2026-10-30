import { createContext, useContext, useSyncExternalStore } from 'react';

import type { KbdPlatform, KbdPlatformInput } from '@slotted/core/keys';
import { resolvePlatform } from '@slotted/core/keys';

import type { KbdDefaults, KbdDefaultsProviderProps, KbdSize, KbdVariant } from './kbd.types';

const FALLBACK: KbdDefaults = {
  platform: 'auto',
  size: 'md',
  variant: 'raised',
  separator: '+',
  legends: undefined,
  names: undefined,
};

const KbdDefaultsContext = createContext<KbdDefaults>(FALLBACK);

/** What a key renders as here, before it states anything of its own. */
export function useKbdDefaults(): KbdDefaults {
  return useContext(KbdDefaultsContext);
}

/**
 * An application decides once which platform its shortcuts are written for,
 * how its keys are painted, and which legends and names it writes in place of
 * the catalog's for particular keys. A key that states any of them itself still
 * wins: an explicit prop is never overridden by context. The words come from
 * the `keys` catalog of the language in force (`SlottedProvider`).
 *
 * Nuxt's `useKbd` is the nearest surveyed equivalent and its map is a module
 * constant, so `Strg` and `Échap` cannot be reached from an application at all.
 */
export function KbdDefaultsProvider({ children, ...defaults }: KbdDefaultsProviderProps) {
  const inherited = useKbdDefaults();

  return (
    <KbdDefaultsContext.Provider
      value={{
        platform: defaults.platform ?? inherited.platform,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
        separator: defaults.separator ?? inherited.separator,
        legends: defaults.legends ?? inherited.legends,
        names: defaults.names ?? inherited.names,
      }}
    >
      {children}
    </KbdDefaultsContext.Provider>
  );
}

/**
 * The platform a `Shortcut` inherits, and the axes a `Kbd` inside one takes
 * from it. Without this a group would have to repeat four props on every key it
 * renders, and a key a consumer authored by hand inside a group would be
 * painted differently from the group around it.
 */
export interface KbdGroupValue {
  platform: KbdPlatformInput | undefined;
  size: KbdSize | undefined;
  variant: KbdVariant | undefined;
  disabled: boolean | undefined;
}

export const KbdGroupContext = createContext<KbdGroupValue | undefined>(undefined);

export function useKbdGroup(): KbdGroupValue | undefined {
  return useContext(KbdGroupContext);
}

const subscribe = () => () => {};
const read = () => resolvePlatform('auto');
/**
 * What the server, and the client while it hydrates, both answer. Nothing else
 * can be true before the client is known, and answering anything else is a
 * hydration mismatch rather than a better guess.
 */
const readOnServer = (): KbdPlatform => 'other';

/**
 * The reader's platform, read in the one way that is safe on both sides.
 *
 * A pure client render takes the real answer on its first pass, so there is no
 * flash; a hydrating render takes `other` until hydration finishes and then
 * corrects, so there is no mismatch. Nuxt's `useKbd` resolves in `onMounted`
 * and therefore flashes in both cases; resolving during render instead would
 * remove the flash and produce a mismatch. This is the third answer.
 *
 * An application that server-renders and wants neither states `platform` on the
 * provider, and nothing is detected at all.
 */
export function useResolvedPlatform(stated: KbdPlatformInput | undefined): KbdPlatform {
  const defaults = useKbdDefaults();
  const requested = stated ?? defaults.platform;
  const detected = useSyncExternalStore(subscribe, read, readOnServer);
  return requested === 'auto' ? detected : requested;
}
