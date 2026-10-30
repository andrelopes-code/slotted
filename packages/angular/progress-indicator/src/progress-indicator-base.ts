import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import { progressGeometry, progressValueText } from '@slotted/core/progress';
import type { ProgressGeometry } from '@slotted/core/progress';
import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  HostAttributeToken,
  inject,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  untracked,
} from '@angular/core';

import { injectProgressIndicatorDefaults } from './progress-indicator-defaults';
import {
  PROGRESS_DEFAULT_SIZE,
  PROGRESS_DEFAULT_TONE,
  type ProgressShape,
  type ProgressSize,
  type ProgressTone,
} from './progress-indicator.constants';

let nextId = 0;

/**
 * Everything a bar, a ring and a loader answer the same way: the defaults, the
 * timing, the geometry, the text and the identity in the DOM.
 *
 * It is a base class rather than three copies because the two answers easiest
 * to get subtly wrong are the two no test can see from outside — which
 * `aria-value*` attributes are absent while a wait is indeterminate, and
 * whether the painted percentage came from the same call as the announced one.
 * The host bindings stay with each component, because `host` metadata belongs
 * to a decorator and a shape writes different attributes; the arithmetic
 * behind them is here.
 *
 * `@Directive()` with no selector is what makes the inputs and the output
 * inheritable: `input()` and `output()` are compiled rather than called, and
 * the compiler refuses them in a class it has not been told is a directive.
 */
@Directive()
export abstract class SlProgressIndicatorBase {
  /** The geometry the component draws. Written by the component, never chosen. */
  protected abstract readonly shape: ProgressShape;

