import { createDateFormat, plainDate } from '@slotted/core/date';
import type { PlainDate, PlainYearMonth } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { MouseEvent } from 'react';

import { useMessages } from '../i18n';
import { PickerStep } from './picker-step';

interface PickerJumpProps {
  readonly locale: string;
  readonly max?: PlainDate | undefined;
  readonly min?: PlainDate | undefined;
  /** How many months the panel shows, from `shown`. */
  readonly months: number;
  readonly onJump: (to: PlainYearMonth, event: MouseEvent<HTMLButtonElement>) => void;
  /** The months the value is in, as `year * 12 + month`, both ends. */
  readonly selected: readonly [number, number] | null;
  readonly shown: PlainYearMonth;
  readonly today: PlainDate | null;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/** The twelve months of a year, as a press away. */
export function PickerJump(props: PickerJumpProps) {
  const { locale, months, onJump, selected, shown, today } = props;
  const t = useMessages(pickerPanelMessages);
  const format = createDateFormat({ locale });
  const names = format.monthNames('short');
  const { year } = shown;
  const first = indexOf(shown);

  const move = (delta: number) => (event: MouseEvent<HTMLButtonElement>) =>
    onJump({ year: year + delta, month: shown.month }, event);

  return (
    <div data-part="jump" data-part-jump="">
      <div data-part="jump-head" data-part-jump-head="">
        <PickerStep direction="previous" label={t('previousYear')} onClick={move(-1)} />
        <span data-part="jump-year" data-part-jump-year="">
          {year}
        </span>
        <PickerStep direction="next" label={t('nextYear')} onClick={move(1)} />
      </div>

      <div data-part="jump-grid" data-part-jump-grid="">
        {MONTHS.map((month) => {
          const at = indexOf({ year, month });

          return (
            <button
              aria-label={format.monthYear(plainDate(year, month, 1))}
              data-part="jump-month"
              data-part-jump-month=""
              disabled={isRefused(at, props)}
              key={month}
              onClick={(event) => onJump({ year, month }, event)}
              type="button"
              {...(at >= first && at < first + months ? { 'data-current': '' } : {})}
              {...(selected !== null && at >= selected[0] && at <= selected[1]
                ? { 'data-selected': '' }
                : {})}
              {...(today !== null && indexOf(today) === at ? { 'data-today': '' } : {})}
            >
              {names[month - 1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function indexOf({ month, year }: PlainYearMonth): number {
  return year * 12 + month;
}

/** A month the bounds leave no day of. */
function isRefused(at: number, { max, min }: PickerJumpProps): boolean {
  return (min !== undefined && at < indexOf(min)) || (max !== undefined && at > indexOf(max));
}
