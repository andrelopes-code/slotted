import { isClipped } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  type OnInit,
  signal,
  untracked,
} from '@angular/core';

import { injectTooltipDefaults, SlTooltipGroup, SlTooltipIdFactory } from './tooltip-defaults';
import type {
  TooltipAlign,
  TooltipChangeRequest,
  TooltipDescribes,
  TooltipMount,
  TooltipOpenOn,
  TooltipOpenReason,
  TooltipSide,
  TooltipSize,
  TooltipStrategy,
  TooltipVariant,
} from './tooltip-defaults';

export type {
  TooltipAlign,
  TooltipChangeRequest,
  TooltipDefaults,
  TooltipDescribes,
  TooltipMount,
  TooltipOpenOn,
  TooltipOpenReason,
  TooltipSide,
  TooltipSize,
  TooltipStrategy,
  TooltipVariant,
} from './tooltip-defaults';

/** Unstated stays unstated, so a tooltip defers to the provider rather than to `false`. */
const optionalBoolean = (state: boolean | string | undefined) =>
  state === undefined ? undefined : booleanAttribute(state);

/** Unstated stays unstated, for the same reason, on a number. */
const optionalNumber = (value: number | string | undefined) =>
  value === undefined ? undefined : numberAttribute(value);

/**
 * A short, non-interactive sentence about the element under the pointer or
 * under focus.
 *
 * It is written on an `ng-container`, because it renders nothing: the trigger
 * stays where the consumer wrote it and the layer is portalled to the end of
 * the document, so no one element could hold both. What it holds is the state,
 * the delays, and the values every part reads.
 *
 * The layer never takes focus and never holds a control. The APG's tooltip
 * pattern says so, and names the non-modal dialog for the other case, which is
 * `slPopover`.
 */
@Directive({
  selector: '[slTooltip]',
  standalone: true,
  exportAs: 'slTooltip',
})
export class SlTooltip implements OnInit {
  /** Whether the hint is showing. Two-way, so a template may bind it directly. */
  readonly open = model<boolean>(false);
  /** The state an uncontrolled tooltip starts in, read once in `ngOnInit`. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The tooltip never opens. The trigger's own `disabled` is the consumer's. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Opens only while the trigger's own content is cut by its box — a column
   * header narrowed to `Op…`, a breadcrumb in a rail. The measurement is taken
   * at the moment the hint would open, so a column dragged wider stops opening
   * one without anything being told.
   */
  readonly whenClipped = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  readonly variant = input<TooltipVariant | undefined>(undefined);
  readonly size = input<TooltipSize | undefined>(undefined);
  readonly describes = input<TooltipDescribes | undefined>(undefined);
  readonly openOn = input<TooltipOpenOn | undefined>(undefined);
  readonly side = input<TooltipSide | undefined>(undefined);
  readonly align = input<TooltipAlign | undefined>(undefined);
  readonly mount = input<TooltipMount | undefined>(undefined);
  readonly strategy = input<TooltipStrategy | undefined>(undefined);

