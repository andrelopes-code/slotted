import { afterNextRender, computed, DestroyRef, inject, Injector, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

/** Below this width, on a finger, the surface is a sheet rather than a popover. */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** Below this width the panel is one column: one month, one part at a time. */
const NARROW_QUERY = '(max-width: 760px)';

/** The surface needs an identifier the trigger can point `aria-controls` at. */
let sequence = 0;

export interface PickerLayerOptions {
  /** Where focus goes once the panel is on screen, when the trigger opened it. */
  readonly focusPanel: (panel: HTMLElement) => void;
  /** The panel is off the screen, whatever took it away: the draft goes with it. */
  readonly left: () => void;
  /** Escape is the picker's own first: `true` when it took the key and the panel stays. */
  readonly onEscape?: () => boolean;
  readonly open: Signal<boolean | undefined>;
  readonly placement: Signal<string>;
  readonly requested: (request: ChangeRequest<boolean>) => void;
  /** The root of the picker, which holds the control the panel hangs from. */
  readonly root: HTMLElement;
  readonly trigger: () => HTMLElement | undefined;
}

/**
 * The layer a picker opens: whether it shows, where it stands, and what
 * dismisses it. `SlPickerLayer` draws it and hands it its element.
 */
export class PickerLayer {
  readonly contentId = `sl-picker-panel-${String((sequence += 1))}`;
  readonly narrow = mediaSignal(NARROW_QUERY);
  readonly sheet = mediaSignal(SHEET_QUERY);

  private readonly own = signal(false);
  readonly isOpen = computed(() => this.options.open() ?? this.own());

  private owesFocus = false;

  constructor(private readonly options: PickerLayerOptions) {}

  /** What an uncontrolled picker starts from. */
  start(open: boolean): void {
    this.own.set(open);
  }

  setOpen(next: boolean, reason: ChangeReason, source: unknown): void {
    const state = createControllable<boolean>({
      controlled: this.options.open(),
      initial: this.isOpen(),
      onRequest: (request) => this.options.requested(request),
    });
    if (state.request(next, reason, source)) this.own.set(next);
  }

  /** Opens, with focus in the panel unless the reader is typing in the field. */
  show(reason: ChangeReason, source: unknown, enter = true): void {
    this.owesFocus = enter;
    this.setOpen(true, reason, source);
  }

  /** Closes, with focus on the trigger: the reader is done. */
  finish(source: unknown): void {
    this.setOpen(false, 'select', source);
    this.options.trigger()?.focus({ preventScroll: true });
  }

  /** Places the layer, puts it in the single stack, and answers how to take it out. */
  attach(layer: HTMLElement): () => void {
    const releases = [this.place(layer), this.stack(layer), this.grip(layer)];
    if (this.owesFocus) {
      this.owesFocus = false;
      this.options.focusPanel(layer);
    }

    return () => {
      releases.forEach((release) => release());
      this.options.left();
    };
  }

  private place(layer: HTMLElement): () => void {
    if (this.sheet()) return () => undefined;

    const { placement, root } = this.options;
    const anchor = root.querySelector<HTMLElement>('[data-part="control"]') ?? root;
    const [side, align = 'center'] = placement().split('-') as [
      'top' | 'bottom',
      'start' | 'end' | undefined,
    ];
    const handle = createPositioner(anchor, layer, { align, side, sideOffset: 4 });
    /* The positioner writes `data-positioned` with the side, on the element, in
       the task that opened the layer; a binding to say it again was a frame later. */
    void handle.update();

    return () => handle.destroy();
  }

  private stack(layer: HTMLElement): () => void {
    const trigger = this.options.trigger();
    const handle = createDismissableLayer(layer, {
      branches: trigger === undefined ? [] : [trigger],
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: ({ reason, source }) => {
        if (reason === 'escape' && this.options.onEscape?.() === true) return;

        this.setOpen(false, reason === 'escape' ? 'escape' : 'outsidePress', source);
        /* Focus goes back to the trigger on a key and stays where the reader
           put it on a press outside. */
        if (reason === 'escape') trigger?.focus({ preventScroll: true });
      },
    });

    return () => handle.destroy();
  }

  /** A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
  private grip(layer: HTMLElement): () => void {
    const grip = layer.querySelector<HTMLElement>('[data-part="grip"]');
    if (grip === null) return () => undefined;

    return attachGripDismiss({
      grip,
      sheet: layer,
      onDismiss: (event) => this.setOpen(false, 'pointer', event),
    });
  }
}

/** Whether a media query matches; `false` until the browser has been asked. */
function mediaSignal(query: string): Signal<boolean> {
  const matches = signal(false);
  const destroyRef = inject(DestroyRef);

  afterNextRender(
    () => {
      if (typeof globalThis.matchMedia !== 'function') return;

      const list = globalThis.matchMedia(query);
      const read = () => matches.set(list.matches);
      read();
      list.addEventListener('change', read);
      destroyRef.onDestroy(() => list.removeEventListener('change', read));
    },
    { injector: inject(Injector) },
  );

  return matches.asReadonly();
}
