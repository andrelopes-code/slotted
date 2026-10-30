import { describe, expect, it } from 'vitest';

import { createTranslator, importExportCenterMessages } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';
import {
  activeJobCount,
  estimateFinish,
  failedRows,
  fileAvailability,
  filterJobs,
  focusDestination,
  hasDetails,
  isActiveJob,
  jobAnnouncement,
  jobControls,
  jobGlyph,
  jobNotice,
  jobOutcome,
  jobProgressText,
  jobSummaryText,
  jobTone,
  jobTransition,
  noticeKey,
  remainingSeconds,
} from './index';
import type { ImportExportJob } from './index';

const NOW = Date.parse('2026-09-25T14:00:00Z');

/** The family's words in Brazilian Portuguese, whose digits group with a dot. */
const t = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
  importExportCenterMessages,
);
const en = createTranslator({ locale: 'en-US' }).family(importExportCenterMessages);

function job(patch: Partial<ImportExportJob> = {}): ImportExportJob {
  return { key: 'j', direction: 'import', title: 'Contacts', status: 'running', ...patch };
}

describe('jobOutcome', () => {
  it('has no outcome while the job is queued or running', () => {
    expect(jobOutcome(job({ status: 'queued' }))).toBeNull();
    expect(jobOutcome(job({ status: 'running' }))).toBeNull();
  });

  it('calls a finished job with a failed row partial, never success', () => {
    expect(jobOutcome(job({ status: 'succeeded' }))).toBe('success');
    expect(jobOutcome(job({ status: 'succeeded', counts: { failed: 12 } }))).toBe('partial');
    expect(jobOutcome(job({ status: 'succeeded', errorCount: 3 }))).toBe('partial');
    expect(jobOutcome(job({ status: 'succeeded', errors: [{ row: 4, message: 'vazio' }] }))).toBe(
      'partial',
    );
  });

  it('keeps failed and canceled as their own outcomes', () => {
    expect(jobOutcome(job({ status: 'failed', counts: { failed: 0 } }))).toBe('failed');
    expect(jobOutcome(job({ status: 'canceled' }))).toBe('canceled');
  });
});

describe('failedRows', () => {
  it('reads the count first, then the stated total, then the rows it was sent', () => {
    expect(failedRows(job({ counts: { failed: 9 }, errorCount: 12 }))).toBe(9);
    expect(failedRows(job({ errorCount: 12, errors: [{ row: 1, message: 'x' }] }))).toBe(12);
    expect(failedRows(job({ errors: [{ row: 1, message: 'x' }] }))).toBe(1);
    expect(failedRows(job())).toBe(0);
  });
});

describe('jobTone and jobGlyph', () => {
  it('maps every state to the tone and the mark the contract declares', () => {
    const cases: Array<[Partial<ImportExportJob>, string, string]> = [
      [{ status: 'queued' }, 'secondary', 'clock'],
      [{ status: 'running' }, 'accent', 'spinner'],
      [{ status: 'succeeded' }, 'success', 'circle-check'],
      [{ status: 'succeeded', counts: { failed: 1 } }, 'warning', 'circle-alert'],
      [{ status: 'failed' }, 'danger', 'circle-x'],
      [{ status: 'canceled' }, 'secondary', 'circle'],
    ];
    for (const [patch, tone, glyph] of cases) {
      expect(jobTone(job(patch))).toBe(tone);
      expect(jobGlyph(job(patch))).toBe(glyph);
    }
  });
});

