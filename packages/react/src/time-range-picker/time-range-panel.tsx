import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ReactNode, RefObject } from 'react';

import { Clock } from '../clock';
import type { ClockHandle, ClockProps } from '../clock';
import { useMessages } from '../i18n';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerGroup } from '../picker-panel/picker-group';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerRail } from '../picker-panel/picker-rail';
import { PickerHalfButton, PickerRangeHead } from '../picker-panel/picker-range-head';
import { PickerRuler } from '../picker-panel/picker-ruler';
import { TimeField } from '../time-field';
import type { TimeFieldProps } from '../time-field';
import type { TimeRangePickerPosition } from './time-range-picker.types';
import type { useTimeRangePanel } from './use-time-range-panel';

interface TimeRangePanelProps {
  readonly clock: Partial<ClockProps>;
  readonly clockRefs: Record<TimeRangePickerPosition, RefObject<ClockHandle | null>>;
  readonly confirm: boolean;
  readonly field: Partial<TimeFieldProps>;
  readonly footer: ReactNode;
  readonly labels: Record<TimeRangePickerPosition, string>;
  readonly locale: string;
  /** One clock at a time, and the two ends as buttons: a field would open a keyboard. */
  readonly narrow: boolean;
  readonly panel: ReturnType<typeof useTimeRangePanel>;
  readonly position: TimeRangePickerPosition;
  readonly step: number;
}

/** The two ends of a run of times over the day, and a clock for each. */
export function TimeRangePanel(props: TimeRangePanelProps) {
  const { clock, clockRefs, confirm, field, footer, labels, locale, narrow, panel } = props;
  const { position, step } = props;
  const t = useMessages(pickerPanelMessages);
  const hasRail = panel.presets.length > 0 || panel.durations.length > 0;

  const halfOf = (which: TimeRangePickerPosition) => ({
    ...panel[which],
    current: position === which,
    invalid: panel.refusal !== null && which === 'end',
    label: labels[which],
    onEnter: () => panel.enter(which, 'pointer', undefined),
    value: narrow ? (
      <PickerHalfButton
        current={position === which}
        onClick={(event) => panel.enter(which, 'pointer', event)}
        part="time"
      >
        {panel[which].text}
      </PickerHalfButton>
    ) : (
      <TimeField
        {...field}
        aria-label={labels[which]}
        onValueChange={(next, request) => panel.type(which, next, request.source)}
        size="sm"
        value={panel.draft?.[which] ?? null}
        variant="plain"
      />
    ),
  });

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.canClear}
          confirm={confirm}
          hint={panel.refusal ?? footer ?? panel.hint}
          invalid={panel.refusal !== null}
          onApply={(event) => panel.write(panel.draft, event)}
          onClear={panel.clear}
        />
      }
      kind="time-range"
      rail={
        hasRail && (
          <PickerRail presets={panel.presets}>
            {panel.durations.length > 0 && (
              <PickerGroup chips={panel.durations} label={t('duration')} />
            )}
          </PickerRail>
        )
      }
    >
      <PickerRangeHead end={halfOf('end')} span={panel.span} start={halfOf('start')} />

      <PickerRuler
        end={panel.draft?.end ?? null}
        hourCycle={clock.hourCycle}
        locale={locale}
        model={panel.model}
        onMove={panel.drag}
        start={panel.draft?.start ?? null}
        step={step}
      />

      <div data-part="clocks" data-part-clocks="">
        {(['start', 'end'] as const).map((which) => (
          <Clock
            {...clock}
            {...(which === 'end' ? panel.closing : {})}
            {...(position === which ? { 'data-current': '' } : {})}
            aria-label={labels[which]}
            key={which}
            onFocus={() => panel.enter(which, 'keyboard', undefined)}
            onValueChange={(next, request) => panel.press(which, next, request)}
            ref={clockRefs[which]}
            value={panel.draft?.[which] ?? null}
          />
        ))}
      </div>
    </PickerPanel>
  );
}
