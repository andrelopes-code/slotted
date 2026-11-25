import { pickerPanelMessages } from '@slotted/core/i18n';
import type { ReactNode, Ref } from 'react';

import { Calendar } from '../calendar';
import type { CalendarProps } from '../calendar';
import { Clock } from '../clock';
import type { ClockHandle, ClockProps } from '../clock';
import { useMessages } from '../i18n';
import { PickerFooter } from '../picker-panel/picker-footer';
import { PickerGroup } from '../picker-panel/picker-group';
import { PickerHead, PickerTimeHead } from '../picker-panel/picker-head';
import { PickerJump } from '../picker-panel/picker-jump';
import { PickerPanel } from '../picker-panel/picker-panel';
import { PickerRail } from '../picker-panel/picker-rail';
import { PickerStep } from '../picker-panel/picker-step';
import { TimeField } from '../time-field';
import type { TimeFieldProps } from '../time-field';
import type { useDateTimePanel } from './use-datetime-panel';

interface DateTimePickerPanelProps {
  readonly calendar: Partial<CalendarProps>;
  readonly clock: Partial<ClockProps>;
  readonly clockRef: Ref<ClockHandle>;
  readonly confirm: boolean;
  readonly field: Partial<TimeFieldProps>;
  readonly footer: ReactNode;
  readonly locale: string;
  /** One part at a time: each head brings its own. */
  readonly narrow: boolean;
  readonly panel: ReturnType<typeof useDateTimePanel>;
  readonly refusal: string;
  readonly today: NonNullable<CalendarProps['defaultFocusedDate']>;
}

/** The shortcuts of a moment, its month and its clock. */
export function DateTimePickerPanel(props: DateTimePickerPanelProps) {
  const { calendar, clock, clockRef, confirm, field, footer, locale, narrow } = props;
  const { panel, refusal, today } = props;
  const t = useMessages(pickerPanelMessages);

  const reveal = (part: 'day' | 'time') =>
    narrow ? { onShow: () => panel.setShowing(part), shown: panel.showing === part } : undefined;

  return (
    <PickerPanel
      footer={
        <PickerFooter
          canApply={panel.canApply}
          canClear={panel.canClear}
          confirm={confirm}
          hint={panel.refused ? refusal : (footer ?? panel.hint)}
          invalid={panel.refused}
          onApply={(event) => panel.write(panel.moment, event)}
          onClear={panel.clear}
        />
      }
      kind="datetime"
      rail={
        panel.presets.length > 0 && (
          <PickerRail presets={panel.presets}>
            <PickerJump
              locale={locale}
              max={calendar.max}
              min={calendar.min}
              months={1}
              onJump={panel.jump}
              selected={panel.selectedMonths}
              shown={panel.page}
              today={today}
            />
          </PickerRail>
        )
      }
      showing={panel.showing}
      side={
        <>
          <PickerTimeHead label={t('time')} meta={panel.timeMeta} reveal={reveal('time')}>
            <TimeField
              {...field}
              aria-label={t('time')}
              onValueChange={panel.typeTime}
              size="sm"
              value={panel.draft.time}
              variant="plain"
            />
          </PickerTimeHead>

          <div data-part="body" data-part-body="">
            <Clock
              {...clock}
              {...panel.times}
              aria-label={t('time')}
              onValueChange={panel.takeTime}
              ref={clockRef}
              value={panel.draft.time}
            />
            {panel.offsets.length > 0 && (
              <PickerGroup chips={panel.offsets} label={t('now')} part="offsets" />
            )}
          </div>
        </>
      }
    >
      <PickerHead
        {...panel.head}
        invalid={panel.refused}
        reveal={reveal('day')}
        steps={
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
        }
      />

      <div data-part="body" data-part-body="">
        <Calendar
          {...calendar}
          defaultFocusedDate={panel.anchor}
          focusedDate={panel.focused ?? undefined}
          onFocusedDateChange={panel.setFocused}
          onPageChange={panel.setPage}
          onValueChange={(next, request) => panel.takeDay(next, request.source)}
          onViewChange={panel.setView}
          value={panel.draft.date}
          view={panel.view}
        />
      </div>
    </PickerPanel>
  );
}
