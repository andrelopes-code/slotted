import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDateTimeField } from './datetime-field';
import type {
  DateTimeFieldHourCycle,
  DateTimeFieldSize,
  DateTimeFieldVariant,
} from './datetime-field-defaults';
import { SlDateTimeFieldEnd, SlDateTimeFieldStart } from './datetime-field-parts';
import {
  ANGULAR_DATE_TIME_FIELD_DOCS,
  ANGULAR_DATE_TIME_FIELD_TOKENS,
} from './datetime-field.docs';

interface DateTimeFieldStoryArgs {
  clearable: boolean;
  granularity: 'hour' | 'minute' | 'second';
  hourCycle: DateTimeFieldHourCycle | undefined;
  locale: string;
  relative: boolean;
  size: DateTimeFieldSize;
  variant: DateTimeFieldVariant;
}

/** A consultation on a Thursday afternoon, and the clinic it belongs to. */
const CONSULTATION: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
const WITH_SECONDS: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 45));
const MIDNIGHT_HALF: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(0, 30));
/** Stated rather than read from the clock, so every scene reads the same twice. */
const REFERENCE: PlainDateTime = plainDateTime(plainDate(2026, 9, 10), plainTime(14, 40));
const LAST_NIGHT_OF_THE_MONTH: PlainDateTime = plainDateTime(
  plainDate(2026, 9, 30),
  plainTime(23, 0),
);
const END_OF_JANUARY: PlainDateTime = plainDateTime(plainDate(2026, 1, 31), plainTime(15, 20));

const CLINIC = {
  max: plainDateTime(plainDate(2026, 12, 20), plainTime(12, 0)),
  maxTime: plainTime(18, 0),
  min: plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0)),
  minTime: plainTime(9, 0),
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_TIME_FIELD_DOCS.dateTimeField.scenes, {
    playground: Playground,
    locale: Locale,
    'hour-cycle': HourCycle,
    granularity: Granularity,
    incomplete: Incomplete,
    relative: Relative,
    'rolls-day': RollsDay,
    sizes: Sizes,
    variants: Variants,
    range: Range,
    unavailable: Unavailable,
    narrow: Narrow,
    states: States,
    clear: Clear,
    adornments: Adornments,
    forms: Forms,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlDateTimeField,
  SlDateTimeFieldEnd,
  SlDateTimeFieldStart,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<DateTimeFieldStoryArgs> = {
  title: 'Components/DateTimeField',
  component: SlDateTimeField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DateTime Field',
        description:
          'A date and a time typed as one value, one field at a time, in the order the reader’s own locale writes both halves — and, when the reader would rather say "two days from now", a duration resolved in view before it is accepted. It is not a date field beside a time field: one group, one value, and one run of typing that crosses from the year into the hour. The control belongs in a reactive form, and reports the half that is still missing as validity of its own.',
        framework: 'Angular',
        ...ANGULAR_DATE_TIME_FIELD_DOCS.dateTimeField,
        tokens: ANGULAR_DATE_TIME_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateTimeFieldStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
  /**
   * How small this scene's subject may legitimately be, in pixels.
   * `tools/harness/audit.mjs` reports anything under 96 pixels in a wide stage
   * as collapsed, which is right for a demonstration and wrong for a row of
   * small buttons.
   */
  collapseFloor?: number,
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div
      class="slotted-demo-stage"
      data-layout="${layout}"
      ${collapseFloor === undefined ? '' : `data-collapse-floor="${String(collapseFloor)}"`}
    >${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    clearable: true,
    granularity: 'minute',
    hourCycle: undefined,
    locale: 'pt-BR',
    relative: true,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, reference: REFERENCE },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Appointment start</label>
          <div
            slDateTimeField
            name="start"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [granularity]="granularity"
            [hourCycle]="hourCycle"
            [clearable]="clearable"
            [relative]="relative"
            [referenceDateTime]="reference"
          ></div>
          <span slFieldDescription>The appointment starts on this date and time.</span>
        </div>
      </div>`,
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'pt-BR',
        'Day, month, year and then the time, with a comma between the two halves — all coming from a single Intl.DateTimeFormat.',
        `<div slDateTimeField locale="pt-BR" aria-label="Start" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" aria-label="Empty start"></div>`,
      ) +
        scene(
          'en-US',
          'The month leads, and a sixth field appears: the day period, whose spoken value is AM or PM because 0 and 1 are not names.',
          `<div slDateTimeField locale="en-US" aria-label="Starts" [defaultValue]="value"></div>
           <div slDateTimeField locale="en-US" aria-label="Empty"></div>`,
        ) +
        scene(
          'ja-JP',
          'The year comes first and the boundary between the halves is just a space — so nothing is drawn there and the gap of the row itself does the separating.',
          `<div slDateTimeField locale="ja-JP" aria-label="開始" [defaultValue]="value"></div>
           <div slDateTimeField locale="ja-JP" aria-label="空"></div>`,
        ) +
        scene(
          'fr-FR',
          'Same order as pt-BR and a different boundary: a space instead of the comma. Two separate families would never know which of the two the locale writes.',
          `<div slDateTimeField locale="fr-FR" aria-label="Début" [defaultValue]="value"></div>
           <div slDateTimeField locale="fr-FR" aria-label="Vide"></div>`,
        ),
    ),
  }),
};

