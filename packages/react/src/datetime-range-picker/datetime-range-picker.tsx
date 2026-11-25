import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/datetime-range-picker/datetime-range-picker.css';

import { dateBoundsOf, dateTimeRangeProblems, toISODateTime } from '@slotted/core/date';
import type { PlainDateTime } from '@slotted/core/date';
import { useImperativeHandle, useRef } from 'react';
import type { MouseEvent } from 'react';

import type { CalendarHandle } from '../calendar';
import type { ClockHandle } from '../clock';
import { PickerFrame } from '../picker-panel/picker-frame';
import { PickerLayer } from '../picker-panel/picker-layer';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerPosition } from '../picker-panel/use-picker-position';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { DateTimeRangePanel } from './datetime-range-panel';
import type {
  DateTimeRange,
  DateTimeRangePickerProps,
  DateTimeRangePickerRootProps,
} from './datetime-range-picker.types';
import {
  isSameDateTimeRange,
  momentSummary,
  momentTriggerName,
  normalizeMoments,
} from './datetime-range-words';
import { useDateTimeRangePanel } from './use-datetime-range-panel';
import { useDateTimeRangePickerConfig, useDateTimeRangeWords } from './use-datetime-range-picker';

/**
 * A one-line frame — the run in words, a clear and the trigger — and behind it
 * the months of the run over a clock for each end.
 *
 * **The frame is one line at any width.** Two segmented fields in it broke it
 * into two lines in any column narrower than they are. They live in the head
 * of the panel, where the width is the panel's.
 *
 * **The press that leaves a half missing brings its grid.** A day, then its
 * time, then the other end: four presses, and the reader is never asked which
 * grid comes next.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
export function DateTimeRangePicker(props: DateTimeRangePickerProps) {
  const {
    calendar: _calendar,
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
    firstDayOfWeek: _firstDayOfWeek,
    fixedWeeks = false,
    footer,
    granularity: _granularity,
    hourCycle: _hourCycle,
    invalid,
    isDateUnavailable,
    isTimeUnavailable,
    lengthLabel: _lengthLabel,
    locale: _locale,
    max,
    maxLength: _maxLength,
    maxTime,
    messages: _messages,
    min,
    minLength: _minLength,
    minTime,
    months: _months,
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
    referenceDateTime,
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
    weekNumbers,
    yearPivot,
    ...nativeProps
  } = props;
  const config = useDateTimeRangePickerConfig(props);
  const words = useDateTimeRangeWords(props, config);
  const [position, requestPosition] = usePickerPosition(props);
  const rootRef = useRef<HTMLElement | null>(null);
  const calendarRef = useRef<CalendarHandle>(null);
  const clockRefs = { start: useRef<ClockHandle>(null), end: useRef<ClockHandle>(null) };

  const { held, requestValue } = usePickerValue<DateTimeRange | null>({
    defaultValue: normalizeMoments(defaultValue ?? null),
    equals: isSameDateTimeRange,
    onValueChange,
    rootRef,
    value: value === undefined ? undefined : normalizeMoments(value),
  });
  const layer = usePickerLayer({
    defaultOpen,
    focusPanel: () => {
      calendarRef.current?.focusDate(panel.anchor);
      calendarRef.current?.focus();
    },
    onEscape: () => walkDown(),
    onOpenChange,
    open,
    placement: config.placement,
    rootRef,
  });
  const panel = useDateTimeRangePanel({
    ...config,
    calendarRef,
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
  const spoken = momentTriggerName(held, words);
  const refused = dateTimeRangeProblems(held, words.rules).length > 0;
  const resolvedInvalid = invalid ?? (refused ? true : config.fieldInvalid);
  const shownMonths = layer.narrow ? 1 : config.months;
  const firstDay =
    config.firstDayOfWeek === undefined ? {} : { firstDayOfWeek: config.firstDayOfWeek };
  const reading = {
    granularity: config.granularity,
    hourCycle: config.hourCycle,
    locale: config.locale,
    readOnly: !config.editable,
  };

  /** Escape walks the calendar's view down before it closes the panel. */
  function walkDown() {
    if (panel.view === 'day') return false;

    panel.setView(panel.view === 'year' ? 'month' : 'day');

    return true;
  }

  function handleClear(event: MouseEvent<HTMLButtonElement>) {
    requestValue(null, 'clear', event);
    requestPosition('start', 'clear', event);
    layer.triggerRef.current?.focus();
  }

  const children = (
    <PickerFrame
      clearLabel={t('clear')}
      editable={config.editable}
      glyph="calendar"
      layer={layer}
      onClear={clearable && held !== null ? handleClear : undefined}
      placeholder={t('choose')}
      posted={{
        end: { name: endName, value: posted(held?.end) },
        start: { name: startName, value: posted(held?.start) },
      }}
      spoken={spoken}
      summary={momentSummary(held, words)}
    />
  );

  const rootProps: DateTimeRangePickerRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(config.disabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(config.readOnly === true ? { 'data-readonly': '' } : {}),
    ...(config.required === true ? { 'data-required': '' } : {}),
    ...(layer.isOpen ? { 'data-open': '' } : {}),
    'data-calendar': config.calendar,
    'data-granularity': config.granularity,
    'data-part': 'root',
    'data-size': config.size,
    'data-ui': 'datetime-range-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div
          {...(rootProps as DateTimeRangePickerRootProps & { ref?: React.Ref<HTMLDivElement> })}
        />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.draft, event)}
      >
        <DateTimeRangePanel
          calendar={{
            ...dateBoundsOf({ max, min }),
            ...firstDay,
            fixedWeeks,
            readOnly: !config.editable,
            timeZone: config.timeZone,
            weekNumbers,
          }}
          calendarRef={calendarRef}
          clock={{ ...reading, now: config.now.time, options, step: config.step }}
          clockRefs={clockRefs}
          confirm={config.confirm}
          field={{
            ...reading,
            ...firstDay,
            ...(relative === undefined ? {} : { relative }),
            ...(yearPivot === undefined ? {} : { yearPivot }),
            calendar: config.calendar,
            isDateUnavailable,
            isTimeUnavailable,
            max,
            maxTime,
            min,
            minTime,
            referenceDateTime,
            timeZone: config.timeZone,
          }}
          footer={footer}
          labels={{ start: t('start'), end: t('end') }}
          locale={config.locale}
          months={shownMonths}
          narrow={layer.narrow}
          panel={panel}
          position={position}
          renderSlot={renderSlot}
          today={config.now.date}
        />
      </PickerLayer>
    </>
  );
}

function posted(moment: PlainDateTime | null | undefined): string {
  return moment == null ? '' : toISODateTime(moment);
}