  readonly loading = input(true, { transform: booleanAttribute });
  readonly delay = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly minDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  readonly label = input<string | undefined>(undefined);
  readonly hideLabel = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBoolean,
  });
  readonly decorative = input(false, { transform: booleanAttribute });
  readonly size = input<ProgressSize | undefined>(undefined);
  readonly tone = input<ProgressTone | undefined>(undefined);

  /**
   * The moment the indicator actually leaves the page, which is later than
   * `loading` turning false whenever `minDuration` is holding it. An
   * application unmounting on the input alone would take the indicator down
   * mid-hold.
   */
  readonly withdraw = output<void>();

  protected readonly defaults = injectProgressIndicatorDefaults();

  /**
   * A name the consumer wrote on their own element is read once and kept, so
   * the family never writes over it — the escape hatch `skeleton` established
   * with the same token.
   */
  protected readonly ownAriaLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });
  protected readonly ownAriaLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  protected readonly ownAriaHidden = inject(new HostAttributeToken('aria-hidden'), {
    optional: true,
  });

  /**
   * A stable id, and not `crypto.randomUUID()`: a server render and the
   * hydration that follows it have to produce the same string, and a counter
   * per document does while a random value does not.
   */
  protected readonly labelId = `slotted-progress-${(nextId += 1)}`;

  /** Whether anything is painted at all: `delay` may still be running. */
  readonly painted = signal(false);
  /**
   * How many times the indicator has been painted after being withdrawn. The
   * template draws the indicator once per value, so an indeterminate sweep
   * starts at its leading edge each time it comes back rather than where the
   * last one stood.
   */
  readonly paint = signal(0);

  readonly sizeValue = computed(() => this.size() ?? this.defaults.size ?? PROGRESS_DEFAULT_SIZE);
  readonly toneValue = computed(() => this.tone() ?? this.defaults.tone ?? PROGRESS_DEFAULT_TONE);
  readonly labelText = computed(() => this.label() ?? this.defaults.label);
  readonly labelHidden = computed(() => this.hideLabel() ?? this.hidesLabelByPlacement());

  /** What the two measured components state, and the loader does not. */
  protected measure(): {
    value: number | null | undefined;
    min: number | undefined;
    max: number | undefined;
    buffer: number | null | undefined;
    format: Intl.NumberFormatOptions | undefined;
    showValue: boolean | undefined;
    valueText: string | undefined;
    locale: string | undefined;
  } | null {
    return null;
  }

  /** Overridden by the bar, whose page placement has nowhere to put a name. */
  protected hidesLabelByPlacement(): boolean {
    return false;
  }

  readonly geometry = computed<ProgressGeometry>(() => {
    const measured = this.measure();
    return progressGeometry({
      value: measured?.value,
      min: measured?.min,
      max: measured?.max,
      buffer: measured?.buffer,
    });
  });

  readonly valueTextValue = computed(() => {
    const measured = this.measure();
    if (measured === null) return undefined;
    return progressValueText({
      geometry: this.geometry(),
      valueText: measured.valueText,
      format: measured.format,
      locale: measured.locale ?? this.defaults.locale,
    });
  });

  readonly showValueValue = computed(
    () =>
      this.measure()?.showValue === true &&
      !this.geometry().indeterminate &&
      this.valueTextValue() !== undefined,
  );

  protected readonly named = computed(() => this.labelText() !== undefined && !this.decorative());

  /* ── What reaches the host ─────────────────────────────────────────────── */

  protected readonly roleAttribute = computed(() => (this.decorative() ? null : 'progressbar'));
  protected readonly labelledByAttribute = computed(() =>
    this.named() ? (this.ownAriaLabelledBy ?? this.labelId) : this.ownAriaLabelledBy,
  );
  /**
   * `decorative` is one switch and not two: it takes the role away as well as
   * hiding the box, because an indicator a reader can reach and that announces
   * nothing is worse than either half. A consumer's own `aria-hidden` is kept
   * rather than overwritten.
   */
  protected readonly hiddenFromTree = computed(() =>
    this.decorative() ? (this.ownAriaHidden ?? 'true') : this.ownAriaHidden,
  );
  /**
   * The range is written out even where it equals the ARIA default, so a reader
   * is never told a number that depends on one. `aria-valuenow` is the one
   * attribute that is absent rather than defaulted: ARIA 1.3 asks an author to
   * omit it while the value is indeterminate, and the omission is what says
   * "in progress, and nobody knows how far".
   */
  protected readonly valueMinAttribute = computed(() =>
    this.decorative() || this.measure() === null ? null : this.geometry().min,
  );
  protected readonly valueMaxAttribute = computed(() =>
    this.decorative() || this.measure() === null ? null : this.geometry().max,
  );
  protected readonly valueNowAttribute = computed(() =>
    this.decorative() || this.geometry().indeterminate ? null : this.geometry().valueNow,
  );
  protected readonly valueTextAttribute = computed(() =>
    this.decorative() ? null : (this.valueTextValue() ?? null),
  );
  protected readonly indeterminateAttribute = computed(() =>
    this.measure() === null || this.geometry().indeterminate ? '' : null,
  );
  protected readonly completeAttribute = computed(() => (this.geometry().complete ? '' : null));
  protected readonly percentStyle = computed(() => `${this.geometry().percent}`);
  protected readonly bufferStyle = computed(() => {
    const buffer = this.geometry().buffer;
    return buffer === null ? null : `${buffer}`;
  });
  protected readonly bufferedAttribute = computed(() =>
    this.geometry().buffer === null ? null : '',
  );

  private machine: LoadingVisibilityState = initialLoadingVisibility;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));

    effect(() => {
      const request = {
        loading: this.loading(),
        delay: this.delay() ?? this.defaults.delay ?? 0,
        minDuration: this.minDuration() ?? this.defaults.minDuration ?? 0,
      };
      untracked(() => this.settle(request));
    });

    /**
     * A missing name is reported and rendered anyway. `icon-button` throws
     * because an unnamed icon button is unusable; a nameless progress bar still
     * reports visually, and taking a screen down mid-upload is worse than the
     * defect it would be reporting. The family this one replaces recorded the
     * same decision.
     */
    effect(() => {
      const nameless =
        !this.decorative() &&
        this.labelText() === undefined &&
        this.ownAriaLabel === null &&
        this.ownAriaLabelledBy === null;
      if (isDevMode() && nameless) {
        console.warn(
          `${this.constructor.name} has no accessible name: pass label, or aria-label, or decorative when the text beside it already says what is happening.`,
        );
      }
    });
  }

  /**
   * One step of the shared machine, plus at most one timer. The rule lives in
   * `@slotted/core/loading` rather than here so React and Angular cannot
   * disagree about when an indicator appears — a difference no test that looked
   * at either binding alone would report.
   */
  private settle(request: { loading: boolean; delay: number; minDuration: number }) {
    clearTimeout(this.timer);
    const answer = nextLoadingVisibility({ ...request, now: Date.now(), state: this.machine });
    this.machine = answer.state;

    const was = this.painted();
    this.painted.set(answer.state.visible);
    if (was && !answer.state.visible) this.withdraw.emit();
    if (!was && answer.state.visible) this.paint.update((count) => count + 1);

    if (answer.wait === null) return;
    this.timer = setTimeout(() => this.settle(request), answer.wait);
  }
}

/**
 * Absence has to survive the transform. `numberAttribute` maps an unset input
 * to `NaN`, and `NaN` is a value: it would stop the application's own timing
 * decision from ever reaching an indicator that says nothing.
 */
export function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : numberAttribute(value);
}

/**
 * The same for a boolean. `booleanAttribute` maps an unset input to `false`,
 * and `false` is a value: it would stop a page-level bar from deciding that
 * its own name has nowhere visible to go.
 */
export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

/**
 * A value the consumer may state as `null` to mean "no number yet", which
 * `numberAttribute` would read as nought — the claim this family refuses to
 * make. An empty string arrives from a template binding that has not resolved.
 */
export function measurableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return numberAttribute(value);
}
