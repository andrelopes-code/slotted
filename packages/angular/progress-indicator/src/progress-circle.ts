import { PROGRESS_WAVE_RING_PATH } from '@slotted/core/progress';
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
import type { ProgressShape } from './progress-indicator.constants';

/**
 * The circular recipe, and with no value the spinner every surveyed library
 * ships under that name.
 *
 * Two concentric shapes in one `48 48` box, each carrying `pathLength="100"`
 * so a dash length *is* the percentage and the stylesheet needs no arithmetic
 * of its own. The stroke is stated in the viewBox's own units, which makes it
 * one eighth of the diameter at every size — the ratio `button` derived for its
 * own loading ring, so the ring in a button and this circle are the same
 * object.
 *
 * The number sits beside the ring rather than inside it: the largest ring this
 * family draws is 38 pixels across with a 4.75-pixel stroke, which leaves 28
 * pixels of hole, and a percentage centred in it would be four-pixel type.
 *
 * With `wave` the indicator is M3's wavy ring from `@slotted/core/progress`
 * and the track stays a circle, which is what `CircularWavyProgressModifiers`
 * draws: only the active indicator morphs.
 *
 * The shapes carry the `svg:` prefix because a template's namespace is decided
 * by the parser rather than by the parent element: inside a control-flow block
 * an unprefixed `circle` is an unknown HTML element, and an unknown HTML
 * element draws nothing at all.
 */
@Component({
  selector: '[slProgressCircle]',
  standalone: true,
  template: `<svg aria-hidden="true" focusable="false" viewBox="0 0 48 48">
      <svg:circle
        cx="24"
        cy="24"
        data-part="track"
        data-part-track=""
        [attr.pathLength]="100"
        r="20"
      />
      <!-- Each paint draws the indicator again, so its sweep starts at the
           leading edge: the branch changes with the paint's parity. -->
      @if (paint() % 2 === 0) {
        @if (wave()) {
          <svg:path
            [attr.d]="wavePath"
            data-part="indicator"
            data-part-indicator=""
            [attr.pathLength]="100"
          />
        } @else {
          <svg:circle
            cx="24"
            cy="24"
            data-part="indicator"
            data-part-indicator=""
            [attr.pathLength]="100"
            r="20"
          />
        }
      } @else {
        @if (wave()) {
          <svg:path
            [attr.d]="wavePath"
            data-part="indicator"
            data-part-indicator=""
            [attr.pathLength]="100"
          />
        } @else {
          <svg:circle
            cx="24"
            cy="24"
            data-part="indicator"
            data-part-indicator=""
            [attr.pathLength]="100"
            r="20"
          />
        }
      }
    </svg>
    @if (labelText(); as text) {
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
    }`,
  styleUrls: [
    '../../../styles/src/progress-indicator/progress-indicator.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slProgressCircle',
  host: {
    'data-ui': 'progress-indicator',
    'data-ui-progress-indicator': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-shape': 'circular',
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
    '[attr.data-wave]': 'waveAttribute()',
    '[attr.hidden]': 'painted() ? null : ""',
    '[style.--slotted-progress-indicator-percent]': 'percentStyle()',
  },
})
export class SlProgressCircle extends SlProgressIndicatorBase {
  protected override readonly shape: ProgressShape = 'circular';
  protected readonly wavePath = PROGRESS_WAVE_RING_PATH;

  readonly value = input<number | null | undefined, unknown>(undefined, {
    transform: measurableNumber,
  });
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly valueText = input<string | undefined>(undefined);
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly wave = input(false, { transform: booleanAttribute });

  protected readonly labelUi = computed(() => (this.labelHidden() ? 'visually-hidden' : null));
  protected readonly waveAttribute = computed(() => (this.wave() ? '' : null));

  protected override measure() {
    return {
      value: this.value(),
      min: this.min(),
      max: this.max(),
      buffer: null,
      format: this.format(),
      showValue: this.showValue(),
      valueText: this.valueText(),
      locale: this.locale(),
    };
  }
}
