import { timeOfSeconds, withClockHour, withClockMinute, withClockSecond } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import type { ClockMessages, FamilyTranslator } from '@slotted/core/i18n';
import type { MouseEvent } from 'react';

import { ClockGroups } from './clock-groups';
import { ClockUnits } from './clock-units';
import type { ClockProps, ClockUnitName } from './clock.types';
import type { useClockView } from './use-clock-view';

interface ClockBodyProps extends Pick<ClockProps, 'renderSlot'> {
  readonly disabled: boolean;
  readonly held: PlainTime | null;
  readonly onRequest: (next: PlainTime | null, unit: ClockUnitName, event: MouseEvent) => void;
  readonly t: FamilyTranslator<ClockMessages>;
  readonly view: ReturnType<typeof useClockView>;
}

const MIDNIGHT: PlainTime = { hour: 0, minute: 0, second: 0 };

/** The three grids of a stepped clock, or the one grid of a stated list. */
export function ClockBody({ disabled, held, onRequest, renderSlot, t, view }: ClockBodyProps) {
  const { model, slots } = view;
  /* A minute pressed before any hour is a minute of the first hour on offer. */
  const from = held ?? model.nearest(MIDNIGHT);

  if (slots !== null && slots.length === 0) {
    return (
      <div data-part="empty" data-part-empty="">
        {t('empty')}
      </div>
    );
  }

  if (slots !== null) {
    return (
      <ClockGroups
        disabled={disabled}
        groups={slots}
        label={t('times')}
        onPick={(seconds, event) => onRequest(timeOfSeconds(seconds), 'slot', event)}
        renderSlot={renderSlot}
        unit="slot"
      />
    );
  }

  return (
    <>
      <ClockGroups
        disabled={disabled}
        groups={view.hours}
        label={t('hours')}
        onPick={(hour, event) => onRequest(withClockHour(model, held, hour), 'hour', event)}
        unit="hour"
      />

      {view.minutes.length > 0 && (
        <ClockUnits
          cells={view.minutes}
          disabled={disabled}
          label={t('minutes')}
          onPick={(minute, event) =>
            onRequest(from && withClockMinute(model, from, minute), 'minute', event)
          }
          unit="minute"
        />
      )}

      {view.seconds.length > 0 && (
        <ClockUnits
          cells={view.seconds}
          disabled={disabled}
          label={t('seconds')}
          onPick={(second, event) =>
            onRequest(from && withClockSecond(model, from, second), 'second', event)
          }
          unit="second"
        />
      )}
    </>
  );
}