  readonly arrow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly hoverable = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly closeOnPress = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly flip = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly shift = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly hideWhenDetached = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly portal = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  readonly openDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly closeDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly touchDelay = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly sideOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly alignOffset = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly collisionPadding = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly arrowPadding = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });

  /** One output for one transition, carrying the reason and the event. */
  readonly openChangeRequest = output<TooltipChangeRequest>();

  private readonly defaults = injectTooltipDefaults();
  private readonly group = inject(SlTooltipGroup);
  private readonly destroyRef = inject(DestroyRef);

  readonly contentId = `${inject(SlTooltipIdFactory).next()}-content`;

  /** The elements the parts register, which the layer measures and listens to. */
  readonly triggerNode = signal<HTMLElement | null>(null);
  readonly arrowNode = signal<HTMLElement | null>(null);

  readonly isOpen = computed(() => this.open() && !this.disabled());

  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedDescribes = computed(() => this.describes() ?? this.defaults.describes);
  readonly resolvedWhenClipped = computed(() => this.whenClipped() ?? this.defaults.whenClipped);
  readonly resolvedOpenOn = computed(() => this.openOn() ?? this.defaults.openOn);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedStrategy = computed(() => this.strategy() ?? this.defaults.strategy);
  readonly resolvedArrow = computed(() => (this.arrow() ?? this.defaults.arrow) === true);
  readonly resolvedHoverable = computed(
    () => (this.hoverable() ?? this.defaults.hoverable) === true,
  );
  readonly resolvedCloseOnPress = computed(
    () => (this.closeOnPress() ?? this.defaults.closeOnPress) === true,
  );
  readonly resolvedFlip = computed(() => (this.flip() ?? this.defaults.flip) === true);
  readonly resolvedShift = computed(() => (this.shift() ?? this.defaults.shift) === true);
  readonly resolvedHideWhenDetached = computed(
    () => (this.hideWhenDetached() ?? this.defaults.hideWhenDetached) === true,
  );
  readonly resolvedPortal = computed(() => (this.portal() ?? this.defaults.portal) === true);
  readonly resolvedSideOffset = computed(() => this.sideOffset() ?? this.defaults.sideOffset);
  readonly resolvedAlignOffset = computed(() => this.alignOffset() ?? this.defaults.alignOffset);
  readonly resolvedCollisionPadding = computed(
    () => this.collisionPadding() ?? this.defaults.collisionPadding,
  );
  readonly resolvedArrowPadding = computed(() => this.arrowPadding() ?? this.defaults.arrowPadding);

  /**
   * Under `label` the layer is the trigger's accessible name, so it has to be
   * in the document before it is ever opened. Forcing the axis is deliberate:
   * the alternative is a button silently announced as "button".
   */
  readonly resolvedMount = computed<TooltipMount>(() =>
    this.resolvedDescribes() === 'label' ? 'eager' : (this.mount() ?? this.defaults.mount),
  );

  private readonly everOpened = signal(false);
  readonly seen = computed(() => this.everOpened() || this.isOpen());

  /**
   * One timer for the whole family. An open waiting on `openDelay`, a close
   * waiting on `closeDelay` and a long press waiting on `touchDelay` are never
   * pending at once — each cancels the others.
   */
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelPending());
    /** Disabling cancels a waiting open and drops an open one, so enabling opens nothing. */
    effect(() => {
      if (!this.disabled()) return;
      untracked(() => {
        this.cancelPending();
        if (this.open()) this.open.set(false);
      });
    });
  }

  /**
   * Read here rather than in the constructor, because inputs are not set yet
   * there, and once: a later change to it is not new state.
   */
  ngOnInit() {
    if (this.defaultOpen() && !this.open()) this.open.set(true);
  }

  cancelPending() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Opens after `openDelay`, or in the same task inside the group window. */
  openAfterDelay(source?: Event) {
    this.cancelPending();
    const delay = this.openDelay() ?? this.defaults.openDelay;
    const sinceLast = Date.now() - this.group.lastClosedAt;
    if (delay <= 0 || sinceLast < this.defaults.groupDelay) {
      this.toggle(true, 'pointer', source);
      return;
    }
    this.timer = setTimeout(() => this.toggle(true, 'pointer', source), delay);
  }

  /** Closes after `closeDelay`, which is the window the pointer has to reach the layer. */
  closeAfterDelay(source?: Event) {
    this.cancelPending();
    const delay = this.closeDelay() ?? this.defaults.closeDelay;
    if (delay <= 0) {
      this.toggle(false, 'pointer', source);
      return;
    }
    this.timer = setTimeout(() => this.toggle(false, 'pointer', source), delay);
  }

  /** A coarse pointer has no hover, so a press held still opens the hint. */
  pressAndHold(source?: Event) {
    this.cancelPending();
    const delay = this.touchDelay() ?? this.defaults.touchDelay;
    this.timer = setTimeout(() => this.toggle(true, 'pointer', source), delay);
  }

  /** Opens now, ignoring every delay. One of the two imperative actions. */
  show() {
    this.toggle(true, 'programmatic');
  }

  /** Closes now. */
  hide() {
    this.toggle(false, 'programmatic');
  }

  toggle(next: boolean, reason: TooltipOpenReason, source?: Event) {
    this.cancelPending();
    if (next === this.isOpen()) return;
    /**
     * Refused rather than recorded: an open granted while disabled is hidden by
     * `isOpen`, and the leave that follows finds nothing to close, so it would
     * surface the moment `disabled` turned false.
     */
    if (next && this.disabled()) return;
    /**
     * Measured here rather than watched: the answer is needed at the moment the
     * hint would open, and a box measured then is never a box two column drags
     * old.
     */
    const trigger = this.triggerNode();
    if (next && this.resolvedWhenClipped() && trigger !== null && !isClipped(trigger)) return;

    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.isOpen(),
      onRequest: (request) => {
        this.openChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled) return;

    if (next) this.everOpened.set(true);
    /**
     * The window the next tooltip opens instantly inside starts when this one
     * closes, so a reader crossing a toolbar pays one warmup.
     */
    if (!next) this.group.lastClosedAt = Date.now();
    if (moved) this.open.set(next);
  }
}