export const HourCycle: Story = {
  parameters: scenario('hour-cycle'),
  render: () => ({
    props: { value: MIDNIGHT_HALF },
    template: grid(
      2,
      scene(
        'Doze, em en-US',
        'h12: a hora corre de 1 a 12 e a meia-noite escreve-se 12 AM.',
        `<div slDateTimeField locale="en-US" aria-label="Twelve" [hourCycle]="12" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Twelve, in ja-JP',
          'h11: the same axis, and the hour runs from 0 to 11. A boolean would have written 12 here.',
          `<div slDateTimeField locale="ja-JP" aria-label="Eleven" [hourCycle]="12" [defaultValue]="value"></div>`,
        ) +
        scene(
          'Twenty-four',
          'h23: no day period, and the hour runs from 0 to 23.',
          `<div slDateTimeField locale="en-US" aria-label="Twenty-four" [hourCycle]="24" [defaultValue]="value"></div>`,
        ) +
        scene(
          'What the locale wants',
          'With no declared axis, each control asks Intl and receives what the locale of the reader itself writes.',
          `<div slDateTimeField locale="pt-BR" aria-label="Locale" [defaultValue]="value"></div>
           <div slDateTimeField locale="en-US" aria-label="Locale en" [defaultValue]="value"></div>`,
        ),
    ),
  }),
};

export const Granularity: Story = {
  parameters: scenario('granularity'),
  render: () => ({
    props: { value: CONSULTATION, withSeconds: WITH_SECONDS },
    template: grid(
      1,
      scene(
        'Three depths, and one half that never shrinks',
        'Granularity governs the time half. The date half is always whole: a datetime without a day is a date, and that family is date-field.',
        `<div slDateTimeField locale="pt-BR" granularity="hour" aria-label="Hour" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" granularity="minute" aria-label="Minute" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" granularity="second" aria-label="Segundo" [defaultValue]="withSeconds"></div>`,
      ),
    ),
  }),
};

export const Incomplete: Story = {
  parameters: scenario('incomplete'),
  render: () => ({
    props: {
      form: new FormGroup({
        start: new FormControl<PlainDateTime | null>(null),
      }),
      reference: REFERENCE,
    },
    template: grid(
      2,
      scene(
        'Half written, and the missing one said aloud',
        'Type only the date and leave the control with Tab. The value is null, as in every implementation surveyed — and which half is missing is what neither of them can say.',
        `<div slDateTimeField locale="pt-BR" aria-label="Unfinished" [referenceDateTime]="reference"></div>`,
      ) +
        scene(
          'The error a reactive form reads',
          'slottedDateTimeIncomplete arrives with the missing half inside it, and the dateTimeIncomplete of Kendo — the only surveyed implementation that validates — does not carry it.',
          `<form [formGroup]="form">
             <div slField [invalid]="form.controls.start.touched && form.controls.start.invalid">
               <label slFieldLabel>Start</label>
               <div slDateTimeField locale="pt-BR" formControlName="start"></div>
               <span slFieldDescription>Errors: {{ form.controls.start.errors | json }}</span>
             </div>
           </form>`,
        ),
    ),
  }),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => ({
    props: { reference: REFERENCE },
    template: grid(
      2,
      scene(
        'Press + and type a duration',
        '+40m, 1h30, +2d, +1w, -15, 0. The anchor is always now and never the value the field holds, and what the expression resolves to is drawn beside it before Enter accepts anything.',
        `<div slDateTimeField locale="pt-BR" aria-label="Duration" [referenceDateTime]="reference"></div>`,
      ) +
        scene(
          'Everything it writes is reachable without it',
          'The expression is a shortcut and never the only entry: the same value is written with digits, step by step or by page.',
          `<div slDateTimeField locale="pt-BR" aria-label="No duration" [relative]="false" [referenceDateTime]="reference"></div>`,
        ),
    ),
  }),
};

export const RollsDay: Story = {
  parameters: scenario('rolls-day'),
  render: () => ({
    props: { lastNight: LAST_NIGHT_OF_THE_MONTH },
    template: grid(
      1,
      scene(
        '+2h at 23:00 on the last day of the month',
        'This is where the crossesMidnight flag of time-field is spent. There, a PlainTime has no day beside it and can only raise a warning; here the day exists, so the duration moves it and the preview writes the new date and lifts it off the adjacent hour.',
        `<div slDateTimeField locale="pt-BR" aria-label="Rolls over the day" [referenceDateTime]="lastNight"></div>`,
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'On its own',
        'Three steps of type, height and inner padding, all from the control scales the theme restates per density.',
        `<div slDateTimeField locale="pt-BR" size="sm" aria-label="Small" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" size="md" aria-label="Default" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" size="lg" aria-label="Large" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Inside a field',
          'The control takes the step of the field instead of its own default, so a form row does not end up with two sizes.',
          `<div slField size="sm">
             <label slFieldLabel>Start</label>
             <div slDateTimeField locale="pt-BR" [defaultValue]="value"></div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Fim</label>
             <div slDateTimeField locale="pt-BR" [defaultValue]="value"></div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'On the page',
        'outline takes the ground where it stands, subtle sinks into it, and plain shows nothing at rest.',
        `<div slDateTimeField locale="pt-BR" variant="outline" aria-label="Outline" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" variant="subtle" aria-label="Subtle" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" variant="plain" aria-label="Plain" [defaultValue]="value"></div>`,
      ) +
        scene(
          'In a dense row',
          'plain is what a table of time entries wants: nothing until the pointer or the keyboard arrive.',
          `<div slDateTimeField locale="pt-BR" variant="plain" size="sm" aria-label="Check-in" [defaultValue]="value"></div>
           <div slDateTimeField locale="pt-BR" variant="plain" size="sm" aria-label="Check-out" [defaultValue]="value"></div>`,
          'row',
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    props: {
      ...CLINIC,
      inside: plainDateTime(plainDate(2026, 9, 15), plainTime(10, 0)),
      outsideWindow: plainDateTime(plainDate(2026, 9, 15), plainTime(20, 0)),
      beforeStart: CONSULTATION,
      firstDay: plainDateTime(plainDate(2026, 9, 11), plainTime(10, 0)),
    },
    template: grid(
      2,
      scene(
        'Inside both fences',
        'September 15 at 10:00 is after min and inside the window that repeats every day. Both pairs hold at the same time.',
        `<div
           slDateTimeField
           locale="pt-BR"
           aria-label="Dentro"
           [min]="min"
           [max]="max"
           [minTime]="minTime"
           [maxTime]="maxTime"
           [defaultValue]="inside"
         ></div>`,
      ) +
        scene(
          'Outside the window of the day',
          '20:00 on a day inside the range is refused by maxTime and reported as slottedDateTimeWindow, even though it is long before max.',
          `<div
             slDateTimeField
             locale="pt-BR"
             aria-label="Fora da janela"
             [min]="min"
             [max]="max"
             [minTime]="minTime"
             [maxTime]="maxTime"
             [defaultValue]="outsideWindow"
           ></div>`,
        ) +
        scene(
          'Before the start of the range',
          'September 10 is inside the daily window and before min — refused by the pair of the whole value, and reported as slottedDateTimeRange.',
          `<div
             slDateTimeField
             locale="pt-BR"
             aria-label="Antes"
             [min]="min"
             [max]="max"
             [minTime]="minTime"
             [maxTime]="maxTime"
             [defaultValue]="beforeStart"
           ></div>`,
        ) +
        scene(
          'The first day is partial',
          'On the day of min itself the window starts at min and not at minTime — the rule MDN states for the platform and that no surveyed script implements.',
          `<div
             slDateTimeField
             locale="pt-BR"
             aria-label="First day"
             [min]="min"
             [max]="max"
             [minTime]="minTime"
             [maxTime]="maxTime"
             [defaultValue]="firstDay"
           ></div>`,
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: {
      isSunday: (date: PlainDate) =>
        new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 0,
      isLunch: (time: PlainTime) => time.hour === 12,
      sunday: plainDateTime(plainDate(2026, 9, 13), plainTime(10, 0)),
      lunch: plainDateTime(plainDate(2026, 9, 15), plainTime(12, 30)),
    },
    template: grid(
      2,
      scene(
        'A closed Sunday',
        'isDateUnavailable answers for a whole day. It is the question a calendar cell asks, and it cannot be derived from a datetime predicate without walking every step of that day.',
        `<div
           slDateTimeField
           locale="pt-BR"
           aria-label="Domingo"
           [isDateUnavailable]="isSunday"
           [defaultValue]="sunday"
         ></div>`,
      ) +
        scene(
          'A lunch hour',
          'isTimeUnavailable receives the day as well, so that a Saturday closes earlier than a Tuesday. Both report slottedDateTimeUnavailable.',
          `<div
             slDateTimeField
             locale="pt-BR"
             aria-label="Lunch"
             [isTimeUnavailable]="isLunch"
             [defaultValue]="lunch"
           ></div>`,
        ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { withSeconds: WITH_SECONDS, value: CONSULTATION },
    template: grid(
      2,
      scene(
        'The row breaks between the halves',
        'Seven fields do not fit in a narrow column in any locale, and the row breaks between the two boxes and never inside one. No container query: the break holds at any width.',
        measure(
          `<div slDateTimeField locale="pt-BR" granularity="second" aria-label="Narrow" [defaultValue]="withSeconds"></div>`,
        ),
      ) +
        scene(
          'The comma stays at the end of the line',
          'The boundary the locale writes is drawn at the end of the first half, not between the two — so a break leaves it where a comma in a sentence would stay.',
          measure(
            `<div slDateTimeField locale="en-US" aria-label="Narrow" [defaultValue]="value"></div>`,
          ),
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: {
      value: CONSULTATION,
      endOfJanuary: END_OF_JANUARY,
      reference: REFERENCE,
      outside: plainDateTime(plainDate(2026, 9, 15), plainTime(20, 0)),
      ...CLINIC,
    },
    template: grid(
      2,
      scene(
        'Read-only and disabled',
        'Read-only stays focusable and copyable and never looks like disabled. Disabled answers to no key and no pointer — and in a reactive form it arrives through setDisabledState and not through this input.',
        `<div slDateTimeField locale="pt-BR" readOnly aria-label="Read-only" [defaultValue]="value"></div>
         <div slDateTimeField locale="pt-BR" disabled aria-label="Disabled" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Invalid and required, inside a field',
          'The message belongs to the field and the state to the control. Color alone never says invalid.',
          `<div slField invalid>
             <label slFieldLabel>Appointment start</label>
             <div
               slDateTimeField
               locale="pt-BR"
               [min]="min"
               [max]="max"
               [minTime]="minTime"
               [maxTime]="maxTime"
               [defaultValue]="outside"
             ></div>
             <span slFieldError>Choose a time within business hours.</span>
           </div>
           <div slField required>
             <label slFieldLabel>Fim da consulta</label>
             <div slDateTimeField locale="pt-BR"></div>
           </div>`,
        ) +
        scene(
          'Incomplete is lower than invalid',
          'A warning tone, one step below the danger the refused value receives — because nothing the reader typed is wrong, it is only unfinished. And it yields to invalid when both are true.',
          `<div slDateTimeField locale="pt-BR" aria-label="Incomplete" [referenceDateTime]="reference"></div>`,
        ) +
        scene(
          'The day a short month did not hold',
          'January 31 rolling into February is 28, and rolling again is March 31 — the requested day survives the month that could not hold it.',
          `<div slDateTimeField locale="pt-BR" aria-label="January" [defaultValue]="endOfJanuary"></div>`,
        ),
    ),
  }),
};

