/**
 * What a file is while the family is holding it, and what the family asks of
 * whoever moves the bytes.
 *
 * Nothing here touches the DOM or either framework. It is outside
 * `packages/core/src/index.ts` for the two reasons `@slotted/core/filter` is
 * outside it: both bindings must give byte-identical answers about what a
 * selection is worth, and a family that imports a button should not pull a
 * transfer engine.
 */

/**
 * The flow `docs/component-features.md` §14 asks for, with three failures kept
 * apart rather than collapsed into one red row.
 *
 * `rejected` never entered the queue. `error` ran and failed. `canceled` is the
 * reader stopping it. Every surveyed implementation paints the three alike, and
 * the reader then cannot tell whether to try again, choose another file, or do
 * nothing.
 */
export type UploadStatus =
  | 'rejected'
  | 'ready'
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'stalled'
  | 'success'
  | 'error'
  | 'canceled';

/** Why a file never entered the queue. Closed, and the message is the consumer's. */
export type UploadRejectionReason =
  | 'type'
  | 'size'
  | 'minSize'
  | 'multiple'
  | 'maxFiles'
  | 'totalSize'
  | 'duplicate'
  | 'directory'
  | 'custom';

/** What a file is, said in one word. The colour and the mark follow from it. */
export type FileKind =
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

/**
 * One entry of the value the family holds.
 *
 * `file` is absent for an entry restored from a server, which has a name and no
 * bytes — the shape Ant Design's `fileList` and Vaadin's `files` both have, and
 * for the same reason. Everything a row draws is here, so a consumer who owns
 * the value owns the whole of it.
 */
export interface UploadFile {
  readonly key: string;
  readonly file?: File | undefined;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly kind: FileKind;
  readonly status: UploadStatus;
  /** Bytes the adapter has reported so far. */
  readonly loaded: number;
  /** What the adapter said the total was, when it said. */
  readonly total?: number | undefined;
  /** How many times `send` has been called for this file. */
  readonly attempts: number;
  readonly reason?: UploadRejectionReason | undefined;
  /** What `send` rejected with. Never inspected. */
  readonly error?: unknown;
  /** What `send` resolved with. Never inspected. */
  readonly response?: unknown;
  /** `webkitRelativePath`, for a selection that came from a directory. */
  readonly path?: string | undefined;
}

/** What the family hands the adapter for one file. */
export interface UploadContext {
  /** Aborted when the reader cancels, or removes the row. */
  readonly signal: AbortSignal;
  /** Bytes moved so far, and the total when it is known. */
  progress(loaded: number, total?: number): void;
  /**
   * Resolves at once unless the reader has paused. An adapter that can suspend
   * awaits it between chunks; one that cannot ignores it, and then declares
   * `pausable: false` so the family draws no control that would lie.
   */
  whenResumed(): Promise<void>;
}

export interface UploadAdapter {
  send(file: File, context: UploadContext): Promise<unknown>;
  /** Whether `send` awaits `whenResumed()`. */
  readonly pausable?: boolean | undefined;
}

/** The common adapter is one function, so one function is accepted. */
export type UploadAdapterLike = UploadAdapter | UploadAdapter['send'];

/** Normalises the shorthand. A bare function cannot suspend, so it says so. */
export function toAdapter(adapter: UploadAdapterLike): UploadAdapter {
  return typeof adapter === 'function' ? { send: adapter, pausable: false } : adapter;
}

/** The statuses that mean the transfer has not finished with this file. */
export const PENDING_STATUSES: readonly UploadStatus[] = [
  'ready',
  'queued',
  'uploading',
  'paused',
  'stalled',
];

/** Whether a file still owes the reader something before a form may be sent. */
export function isPending(file: Pick<UploadFile, 'status'>): boolean {
  return PENDING_STATUSES.includes(file.status);
}

/** The `File[]` a consumer who wants only the bytes asks for. */
export function filesOf(files: readonly UploadFile[]): File[] {
  return files.flatMap((entry) => (entry.file === undefined ? [] : [entry.file]));
}
