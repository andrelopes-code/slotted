import { formatBytes, formatDuration } from '@slotted/core/upload';
import type { DuplicatePolicy, UploadAdapterLike } from '@slotted/core/upload';
import { inject, InjectionToken } from '@angular/core';

/** Which of the three shapes the consolidation names is drawn. */
export type UploadVariant = 'dropzone' | 'button' | 'field';

/** A column of rows, or a wall of pictures. The same rows, arranged. */
export type UploadLayout = 'list' | 'grid';

export type UploadSize = 'sm' | 'md' | 'lg';
export type UploadPreview = 'auto' | 'none';
export type UploadView = 'auto' | 'none';

export type UploadFilesReason =
  'select' | 'pointer' | 'keyboard' | 'remove' | 'clear' | 'programmatic';

export type UploadViewingReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'programmatic';

/** The two formatters a row, the summary and the viewer read, bound to one locale. */
export interface UploadFormatters {
  bytes(value: number): string;
  duration(seconds: number): string;
}

export interface UploadDefaults {
  variant: UploadVariant;
  layout: UploadLayout;
  size: UploadSize;
  preview: UploadPreview;
  view: UploadView;
  duplicates: DuplicatePolicy;
  clickToBrowse: boolean;
  allowDrop: boolean;
  allowPaste: boolean;
  preventDocumentDrop: boolean;
  autoUpload: boolean;
  pendingBlocksSubmit: boolean;
  adapter: UploadAdapterLike | undefined;
  concurrency: number;
  retries: number;
  retryDelay: number;
  stallAfter: number;
  maxRows: number;
  fileKey: ((file: File) => string) | undefined;
}

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

export const UPLOAD_DEFAULTS = new InjectionToken<UploadDefaults>('slotted upload defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/** What `provideUploadDefaults` takes: any of the defaults, the rest kept. */
export type UploadDefaultsInput = Partial<UploadDefaults>;

/**
 * An application decides once what its uploads accept, where they send and how
 * many run at once. An upload that states any of them itself still wins. Every
 * word and the locale that writes sizes and durations come from the language
 * in force (`provideSlotted`).
 *
 * The adapter is here for the same reason: an application sends to one place,
 * and repeating the sender on every form is how one of them ends up pointing
 * somewhere else.
 */
export function provideUploadDefaults(defaults: UploadDefaultsInput) {
  return {
    provide: UPLOAD_DEFAULTS,
    useFactory: (): UploadDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectUploadDefaults(): UploadDefaults {
  return inject(UPLOAD_DEFAULTS);
}

/** The two formatters a row and a summary read, bound to one locale. */
export function uploadFormatters(locale: string): UploadFormatters {
  return {
    bytes: (value: number) => formatBytes(value, locale),
    duration: (seconds: number) => formatDuration(seconds, locale),
  };
}
