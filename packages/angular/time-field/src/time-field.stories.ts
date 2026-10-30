import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTimeField } from './time-field';
import type { TimeFieldHourCycle, TimeFieldSize, TimeFieldVariant } from './time-field-defaults';
import { SlTimeFieldEnd, SlTimeFieldStart } from './time-field-parts';
import { ANGULAR_TIME_FIELD_DOCS, ANGULAR_TIME_FIELD_TOKENS } from './time-field.docs';

interface TimeFieldStoryArgs {
  clearable: boolean;
  granularity: 'hour' | 'minute' | 'second';
  hourCycle: TimeFieldHourCycle | undefined;
  locale: string;
  relative: boolean;
  size: TimeFieldSize;
  variant: TimeFieldVariant;
}

const HALF_PAST_TWO: PlainTime = plainTime(14, 30);
const AFTERNOON: PlainTime = plainTime(14, 40);
const LATE: PlainTime = plainTime(23, 0);
const MIDNIGHT_HALF: PlainTime = plainTime(0, 30);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIME_FIELD_DOCS.timeField.scenes, {
    playground: Playground,
    locale: Locale,
    'hour-cycle': HourCycle,
    granularity: Granularity,
    relative: Relative,
    midnight: Midnight,
    sizes: Sizes,
    variants: Variants,
    range: Range,
    unavailable: Unavailable,
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
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlTimeField,
  SlTimeFieldEnd,
  SlTimeFieldStart,
];

