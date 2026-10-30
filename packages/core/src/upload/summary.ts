import { isPending } from './types';
import type { UploadFile, UploadStatus } from './types';

/**
 * What the whole queue is doing, derived from the rows rather than counted
 * beside them — so the summary and the rows above it cannot disagree.
 */

export interface UploadSummary {
  readonly total: number;
  readonly counts: Readonly<Record<UploadStatus, number>>;
  /** Bytes moved across every file that has a total to move. */
  readonly loaded: number;
  /** Bytes those files add up to. */
  readonly size: number;
  /** Where the queue is, as a percentage, or `null` when nothing is running. */
  readonly percent: number | null;
  /** Whether any file still owes the reader something. */
  readonly pending: boolean;
  /** Whether every file that entered the queue arrived. */
  readonly complete: boolean;
}

const EMPTY: Record<UploadStatus, number> = {
  rejected: 0,
  ready: 0,
  queued: 0,
  uploading: 0,
  paused: 0,
  stalled: 0,
  success: 0,
  error: 0,
  canceled: 0,
};

export function uploadSummary(files: readonly UploadFile[]): UploadSummary {
  const counts = { ...EMPTY };
  let loaded = 0;
  let size = 0;

  for (const file of files) {
    counts[file.status] += 1;
    if (file.status === 'rejected') continue;
    size += file.total ?? file.size;
    loaded += file.status === 'success' ? (file.total ?? file.size) : file.loaded;
  }

  const queued = files.filter((file) => file.status !== 'rejected');
  const pending = queued.some(isPending);

  return {
    total: files.length,
    counts,
    loaded,
    size,
    percent: size > 0 ? Math.min(100, Math.round((loaded / size) * 100)) : null,
    pending,
    complete: queued.length > 0 && queued.every((file) => file.status === 'success'),
  };
}

/**
 * How much longer, in seconds, from the bytes that have actually moved.
 *
 * Vaadin is the one surveyed implementation that shows a remaining time, and it
 * is a string the server composes. This is measured here instead, so it works
 * against any adapter and reads in any locale.
 *
 * The rate is taken over a window rather than over the whole transfer: an
 * upload that stalled for ten seconds and recovered would otherwise report a
 * remaining time from an average that no longer describes anything.
 */
export interface ThroughputSample {
  readonly at: number;
  readonly loaded: number;
}

export function estimateRemaining(
  samples: readonly ThroughputSample[],
  summary: Pick<UploadSummary, 'loaded' | 'size'>,
): number | null {
  if (samples.length < 2) return null;

  const last = samples[samples.length - 1];
  const first = samples[0];
  if (last === undefined || first === undefined) return null;

  const elapsed = (last.at - first.at) / 1000;
  const moved = last.loaded - first.loaded;
  if (elapsed <= 0 || moved <= 0) return null;

  const left = summary.size - summary.loaded;
  if (left <= 0) return 0;

  return left / (moved / elapsed);
}
