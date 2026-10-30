import type { FamilyTranslator, MediaViewerMessages } from '@slotted/core/i18n';
import type { MediaKind, MediaStageHandle } from '@slotted/core/media-viewer';
import { createContext, useContext } from 'react';
import type { RefObject } from 'react';

import type { MediaViewerItem } from './media-viewer.types';
import type { MediaViewerLimits, MediaViewerState } from './use-media-viewer-state';

export type MediaViewerStatus = 'loading' | 'ready' | 'error';

export interface MediaViewerContextValue extends MediaViewerState {
  readonly items: readonly MediaViewerItem[];
  readonly kind: MediaKind;
  readonly limits: MediaViewerLimits;
  readonly status: MediaViewerStatus;
  readonly titleId: string;
  readonly positionId: string;
  readonly t: FamilyTranslator<MediaViewerMessages>;
  readonly stage: RefObject<HTMLDivElement | null>;
  readonly handle: RefObject<MediaStageHandle | null>;
  /** How many times the shown file was loaded again; part of the medium's key. */
  readonly attempt: number;
  setStatus(status: MediaViewerStatus): void;
  /** Loads the shown file again after it failed. */
  retry(): void;
}

export const MediaViewerContext = createContext<MediaViewerContextValue | null>(null);

export function useMediaViewer(): MediaViewerContextValue {
  const context = useContext(MediaViewerContext);
  if (context === null) throw new Error('A media-viewer part is rendered outside <MediaViewer>.');

  return context;
}