export const Clear: Story = {
  parameters: scenario('clear'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'One button, both halves',
        'There is no control that clears one side only: half a half is not a value this family holds. Focus returns to the first segment.',
        `<div
           slDateTimeField
           locale="pt-BR"
           clearable
           [messages]="{ clear: 'Clear' }"
           aria-label="With value"
           [defaultValue]="value"
         ></div>`,
      ) +
        scene(
          'Only when there is something to clear',
          'The button appears only with something written and with the control editable, so the frame does not keep a space that is never used.',
          `<div slDateTimeField locale="pt-BR" clearable aria-label="Empty"></div>
           <div
             slDateTimeField
             locale="pt-BR"
             clearable
             readOnly
             aria-label="Read-only"
             [defaultValue]="value"
           ></div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      2,
      scene(
        'A mark before the value',
        'A directive on the element of the consumer itself, so nothing loses its semantics and any icon inside is sized by the glyph scale of the control.',
        `<div slDateTimeField locale="pt-BR" aria-label="With mark" [defaultValue]="value">
           <span slDateTimeFieldStart>at</span>
         </div>`,
      ) +
        scene(
          'A time zone after it',
          'The value is a wall-clock time and carries no time zone; an application that knows it writes the label here. It is also the slot where datetime-picker puts its trigger.',
          `<div slDateTimeField locale="pt-BR" aria-label="With time zone" [defaultValue]="value">
             <span slDateTimeFieldEnd>PST</span>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: {
      form: new FormGroup({
        start: new FormControl<PlainDateTime | null>(CONSULTATION),
      }),
    },
    template: grid(
      1,
      scene(
        'A reactive form',
        'ControlValueAccessor reads and writes the control, and Validator reports slottedDateTimeIncomplete, slottedDateTimeRange, slottedDateTimeWindow and slottedDateTimeUnavailable — validity that nothing outside this control can see. It is the integration point for which React has no equivalent.',
        `<form [formGroup]="form">
           <div slField>
             <label slFieldLabel>Appointment start</label>
             <div slDateTimeField locale="pt-BR" formControlName="start" name="start" required></div>
             <span slFieldDescription>Control value: {{ form.value.start | json }}</span>
           </div>
         </form>`,
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { value: CONSULTATION, withSeconds: WITH_SECONDS },
    template: grid(
      2,
      scene(
        'A long day period',
        'es-MX writes a. m. and p. m., and the box is sized by the wider of the two names the locale uses — not by two characters, which would cut the first.',
        `<div slDateTimeField locale="es-MX" aria-label="Español" [hourCycle]="12" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Right to left',
          'Each half is its own bidirectional run, so the digits read left to right inside a mirrored page. The alternative was a capture that read 30:14 — a time nobody typed.',
          `<div slDateTimeField locale="ar-EG" aria-label="العربية" [defaultValue]="value"></div>`,
        ) +
        scene(
          'Seven fields and a numbering system of its own',
          'The digits the locale writes are read back by the same parser that wrote them, at any granularity.',
          `<div
             slDateTimeField
             locale="ja-JP"
             granularity="second"
             aria-label="日本語"
             [defaultValue]="withSeconds"
           ></div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { value: CONSULTATION },
    template: grid(
      1,
      scene(
        'The instance a template reaches',
        'exportAs gives the template the component itself: focus() puts the reader on the first segment, focusEntry() on the first field still unfilled, and clear() empties both halves with the reason clear. provideDateTimeFieldDefaults declares the clock once for everything below, and provideSlotted the language.',
        `<div
           slDateTimeField
           #start="slDateTimeField"
           locale="pt-BR"
           aria-label="With instance"
           [defaultValue]="value"
         ></div>
         <button type="button" (click)="start.focus()">Focus</button>
         <button type="button" (click)="start.focusEntry()">First empty</button>
         <button type="button" (click)="start.clear()">Clear</button>`,
        'row',
        40,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { value: WITH_SECONDS, reference: REFERENCE },
    template: grid(
      1,
      scene(
        'Put focus in it and try',
        'The arrows cross the boundary between the halves in a single row — from the year to the hour and back; PageUp moves the year 10, the month 5, the day 5, the hour 3, the minute 15 and the second 15; Home and End take a field to its own limit; Backspace empties one; and +, - or = open a duration. Each key the field acts on is stopped, so that a page shortcut never fires while a reader types.',
        `<div
           slDateTimeField
           locale="pt-BR"
           granularity="second"
           clearable
           aria-label="Teclado"
           [referenceDateTime]="reference"
           [defaultValue]="value"
         ></div>`,
      ),
    ),
  }),
};
