import { inject, InjectionToken } from '@angular/core';
import type { MediaViewerMessages, PartialMessages } from '@slotted/core/i18n';
import type { MediaKind, Rotation } from '@slotted/core/media-viewer';
import type { ChangeRequest } from '@slotted/core/state';

export type { MediaKind, Rotation };

/** One file of the set. `type` is a MIME type, as `File.type` and `attachment`'s `file.type`. */
export interface MediaViewerItem {
  readonly id: string;
  readonly src: string;
  readonly name: string;
  readonly type: string;
  readonly caption?: string | undefined;
  readonly downloadHref?: string | undefined;
  readonly thumbnail?: string | undefined;
  /** The picture's own size, when known: the box is drawn before a byte arrives. */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export type MediaViewerOpenRequest = ChangeRequest<boolean>;
export type MediaViewerValueRequest = ChangeRequest<string>;
export type MediaViewerZoomRequest = ChangeRequest<number>;
export type MediaViewerRotationRequest = ChangeRequest<Rotation>;

export interface MediaViewerDefaults {
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly zoomStep: number;
  readonly loop: boolean;
  readonly messages?: PartialMessages<MediaViewerMessages> | undefined;
}

const FALLBACK: MediaViewerDefaults = { minZoom: 1, maxZoom: 4, zoomStep: 0.25, loop: false };

export const MEDIA_VIEWER_DEFAULTS = new InjectionToken<MediaViewerDefaults>(
  'slotted media-viewer defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/** Sets the viewer's limits, its loop and its words once, for every viewer under it. */
export function provideMediaViewerDefaults(defaults: Partial<MediaViewerDefaults>) {
  return {
    provide: MEDIA_VIEWER_DEFAULTS,
    useFactory: (): MediaViewerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectMediaViewerDefaults(): MediaViewerDefaults {
  return inject(MEDIA_VIEWER_DEFAULTS);
}
