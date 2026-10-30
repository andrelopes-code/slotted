import { createPointerIntent } from '@slotted/core/pointer-intent';
import type { PointerIntentHandle } from '@slotted/core/pointer-intent';
import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  untracked,
} from '@angular/core';
import { SlPopover } from '@slotted/angular/popover';
import type { PopoverOpenReason } from '@slotted/angular/popover';

import { injectHoverCardDefaults } from './hover-card-defaults';

/**
 * The popover's reasons, plus `blur`: focus leaving the trigger is the one
 * way this family closes that the popover never does.
 */
export type HoverCardOpenReason = PopoverOpenReason | 'blur';

/**
 * The halo the open mark draws past the link's box, plus the same again of
 * air: the popover puts its arrow's tip a pixel off the anchor, which is right
 * for a button and touched the halo on a word.
 */
const SIDE_OFFSET = 4;

/**
 * A preview of a link or a person, opened by hover and by focus.
 *
 * The card is `slPopover` behind a trigger the popover does not have. The
 * directive *is* a popover — it extends `SlPopover` and provides itself as
 * one, so every `slPopover*` part written inside it reaches the card — and it
 * decides three things the popover leaves open: focus is never taken on open,
 * the panel's role follows `navigable`, and the layer stands off the link by
 * the halo the open mark draws. `slPopoverLayer`, `slPopoverBody` and the rest
 * are the popover's own, imported as they are.
 */
@Directive({
  selector: '[slHoverCard]',
  standalone: true,
  exportAs: 'slHoverCard',
  providers: [{ provide: SlPopover, useExisting: forwardRef(() => SlHoverCard) }],
})
export class SlHoverCard extends SlPopover {
  readonly openDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly closeDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : numberAttribute(given)),
  });
  readonly navigable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (given) => (given === undefined ? undefined : booleanAttribute(given)),
  });

  private readonly cardDefaults = injectHoverCardDefaults();

  readonly resolvedOpenDelay = computed(() => this.openDelay() ?? this.cardDefaults.openDelay);
  readonly resolvedCloseDelay = computed(() => this.closeDelay() ?? this.cardDefaults.closeDelay);
  readonly resolvedNavigable = computed(
    () => (this.navigable() ?? this.cardDefaults.navigable) === true,
  );

  /** The card never takes focus: the reader's focus stays on the link. */
  override readonly resolvedAutoFocus = computed(() => false);
  /** A card the keyboard cannot enter is not a dialog nobody is told about. */
  override readonly contentRole = computed<string>(() =>
    this.resolvedNavigable() ? 'dialog' : 'presentation',
  );
  override readonly resolvedSideOffset = computed(() => this.sideOffset() ?? SIDE_OFFSET);

  /** Focus the family put back on the trigger must not reopen the card. */
  suppressFocusOpen = false;

  private timer: ReturnType<typeof setTimeout> | undefined;
  private intent: PointerIntentHandle | null = null;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);

    /**
     * The pointer on the card keeps it open, and leaving the card starts the
     * close. The listeners go on the layer — the padded box around the panel —
     * as soon as the popover has built it.
     */
    effect((onCleanup) => {
      const panel = this.contentNode();
      if (panel === null) return;
      const layer = panel.parentElement ?? panel;
      const enter = (event: Event) => {
        if ((event as PointerEvent).pointerType === 'touch') return;
        untracked(() => this.cancelPending());
      };
      const leave = (event: Event) => {
        if ((event as PointerEvent).pointerType === 'touch') return;
        untracked(() => this.closeAfterDelay(event));
      };
      layer.addEventListener('pointerenter', enter);
      layer.addEventListener('pointerleave', leave);
      onCleanup(() => {
        layer.removeEventListener('pointerenter', enter);
        layer.removeEventListener('pointerleave', leave);
      });
    });

    destroyRef.onDestroy(() => this.cancelPending());
  }

  /** Asks to open or close. A close the keyboard caused holds the reopening back. */
  override toggle(next: boolean, reason: HoverCardOpenReason, source?: Event) {
    this.cancelPending();
    super.toggle(next, reason as PopoverOpenReason, source);
    if (!next && !this.isOpen() && (reason === 'escape' || reason === 'keyboard')) {
      this.suppressFocusOpen = true;
    }
  }

  /** Cancels a pending open or close, and the grace area. */
  cancelPending() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.intent?.destroy();
    this.intent = null;
  }

  /** Opens after `openDelay`, unless something cancels it first. */
  openAfterDelay(source?: Event) {
    this.cancelPending();
    this.timer = setTimeout(() => this.toggle(true, 'pointer', source), this.resolvedOpenDelay());
  }

  /** Closes after `closeDelay`, unless the pointer comes back first. */
  closeAfterDelay(source?: Event) {
    this.cancelPending();
    this.timer = setTimeout(() => this.toggle(false, 'pointer', source), this.resolvedCloseDelay());
  }

  /**
   * The grace area: the card stays while the pointer's path from `origin`
   * still points into the card, and closes once it does not — unless the
   * pointer turns out to be on the trigger or the card after all.
   */
  graceToward(origin: () => DOMRect | null, stillOver: () => boolean, source?: Event) {
    this.cancelPending();
    this.intent = createPointerIntent({
      origin,
      target: () => {
        const panel = this.contentNode();
        return (panel?.parentElement ?? panel)?.getBoundingClientRect() ?? null;
      },
      timeout: this.resolvedCloseDelay(),
      onSettled: () => {
        this.intent = null;
        if (stillOver()) return;
        this.toggle(false, 'pointer', source);
      },
    });
  }
}
