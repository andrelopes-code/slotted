import {
  anchorsAtStart,
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  extentAtPoint,
  extentBounds,
  extentFromLength,
  holdResizeGesture,
  measureLength,
  nearestSnap,
  stepAmountFromPixels,
  stepExtent,
} from '@slotted/core/extent';
import { createControllable } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { injectSplitterDefaults, SlSplitterIdFactory } from './splitter-defaults';
import type {
  SplitterCollapsedRequest,
  SplitterLimit,
  SplitterOrientation,
  SplitterValueReason,
  SplitterValueRequest,
} from './splitter-defaults';

const NO_SNAP_POINTS: readonly number[] = [];

/**
 * A focusable separator between two regions the consumer owns.
 *
 * It holds the position, the limits, the stops, the keyboard and the whole ARIA
 * contract of the WAI-ARIA Window Splitter pattern. It holds no layout: the
 * fraction is written as `--slotted-splitter-value` on the element `for` names,
 * and a rule in the consumer's own stylesheet turns it into a measure. A
 * separator that sized the boxes beside it would be deciding a layout it was
 * only handed a position in.
 *
 * A directive on the consumer's own element rather than a component with a tag
 * of its own, because the bar sits inside a layout the consumer wrote and the
 * element it should be is theirs to choose.
 */
@Component({
  selector: '[slSplitter]',
  standalone: true,
  exportAs: 'slSplitter',
  template: `
    <span data-part="line" data-part-line="" aria-hidden="true"></span>
    <span data-part="grip" data-part-grip="" aria-hidden="true"></span>
    <span data-part="line" data-part-line="" aria-hidden="true"></span>
  `,
  styleUrl: '../../../styles/src/splitter/splitter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'splitter',
    'data-ui-splitter': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-dragging]': "dragging() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-expanded]': "collapsible() && !collapsed() ? '' : null",
    '[attr.aria-orientation]': 'ariaOrientation()',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '[attr.aria-valuemin]': 'ariaValueMin()',
    '[attr.aria-valuemax]': 'ariaValueMax()',
    '[attr.aria-controls]': 'ariaControls()',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '(dblclick)': 'onDoubleClick($event)',
  },
})
export class SlSplitter {
  /** The fraction of the container taken by the region before the bar. */
  readonly value = model<number>(0.5);
  /** Whether the region before the bar is collapsed. */
  readonly collapsed = model<boolean>(false);
  /**
   * Where a double click and `reset()` return the bar, inside the limits. Not
   * the value the bar was opened at: a layout restored from storage is where
   * the reader left it, never where a reset should go.
   */
  readonly defaultValue = input<number>(0.5);

  readonly orientation = input<SplitterOrientation | undefined>(undefined);
  readonly min = input<SplitterLimit | undefined>(undefined);
  readonly max = input<SplitterLimit | undefined>(undefined);
  readonly collapsedValue = input<number | undefined>(undefined);
  readonly collapsible = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly snapPoints = input<readonly number[]>(NO_SNAP_POINTS);

  /**
   * The element the bar sizes. A template reference rather than a ref:
   * `[for]="aside"` with `#aside` on the element.
   *
   * Omitted, the bar takes its own previous element sibling, which is what the
   * DOM already says and what the React binding does too.
   */
  readonly for = input<HTMLElement | undefined>(undefined);

  /** The cancellable requests, before anything commits. */
  readonly valueChangeRequest = output<SplitterValueRequest>();
  readonly collapsedChangeRequest = output<SplitterCollapsedRequest>();

  /**
   * Fires once, when a drag settles. `value` moves throughout one, so a
   * consumer saving a layout saves once here rather than sixty times there.
   */
  readonly resizeEnd = output<number>();

  private readonly defaults = injectSplitterDefaults();
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly ids = inject(SlSplitterIdFactory);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * What the consumer wrote on the element themselves. Read once, before the
   * host bindings run, because a binding that resolves to `null` removes the
   * attribute rather than leaving the consumer's value in place — the rule
   * `menu` records and `toolbar` learned the hard way.
   */
  private readonly ownRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly ownTabIndex = inject(new HostAttributeToken('tabindex'), { optional: true });
  private readonly ownControls = inject(new HostAttributeToken('aria-controls'), {
    optional: true,
  });

