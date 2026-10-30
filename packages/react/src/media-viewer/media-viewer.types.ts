import type { ChangeRequest } from '@slotted/core/state';
import type { MediaViewerMessages, PartialMessages } from '@slotted/core/i18n';
import type { MediaKind, Rotation } from '@slotted/core/media-viewer';
import type { ComponentPropsWithRef, ReactNode } from 'react';

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

/** What an application sets once for every viewer under it. */
export interface MediaViewerDefaults {
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  zoomStep?: number | undefined;
  loop?: boolean | undefined;
  messages?: PartialMessages<MediaViewerMessages> | undefined;
}

export interface MediaViewerProps extends MediaViewerDefaults {
  items: readonly MediaViewerItem[];

  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: MediaViewerOpenRequest) => void) | undefined;

  /** The `id` of the item shown. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string, request: MediaViewerValueRequest) => void) | undefined;

  /** The level, a multiple of the fit: 1 is the whole picture inside the stage. */
  zoom?: number | undefined;
  defaultZoom?: number | undefined;
  onZoomChange?: ((zoom: number, request: MediaViewerZoomRequest) => void) | undefined;

  rotation?: Rotation | undefined;
  defaultRotation?: Rotation | undefined;
  onRotationChange?:
    ((rotation: Rotation, request: MediaViewerRotationRequest) => void) | undefined;

  /** Passed to `dialog`: a control that asks the platform for the whole screen. */
  fullscreenToggle?: boolean | undefined;
  /** Where the layer is written; the viewer makes its own beside where it is rendered otherwise. */
  container?: Element | null | undefined;
  /** The parts, arranged by the consumer. Absent, the viewer draws its own anatomy. */
  children?: ReactNode | undefined;
}

type PartProps<E extends 'div' | 'button' | 'p' | 'a' | 'h2'> = Omit<
  ComponentPropsWithRef<E>,
  'children'
> & {
  children?: ReactNode | undefined;
};

/** A part whose element the consumer may substitute. */
type Renderable<E extends 'div' | 'button' | 'a', P> = PartProps<E> & {
  render?: ((props: P) => ReactNode) | undefined;
};

export type MediaViewerButtonRootProps = ComponentPropsWithRef<'button'> & {
  'data-part': string;
};

export type MediaViewerBarProps = PartProps<'div'>;
export type MediaViewerActionsProps = PartProps<'div'>;
export type MediaViewerCaptionProps = PartProps<'p'>;
export type MediaViewerTitleProps = PartProps<'h2'>;
export type MediaViewerPositionProps = PartProps<'p'>;
export type MediaViewerStageProps = PartProps<'div'>;
export type MediaViewerZoomProps = PartProps<'div'>;
export type MediaViewerThumbnailsProps = PartProps<'div'>;
export type MediaViewerCloseProps = Renderable<'button', MediaViewerButtonRootProps>;
export type MediaViewerStepProps = Renderable<'button', MediaViewerButtonRootProps>;
export type MediaViewerDownloadProps = Renderable<'a', ComponentPropsWithRef<'a'>>;
