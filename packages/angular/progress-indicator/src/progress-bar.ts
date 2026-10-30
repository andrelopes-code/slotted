import {
  PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
  PROGRESS_WAVE_BAR_PATH,
  PROGRESS_WAVE_BAR_REACH,
} from '@slotted/core/progress';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import {
  measurableNumber,
  optionalNumber,
  SlProgressIndicatorBase,
} from './progress-indicator-base';
import {
  PROGRESS_DEFAULT_PLACEMENT,
  type ProgressPlacement,
  type ProgressShape,
} from './progress-indicator.constants';

/**
 * The linear recipe: a quantity along a track, or a wait travelling it.
 *
 * The shape is M3's from 2024 onward — a fully rounded indicator, a gap of one
 * thickness before the track it has not reached, and a stop indicator marking
 * where the bar is going. The gap and the dot are what make a bar at four per
 * cent read as four per cent of something rather than as a stray mark, and no
 * other surveyed implementation draws either.
 *
 * `placement="page"` is the whole of what the deleted `loading-bar` family
 * was: the same bar pinned to the top edge of the viewport, with no corner to
 * round and a transparent track, because a permanent grey band across the top
 * of a page reads as a rule under the header rather than as a wait.
 * `edge-start` and `edge-end` are the same bar on an edge of the nearest
 * positioned box, which is the frame `app-shell` and `page-header` render as
 * their `progress` part.
 *
 * With `wave` the indicator is an `svg` over the whole track and one stroked
 * path inside it; the stylesheet shows a window of it with a dash, so the bar
 * ends in its own crest with a round cap. The path carries the `svg:` prefix
 * for the reason the ring's shapes do: inside a control-flow block the parser
 * decides the namespace, and an unprefixed `path` would be an unknown HTML
 * element that draws nothing.
 *
 * The selector is a bare attribute, so the element stays the consumer's: a bar
 * belongs in whatever already holds it — a table cell, a card's footer, a
 * `header` — and wrapping it in a second element would change their layout to
 * carry an attribute.
 */
@Component({
  selector: '[slProgressBar]',
  standalone: true,
  template: `@if (labelText(); as text) {
      <span
        data-part="label"
        data-part-label=""
        [id]="labelId"
        [attr.data-ui]="labelUi()"
        [attr.data-ui-visually-hidden]="labelUi() ? '' : null"
        >{{ text }}</span
      >
    }
    @if (showValueValue()) {
      <span data-part="value" data-part-value="">{{ valueTextValue() }}</span>
    }
    <div data-part="track" data-part-track="">
      <!-- Each paint draws the indicator again, so its sweep starts at the
           leading edge: the branch changes with the paint's parity. -->
      @if (paint() % 2 === 0) {
        @if (wave()) {
          <svg
            aria-hidden="true"
            data-part="indicator"
            data-part-indicator=""
            focusable="false"
            preserveAspectRatio="xMinYMid meet"
            [attr.viewBox]="waveViewBox"
          >
            <svg:path [attr.d]="wavePath()" [attr.pathLength]="waveReach" />
          </svg>
        } @else {
          <div data-part="indicator" data-part-indicator=""></div>
        }
      } @else {
        @if (wave()) {
          <svg
            aria-hidden="true"
            data-part="indicator"
            data-part-indicator=""
            focusable="false"
            preserveAspectRatio="xMinYMid meet"
            [attr.viewBox]="waveViewBox"
          >
            <svg:path [attr.d]="wavePath()" [attr.pathLength]="waveReach" />
          </svg>
        } @else {
          <div data-part="indicator" data-part-indicator=""></div>
        }
      }
    </div>`,
  styleUrls: [
    '../../../styles/src/progress-indicator/progress-indicator.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slProgressBar',
  host: {
    'data-ui': 'progress-indicator',
    'data-ui-progress-indicator': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-shape': 'linear',
    '[attr.role]': 'roleAttribute()',
    '[attr.aria-hidden]': 'hiddenFromTree()',
    '[attr.aria-labelledby]': 'labelledByAttribute()',
    '[attr.aria-valuemin]': 'valueMinAttribute()',
    '[attr.aria-valuemax]': 'valueMaxAttribute()',
    '[attr.aria-valuenow]': 'valueNowAttribute()',
    '[attr.aria-valuetext]': 'valueTextAttribute()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-tone]': 'toneValue()',
    '[attr.data-indeterminate]': 'indeterminateAttribute()',
    '[attr.data-complete]': 'completeAttribute()',
    '[attr.data-buffered]': 'bufferedAttribute()',
    '[attr.data-placement]': 'placementAttribute()',
    '[attr.data-wave]': 'waveAttribute()',
    '[attr.hidden]': 'painted() ? null : ""',
    '[style.--slotted-progress-indicator-percent]': 'percentStyle()',
    '[style.--slotted-progress-indicator-buffer-percent]': 'bufferStyle()',
  },
})
export class SlProgressBar extends SlProgressIndicatorBase {
  protected override readonly shape: ProgressShape = 'linear';

  readonly value = input<number | null | undefined, unknown>(undefined, {
    transform: measurableNumber,
  });
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** A second, further quantity: received but not yet processed. */
  readonly buffer = input<number | null | undefined, unknown>(undefined, {
    transform: measurableNumber,
  });
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly valueText = input<string | undefined>(undefined);
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly wave = input(false, { transform: booleanAttribute });
  readonly placement = input<ProgressPlacement>(PROGRESS_DEFAULT_PLACEMENT);

  protected readonly labelUi = computed(() => (this.labelHidden() ? 'visually-hidden' : null));
  protected readonly placementAttribute = computed(() =>
    this.placement() === 'inline' ? null : this.placement(),
  );
  protected readonly waveAttribute = computed(() => (this.wave() ? '' : null));

  /**
   * M3's sine from `@slotted/core/progress`, in a user space where one unit
   * is one thickness, and the tighter wave M3 draws while the value is
   * unknown. The viewBox and `pathLength` both state the path's reach, which
   * is what makes a dash of one unit one thickness of travel at any amplitude.
   */
  protected readonly waveReach = PROGRESS_WAVE_BAR_REACH;
  protected readonly waveViewBox = `0 -1.25 ${PROGRESS_WAVE_BAR_REACH} 2.5`;
  protected readonly wavePath = computed(() =>
    this.geometry().indeterminate ? PROGRESS_WAVE_BAR_INDETERMINATE_PATH : PROGRESS_WAVE_BAR_PATH,
  );

  /**
   * A bar on an edge has no room for a visible name and still needs one, so the
   * placement decides it — and a consumer who states `hideLabel` outright still
   * wins, which is the rule the whole library follows.
   */
  protected override hidesLabelByPlacement(): boolean {
    return this.placement() !== 'inline';
  }

  protected override measure() {
    return {
      value: this.value(),
      min: this.min(),
      max: this.max(),
      buffer: this.buffer(),
      format: this.format(),
      showValue: this.showValue(),
      valueText: this.valueText(),
      locale: this.locale(),
    };
  }
}
