import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * Every word `upload` writes on its own: the controls, the word for each
 * status and each file kind, the sentences about the queue, and why a file
 * was refused. A row's controls are named with the file they act on (`{name}`).
 */
export interface UploadMessages {
  /** Announced when files join the queue. */
  readonly added: Message<{ count: number }>;
  readonly archive: Message;
  readonly audio: Message;
  readonly cancel: Message<{ name: string }>;
  readonly canceled: Message;
  readonly clear: Message;
  readonly document: Message;
  readonly dropzone: Message;
  readonly error: Message;
  /** One file's announcement: `{message}` is its status word or the reason it was refused. */
  readonly fileNotice: Message<{ name: string; message: string }>;
  /** Announced when the queue finishes. */
  readonly finished: Message<{ uploaded: number; total: number }>;
  readonly image: Message;
  /** What a card's tile prints for a file whose name has no extension. */
  readonly noExtension: Message;
  readonly other: Message;
  readonly pause: Message<{ name: string }>;
  readonly paused: Message;
  readonly pdf: Message;
  /** What the control says while a transfer is pending and a form is submitted. */
  readonly pending: Message;
  readonly presentation: Message;
  readonly queued: Message;
  readonly ready: Message;
  readonly rejected: Message;
  /** Why a file was refused, by the reason the family measured. */
  readonly rejection: {
    readonly custom: Message;
    readonly directory: Message;
    readonly duplicate: Message;
    readonly maxFiles: Message;
    readonly minSize: Message;
    readonly multiple: Message;
    /** `{size}` is the file's size, already written with its unit. */
    readonly size: Message<{ size: string }>;
    readonly totalSize: Message;
    readonly type: Message;
  };
  readonly remove: Message<{ name: string }>;
  readonly resume: Message<{ name: string }>;
  readonly retry: Message<{ name: string }>;
  /** The count the `field` shape shows for more than one file. */
  readonly selection: Message<{ count: number }>;
  readonly spreadsheet: Message;
  readonly stalled: Message;
  readonly start: Message<{ name: string }>;
  readonly success: Message;
  /** The line above the list while no time left can be said. */
  readonly summary: Message<{ uploaded: number; total: number }>;
  /** The line above the list; `{duration}` is already written in words. */
  readonly summaryRemaining: Message<{ uploaded: number; total: number; duration: string }>;
  readonly trigger: Message;
  readonly uploading: Message;
  readonly video: Message;
  readonly viewerClose: Message;
  readonly viewerExternal: Message;
  readonly viewerNext: Message;
  /** Where the viewer is among the files it can render. */
  /** The viewer's line under the name: `{size}` already written with its unit, `{kind}` the file's kind. */
  readonly viewerMeta: Message<{ size: string; kind: string }>;
  /** The same line in a set of several files. */
  readonly viewerMetaPosition: Message<{
    size: string;
    kind: string;
    index: number;
    count: number;
  }>;
  readonly viewerPrevious: Message;
  readonly viewerUnsupported: Message;
}

export const en: UploadMessages = {
  added: '{count, plural, one {# file added} other {# files added}}',
  archive: 'Archive',
  audio: 'Audio',
  cancel: 'Cancel: {name}',
  canceled: 'Stopped',
  clear: 'Remove all',
  document: 'Document',
  dropzone: 'Drop files here',
  error: 'Failed',
  fileNotice: '{name}: {message}',
  finished: '{uploaded} of {total, plural, one {# file} other {# files}} uploaded',
  image: 'Image',
  noExtension: 'FILE',
  other: 'File',
  pause: 'Pause: {name}',
  paused: 'Paused',
  pdf: 'PDF',
  pending: 'Wait for the files to finish uploading.',
  presentation: 'Presentation',
  queued: 'Queued',
  ready: 'Waiting to upload',
  rejected: 'Refused',
  rejection: {
    custom: 'This file was not accepted.',
    directory: 'Folders are not accepted. Attach the files inside it.',
    duplicate: 'This file has already been attached.',
    maxFiles: 'There is no room for another file.',
    minSize: 'This file is too small.',
    multiple: 'Only one file can be attached here.',
    size: 'This file is {size} and it is too large.',
    totalSize: 'These files are too large altogether.',
    type: 'This kind of file is not accepted.',
  },
  remove: 'Remove: {name}',
  resume: 'Resume: {name}',
  retry: 'Try again: {name}',
  selection: '{count, plural, one {# file} other {# files}}',
  spreadsheet: 'Spreadsheet',
  stalled: 'Stalled',
  start: 'Upload: {name}',
  success: 'Uploaded',
  summary: '{uploaded} of {total} uploaded',
  summaryRemaining: '{uploaded} of {total} uploaded · about {duration} left',
  trigger: 'Browse files',
  uploading: 'Uploading',
  video: 'Video',
  viewerClose: 'Close',
  viewerExternal: 'Open in a new tab',
  viewerNext: 'Next file',
  viewerMeta: '{size} · {kind}',
  viewerMetaPosition: '{size} · {kind} · {index} of {count}',
  viewerPrevious: 'Previous file',
  viewerUnsupported: 'This file cannot be previewed here.',
};

export const uploadMessages: MessageFamily<'upload', UploadMessages> = { name: 'upload', base: en };
