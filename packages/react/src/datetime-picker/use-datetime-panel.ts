import {
  addDateTimeSeconds,
  clockFinest,
  dayMeta,
  dayTimes,
  durationLabel,
  headDay,
  isRefusedDay,
  isRefusedMoment,
  isSameDateTime,
  isSameMomentDraft,
  momentDraft,
  momentMeta,
  momentOf,
  presetValue,
  shortDay,
  shortMoment,
  stepLabel,
  stepToDay,
} from '@slotted/core/date';
import type {
  MomentDraft,
  MomentRules,
  PickerPreset,
  PlainDate,
  PlainDateTime,
  PlainTime,
  PlainYearMonth,
  TimeGranularity,
} from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, RefObject } from 'react';

import type { CalendarValue, CalendarView } from '../calendar';
import { asDates } from '../calendar';
import type { ClockChangeRequest, ClockHandle } from '../clock';
import { useMessages } from '../i18n';
import type { PickerShowing } from '../picker-panel/picker-panel';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { DateTimePickerProps } from './datetime-picker.types';

/** An hour, half a day's work and a day from now. */
const OFFSETS: readonly number[] = [3600, 14400, 86400];

interface DateTimePanelOptions extends Pick<
  DateTimePickerProps,
  'offsets' | 'options' | 'presets'
> {
  readonly clockRef: RefObject<ClockHandle | null>;
  readonly confirm: boolean;
  readonly granularity: TimeGranularity;
  readonly held: PlainDateTime | null;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly layer: PickerLayer;
  readonly locale: string;
  readonly now: PlainDateTime;
  readonly onWrite: (next: PlainDateTime | null, reason: ChangeReason, source: unknown) => void;
  readonly rules: MomentRules;
  readonly step: number;
  readonly timeZone: string | undefined;
}

/** What the panel of a moment composes, and the words it says it in. */
export function useDateTimePanel(options: DateTimePanelOptions) {
  const { confirm, granularity, held, layer, locale, now, onWrite, rules, step } = options;
  const t = useMessages(pickerPanelMessages);
  const { draft, setDraft } = usePickerDraft<MomentDraft>({
    equals: isSameMomentDraft,
    isOpen: layer.isOpen,
    value: momentDraft(held),
  });
  const [view, setView] = useState<CalendarView>('day');
  const [focused, setFocused] = useState<PlainDate | null>(null);
  const [page, setPage] = useState<PlainYearMonth | null>(null);
  const [showing, setShowing] = useState<PickerShowing>('day');
  const owesClock = useRef(false);

  /* The next opening starts from the day. */
  useEffect(() => {
    if (!layer.isOpen) setShowing('day');
  }, [layer.isOpen]);

  /* Focus goes to the clock in the commit that has it on screen. */
  useEffect(() => {
    if (!owesClock.current) return;

    owesClock.current = false;
    options.clockRef.current?.focus();
  });

  const moment = momentOf(draft);
  const refused = moment !== null && isRefusedMoment(moment, rules);
  const anchor = focused ?? draft.date ?? now.date;
  const shape = { granularity, hourCycle: options.hourCycle };

  function write(next: PlainDateTime | null, source: unknown, reason: ChangeReason = 'select') {
    onWrite(next, reason, source);
    layer.finish(source);
  }

  /* A shortcut is a whole answer: without a draft to confirm, it is written. */
  function choose(next: PlainDateTime, source: unknown) {
    setFocused(next.date);
    setDraft(next);
    if (!confirm) write(next, source);
  }

  /* A day is half of the answer: the time is next, unless it is already there
     and both are on screen. */
  function takeDay(value: CalendarValue, source: unknown) {
    const date = asDates(value)[0];
    if (date === undefined) return;

    const next = { ...draft, date };
    setDraft(next);
    if (layer.narrow) setShowing('time');
    if (layer.narrow || draft.time === null) owesClock.current = true;
    if (!confirm) keep(momentOf(next), source);
  }

  function takeTime(time: PlainTime | null, request: ClockChangeRequest) {
    const next = { ...draft, time };
    const complete = request.unit === 'slot' || request.unit === clockFinest(granularity, step);
    const whole = momentOf(next);
    setDraft(next);
    if (complete && next.date === null && layer.narrow) setShowing('day');
    if (!confirm && complete && whole !== null) write(whole, request.source);
  }

  /** Without a draft to confirm, a whole moment is written and the panel stays. */
  function keep(next: PlainDateTime | null, source: unknown) {
    if (next !== null && !isRefusedMoment(next, rules)) onWrite(next, 'select', source);
  }

  function stepDay(direction: 1 | -1, source: unknown) {
    const from = draft.date ?? stepToDay(now.date, -direction as 1 | -1, () => false) ?? now.date;
    const date = stepToDay(from, direction, (day) => isRefusedDay(day, rules));
    if (date === null) return;

    const next = { ...draft, date };
    setFocused(date);
    setDraft(next);
    if (!confirm) keep(momentOf(next), source);
  }

  const presetOf = (preset: PickerPreset<PlainDateTime>) => {
    const value = presetValue(preset);

    return {
      disabled: isRefusedMoment(value, rules),
      label: preset.label,
      onPress: (event: MouseEvent) => choose(value, event),
      result: shortMoment(value, locale, shape),
      selected: isSameDateTime(moment, value),
    };
  };

  /* A stated list holds the only times there are: no Now, and no steps from it. */
  const listed = options.options !== undefined;
  const stated = options.presets ?? [];
  const presets = listed ? stated : [{ label: t('now'), value: now }, ...stated];

  return {
    anchor,
    canApply: moment === null ? isEmpty(draft) && held !== null : !refused,
    canClear: !isEmpty(draft),
    clear: (source: unknown) => {
      setDraft(momentDraft(null));
      if (!confirm) write(null, source, 'clear');
    },
    draft,
    focused,
    head: {
      empty: draft.date === null,
      meta:
        draft.date === null
          ? t('todayIs', { day: shortDay(now.date, locale) })
          : dayMeta(draft.date, now.date, locale, t),
      value: draft.date === null ? t('chooseDay') : headDay(draft.date, now.date, locale),
    },
    hint: listed ? '' : t('every', { length: durationLabel(step, locale, 'second') }),
    jump: ({ month, year }: PlainYearMonth) => {
      setView('day');
      setFocused({ year, month, day: 1 });
    },
    moment,
    offsets: (listed ? [] : (options.offsets ?? OFFSETS)).map((seconds) => {
      const value = addDateTimeSeconds(now, seconds);

      return {
        disabled: isRefusedMoment(value, rules),
        label: stepLabel(seconds, locale),
        onPress: (event: MouseEvent) => choose(value, event),
      };
    }),
    page: page ?? anchor,
    presets: stated.length === 0 ? [] : presets.map(presetOf),
    refused,
    selectedMonths: draft.date === null ? null : spanOf(draft.date),
    setFocused,
    setPage,
    setShowing,
    setView,
    showing,
    stepDay,
    takeDay,
    takeTime,
    timeMeta: options.timeZone ?? (moment === null ? '' : momentMeta(moment, now, locale, t)),
    times: dayTimes(draft.date, rules),
    typeTime: (time: PlainTime | null) => setDraft({ ...draft, time }),
    view,
    write,
  };
}

function isEmpty({ date, time }: MomentDraft): boolean {
  return date === null && time === null;
}

/** The one month a day is in, as the jump counts them. */
function spanOf({ month, year }: PlainDate): readonly [number, number] {
  return [year * 12 + month, year * 12 + month];
}
