import '@slotted/styles/media-viewer/media-viewer.css';

import { mediaViewerMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { mediaKind } from '@slotted/core/media-viewer';
import type { MediaStageHandle } from '@slotted/core/media-viewer';
import { createPortalRoot } from '@slotted/core/portal';
import { useEffect, useId, useRef, useState } from 'react';

import { Dialog, DialogContent } from '../dialog';
import { useMessages } from '../i18n';
import { MediaViewerContext } from './media-viewer-context';
import type { MediaViewerContextValue, MediaViewerStatus } from './media-viewer-context';
import { useMediaViewerDefaults } from './media-viewer-defaults';
import { MediaViewerAnatomy } from './media-viewer-anatomy';
import type { MediaViewerProps } from './media-viewer.types';
import { useMediaViewerState } from './use-media-viewer-state';

/**
 * A file of a set, full screen: fitted, zoomed, turned and stepped. The layer
 * is `dialog`'s, with `fullScreen="always"` and `surface="plain"`; nothing of
 * it is redrawn here. Without children the viewer draws its own anatomy; with
 * them, the consumer arranges the parts.
 */
export function MediaViewer(props: MediaViewerProps) {
  const defaults = useMediaViewerDefaults();
  const limits = {
    minZoom: props.minZoom ?? defaults.minZoom,
    maxZoom: props.maxZoom ?? defaults.maxZoom,
    zoomStep: props.zoomStep ?? defaults.zoomStep,
    loop: props.loop ?? defaults.loop,
  };
  const t = useMessages(mediaViewerMessages, props.messages ?? defaults.messages);
  const state = useMediaViewerState(props, limits);
  const [status, setStatus] = useState<MediaViewerStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const [ownContainer, setOwnContainer] = useState<Element | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const handle = useRef<MediaStageHandle | null>(null);
  const id = useId();

  useOwnLayer(origin, props.container, setOwnContainer);
  useStepAnnouncement(state.open, state.item?.id, () =>
    t('announce', {
      name: state.item?.name ?? '',
      index: state.index + 1,
      count: props.items.length,
    }),
  );

  const kind = state.item === undefined ? 'other' : mediaKind(state.item.type, state.item.name);
  const scheme = origin?.closest('[data-slotted-scheme]')?.getAttribute('data-slotted-scheme');
  const context: MediaViewerContextValue = {
    ...state,
    items: props.items,
    kind,
    limits,
    status,
    titleId: `${id}-title`,
    positionId: `${id}-position`,
    t,
    stage,
    handle,
    attempt,
    setStatus,
    retry: () => {
      setStatus('loading');
      setAttempt((count) => count + 1);
    },
  };

  return (
    <>
      <span hidden ref={setOrigin} />
      <Dialog
        back="close"
        container={props.container === undefined ? ownContainer : props.container}
        fullScreen="always"
        fullscreenToggle={props.fullscreenToggle}
        initialFocus={stage}
        onOpenChange={(next, request) => {
          state.requestOpen(next, request.reason, request.source);
        }}
        open={state.open}
        surface="plain"
      >
        <DialogContent
          aria-describedby={props.items.length > 1 ? context.positionId : undefined}
          aria-labelledby={context.titleId}
        >
          <MediaViewerContext.Provider value={context}>
            <div
              data-kind={kind}
              data-loading={status === 'loading' ? '' : undefined}
              data-part="root"
              data-part-root=""
              data-slotted-scheme={scheme === 'high-contrast' ? 'high-contrast' : 'dark'}
              data-ui="media-viewer"
              data-ui-media-viewer=""
              data-zoomed={kind === 'image' && state.zoom > 1 ? '' : undefined}
            >
              {props.children ?? <MediaViewerAnatomy />}
            </div>
          </MediaViewerContext.Provider>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Where the layer is written, and what it inherits once it has moved: the
 * theme, the scheme and the density of the region the viewer was rendered in.
 * `upload`'s viewer measured the same defect — a layer at the end of the
 * document read no token at all — and answered it the same way.
 */
function useOwnLayer(
  origin: HTMLElement | null,
  container: Element | null | undefined,
  setContainer: (container: Element | null) => void,
) {
  useEffect(() => {
    if (origin === null || container !== undefined) return;

    const layer = createPortalRoot({ origin });
    setContainer(layer.container);

    return () => {
      setContainer(null);
      layer.release();
    };
  }, [container, origin, setContainer]);
}

/** A step says which file and which of how many, politely; opening says nothing more than the title. */
function useStepAnnouncement(open: boolean, key: string | undefined, message: () => string) {
  const shown = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      shown.current = undefined;
      return;
    }

    if (shown.current !== undefined && key !== undefined && key !== shown.current) {
      getLiveAnnouncer().announce(message(), { politeness: 'polite' });
    }
    shown.current = key;
  });
}