describe('fileAvailability', () => {
  it('says none, available, expires, expired or denied', () => {
    expect(fileAvailability(undefined, { now: NOW })).toBe('none');
    expect(fileAvailability({ name: 'a.csv' }, { now: NOW })).toBe('available');
    expect(
      fileAvailability({ name: 'a.csv', expiresAt: '2026-10-02T09:40:00Z' }, { now: NOW }),
    ).toBe('expires');
    expect(
      fileAvailability({ name: 'a.csv', expiresAt: '2026-09-08T10:00:00Z' }, { now: NOW }),
    ).toBe('expired');
    expect(fileAvailability({ name: 'a.csv', denied: 'No permission' }, { now: NOW })).toBe(
      'denied',
    );
  });

  it('measures a wall-clock deadline against the stated zone', () => {
    const file = { name: 'a.csv', expiresAt: '2026-09-25T13:30:00' };
    /* 13:30 in Sao Paulo is 16:30 UTC, after NOW; 13:30 UTC is before it. */
    expect(fileAvailability(file, { now: NOW, timeZone: 'America/Sao_Paulo' })).toBe('expires');
    expect(fileAvailability(file, { now: NOW, timeZone: 'UTC' })).toBe('expired');
  });
});

describe('jobControls', () => {
  it('offers cancel while a job is queued or running, and never remove', () => {
    expect(jobControls(job({ status: 'running' }), { now: NOW }).controls).toEqual(['cancel']);
    expect(
      jobControls(job({ status: 'queued', cancelable: false }), { now: NOW }).controls,
    ).toEqual([]);
  });

  it('offers the result, the details and removal once a job has succeeded', () => {
    const result = jobControls(
      job({ status: 'succeeded', direction: 'export', result: { name: 'f.csv', href: '#' } }),
      { now: NOW },
    );
    expect(result.controls).toEqual(['download', 'toggle', 'remove']);
    expect(result.download).toBe('result');
  });

  it('downloads the error report of a partial import that wrote no result file', () => {
    const controls = jobControls(
      job({
        status: 'succeeded',
        counts: { failed: 12 },
        errorsFile: { name: 'e.csv', href: '#' },
      }),
      { now: NOW },
    );
    expect(controls.download).toBe('errors');
    expect(controls.controls[0]).toBe('download');
  });

  it('turns an expired export into a run again', () => {
    const controls = jobControls(
      job({
        status: 'succeeded',
        direction: 'export',
        result: { name: 'n.zip', href: '#', expiresAt: '2026-09-08T10:00:00Z' },
      }),
      { now: NOW },
    );
    expect(controls.controls).toEqual(['retry', 'toggle', 'remove']);
    expect(controls.retry).toBe('regenerate');
    expect(controls.expired).toBe(true);
  });

  it('draws no download for a file the reader may not have, and says why', () => {
    const controls = jobControls(
      job({
        status: 'succeeded',
        result: { name: 'r.csv', href: '#', denied: 'Administrators only' },
      }),
      { now: NOW },
    );
    expect(controls.controls).not.toContain('download');
    expect(controls.denied).toBe('Administrators only');
  });

  it('offers retry after a failure or a cancel, unless the job says it cannot', () => {
    expect(jobControls(job({ status: 'failed' }), { now: NOW }).controls).toEqual([
      'retry',
      'remove',
    ]);
    expect(
      jobControls(job({ status: 'canceled', retryable: false, removable: false }), { now: NOW })
        .controls,
    ).toEqual([]);
  });
});

describe('hasDetails', () => {
  it('has details when there is a count, a file or a failed row to show', () => {
    expect(hasDetails(job())).toBe(false);
    expect(hasDetails(job({ counts: { total: 10 } }))).toBe(true);
    expect(hasDetails(job({ source: { name: 'a.csv' } }))).toBe(true);
    expect(hasDetails(job({ errors: [{ row: 2, message: 'x' }] }))).toBe(true);
  });
});

describe('filterJobs and the active count', () => {
  const jobs = [
    job({ key: 'a', direction: 'import', status: 'running' }),
    job({ key: 'b', direction: 'export', status: 'queued' }),
    job({ key: 'c', direction: 'export', status: 'succeeded' }),
  ];

  it('filters the built-in views by direction and leaves any other view to the consumer', () => {
    expect(filterJobs(jobs, 'all').map((j) => j.key)).toEqual(['a', 'b', 'c']);
    expect(filterJobs(jobs, 'import').map((j) => j.key)).toEqual(['a']);
    expect(filterJobs(jobs, 'export').map((j) => j.key)).toEqual(['b', 'c']);
    expect(filterJobs(jobs, 'mine').map((j) => j.key)).toEqual(['a', 'b', 'c']);
  });

  it('counts queued and running jobs as active', () => {
    expect(isActiveJob(jobs[0]!)).toBe(true);
    expect(isActiveJob(jobs[2]!)).toBe(false);
    expect(activeJobCount(jobs)).toBe(2);
  });
});

