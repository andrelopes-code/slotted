import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/datetime-picker/datetime-picker.css';

import {
  createDateTimeFormat,
  dateBoundsOf,
  isRefusedDay,
  isRefusedMoment,
  isSameDateTime,
} from '@slotted/core/date';
import type { PlainDateTime } from '@slotted/core/date';
import { datetimePickerMessages } from '@slotted/core/i18n';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import type { ClockHandle } from '../clock';
import { DateTimeField } from '../datetime-field';
import type { DateTimeFieldHandle } from '../datetime-field';
import { useMessages } from '../i18n';
import { PickerLayer } from '../picker-panel/picker-layer';
import { isOpenChord, PickerTrigger } from '../picker-panel/picker-trigger';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { DateTimePickerPanel } from './datetime-picker-panel';
import type { DateTimePickerProps, DateTimePickerRootProps } from './datetime-picker.types';
import { useDateTimePanel } from './use-datetime-panel';
import { useDateTimePickerConfig } from './use-datetime-picker';

/**
 * A datetime field, a trigger, and a month beside a clock behind them.
 *
 * **The panel keeps a draft.** A day and a time are two presses and Apply
 * writes both; Escape and a press outside leave the value as it was.
 *
 * **The clock answers the day in the draft.** Its hours are the ones that day
 * is open for, so a closed Saturday refuses every one of them while the reader
 * is still deciding.
 *
 * **Two pairs of bounds apply at once.** `min`/`max` bound the whole value and
 * `minTime`/`maxTime` bound every day inside the range.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  const {
    calendar: _calendar,
    className,
    clearable = false,
    confirm: _confirm,
    defaultOpen = false,
    defaultValue,
    disabled: _disabled,
    firstDayOfWeek,
    footer,
    granularity: _granularity,
    hourCycle: _hourCycle,
    invalid,
    isDateUnavailable,
    isTimeUnavailable,
    locale: _locale,
    max,
    maxTime,
    messages,
    min,
    minTime,
    name,
    offsets,
    onKeyDown,
    onOpenChange,
    onValueChange,
    open,
    options,
    placement: _placement,
    presets,
    readOnly: _readOnly,
    ref,
    referenceDateTime,
    relative,
    render,
    renderSlot,
    required: _required,
    size: _size,
    step: _step,
    style,
    timeZone: _timeZone,
    value,
    variant: _variant,
    weekNumbers,
    ...nativeProps
  } = props;
  const config = useDateTimePickerConfig(props);
  /* A required value offers no control that empties it. */
  const clears = clearable && config.required !== true;
  const t = useMessages(datetimePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<DateTimeFieldHandle | null>(null);
  const clockRef = useRef<ClockHandle | null>(null);

  const rules = { isDateUnavailable, isTimeUnavailable, max, maxTime, min, minTime };
  const { held, requestValue } = usePickerValue<PlainDateTime | null>({
    defaultValue: defaultValue ?? null,
    equals: isSameDateTime,
    onValueChange,
    rootRef,
    value,
  });
  const layer = usePickerLayer({
    defaultOpen,
    focusPanel: focusDay,
    onEscape: () => walkDown(),
    onOpenChange,
    open,
    placement: config.placement,
    rootRef,
  });
  const panel = useDateTimePanel({
    ...config,
    clockRef,
    held,
    layer,
    offsets,
    onWrite: requestValue,
    options,
    presets,
    rules,
  });

  useImperativeHandle(ref, () => ({
    close: () => layer.setOpen(false, 'keyboard', undefined),
    focus: () => fieldRef.current?.focus(),
    open: () => layer.show('keyboard', undefined),
  }));

  const format = createDateTimeFormat(config);
  /* Focus returns to the trigger when the panel closes, so its name is where
     the reader is told what was chosen. */
  const spoken = held === null ? t('choose') : t('change', { date: format.describe(held) });
  const refused = held !== null && isRefusedMoment(held, rules);
  const resolvedInvalid = invalid ?? (refused ? true : config.fieldInvalid);
  const firstDay = firstDayOfWeek === undefined ? {} : { firstDayOfWeek };
  const clock = {
    granularity: config.granularity,
    hourCycle: config.hourCycle,
    locale: config.locale,
  };

  /** Escape walks the calendar's view down before it closes the panel. */
  function walkDown() {
    if (panel.view === 'day') return false;

    panel.setView(panel.view === 'year' ? 'month' : 'day');

    return true;
  }

  function handleControlKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event as never);
    if (event.defaultPrevented || !config.editable || !isOpenChord(event)) return;

    event.preventDefault();
    layer.show('keyboard', event, false);
  }

  const children = (
    <div data-part="control" data-part-control="" onKeyDown={handleControlKeyDown}>
      <DateTimeField
        {...rules}
        {...clock}
        {...firstDay}
        {...(relative === undefined ? {} : { relative })}
        calendar={config.calendar}
        clearable={clears}
        disabled={config.disabled}
        end={
          <PickerTrigger
            disabled={!config.editable}
            glyph="calendar"
            label={spoken}
            layer={layer}
          />
        }
        invalid={resolvedInvalid}
        name={name}
        onValueChange={(next, request) => requestValue(next, request.reason, request.source)}
        readOnly={config.readOnly}
        ref={fieldRef}
        referenceDateTime={referenceDateTime}
        required={config.required}
        size={config.size}
        timeZone={config.timeZone}
        value={held}
        variant={config.variant}
      />
    </div>
  );

  const rootProps: DateTimePickerRootProps = keyedProps({
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
    'data-ui': 'datetime-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as DateTimePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.moment, event)}
      >
        <DateTimePickerPanel
          clearable={clears}
          calendar={{
            ...dateBoundsOf(rules),
            ...firstDay,
            fixedWeeks: true,
            isDateUnavailable: (date) => isRefusedDay(date, rules),
            locale: config.locale,
            readOnly: !config.editable,
            timeZone: config.timeZone,
            today: config.statedToday,
            weekNumbers,
          }}
          clock={{
            ...clock,
            now: config.now.time,
            options,
            readOnly: !config.editable,
            renderSlot: renderSlot && ((state) => renderSlot({ ...state, date: panel.draft.date })),
            step: config.step,
          }}
          clockRef={clockRef}
          confirm={config.confirm}
          field={{ ...clock, readOnly: !config.editable, timeZone: config.timeZone }}
          footer={footer}
          locale={config.locale}
          narrow={layer.narrow}
          panel={panel}
          refusal={t('refused')}
          today={config.now.date}
        />
      </PickerLayer>
    </>
  );
}

/** Focus lands on the day that holds the tab stop. */
function focusDay(panel: HTMLElement) {
  panel
    .querySelector<HTMLElement>('[data-part="day"][tabindex="0"]')
    ?.focus({ preventScroll: true });
}