const meta: Meta<TimeFieldStoryArgs> = {
  title: 'Components/TimeField',
  component: SlTimeField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Field',
        description:
          'A time typed one field at a time, in the order the reader’s own locale writes it — and, when the reader would rather say "forty minutes from now", a duration resolved in view before it is accepted. The control belongs in a reactive form, with its own validator for the rules nothing outside it can see.',
        framework: 'Angular',
        ...ANGULAR_TIME_FIELD_DOCS.timeField,
        tokens: ANGULAR_TIME_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimeFieldStoryArgs>;

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
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Start time</label>
          <div
            slTimeField
            name="start"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [granularity]="granularity"
            [hourCycle]="hourCycle"
            [clearable]="clearable"
            [relative]="relative"
          ></div>
          <span slFieldDescription>The meeting starts at this time.</span>
        </div>
      </div>`,
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => ({
    props: { value: HALF_PAST_TWO },
    template: grid(
      2,
      scene(
        'pt-BR',
        'Hour and minute, separated by a colon, with an empty hh:mm — and no day period, because the locale does not write one.',
        `<div slTimeField locale="pt-BR" aria-label="Time" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" aria-label="Empty time"></div>`,
      ) +
        scene(
          'en-US',
          'The same directive, with a third field: the day period, whose spoken value is AM or PM because 0 and 1 are not names.',
          `<div slTimeField locale="en-US" aria-label="Time" [defaultValue]="value"></div>
           <div slTimeField locale="en-US" aria-label="Empty time"></div>`,
        ) +
        scene(
          'ja-JP',
          '午前 and 午後 come first here, before the hour — the pattern order is the locale’s and the family only reads it.',
          `<div slTimeField locale="ja-JP" aria-label="時刻" [hourCycle]="12" [defaultValue]="value"></div>
           <div slTimeField locale="ja-JP" aria-label="空の時刻" [hourCycle]="12"></div>`,
        ) +
        scene(
          'ar-EG',
          'The locale’s own digits, read back by the same parser that wrote them.',
          `<div slTimeField locale="ar-EG" aria-label="الوقت" [defaultValue]="value"></div>
           <div slTimeField locale="ar-EG" aria-label="وقت فارغ"></div>`,
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
        'Twelve, in en-US',
        'h12: the hour runs 1 to 12 and midnight is written 12 AM.',
        `<div slTimeField locale="en-US" aria-label="Twelve" [hourCycle]="12" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Twelve, in ja-JP',
          'h11: the same axis, and the hour runs 0 to 11. A boolean would have written 12 here.',
          `<div slTimeField locale="ja-JP" aria-label="Eleven" [hourCycle]="12" [defaultValue]="value"></div>`,
        ) +
        scene(
          'Twenty-four',
          'h23: no day period at all, and the hour runs 0 to 23.',
          `<div slTimeField locale="en-US" aria-label="Twenty-four" [hourCycle]="24" [defaultValue]="value"></div>`,
        ) +
        scene(
          'What the locale wants',
          'Unset, each control asks Intl and gets what the reader’s own locale writes.',
          `<div slTimeField locale="pt-BR" aria-label="Locale" [defaultValue]="value"></div>
           <div slTimeField locale="en-US" aria-label="Locale en" [defaultValue]="value"></div>`,
        ),
    ),
  }),
};

export const Granularity: Story = {
  parameters: scenario('granularity'),
  render: () => ({
    props: { value: HALF_PAST_TWO, withSeconds: plainTime(14, 30, 15) },
    template: grid(
      1,
      scene(
        'Three depths',
        'An hour for a booking that only takes hours, a minute for nearly everything, a second for a timecode.',
        `<div slTimeField locale="pt-BR" granularity="hour" aria-label="Booking time" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" granularity="minute" aria-label="Meeting time" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" granularity="second" aria-label="Video timestamp" [defaultValue]="withSeconds"></div>`,
      ),
    ),
  }),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => ({
    props: { afternoon: AFTERNOON },
    template: grid(
      1,
      scene(
        'Press + and write a duration',
        '+40m, 1h30, 1:30, -15, 90s, or 0 for now. The resolved time is drawn on the right as you type; Enter accepts it, Escape puts the segments back untouched.',
        `<div slTimeField locale="pt-BR" aria-label="Duration" [referenceTime]="afternoon"></div>`,
      ) +
        scene(
          'Every value it writes is reachable without it',
          'The expression is a shortcut, never the only way in: the same 15:20 is typed, stepped or paged.',
          `<div slTimeField locale="pt-BR" aria-label="No duration" [relative]="false" [referenceTime]="afternoon"></div>`,
        ),
    ),
  }),
};

export const Midnight: Story = {
  parameters: scenario('midnight'),
  render: () => ({
    props: { late: LATE },
    template: grid(
      1,
      scene(
        '+90m at 23:00',
        'Press + and write 90m. The preview changes tone and says the day out loud, and the request carries crossesMidnight so a consumer holding a PlainDateTime knows to add one.',
        `<div
           slTimeField
           locale="pt-BR"
           aria-label="Fim do turno"
           [messages]="{ nextDay: '{time} no dia seguinte' }"
           [referenceTime]="late"
         ></div>`,
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { value: HALF_PAST_TWO, evening: plainTime(18, 0) },
    template: grid(
      2,
      scene(
        'On its own',
        'Three steps of type, height and inside padding, all from the control scales the theme restates per density.',
        `<div slTimeField locale="pt-BR" size="sm" aria-label="Small" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" size="md" aria-label="Default" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" size="lg" aria-label="Large" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Inside a field',
          'The control takes the field’s step rather than its own default.',
          `<div slField size="sm">
             <label slFieldLabel>Start time</label>
             <div slTimeField locale="pt-BR" [defaultValue]="value"></div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Hora de fim</label>
             <div slTimeField locale="pt-BR" [defaultValue]="evening"></div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { value: HALF_PAST_TWO, out: plainTime(17, 30) },
    template: grid(
      2,
      scene(
        'On the page',
        'outline takes the ground it is on, subtle sinks into it, and plain shows nothing at rest.',
        `<div slTimeField locale="pt-BR" variant="outline" aria-label="Outline" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" variant="subtle" aria-label="Subtle" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" variant="plain" aria-label="Plain" [defaultValue]="value"></div>`,
      ) +
        scene(
          'In a dense row',
          'plain is what a table wants: nothing until the pointer or the keyboard arrives.',
          `<div slTimeField locale="pt-BR" variant="plain" size="sm" aria-label="Time in" [defaultValue]="value"></div>
           <div slTimeField locale="pt-BR" variant="plain" size="sm" aria-label="Time out" [defaultValue]="out"></div>`,
          'row',
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    props: {
      opens: plainTime(9, 0),
      closes: plainTime(18, 0),
      inside: plainTime(11, 30),
      outside: plainTime(20, 0),
    },
    template: grid(
      2,
      scene(
        'Inside the hours',
        '09:00 to 18:00. The bounds reach the spin buttons as aria-valuemin and aria-valuemax.',
        `<div slTimeField locale="pt-BR" aria-label="Dentro" [min]="opens" [max]="closes" [defaultValue]="inside"></div>`,
      ) +
        scene(
          'Outside them',
          'A value past the fence is invalid whatever the field around it says, and a reactive form hears slottedTimeRange.',
          `<div slTimeField locale="pt-BR" aria-label="Fora" [min]="opens" [max]="closes" [defaultValue]="outside"></div>`,
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: {
      isLunch: (time: PlainTime) => time.hour === 12,
      accepted: plainTime(11, 0),
      refused: plainTime(12, 30),
    },
    template: grid(
      1,
      scene(
        'A lunch break',
        'isTimeUnavailable refuses the noon hour — something no pair of bounds can say, and a reactive form hears slottedTimeUnavailable.',
        `<div slTimeField locale="pt-BR" aria-label="Aceite" [isTimeUnavailable]="isLunch" [defaultValue]="accepted"></div>
         <div slTimeField locale="pt-BR" aria-label="Recusada" [isTimeUnavailable]="isLunch" [defaultValue]="refused"></div>`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { value: HALF_PAST_TWO, closes: plainTime(18, 0), outside: plainTime(20, 0) },
    template: grid(
      2,
      scene(
        'Read-only and disabled',
        'Read-only stays focusable and copyable and never looks disabled. Disabled answers no key and no pointer.',
        `<div slTimeField locale="pt-BR" readOnly aria-label="Read-only" [defaultValue]="value"></div>
         <div slTimeField locale="pt-BR" disabled aria-label="Disabled" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Invalid and required, in a field',
          'The message is the field’s and the state is the control’s. Colour alone never says invalid.',
          `<div slField invalid>
             <label slFieldLabel>Start time</label>
             <div slTimeField locale="pt-BR" [max]="closes" [defaultValue]="outside"></div>
             <span slFieldError>Outside business hours.</span>
           </div>
           <div slField required>
             <label slFieldLabel>Hora de fim</label>
             <div slTimeField locale="pt-BR"></div>
           </div>`,
        ),
    ),
  }),
};

