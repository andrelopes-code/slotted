import {
  clockFinest,
  clockHourGroups,
  clockModel,
  clockSlotGroups,
  clockUnitCells,
  createTimeFormat,
  timeList,
} from '@slotted/core/date';
import type { ClockPeriodNames, PlainTime } from '@slotted/core/date';
import { useMemo } from 'react';

import { useLocale } from '../i18n';
import type { ClockProps } from './clock.types';

interface ClockViewOptions extends Pick<
  ClockProps,
  | 'granularity'
  | 'hourCycle'
  | 'isTimeUnavailable'
  | 'locale'
  | 'max'
  | 'min'
  | 'now'
  | 'options'
  | 'step'
> {
  readonly held: PlainTime | null;
  readonly periods: ClockPeriodNames;
}

/** A quarter of an hour, which is the slot a booking flow asks in. */
const STEP = 900;

/** The model of the clock and the cells of each of its grids. */
export function useClockView(options: ClockViewOptions) {
  const {
    granularity = 'minute',
    held,
    hourCycle,
    isTimeUnavailable,
    max,
    min,
    now,
    periods,
    step = STEP,
  } = options;
  const appLocale = useLocale();
  const locale = options.locale ?? appLocale;

  const format = useMemo(
    () => createTimeFormat({ locale, granularity, hourCycle }),
    [granularity, hourCycle, locale],
  );
  const model = useMemo(
    () => clockModel({ step, min, max, isTimeUnavailable }),
    [isTimeUnavailable, max, min, step],
  );

  const hour = held?.hour ?? 0;
  const list = options.options;

  return {
    model,
    hours: clockHourGroups({ format, held, model, now, periods }),
    minutes:
      clockFinest(granularity, step) === 'hour'
        ? []
        : unitsOf(model.minutes(hour), held?.minute ?? null),
    seconds:
      granularity === 'second'
        ? unitsOf(model.seconds(hour, held?.minute ?? 0), held?.second ?? null)
        : [],
    slots:
      list === undefined
        ? null
        : clockSlotGroups(
            timeList({ step, options: list, min, max, isTimeUnavailable }),
            held,
            format,
            periods,
          ),
  };

  function unitsOf(units: Parameters<typeof clockUnitCells>[0], selected: number | null) {
    return clockUnitCells(units, selected, format);
  }
}
