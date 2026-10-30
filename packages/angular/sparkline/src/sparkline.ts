import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import {
  type PartialMessages,
  sparklineMessages,
  type SparklineMessages,
} from '@slotted/core/i18n';
import {
  describeSparkline,
  layoutSparkline,
  observeSparklineBox,
  SPARKLINE_STEPS,
  sparklineInset,
} from '@slotted/core/sparkline';
import type { SparklineBox, SparklineDatum } from '@slotted/core/sparkline';

import { injectSparklineDefaults } from './sparkline-defaults';
import {
  SPARKLINE_BAR_GAP,
  SPARKLINE_BAR_RADIUS,
  type SparklineCurve,
  type SparklineSeries,
  type SparklineSize,
  type SparklineTone,
  type SparklineType,
} from './sparkline.constants';

/**
 * A series of numbers drawn in a box: a line through them or a bar per
 * period, a disc on the last point, a dashed line at a reference. The
 * geometry is `@slotted/core/sparkline`'s and the paint is the stylesheet's;
 * what this binding decides is when to measure and what to say.
 *
 * The box is measured after the first render, so the first browser paint is
 * on the real grid; on the server the drawing is laid out on the nominal
 * grid of its size step and stretched to the box, where
 * `vector-effect: non-scaling-stroke` keeps every stroke and both discs at
 * their screen size. The host is `role="img"` with the generated description
 * as its name — an `aria-label` the consumer wrote on the element wins — and
 * the `svg` is hidden: a drawing with no interaction is an image.
 */
@Component({
  selector: '[slSparkline]',
  standalone: true,
  template: `<svg
    data-part="plot"
    data-part-plot=""
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="none"
    [attr.viewBox]="viewBox()"
  >
    @if (layout().area) {
      <path data-part="area" data-part-area="" [attr.d]="layout().area" />
    }
    @if (layout().line) {
      <path data-part="line" data-part-line="" [attr.d]="layout().line" />
    }
    @for (bar of layout().bars; track bar.index; let last = $last) {
      <path
        data-part="bar"
        data-part-bar=""
        [attr.data-current]="last ? '' : null"
        [attr.d]="bar.path"
      />
    }
    @if (layout().reference !== null) {
      <line
        data-part="reference"
        data-part-reference=""
        x1="0"
        [attr.x2]="width()"
        [attr.y1]="layout().reference"
        [attr.y2]="layout().reference"
      />
    }
    @if (markerPath()) {
      <path data-part="ring" data-part-ring="" [attr.d]="markerPath()" />
      <path data-part="marker" data-part-marker="" [attr.d]="markerPath()" />
    }
  </svg>`,
  styleUrl: '../../../styles/src/sparkline/sparkline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSparkline',
  host: {
    'data-ui': 'sparkline',
    'data-ui-sparkline': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[attr.data-type]': 'type()',
    '[attr.data-size]': 'size()',
    '[attr.data-curve]': 'resolvedCurve()',
    '[attr.data-tone]': 'tone() ?? null',
    '[attr.data-series]': 'series() ?? null',
    '[attr.data-animate]': "animate() ? '' : null",
  },
})
export class SlSparkline {
  /** The series, oldest first. `null` is a gap: the line breaks, the bar is not drawn. */
  readonly data = input<readonly SparklineDatum[]>([]);
  readonly type = input<SparklineType>('line');
  readonly size = input<SparklineSize>('md');
  /** Straight segments, or a monotone curve that never overshoots a point. */
  readonly curve = input<SparklineCurve | undefined>(undefined);
  /** The wash under a line. */
  readonly area = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** A disc on the last real point. */
  readonly marker = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** A dashed line at this value, which widens the extent to hold it. */
  readonly reference = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** The extent, when the data's own is not the one to draw. The data widens it, never narrows it. */
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** How the series is doing. Wins over `series`. */
  readonly tone = input<SparklineTone | undefined>(undefined);
  /** Which series this is, as a slot of the data scale. */
  readonly series = input<SparklineSeries | undefined>(undefined);
  /** What the series is, said first in the description. */
  readonly label = input<string | undefined>(undefined);
  /** The whole accessible name, replacing the generated description. */
  readonly description = input<string | undefined>(undefined);
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  /** The locale numbers are written in; the language in force when absent. */
  readonly locale = input<string | undefined>(undefined);
  /** Words laid over the catalog of the language in force, key by key: the description's sentences. */
  readonly messages = input<PartialMessages<SparklineMessages> | undefined>(undefined);

  private readonly defaults = injectSparklineDefaults();
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  /** An `aria-label` the consumer wrote on their own element, which wins. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly box = signal<SparklineBox | null>(null);

  readonly resolvedCurve = computed(() => this.curve() ?? this.defaults.curve ?? 'linear');
  readonly resolvedArea = computed(() => this.area() ?? this.defaults.area ?? false);
  readonly resolvedMarker = computed(() => this.marker() ?? this.defaults.marker ?? true);
  /** The family's words in the language in force, with this sparkline's `messages` laid over them. */
  readonly t = injectMessages(sparklineMessages, this.messages);
  private readonly appLocale = injectLocale();

  readonly width = computed(() => this.box()?.width || SPARKLINE_STEPS[this.size()].width);
  readonly height = computed(() => this.box()?.height || SPARKLINE_STEPS[this.size()].height);
  readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);
  /**
   * Only a change of `data` animates the marks. A box that settles after the
   * first render — a table cell sizing its column — redraws at once: a path
   * that eased to the new width read as the series growing.
   */
  readonly animate = linkedSignal<
    { data: readonly SparklineDatum[]; width: number; height: number },
    boolean
  >({
    source: () => ({ data: this.data(), width: this.width(), height: this.height() }),
    computation: (now, previous) =>
      previous !== undefined &&
      previous.source.data !== now.data &&
      previous.source.width === now.width &&
      previous.source.height === now.height,
  });

  readonly layout = computed(() =>
    layoutSparkline({
      data: this.data(),
      width: this.width(),
      height: this.height(),
      inset: sparklineInset(this.size(), this.type(), this.resolvedMarker()),
      type: this.type(),
      curve: this.resolvedCurve(),
      area: this.resolvedArea(),
      min: this.min(),
      max: this.max(),
      reference: this.reference(),
      gap: SPARKLINE_BAR_GAP,
      radius: SPARKLINE_BAR_RADIUS,
    }),
  );

  readonly markerPath = computed(() => {
    const marker = this.layout().marker;
    if (!this.resolvedMarker() || this.type() !== 'line' || marker === null) return null;
    return `M${marker.x} ${marker.y}h0.001`;
  });

  readonly name = computed(() => {
    if (this.ownLabel) return this.ownLabel;
    const description = this.description();
    if (description !== undefined) return description;
    const own = this.valueFormatter();
    const formatter = new Intl.NumberFormat(
      this.locale() ?? this.appLocale(),
      this.formatOptions() ?? this.defaults.formatOptions,
    );
    return describeSparkline(this.data(), {
      t: this.t,
      format: own ?? ((value) => formatter.format(value)),
      label: this.label(),
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const handle = observeSparklineBox(this.host, (box) => this.box.set(box));
      destroyRef.onDestroy(() => handle.destroy());
    });
  }
}

/** Absence has to survive the transform: an unset input defers to the defaults. */
export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return numberAttribute(value);
}
