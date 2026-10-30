import { inject, InjectionToken } from '@angular/core';
import type { GlyphName } from '@slotted/core/glyph';
import type { ChangeReason } from '@slotted/core/state';
import type { FileKind } from '@slotted/core/upload';

export type AttachmentSize = 'sm' | 'md' | 'lg';
export type AttachmentOrientation = 'horizontal' | 'vertical';
export type AttachmentLayout = 'list' | 'grid' | 'strip';

/**
 * What the family needs to know about a file, and a `File` already is one. A
 * record from a server needs only the name: the kind is read from the media
 * type when there is one and from the extension when there is not.
 */
export interface AttachmentFile {
  readonly name: string;
  readonly type?: string | undefined;
  readonly size?: number | undefined;
}

/** How the removal was asked for: the remove control, or `Backspace` / `Delete`. */
export type AttachmentRemoveReason = Extract<ChangeReason, 'remove' | 'keyboard'>;

/** A request to leave the consumer's list. It carries no value; nothing is committed. */
export interface AttachmentRemoveRequest {
  readonly reason: AttachmentRemoveReason;
  readonly file: AttachmentFile;
  readonly source: Event;
}

export interface AttachmentDefaults {
  layout: AttachmentLayout;
  orientation: AttachmentOrientation;
  size: AttachmentSize;
}

const FALLBACK: AttachmentDefaults = {
  layout: 'list',
  orientation: 'horizontal',
  size: 'md',
};

export const ATTACHMENT_DEFAULTS = new InjectionToken<AttachmentDefaults>(
  'slotted attachment defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how large its attachments are and how a set of
 * them is arranged. A group or an attachment that states either still wins.
 * Their words and the locale that writes their sizes come from the language
 * in force (`provideSlotted`).
 */
export function provideAttachmentDefaults(defaults: Partial<AttachmentDefaults>) {
  return {
    provide: ATTACHMENT_DEFAULTS,
    useFactory: (): AttachmentDefaults => ({
      layout: defaults.layout ?? FALLBACK.layout,
      orientation: defaults.orientation ?? FALLBACK.orientation,
      size: defaults.size ?? FALLBACK.size,
    }),
  };
}

export function injectAttachmentDefaults(): AttachmentDefaults {
  return inject(ATTACHMENT_DEFAULTS);
}

/**
 * The mark knocked out of each kind's tile — `upload`'s map, restated because
 * that one is private to `upload`. The contract test reads both contracts'
 * `kinds` and refuses a drift.
 */
export const ATTACHMENT_KIND_GLYPH: Readonly<Record<FileKind, GlyphName>> = {
  archive: 'file-archive',
  audio: 'file-audio',
  document: 'file-type',
  image: 'file-image',
  other: 'file',
  pdf: 'file-text',
  presentation: 'presentation',
  spreadsheet: 'file-spreadsheet',
  video: 'file-video',
};

/**
 * The controls `removal-focus` counts. An attachment in a set holds the same
 * controls as its neighbours, so the position focus had among them is the
 * position of the same control on the attachment that took its place. A
 * remove control of an attachment that is not removable is hidden, and is not
 * counted.
 */
export const ATTACHMENT_CONTROL_SELECTOR =
  '[data-part="trigger"], [data-part="action"], [data-part="remove"]:not([hidden])';
