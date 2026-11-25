import type {
  PickerChipView,
  PickerPresetView,
  PickerSpanView,
} from '@slotted/angular/picker-panel';
import { presetValue, stepTimeRun, timeRangeSeconds, timeRunOf } from '@slotted/core/date';
import type { PickerPreset } from '@slotted/core/date';

import type { TimeRange } from './time-range-picker-defaults';
import {
  isSameTimeRange,
  timeRefusalWords,
  timeResultWords,
  timeSpanWords,
} from './time-range-words';
import type { TimeRangeWords } from './time-range-words';

/** Fifteen minutes to four hours: a meeting through half a day. */
export const TIME_RANGE_PICKER_DURATIONS: readonly number[] = [
  900, 1800, 2700, 3600, 5400, 7200, 10800, 14400,
];

/** The draft, the words it is said in, and what moves it. */
interface TimeRunViews {
  readonly choose: (run: TimeRange, event: Event) => void;
  readonly draft: TimeRange | null;
  readonly take: (run: TimeRange, event: Event) => void;
  readonly words: TimeRangeWords;
}

/** The shortcuts of a run, each with the run it writes. */
export function timeRunPresetViews(
  presets: readonly PickerPreset<TimeRange>[],
  { choose, draft, words }: TimeRunViews,
): PickerPresetView[] {
  return presets.map((preset) => {
    const value = presetValue(preset);

    return {
      disabled: timeRefusalWords(value, words) !== null,
      label: preset.label,
      press: (event) => choose(value, event),
      result: timeResultWords(value, words),
      selected: isSameTimeRange(draft, value),
    };
  });
}

/** The lengths a run can take from its start. One past midnight, or refused, is off. */
export function timeRunDurationViews(
  durations: readonly number[],
  { draft, take, words }: TimeRunViews,
): PickerChipView[] {
  const start = draft?.start ?? null;
  const seconds = draft?.start && draft.end ? timeRangeSeconds(draft.start, draft.end) : null;

  return durations.map((length) => {
    const next = timeRunOf(start, length, words.rules);

    return {
      disabled: next === null,
      label: words.lengthLabel(length, words.locale),
      press: (event) => {
        if (next !== null) take(next, event);
      },
      selected: seconds === length,
    };
  });
}

/** The length of a run, and the steps that move its end. */
export function timeRunSpanView({ draft, take, words }: TimeRunViews): PickerSpanView {
  const stepped = (direction: 1 | -1) =>
    draft === null ? null : stepTimeRun(draft, direction, words.rules);
  const seconds = draft?.start && draft.end ? timeRangeSeconds(draft.start, draft.end) : 0;

  return {
    canDecrease: stepped(-1) !== null,
    canIncrease: stepped(1) !== null,
    empty: seconds <= 0,
    step: (direction, event) => {
      const next = stepped(direction);
      if (next !== null) take(next, event);
    },
    text: timeSpanWords(draft, words),
  };
}
