import {
  clockFinest,
  clockModel,
  closingTimes,
  compareTime,
  isSameTime,
  presetValue,
  stepTimeRun,
  timeRangeSeconds,
  timeRunOf,
} from '@slotted/core/date';
import type { PickerPreset, PlainTime } from '@slotted/core/date';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';

import type { ClockChangeRequest, ClockHandle } from '../clock';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { TimeRange, TimeRangePickerPosition } from './time-range-picker.types';
import {
  isSameTimeRange,
  normalizeTimes,
  timeEndWords,
  timeLimitWords,
  timeRefusalWords,
  timeResultWords,
  timeSpanWords,
} from './time-range-words';
import type { TimeRangeWords } from './time-range-words';

/** Fifteen minutes to four hours: a meeting through half a day. */
const DURATIONS: readonly number[] = [900, 1800, 2700, 3600, 5400, 7200, 10800, 14400];

interface TimeRangePanelOptions {
  readonly clockRefs: Record<TimeRangePickerPosition, RefObject<ClockHandle | null>>;
  readonly confirm: boolean;
  readonly durations?: readonly number[] | undefined;
  readonly held: TimeRange | null;
  readonly layer: PickerLayer;
  readonly onPosition: (
    next: TimeRangePickerPosition,
    reason: ChangeReason,
    source: unknown,
  ) => void;
  readonly onWrite: (next: TimeRange | null, reason: ChangeReason, source: unknown) => void;
  readonly position: TimeRangePickerPosition;
  readonly presets?: readonly PickerPreset<TimeRange>[] | undefined;
  readonly words: TimeRangeWords;
}

/** What the panel of a run of times composes, and the words it says it in. */
export function useTimeRangePanel(options: TimeRangePanelOptions) {
  const { confirm, held, layer, onPosition, onWrite, position, words } = options;
  const { granularity, locale, rules } = words;
  const { draft, setDraft } = usePickerDraft({
    equals: isSameTimeRange,
    isOpen: layer.isOpen,
    value: held,
  });
  const start = draft?.start ?? null;
  const end = draft?.end ?? null;
  const whole = start !== null && end !== null;
  const owesClock = useRef<TimeRangePickerPosition | null>(null);

  /* Focus goes to the clock of an end in the commit that has it on screen. */
  useEffect(() => {
    if (owesClock.current === null) return;

    options.clockRefs[owesClock.current].current?.focus();
    owesClock.current = null;
  });

  const model = useMemo(
    () => clockModel({ ...rules, isTimeUnavailable: rules.unavailable }),
    [rules],
  );
  const refusal = timeRefusalWords(draft, words);

  function write(next: TimeRange | null, source: unknown, reason: ChangeReason = 'select') {
    onWrite(next, reason, source);
    moveTo('start', source);
    layer.finish(source);
  }

  function moveTo(next: TimeRangePickerPosition, source: unknown) {
    if (next !== position) onPosition(next, 'select', source);
  }

  /** The run with one end moved. Without a draft to confirm, a whole run is written. */
  function take(next: TimeRange, source: unknown) {
    setDraft(normalizeTimes(next));
    if (confirm || !next.start || !next.end || timeRefusalWords(next, words) !== null) return;

    onWrite(next, 'select', source);
  }

  function choose(next: TimeRange, source: unknown) {
    setDraft(next);
    moveTo('start', source);
    if (!confirm) write(next, source);
  }

  /* The press that leaves the other end missing moves to it. */
  function press(which: TimeRangePickerPosition, time: PlainTime | null, at: ClockChangeRequest) {
    const next = { start, end, [which]: time };
    const other = which === 'start' ? 'end' : 'start';
    const complete = at.unit === 'slot' || at.unit === clockFinest(granularity, rules.step);
    setDraft(normalizeTimes(next));
    if (!complete) return;

    if (next[other] === null) {
      moveTo(other, at.source);
      owesClock.current = other;
    } else if (!confirm && timeRefusalWords(next, words) === null) {
      write(next, at.source);
    }
  }

  /** A handle moves up to the other one and no further. */
  function drag(which: TimeRangePickerPosition, time: PlainTime, source: unknown) {
    const next = { start, end, [which]: time };
    if (next.start !== null && next.end !== null && compareTime(next.start, next.end) >= 0) return;

    moveTo(which, source);
    take(next, source);
  }

  const seconds = whole ? timeRangeSeconds(start, end) : 0;

  return {
    canApply: refusal === null && (whole || (draft === null && held !== null)),
    canClear: draft !== null,
    clear: (source: unknown) => {
      setDraft(null);
      moveTo('start', source);
      if (!confirm) write(null, source, 'clear');
    },
    closing: closingTimes(start, rules),
    draft,
    drag,
    durations: (options.durations ?? DURATIONS).map((length) => {
      const next = timeRunOf(start, length, rules);

      return {
        disabled: next === null,
        label: words.lengthLabel(length, locale),
        onPress: (event: MouseEvent) => {
          if (next !== null) take(next, event);
        },
        selected: whole && seconds === length,
      };
    }),
    end: timeEndWords(end, words),
    /** The end the next press writes, its clock brought to the screen. */
    enter: (next: TimeRangePickerPosition, reason: ChangeReason, source: unknown) => {
      if (next !== position) onPosition(next, reason, source);
    },
    hint: timeLimitWords(words),
    model,
    press,
    presets: (options.presets ?? []).map((preset) => {
      const value = presetValue(preset);

      return {
        disabled: timeRefusalWords(value, words) !== null,
        label: preset.label,
        onPress: (event: MouseEvent) => choose(value, event),
        result: timeResultWords(value, words),
        selected: isSameTimeRange(draft, value),
      };
    }),
    refusal,
    span: {
      canDecrease: draft !== null && stepTimeRun(draft, -1, rules) !== null,
      canIncrease: draft !== null && stepTimeRun(draft, 1, rules) !== null,
      empty: seconds <= 0,
      onStep: (direction: 1 | -1, event: MouseEvent) => {
        const next = draft && stepTimeRun(draft, direction, rules);
        if (next !== null) take(next, event);
      },
      text: timeSpanWords(draft, words),
    },
    start: timeEndWords(start, words),
    /* Typed in a half: without a draft to confirm, it is written as it is. */
    type: (which: TimeRangePickerPosition, time: PlainTime | null, source: unknown) => {
      if (isSameTime(draft?.[which] ?? null, time)) return;

      const next = normalizeTimes({ start, end, [which]: time });
      setDraft(next);
      if (!confirm) onWrite(next, 'keyboard', source);
    },
    write,
  };
}
