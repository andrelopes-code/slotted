import { splitName } from '@slotted/core/upload';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { useMediaViewer } from './media-viewer-context';
import type {
  MediaViewerActionsProps,
  MediaViewerBarProps,
  MediaViewerCloseProps,
  MediaViewerDownloadProps,
  MediaViewerPositionProps,
  MediaViewerTitleProps,
} from './media-viewer.types';

/** The row above the stage: the file's name and position, the actions, and close at the end. */
export function MediaViewerBar({ children, ...props }: MediaViewerBarProps) {
  return (
    <div {...props} data-part="bar" data-part-bar="">
      {children ?? (
        <>
          <div data-part="heading" data-part-heading="">
            <MediaViewerTitle />
            <MediaViewerPosition />
          </div>
          <MediaViewerActions />
          <MediaViewerClose />
        </>
      )}
    </div>
  );
}

export function MediaViewerClose({ children, onClick, render, ...props }: MediaViewerCloseProps) {
  const viewer = useMediaViewer();
  const rootProps = {
    'aria-label': viewer.t('close'),
    type: 'button' as const,
    ...props,
    'data-part': 'close',
    'data-part-close': '',
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) viewer.requestOpen(false, 'pointer', event);
    },
    children: children ?? (
      <Icon>
        <Glyph name="x" />
      </Icon>
    ),
  };

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}

/**
 * The file's name, the viewer's accessible name. Cut in the middle: the stem
 * shrinks and the extension stays, and the whole name is in `title`.
 */
export function MediaViewerTitle({ children, ...props }: MediaViewerTitleProps) {
  const viewer = useMediaViewer();
  const name = viewer.item?.name ?? '';
  const { stem, extension } = splitName(name);

  return (
    <h2 dir="auto" title={name} {...props} data-part="title" data-part-title="" id={viewer.titleId}>
      {children ?? (
        <>
          <span>{stem}</span>
          {extension === '' ? null : <span>{extension}</span>}
        </>
      )}
    </h2>
  );
}

/** Which of how many; the viewer's description. Absent for a set of one. */
export function MediaViewerPosition({ children, ...props }: MediaViewerPositionProps) {
  const viewer = useMediaViewer();
  if (viewer.items.length < 2) return null;

  return (
    <p dir="auto" {...props} data-part="position" data-part-position="" id={viewer.positionId}>
      {children ?? viewer.t('position', { index: viewer.index + 1, count: viewer.items.length })}
    </p>
  );
}

/** The consumer's own actions; absent children, the file's download. */
export function MediaViewerActions({ children, ...props }: MediaViewerActionsProps) {
  return (
    <div {...props} data-part="actions" data-part-actions="">
      {children ?? <MediaViewerDownload />}
    </div>
  );
}

/** The platform's own download: an `a download` to the item's `downloadHref`. */
export function MediaViewerDownload({ children, render, ...props }: MediaViewerDownloadProps) {
  const viewer = useMediaViewer();
  const href = viewer.item?.downloadHref;
  if (href === undefined) return null;

  const label = viewer.t('download');
  const rootProps = {
    'aria-label': children === undefined ? label : undefined,
    download: viewer.item?.name ?? '',
    href,
    ...props,
    'data-part': 'download',
    'data-part-download': '',
    children: children ?? (
      <Icon>
        <Glyph name="download" />
      </Icon>
    ),
  };

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}