describe('estimateFinish', () => {
  it('says nothing from fewer than three samples or under five seconds', () => {
    expect(estimateFinish([{ at: 0, value: 0, max: 100 }], 0)).toBeNull();
    expect(
      estimateFinish(
        [
          { at: 0, value: 10, max: 100 },
          { at: 1000, value: 20, max: 100 },
          { at: 2000, value: 30, max: 100 },
        ],
        2000,
      ),
    ).toBeNull();
  });

  it('extrapolates the rate the updates show', () => {
    const samples = [
      { at: 0, value: 10, max: 100 },
      { at: 5000, value: 20, max: 100 },
      { at: 10000, value: 30, max: 100 },
    ];
    /* 20 in 10 s: 2 per second; 70 left is 35 s after the last sample. */
    expect(estimateFinish(samples, 10000)).toBe(35);
    expect(estimateFinish(samples, 15000)).toBe(30);
  });

  it('says nothing below one per cent or when nothing moved', () => {
    const flat = [
      { at: 0, value: 0.2, max: 100 },
      { at: 5000, value: 0.4, max: 100 },
      { at: 10000, value: 0.6, max: 100 },
    ];
    expect(estimateFinish(flat, 10000)).toBeNull();
    const still = [
      { at: 0, value: 30, max: 100 },
      { at: 5000, value: 30, max: 100 },
      { at: 10000, value: 30, max: 100 },
    ];
    expect(estimateFinish(still, 10000)).toBeNull();
  });
});

describe('remainingSeconds', () => {
  it("prefers the server's eta to the estimate", () => {
    expect(remainingSeconds(job({ eta: '2026-09-25T14:03:00Z' }), [], { now: NOW })).toBe(180);
    expect(remainingSeconds(job({ eta: '2026-09-25T13:00:00Z' }), [], { now: NOW })).toBeNull();
  });
});

describe('jobProgressText', () => {
  it('writes processed of total in the unit, the percentage and the time left', () => {
    expect(
      jobProgressText(job({ progress: { value: 1204, max: 5000 } }), {
        locale: 'pt-BR',
        t,
        remaining: 170,
      }),
    ).toEqual(['1.204 de 5.000 linhas', '24%', 'cerca de 2 min 50 s restantes']);
  });

  it('writes bytes in the size scale and a bare percentage alone', () => {
    expect(
      jobProgressText(job({ progress: { value: 2_500_000, max: 10_000_000, unit: 'bytes' } }), {
        locale: 'pt-BR',
        t,
      }),
    ).toEqual(['2,5 MB de 10 MB', '25%']);
    expect(
      jobProgressText(job({ progress: { value: 40, max: 100, unit: 'percent' } }), {
        locale: 'pt-BR',
        t,
      }),
    ).toEqual(['40%']);
  });

  it('writes nothing for an indeterminate job', () => {
    expect(jobProgressText(job({ progress: {} }), { locale: 'pt-BR', t })).toEqual([]);
    expect(jobProgressText(job(), { locale: 'pt-BR', t })).toEqual([]);
  });
});

describe('jobSummaryText', () => {
  it('writes the counts of a finished job and leaves out what is not stated', () => {
    expect(
      jobSummaryText(
        job({
          status: 'succeeded',
          counts: { total: 3000, processed: 2988, created: 2210, updated: 778 },
        }),
        { locale: 'pt-BR', t },
      ),
    ).toEqual(['2.988 de 3.000 linhas', '2.210 criadas', '778 atualizadas']);
    expect(
      jobSummaryText(job({ status: 'running', counts: { total: 3 } }), {
        locale: 'pt-BR',
        t,
      }),
    ).toEqual([]);
  });
});

