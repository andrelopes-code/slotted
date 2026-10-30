/**
 * The answers both bindings of `import-export-center` give about a job: its
 * outcome, its tone and mark, the controls it offers, whether a file can
 * still be downloaded, the words of its progress and its summary, the time it
 * has left, and the move from one state to the next that the announcer and a
 * toast report. The family holds none of a job's facts — the consumer's store
 * does — so everything here is a function of the job it is given.
 *
 * `specs/components/import-export-center/contract.json` holds the table each
 * function implements.
 */
import type { GlyphName } from '../glyph';
import { timestampOf, zonedEpoch } from '../timeline';
import type { TimestampValue } from '../timeline';
import type { FamilyTranslator, ImportExportCenterMessages } from '../i18n';
import { formatBytes, formatDuration } from '../upload';

/** The family's words, from the `importExportCenter` catalog in `@slotted/core/i18n`. */
export type ImportExportTranslator = FamilyTranslator<ImportExportCenterMessages>;

export type JobDirection = 'import' | 'export';

/**
 * What the consumer writes. A server's states before execution — Salesforce's
 * `Open`, Flatfile's `planning` and `scheduled` — map to `queued`; the phrase
 * for the phase goes in `stage`.
 */
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

/**
 * What the family derives. `partial` is a job that succeeded with a failed
 * row: a consumer states counts, the family decides, so twelve failed rows are
 * never painted as a success by a status written in haste.
 */
export type JobOutcome = 'success' | 'partial' | 'failed' | 'canceled';

export type JobTone = 'secondary' | 'accent' | 'success' | 'warning' | 'danger';

/** A status glyph, or the ring `spinner` draws for the running job. */
export type JobMark = GlyphName | 'spinner';

export type JobFileRole = 'source' | 'result' | 'errors';

export type JobControl = 'download' | 'cancel' | 'retry' | 'toggle' | 'remove';

export type FileAvailability = 'available' | 'expires' | 'expired' | 'denied' | 'none';

export type JobProgressUnit = 'rows' | 'bytes' | 'percent';

export interface JobFile {
  readonly name: string;
  /** Bytes. */
  readonly size?: number | undefined;
  /** The media type, which with the name picks the file's kind. */
  readonly type?: string | undefined;
  /** Where the file is; absent, the download asks `onDownload` to produce it. */
  readonly href?: string | undefined;
  /** The deadline after which the file is gone: an ISO instant or a wall-clock value. */
  readonly expiresAt?: TimestampValue | undefined;
  /** Why the reader may not download it, in the consumer's words. */
  readonly denied?: string | undefined;
}

export interface JobCounts {
  readonly total?: number | undefined;
  readonly processed?: number | undefined;
  readonly created?: number | undefined;
  readonly updated?: number | undefined;
  readonly skipped?: number | undefined;
  readonly failed?: number | undefined;
}

export interface JobRowError {
  /** The row of the file, as the reader numbers it in a spreadsheet. */
  readonly row: number;
  readonly message: string;
  readonly column?: string | undefined;
  readonly value?: string | undefined;
}

export interface JobProgress {
  /** Absent, the bar is indeterminate. */
  readonly value?: number | undefined;
  readonly max?: number | undefined;
  readonly unit?: JobProgressUnit | undefined;
}

export interface ImportExportJob {
  readonly key: string;
  readonly direction: JobDirection;
  readonly title: string;
  readonly status: JobStatus;
  /** The format in words: `CSV`, `XLSX`. */
  readonly format?: string | undefined;
  /** The consumer's phrase for the phase: "Gravando registros". */
  readonly stage?: string | undefined;
  readonly progress?: JobProgress | undefined;
  /** When the server expects to finish. Wins over the family's estimate. */
  readonly eta?: TimestampValue | undefined;
  readonly counts?: JobCounts | undefined;
  /** The failed rows the consumer sent, which may be a sample. */
  readonly errors?: readonly JobRowError[] | undefined;
  /** How many rows failed in all, when `errors` is a sample. */
  readonly errorCount?: number | undefined;
  /** The sentence about the job: why it failed. */
  readonly message?: string | undefined;
  readonly source?: JobFile | undefined;
  readonly result?: JobFile | undefined;
  readonly errorsFile?: JobFile | undefined;
  readonly actor?: string | undefined;
  readonly createdAt?: TimestampValue | undefined;
  readonly finishedAt?: TimestampValue | undefined;
  /** The job's own page; the title becomes a link to it. */
  readonly href?: string | undefined;
  readonly cancelable?: boolean | undefined;
  readonly retryable?: boolean | undefined;
  readonly removable?: boolean | undefined;
}

