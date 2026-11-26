import {
  afterNextRender,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { attachGripDismiss, SHEET_QUERY, watchMedia } from '@slotted/core/extent';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

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
 * dismisses it. `SlPickerLayer` draws it and hands it its element. On a phone
 * it is a modal bottom sheet over a scrim, which slides out before it goes.
 */
export class PickerLayer {
  readonly contentId = `sl-picker-panel-${String((sequence += 1))}`;
  readonly narrow = mediaSignal(NARROW_QUERY);
  readonly sheet = mediaSignal(SHEET_QUERY);

  private readonly own = signal(false);
  readonly isOpen = computed(() => this.options.open() ?? this.own());

  private readonly status = signal<PresenceStatus>('unmounted');
  /** The surface is in the tree: open, or on its way out. */
  readonly mounted = computed(() => this.isOpen() || this.status() !== 'unmounted');

  private readonly node = signal<HTMLElement | null>(null);
  private owesFocus = false;

  constructor(private readonly options: PickerLayerOptions) {
    /* Only the sheet waits for its way out; the anchored surface goes at once. */
    const presence = createPresence({
      present: false,
      reducedMotion: () => !untracked(this.sheet) || prefersReducedMotion(),
      onStatusChange: (next) => this.status.set(next),
    });
    inject(DestroyRef).onDestroy(() => presence.destroy());
    effect(() => presence.sync(this.isOpen()));
    effect(() => presence.setNode(this.node()));

    /* What dismisses the surface stands while it is open, and goes as it closes. */
    effect((onCleanup) => {
      const layer = this.node();
      const sheet = this.sheet();
      if (layer === null || !this.isOpen()) return;

      const releases = untracked(() => [this.stack(layer, sheet), this.grip(layer, sheet)]);
      onCleanup(() => releases.forEach((release) => release()));
    });
  }

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
    const release = this.place(layer);
    this.node.set(layer);
    if (this.owesFocus) {
      this.owesFocus = false;
      this.options.focusPanel(layer);
    }

    return () => {
      release();
      this.node.set(null);
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

  /**
   * The trigger is a branch, so pressing it again closes the surface instead
   * of dismissing and reopening it in one gesture. The sheet is modal: the
   * page is inert under its scrim, and a press on the scrim is outside.
   */
  private stack(layer: HTMLElement, sheet: boolean): () => void {
    const trigger = this.options.trigger();
    const handle = createDismissableLayer(layer, {
      back: sheet,
      branches: trigger === undefined ? [] : [trigger],
      content: layer.querySelector(':scope > [data-part="content"]') ?? layer,
      escape: true,
      focusOutside: false,
      modal: sheet,
      outsidePress: true,
      outsidePressEvent: sheet ? 'click' : 'pointerdown',
      scrollLock: sheet,
      onDismiss: ({ reason, source }) => {
        if (reason === 'escape' && this.options.onEscape?.() === true) return;

        /* The platform's way back is the sheet's Escape. */
        const key = reason === 'escape' || reason === 'back';
        this.setOpen(false, key ? 'escape' : 'outsidePress', source);
        /* Focus goes back to the trigger on a key and stays where the reader
           put it on a press outside. */
        if (reason === 'escape') trigger?.focus({ preventScroll: true });
      },
    });

    return () => {
      /* A press on the scrim blurs the panel: focus is then on the body. */
      const { activeElement, body } = layer.ownerDocument;
      const held =
        activeElement === null || activeElement === body || layer.contains(activeElement);
      /* The layer first: focus given back to an `inert` trigger is refused. */
      handle.destroy();
      /* A sheet covered the field: its close puts the reader back beside it. */
      if (sheet && held) trigger?.focus({ preventScroll: true });
    };
  }

  /** A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
  private grip(layer: HTMLElement, sheet: boolean): () => void {
    const panel = layer.querySelector<HTMLElement>(':scope > [data-part="content"]');
    const grip = panel?.querySelector<HTMLElement>(':scope > [data-part="grip"]');
    if (!sheet || panel == null || grip == null) return () => undefined;

    return attachGripDismiss({
      grip,
      scrim: layer.querySelector<HTMLElement>(':scope > [data-part="backdrop"]'),
      sheet: panel,
      onDismiss: (event) => this.setOpen(false, 'pointer', event),
    });
  }
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Whether a media query matches; `false` until the browser has been asked. */
function mediaSignal(query: string): Signal<boolean> {
  const matches = signal(false);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => destroyRef.onDestroy(watchMedia(query, (next) => matches.set(next))), {
    injector: inject(Injector),
  });

  return matches.asReadonly();
}
