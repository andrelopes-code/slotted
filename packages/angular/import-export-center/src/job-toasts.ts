import { effect, inject, signal, untracked } from '@angular/core';
import type { Signal, TemplateRef } from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlToastService } from '@slotted/angular/toast';
import type { ToastContent, ToastMessage } from '@slotted/angular/toast';
import {
  importExportCenterMessages,
  type ImportExportCenterMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { jobNotice } from '@slotted/core/import-export-center';
import type { ImportExportJob } from '@slotted/core/import-export-center';

export interface JobToastsOptions {
  /**
   * The toast's View control, written by the consumer and rendered per
   * message. A function — a `viewChild` signal — is read when a toast is
   * shown, so a template that exists only after the view is created still
   * reaches it. The message's `data` carries `{ key }`, and `noticeKey(message.id)`
   * from `@slotted/core/import-export-center` reads the same key back.
   */
  actions?:
    | TemplateRef<{ $implicit: ToastMessage<ToastContent> }>
    | (() => TemplateRef<{ $implicit: ToastMessage<ToastContent> }> | undefined)
    | undefined;
  /** Words laid over the catalog of the language in force: the announcement a toast carries. */
  messages?: PartialMessages<ImportExportCenterMessages> | undefined;
}

/** What a notice's toast carries in `data`: the job it points at. */
export interface JobToastData {
  readonly key: string;
}

/**
 * A toast that points at a job, for a page that is not the centre: the job
 * started, finished, finished with failed rows, failed. Called once in an
 * injection context where the application keeps its jobs — the shell — so
 * the reader hears of a job that finishes while they work elsewhere.
 *
 * The toast only points. It carries no progress, no cancel and no download;
 * its one action is the consumer's View, which takes the reader to the centre
 * and calls its `reveal(key)`. Its id is the job's key under
 * `import-export-center:`, so the finishing notice replaces the starting one
 * in place. Its announcement is the sentence the centre says for the same
 * transition, which the shared announcer does not repeat when both are
 * mounted. The jobs present the first time the signal is read made no move
 * the reader saw, and get no toast.
 */
export function jobToasts(
  jobs: Signal<readonly ImportExportJob[]>,
  { actions, messages }: JobToastsOptions = {},
): void {
  const toasts = inject(SlToastService);
  const t = injectMessages(importExportCenterMessages, signal(messages));
  let previous: ReadonlyMap<string, ImportExportJob> | null = null;

  effect(() => {
    const current = jobs();
    untracked(() => {
      const seen = previous;
      previous = new Map(current.map((job) => [job.key, job]));
      if (seen === null) return;
      for (const job of current) {
        const notice = jobNotice(seen.get(job.key), job, t);
        if (notice === null) continue;
        const template = typeof actions === 'function' ? actions() : actions;
        toasts.show({
          ...(template === undefined ? {} : { actions: template }),
          announcement: notice.title,
          data: { key: notice.key } satisfies JobToastData,
          description: notice.description,
          id: notice.id,
          loading: notice.loading,
          title: notice.title,
          tone: notice.tone,
        });
      }
    });
  });
}
