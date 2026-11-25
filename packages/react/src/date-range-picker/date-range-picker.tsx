import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/date-range-picker/date-range-picker.css';

import { createDateFormat, lengthOf } from '@slotted/core/date';
import { dateRangePickerMessages } from '@slotted/core/i18n';
import { useId, useImperativeHandle, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { isSameValue } from '../calendar';
import type { CalendarHandle, DateRange } from '../calendar';
import type { DateFieldHandle } from '../date-field';
import { useMessages } from '../i18n';
import { PickerLayer } from '../picker-panel/picker-layer';
import { isOpenChord, PickerTrigger } from '../picker-panel/picker-trigger';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerPosition } from '../picker-panel/use-picker-position';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { DateRangeControl } from './date-range-control';
import { DateRangePanel } from './date-range-panel';
import type {
  DateRangePickerPosition,
  DateRangePickerProps,
  DateRangePickerRootProps,
} from './date-range-picker.types';
import { normalizeRange } from './range-words';
import { useDateRangePickerConfig, useRangeProblems, useRangeRules } from './use-date-range-picker';
import { useRangePanel } from './use-range-panel';

/**
 * Two date fields in one frame, a trigger, and the months of a run behind them.
 *
 * **It composes the fields, the calendar and the panel and redraws none of
 * them.** This family owns the frame, the trigger and which end is being
 * edited.
 *
 * **The head says how long the run is while it is being drawn.** The calendar
 * reports the pending end — the day under the pointer, or the focused day —
 * and the length between the two halves says "4 nights" for it, in a live
 * region, so a reader hears it on every arrow as much as they see it.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the run as it was.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const {
    calendar: _calendar,
    className,
    clearable = false,
    confirm: _confirm,
    contiguous: _contiguous,
    count: _count,
    defaultOpen = false,
    defaultPosition: _defaultPosition,
    defaultValue,
    disabled: _disabled,
    endName,
    firstDayOfWeek,
    fixedWeeks = false,
    footer,
    invalid,
    isDateUnavailable,
    locale: _locale,
    max,
    maxLength: _maxLength,
    messages,
    min,
    minLength: _minLength,
    months: _months,
    onKeyDown,
    onOpenChange,
    onPositionChange: _onPositionChange,
    onValueChange,
    open,
    placement: _placement,
    position: _position,
    presets = [],
    readOnly: _readOnly,
    ref,
    render,
    required: _required,
    size: _size,
    startName,
    style,
    timeZone: _timeZone,
    value,
    variant: _variant,
    weekNumbers,
    yearPivot,
    ...nativeProps
  } = props;
  const config = useDateRangePickerConfig(props);
  const t = useMessages(dateRangePickerMessages, messages);
  const id = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const startRef = useRef<DateFieldHandle | null>(null);
  const endRef = useRef<DateFieldHandle | null>(null);
  const calendarRef = useRef<CalendarHandle | null>(null);

  const rules = useRangeRules(props, config.count);
  const [position, requestPosition] = usePickerPosition(props);
  const { held, requestValue } = usePickerValue<DateRange | null>({
    defaultValue: normalizeRange(defaultValue ?? null),
    equals: isSameValue,
    onValueChange,
    rootRef,
    value: value === undefined ? undefined : normalizeRange(value),
  });
  const problems = useRangeProblems(held, rules);
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
  const panel = useRangePanel({
    ...config,
    held,
    layer,
    onPosition: (next, source) => {
      if (next !== position) requestPosition(next, 'select', source);
    },
    onWrite: requestValue,
    position,
    presets,
    rules,
    t,
  });

  useImperativeHandle(ref, () => ({
    close: () => layer.setOpen(false, 'keyboard', undefined),
    focus: (which) => focusField(which ?? position),
    open: () => layer.show('keyboard', undefined),
  }));

  const labels = { end: t('end'), start: t('start') };
  const spoken = spokenOf(held);
  const resolvedInvalid = invalid ?? (problems.length > 0 ? true : config.fieldInvalid);
  const shownMonths = layer.narrow ? 1 : config.months;
  const firstDay = firstDayOfWeek === undefined ? {} : { firstDayOfWeek };

  /** The trigger's accessible name: focus returns here when the panel closes. */
  function spokenOf(run: DateRange | null) {
    const { end, start } = run ?? { end: null, start: null };
    if (start === null || end === null || problems.includes('order')) return t('choose');

    const format = createDateFormat({ locale: config.locale });
    const length = t(`${config.count}.length` as const, { count: lengthOf(run, rules) });

    return t('change', { end: format.describe(end), length, start: format.describe(start) });
  }

  function focusField(which: DateRangePickerPosition) {
    (which === 'end' ? endRef : startRef).current?.focus();
  }

  /** Escape walks the calendar's view down before it closes the panel. */
  function walkDown() {
    if (panel.view === 'day') return false;

    panel.setView(panel.view === 'year' ? 'month' : 'day');

    return true;
  }

  function handleControlKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event as never);
    if (!config.editable || !isOpenChord(event)) return;

    event.preventDefault();
    layer.show('keyboard', event, false);
  }

  function handleClear(source: unknown) {
    requestValue(null, 'clear', source);
    if (position !== 'start') requestPosition('start', 'clear', source);
    focusField('start');
  }

  const children = (
    <DateRangeControl
      clear={clearable && held !== null ? { label: t('clear'), onPress: handleClear } : null}
      editable={config.editable}
      field={{
        ...firstDay,
        ...(yearPivot === undefined ? {} : { yearPivot }),
        calendar: config.calendar,
        disabled: config.disabled,
        isDateUnavailable,
        locale: config.locale,
        max,
        min,
        readOnly: config.readOnly,
        required: config.required,
        size: config.size,
        timeZone: config.timeZone,
      }}
      fieldRefs={{ end: endRef, start: startRef }}
      held={held}
      id={id}
      labels={labels}
      names={{ end: endName, start: startName }}
      onKeyDown={handleControlKeyDown}
      onPosition={requestPosition}
      onValue={(next, reason, source) => requestValue(normalizeRange(next), reason, source)}
      position={position}
      reversed={problems.includes('order')}
      trigger={
        <PickerTrigger disabled={!config.editable} glyph="calendar" label={spoken} layer={layer} />
      }
    />
  );

  const rootProps: DateRangePickerRootProps = keyedProps({
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
    'data-count': config.count,
    'data-part': 'root',
    'data-size': config.size,
    'data-ui': 'date-range-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as DateRangePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.draft, event)}
      >
        <DateRangePanel
          calendar={{
            ...firstDay,
            fixedWeeks,
            max,
            min,
            readOnly: !config.editable,
            timeZone: config.timeZone,
            weekNumbers,
          }}
          calendarRef={calendarRef}
          confirm={config.confirm}
          footer={footer}
          labels={labels}
          locale={config.locale}
          months={shownMonths}
          panel={panel}
          position={position}
          today={config.today}
        />
      </PickerLayer>
    </>
  );
}
