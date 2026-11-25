import { addDays, createDateFormat, presetValue } from '@slotted/core/date';
import type { PickerPreset, PlainDate, PlainYearMonth } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { asDates, isRange, isSameValue } from '../calendar';
import type { CalendarSelectionMode, CalendarValue, CalendarView } from '../calendar';
import { useMessages } from '../i18n';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import { dateHead, dateResult, isRefusedDate, isWholeDate, monthsOf } from './date-panel';
import type { DateRules } from './date-panel';

interface DatePanelOptions {
  readonly confirm: boolean;
  readonly defaultView: CalendarView;
  readonly held: CalendarValue;
  readonly layer: PickerLayer;
  readonly locale: string;
  readonly monthly: boolean;
  readonly onWrite: (next: CalendarValue, reason: ChangeReason, source: unknown) => void;
  readonly presets: readonly PickerPreset<CalendarValue>[];
  readonly rules: DateRules;
  readonly selectionMode: CalendarSelectionMode;
  readonly today: PlainDate;
}

/** What the panel of a date composes, and the words it says it in. */
export function useDatePanel(options: DatePanelOptions) {
  const { confirm, held, layer, locale, monthly, onWrite, rules, selectionMode, today } = options;
  const t = useMessages(pickerPanelMessages);
  const { draft, setDraft } = usePickerDraft({
    equals: isSameValue,
    isOpen: layer.isOpen,
    value: held,
  });
  const [view, setView] = useState<CalendarView>(options.defaultView);
  const [focused, setFocused] = useState<PlainDate | null>(null);
  const [page, setPage] = useState<PlainYearMonth | null>(null);

  const words = { format: createDateFormat({ locale }), locale, monthly, t, today };
  const single = selectionMode === 'single';
  const refused = isRefusedDate(draft, rules);
  const anchor = focused ?? asDates(draft)[0] ?? today;

  function write(next: CalendarValue, source: unknown, reason: ChangeReason = 'select') {
    onWrite(next, reason, source);
    layer.finish(source);
  }

  /* Without a draft to confirm, what a press completes is written: one date and
     a whole run close the panel, and a set stays open for the next press. */
  function take(next: CalendarValue, source: unknown, reason: ChangeReason) {
    setDraft(next);
    if (confirm || (isRange(next) && !isWholeDate(next))) return;
    if (selectionMode === 'multiple') onWrite(next, reason, source);
    else write(next, source, reason);
  }

  function choose(next: CalendarValue, source: unknown) {
    setFocused(asDates(next)[0] ?? null);
    if (confirm) setDraft(next);
    else write(next, source);
  }

  /** One day either way, over the days the rules refuse. The panel stays. */
  function stepDay(direction: 1 | -1, source: unknown) {
    const from = asDates(draft)[0] ?? addDays(today, -direction);
    const days = Array.from({ length: 366 }, (_, index) => addDays(from, (index + 1) * direction));
    const next = days.find((date) => !isRefusedDate(date, rules));
    if (next === undefined) return;

    setFocused(next);
    setDraft(next);
    if (!confirm) onWrite(next, 'select', source);
  }

  const presetOf = (preset: PickerPreset<CalendarValue>) => {
    const value = presetValue(preset);

    return {
      disabled: isRefusedDate(value, rules),
      label: preset.label,
      onPress: (event: MouseEvent) => choose(value, event),
      result: dateResult(value, words),
      selected: isSameValue(draft, value),
    };
  };

  const stated = options.presets;
  const first = single && !monthly ? [{ label: t('today'), value: today }] : [];

  return {
    anchor,
    canApply: !refused && (isWholeDate(draft) || (asDates(draft).length === 0 && held !== null)),
    canClear: asDates(draft).length > 0,
    clear: (source: unknown) => {
      setDraft(null);
      if (!confirm) write(null, source, 'clear');
    },
    draft,
    focused,
    head: dateHead(draft, words),
    hint: layer.narrow ? '' : t(monthly ? 'yearKeys' : 'pageKeys'),
    jump: ({ month, year }: PlainYearMonth) => {
      setView('day');
      setFocused({ year, month, day: 1 });
    },
    page: page ?? anchor,
    presets: stated.length === 0 ? [] : [...first, ...stated].map(presetOf),
    refused,
    selectedMonths: monthsOf(draft),
    setFocused,
    setPage,
    setView,
    stepDay,
    take,
    view,
    write,
  };
}
