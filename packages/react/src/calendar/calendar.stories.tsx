import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { SlottedProvider } from '../i18n';
import { Calendar } from './calendar';
import { CalendarDefaultsProvider } from './calendar-defaults';
import { Grid, Measure, Scene } from './calendar-demo';
import { REACT_CALENDAR_DOCS, REACT_CALENDAR_TOKENS } from './calendar.docs';
import type { CalendarHandle, CalendarValue, DateRange } from './calendar.types';

const NINTH = plainDate(2026, 9, 9);

/** Saturday and Sunday, which is the predicate a booking flow writes first. */
const isWeekend = (date: PlainDate) => {
  const day = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return day === 0 || day === 6;
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CALENDAR_DOCS.calendar.scenes, {
    playground: Playground,
    selection: Selection,
    range: Range,
    views: Views,
    months: Months,
    locale: Locale,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    'week-numbers': WeekNumbers,
    states: States,
    density: Density,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Calendar',
        description:
          'A month as the APG draws it: a real table carrying the grid role, one cell in the tab sequence, and a heading that announces itself when a key pages it. It collects one date, a run of them or a set, and it answers its own width rather than the page’s.',
        framework: 'React',
        ...REACT_CALENDAR_DOCS.calendar,
        tokens: REACT_CALENDAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    fixedWeeks: false,
    locale: 'pt-BR',
    months: 1,
    selectionMode: 'single',
    weekNumbers: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Calendar {...args} aria-label="Escolher data" defaultFocusedDate={NINTH} />
    </div>
  ),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: function SelectionStory() {
    const [value, setValue] = useState<CalendarValue>(plainDate(2026, 9, 17));

    return (
      <Grid columns={1}>
        <Scene
          label="One date"
          note="Press a day, then press it again: the second press takes it back, which is the only way to empty the value without a control of its own."
        >
          <Calendar
            aria-label="Uma data"
            defaultFocusedDate={NINTH}
            locale="pt-BR"
            onValueChange={setValue}
            value={value}
          />
        </Scene>
      </Grid>
    );
  },
};

