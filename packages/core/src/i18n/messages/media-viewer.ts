import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `media-viewer` writes on its own. */
export interface MediaViewerMessages {
  /** The stage's name, read when focus enters the viewer; `{name}` is the file's name. */
  readonly label: Message<{ name: string }>;
  readonly close: Message;
  readonly previous: Message;
  readonly next: Message;
  readonly zoomIn: Message;
  readonly zoomOut: Message;
  /** Back to the whole picture inside the stage. */
  readonly fit: Message;
  /** A quarter turn clockwise. */
  readonly rotate: Message;
  readonly download: Message;
  /** Which of how many; the viewer's description. */
  readonly position: Message<{ index: number; count: number }>;
  /** The zoom pill's level and its group name; `{percent}` is the level as a whole percentage. */
  readonly zoomLevel: Message<{ percent: number }>;
  /** The heading of the stage for a kind of file the browser cannot draw. */
  readonly unsupportedTitle: Message;
  /** The sentence under it; `{extension}` is the file's extension in capitals, or empty. */
  readonly unsupported: Message<{ extension: string }>;
  /** The heading of the stage when the file failed to load. */
  readonly errorTitle: Message;
  /** The sentence under it. */
  readonly error: Message;
  /** Loads the file again. */
  readonly retry: Message;
  /** Under a text file cut at the viewer's limit. */
  readonly truncated: Message;
  /** Announced while a picture loads; `{name}` is the file's name. */
  readonly loading: Message<{ name: string }>;
  /** Announced on a step: the file's name and which of how many. */
  readonly announce: Message<{ name: string; index: number; count: number }>;
}

export const en: MediaViewerMessages = {
  label: '{name}',
  close: 'Close',
  previous: 'Previous file',
  next: 'Next file',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fit: 'Fit to screen',
  rotate: 'Rotate',
  download: 'Download',
  position: '{index} of {count}',
  zoomLevel: '{percent}%',
  unsupportedTitle: 'No preview for this file',
  unsupported:
    '{extension, select, other {{extension} files open in the app that made them.} __none {This kind of file opens in the app that made it.}} Download it to see it.',
  errorTitle: 'This file didn’t load',
  error: 'Check the connection and try again, or download the file.',
  retry: 'Try again',
  truncated: 'Only the beginning of this file is shown. Download it to read the rest.',
  loading: 'Loading {name}',
  announce: '{name}, {index} of {count}',
};

export const mediaViewerMessages: MessageFamily<'mediaViewer', MediaViewerMessages> = {
  name: 'mediaViewer',
  base: en,
};
