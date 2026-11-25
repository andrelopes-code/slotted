import type { PickerChipView, PickerPresetView } from '@slotted/angular/picker-panel';
import {
  addDateTimeSeconds,
  dayMeta,
  headDay,
  isRefusedMoment,
  isSameDateTime,
  presetValue,
  shortDay,
  shortMoment,
  stepLabel,
} from '@slotted/core/date';
import type {
  MomentRules,
  PickerPreset,
  PlainDate,
  PlainDateTime,
  TimeGranularity,
} from '@slotted/core/date';
import type { FamilyTranslator, PickerPanelMessages } from '@slotted/core/i18n';

/** An hour, half a day's work and a day from now. */
export const DATE_TIME_PICKER_OFFSETS: readonly number[] = [3600, 14400, 86400];

/** The value in words, and what it means beside today. */
export interface DateTimeHead {
  readonly empty: boolean;
  readonly meta: string;
  readonly value: string;
}

interface MomentShortcuts {
  readonly choose: (moment: PlainDateTime, event: Event) => void;
  readonly locale: string;
  readonly rules: MomentRules;
}

interface MomentPresetOptions extends MomentShortcuts {
  readonly granularity: TimeGranularity;
  readonly hourCycle: 12 | 24 | undefined;
  readonly moment: PlainDateTime | null;
  readonly presets: readonly PickerPreset<PlainDateTime>[];
}

interface MomentOffsetOptions extends MomentShortcuts {
  readonly now: PlainDateTime;
  readonly offsets: readonly number[];
}

export function dateTimeHead(
  date: PlainDate | null,
  today: PlainDate,
  locale: string,
  t: FamilyTranslator<PickerPanelMessages>,
): DateTimeHead {
  if (date === null) {
    return {
      empty: true,
      meta: t('todayIs', { day: shortDay(today, locale) }),
      value: t('chooseDay'),
    };
  }

  return {
    empty: false,
    meta: dayMeta(date, today, locale, t),
    value: headDay(date, today, locale),
  };
}

/** The shortcuts of a moment, each with the moment it writes. */
export function momentPresetViews(options: MomentPresetOptions): PickerPresetView[] {
  return options.presets.map((preset) => {
    const value = presetValue(preset);

    return {
      disabled: isRefusedMoment(value, options.rules),
      label: preset.label,
      press: (event) => options.choose(value, event),
      result: shortMoment(value, options.locale, options),
      selected: isSameDateTime(options.moment, value),
    };
  });
}

/** The steps from now. A refused one is off. */
export function momentOffsetViews(options: MomentOffsetOptions): PickerChipView[] {
  return options.offsets.map((seconds) => {
    const value = addDateTimeSeconds(options.now, seconds);

    return {
      disabled: isRefusedMoment(value, options.rules),
      label: stepLabel(seconds, options.locale),
      press: (event) => options.choose(value, event),
    };
  });
}
