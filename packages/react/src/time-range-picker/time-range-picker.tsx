import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/time-range-picker/time-range-picker.css';

import { timeRangeProblems, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { useImperativeHandle, useRef } from 'react';
import type { MouseEvent } from 'react';

import type { ClockHandle } from '../clock';
import { PickerFrame } from '../picker-panel/picker-frame';
import { PickerLayer } from '../picker-panel/picker-layer';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerPosition } from '../picker-panel/use-picker-position';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { TimeRangePanel } from './time-range-panel';
import type {
  TimeRange,
  TimeRangePickerProps,
  TimeRangePickerRootProps,
} from './time-range-picker.types';
import { isSameTimeRange, normalizeTimes, timeSummary, timeTriggerName } from './time-range-words';
import { useTimeRangePanel } from './use-time-range-panel';
import { useTimeRangePickerConfig, useTimeRangeWords } from './use-time-range-picker';

/**
 * A one-line frame — the run in words, a clear and the trigger — and behind it
 * the day as one axis with a clock for each end.
 *
 * **The frame is one line at any width.** Two segmented fields in it broke it
 * into two lines in any column narrower than they are. They live in the head
 * of the panel, where the width is the panel's.
 *
 * **The clock of the end answers the start.** What the start refuses of it —
 * the times before it, a run too short, too long, or across an unavailable
 * time — is struck in the gesture that chooses the start.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
export function TimeRangePicker(props: TimeRangePickerProps) {
  const {
    className,
    clearable = false,
    confirm: _confirm,
    contiguous: _contiguous,
    defaultOpen = false,
    defaultPosition: _defaultPosition,
    defaultValue,
    disabled: _disabled,
    durations,
    endName,
    footer,
    granularity: _granularity,
    hourCycle: _hourCycle,
    invalid,
    isTimeUnavailable,
    lengthLabel: _lengthLabel,
    locale: _locale,
    max,
    maxLength: _maxLength,
    messages: _messages,
    min,
    minLength: _minLength,
    onOpenChange,
    onPositionChange: _onPositionChange,
    onValueChange,
    open,
    options,
    placement: _placement,
    position: _position,
    presets,
    readOnly: _readOnly,
    ref,
    referenceTime,
    relative,
    render,
    renderSlot,
    required: _required,
    size: _size,
    startName,
    step: _step,
    style,
    timeZone: _timeZone,
    value,
    variant: _variant,
    ...nativeProps
  } = props;
  const config = useTimeRangePickerConfig(props);
  const words = useTimeRangeWords(props, config);
  const [position, requestPosition] = usePickerPosition(props);
  const rootRef = useRef<HTMLElement | null>(null);
  const clockRefs = { start: useRef<ClockHandle>(null), end: useRef<ClockHandle>(null) };

  const { held, requestValue } = usePickerValue<TimeRange | null>({
    defaultValue: normalizeTimes(defaultValue ?? null),
    equals: isSameTimeRange,
    onValueChange,
    rootRef,
    value: value === undefined ? undefined : normalizeTimes(value),
  });
  const layer = usePickerLayer({
    defaultOpen,
    focusPanel: () => clockRefs[position].current?.focus(),
    onOpenChange,
    open,
    placement: config.placement,
    rootRef,
  });
  const panel = useTimeRangePanel({
    ...config,
    clockRefs,
    durations,
    held,
    layer,
    onPosition: requestPosition,
    onWrite: requestValue,
    position,
    presets,
    words,
  });

  useImperativeHandle(ref, () => ({
    close: () => layer.setOpen(false, 'keyboard', undefined),
    focus: () => layer.triggerRef.current?.focus(),
    open: () => layer.show('keyboard', undefined),
  }));

  const { t } = words;
  const spoken = timeTriggerName(held, words);
  const refused = timeRangeProblems(held, words.rules).length > 0;
  const resolvedInvalid = invalid ?? (refused ? true : config.fieldInvalid);
  const reading = {
    granularity: config.granularity,
    hourCycle: config.hourCycle,
    locale: config.locale,
    max,
    min,
    readOnly: !config.editable,
  };

  function handleClear(event: MouseEvent<HTMLButtonElement>) {
    requestValue(null, 'clear', event);
    requestPosition('start', 'clear', event);
    layer.triggerRef.current?.focus();
  }

  const children = (
    <PickerFrame
      clearLabel={t('clear')}
      editable={config.editable}
      glyph="clock"
      layer={layer}
      onClear={clearable && held !== null ? handleClear : undefined}
      placeholder={t('choose')}
      posted={{
        end: { name: endName, value: posted(held?.end) },
        start: { name: startName, value: posted(held?.start) },
      }}
      spoken={spoken}
      summary={timeSummary(held, words)}
    />
  );

  const rootProps: TimeRangePickerRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(config.disabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(config.readOnly === true ? { 'data-readonly': '' } : {}),
    ...(config.required === true ? { 'data-required': '' } : {}),
    ...(layer.isOpen ? { 'data-open': '' } : {}),
    'data-granularity': config.granularity,
    'data-part': 'root',
    'data-size': config.size,
    'data-ui': 'time-range-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as TimeRangePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.draft, event)}
      >
        <TimeRangePanel
          clock={{
            ...reading,
            isTimeUnavailable,
            now: config.now,
            options,
            renderSlot,
            step: config.step,
          }}
          clockRefs={clockRefs}
          confirm={config.confirm}
          field={{ ...reading, referenceTime, relative, timeZone: config.timeZone }}
          footer={footer}
          labels={{ start: t('start'), end: t('end') }}
          locale={config.locale}
          narrow={layer.narrow}
          panel={panel}
          position={position}
          step={config.step}
        />
      </PickerLayer>
    </>
  );
}

function posted(time: PlainTime | null | undefined): string {
  return time == null ? '' : toISOTime(time);
}
