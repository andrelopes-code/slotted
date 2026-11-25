import type {
  PickerChipView,
  PickerPresetView,
  PickerSpanView,
} from '@slotted/angular/picker-panel';
import {
  momentRunFor,
  momentRunOf,
  presetValue,
  SECONDS_PER_DAY,
  stepMomentRun,
} from '@slotted/core/date';
import type { MomentRunDraft, PickerPreset } from '@slotted/core/date';

import type { DateTimeRange } from './datetime-range-picker-defaults';
import {
  isSameDateTimeRange,
  momentRefusalWords,
  momentResultWords,
  momentSpanSeconds,
} from './datetime-range-words';
import type { DateTimeRangeWords } from './datetime-range-words';

/** A day to two weeks: a delivery through a trip. */
export const DATETIME_RANGE_PICKER_DURATIONS: readonly number[] = [1, 2, 3, 5, 7, 14].map(
  (days) => days * SECONDS_PER_DAY,
);

/** The draft, the words it is said in, and what moves it. */
interface MomentRunViews {
  readonly choose: (run: DateTimeRange, event: Event) => void;
  readonly draft: MomentRunDraft;
  /** The run as it would close on the pending day; the draft while there is none. */
  readonly shown: MomentRunDraft;
  readonly take: (run: MomentRunDraft, event: Event) => void;
  readonly words: DateTimeRangeWords;
}

/** The shortcuts of a run, each with the days it writes. */
export function momentRunPresetViews(
  presets: readonly PickerPreset<DateTimeRange>[],
  { choose, draft, words }: MomentRunViews,
): PickerPresetView[] {
  return presets.map((preset) => {
    const value = presetValue(preset);

    return {
      disabled: momentRefusalWords(value, words) !== null,
      label: preset.label,
      press: (event) => choose(value, event),
      result: momentResultWords(value, words),
      selected: isSameDateTimeRange(momentRunOf(draft), value),
    };
  });
}

/** The lengths a run can take from its start. Without a whole start, or refused, it is off. */
export function momentRunDurationViews(
  durations: readonly number[],
  { draft, take, words }: MomentRunViews,
): PickerChipView[] {
  const run = momentRunOf(draft);
  const whole = run?.start != null && run.end !== null;
  const seconds = momentSpanSeconds(draft);

  return durations.map((length) => {
    const next = momentRunFor(draft, length, words.rules);

    return {
      disabled: next === null,
      label: words.lengthLabel(length, words.locale),
      press: (event) => {
        if (next !== null) take(next, event);
      },
      selected: whole && seconds === length,
    };
  });
}

/** The length of a run, and the steps that move its end by a day. */
export function momentRunSpanView({ draft, shown, take, words }: MomentRunViews): PickerSpanView {
  const stepped = (direction: 1 | -1) => stepMomentRun(draft, direction, words.rules);
  const seconds = momentSpanSeconds(shown);

  return {
    canDecrease: stepped(-1) !== null,
    canIncrease: stepped(1) !== null,
    empty: seconds === 0,
    step: (direction, event) => {
      const next = stepped(direction);
      if (next !== null) take(next, event);
    },
    text: words.lengthLabel(seconds, words.locale),
  };
}
