import {
  addSeconds,
  createTimeFormat,
  isSameTime,
  isTimeInRange,
  presetValue,
  stepLabel,
} from '@slotted/core/date';
import type { PickerPreset, PlainTime, TimeGranularity } from '@slotted/core/date';
import type { PickerChipView, PickerPresetView } from '@slotted/angular/picker-panel';

/** Fifteen minutes to eight hours, as far as a plan for today goes. */
export const TIME_PICKER_OFFSETS: readonly number[] = [900, 1800, 3600, 7200, 14400, 28800];

export interface TimeRules {
  readonly isTimeUnavailable: ((time: PlainTime) => boolean) | undefined;
  readonly max: PlainTime | undefined;
  readonly min: PlainTime | undefined;
}

interface TimeShortcuts {
  readonly choose: (time: PlainTime, event: Event) => void;
  readonly draft: PlainTime | null;
  readonly locale: string;
  readonly rules: TimeRules;
}

interface TimePresetOptions extends TimeShortcuts {
  readonly granularity: TimeGranularity;
  readonly hourCycle: 12 | 24 | undefined;
  readonly presets: readonly PickerPreset<PlainTime>[];
}

interface TimeOffsetOptions extends TimeShortcuts {
  readonly now: PlainTime;
  readonly offsets: readonly number[];
}

export function isRefusedTime(time: PlainTime, rules: TimeRules): boolean {
  return !isTimeInRange(time, rules.min, rules.max) || rules.isTimeUnavailable?.(time) === true;
}

/** The shortcuts of a time, each with the time it writes. */
export function timePresetViews(options: TimePresetOptions): PickerPresetView[] {
  const format = createTimeFormat(options);

  return options.presets.map((preset) => {
    const value = presetValue(preset);

    return {
      disabled: isRefusedTime(value, options.rules),
      label: preset.label,
      press: (event) => options.choose(value, event),
      result: format.format(value),
      selected: isSameTime(options.draft, value),
    };
  });
}

/** The steps from now. One past midnight, or refused, is off. */
export function timeOffsetViews(options: TimeOffsetOptions): PickerChipView[] {
  return options.offsets.map((seconds) => {
    const { days, time } = addSeconds(options.now, seconds);

    return {
      disabled: days !== 0 || isRefusedTime(time, options.rules),
      label: stepLabel(seconds, options.locale),
      press: (event) => options.choose(time, event),
    };
  });
}