export interface ClockOptions {
  /** Epoch milliseconds. A server render states it, so a relative reading is stable. */
  readonly now?: number | undefined;
  /** The zone a wall-clock deadline is measured in. The runtime's own when absent. */
  readonly timeZone?: string | undefined;
}

const FINISHED: ReadonlySet<JobStatus> = new Set(['succeeded', 'failed', 'canceled']);

export function isActiveJob(job: ImportExportJob): boolean {
  return job.status === 'queued' || job.status === 'running';
}

export function isFinishedJob(job: ImportExportJob): boolean {
  return FINISHED.has(job.status);
}

export function activeJobCount(jobs: readonly ImportExportJob[]): number {
  return jobs.reduce((count, job) => count + (isActiveJob(job) ? 1 : 0), 0);
}

/** The count first, then the stated total, then the rows the consumer sent. */
export function failedRows(job: ImportExportJob): number {
  return job.counts?.failed ?? job.errorCount ?? job.errors?.length ?? 0;
}

export function jobOutcome(job: ImportExportJob): JobOutcome | null {
  switch (job.status) {
    case 'succeeded':
      return failedRows(job) > 0 ? 'partial' : 'success';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return null;
  }
}

const TONE: Record<JobStatus | JobOutcome, JobTone> = {
  queued: 'secondary',
  running: 'accent',
  succeeded: 'success',
  success: 'success',
  partial: 'warning',
  failed: 'danger',
  canceled: 'secondary',
};

const MARK: Record<JobStatus | JobOutcome, JobMark> = {
  queued: 'clock',
  running: 'spinner',
  succeeded: 'circle-check',
  success: 'circle-check',
  partial: 'circle-alert',
  failed: 'circle-x',
  canceled: 'circle',
};

export function jobTone(job: ImportExportJob): JobTone {
  return TONE[jobOutcome(job) ?? job.status];
}

export function jobGlyph(job: ImportExportJob): JobMark {
  return MARK[jobOutcome(job) ?? job.status];
}

function epochOf(value: TimestampValue, timeZone: string | undefined): number | null {
  const stamp = timestampOf(value);
  if (stamp.epoch !== null) return stamp.epoch;
  if (stamp.plain !== null) return zonedEpoch(stamp.plain, timeZone);
  return null;
}

export function fileAvailability(
  file: JobFile | undefined,
  { now = Date.now(), timeZone }: ClockOptions = {},
): FileAvailability {
  if (file === undefined) return 'none';
  if (file.denied !== undefined && file.denied !== '') return 'denied';
  if (file.expiresAt === undefined) return 'available';
  const deadline = epochOf(file.expiresAt, timeZone);
  if (deadline === null) return 'available';
  return deadline <= now ? 'expired' : 'expires';
}

function downloadable(file: JobFile | undefined, clock: ClockOptions): boolean {
  const availability = fileAvailability(file, clock);
  return availability === 'available' || availability === 'expires';
}

export function hasDetails(job: ImportExportJob): boolean {
  const counts = job.counts;
  const counted =
    counts !== undefined && Object.values(counts).some((value) => typeof value === 'number');
  return (
    counted ||
    (job.errors?.length ?? 0) > 0 ||
    job.source !== undefined ||
    job.result !== undefined ||
    job.errorsFile !== undefined
  );
}

export interface JobControls {
  /** In the order they are drawn. */
  readonly controls: readonly JobControl[];
  /** Which file the download control fetches. */
  readonly download: 'result' | 'errors' | null;
  /** The retry control's words: run it again after a failure, or produce the file again. */
  readonly retry: 'retry' | 'regenerate';
  /** The result's deadline has passed. */
  readonly expired: boolean;
  /** The consumer's sentence for a result the reader may not download. */
  readonly denied: string | null;
}

/**
 * Which controls a job offers, from one table both bindings render. A
 * finished job can be removed and a moving one cancelled, never the other way
 * round; an expired result becomes a run again; a denied one becomes the
 * consumer's sentence where the control would be.
 */
