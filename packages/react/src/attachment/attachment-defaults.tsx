import { createContext, useContext } from 'react';

import type { AttachmentDefaults, AttachmentDefaultsProviderProps } from './attachment.types';

const FALLBACK: AttachmentDefaults = {
  layout: 'list',
  orientation: 'horizontal',
  size: 'md',
};

const AttachmentDefaultsContext = createContext<AttachmentDefaults>(FALLBACK);

/** What an attachment renders as here, before its group or itself states anything. */
export function useAttachmentDefaults(): AttachmentDefaults {
  return useContext(AttachmentDefaultsContext);
}

/**
 * An application decides once how large its attachments are and how a set of
 * them is arranged. A group or an attachment that states either still wins.
 * Their words and the locale that writes their sizes come from the language
 * in force (`SlottedProvider`).
 */
export function AttachmentDefaultsProvider({
  children,
  ...defaults
}: AttachmentDefaultsProviderProps) {
  const inherited = useAttachmentDefaults();

  return (
    <AttachmentDefaultsContext.Provider
      value={{
        layout: defaults.layout ?? inherited.layout,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </AttachmentDefaultsContext.Provider>
  );
}
