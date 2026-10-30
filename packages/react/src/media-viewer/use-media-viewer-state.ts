import { clampZoom } from '@slotted/core/media-viewer';
import type { MediaStageStep, Rotation } from '@slotted/core/media-viewer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MediaViewerItem, MediaViewerProps } from './media-viewer.types';

export interface MediaViewerLimits {
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly zoomStep: number;
  readonly loop: boolean;
}

export interface MediaViewerState {
  readonly open: boolean;
  readonly item: MediaViewerItem | undefined;
  readonly index: number;
  readonly zoom: number;
  readonly rotation: Rotation;
  requestOpen(open: boolean, reason: ChangeReason, source?: unknown): void;
  requestStep(step: MediaStageStep | string, reason: ChangeReason, source?: unknown): void;
  requestZoom(zoom: number, reason: ChangeReason, source?: unknown): void;
  requestRotation(rotation: Rotation, reason: ChangeReason, source?: unknown): void;
}

/**
 * The viewer's four values in the library's two modes
 * (`docs/state-and-events.md`): the consumer's when it states one, the
 * viewer's own otherwise, and every move a request the consumer may cancel.
 * A step puts the level and the turn back with the reason `select`; an item
 * that leaves the set while it is shown passes to its neighbour with `remove`.
 */
export function useMediaViewerState(props: MediaViewerProps, limits: MediaViewerLimits) {
  const { items } = props;
  const [open, requestOpen] = useControllable(
    props.open,
    props.defaultOpen ?? false,
    props.onOpenChange,
  );
  const [value, requestValue] = useControllable(
    props.value,
    props.defaultValue ?? items[0]?.id ?? '',
    props.onValueChange,
  );
  const [zoom, requestZoomValue] = useControllable(
    props.zoom,
    props.defaultZoom ?? 1,
    props.onZoomChange,
  );
  const [rotation, requestRotation] = useControllable<Rotation>(
    props.rotation,
    props.defaultRotation ?? 0,
    props.onRotationChange,
  );
  const index = items.findIndex((item) => item.id === value);
  const previousItems = useRef(items);

  useEffect(() => {
    const before = previousItems.current;
    previousItems.current = items;
    if (index !== -1 || !open) return;

    if (items.length === 0) {
      requestOpen(false, 'programmatic');
      return;
    }

    const was = before.findIndex((item) => item.id === value);
    const neighbour = items[Math.min(Math.max(was, 0), items.length - 1)];
    if (neighbour !== undefined) requestValue(neighbour.id, 'remove');
  }, [index, items, open, requestOpen, requestValue, value]);

  const requestZoom = useCallback(
    (next: number, reason: ChangeReason, source?: unknown) => {
      requestZoomValue(clampZoom(next, limits.minZoom, limits.maxZoom), reason, source);
    },
    [limits.maxZoom, limits.minZoom, requestZoomValue],
  );

  const requestStep = useCallback(
    (step: MediaStageStep | string, reason: ChangeReason, source?: unknown) => {
      const target = stepTarget(items, index, step, limits.loop);
      if (target === undefined || target.id === value) return;

      requestValue(target.id, reason, source);
      requestZoomValue(1, 'select');
      requestRotation(0, 'select');
    },
    [index, items, limits.loop, requestRotation, requestValue, requestZoomValue, value],
  );

  const state: MediaViewerState = {
    open,
    item: items[index],
    index,
    zoom,
    rotation,
    requestOpen,
    requestStep,
    requestZoom,
    requestRotation,
  };

  return state;
}

/** The item a step lands on: a direction, an end, or an item's own `id`. */
function stepTarget(
  items: readonly MediaViewerItem[],
  index: number,
  step: MediaStageStep | string,
  loop: boolean,
): MediaViewerItem | undefined {
  if (step === 'first') return items[0];
  if (step === 'last') return items.at(-1);
  if (step !== 'next' && step !== 'previous') return items.find((item) => item.id === step);

  const next = index + (step === 'next' ? 1 : -1);
  if (next >= 0 && next < items.length) return items[next];

  return loop && items.length > 1 ? items[(next + items.length) % items.length] : undefined;
}

function useControllable<T>(
  controlled: T | undefined,
  initial: T,
  onChange: ((value: T, request: ChangeRequest<T>) => void) | undefined,
) {
  const [own, setOwn] = useState(initial);
  const value = controlled !== undefined ? controlled : own;
  const latest = useRef({ controlled, value, onChange });
  latest.current = { controlled, value, onChange };

  const request = useCallback((next: T, reason: ChangeReason, source?: unknown) => {
    const current = latest.current;
    const state = createControllable<T>({
      controlled: current.controlled,
      initial: current.value,
      onRequest: (asked) => current.onChange?.(asked.value, asked),
    });
    if (state.request(next, reason, source)) setOwn(next);
  }, []);

  return [value, request] as const;
}
