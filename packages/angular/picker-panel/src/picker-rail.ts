import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { createDateFormat, plainDate } from '@slotted/core/date';
import type { PlainDate, PlainYearMonth } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';

import { SlPickerStep } from './picker-step';
import type { PickerChipView, PickerPresetView } from './picker-views';

/** The column of shortcuts. The groups under them are its content. */
@Component({
  selector: '[slPickerRail]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `
    @if (presets().length > 0) {
      <div data-part="presets" data-part-presets="" role="group" [attr.aria-label]="t('presets')">
        @for (preset of presets(); track preset.label) {
          <button
            data-part="preset"
            data-part-preset=""
            type="button"
            [attr.aria-pressed]="preset.selected"
            [attr.data-selected]="preset.selected ? '' : null"
            [disabled]="preset.disabled"
            (click)="preset.press($event)"
          >
            <span data-part="preset-label" data-part-preset-label="">{{ preset.label }}</span>
            <span data-part="preset-result" data-part-preset-result="">{{ preset.result }}</span>
            @if (preset.selected) {
              <span slIcon><svg slGlyph name="check"></svg></span>
            }
          </button>
        }
      </div>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'rail', 'data-part-rail': '' },
})
export class SlPickerRail {
  readonly presets = input.required<readonly PickerPresetView[]>();

  protected readonly t = injectMessages(pickerPanelMessages);
}

/** A named set of steps: from now, or the length of a run. */
@Component({
  selector: '[slPickerGroup]',
  standalone: true,
  template: `
    <span data-part="group-label" data-part-group-label="" [attr.id]="id">{{ label() }}</span>
    <div data-part="chips" data-part-chips="">
      @for (chip of chips(); track chip.label) {
        <button
          data-part="chip"
          data-part-chip=""
          type="button"
          [attr.aria-pressed]="chip.selected ?? null"
          [attr.data-selected]="chip.selected ? '' : null"
          [disabled]="chip.disabled"
          (click)="chip.press($event)"
        >
          {{ chip.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'id',
    '[attr.data-part]': 'part()',
    '[attr.data-part-group]': "part() === 'group' ? '' : null",
    '[attr.data-part-offsets]': "part() === 'offsets' ? '' : null",
  },
})
export class SlPickerGroup {
  readonly chips = input.required<readonly PickerChipView[]>();
  readonly label = input.required<string>();
  /** `group` is a group of the column; `offsets` is a row under a clock. */
  readonly part = input<'group' | 'offsets'>('group');

  protected readonly id = `sl-picker-group-${String((sequence += 1))}`;
}

/** The twelve months of a year, as a press away. */
@Component({
  selector: '[slPickerJump]',
  standalone: true,
  imports: [SlPickerStep],
  template: `
    <div data-part="jump-head" data-part-jump-head="">
      <button slPickerStep="previous" [label]="t('previousYear')" (click)="move(-1)"></button>
      <span data-part="jump-year" data-part-jump-year="">{{ shown().year }}</span>
      <button slPickerStep="next" [label]="t('nextYear')" (click)="move(1)"></button>
    </div>
    <div data-part="jump-grid" data-part-jump-grid="">
      @for (cell of cells(); track cell.month) {
        <button
          data-part="jump-month"
          data-part-jump-month=""
          type="button"
          [attr.aria-label]="cell.name"
          [attr.data-current]="cell.current ? '' : null"
          [attr.data-selected]="cell.selected ? '' : null"
          [attr.data-today]="cell.today ? '' : null"
          [disabled]="cell.refused"
          (click)="jump.emit({ year: shown().year, month: cell.month })"
        >
          {{ cell.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'jump', 'data-part-jump': '' },
})
export class SlPickerJump {
  readonly locale = input<string | undefined>(undefined);
  readonly max = input<PlainDate | undefined>(undefined);
  readonly min = input<PlainDate | undefined>(undefined);
  /** How many months the panel shows, from `shown`. */
  readonly months = input(1);
  /** The months the value is in, as `year * 12 + month`, both ends. */
  readonly selected = input<readonly [number, number] | null>(null);
  readonly shown = input.required<PlainYearMonth>();
  readonly today = input<PlainDate | null>(null);

  readonly jump = output<PlainYearMonth>();

  private readonly appLocale = injectLocale();
  protected readonly t = injectMessages(pickerPanelMessages);

  protected readonly cells = computed(() => {
    const format = createDateFormat({ locale: this.locale() ?? this.appLocale() });
    const { year } = this.shown();
    const first = indexOf(this.shown());
    const [min, max, today] = [this.min(), this.max(), this.today()];
    const selected = this.selected();

    return format.monthNames('short').map((label, index) => {
      const month = index + 1;
      const at = indexOf({ year, month });

      return {
        current: at >= first && at < first + this.months(),
        label,
        month,
        name: format.monthYear(plainDate(year, month, 1)),
        refused:
          (min !== undefined && at < indexOf(min)) || (max !== undefined && at > indexOf(max)),
        selected: selected !== null && at >= selected[0] && at <= selected[1],
        today: today !== null && indexOf(today) === at,
      };
    });
  });

  protected move(years: 1 | -1): void {
    this.jump.emit({ year: this.shown().year + years, month: this.shown().month });
  }
}

/** A group is labelled by its own name. */
let sequence = 0;

function indexOf({ month, year }: PlainYearMonth): number {
  return year * 12 + month;
}
