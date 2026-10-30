import { matchesAccept } from '../files/files';
import { fileKind } from './kinds';
import type { UploadFile, UploadRejectionReason } from './types';

/**
 * What a selection is worth, decided once so that both bindings cannot
 * disagree.
 *
 * `accept` on an `<input type="file">` filters the picker's dialog and nothing
 * else — not what the dialog yields, and not what a drop delivers — so a
 * component that offers both affordances applies the rules itself or accepts by
 * drop what it refuses by picker.
 */

/** How a second copy of a file the list already holds is treated. */
export type DuplicatePolicy = 'reject' | 'allow' | 'replace';

export interface SelectionRules {
  accept?: string | undefined;
  multiple?: boolean | undefined;
  directory?: boolean | undefined;
  maxFiles?: number | undefined;
  maxSize?: number | undefined;
  minSize?: number | undefined;
  maxTotalSize?: number | undefined;
  duplicates?: DuplicatePolicy | undefined;
  /** The consumer's own rule. Returning a reason refuses the file. */
  validate?: ((file: File) => UploadRejectionReason | null | undefined) | undefined;
  /** Replaceable, because whether two files are the same file is an application's question. */
  fileKey?: ((file: File) => string) | undefined;
}

export interface SelectionOutcome {
  /** The list as it should now be, in order, including what was refused. */
  files: UploadFile[];
  /** What was refused this time round, for the announcement and the callback. */
  rejected: UploadFile[];
}

/**
 * Name, size and modification time, joined.
 *
 * It is the identity every surveyed implementation that detects duplicates uses,
 * and it is replaceable because whether two files are the same file differs by
 * application — which is the objection the wave-2 family raised to answer the
 * question with no policy at all.
 */
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function entryOf(file: File, key: string, status: UploadFile['status']): UploadFile {
  const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return {
    key,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    kind: fileKind(file),
    status,
    loaded: 0,
    attempts: 0,
    ...(path === undefined || path === '' ? {} : { path }),
  };
}

function refused(file: File, key: string, reason: UploadRejectionReason): UploadFile {
  return { ...entryOf(file, key, 'rejected'), reason };
}

/**
 * A file is judged once and refused for one reason.
 *
 * The order is the order a reader would give: what it is, then how big, then
 * whether there is room. A file that is both the wrong kind and too large is
 * reported as the wrong kind, because two reasons for one file are two messages
 * about one mistake.
 */
function firstFailure(
  file: File,
  rules: SelectionRules,
  accepted: number,
  total: number,
): UploadRejectionReason | null {
  const { accept = '', maxSize, minSize, maxFiles, maxTotalSize, multiple = true } = rules;

  /*
   * A folder dropped into a zone that does not take folders. The platform gives
   * a directory entry a size of nought and an empty type, which every surveyed
   * implementation either ignores or adds as a zero-byte row with the folder's
   * name on it.
   */
  if (rules.directory !== true && file.size === 0 && file.type === '' && !file.name.includes('.')) {
    return 'directory';
  }

  if (!matchesAccept(file, accept)) return 'type';
  if (maxSize !== undefined && file.size > maxSize) return 'size';
  if (minSize !== undefined && file.size < minSize) return 'minSize';
  if (!multiple && accepted >= 1) return 'multiple';
  if (maxFiles !== undefined && accepted >= maxFiles) return 'maxFiles';
  if (maxTotalSize !== undefined && total + file.size > maxTotalSize) return 'totalSize';

  const own = rules.validate?.(file);
  return own ?? null;
}

/**
 * The list after a selection, and what it refused.
 *
 * A multiple upload appends what it receives; a single upload replaces. That is
 * what each affordance means: dropping a second file onto a multi-file region
 * adds it, and picking a second file for a single-file control corrects the
 * first.
 *
 * A refused file stays in the list with its reason rather than being dropped:
 * silence leaves the reader looking for a file that never appeared. It counts
 * towards nothing, because it never entered the queue.
 */
export function selectFiles(
  incoming: readonly File[],
  existing: readonly UploadFile[],
  rules: SelectionRules,
): SelectionOutcome {
  const { multiple = true, duplicates = 'reject', fileKey: keyOf = fileKey } = rules;
  const autoUploadReady: UploadFile['status'] = 'ready';

  const kept = multiple ? [...existing] : [];
  const rejected: UploadFile[] = [];

  const alive = () => kept.filter((entry) => entry.status !== 'rejected');
  const totalOf = () => alive().reduce((sum, entry) => sum + entry.size, 0);

  for (const file of incoming) {
    const key = keyOf(file);
    const seen = kept.findIndex((entry) => entry.key === key && entry.status !== 'rejected');

    if (seen !== -1) {
      if (duplicates === 'reject') {
        const entry = refused(file, key, 'duplicate');
        kept.push(entry);
        rejected.push(entry);
        continue;
      }
      if (duplicates === 'replace') {
        kept[seen] = entryOf(file, key, autoUploadReady);
        continue;
      }
    }

    const failure = firstFailure(file, rules, alive().length, totalOf());
    if (failure !== null) {
      /* `allow` still needs a key nothing else holds, or the list has two rows
         the family cannot tell apart. */
      const entry = refused(file, seen === -1 ? key : `${key}#${kept.length}`, failure);
      kept.push(entry);
      rejected.push(entry);
      continue;
    }

    kept.push(entryOf(file, seen === -1 ? key : `${key}#${kept.length}`, autoUploadReady));
  }

  return { files: kept, rejected };
}
