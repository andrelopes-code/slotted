import { DestroyRef, inject, signal } from '@angular/core';
import type { ImportExportJob } from '@slotted/core/import-export-center';

/**
 * The jobs of Marina Duarte, operations at Vale Norte Distribuidora: one
 * domain for every scene, so the page reads as one product. The same facts
 * the React pages show.
 */
export const NOW = Date.parse('2026-09-25T14:00:00Z');

const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

export const JOBS: readonly ImportExportJob[] = [
  {
    actor: 'Marina Duarte',
    createdAt: minutesAgo(2),
    direction: 'import',
    format: 'CSV',
    key: 'crm-contacts',
    progress: { max: 5000, value: 1204 },
    source: { name: 'crm-contacts-2026-09-24.csv', size: 4_200_000 },
    stage: 'Writing records',
    status: 'running',
    title: 'CRM Contacts',
  },
  {
    actor: 'Marina Duarte',
    createdAt: minutesAgo(1),
    direction: 'export',
    format: 'XLSX',
    key: 'stock-september',
    stage: 'Starts after CRM Contacts',
    status: 'queued',
    title: 'Stock movements — September',
  },
  {
    counts: { created: 2210, failed: 12, processed: 2988, total: 3000, updated: 778 },
    createdAt: minutesAgo(190),
    direction: 'import',
    errorCount: 12,
    errors: [
      { column: 'SKU', message: 'Required field is empty', row: 14, value: '' },
      { column: 'Price', message: 'Not a number', row: 208, value: '12.5O' },
      { column: 'HS code', message: '8-digit code expected', row: 391, value: '8471.3' },
      { column: 'Category', message: 'Category does not exist', row: 1027, value: 'Hardware' },
      { column: 'SKU', message: 'Duplicate SKU on row 2,588', row: 2640, value: 'VN-00431' },
    ],
    errorsFile: { href: '#catalogo-erros', name: 'catalogo-outono-2026-erros.csv', size: 2_048 },
    finishedAt: minutesAgo(180),
    format: 'XLSX',
    key: 'catalog-autumn',
    source: {
      expiresAt: '2026-10-02T23:59:00Z',
      href: '#catalogo',
      name: 'catalogo-outono-2026.xlsx',
      size: 1_800_000,
    },
    status: 'succeeded',
    title: 'Product catalog',
  },
  {
    createdAt: minutesAgo(262),
    direction: 'export',
    finishedAt: minutesAgo(260),
    format: 'CSV',
    key: 'invoices-q3',
    result: {
      expiresAt: '2026-10-02T09:40:00Z',
      href: '#invoices',
      name: 'invoices-q3-2026.csv',
      size: 640_000,
    },
    status: 'succeeded',
    title: 'Q3 invoices',
  },
  {
    createdAt: minutesAgo(380),
    direction: 'export',
    finishedAt: minutesAgo(370),
    format: 'PDF',
    key: 'debtors',
    message: 'The reporting service did not respond within 10 minutes.',
    status: 'failed',
    title: 'Delinquent customers statement',
  },
  {
    actor: 'Rui Tavares',
    createdAt: '2026-09-24T17:30:00Z',
    direction: 'import',
    finishedAt: '2026-09-24T17:31:00Z',
    format: 'JSON',
    key: 'freight',
    stage: 'No records written',
    status: 'canceled',
    title: 'Freight rates',
  },
];

/** Files that expire, expired, and may not be downloaded. */
export const FILE_JOBS: readonly ImportExportJob[] = [
  {
    createdAt: '2026-09-01T10:00:00Z',
    direction: 'export',
    finishedAt: '2026-09-01T10:04:00Z',
    format: 'ZIP',
    key: 'nfe-august',
    result: {
      expiresAt: '2026-09-08T10:00:00Z',
      href: '#nfe',
      name: 'notas-fiscais-agosto.zip',
      size: 312_000_000,
    },
    status: 'succeeded',
    title: 'Notas fiscais de agosto',
  },
  {
    actor: 'Rui Tavares',
    counts: { processed: 860, total: 860, updated: 860 },
    createdAt: '2026-09-20T15:30:00Z',
    direction: 'import',
    finishedAt: '2026-09-20T15:32:00Z',
    format: 'CSV',
    key: 'wholesale-prices',
    source: {
      denied:
        'Only the person who imported the file or an administrator can download the original.',
      name: 'wholesale-prices.csv',
      size: 96_000,
    },
    status: 'succeeded',
    title: 'Wholesale price table',
  },
  {
    createdAt: minutesAgo(262),
    direction: 'export',
    finishedAt: minutesAgo(260),
    format: 'CSV',
    key: 'invoices-q3',
    result: {
      expiresAt: '2026-10-02T09:40:00Z',
      href: '#invoices',
      name: 'invoices-q3-2026.csv',
      size: 640_000,
    },
    status: 'succeeded',
    title: 'Q3 invoices',
  },
];

/**
 * A store that answers every request the centre makes, and a server that
 * moves the running job forward. Created in an injection context: the timer
 * is torn down with the component that owns it.
 */
export class JobStore {
  readonly jobs = signal<readonly ImportExportJob[]>([]);

  constructor(
    seed: readonly ImportExportJob[] = JOBS,
    { live = true }: { live?: boolean | (() => boolean) } = {},
  ) {
    this.jobs.set(seed);
    if (live === false) return;
    const moving = typeof live === 'function' ? live : () => true;
    const timer = setInterval(() => {
      if (moving()) this.tick();
    }, 900);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  reseed(seed: readonly ImportExportJob[]) {
    this.jobs.set(seed);
  }

  add(job: ImportExportJob) {
    this.jobs.update((current) => [job, ...current]);
  }

  cancel(key: string) {
    this.patch(key, { stage: 'No records written', status: 'canceled' });
  }

  retry(key: string) {
    this.patch(key, {
      counts: undefined,
      message: undefined,
      progress: undefined,
      result: undefined,
      stage: 'Na fila de reprocessamento',
      status: 'queued',
    });
  }

  remove(keys: readonly string[]) {
    this.jobs.update((current) => current.filter((job) => !keys.includes(job.key)));
  }

  private patch(key: string, patch: Partial<ImportExportJob>) {
    this.jobs.update((current) =>
      current.map((job) => (job.key === key ? { ...job, ...patch } : job)),
    );
  }

  private tick() {
    this.jobs.update((current) => {
      let started = current.some((job) => job.status === 'running');
      return current.map((job) => {
        if (job.status === 'queued' && !started) {
          started = true;
          return {
            ...job,
            progress: { max: 1200, value: 0 },
            stage: 'Lendo registros',
            status: 'running',
          };
        }
        if (job.status !== 'running' || job.progress?.value === undefined) return job;
        const max = job.progress.max ?? 100;
        const value = Math.min(max, job.progress.value + Math.ceil(max / 14));
        if (value < max) return { ...job, progress: { ...job.progress, value } };
        return {
          ...job,
          counts: {
            processed: max,
            total: max,
            ...(job.direction === 'import' ? { created: max } : {}),
          },
          finishedAt: new Date().toISOString(),
          progress: undefined,
          result:
            job.direction === 'export'
              ? {
                  expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
                  href: '#resultado',
                  name: `${job.key}.${(job.format ?? 'csv').toLowerCase()}`,
                  size: 184_000,
                }
              : job.result,
          stage: undefined,
          status: 'succeeded',
        };
      });
    });
  }
}

/** The jobs whose keys a scene names, in the fixture's order. */
export function jobsOf(keys: readonly string[]): readonly ImportExportJob[] {
  return JOBS.filter((job) => keys.includes(job.key));
}
