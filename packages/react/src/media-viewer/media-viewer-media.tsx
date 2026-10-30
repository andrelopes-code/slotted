import { readableText } from '@slotted/core/media-viewer';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMediaViewer } from './media-viewer-context';
import { MediaViewerFailure, MediaViewerUnsupported } from './media-viewer-fallback';

/** The shown file, drawn by the platform for its kind. Keyed by the item and the attempt. */
export function MediaViewerMedia() {
  const viewer = useMediaViewer();
  const item = viewer.item;
  const { kind, setStatus } = viewer;
  const picture = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    const loaded = picture.current?.complete === true && picture.current.naturalWidth > 0;
    const waits = kind === 'image' || kind === 'text';
    setStatus(!waits || loaded ? 'ready' : 'loading');
  }, [kind, setStatus]);

  if (item === undefined) return null;

  if (viewer.status === 'error') return <MediaViewerFailure />;

  if (kind === 'image') {
    return (
      <div
        data-loading={viewer.status === 'loading' ? '' : undefined}
        data-part="frame"
        data-part-frame=""
      >
        <img
          alt={item.name}
          data-part="media"
          data-part-media=""
          draggable={false}
          height={item.height}
          onError={() => setStatus('error')}
          onLoad={() => setStatus('ready')}
          ref={picture}
          src={item.src}
          width={item.width}
        />
        {viewer.status === 'loading' ? <MediaViewerLoading /> : null}
      </div>
    );
  }

  if (kind === 'text') return <MediaViewerText />;

  /* Chrome's reader refuses a sandboxed frame (`upload` measured it); a PDF runs no script. */
  if (kind === 'pdf') {
    return <iframe data-part="media" data-part-media="" src={item.src} title={item.name} />;
  }

  if (kind === 'video') {
    return (
      <video
        controls
        data-part="media"
        data-part-media=""
        onError={() => setStatus('error')}
        src={item.src}
      />
    );
  }

  if (kind === 'audio') {
    return (
      <audio
        controls
        data-part="media"
        data-part-media=""
        onError={() => setStatus('error')}
        src={item.src}
      />
    );
  }

  return <MediaViewerUnsupported />;
}

function MediaViewerLoading() {
  const viewer = useMediaViewer();

  return (
    <div data-part="status" data-part-status="" role="status">
      {viewer.t('loading', { name: viewer.item?.name ?? '' })}
    </div>
  );
}

/**
 * A text file — plain, structured or source — read as text and set in the
 * monospace face. It is never executed, so an HTML file shows its source and
 * a JSON file is indented when it parses.
 */
function MediaViewerText() {
  const viewer = useMediaViewer();
  const { item, setStatus } = viewer;
  const [content, setContent] = useState<{ text: string; truncated: boolean } | null>(null);
  const src = item?.src;
  const type = item?.type ?? '';
  const name = item?.name ?? '';

  useEffect(() => {
    if (src === undefined) return;

    const controller = new AbortController();
    fetch(src, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));

        return response.text();
      })
      .then((text) => {
        setContent(readableText(text, type, name));
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [name, setStatus, src, type]);

  if (content === null) return <MediaViewerLoading />;

  return (
    <div data-part="text" data-part-text="">
      <pre data-part="media" data-part-media="" dir="auto">
        {content.text}
      </pre>
      {content.truncated ? <p>{viewer.t('truncated')}</p> : null}
    </div>
  );
}
