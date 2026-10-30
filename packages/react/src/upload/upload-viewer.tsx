import type { FamilyTranslator, UploadMessages } from '@slotted/core/i18n';
import { createPortalRoot } from '@slotted/core/portal';
import { isViewable } from '@slotted/core/upload';
import type { FileKind, UploadFile } from '@slotted/core/upload';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '../dialog';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import type { UploadFormatters } from './upload.types';

/**
 * A file, full screen, on a surface of its own.
 *
 * `dialog` owns the layer, the scrim, the focus containment, the scroll lock
 * and Escape; what this owns is the stage, the header and the two controls that
 * move through the set. A preview that left the page was the first answer and
 * it was the wrong one — it loses the form the reader was in the middle of
 * filling in. The tab survives as the escape hatch in the header, where a PDF is
 * better read in the browser's own full window.
 */

export interface UploadViewerProps {
  files: readonly UploadFile[];
  /** The family's size, restated on the layer: it is portalled out of the root. */
  size: 'sm' | 'md' | 'lg';
  /** The key of the file being looked at, or `null` when the viewer is shut. */
  viewing: string | null;
  urls: ReadonlyMap<string, string>;
  /** The family's words, the same translator the root reads. */
  t: FamilyTranslator<UploadMessages>;
  formatters: UploadFormatters;
  onViewing: (
    key: string | null,
    reason: 'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss',
    source: unknown,
  ) => void;
}

