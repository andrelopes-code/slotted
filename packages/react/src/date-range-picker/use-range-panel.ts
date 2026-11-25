import { isPastLimit, lengthOf } from '@slotted/core/date';
import type { DateRangeRules, PickerPreset, PlainDate, PlainYearMonth } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { DateRangePickerMessages, FamilyTranslator } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { isSameValue } from '../calendar';
import type { CalendarValue, CalendarView, DateRange } from '../calendar';
import { useMessages } from '../i18n';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { DateRangePickerPosition } from './date-range-picker.types';
import { endWords, limitWords, refusalWords, resultWords, spanWords } from './range-words';
import { useRangeDraft } from './use-range-draft';

interface RangePanelOptions {
  readonly confirm: boolean;
  readonly held: DateRange | null;
  readonly layer: PickerLayer;
  readonly locale: string;
  readonly onPosition: (next: DateRangePickerPosition, source: unknown) => void;
  readonly onWrite: (next: DateRange | null, reason: ChangeReason, source: unknown) => void;
  readonly position: DateRangePickerPosition;
  readonly presets: readonly PickerPreset<DateRange>[];
  readonly rules: DateRangeRules;
  readonly t: FamilyTranslator<DateRangePickerMessages>;
  readonly today: PlainDate;
}

/** What the panel of a run composes, and the words it says it in. */
export function useRangePanel(options: RangePanelOptions) {
  const { confirm, held, layer, locale, onPosition, onWrite, position, rules, t, today } = options;
  const words = { locale, rules, t, today, words: useMessages(pickerPanelMessages) };
  const range = useRangeDraft({ ...options, isOpen: layer.isOpen });
  const { draft, end, pending, start } = range;

  const [view, setView] = useState<CalendarView>('day');
  const [focused, setFocused] = useState<PlainDate | null>(null);
  const [page, setPage] = useState<PlainYearMonth | null>(null);
  const anchor = (position === 'end' ? end : start) ?? start ?? today;

  const refusal = refusalWords(draft, words);
  const whole = start !== null && end !== null;

  function write(next: DateRange | null, source: unknown, reason: ChangeReason = 'select') {
    onWrite(next, reason, source);
    onPosition('start', source);
    layer.finish(source);
  }

  function choose(next: DateRange, source: unknown) {
    setFocused(next.start);
    range.setDraft(next);
    onPosition('start', source);
    if (!confirm) write(next, source);
  }

  /** The end the next press writes, its day brought to the screen. */
  function enter(next: DateRangePickerPosition, source: unknown) {
    const day = next === 'end' ? end : start;
    if (day !== null) setFocused(day);
    if (next !== position) onPosition(next, source);
  }

  const shownRun = pending ?? draft;
  const ends = [start, end].filter((date): date is PlainDate => date !== null);
  const months = ends.map(({ month, year }) => year * 12 + month);

  return {
    anchor,
    canApply: refusal === null && (whole || (draft === null && held !== null)),
    canClear: draft !== null,
    clear: (source: unknown) => {
      range.setDraft(null);
      onPosition('start', source);
      if (!confirm) write(null, source, 'clear');
    },
    draft,
    end: endWords(end, words),
    enter,
    focused,
    hint: limitWords(words),
    isOver: (date: PlainDate) => isPastLimit(draft, date, rules),
    isUnavailable: range.isUnavailable,
    jump: ({ month, year }: PlainYearMonth) => {
      setView('day');
      setFocused({ year, month, day: 1 });
    },
    page: page ?? anchor,
    presets: range.presets.map(({ label, value }) => ({
      disabled: refusalWords(value, words) !== null,
      label,
      onPress: (event: MouseEvent) => choose(value, event),
      result: resultWords(value, words),
      selected: isSameValue(draft, value),
    })),
    refusal,
    selectedMonths:
      months.length === 0 ? null : ([Math.min(...months), Math.max(...months)] as const),
    setFocused,
    setPage,
    setPreview: range.setPreview,
    setView,
    shown: range.shown,
    span: {
      canDecrease: range.stepped(-1) !== null,
      canIncrease: range.stepped(1) !== null,
      empty: lengthOf(shownRun, rules) === 0 && !whole,
      onStep: (direction: 1 | -1, event: MouseEvent) => {
        const next = range.stepped(direction);
        if (next === null) return;

        range.setDraft(next);
        setFocused(next.end);
        if (!confirm) onWrite(next, 'select', event);
      },
      text: spanWords(shownRun, words),
    },
    start: endWords(start, words),
    take: (next: CalendarValue, source: unknown) => {
      const run = range.take(next, source);
      if (run !== null && !confirm) write(run, source);
    },
    view,
    write,
  };
}
