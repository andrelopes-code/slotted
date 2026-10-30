import { MediaViewerBar } from './media-viewer-bar';
import {
  MediaViewerCaption,
  MediaViewerNext,
  MediaViewerPrevious,
  MediaViewerZoom,
} from './media-viewer-controls';
import { MediaViewerStage } from './media-viewer-stage';

/** What the viewer draws when the consumer arranges nothing. */
export function MediaViewerAnatomy() {
  return (
    <>
      <MediaViewerBar />
      <MediaViewerStage />
      <MediaViewerPrevious />
      <MediaViewerNext />
      <MediaViewerZoom />
      <MediaViewerCaption />
    </>
  );
}