export function jobControls(job: ImportExportJob, clock: ClockOptions = {}): JobControls {
  const controls: JobControl[] = [];
  const outcome = jobOutcome(job);
  const resultAvailability = fileAvailability(job.result, clock);
  const expired = resultAvailability === 'expired';
  const denied = resultAvailability === 'denied' ? (job.result?.denied ?? null) : null;

  let download: JobControls['download'] = null;
  if (job.status === 'succeeded') {
    if (downloadable(job.result, clock)) download = 'result';
    else if (outcome === 'partial' && downloadable(job.errorsFile, clock)) download = 'errors';
  }

  const retryable = job.retryable !== false;
  const retry =
    retryable &&
    (job.status === 'failed' || job.status === 'canceled' || (expired && download === null));

  if (download !== null) controls.push('download');
  if (retry) controls.push('retry');
  if (isActiveJob(job) && job.cancelable !== false) controls.push('cancel');
  if (hasDetails(job)) controls.push('toggle');
  if (isFinishedJob(job) && job.removable !== false) controls.push('remove');

  return {
    controls,
    download,
    retry: expired && job.status === 'succeeded' ? 'regenerate' : 'retry',
    expired,
    denied,
  };
}

/** `all`, `import` and `export` are built in; any other view is the consumer's query. */
export function filterJobs(
  jobs: readonly ImportExportJob[],
  view: string,
): readonly ImportExportJob[] {
  if (view === 'import' || view === 'export') return jobs.filter((job) => job.direction === view);
  return jobs;
}

export interface ProgressSample {
  /** Epoch milliseconds the family saw the value at. */
  readonly at: number;
  readonly value: number;
  readonly max: number;
}

/** Three updates, five seconds apart at least, before a time is said at all. */
export const ESTIMATE_MIN_SAMPLES = 3;
export const ESTIMATE_MIN_SPAN = 5000;

/**
 * The seconds left, extrapolated from the rate the updates show. Nothing
 * below one per cent, where a rate is noise, and nothing from a job whose
 * value did not move.
 */
export function estimateFinish(samples: readonly ProgressSample[], now: number): number | null {
  if (samples.length < ESTIMATE_MIN_SAMPLES) return null;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (first === undefined || last === undefined) return null;
  const span = last.at - first.at;
  if (span < ESTIMATE_MIN_SPAN || last.max <= 0) return null;
  if (last.value / last.max < 0.01) return null;
  const moved = last.value - first.value;
  if (moved <= 0) return null;
  const rate = moved / (span / 1000);
  const left = (last.max - last.value) / rate - (now - last.at) / 1000;
  return Math.max(0, Math.round(left));
}

/** The server's `eta` first; the estimate from the family's samples otherwise. */
export function remainingSeconds(
  job: ImportExportJob,
  samples: readonly ProgressSample[],
  { now = Date.now(), timeZone }: ClockOptions = {},
): number | null {
  if (job.eta !== undefined) {
    const at = epochOf(job.eta, timeZone);
    if (at === null || at <= now) return null;
    return Math.round((at - now) / 1000);
  }
  return estimateFinish(samples, now);
}

export interface TextOptions {
  /** What sizes, percentages and durations are written in. */
  readonly locale?: string | undefined;
  readonly t: ImportExportTranslator;
  /** Seconds left, from `remainingSeconds`. */
  readonly remaining?: number | null | undefined;
}

/**
 * The items of the line under the bar: processed of total in the job's unit,
 * the percentage, and the time left. Separate strings, because the stylesheet
 * draws the separator between them and a character would be read aloud.
 */
export function jobProgressText(
  job: ImportExportJob,
  { locale, t, remaining }: TextOptions,
): readonly string[] {
  const value = job.progress?.value;
  if (value === undefined) return [];
  const max = job.progress?.max;
  const unit = job.progress?.unit ?? 'rows';
  const items: string[] = [];
  const percent =
    max !== undefined && max > 0
      ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
          Math.min(1, Math.max(0, value / max)),
        )
      : null;

  if (unit === 'percent') {
    if (percent !== null) items.push(percent);
  } else if (max !== undefined) {
    items.push(
      unit === 'bytes'
        ? t('ofBytes', { value: formatBytes(value, locale), max: formatBytes(max, locale) })
        : t('ofRows', { value, max }),
    );
    if (percent !== null) items.push(percent);
  } else {
    items.push(unit === 'bytes' ? formatBytes(value, locale) : t('rows', { count: value }));
  }

  if (remaining !== undefined && remaining !== null && remaining > 0) {
    items.push(t('remaining', { duration: formatDuration(remaining, locale) }));
  }
  return items;
}

