import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/time-picker/time-picker.css';

import { createTimeFormat, isSameTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { timePickerMessages } from '@slotted/core/i18n';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import type { ClockHandle } from '../clock';
import { useMessages } from '../i18n';
import { PickerLayer } from '../picker-panel/picker-layer';
import { isOpenChord, PickerTrigger } from '../picker-panel/picker-trigger';
import { usePickerLayer } from '../picker-panel/use-picker-layer';
import { usePickerValue } from '../picker-panel/use-picker-value';
import { TimeField } from '../time-field';
import type { TimeFieldHandle } from '../time-field';
import { TimePickerPanel } from './time-picker-panel';
import type { TimePickerProps, TimePickerRootProps } from './time-picker.types';
import { useTimePanel } from './use-time-panel';
import { isRefusedTime, useTimePickerConfig } from './use-time-picker';

/**
 * A time field, a trigger, and a clock behind them.
 *
 * **The panel never takes the field away.** `Alt`+`ArrowDown` opens it and
 * leaves focus in the field, so the segments keep every key they had and the
 * clock follows what is typed.
 *
 * **The panel keeps a draft.** Apply writes it; Escape and a press outside
 * leave the value as it was.
 */
export function TimePicker(props: TimePickerProps) {
  const {
    className,
    clearable = false,
    confirm: _confirm,
    defaultOpen = false,
    defaultValue,
    disabled: _disabled,
    footer,
    granularity: _granularity,
    hourCycle: _hourCycle,
    invalid,
    isTimeUnavailable,
    locale: _locale,
    max,
    messages,
    min,
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
    referenceTime,
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
    ...nativeProps
  } = props;
  const config = useTimePickerConfig(props);
  const t = useMessages(timePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<TimeFieldHandle | null>(null);
  const clockRef = useRef<ClockHandle | null>(null);

  const { held, requestValue } = usePickerValue<PlainTime | null>({
    defaultValue: defaultValue ?? null,
    equals: isSameTime,
    onValueChange,
    rootRef,
    value,
  });
  const layer = usePickerLayer({
    defaultOpen,
    focusPanel: () => clockRef.current?.focus(),
    onOpenChange,
    open,
    placement: config.placement,
    rootRef,
  });
  const rules = { isTimeUnavailable, max, min };
  const panel = useTimePanel({
    ...config,
    ...rules,
    held,
    layer,
    offsets,
    onWrite: (next, source) => requestValue(next, 'select', source),
    options,
    presets,
  });

  useImperativeHandle(ref, () => ({
    close: () => layer.setOpen(false, 'keyboard', undefined),
    focus: () => fieldRef.current?.focus(),
    open: () => layer.show('keyboard', undefined),
  }));

  const format = createTimeFormat(config);
  /* Focus returns to the trigger when the panel closes, so its name is where
     the reader is told what was chosen. */
  const spoken = held === null ? t('choose') : t('change', { time: format.describe(held) });
  const resolvedInvalid = invalid ?? (isRefusedTime(held, rules) ? true : config.fieldInvalid);
  const reading = {
    ...rules,
    granularity: config.granularity,
    hourCycle: config.hourCycle,
    locale: config.locale,
  };

  function handleControlKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event as never);
    if (!config.editable || !isOpenChord(event)) return;

    event.preventDefault();
    layer.show('keyboard', event, false);
  }

  const children: ReactNode = (
    <div data-part="control" data-part-control="" onKeyDown={handleControlKeyDown}>
      <TimeField
        {...reading}
        clearable={clearable}
        disabled={config.disabled}
        end={
          <PickerTrigger disabled={!config.editable} glyph="clock" label={spoken} layer={layer} />
        }
        invalid={resolvedInvalid}
        name={name}
        onValueChange={(next, request) => requestValue(next, request.reason, request.source)}
        readOnly={config.readOnly}
        ref={fieldRef}
        referenceTime={referenceTime}
        relative={relative}
        required={config.required}
        size={config.size}
        timeZone={config.timeZone}
        value={held}
        variant={config.variant}
      />
    </div>
  );

  const rootProps: TimePickerRootProps = keyedProps({
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
    'data-ui': 'time-picker',
    'data-variant': config.variant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as TimePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}

      <PickerLayer
        label={spoken}
        layer={layer}
        onApply={(event) => panel.canApply && panel.write(panel.draft, event)}
      >
        <TimePickerPanel
          clock={{
            ...reading,
            now: config.now,
            options,
            readOnly: !config.editable,
            renderSlot,
            step: config.step,
          }}
          clockRef={clockRef}
          confirm={config.confirm}
          field={{
            ...reading,
            readOnly: !config.editable,
            referenceTime,
            timeZone: config.timeZone,
          }}
          footer={footer}
          panel={panel}
          refusal={t('refused')}
        />
      </PickerLayer>
    </>
  );
}