export const Range: Story = {
  parameters: scenario('range'),
  render: function RangeStory() {
    const [run, setRun] = useState<CalendarValue>({
      start: plainDate(2026, 9, 7),
      end: plainDate(2026, 9, 11),
    });
    const [dates, setDates] = useState<CalendarValue>([
      plainDate(2026, 9, 3),
      plainDate(2026, 9, 12),
      plainDate(2026, 9, 21),
    ]);

    return (
      <Grid columns={1}>
        <Scene
          label="A run of days"
          note="Choose the 11th and then the 7th: the range is the 7th to the 11th, not one that runs backwards. A third press starts again."
        >
          <Calendar
            aria-label="Period"
            defaultFocusedDate={NINTH}
            locale="pt-BR"
            onValueChange={setRun}
            selectionMode="range"
            value={run}
          />
        </Scene>
        <Scene
          label="A set of days"
          note="Every press adds a date and a second press on the same one takes it out again, which is how a set is narrowed without a second control."
        >
          <Calendar
            aria-label="Multiple days"
            defaultFocusedDate={NINTH}
            locale="pt-BR"
            onValueChange={setDates}
            selectionMode="multiple"
            value={dates}
          />
        </Scene>
      </Grid>
    );
  },
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Day, month and year"
        note="Press the heading twice to reach the years, then Escape twice to come back. Escape walks down a view and out of nothing, so a surface above the calendar keeps its own key."
      >
        <Calendar aria-label="Vistas" defaultFocusedDate={NINTH} locale="pt-BR" />
      </Scene>
      <Scene
        label="Opening on the years"
        note="A birth-date field opens here rather than on a month four hundred pages away from the one the reader wants."
      >
        <Calendar
          aria-label="Nascimento"
          defaultFocusedDate={plainDate(1986, 5, 2)}
          defaultView="year"
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two months"
        note="Each grid carries its own caption, because the heading above now names the span and nothing else would say where October starts."
      >
        <Calendar
          aria-label="Dois meses"
          defaultFocusedDate={NINTH}
          defaultValue={{ start: plainDate(2026, 9, 28), end: plainDate(2026, 10, 3) }}
          locale="pt-BR"
          months={2}
          selectionMode="range"
        />
      </Scene>
      <Scene
        label="The same two, in half the room"
        note="The second month wraps under the first rather than being withdrawn: a month the consumer asked for is not something to take away at a threshold."
      >
        <Measure>
          <Calendar aria-label="Estreito" defaultFocusedDate={NINTH} locale="pt-BR" months={2} />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="pt-BR"
        note="The week opens on Sunday, and the month name is the locale’s own — nothing here ships a table of names."
      >
        <Calendar aria-label="Brasil" defaultFocusedDate={NINTH} locale="pt-BR" />
      </Scene>
      <Scene
        label="de-DE"
        note="The same component opens its week on Monday, because getWeekInfo says so for the region and not because anything was configured."
      >
        <Calendar aria-label="Deutschland" defaultFocusedDate={NINTH} locale="de-DE" />
      </Scene>
      <Scene
        label="ja-JP"
        note="Narrow weekday names one character wide, and a heading in the locale’s own order — the grid holds its columns either way."
      >
        <Calendar aria-label="日本" defaultFocusedDate={NINTH} locale="ja-JP" />
      </Scene>
      <Scene
        label="A product that fixes the day"
        note="firstDayOfWeek overrides the locale, for a business whose week starts on Monday wherever its readers are."
      >
        <Calendar
          aria-label="Week starting Monday"
          defaultFocusedDate={NINTH}
          firstDayOfWeek={1}
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Fenced to one month"
        note="Arrow towards either edge: the reader stops at it rather than paging past, and a day outside the range cannot be pressed."
      >
        <Calendar
          aria-label="Setembro"
          defaultFocusedDate={NINTH}
          locale="pt-BR"
          max={plainDate(2026, 9, 30)}
          min={plainDate(2026, 9, 1)}
        />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="No weekends"
        note="Arrow onto a Saturday: focus lands on it, the cell says aria-disabled, and the number is struck through — so the refusal survives a palette the reader’s system replaced."
      >
        <Calendar
          aria-label="Weekdays"
          defaultFocusedDate={NINTH}
          isDateUnavailable={isWeekend}
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const WeekNumbers: Story = {
  parameters: scenario('week-numbers'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="ISO week numbers"
        note="A row header rather than a cell, with a rule between it and the days: without the rule the column reads as an eighth day of the week."
      >
        <Calendar
          aria-label="Weeks"
          defaultFocusedDate={NINTH}
          firstDayOfWeek={1}
          fixedWeeks
          locale="pt-BR"
          weekNumbers
        />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Read-only"
        note="Every date is still legible and the reader may still arrow around; nothing answers a press. It must not be mistakable for disabled."
      >
        <Calendar
          aria-label="Somente leitura"
          defaultFocusedDate={NINTH}
          defaultValue={plainDate(2026, 9, 17)}
          locale="pt-BR"
          readOnly
        />
      </Scene>
      <Scene
        label="Disabled"
        note="No cell is in the tab sequence, the triggers are out, and today is painted in the disabled ink rather than in the tone that says act on me."
      >
        <Calendar
          aria-label="Desativado"
          defaultFocusedDate={NINTH}
          defaultValue={plainDate(2026, 9, 17)}
          disabled
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="Invalid"
        note="Tab into it: the ring is retargeted to the danger colour rather than removed, because a focus indicator is a focus indicator before it is an error."
      >
        <Calendar aria-label="Invalid" defaultFocusedDate={NINTH} invalid locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="At the room it wants"
        note="Seven columns at the control height. Switch the toolbar to compact and to dense: the cell follows the control scale down and the type with it."
      >
        <Calendar aria-label="Comfortable" defaultFocusedDate={NINTH} fixedWeeks locale="pt-BR" />
      </Scene>
      <Scene
        label="Below 320 pixels"
        note="The cell is the room there is divided by the columns there are, bounded by the WCAG 2.2 minimum below — so it shrinks and nothing is taken away."
      >
        <Measure>
          <Calendar aria-label="Estreito" defaultFocusedDate={NINTH} fixedWeeks locale="pt-BR" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<CalendarHandle | null>(null);
    const [focused, setFocused] = useState<PlainDate>(NINTH);

    return (
      <Grid columns={1}>
        <Scene
          label="Set once for the application"
          note="The provider decides the week’s first day and the fixed grid for everything under it, and SlottedProvider the language, so a product does not repeat three props on every calendar."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <CalendarDefaultsProvider firstDayOfWeek={1} fixedWeeks>
              <Calendar aria-label="Herdado" defaultFocusedDate={NINTH} />
            </CalendarDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="The date the reader is on, owned outside"
          note="focusedDate is a value of its own, so a product can page the calendar from a control beside it — and hear every arrow the reader presses."
          layout="stack"
        >
          <Calendar
            aria-label="Controlado"
            focusedDate={focused}
            locale="pt-BR"
            onFocusedDateChange={setFocused}
            ref={handle}
          />
          <Button
            onClick={() => handle.current?.focusDate(plainDate(2026, 12, 25))}
            variant="outline"
          >
            Ir para o Natal
          </Button>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The grid pattern, key by key"
        note="Tab into the grid and try PageDown from 31 January: February shows the 28th, because the APG clamps to the last day a short month has rather than spilling into March."
      >
        <Calendar aria-label="Teclado" defaultFocusedDate={plainDate(2026, 1, 31)} locale="pt-BR" />
      </Scene>
      <Scene
        label="Arrows page the grid when they leave it"
        note="From the last day of a month, ArrowRight moves to the first of the next and the grid follows — the reader never has to reach for the trigger."
      >
        <Calendar aria-label="Virada" defaultFocusedDate={plainDate(2026, 9, 30)} locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export type { DateRange };