  protected readonly dragging = signal(false);
  private readonly regionId = signal<string | undefined>(undefined);
  /** The fraction to come back to after a collapse; the value at the moment of the collapse. */
  private restore = 0.5;
  private release: (() => void) | null = null;

  protected readonly resolvedOrientation = computed(
    () => this.orientation() ?? this.defaults.orientation,
  );
  protected readonly role = computed(() => this.ownRole ?? 'separator');
  protected readonly tabIndex = computed(() => this.ownTabIndex ?? '0');
  protected readonly ariaOrientation = computed(() =>
    this.resolvedOrientation() === 'vertical' ? 'vertical' : null,
  );
  protected readonly ariaControls = computed(() => this.ownControls ?? this.regionId() ?? null);
  protected readonly ariaValueNow = computed(() => Math.round(this.value() * 100));
  protected readonly ariaValueMin = computed(() => Math.round(this.bounds().min * 100));
  protected readonly ariaValueMax = computed(() => Math.round(this.bounds().max * 100));

  /**
   * A signal the geometry can invalidate. The limits depend on the container's
   * measure, which no signal can see change, so the observer below bumps this
   * and every computed that reads it recomputes.
   */
  private readonly measured = signal(0);

  constructor() {
    /**
     * Guarded, because `ResizeObserver` is absent from a server render and from
     * jsdom. Unguarded, every page carrying a splitter threw before it rendered a
     * character — which is what the first run of `splitter.spec.ts` reported,
     * eighteen failures deep, all from this one line.
     *
     * The container is read after the first render, not here: a bar that is the
     * first node of an `@if` or `@for` block is built before the block is placed
     * in the document, so its parent is still null in the constructor, and its
     * limits kept the measure of whatever box they were first computed against.
     * A render the server does never runs this, and has no pointer to move the
     * bar with.
     */
    let observer: ResizeObserver | null = null;
    afterNextRender(() => {
      const container = this.container();
      if (typeof ResizeObserver === 'undefined' || container === null) return;
      observer = new ResizeObserver(() => this.measured.update((count) => count + 1));
      observer.observe(container);
    });

    this.destroyRef.onDestroy(() => {
      observer?.disconnect();
      this.release?.();
    });

    /**
     * The fraction, published where CSS can read it. This is what replaces the
     * layout the family does not hold: a consumer writes
     * `inline-size: calc(var(--slotted-splitter-value) * 100%)` once and never
     * holds the number in a component at all.
     */
    effect(() => {
      const target = this.sized();
      if (target === null) return;

      target.style.setProperty('--slotted-splitter-value', String(this.value()));
      if (target.id === '') target.id = this.ids.next();
      this.regionId.set(target.id);
    });

    /**
     * The contract's `extent.clamped`: the reported value is always the
     * clamped one. Limits move under a value — a length limit when the
     * container is resized, a fraction when the consumer binds another — and a
     * value restored from another window's layout can lie outside them, so the
     * bar brings it back inside, as a programmatic request. A collapsed region
     * stands below its floor on purpose and is left there.
     */
    effect(() => {
      const { min, max } = this.bounds();
      const value = this.value();
      if (this.collapsed() || this.dragging()) return;
      const held = Math.min(Math.max(value, min), max);
      if (held !== value) untracked(() => this.requestValue(held, 'programmatic', undefined));
    });
  }

  /** A fraction brought inside the limits as they resolve now. */
  private clamp(value: number) {
    const { min, max } = this.bounds();
    return Math.min(Math.max(value, min), max);
  }

  /** The box the fraction is a fraction *of*: whatever holds the bar. */
  private container(): HTMLElement | null {
    return this.element.parentElement;
  }

  /** The element the bar sizes, announces, and writes the fraction on. */
  private sized(): HTMLElement | null {
    const named = this.for();
    if (named !== undefined) return named;
    const previous = this.element.previousElementSibling;
    return previous instanceof HTMLElement ? previous : null;
  }