describe('jobTransition', () => {
  it('names the move from one state of a job to the next', () => {
    expect(jobTransition(undefined, job({ status: 'running' }))).toBe('started');
    expect(jobTransition(job({ status: 'queued' }), job({ status: 'running' }))).toBe('started');
    expect(jobTransition(job({ status: 'running' }), job({ status: 'succeeded' }))).toBe('success');
    expect(
      jobTransition(
        job({ status: 'running' }),
        job({ status: 'succeeded', counts: { failed: 2 } }),
      ),
    ).toBe('partial');
    expect(jobTransition(job({ status: 'running' }), job({ status: 'failed' }))).toBe('failed');
    expect(jobTransition(job({ status: 'running' }), job({ status: 'canceled' }))).toBe('canceled');
  });

  it('says nothing for a job that did not move or that arrived already finished', () => {
    expect(jobTransition(job(), job())).toBeNull();
    expect(jobTransition(undefined, job({ status: 'succeeded' }))).toBeNull();
    expect(jobTransition(undefined, job({ status: 'queued' }))).toBeNull();
  });
});

describe('jobNotice and jobAnnouncement', () => {
  it('points the toast at the job under the job key, and updates it in place', () => {
    const started = jobNotice(undefined, job({ status: 'running' }), t);
    const done = jobNotice(job({ status: 'running' }), job({ status: 'succeeded' }), t);
    expect(started?.id).toBe('import-export-center:j');
    expect(done?.id).toBe(started?.id);
    expect(started).toMatchObject({ tone: 'accent', loading: true, key: 'j' });
    expect(done).toMatchObject({ tone: 'success', loading: false });
  });

  it('reads the job back from a notice id, and nothing from any other toast', () => {
    expect(noticeKey('import-export-center:j')).toBe('j');
    expect(noticeKey('toast-3')).toBeNull();
  });

  it('gives a cancelled job no notice: the reader asked for it', () => {
    expect(jobNotice(job({ status: 'running' }), job({ status: 'canceled' }), t)).toBeNull();
  });

  it('announces in words that name the direction, the job and the outcome', () => {
    // language: pt-BR
    expect(jobAnnouncement('success', job({ direction: 'export', title: 'Faturas' }), t)).toBe(
      'Exportação Faturas concluída',
    );
    expect(jobAnnouncement('partial', job({ title: 'Catálogo', counts: { failed: 12 } }), t)).toBe(
      'Importação Catálogo concluída com 12 erros',
    );
    // language: en-US
    expect(jobAnnouncement('partial', job({ title: 'Catalog', counts: { failed: 1 } }), en)).toBe(
      'Import Catalog completed with 1 error',
    );
  });
});

describe('focusDestination', () => {
  const jobs = [
    { key: 'a', parts: ['cancel', 'toggle'] },
    { key: 'b', parts: ['download', 'toggle', 'remove'] },
    { key: 'c', parts: [] },
  ];

  it('keeps focus in a job that lost the control it was on', () => {
    expect(focusDestination({ key: 'b', part: 'cancel', index: 1 }, jobs)).toEqual({
      key: 'b',
      part: 'download',
    });
    expect(focusDestination({ key: 'b', part: 'toggle', index: 1 }, jobs)).toEqual({
      key: 'b',
      part: 'toggle',
    });
    expect(focusDestination({ key: 'c', part: 'retry', index: 2 }, jobs)).toEqual({
      key: 'c',
      part: 'job-title',
    });
  });

  it('moves to the same part of the job now in the place of one that left', () => {
    expect(focusDestination({ key: 'x', part: 'remove', index: 1 }, jobs)).toEqual({
      key: 'b',
      part: 'remove',
    });
    expect(focusDestination({ key: 'x', part: 'remove', index: 5 }, jobs)).toEqual({
      key: 'c',
      part: 'job-title',
    });
    expect(focusDestination({ key: 'x', part: 'remove', index: 0 }, [])).toEqual({ list: true });
  });
});
