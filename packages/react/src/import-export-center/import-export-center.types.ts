import type { ImportExportJob, JobFileRole } from '@slotted/core/import-export-center';
import type { ImportExportCenterMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { Toaster } from '../toast';

export type ImportExportCenterSize = 'sm' | 'md';

export type ImportExportCenterLevel = '2' | '3' | '4';

export type ImportExportCenterGrowing = 'none' | 'button';

export type ImportExportCenterTimeFormat = 'relative' | 'absolute';

export type ImportExportCenterStatus = 'ready' | 'error';

/** A press on one of the family's own controls: a pointer, or a key on a focused control. */
export type ImportExportPressReason = 'pointer' | 'keyboard';

export type ImportExportRemoveReason = ImportExportPressReason | 'clear';

export type ImportExportModelReason = ImportExportPressReason | 'programmatic';

/**
 * A request over one of the consumer's facts. It carries the reason and the
 * originating event, and `cancel()` refuses it: a cancelled download or open
 * does not navigate.
 */
export interface ImportExportRequest<Reason extends string> {
  readonly reason: Reason;
  readonly source?: unknown;
  readonly cancelled: boolean;
  cancel(): void;
}

export interface ImportExportRemoval {
  readonly keys: readonly string[];
}

export interface ImportExportDownload {
  readonly key: string;
  /** Which of the job's files: the original, the result, or the report of failed rows. */
  readonly file: JobFileRole;
}

export interface ImportExportView {
  readonly value: string;
  readonly label: ReactNode;
}

export interface ImportExportCenterDefaults {
  growing: ImportExportCenterGrowing;
  level: ImportExportCenterLevel;
  size: ImportExportCenterSize;
  timeFormat: ImportExportCenterTimeFormat;
  timeZone?: string | undefined;
}

export interface ImportExportCenterDefaultsProviderProps extends Partial<ImportExportCenterDefaults> {
  children?: ReactNode | undefined;
}

export interface ImportExportCenterRootProps extends HTMLAttributes<HTMLElement> {
  'data-growing': ImportExportCenterGrowing;
  'data-level': ImportExportCenterLevel;
  'data-loading'?: '' | undefined;
  'data-part': 'root';
  'data-size': ImportExportCenterSize;
  'data-status'?: 'error' | undefined;
  'data-time-format': ImportExportCenterTimeFormat;
  'data-ui': 'import-export-center';
  'data-view': string;
  ref?: Ref<HTMLElement> | undefined;
}

export interface ImportExportCenterHandle {
  readonly element: HTMLElement | null;
  /** Focuses the first job's first control, or the list when there is none. */
  focus(): void;
  /**
   * Shows a job's details, scrolls it into view and focuses its title: where
   * a toast's View takes the reader. Asks `expanded` with the reason
   * `programmatic`.
   */
  reveal(key: string): void;
}

export interface ImportExportCenterProps extends Omit<
  ComponentPropsWithRef<'section'>,
  'children' | 'ref' | 'title'
> {
  /** The consumer's jobs, in the order they are drawn. The family changes none of them. */
  jobs: readonly ImportExportJob[];
  /** The consumer's own controls in the header: an import dialog's trigger, an export button. */
  actions?: ReactNode | undefined;
  /** The views of the strip. `all`, `import` and `export` when not stated; one entry hides it. */
  views?: readonly ImportExportView[] | undefined;
  /** The view in use, controlled. */
  view?: string | undefined;
  /** The view an uncontrolled center starts on, read once. */
  defaultView?: string | undefined;
  onViewChange?: ((view: string, request: ChangeRequest<string>) => void) | undefined;
  /** The keys whose details are shown, controlled. */
  expanded?: readonly string[] | undefined;
  /** The keys an uncontrolled center starts with shown, read once. */
  defaultExpanded?: readonly string[] | undefined;
  onExpandedChange?:
    ((keys: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;
  onCancel?:
    ((key: string, request: ImportExportRequest<ImportExportPressReason>) => void) | undefined;
  onRetry?:
    ((key: string, request: ImportExportRequest<ImportExportPressReason>) => void) | undefined;
  onRemove?:
    | ((
        removal: ImportExportRemoval,
        request: ImportExportRequest<ImportExportRemoveReason>,
      ) => void)
    | undefined;
  /**
   * Asked before a download. With an `href` the link navigates unless the
   * request is cancelled; without one the consumer produces the file here.
   */
  onDownload?:
    | ((
        download: ImportExportDownload,
        request: ImportExportRequest<ImportExportPressReason>,
      ) => void)
    | undefined;
  /** Asked before the title's link navigates to the job's page; cancellable. */
  onOpen?:
    ((key: string, request: ImportExportRequest<ImportExportPressReason>) => void) | undefined;
  onLoadMore?: ((request: ImportExportRequest<ImportExportPressReason>) => void) | undefined;
  onReload?: ((request: ImportExportRequest<ImportExportPressReason>) => void) | undefined;
  /** Whether the history has another page; `growing="button"` draws `more` while it has. */
  hasMore?: boolean | undefined;
  loading?: boolean | undefined;
  status?: ImportExportCenterStatus | undefined;
  growing?: ImportExportCenterGrowing | undefined;
  level?: ImportExportCenterLevel | undefined;
  size?: ImportExportCenterSize | undefined;
  timeFormat?: ImportExportCenterTimeFormat | undefined;
  locale?: string | undefined;
  timeZone?: string | undefined;
  /** The moment a relative reading and a deadline count from, in epoch milliseconds. */
  now?: number | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<ImportExportCenterMessages> | undefined;
  /** Replaces the view's empty page. */
  empty?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  /** The consumer's own controls for one job, after the family's. */
  renderJobActions?: ((job: ImportExportJob) => ReactNode) | undefined;
  render?: ((props: ImportExportCenterRootProps) => ReactNode) | undefined;
  ref?: Ref<ImportExportCenterHandle> | undefined;
}

export interface UseJobToastsOptions {
  /** The toaster the notices go to; the shared `toast` when absent. */
  toaster?: Toaster | undefined;
  /** What View does: navigate to the center, then call its `reveal(key)`. */
  onView?: ((key: string) => void) | undefined;
  /** Words laid over the catalog of the language in force: the announcement and View. */
  messages?: PartialMessages<ImportExportCenterMessages> | undefined;
}