  private geometry() {
    const box = this.container();
    const rect = box?.getBoundingClientRect();
    const span =
      rect === undefined ? 0 : this.resolvedOrientation() === 'vertical' ? rect.width : rect.height;
    const rtl = box !== null && getComputedStyle(box).direction === 'rtl';
    return { box, rect, rtl, span };
  }

  /**
   * The bar's own axis, in the vocabulary `@slotted/core/extent` speaks. The
   * region the bar sizes is the one before it, so it is anchored at the
   * container's first edge on that axis.
   */
  private side() {
    return this.resolvedOrientation() === 'vertical' ? ('start' as const) : ('top' as const);
  }

  /**
   * A limit as a fraction. A number is already one; a string is a CSS length,
   * and only the browser knows what `18rem` or `25%` come to — so it is
   * measured where it will be used rather than parsed here.
   */
  private resolve(limit: SplitterLimit, box: HTMLElement | null, span: number, fallback: number) {
    if (typeof limit === 'number') return Math.min(Math.max(limit, 0), 1);
    if (box === null || span <= 0) return fallback;
    return extentFromLength({ pixels: measureLength(limit, box, span), span });
  }

  protected readonly bounds = computed(() => {
    this.measured();
    const { box, span } = this.geometry();
    const low = this.resolve(this.min() ?? this.defaults.min, box, span, 0);
    const high = this.resolve(this.max() ?? this.defaults.max, box, span, 1);
    /* A max below the min is the consumer's arithmetic, not a crash: the pair
       is ordered rather than trusted, so the range always exists. */
    return extentBounds(this.snapPoints(), Math.min(low, high), Math.max(low, high));
  });