export const Clear: Story = {
  parameters: scenario('clear'),
  render: () => ({
    props: { value: HALF_PAST_TWO },
    template: grid(
      2,
      scene(
        'With a value',
        'The button is drawn only once a segment holds something, and pressing it puts focus back on the first segment.',
        `<div slTimeField locale="pt-BR" clearable [messages]="{ clear: 'Clear the time' }" aria-label="With value" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Empty',
          'Nothing to clear, so nothing is drawn — and the value keeps its place rather than shifting sideways.',
          `<div slTimeField locale="pt-BR" clearable [messages]="{ clear: 'Limpar a hora' }" aria-label="Vazia"></div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    props: { value: HALF_PAST_TWO },
    template: grid(
      2,
      scene(
        'A mark before the time',
        'A directive on the consumer’s own element, so nothing loses its semantics and any icon inside is sized from the control’s glyph scale.',
        `<div slTimeField locale="pt-BR" clearable aria-label="With mark" [defaultValue]="value">
           <span slTimeFieldStart>at</span>
         </div>`,
      ) +
        scene(
          'A zone after it',
          'The value is a wall-clock time and carries no zone; an application that knows the zone writes its label here.',
          `<div slTimeField locale="pt-BR" aria-label="Com fuso" [defaultValue]="value">
             <span slTimeFieldEnd>BRT</span>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: {
      form: new FormGroup({ start: new FormControl<PlainTime | null>(plainTime(9, 15)) }),
    },
    template: grid(
      1,
      scene(
        'A reactive form',
        'ControlValueAccessor reads and writes the control, and Validator reports slottedTimeRange and slottedTimeUnavailable — validity nothing outside this control can see. It is the integration point React has no equivalent of.',
        `<form [formGroup]="form">
           <div slField>
             <label slFieldLabel>Start time</label>
             <div slTimeField locale="pt-BR" formControlName="start" required></div>
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
    props: { value: HALF_PAST_TWO, withSeconds: plainTime(14, 30, 15) },
    template: grid(
      2,
      scene(
        'A day period written as a word',
        'es-MX writes a.m. and p.m., and a box cut to two characters would clip the dots.',
        `<div slTimeField locale="es-MX" aria-label="Palabra" [hourCycle]="12" [defaultValue]="value"></div>`,
      ) +
        scene(
          'Seconds in a narrow column',
          'Three fields and two separators at 240 pixels, at the small step. Nothing wraps and nothing is cut.',
          measure(
            `<div slTimeField locale="pt-BR" granularity="second" size="sm" clearable aria-label="Estreito" [defaultValue]="withSeconds"></div>`,
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { value: HALF_PAST_TWO },
    template: grid(
      1,
      scene(
        'The instance a template can reach',
        'exportAs gives the template the component itself: focus() puts the reader on the first segment, clear() empties the value with the clear reason, and time() is the derived value as a signal. provideTimeFieldDefaults states the clock once for everything under it, and provideSlotted the language.',
        `<div slTimeField #hora="slTimeField" locale="pt-BR" aria-label="With instance" [defaultValue]="value"></div>
         <button type="button" (click)="hora.focus()">Focus</button>
         <button type="button" (click)="hora.clear()">Clear</button>`,
        'row',
        40,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { value: HALF_PAST_TWO, afternoon: AFTERNOON },
    template: grid(
      1,
      scene(
        'Put focus in it and try them',
        'Arrows step and wrap inside one field; PageUp and PageDown move three hours or fifteen minutes; Home and End take a field to its own edge; the arrows across walk between fields in the writing order; Backspace empties one; digits type; and +, - or = open a duration. Every key the field acts on is stopped, so a page-level shortcut never fires while a reader is typing a time.',
        `<div slTimeField locale="pt-BR" clearable aria-label="Teclado" [referenceTime]="afternoon" [defaultValue]="value"></div>`,
      ),
    ),
  }),
};
