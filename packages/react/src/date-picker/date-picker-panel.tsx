import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ReactNode } from 'react';

import { Calendar } from '../calendar';
import type { CalendarProps } from '../calendar';
import { useMessages } from '../i18n';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerHead } from '../picker-panel/picker-head';
import { PickerJump } from '../picker-panel/picker-jump';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerRail } from '../picker-panel/picker-rail';
import { PickerStep } from '../picker-panel/picker-step';
import type { useDatePanel } from './use-date-panel';

interface DatePickerPanelProps {
  readonly calendar: Partial<CalendarProps>;
  /** The picker may be cleared: `clearable`, and not `required`. */
  readonly clearable: boolean;
  readonly confirm: boolean;
  readonly footer: ReactNode;
  readonly locale: string;
  readonly months: number;
  readonly panel: ReturnType<typeof useDatePanel>;
  readonly refusal: string;
  readonly steps: boolean;
  readonly today: NonNullable<CalendarProps['defaultFocusedDate']>;
}

/** The shortcuts of a date beside its month. */
export function DatePickerPanel(props: DatePickerPanelProps) {
  const { calendar, confirm, footer, locale, months, panel, refusal, steps, today } = props;
  const t = useMessages(pickerPanelMessages);

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.canClear}
          clearable={props.clearable}
          confirm={confirm}
          hint={panel.refused ? refusal : (footer ?? panel.hint)}
          invalid={panel.refused}
          onApply={(event) => panel.write(panel.draft, event)}
          onClear={panel.clear}
        />
      }
      kind="date"
      rail={
        panel.presets.length > 0 && (
          <PickerRail presets={panel.presets}>
            {calendar.granularity !== 'month' && (
              <PickerJump
                locale={locale}
                max={calendar.max}
                min={calendar.min}
                months={months}
                onJump={panel.jump}
                selected={panel.selectedMonths}
                shown={panel.page}
                today={today}
              />
            )}
          </PickerRail>
        )
      }
    >
      <PickerHead
        {...panel.head}
        invalid={panel.refused}
        steps={
          steps && (
            <>
              <PickerStep
                direction="previous"
                label={t('previousDay')}
                onClick={(event) => panel.stepDay(-1, event)}
              />
              <PickerStep
                direction="next"
                label={t('nextDay')}
                onClick={(event) => panel.stepDay(1, event)}
              />
            </>
          )
        }
      />

      <div data-part="body" data-part-body="">
        <Calendar
          {...calendar}
          focusedDate={panel.focused ?? undefined}
          months={months}
          onFocusedDateChange={panel.setFocused}
          onPageChange={panel.setPage}
          onValueChange={(next, request) => panel.take(next, request.source, request.reason)}
          onViewChange={panel.setView}
          value={panel.draft}
          view={panel.view}
        />
      </div>
    </PickerPanel>
  );
}
