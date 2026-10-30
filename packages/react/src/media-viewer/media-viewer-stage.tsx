import { createMediaStage } from '@slotted/core/media-viewer';
import { useEffect, useLayoutEffect, useRef } from 'react';

import { useMediaViewer } from './media-viewer-context';
import { MediaViewerMedia } from './media-viewer-media';
import type { MediaViewerContextValue } from './media-viewer-context';
import type { MediaViewerStageProps } from './media-viewer.types';

/**
 * Where the file is drawn, and the scrollport of a zoomed picture. The
 * controller of `@slotted/core/media-viewer` turns the wheel, the pointers and
 * the keys into requests; after each render it sizes the picture for the state
 * that was accepted.
 */
export function MediaViewerStage({ children, ...props }: MediaViewerStageProps) {
  const viewer = useMediaViewer();
  const latest = useRef(viewer);
  latest.current = viewer;

  useStageController(viewer, latest);
  useNeighbourPreload(viewer);

  useLayoutEffect(() => {
    viewer.handle.current?.update();
  });

  return (
    <div
      aria-label={viewer.t('label', { name: viewer.item?.name ?? '' })}
      tabIndex={0}
      {...props}
      data-error={viewer.status === 'error' ? '' : undefined}
      data-kind={viewer.kind}
      data-part="stage"
      data-part-stage=""
      data-rotation={String(viewer.kind === 'image' ? viewer.rotation : 0)}
      ref={viewer.stage}
    >
      {children ?? <MediaViewerMedia key={`${viewer.item?.id ?? ''}:${String(viewer.attempt)}`} />}
    </div>
  );
}

function useStageController(
  viewer: MediaViewerContextValue,
  latest: { readonly current: MediaViewerContextValue },
) {
  const { handle, stage } = viewer;

  useEffect(() => {
    const element = stage.current;
    const keys = element?.closest<HTMLElement>('[data-ui="media-viewer"]');
    if (element === null || keys === null || keys === undefined) return;

    handle.current = createMediaStage({
      stage: element,
      keys,
      getState: () => {
        const current = latest.current;

        return {
          ...current.limits,
          zoom: current.zoom,
          rotation: current.rotation,
          zoomable: current.kind === 'image' && current.status === 'ready',
        };
      },
      onZoomRequest: (zoom, reason, event) => latest.current.requestZoom(zoom, reason, event),
      onRotationRequest: (rotation, reason, event) =>
        latest.current.requestRotation(rotation, reason, event),
      onStepRequest: (step, reason, event) => latest.current.requestStep(step, reason, event),
      onCloseRequest: (reason, event) => latest.current.requestOpen(false, reason, event),
    });

    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, [handle, latest, stage]);
}

/** The pictures either side are decoded ahead, so a step shows its picture at once. */
function useNeighbourPreload(viewer: MediaViewerContextValue) {
  const { index, items } = viewer;

  useEffect(() => {
    for (const neighbour of [items[index - 1], items[index + 1]]) {
      if (neighbour === undefined || !neighbour.type.startsWith('image/')) continue;

      const picture = new Image();
      picture.src = neighbour.src;
      /* `decode` is absent outside a browser; the request alone already warms the cache. */
      if ('decode' in picture) picture.decode().catch(() => undefined);
    }
  }, [index, items]);
}