export function UploadViewer({
  files,
  size,
  viewing,
  urls,
  t,
  formatters,
  onViewing,
}: UploadViewerProps) {
  /*
   * Only what the viewer can render, so previous and next skip a spreadsheet
   * sitting between two photographs rather than stopping on it. A file the
   * viewer cannot render is still openable from its own name — it is the set it
   * is not part of.
   */
  /**
   * Where the layer was written, and what it inherits once it has moved.
   *
   * React's `Dialog` takes its origin from the trigger, and a viewer opened from
   * a file's own name has none: the layer landed at the end of the document
   * carrying neither the theme, the scheme nor the density of the region it came
   * from, and every token it reads resolved to nothing — a header with no
   * surface, controls painted as black squares, an image on no ground. The
   * marker below is the node the layer is written beside, which is what
   * `packages/core/portal` means by an origin, and the container it makes is
   * handed to the dialog. Angular needs none of this: `<sl-dialog>`'s host is
   * written in place and is its own origin.
   */
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    if (origin === null) return;
    const layer = createPortalRoot({ origin });
    setContainer(layer.container);
    return () => {
      setContainer(null);
      layer.release();
    };
  }, [origin]);

  const shown = files.filter((file) => file.file !== undefined && isViewable(file));
  const index = shown.findIndex((file) => file.key === viewing);
  const current = index === -1 ? files.find((file) => file.key === viewing) : shown[index];

  const move = (step: number, source: unknown) => {
    const next = shown[index + step];
    if (next !== undefined) onViewing(next.key, 'keyboard', source);
  };

  useEffect(() => {
    if (current === undefined) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') move(-1, event);
      else if (event.key === 'ArrowRight') move(1, event);
      else if (event.key === 'Home') {
        const first = shown[0];
        if (first !== undefined) onViewing(first.key, 'keyboard', event);
      } else if (event.key === 'End') {
        const last = shown.at(-1);
        if (last !== undefined) onViewing(last.key, 'keyboard', event);
      } else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* No `data-part`: the contract's vocabulary is what a consumer may select, and
     this is a marker for the portal rather than a part of the family. */
  const marker = <span hidden ref={setOrigin} />;

  if (current === undefined || container === null) return marker;

  const url = urls.get(current.key);

  return (
    <>
      {marker}
      <Dialog
        container={container}
        fullScreen="always"
        onOpenChange={(open, request) => {
          if (!open) {
            onViewing(
              null,
              request.reason === 'escape' || request.reason === 'outsidePress'
                ? request.reason
                : 'dismiss',
              request.source,
            );
          }
        }}
        open
      >
        {/*
         * The panel takes its name from the file, because the viewer's own title
         * is a part of this family rather than a `DialogTitle`: one element cannot
         * carry two families' `data-part`.
         */}
        <DialogContent aria-label={current.name}>
          {/*
           * The layer carries the family's own identifier rather than standing
           * inside it. `Dialog` portals its content to the end of the document,
           * so a rule written as a descendant of the root matched nothing and the
           * viewer rendered with none of its own styles — the defect a reader saw
           * as a broken overlay. It also cannot be portalled into the root, which
           * declares `container-type` and is therefore a containing block for the
           * fixed layer.
           */}
          <div
            data-part="viewer"
            data-part-viewer=""
            data-size={size}
            data-ui="upload"
            data-ui-upload=""
          >
            <div data-part="viewerHeader" data-part-viewerheader="">
              <div>
                <h2 data-part="viewerTitle" data-part-viewertitle="">
                  {current.name}
                </h2>
                <span data-part="viewerMeta" data-part-viewermeta="">
                  {index === -1
                    ? t('viewerMeta', {
                        size: formatters.bytes(current.size),
                        kind: t(current.kind),
                      })
                    : t('viewerMetaPosition', {
                        size: formatters.bytes(current.size),
                        kind: t(current.kind),
                        index: index + 1,
                        count: shown.length,
                      })}
                </span>
              </div>
              <span data-part="viewerActions" data-part-vieweractions="">
                {url === undefined ? null : (
                  <button
                    aria-label={t('viewerExternal')}
                    data-part="viewerExternal"
                    data-part-viewerexternal=""
                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                    type="button"
                  >
                    <Icon>
                      <Glyph name="external" />
                    </Icon>
                  </button>
                )}
                <button
                  aria-label={t('viewerClose')}
                  data-part="viewerClose"
                  data-part-viewerclose=""
                  onClick={(event) => onViewing(null, 'pointer', event)}
                  type="button"
                >
                  <Icon>
                    <Glyph name="x" />
                  </Icon>
                </button>
              </span>
            </div>

            <div data-part="viewerStage" data-part-viewerstage="">
              {shown.length > 1 ? (
                <button
                  aria-label={t('viewerPrevious')}
                  data-part="viewerPrevious"
                  data-part-viewerprevious=""
                  disabled={index <= 0}
                  onClick={(event) => move(-1, event)}
                  type="button"
                >
                  <Icon directional>
                    <Glyph name="chevron-right" />
                  </Icon>
                </button>
              ) : null}

              <UploadStage current={current} t={t} url={url} />

              {shown.length > 1 ? (
                <button
                  aria-label={t('viewerNext')}
                  data-part="viewerNext"
                  data-part-viewernext=""
                  disabled={index === -1 || index >= shown.length - 1}
                  onClick={(event) => move(1, event)}
                  type="button"
                >
                  <Icon directional>
                    <Glyph name="chevron-right" />
                  </Icon>
                </button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadStage({
  current,
  t,
  url,
}: {
  current: UploadFile;
  t: FamilyTranslator<UploadMessages>;
  url: string | undefined;
}) {
  const type = current.type.split(';')[0] ?? '';

  if (url !== undefined && type.startsWith('image/')) {
    return <img alt={current.name} src={url} />;
  }
  if (url !== undefined && type.startsWith('video/')) {
    return <video controls src={url} />;
  }
  if (url !== undefined && type.startsWith('audio/')) {
    return <audio controls src={url} />;
  }
  /*
   * A PDF is framed without `sandbox` and everything else with it, and the
   * asymmetry is measured rather than assumed. Chrome's PDF viewer is blocked in
   * a sandboxed frame — with `sandbox=""` and with `sandbox="allow-scripts"`
   * alike, both photographed against a one-page document — so the sandbox that
   * protects a dropped `text/html` file is also what made every PDF preview a
   * grey box, which is how a reader met it.
   *
   * What makes the exception safe is the type: the object URL carries the file's
   * own media type, Chrome dispatches `application/pdf` to the PDF viewer by
   * that type and does not sniff HTML out of it — an HTML document served as
   * `application/pdf` in an unsandboxed frame ran no script, measured the same
   * way. Text keeps the sandbox, with neither `allow-scripts` nor
   * `allow-same-origin`, because an object URL inherits this document's origin.
   */
  if (url !== undefined && type === 'application/pdf') {
    return <iframe src={url} title={current.name} />;
  }
  if (url !== undefined && type.startsWith('text/')) {
    return <iframe sandbox="" src={url} title={current.name} />;
  }

  return (
    <>
      <span
        data-extension={extensionLabel(current.name, t('noExtension'))}
        data-kind={current.kind}
        data-part="preview"
        data-part-preview=""
      >
        <Icon>
          <Glyph name={KIND_GLYPH[current.kind]} />
        </Icon>
      </span>
      <p>{t('viewerUnsupported')}</p>
    </>
  );
}

/**
 * What a file is drawn as on its tile: one glyph per kind, the plain file for
 * anything no kind claims. The row's tile and the viewer's stage read the same
 * map, so a kind never has two marks.
 */
export const KIND_GLYPH: Record<FileKind, GlyphName> = {
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

/** The extension as the tile prints it, or the catalog's word for a name without one. */
function extensionLabel(name: string, none: string) {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? none : name.slice(dot + 1).toUpperCase();
}
