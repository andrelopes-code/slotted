import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { useMediaViewer } from './media-viewer-context';
import type {
  MediaViewerCaptionProps,
  MediaViewerStepProps,
  MediaViewerThumbnailsProps,
  MediaViewerZoomProps,
} from './media-viewer.types';

export function MediaViewerPrevious(props: MediaViewerStepProps) {
  return <MediaViewerStep {...props} direction="previous" />;
}

export function MediaViewerNext(props: MediaViewerStepProps) {
  return <MediaViewerStep {...props} direction="next" />;
}

function MediaViewerStep({
  children,
  direction,
  onClick,
  render,
  ...props
}: MediaViewerStepProps & { direction: 'previous' | 'next' }) {
  const viewer = useMediaViewer();
  if (viewer.items.length < 2) return null;

  const end =
    direction === 'previous' ? viewer.index <= 0 : viewer.index >= viewer.items.length - 1;
  const rootProps = {
    'aria-label': viewer.t(direction),
    disabled: end && !viewer.limits.loop,
    type: 'button' as const,
    ...props,
    'data-part': direction,
    [`data-part-${direction}`]: '',
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) viewer.requestStep(direction, 'pointer', event);
    },
    children: children ?? (
      <Icon directional>
        <Glyph name={direction === 'previous' ? 'chevron-left' : 'chevron-right'} />
      </Icon>
    ),
  };

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}

/**
 * The floating pill under the stage: out, the level, in, fit and turn. Absent
 * for anything but a picture that loaded: a PDF's reader zooms itself, and a
 * picture that failed has nothing to zoom.
 */
export function MediaViewerZoom({ children, ...props }: MediaViewerZoomProps) {
  const viewer = useMediaViewer();
  if (viewer.kind !== 'image' || viewer.status === 'error') return null;

  const { maxZoom, minZoom, zoomStep } = viewer.limits;
  const percent = Math.round(viewer.zoom * 100);
  const zoomTo = (zoom: number, event: MouseEvent) => {
    viewer.handle.current?.requestZoom(zoom, 'pointer', event.nativeEvent);
  };

  return (
    <div
      aria-label={viewer.t('zoomLevel', { percent })}
      role="group"
      {...props}
      data-part="zoom"
      data-part-zoom=""
    >
      {children ?? (
        <>
          <ZoomButton
            disabled={viewer.zoom <= minZoom}
            glyph="minus"
            label={viewer.t('zoomOut')}
            onClick={(event) => zoomTo(viewer.zoom - zoomStep, event)}
            part="zoom-out"
          />
          <output aria-live="off" data-part="zoom-level" data-part-zoom-level="">
            {viewer.t('zoomLevel', { percent })}
          </output>
          <ZoomButton
            disabled={viewer.zoom >= maxZoom}
            glyph="plus"
            label={viewer.t('zoomIn')}
            onClick={(event) => zoomTo(viewer.zoom + zoomStep, event)}
            part="zoom-in"
          />
          <ZoomButton
            disabled={viewer.zoom <= minZoom}
            glyph="minimize"
            label={viewer.t('fit')}
            onClick={(event) => zoomTo(1, event)}
            part="fit"
          />
          <ZoomButton
            glyph="rotate-cw"
            label={viewer.t('rotate')}
            onClick={(event) => {
              viewer.requestRotation(
                ((viewer.rotation + 90) % 360) as 0 | 90 | 180 | 270,
                'pointer',
                event,
              );
            }}
            part="rotate"
          />
        </>
      )}
    </div>
  );
}

interface ZoomButtonProps {
  part: 'zoom-out' | 'zoom-in' | 'fit' | 'rotate';
  glyph: 'minus' | 'plus' | 'minimize' | 'rotate-cw';
  label: string;
  disabled?: boolean | undefined;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

function ZoomButton({ part, glyph, label, disabled, onClick }: ZoomButtonProps) {
  return (
    <button
      aria-label={label}
      data-part={part}
      {...{ [`data-part-${part}`]: '' }}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon>
        <Glyph name={glyph} />
      </Icon>
    </button>
  );
}

/** The item's caption, under the stage. Absent when the item has none. */
export function MediaViewerCaption({ children, ...props }: MediaViewerCaptionProps) {
  const viewer = useMediaViewer();
  const caption = children ?? viewer.item?.caption;
  if (caption === undefined) return null;

  return (
    <p dir="auto" {...props} data-part="caption" data-part-caption="">
      {caption}
    </p>
  );
}

/** A strip of the set's pictures; the current one carries `aria-current`. */
export function MediaViewerThumbnails(props: MediaViewerThumbnailsProps) {
  const viewer = useMediaViewer();
  if (viewer.items.length < 2) return null;

  return (
    <div role="group" {...props} data-part="thumbnails" data-part-thumbnails="">
      {viewer.items.map((item) => {
        const current = item.id === viewer.item?.id;

        return (
          <button
            aria-current={current ? 'true' : undefined}
            aria-label={item.name}
            data-current={current ? '' : undefined}
            data-part="thumbnail"
            data-part-thumbnail=""
            key={item.id}
            onClick={(event) => viewer.requestStep(item.id, 'pointer', event)}
            ref={current ? revealThumbnail : undefined}
            type="button"
          >
            {item.thumbnail === undefined && !item.type.startsWith('image/') ? null : (
              <img alt="" src={item.thumbnail ?? item.src} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The current thumbnail is scrolled into the strip; a document without layout has no scroll. */
function revealThumbnail(node: HTMLButtonElement | null) {
  if (typeof node?.scrollIntoView === 'function') {
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
