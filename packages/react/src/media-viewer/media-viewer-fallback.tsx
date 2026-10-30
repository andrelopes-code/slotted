import { fileKind, splitName } from '@slotted/core/upload';
import type { ReactNode } from 'react';

import { ATTACHMENT_KIND_GLYPH } from '../attachment/attachment-kinds';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { MediaViewerDownload } from './media-viewer-bar';
import { useMediaViewer } from './media-viewer-context';

/** A kind the browser cannot draw: its mark and extension, why, and the way to the file. */
export function MediaViewerUnsupported() {
  const viewer = useMediaViewer();
  const name = viewer.item?.name ?? '';
  const extension = splitName(name).extension.slice(1).toUpperCase();
  const glyph = ATTACHMENT_KIND_GLYPH[fileKind({ name, type: viewer.item?.type ?? '' })];

  return (
    <MediaViewerFallback
      glyph={glyph}
      label={extension}
      part="unsupported"
      sentence={viewer.t('unsupported', { extension: extension === '' ? '__none' : extension })}
      title={viewer.t('unsupportedTitle')}
    />
  );
}

/** A file that did not load: what happened, and both ways on — again, or the file itself. */
export function MediaViewerFailure() {
  const viewer = useMediaViewer();

  return (
    <MediaViewerFallback
      glyph={viewer.kind === 'image' ? 'image-off' : 'cloud-off'}
      part="status"
      retry={
        <button data-part="retry" data-part-retry="" onClick={viewer.retry} type="button">
          <Icon>
            <Glyph name="rotate-ccw" />
          </Icon>
          {viewer.t('retry')}
        </button>
      }
      sentence={viewer.t('error')}
      title={viewer.t('errorTitle')}
    />
  );
}

interface MediaViewerFallbackProps {
  part: 'unsupported' | 'status';
  glyph: GlyphName;
  label?: string | undefined;
  title: string;
  sentence: string;
  retry?: ReactNode;
}

/** The anatomy both empty answers share: a tile, a heading, a sentence and a row of actions. */
function MediaViewerFallback({
  part,
  glyph,
  label,
  title,
  sentence,
  retry,
}: MediaViewerFallbackProps) {
  const viewer = useMediaViewer();

  return (
    <div
      data-error={part === 'status' ? '' : undefined}
      data-part={part}
      {...{ [`data-part-${part}`]: '' }}
      role={part === 'status' ? 'status' : undefined}
    >
      <span aria-hidden="true" data-part="tile" data-part-tile="">
        <Icon>
          <Glyph name={glyph} />
        </Icon>
        {label === undefined || label === '' ? null : <span>{label}</span>}
      </span>
      <h3>{title}</h3>
      <p>{sentence}</p>
      <div>
        {retry}
        <MediaViewerDownload>
          <Icon>
            <Glyph name="download" />
          </Icon>
          {viewer.t('download')}
        </MediaViewerDownload>
      </div>
    </div>
  );
}
