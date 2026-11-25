import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ReactNode, Ref } from 'react';

import { Clock } from '../clock';
import type { ClockHandle, ClockProps } from '../clock';
import { useMessages } from '../i18n';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerGroup } from '../picker-panel/picker-group';
import { PickerTimeHead } from '../picker-panel/picker-head';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerRail } from '../picker-panel/picker-rail';
import { TimeField } from '../time-field';
import type { TimeFieldProps } from '../time-field';
import type { useTimePanel } from './use-time-panel';

interface TimePickerPanelProps {
  readonly clock: Partial<ClockProps>;
  readonly clockRef: Ref<ClockHandle>;
  /** The picker may be cleared: `clearable`, and not `required`. */
  readonly clearable: boolean;
  readonly confirm: boolean;
  readonly field: Partial<TimeFieldProps>;
  readonly footer: ReactNode;
  readonly panel: ReturnType<typeof useTimePanel>;
  readonly refusal: string;
}

/** The shortcuts of a time beside its clock. */
export function TimePickerPanel({
  clock,
  clockRef,
  clearable,
  confirm,
  field,
  footer,
  panel,
  refusal,
}: TimePickerPanelProps) {
  const t = useMessages(pickerPanelMessages);
  const hasRail = panel.presets.length > 0 || panel.offsets.length > 0;

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.draft !== null}
          clearable={clearable}
          confirm={confirm}
          hint={panel.refused ? refusal : (footer ?? panel.hint)}
          invalid={panel.refused}
          onApply={(event) => panel.write(panel.draft, event)}
          onClear={(event) => {
            if (confirm) panel.setDraft(null);
            else panel.write(null, event);
          }}
        />
      }
      kind="time"
      rail={
        hasRail && (
          <PickerRail presets={panel.presets}>
            {panel.offsets.length > 0 && <PickerGroup chips={panel.offsets} label={t('fromNow')} />}
          </PickerRail>
        )
      }
    >
      <PickerTimeHead label={t('time')} meta={panel.meta}>
        <TimeField
          {...field}
          aria-label={t('time')}
          onValueChange={(next, request) => panel.type(next, request.source)}
          size="sm"
          value={panel.draft}
          variant="plain"
        />
      </PickerTimeHead>

      <div data-part="body" data-part-body="">
        <Clock
          {...clock}
          aria-label={t('time')}
          onValueChange={panel.handleClock}
          ref={clockRef}
          value={panel.draft}
        />
      </div>
    </PickerPanel>
  );
}