/** The counts of a finished job, in one line: processed of total, created, updated, skipped. */
export function jobSummaryText(job: ImportExportJob, { t }: TextOptions): readonly string[] {
  if (!isFinishedJob(job) || job.counts === undefined) return [];
  const { total, processed, created, updated, skipped } = job.counts;
  const items: string[] = [];
  if (processed !== undefined && total !== undefined) {
    items.push(t('ofRows', { value: processed, max: total }));
  } else if (processed !== undefined) {
    items.push(t('rows', { count: processed }));
  }
  if (created !== undefined) items.push(t('created', { count: created }));
  if (updated !== undefined) items.push(t('updated', { count: updated }));
  if (skipped !== undefined && skipped > 0) items.push(t('skipped', { count: skipped }));
  return items;
}

/** The word for the job's state, which the status line and the announcer both say. */
export function jobStatusText(job: ImportExportJob, t: ImportExportTranslator): string {
  const outcome = jobOutcome(job);
  if (outcome === 'partial') return t('partial', { failed: failedRows(job) });
  if (outcome === 'success') return t('success');
  if (outcome === 'failed') return t('failed');
  if (outcome === 'canceled') return t('canceled');
  return job.status === 'queued' ? t('queued') : t('running');
}

export type JobTransition = 'started' | 'success' | 'partial' | 'failed' | 'canceled';

/**
 * The move from one state of a job to the next. A job that arrives already
 * finished, or already queued, made no move the reader saw.
 */
export function jobTransition(
  previous: ImportExportJob | undefined,
  next: ImportExportJob,
): JobTransition | null {
  if (next.status === 'running' && previous?.status !== 'running') return 'started';
  if (previous === undefined || !isFinishedJob(next) || isFinishedJob(previous)) return null;
  return jobOutcome(next);
}

/** What the announcer says once for a transition. */
export function jobAnnouncement(
  transition: JobTransition,
  job: ImportExportJob,
  t: ImportExportTranslator,
): string {
  const slots = { direction: job.direction, title: job.title };
  return transition === 'partial'
    ? t('announce.partial', { ...slots, failed: failedRows(job) })
    : t(`announce.${transition}`, slots);
}

export interface JobNotice {
  /** The toast's id: the job's key under the family's prefix, so a notice replaces the last. */
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly tone: JobTone;
  /** A running job's notice waits; a finished one does not. */
  readonly loading: boolean;
}

export const NOTICE_PREFIX = 'import-export-center:';

/**
 * The toast that points at a job: started, finished, finished with failed
 * rows, failed. A cancel was the reader's own word and gets none. The notice
 * carries no progress, no cancel and no download: the job is where those are,
 * and the toast's one action takes the reader there.
 */
export function jobNotice(
  previous: ImportExportJob | undefined,
  next: ImportExportJob,
  t: ImportExportTranslator,
): JobNotice | null {
  const transition = jobTransition(previous, next);
  if (transition === null || transition === 'canceled') return null;
  return {
    id: `${NOTICE_PREFIX}${next.key}`,
    key: next.key,
    title: jobAnnouncement(transition, next, t),
    description: next.message ?? next.stage ?? next.title,
    tone: transition === 'started' ? 'accent' : jobTone(next),
    loading: transition === 'started',
  };
}

/** Where focus was: the job, the part it was on, and the job's place in the list. */
export interface FocusMemory {
  readonly key: string;
  readonly part: string;
  readonly index: number;
}

/** A job as it is drawn now: its key, and the focusable parts it has, in order. */
export interface FocusableJob {
  readonly key: string;
  readonly parts: readonly string[];
}

export type FocusDestination =
  { readonly key: string; readonly part: string } | { readonly list: true };

/**
 * Where focus goes when the element that held it left the document. A job
 * that finished while focus was on Cancel keeps focus in the job — on the
 * same part when it is still there, on its first control otherwise, on its
 * title when it has none. A job that left takes focus to the same part of the
 * job now in its place, then of the one before it, then to the list.
 */
export function focusDestination(
  memory: FocusMemory,
  jobs: readonly FocusableJob[],
): FocusDestination {
  const within = (job: FocusableJob) => ({
    key: job.key,
    part: job.parts.includes(memory.part) ? memory.part : (job.parts[0] ?? 'job-title'),
  });
  const same = jobs.find((job) => job.key === memory.key);
  if (same !== undefined) return within(same);
  const next = jobs[Math.min(memory.index, jobs.length - 1)];
  if (next !== undefined) return within(next);
  return { list: true };
}

/** The job a notice's toast points at, read back from the toast's id; `null` for any other toast. */
export function noticeKey(id: string): string | null {
  return id.startsWith(NOTICE_PREFIX) ? id.slice(NOTICE_PREFIX.length) : null;
}
