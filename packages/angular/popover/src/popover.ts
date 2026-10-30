import { type PartialMessages, popoverMessages, type PopoverMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  input,
  model,
  numberAttribute,
  type OnInit,
  output,
  signal,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';

import { injectPopoverDefaults, SlPopoverIdFactory } from './popover-defaults';
import type {
  PopoverAlign,
  PopoverChangeRequest,
  PopoverFocusTarget,
  PopoverMount,
  PopoverOpenReason,
  PopoverSide,
  PopoverSize,
  PopoverStrategy,
  PopoverWidth,
} from './popover-defaults';

export type {
  PopoverAlign,
  PopoverChangeRequest,
  PopoverDefaults,
  PopoverFocusTarget,
  PopoverMount,
  PopoverOpenReason,
  PopoverSide,
  PopoverSize,
  PopoverStrategy,
  PopoverWidth,
} from './popover-defaults';

const optionalBoolean = (state: boolean | string | undefined) =>
  state === undefined ? undefined : booleanAttribute(state);

const optionalNumber = (value: number | string | undefined) =>
  value === undefined ? undefined : numberAttribute(value);

/**
 * Interactive, non-modal content anchored to the control that opened it.
 *
 * It is the APG's non-modal dialog — the pattern the tooltip page names for a
 * surface that holds focusable elements — and it is deliberately **not** modal.
 * Nothing behind it becomes `inert`, the page keeps scrolling, `aria-modal` is
 * never written and focus is not contained. The modal surface is `slDialog`.
 *
 * Written on an `ng-container`, because it renders nothing: the trigger stays
 * where the consumer wrote it and the layer is portalled.
 */
@Directive({
  selector: '[slPopover]',
  standalone: true,
  exportAs: 'slPopover',
})
export class SlPopover implements OnInit {
  /** Whether the panel is showing. Two-way, so a template may bind it directly. */
  readonly open = model<boolean>(false);
  /** The state an uncontrolled popover starts in, read once in `ngOnInit`. */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** The popover never opens. The trigger's own `disabled` is the consumer's. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly size = input<PopoverSize | undefined>(undefined);
  readonly width = input<PopoverWidth | undefined>(undefined);
  readonly side = input<PopoverSide | undefined>(undefined);
  readonly align = input<PopoverAlign | undefined>(undefined);
  readonly mount = input<PopoverMount | undefined>(undefined);
  readonly strategy = input<PopoverStrategy | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * close control's accessible name (`close`).
   */
  readonly messages = input<PartialMessages<PopoverMessages> | undefined>(undefined);

  /** What takes focus on open instead of the panel — a search field, usually. */
  readonly initialFocus = input<PopoverFocusTarget | undefined>(undefined);
  /** Where focus lands after it closes, for a trigger that is gone by then. */
  readonly finalFocus = input<PopoverFocusTarget | undefined>(undefined);

  readonly arrow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly autoFocus = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly closeOnEscape = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });
  readonly closeOnOutsidePress = input<boolean | undefined, boolean | string | undefined>(
    undefined,
    { transform: optionalBoolean },
  );
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
  readonly openChangeRequest = output<PopoverChangeRequest>();

  private readonly defaults = injectPopoverDefaults();
  /** The family's words in the language in force, with this popover's `messages` laid over them. */
  readonly t = injectMessages(popoverMessages, this.messages);
  private readonly base = inject(SlPopoverIdFactory).next();

  readonly contentId = `${this.base}-panel`;
  readonly titleId = `${this.base}-title`;
  readonly descriptionId = `${this.base}-description`;

  /** The elements the parts register, which the layer measures and focuses. */
  readonly triggerNode = signal<HTMLElement | null>(null);
  readonly anchorNode = signal<HTMLElement | null>(null);
  readonly arrowNode = signal<HTMLElement | null>(null);
  readonly contentNode = signal<HTMLElement | null>(null);
  readonly hasTitle = signal(false);
  readonly hasDescription = signal(false);

  readonly isOpen = computed(() => this.open() && !this.disabled());

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedWidth = computed(() => this.width() ?? this.defaults.width);
  readonly resolvedSide = computed(() => this.side() ?? this.defaults.side);
  readonly resolvedAlign = computed(() => this.align() ?? this.defaults.align);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedStrategy = computed(() => this.strategy() ?? this.defaults.strategy);
  readonly resolvedArrow = computed(() => (this.arrow() ?? this.defaults.arrow) === true);
  readonly resolvedAutoFocus = computed(
    () => (this.autoFocus() ?? this.defaults.autoFocus) === true,
  );
  /**
   * The role the panel carries when the consumer wrote none. A family that
   * provides itself as this one — `slHoverCard` — decides it here: a card
   * nothing can enter is `presentation`, not a dialog nobody is told about.
   */
  readonly contentRole = computed<string>(() => 'dialog');
  readonly resolvedCloseOnEscape = computed(
    () => (this.closeOnEscape() ?? this.defaults.closeOnEscape) === true,
  );
  readonly resolvedCloseOnOutsidePress = computed(
    () => (this.closeOnOutsidePress() ?? this.defaults.closeOnOutsidePress) === true,
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

  private readonly everOpened = signal(false);
  readonly seen = computed(() => this.everOpened() || this.isOpen());

  /**
   * Read here rather than in the constructor, because inputs are not set yet
   * there, and once: a later change to it is not new state.
   */
  ngOnInit() {
    if (this.defaultOpen() && !this.open()) {
      this.everOpened.set(true);
      this.open.set(true);
    }
  }

  /** Opens now. One of the two imperative actions a template cannot express. */
  show() {
    this.toggle(true, 'programmatic');
  }

  /** Closes now. */
  hide() {
    this.toggle(false, 'programmatic');
  }

  toggle(next: boolean, reason: PopoverOpenReason, source?: Event) {
    if (next === this.isOpen()) return;

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
    if (moved) this.open.set(next);
  }
}
