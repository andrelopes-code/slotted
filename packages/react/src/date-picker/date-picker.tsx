import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/date-picker/date-picker.css';

import { createDateFormat } from '@slotted/core/date';
import { datePickerMessages } from '@slotted/core/i18n';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { asDates, isRange, isSameValue } from '../calendar';
import type { CalendarValue } from '../calendar';
import { DateField } from '../date-field';
import type { DateFieldHandle } from '../date-field';
import { useMessages } from '../i18n';
import { PickerLayer } from '../picker-panel/picker-layer';
import { isOpenChord, PickerTrigger } from '../picker-panel/picker-trigger';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { isRefusedDate } from './date-panel';
import { DatePickerPanel } from './date-picker-panel';
import type { DatePickerProps, DatePickerRootProps } from './date-picker.types';
import { dayPropsOf } from './month-picker';
import type { DatePickerBaseProps } from './month-picker';
import { useDatePanel } from './use-date-panel';
import { useDatePickerConfig } from './use-date-picker';

/**
 * A date field, a trigger, and a month behind them.
 *
 * **It composes the other families and redraws none.** The field keeps its own
 * `data-ui` and the calendar keeps its own; this family owns the box the panel
 * hangs from and the trigger inside the field's end slot.
 *
 * **The trigger's name carries the chosen date.** Focus returns to it when the
 * panel closes, so the name is where the reader is told what was chosen.
 *
 * **A month is its own value.** Under `granularity="month"` the picker holds a
 * `PlainYearMonth`; the field and the calendar below it hold the first day of
 * that month, and the conversion happens here, at the one boundary.
 */
export function DatePicker(props: DatePickerProps) {
  return <Picker {...(props.granularity === 'month' ? dayPropsOf(props) : props)} />;
}

function Picker(props: DatePickerBaseProps) {
  const {
    calendar: _calendar,
    className,
    clearable = false,
    confirm: _confirm,
    defaultOpen = false,
    defaultValue,
    defaultView,
    disabled: _disabled,
    firstDayOfWeek,
    fixedWeeks = true,
    footer,
    granularity,
    invalid,
    isDateUnavailable,
    locale: _locale,
    max,
    messages,
    min,
    months = 1,
    name,
    onKeyDown,
    onOpenChange,
    onValueChange,
    open,
    placement: _placement,
    presets = [],
    readOnly: _readOnly,
    ref,
    render,
    required: _required,
    selectionMode: _selectionMode,
    size: _size,
    style,
    timeZone: _timeZone,
    value,
    variant: _variant,
    weekNumbers,
    yearPivot,
    ...nativeProps
  } = props;
  const config = useDatePickerConfig(props);
  /* A required value offers no control that empties it. */
  const clears = clearable && config.required !== true;
  const t = useMessages(datePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<DateFieldHandle | null>(null);

  const monthly = granularity === 'month';
  const rules = { isDateUnavailable, max, min };
  const { held, requestValue } = usePickerValue<CalendarValue>({
    defaultValue: defaultValue ?? null,
    equals: isSameValue,
    onValueChange,
    rootRef,
    value,
  });
  const layer = usePickerLayer({
    defaultOpen,
    focusPanel: focusCalendar,
    onEscape: () => walkDown(),
    onOpenChange,
    open,
    placement: config.placement,
    rootRef,
  });
  /* The lowest view is where a choice is made: the days, or the months. */
  const lowest = monthly ? 'month' : 'day';
  const panel = useDatePanel({
    ...config,
    defaultView: defaultView ?? lowest,
    held,
    layer,
    monthly,
    onWrite: requestValue,
    presets,
    rules,
  });

  useImperativeHandle(ref, () => ({
    close: () => layer.setOpen(false, 'keyboard', undefined),
    focus: () => fieldRef.current?.focus(),
    open: () => layer.show('keyboard', undefined),
  }));

  const format = createDateFormat({ locale: config.locale });
  const chosen = asDates(held).map((date) =>
    monthly ? format.monthYear(date) : format.describe(date),
  );
  const spoken = chosen.length === 0 ? t('choose') : t('change', { date: chosen.join(' – ') });
  const resolvedInvalid = invalid ?? (isRefusedDate(held, rules) ? true : config.fieldInvalid);
  const shownMonths = layer.narrow ? 1 : months;
  const firstDay = firstDayOfWeek === undefined ? {} : { firstDayOfWeek };
  const typed = isRange(held) || Array.isArray(held) ? {} : { value: held };

  /** Escape walks the calendar's view down before it closes the panel. */
  function walkDown() {
    if (panel.view === lowest) return false;

    panel.setView(panel.view === 'year' ? 'month' : lowest);

    return true;
  }

  function handleControlKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event as never);
    if (!config.editable || !isOpenChord(event)) return;

    event.preventDefault();
    layer.show('keyboard', event);
  }

  const children = (
    <div data-part="control" data-part-control="" onKeyDown={handleControlKeyDown}>
      <DateField
        {...rules}
        {...firstDay}
        {...typed}
        {...(yearPivot === undefined ? {} : { yearPivot })}
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
        granularity={granularity}
        invalid={resolvedInvalid}
        locale={config.locale}
        name={name}
        onValueChange={(next, request) => requestValue(next, request.reason, request.source)}
        readOnly={config.readOnly}
        ref={fieldRef}
        required={config.required}
        size={config.size}
        timeZone={config.timeZone}
        variant={config.variant}
      />
    </div>
  );

  const rootProps: DatePickerRootProps = keyedProps({
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
    'data-part': 'root',
    'data-size': config.size,
    'data-ui': 'date-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as DatePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.draft, event)}
      >
        <DatePickerPanel
          clearable={clears}
          calendar={{
            ...rules,
            ...firstDay,
            /* Two months of different lengths end where the longer one does. */
            fixedWeeks: fixedWeeks && shownMonths === 1,
            granularity,
            locale: config.locale,
            readOnly: !config.editable,
            selectionMode: config.selectionMode,
            timeZone: config.timeZone,
            today: config.statedToday,
            weekNumbers,
          }}
          confirm={config.confirm}
          footer={footer}
          locale={config.locale}
          months={shownMonths}
          panel={panel}
          refusal={t('refused')}
          steps={config.editable && config.selectionMode === 'single' && !monthly}
          today={config.today}
        />
      </PickerLayer>
    </>
  );
}

/** Focus lands on the day, or the month, that holds the tab stop. */
export function focusCalendar(panel: HTMLElement) {
  panel
    .querySelector<HTMLElement>(
      '[data-part="day"][tabindex="0"], [data-part="period"][tabindex="0"]',
    )
    ?.focus({ preventScroll: true });
}
