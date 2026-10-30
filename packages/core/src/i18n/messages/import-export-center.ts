import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * Every word `import-export-center` writes. The status line, the announcer and
 * the toast read the same messages, so they say the same thing about a job.
 * `{direction}` is `import` or `export`.
 */
export interface ImportExportCenterMessages {
  readonly title: Message;
  readonly active: Message<{ count: number }>;
  readonly clear: Message;
  readonly views: Message;
  readonly all: Message;
  readonly imports: Message;
  readonly exports: Message;
  readonly import: Message;
  readonly export: Message;
  readonly queued: Message;
  readonly running: Message;
  readonly success: Message;
  readonly partial: Message<{ failed: number }>;
  readonly failed: Message;
  readonly canceled: Message;
  readonly download: Message;
  readonly downloadErrors: Message;
  readonly cancel: Message;
  readonly retry: Message;
  readonly regenerate: Message;
  readonly details: Message;
  readonly remove: Message;
  readonly loadMore: Message;
  readonly loading: Message;
  readonly empty: Message;
  readonly emptyImports: Message;
  readonly emptyExports: Message;
  readonly emptyDescription: Message;
  readonly loadError: Message;
  readonly loadErrorDescription: Message;
  readonly reload: Message;
  readonly rows: Message<{ count: number }>;
  readonly ofRows: Message<{ value: number; max: number }>;
  /** `{value}` and `{max}` are sizes already written with their unit. */
  readonly ofBytes: Message<{ value: string; max: string }>;
  readonly created: Message<{ count: number }>;
  readonly updated: Message<{ count: number }>;
  readonly skipped: Message<{ count: number }>;
  /** `{duration}` is already written in words. */
  readonly remaining: Message<{ duration: string }>;
  readonly expires: Message<{ date: string }>;
  readonly expired: Message<{ date: string }>;
  readonly sample: Message<{ shown: number; total: number }>;
  readonly countLabels: {
    readonly total: Message;
    readonly processed: Message;
    readonly created: Message;
    readonly updated: Message;
    readonly skipped: Message;
    readonly failed: Message;
  };
  readonly fileLabels: {
    readonly source: Message;
    readonly result: Message;
    readonly errors: Message;
  };
  readonly errorsCaption: Message;
  readonly errorColumns: {
    readonly row: Message;
    readonly message: Message;
    readonly column: Message;
    readonly value: Message;
  };
  readonly view: Message;
  /** What the announcer says when a job changes state. */
  readonly announce: {
    readonly started: Message<{ direction: string; title: string }>;
    readonly success: Message<{ direction: string; title: string }>;
    readonly partial: Message<{ direction: string; title: string; failed: number }>;
    readonly failed: Message<{ direction: string; title: string }>;
    readonly canceled: Message<{ direction: string; title: string }>;
  };
}

export const en: ImportExportCenterMessages = {
  title: 'Imports and exports',
  active: '{count} in progress',
  clear: 'Clear finished',
  views: 'Views',
  all: 'All',
  imports: 'Imports',
  exports: 'Exports',
  import: 'Import',
  export: 'Export',
  queued: 'Queued',
  running: 'In progress',
  success: 'Completed',
  partial: 'Completed with {failed, plural, one {# error} other {# errors}}',
  failed: 'Failed',
  canceled: 'Canceled',
  download: 'Download',
  downloadErrors: 'Download errors',
  cancel: 'Cancel',
  retry: 'Try again',
  regenerate: 'Generate again',
  details: 'Details',
  remove: 'Remove from history',
  loadMore: 'Load more',
  loading: 'Loading jobs',
  empty: 'No imports or exports',
  emptyImports: 'No imports',
  emptyExports: 'No exports',
  emptyDescription: 'An import or export started from any list appears here.',
  loadError: 'The jobs could not be loaded',
  loadErrorDescription: 'Check the connection and try again.',
  reload: 'Try again',
  rows: '{count, plural, one {# row} other {# rows}}',
  ofRows: '{value} of {max, plural, one {# row} other {# rows}}',
  ofBytes: '{value} of {max}',
  created: '{count} created',
  updated: '{count} updated',
  skipped: '{count} skipped',
  remaining: 'about {duration} left',
  expires: 'Available until {date}',
  expired: 'Expired on {date}',
  sample: 'Showing {shown} of {total}',
  countLabels: {
    total: 'Total',
    processed: 'Processed',
    created: 'Created',
    updated: 'Updated',
    skipped: 'Skipped',
    failed: 'With errors',
  },
  fileLabels: {
    source: 'Original file',
    result: 'Result',
    errors: 'Error report',
  },
  errorsCaption: 'Rows with errors',
  errorColumns: {
    row: 'Row',
    message: 'Error',
    column: 'Column',
    value: 'Value',
  },
  view: 'View',
  announce: {
    started: '{direction, select, import {Import} other {Export}} {title} started',
    success: '{direction, select, import {Import} other {Export}} {title} completed',
    partial:
      '{direction, select, import {Import} other {Export}} {title} completed with {failed, plural, one {# error} other {# errors}}',
    failed: '{direction, select, import {Import} other {Export}} {title} failed',
    canceled: '{direction, select, import {Import} other {Export}} {title} canceled',
  },
};

export const importExportCenterMessages: MessageFamily<
  'importExportCenter',
  ImportExportCenterMessages
> = { name: 'importExportCenter', base: en };
