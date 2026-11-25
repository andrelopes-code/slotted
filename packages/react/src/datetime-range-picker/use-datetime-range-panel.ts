import {
  closingMoments,
  dayTimes,
  isPastRunLimit,
  momentOf,
  momentRunDraft,
  momentRunFor,
  momentRunOf,
  presetValue,
  SECONDS_PER_DAY,
  stepMomentRun,
} from '@slotted/core/date';
import type { PickerPreset, PlainDate, PlainYearMonth } from '@slotted/core/date';
import type { ChangeReason } from '@slotted/core/state';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import type { CalendarView } from '../calendar';
import type { PickerPosition } from '../picker-panel/use-picker-position';
import type { DateTimeRange } from './datetime-range-picker.types';
import {
  isSameDateTimeRange,
  momentEndWords,
  momentLimitWords,
  momentRefusalWords,
  momentResultWords,
  momentSpanSeconds,
} from './datetime-range-words';
import { useDateTimeRangeDraft } from './use-datetime-range-draft';
import type { DateTimeRangeDraftOptions } from './use-datetime-range-draft';

/** A day to two weeks: a delivery through a trip. */
const DURATIONS = [1, 2, 3, 5, 7, 14].map((days) => days * SECONDS_PER_DAY);

interface DateTimeRangePanelOptions extends DateTimeRangeDraftOptions {
  readonly durations?: readonly number[] | undefined;
  readonly presets?: readonly PickerPreset<DateTimeRange>[] | undefined;
}

/** What the panel of a run of moments composes, and the words it says it in. */
export function useDateTimeRangePanel(options: DateTimeRangePanelOptions) {
  const { confirm, held, onPosition, position, words } = options;
  const { locale, rules, today } = words;
  const range = useDateTimeRangeDraft(options);
  const { draft, take } = range;

  const [view, setView] = useState<CalendarView>('day');
  const [focused, setFocused] = useState<PlainDate | null>(null);
  const [page, setPage] = useState<PlainYearMonth | null>(null);
  const anchor = draft[position].date ?? draft.start.date ?? today;

  const run = momentRunOf(draft);
  const refusal = momentRefusalWords(run, words);
  const whole = run?.start != null && run.end !== null;
  const isEmpty = [draft.start, draft.end].every(
    ({ date, time }) => date === null && time === null,
  );
  const seconds = momentSpanSeconds(range.pending ?? draft);
  const months = [draft.start.date, draft.end.date]
    .filter((date) => date !== null)
    .map(({ month, year }) => year * 12 + month);

  function choose(next: DateTimeRange, source: unknown) {
    const chosen = momentRunDraft(next);
    if (next.start !== null) setFocused(next.start.date);
    range.moveTo('start', source);
    if (confirm) take(chosen, source);
    else range.write(chosen, source);
  }

  return {
    ...range,
    anchor,
    canApply: refusal === null && (whole || (isEmpty && held !== null)),
    canClear: !isEmpty,
    durations: (options.durations ?? DURATIONS).map((length) => {
      const next = momentRunFor(draft, length, rules);

      return {
        disabled: next === null,
        label: words.lengthLabel(length, locale),
        onPress: (event: MouseEvent) => {
          if (next === null) return;

          take(next, event);
          setFocused(next.end.date);
        },
        selected: whole && seconds === length,
      };
    }),
    end: momentEndWords(draft.end, words),
    /** The end the next press writes, its day brought to the screen. */
    enter: (next: PickerPosition, reason: ChangeReason, source: unknown) => {
      const day = draft[next].date;
      if (day !== null) setFocused(day);
      if (next !== position) onPosition(next, reason, source);
    },
    focused,
    hint: momentLimitWords(words),
    isOver: (date: PlainDate) => isPastRunLimit(draft, date, rules),
    jump: ({ month, year }: PlainYearMonth) => {
      setView('day');
      setFocused({ year, month, day: 1 });
    },
    page: page ?? anchor,
    presets: (options.presets ?? []).map((preset) => {
      const value = presetValue(preset);

      return {
        disabled: momentRefusalWords(value, words) !== null,
        label: preset.label,
        onPress: (event: MouseEvent) => choose(value, event),
        result: momentResultWords(value, words),
        selected: isSameDateTimeRange(run, value),
      };
    }),
    refusal,
    selectedMonths:
      months.length === 0 ? null : ([Math.min(...months), Math.max(...months)] as const),
    setFocused,
    setPage,
    setView,
    span: {
      canDecrease: stepMomentRun(draft, -1, rules) !== null,
      canIncrease: stepMomentRun(draft, 1, rules) !== null,
      empty: seconds === 0,
      onStep: (direction: 1 | -1, event: MouseEvent) => {
        const next = stepMomentRun(draft, direction, rules);
        if (next === null) return;

        take(next, event);
        setFocused(next.end.date);
      },
      text: words.lengthLabel(seconds, locale),
    },
    start: momentEndWords(draft.start, words),
    times: {
      end: closingMoments(momentOf(draft.start), draft.end.date, rules),
      start: dayTimes(draft.start.date, {
        ...rules,
        isDateUnavailable: rules.unavailableDay,
        isTimeUnavailable: rules.unavailableTime,
      }),
    },
    view,
  };
}
