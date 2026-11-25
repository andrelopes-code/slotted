import {
  addSeconds,
  clockFinest,
  createTimeFormat,
  durationLabel,
  isSameTime,
  isTimeInRange,
  presetValue,
  stepLabel,
  timeMeta,
} from '@slotted/core/date';
import type { PickerPreset, PlainTime, TimeGranularity } from '@slotted/core/date';
import { pickerPanelMessages } from '@slotted/core/i18n';
import type { MouseEvent } from 'react';

import type { ClockChangeRequest } from '../clock';
import { useMessages } from '../i18n';
import { usePickerDraft } from '../picker-panel/use-picker-draft';
import type { PickerLayer } from '../picker-panel/use-picker-layer';
import type { TimePickerProps } from './time-picker.types';

/** Fifteen minutes to eight hours, as far as a plan for today goes. */
const OFFSETS: readonly number[] = [900, 1800, 3600, 7200, 14400, 28800];

interface TimePanelOptions extends Pick<
  TimePickerProps,
  'isTimeUnavailable' | 'max' | 'min' | 'offsets' | 'options' | 'presets'
> {
  readonly confirm: boolean;
  readonly granularity: TimeGranularity;
  readonly held: PlainTime | null;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly layer: PickerLayer;
  readonly locale: string;
  readonly now: PlainTime;
  readonly onWrite: (next: PlainTime | null, source: unknown) => void;
  readonly step: number;
}

/** What the panel of a time composes, and the words it says it in. */
export function useTimePanel(options: TimePanelOptions) {
  const { confirm, granularity, held, layer, locale, max, min, now, onWrite, step } = options;
  const t = useMessages(pickerPanelMessages);
  const { draft, setDraft } = usePickerDraft({
    equals: isSameTime,
    isOpen: layer.isOpen,
    value: held,
  });

  const format = createTimeFormat({ granularity, hourCycle: options.hourCycle, locale });
  const accepted = (time: PlainTime) =>
    isTimeInRange(time, min, max) && options.isTimeUnavailable?.(time) !== true;
  const refused = draft !== null && !accepted(draft);

  function write(next: PlainTime | null, source: unknown) {
    onWrite(next, source);
    layer.finish(source);
  }

  /* A shortcut is a whole answer: without a draft to confirm, it is written. */
  function choose(next: PlainTime, source: unknown) {
    if (confirm) setDraft(next);
    else write(next, source);
  }

  function handleClock(next: PlainTime | null, request: ClockChangeRequest) {
    const complete = request.unit === 'slot' || request.unit === clockFinest(granularity, step);
    if (next === null || confirm || !complete) setDraft(next);
    else write(next, request.source);
  }

  const presetOf = (preset: PickerPreset<PlainTime>) => {
    const value = presetValue(preset);

    return {
      disabled: !accepted(value),
      label: preset.label,
      onPress: (event: MouseEvent) => choose(value, event),
      result: format.format(value),
      selected: isSameTime(draft, value),
    };
  };

  /* A stated list holds the only times there are: no Now, and no steps from it. */
  const listed = options.options !== undefined;
  const stated = options.presets ?? [];
  const presets = listed ? stated : [{ label: t('now'), value: now }, ...stated];
  const offsets = listed ? [] : (options.offsets ?? OFFSETS);

  return {
    canApply: !refused && (draft !== null || held !== null),
    draft,
    handleClock,
    hint: listed ? '' : t('every', { length: durationLabel(step, locale, 'second') }),
    meta: draft === null ? format.format(now) : timeMeta(draft, now, locale, t, granularity),
    offsets: offsets.map((seconds) => {
      const { days, time } = addSeconds(now, seconds);

      return {
        disabled: days !== 0 || !accepted(time),
        label: stepLabel(seconds, locale),
        onPress: (event: MouseEvent) => choose(time, event),
      };
    }),
    presets: (stated.length > 0 || offsets.length > 0 ? presets : []).map(presetOf),
    refused,
    setDraft,
    /* Typed in the head: without a draft to confirm, it is written as it is. */
    type: (next: PlainTime | null, source: unknown) => {
      setDraft(next);
      if (!confirm) onWrite(next, source);
    },
    write,
  };
}
