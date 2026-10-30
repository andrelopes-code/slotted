/**
 * The two things the chart's layers — the menu, the `+N` legend, the help —
 * need from a binding that neither framework gives. The layers themselves are
 * native popovers: the top layer, light dismiss and `Escape` are the
 * platform's. What is left is where one goes and why its control was pressed.
 */

export interface LayerPlacement {
  readonly x: number;
  readonly y: number;
}

/**
 * Where a layer goes in the viewport: under its control, aligned to the
 * control's end edge (or start, for a layer that reads with the words beside
 * it), flipped above when there is no room below, and held a margin inside
 * the viewport. The end edge follows the document's direction.
 */
export function placeLayer(request: {
  readonly anchor: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  readonly size: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly align?: 'start' | 'end';
  readonly dir?: 'ltr' | 'rtl';
  readonly gap?: number;
  readonly margin?: number;
}): LayerPlacement {
  const { anchor, size, viewport } = request;
  const gap = request.gap ?? 4;
  const margin = request.margin ?? 8;
  const toEnd = (request.align ?? 'end') === 'end';
  const rightAligned = toEnd !== (request.dir === 'rtl');
  const wanted = rightAligned ? anchor.right - size.width : anchor.left;
  const x = Math.max(margin, Math.min(wanted, viewport.width - size.width - margin));
  const below = anchor.bottom + gap;
  const y =
    below + size.height > viewport.height - margin
      ? Math.max(margin, anchor.top - size.height - gap)
      : below;
  return { x: Math.round(x), y: Math.round(y) };
}

export type ActivationReason = 'pointer' | 'keyboard' | 'programmatic';

/**
 * Which input a control's activation came from. A click does not say:
 * `detail` is 0 for a key, for a screen reader's activation and for a
 * script's `click()` alike. The last press on the control does — a pointer
 * down, or Enter or Space — and a click with neither before it is the
 * application asking. Reading the reason consumes it.
 */
export function trackModality(control: HTMLElement): { read(): ActivationReason; destroy(): void } {
  let last: ActivationReason = 'programmatic';
  const pointer = () => (last = 'pointer');
  const key = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') last = 'keyboard';
  };
  control.addEventListener('pointerdown', pointer);
  control.addEventListener('keydown', key);
  return {
    read() {
      const reason = last;
      last = 'programmatic';
      return reason;
    },
    destroy() {
      control.removeEventListener('pointerdown', pointer);
      control.removeEventListener('keydown', key);
    },
  };
}
