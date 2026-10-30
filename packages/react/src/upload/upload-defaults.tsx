import { formatBytes, formatDuration } from '@slotted/core/upload';
import { createContext, useContext } from 'react';

import type { UploadDefaults, UploadDefaultsProviderProps } from './upload.types';

const FALLBACK: UploadDefaults = {
  variant: 'dropzone',
  layout: 'list',
  size: 'md',
  preview: 'auto',
  view: 'auto',
  duplicates: 'reject',
  clickToBrowse: true,
  allowDrop: true,
  allowPaste: true,
  preventDocumentDrop: true,
  autoUpload: true,
  pendingBlocksSubmit: true,
  adapter: undefined,
  concurrency: 3,
  retries: 0,
  retryDelay: 1000,
  stallAfter: 10000,
  maxRows: 6,
  fileKey: undefined,
};

const UploadDefaultsContext = createContext<UploadDefaults>(FALLBACK);

/** What an upload does here, before it states anything of its own. */
export function useUploadDefaults(): UploadDefaults {
  return useContext(UploadDefaultsContext);
}

/**
 * An application decides once what its uploads accept, where they send and how
 * many run at once. A control that states any of them itself still wins. Every
 * word and the locale that writes sizes and durations come from the language
 * in force (`SlottedProvider`).
 *
 * The adapter is here rather than on the family for the same reason: an
 * application sends to one place, and repeating the sender on every form is how
 * one of them ends up pointing somewhere else.
 */
export function UploadDefaultsProvider({ children, ...defaults }: UploadDefaultsProviderProps) {
  const inherited = useUploadDefaults();

  return (
    <UploadDefaultsContext.Provider
      value={{
        ...inherited,
        ...(Object.fromEntries(
          Object.entries(defaults).filter(([, value]) => value !== undefined),
        ) as Partial<UploadDefaults>),
      }}
    >
      {children}
    </UploadDefaultsContext.Provider>
  );
}

/** The two formatters a row and a summary read, bound to one locale. */
export function useUploadFormatters(locale: string) {
  return {
    bytes: (value: number) => formatBytes(value, locale),
    duration: (seconds: number) => formatDuration(seconds, locale),
  };
}
