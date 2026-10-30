import { plainDate } from '@slotted/core/date';
import { Plus } from 'lucide-react';

import { Button } from '@slotted/react/button';
import { EventCalendar, type CalendarEvent } from '@slotted/react/event-calendar';
import { Page, PageBody } from '@slotted/react/page';

import { ScreenHeader } from './ScreenHeader';

const at = (month: number, day: number, hour: number, minute = 0) => ({
  date: plainDate(2026, month, day),
  time: { hour, minute, second: 0 },
});

const CALENDARS = [
  { key: 'dock', label: 'Dock' },
  { key: 'carriers', label: 'Carrier pickups' },
  { key: 'team', label: 'Team' },
];

const EVENTS: CalendarEvent[] = [
  {
    id: 'standup',
    title: 'Ops standup',
    start: at(9, 21, 8, 30),
    end: at(9, 21, 8, 50),
    calendar: 'team',
    recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    location: 'Reno floor',
  },
  {
    id: 'ups',
    title: 'UPS pickup',
    start: at(9, 21, 11, 0),
    end: at(9, 21, 11, 30),
    calendar: 'carriers',
    recurrence: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
    location: 'Dock 2',
  },
  {
    id: 'ups-late',
    title: 'UPS late pickup',
    start: at(9, 21, 16, 30),
    end: at(9, 21, 17, 0),
    calendar: 'carriers',
    recurrence: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    location: 'Dock 2',
  },
  {
    id: 'fedex',
    title: 'FedEx pickup',
    start: at(9, 22, 14, 0),
    end: at(9, 22, 14, 30),
    calendar: 'carriers',
    recurrence: 'FREQ=WEEKLY;BYDAY=TU,TH',
    location: 'Dock 1',
  },
  {
    id: 'inbound-kiln',
    title: 'Inbound PO-3474 · Kiln & Co.',
    start: at(9, 28, 9, 30),
    end: at(9, 28, 11, 30),
    calendar: 'dock',
    location: 'Dock 3 · 4 pallets',
  },
  {
    id: 'inbound-ridgeway',
    title: 'Inbound PO-3471 · Ridgeway Textiles',
    start: at(9, 29, 10, 0),
    end: at(9, 29, 12, 0),
    calendar: 'dock',
    location: 'Dock 3 · 2 pallets',
  },
  {
    id: 'count-c',
    title: 'Cycle count, aisle C',
    start: at(9, 30, 13, 0),
    end: at(9, 30, 15, 0),
    calendar: 'dock',
  },
  {
    id: 'returns',
    title: 'Returns inspection',
    start: at(9, 30, 9, 30),
    end: at(9, 30, 10, 30),
    calendar: 'team',
    location: 'Bench 4',
  },
  {
    id: 'inbound-basalt',
    title: 'Inbound PO-3469 · Basalt Metalworks',
    start: at(10, 1, 8, 0),
    end: at(10, 1, 10, 30),
    calendar: 'dock',
    location: 'Dock 1 · 6 pallets',
  },
  {
    id: 'rates',
    title: 'Carrier rate review',
    start: at(10, 1, 13, 30),
    end: at(10, 1, 14, 30),
    calendar: 'team',
    location: 'Room 2',
  },
  {
    id: 'count-f',
    title: 'Cycle count, aisle F',
    start: at(10, 1, 15, 0),
    end: at(10, 1, 16, 30),
    calendar: 'dock',
  },
  {
    id: 'peak',
    title: 'Peak season planning',
    start: at(10, 2, 10, 0),
    end: at(10, 2, 11, 30),
    calendar: 'team',
    location: 'Room 1',
  },
  {
    id: 'hiring',
    title: 'Seasonal hiring interviews',
    start: at(10, 2, 13, 0),
    end: at(10, 2, 15, 0),
    calendar: 'team',
  },
  { id: 'audit', title: 'Quarterly stock audit', start: plainDate(2026, 10, 2), calendar: 'dock' },
  {
    id: 'freeze',
    title: 'Price freeze for the catalog refresh',
    start: plainDate(2026, 9, 29),
    end: plainDate(2026, 9, 30),
    calendar: 'team',
  },
];

export function Calendar() {
  return (
    <Page landmark="none" width="bleed" inset={5} fill scroll="self">
      <ScreenHeader
        title="Calendar"
        subheading="Dock appointments, carrier pickups and team events · Reno, NV"
        actions={
          <Button size="sm" start={<Plus aria-hidden="true" size={14} strokeWidth={1.75} />}>
            New appointment
          </Button>
        }
      />
      <PageBody>
        <div className="console-calendar">
          <EventCalendar
            events={EVENTS}
            calendars={CALENDARS}
            defaultDate={plainDate(2026, 9, 30)}
            defaultView="week"
            views={['day', 'week', 'month', 'list']}
            dayHours={[8, 18]}
            weekends="hidden"
            locale="en-US"
            timeZone="UTC"
          />
        </div>
      </PageBody>
    </Page>
  );
}
