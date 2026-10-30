import { inject, Injectable, InjectionToken } from '@angular/core';
import type { JobFileRole } from '@slotted/core/import-export-center';

export type ImportExportCenterSize = 'sm' | 'md';

export type ImportExportCenterLevel = '2' | '3' | '4';

export type ImportExportCenterGrowing = 'none' | 'button';

export type ImportExportCenterTimeFormat = 'relative' | 'absolute';

export type ImportExportCenterStatus = 'ready' | 'error';

/** A press on one of the family's own controls: a pointer, or a key on a focused control. */
export type ImportExportPressReason = 'pointer' | 'keyboard';

export type ImportExportRemoveReason = ImportExportPressReason | 'clear';

/**
 * A request over one of the consumer's facts, carrying the reason and the
 * originating event; `cancel()` refuses it, and a cancelled download or open
 * does not navigate.
 */
export interface ImportExportRequest<Reason extends string> {
  readonly reason: Reason;
  readonly event?: Event | undefined;
  readonly cancelled: boolean;
  cancel(): void;
}

export interface ImportExportJobRequest extends ImportExportRequest<ImportExportPressReason> {
  readonly key: string;
}

export interface ImportExportRemoveRequest extends ImportExportRequest<ImportExportRemoveReason> {
  readonly keys: readonly string[];
}

export interface ImportExportDownloadRequest extends ImportExportRequest<ImportExportPressReason> {
  readonly key: string;
  /** Which of the job's files: the original, the result, or the report of failed rows. */
  readonly file: JobFileRole;
}

export interface ImportExportView {
  readonly value: string;
  readonly label: string;
}

export interface ImportExportCenterDefaults {
  growing: ImportExportCenterGrowing;
  level: ImportExportCenterLevel;
  size: ImportExportCenterSize;
  timeFormat: ImportExportCenterTimeFormat;
  timeZone?: string | undefined;
}

const FALLBACK: ImportExportCenterDefaults = {
  growing: 'none',
  level: '2',
  size: 'md',
  timeFormat: 'relative',
};

export const IMPORT_EXPORT_CENTER_DEFAULTS = new InjectionToken<ImportExportCenterDefaults>(
  'slotted import-export-center defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its job center reads — the size, the rank,
 * how history loads, how time is written and in which zone. A center that
 * states any of them still wins. Its words and the locale come from the
 * language in force (`provideSlotted`).
 */
export function provideImportExportCenterDefaults(defaults: Partial<ImportExportCenterDefaults>) {
  return {
    provide: IMPORT_EXPORT_CENTER_DEFAULTS,
    useFactory: (): ImportExportCenterDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectImportExportCenterDefaults(): ImportExportCenterDefaults {
  return inject(IMPORT_EXPORT_CENTER_DEFAULTS);
}

@Injectable({ providedIn: 'root' })
export class SlImportExportCenterIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-import-export-center-${this.count}`;
  }
}
