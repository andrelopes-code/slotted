import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectLocale } from '@slotted/angular/i18n';
import { injectProgressIndicatorDefaults } from './progress-indicator-defaults';
import type { ProgressSize } from './progress-indicator.constants';

/** One part of a total, drawn as a segment of a `slSegmentedBar`. */
export interface SegmentedBarSegment {
  /** Names the segment for `current`. Defaults to its index. */
  readonly key?: string | undefined;
  /** The part's share of the total; the segment's width is proportional to it. */
  readonly value: number;
  /** A data palette slot, 1 to 8 (`--slotted-data-N`). Defaults to the segment's order. */
  readonly color?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | undefined;
  /** `hatch` draws a remainder (unassigned, other) in the muted ink. */
  readonly pattern?: 'hatch' | undefined;
  /** What the part is, for the accessible name: "Item A 88%". */
  readonly label: string;
}

/**
 * One total split into parts: one bar of segments whose widths are in the
 * ratio of their values, for a budget by category or a quota by file type,
 * with a table or a list beside it as the legend. The track is a picture of
 * the parts (`role="img"`), named by every part's label in order in the
 * language's list format; the scale under it stays text. `current` marks one
 * part and dims the others, which a row of the legend sets from its pointer.
 */
@Component({
  selector: '[slSegmentedBar]',
  standalone: true,
  exportAs: 'slSegmentedBar',
  template: `<div data-part="track" data-part-track="" role="img" [attr.aria-label]="name()">
      @for (segment of segments(); track keyOf($index); let index = $index) {
        <span
          data-part="segment"
          data-part-segment=""
          [attr.data-pattern]="segment.pattern ?? null"
          [attr.data-current]="isCurrent(index) ? '' : null"
          [style.--_segment-color]="colorOf(segment, index)"
          [style.flex-grow]="grow(segment)"
        ></span>
      }
    </div>
    @if (start() !== undefined || end() !== undefined) {
      <div data-part="scale" data-part-scale="">
        <span>{{ start() }}</span
        ><span>{{ end() }}</span>
      </div>
    }`,
  styleUrl: '../../../styles/src/progress-indicator/progress-indicator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'progress-indicator',
    'data-ui-progress-indicator': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-shape': 'segmented',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-current]': "current() === null || current() === undefined ? null : ''",
  },
})
export class SlSegmentedBar {
  readonly segments = input.required<readonly SegmentedBarSegment[]>();
  /** The whole the bar stands for; the accessible name ends with the parts. */
  readonly label = input<string | undefined>(undefined);
  /** The segment to mark, by key or index; the others dim. */
  readonly current = input<string | number | null | undefined>(undefined);
  /** What stands at the start of the line under the bar: a minimum, a zero. */
  readonly start = input<string | undefined>(undefined);
  /** What stands at its end: the total. */
  readonly end = input<string | undefined>(undefined);
  readonly size = input<ProgressSize | undefined>(undefined);

  private readonly defaults = injectProgressIndicatorDefaults();
  private readonly locale = injectLocale();

  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size ?? 'md');
  protected readonly name = computed(() => {
    const parts = new Intl.ListFormat(this.locale(), { type: 'unit' }).format(
      this.segments().map((segment) => segment.label),
    );
    const label = this.label();

    return label === undefined ? parts : `${label}: ${parts}`;
  });

  protected keyOf(index: number) {
    return this.segments()[index]?.key ?? index;
  }

  protected isCurrent(index: number) {
    const current = this.current();

    return current !== null && current !== undefined && this.keyOf(index) === current;
  }

  protected colorOf(segment: SegmentedBarSegment, index: number) {
    return `var(--slotted-data-${String(segment.color ?? (index % 8) + 1)})`;
  }

  protected grow(segment: SegmentedBarSegment) {
    return Math.max(0, segment.value);
  }
}
