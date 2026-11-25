import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/clock/clock.css';

import type { PlainTime } from '@slotted/core/date';
import { clockMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { useImperativeHandle, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

import { useMessages } from '../i18n';
import { ClockBody } from './clock-body';
import type { ClockProps, ClockRootProps, ClockUnitName } from './clock.types';
import { useClockView } from './use-clock-view';

/**
 * Every hour of the day in one grid, and the minutes of the step under it.
 *
 * A press on an hour writes a whole time: the minutes held stay, and minutes
 * the new hour refuses give way to the nearest it accepts. A stated list of
 * times (`options`) is drawn as whole times instead.
 */
export function Clock({
  defaultValue,
  disabled = false,
  granularity = 'minute',
  hourCycle,
  isTimeUnavailable,
  locale,
  max,
  messages,
  min,
  now,
  onValueChange,
  options,
  readOnly = false,
  ref,
  render,
  renderSlot,
  step,
  value,
  ...nativeProps
}: ClockProps) {
  const t = useMessages(clockMessages, messages);

  const [own, setOwn] = useState<PlainTime | null>(defaultValue ?? null);
  const rootRef = useRef<HTMLElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () =>
      rootRef.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus(),
  }));

  const held = value === undefined ? own : value;
  const view = useClockView({
    granularity,
    held,
    hourCycle,
    isTimeUnavailable,
    locale,
    max,
    min,
    now,
    options,
    periods: [t('night'), t('morning'), t('afternoon'), t('evening')],
    step,
  });

  function request(next: PlainTime | null, unit: ClockUnitName, event: MouseEvent) {
    if (next === null || disabled || readOnly) return;

    const state = createControllable<PlainTime | null>({
      controlled: value,
      initial: held,
      /* A press on the time held is still an answer: the reader is done with it. */
      equals: () => false,
      onRequest: (asked) => onValueChange?.(asked.value, Object.assign(asked, { unit })),
    });
    /* A press from a key carries no click count. */
    if (state.request(next, event.detail === 0 ? 'keyboard' : 'pointer', event)) setOwn(next);
  }

  const children = (
    <ClockBody
      disabled={disabled}
      held={held}
      onRequest={request}
      renderSlot={renderSlot}
      t={t}
      view={view}
    />
  );

  const rootProps: ClockRootProps = keyedProps({
    role: 'group',
    ...nativeProps,
    children,
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(readOnly ? { 'data-readonly': '' } : {}),
    ...(view.slots === null ? {} : { 'data-slots': '' }),
    'data-granularity': granularity,
    'data-part': 'root',
    'data-ui': 'clock',
    ref: rootRef,
  }) as ClockRootProps;

  return render === undefined ? (
    <div {...(rootProps as ClockRootProps & { ref?: React.Ref<HTMLDivElement> })} />
  ) : (
    render(rootProps)
  );
}