  private requestValue(next: number, reason: SplitterValueReason, source: unknown) {
    if (next === this.value()) return;

    const state = createControllable<number>({
      initial: this.value(),
      onRequest: (raw) => {
        this.valueChangeRequest.emit({
          get cancelled() {
            return raw.cancelled;
          },
          cancel: () => raw.cancel(),
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
      },
    });

    /**
     * The return value, and not a flag read inside `onRequest`. A flag
     * assigned there is assigned *before* the consumer has been handed the
     * request and had the chance to refuse it, so it always reads `false` and
     * the refusal never lands — which is exactly what `splitter.spec.ts`
     * reported: a cancelled move that moved anyway.
     */
    if (!state.request(next, reason, source)) return;
    this.value.set(next);
  }

  private requestCollapsed(next: boolean, reason: SplitterValueReason, source: unknown) {
    if (next === this.collapsed()) return false;

    const state = createControllable<boolean>({
      initial: this.collapsed(),
      onRequest: (raw) => {
        this.collapsedChangeRequest.emit({
          get cancelled() {
            return raw.cancelled;
          },
          cancel: () => raw.cancel(),
          previous: raw.previous,
          reason,
          source: raw.source,
          value: raw.value,
        });
      },
    });

    if (!state.request(next, reason, source)) return false;
    this.collapsed.set(next);
    return true;
  }

  /**
   * `Enter`, from the pattern: "If the primary pane is not collapsed, collapses
   * the pane. If the pane is collapsed, restores the splitter to its previous
   * position."
   *
   * Both halves move together: a collapse that changed the state and not the
   * measure would leave the bar where it was, and a restore that changed the
   * measure and not the state would leave a region that is open and says it is
   * not.
   */
  private toggle(reason: SplitterValueReason, source: unknown) {
    if (!this.collapsible()) return;

    if (this.collapsed()) {
      if (this.requestCollapsed(false, reason, source))
        this.requestValue(this.restore, reason, source);
      return;
    }

    this.restore = this.value();
    if (this.requestCollapsed(true, reason, source)) {
      this.requestValue(this.collapsedValue() ?? this.defaults.collapsedValue, reason, source);
    }
  }

  /** Collapses to `collapsedValue`, carrying `programmatic`. */
  collapse() {
    if (!this.collapsible() || this.collapsed()) return;
    this.toggle('programmatic', undefined);
  }

  /** Restores the fraction held before the collapse. */
  expand() {
    if (!this.collapsed()) return;
    this.toggle('programmatic', undefined);
  }

  /** Returns the bar to `defaultValue`, inside the limits, which is what a double click does. */
  reset() {
    this.requestValue(this.clamp(this.defaultValue()), 'programmatic', undefined);
  }

  /** Moves focus to the bar. */
  focus() {
    this.element.focus();
  }

  protected onPointerDown(event: PointerEvent) {
    if (event.defaultPrevented || this.disabled() || event.button !== 0) return;

    const { rtl, span } = this.geometry();
    if (span <= 0) return;

    this.element.setPointerCapture(event.pointerId);
    this.dragging.set(true);
    this.release = holdResizeGesture(
      this.element.ownerDocument,
      this.resolvedOrientation() === 'vertical' ? 'col-resize' : 'row-resize',
    );

    const side = this.side();

    const at = (point: PointerEvent) => {
      const live = this.container()?.getBoundingClientRect();
      if (live === undefined) return undefined;
      return extentAtPoint({
        point: { x: point.clientX, y: point.clientY },
        rect: live,
        rtl,
        side,
      });
    };

    /*
     * Where on the bar the hand took it, as a fraction: the bar keeps that point
     * under the pointer for the whole drag. Read as an absolute position, a bar
     * taken a few pixels from the edge it marks leapt those pixels on the first
     * move — and a bar whose region is followed by a gap leapt the gap.
     */
    const grab = (at(event) ?? this.value()) - this.value();

    const move = (moved: PointerEvent) => {
      const raw = at(moved);
      if (raw === undefined) return;
      this.requestValue(this.clamp(raw - grab), 'pointer', moved);
    };

    const up = (ended: PointerEvent) => {
      this.element.removeEventListener('pointermove', move);
      this.element.removeEventListener('pointerup', up);
      this.element.removeEventListener('pointercancel', up);
      this.release?.();
      this.release = null;
      this.dragging.set(false);

      /* The stop nearest where the hand left it, and only then: a drag that
         snapped on every move would fight the hand rather than help it. */
      const stops = this.snapPoints();
      const raw = at(ended);
      if (stops.length > 0 && raw !== undefined) {
        const snapped = this.clamp(nearestSnap(raw - grab, stops));
        this.requestValue(snapped, 'pointer', ended);
        this.resizeEnd.emit(snapped);
        return;
      }

      this.resizeEnd.emit(this.value());
    };

    this.element.addEventListener('pointermove', move);
    this.element.addEventListener('pointerup', up);
    this.element.addEventListener('pointercancel', up);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.disabled()) return;

    if (event.key === 'Enter') {
      if (!this.collapsible()) return;
      event.preventDefault();
      this.toggle('keyboard', event);
      return;
    }

    const { rect, rtl } = this.geometry();
    if (rect === undefined) return;

    const side = this.side();
    const grows = anchorsAtStart(side, rtl) ? 1 : -1;
    const vertical = this.resolvedOrientation() === 'vertical';
    const limits = this.bounds();

    /* The cross axis is left to the page, so a document that scrolls still
       scrolls while the separator holds focus. */
    const direction =
      event.key === (vertical ? 'ArrowRight' : 'ArrowDown')
        ? (grows as 1 | -1)
        : event.key === (vertical ? 'ArrowLeft' : 'ArrowUp')
          ? (-grows as 1 | -1)
          : undefined;

    if (direction !== undefined) {
      event.preventDefault();
      this.requestValue(
        stepExtent({
          amount: stepAmountFromPixels({
            pixels: event.shiftKey ? EXTENT_LARGE_STEP_PX : EXTENT_STEP_PX,
            rect,
            side,
          }),
          direction,
          fraction: this.value(),
          max: limits.max,
          min: limits.min,
          snapPoints: this.snapPoints(),
        }),
        'keyboard',
        event,
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.requestValue(limits.min, 'keyboard', event);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.requestValue(limits.max, 'keyboard', event);
    }
  }

  protected onDoubleClick(event: MouseEvent) {
    if (event.defaultPrevented || this.disabled()) return;
    this.requestValue(this.clamp(this.defaultValue()), 'pointer', event);
  }
}
