import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import { SlCalendar } from './calendar';
import { provideCalendarDefaults } from './calendar-defaults';
import type { CalendarSelectionMode } from './calendar-defaults';
import { ANGULAR_CALENDAR_DOCS, ANGULAR_CALENDAR_TOKENS } from './calendar.docs';

interface CalendarStoryArgs {
  fixedWeeks: boolean;
  locale: string;
  months: number;
  selectionMode: CalendarSelectionMode;
  weekNumbers: boolean;
}

const NINTH: PlainDate = plainDate(2026, 9, 9);

/** Saturday and Sunday, which is the predicate a booking flow writes first. */
const isWeekend = (date: PlainDate) => {
  const day = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return day === 0 || day === 6;
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CALENDAR_DOCS.calendar.scenes, {
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

const meta: Meta<CalendarStoryArgs> = {
  title: 'Components/Calendar',
  component: SlCalendar,
  decorators: [moduleMetadata({ imports: [SlCalendar] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Calendar',
        description:
          'A month as the APG draws it: a real table carrying the grid role, one cell in the tab sequence, and a heading that announces itself when a key pages it. It collects one date, a run of them or a set, and it answers its own width rather than the page’s.',
        framework: 'Angular',
        ...ANGULAR_CALENDAR_DOCS.calendar,
        tokens: ANGULAR_CALENDAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CalendarStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A narrow column, for showing what the grid does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    fixedWeeks: false,
    locale: 'pt-BR',
    months: 1,
    selectionMode: 'single',
    weekNumbers: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ninth: NINTH },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slCalendar
          aria-label="Escolher data"
          [locale]="locale"
          [months]="months"
          [selectionMode]="selectionMode"
          [weekNumbers]="weekNumbers"
          [fixedWeeks]="fixedWeeks"
          [defaultFocusedDate]="ninth"
        ></div>
      </div>`,
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    props: { ninth: NINTH, seventeenth: plainDate(2026, 9, 17) },
    template: grid(
      1,
      scene(
        'One date',
        'Press a day, then press it again: the second press takes it back, which is the only way to empty the value without a control of its own.',
        `<div
           slCalendar
           locale="pt-BR"
           aria-label="Uma data"
           [defaultFocusedDate]="ninth"
           [defaultValue]="seventeenth"
         ></div>`,
      ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    props: {
      ninth: NINTH,
      run: { start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) },
      dates: [plainDate(2026, 9, 3), plainDate(2026, 9, 12), plainDate(2026, 9, 21)],
    },
    template: grid(
      1,
      scene(
        'A run of days',
        'Choose the 11th and then the 7th: the range is the 7th to the 11th, not one that runs backwards. A third press starts again.',
        `<div
           slCalendar
           locale="pt-BR"
           selectionMode="range"
           aria-label="Period"
           [defaultFocusedDate]="ninth"
           [defaultValue]="run"
         ></div>`,
      ) +
        scene(
          'A set of days',
          'Every press adds a date and a second press on the same one takes it out again, which is how a set is narrowed without a second control.',
          `<div
             slCalendar
             locale="pt-BR"
             selectionMode="multiple"
             aria-label="Several days"
             [defaultFocusedDate]="ninth"
             [defaultValue]="dates"
           ></div>`,
        ),
    ),
  }),
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => ({
    props: { ninth: NINTH, birth: plainDate(1986, 5, 2) },
    template: grid(
      1,
      scene(
        'Day, month and year',
        'Press the heading twice to reach the years, then Escape twice to come back. Escape walks down a view and out of nothing, so a surface above the calendar keeps its own key.',
        `<div slCalendar locale="pt-BR" aria-label="Vistas" [defaultFocusedDate]="ninth"></div>`,
      ) +
        scene(
          'Opening on the years',
          'A birth-date field opens here rather than on a month four hundred pages away from the one the reader wants.',
          `<div
             slCalendar
             locale="pt-BR"
             defaultView="year"
             aria-label="Nascimento"
             [defaultFocusedDate]="birth"
           ></div>`,
        ),
    ),
  }),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => ({
    props: {
      ninth: NINTH,
      run: { start: plainDate(2026, 9, 28), end: plainDate(2026, 10, 3) },
    },
    template: grid(
      1,
      scene(
        'Two months',
        'Each grid carries its own caption, because the heading above now names the span and nothing else would say where October starts.',
        `<div
           slCalendar
           locale="pt-BR"
           selectionMode="range"
           aria-label="Dois meses"
           [months]="2"
           [defaultFocusedDate]="ninth"
           [defaultValue]="run"
         ></div>`,
      ) +
        scene(
          'The same two, in half the room',
          'The second month wraps under the first rather than being withdrawn: a month the consumer asked for is not something to take away at a threshold.',
          measure(
            `<div
               slCalendar
               locale="pt-BR"
               aria-label="Estreito"
               [months]="2"
               [defaultFocusedDate]="ninth"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'pt-BR',
        'The week opens on Sunday, and the month name is the locale’s own — nothing here ships a table of names.',
        `<div slCalendar locale="pt-BR" aria-label="Brasil" [defaultFocusedDate]="ninth"></div>`,
      ) +
        scene(
          'de-DE',
          'The same directive opens its week on Monday, because getWeekInfo says so for the region and not because anything was configured.',
          `<div slCalendar locale="de-DE" aria-label="Deutschland" [defaultFocusedDate]="ninth"></div>`,
        ) +
        scene(
          'ja-JP',
          'Narrow weekday names one character wide, and a heading in the locale’s own order — the grid holds its columns either way.',
          `<div slCalendar locale="ja-JP" aria-label="日本" [defaultFocusedDate]="ninth"></div>`,
        ) +
        scene(
          'A product that fixes the day',
          'firstDayOfWeek overrides the locale, for a business whose week starts on Monday wherever its readers are.',
          `<div
             slCalendar
             locale="pt-BR"
             aria-label="Monday week"
             [firstDayOfWeek]="1"
             [defaultFocusedDate]="ninth"
           ></div>`,
        ),
    ),
  }),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => ({
    props: {
      ninth: NINTH,
      first: plainDate(2026, 9, 1),
      last: plainDate(2026, 9, 30),
    },
    template: grid(
      1,
      scene(
        'Fenced to one month',
        'Arrow towards either edge: the reader stops at it rather than paging past, and a day outside the range cannot be pressed.',
        `<div
           slCalendar
           locale="pt-BR"
           aria-label="Setembro"
           [min]="first"
           [max]="last"
           [defaultFocusedDate]="ninth"
         ></div>`,
      ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: { ninth: NINTH, isWeekend },
    template: grid(
      1,
      scene(
        'No weekends',
        'Arrow onto a Saturday: focus lands on it, the cell says aria-disabled, and the number is struck through — so the refusal survives a palette the reader’s system replaced.',
        `<div
           slCalendar
           locale="pt-BR"
           aria-label="Business days"
           [isDateUnavailable]="isWeekend"
           [defaultFocusedDate]="ninth"
         ></div>`,
      ),
    ),
  }),
};

export const WeekNumbers: Story = {
  parameters: scenario('week-numbers'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      1,
      scene(
        'ISO week numbers',
        'A row header rather than a cell, with a rule between it and the days: without the rule the column reads as an eighth day of the week.',
        `<div
           slCalendar
           locale="pt-BR"
           weekNumbers
           fixedWeeks
           aria-label="Weeks"
           [firstDayOfWeek]="1"
           [defaultFocusedDate]="ninth"
         ></div>`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { ninth: NINTH, seventeenth: plainDate(2026, 9, 17) },
    template: grid(
      1,
      scene(
        'Read-only',
        'Every date is still legible and the reader may still arrow around; nothing answers a press. It must not be mistakable for disabled.',
        `<div
           slCalendar
           locale="pt-BR"
           readOnly
           aria-label="Somente leitura"
           [defaultFocusedDate]="ninth"
           [defaultValue]="seventeenth"
         ></div>`,
      ) +
        scene(
          'Disabled',
          'No cell is in the tab sequence, the triggers are out, and today is painted in the disabled ink rather than in the tone that says act on me.',
          `<div
             slCalendar
             locale="pt-BR"
             disabled
             aria-label="Desativado"
             [defaultFocusedDate]="ninth"
             [defaultValue]="seventeenth"
           ></div>`,
        ) +
        scene(
          'Invalid',
          'Tab into it: the ring is retargeted to the danger color rather than removed, because a focus indicator is a focus indicator before it is an error.',
          `<div
             slCalendar
             locale="pt-BR"
             invalid
             aria-label="Invalid"
             [defaultFocusedDate]="ninth"
           ></div>`,
        ),
    ),
  }),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'At the room it wants',
        'Seven columns at the control height. Switch the toolbar to compact and to dense: the cell follows the control scale down and the type with it.',
        `<div
           slCalendar
           locale="pt-BR"
           fixedWeeks
           aria-label="Comfortable"
           [defaultFocusedDate]="ninth"
         ></div>`,
      ) +
        scene(
          'Below 320 pixels',
          'The cell is the room there is divided by the columns there are, bounded by the WCAG 2.2 minimum below — so it shrinks and nothing is taken away.',
          measure(
            `<div
               slCalendar
               locale="pt-BR"
               fixedWeeks
               aria-label="Estreito"
               [defaultFocusedDate]="ninth"
             ></div>`,
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { ninth: NINTH, christmas: plainDate(2026, 12, 25) },
    template: grid(
      1,
      scene(
        'Set once for the application',
        'The provider decides the week’s first day and the fixed grid for everything under it, and provideSlotted the language, so a product does not repeat three inputs on every calendar.',
        `<div slCalendar aria-label="Herdado" [defaultFocusedDate]="ninth"></div>`,
      ) +
        scene(
          'A template reaches the instance',
          'exportAs hands the directive back, so focusDate() pages the grid from a button beside it and currentView() is readable without an event handler.',
          `<div
             slCalendar
             #cal="slCalendar"
             locale="pt-BR"
             aria-label="Controlado"
             [defaultFocusedDate]="ninth"
           ></div>
           <button type="button" (click)="cal.focusDate(christmas)">Ir para o Natal</button>
           <span>vista: {{ cal.currentView() }}</span>`,
        ),
    ),
  }),
  decorators: [
    moduleMetadata({
      imports: [SlCalendar],
      providers: [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
        provideCalendarDefaults({ firstDayOfWeek: 1, fixedWeeks: true }),
      ],
    }),
  ],
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { january: plainDate(2026, 1, 31), lastDay: plainDate(2026, 9, 30) },
    template: grid(
      1,
      scene(
        'The grid pattern, key by key',
        'Tab into the grid and try PageDown from 31 January: February shows the 28th, because the APG clamps to the last day a short month has rather than spilling into March.',
        `<div slCalendar locale="pt-BR" aria-label="Teclado" [defaultFocusedDate]="january"></div>`,
      ) +
        scene(
          'Arrows page the grid when they leave it',
          'From the last day of a month, ArrowRight moves to the first of the next and the grid follows — the reader never has to reach for the trigger.',
          `<div slCalendar locale="pt-BR" aria-label="Virada" [defaultFocusedDate]="lastDay"></div>`,
        ),
    ),
  }),
};
