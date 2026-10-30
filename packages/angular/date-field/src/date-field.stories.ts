import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDateField } from './date-field';
import type { DateFieldSize, DateFieldVariant } from './date-field-defaults';
import { SlDateFieldEnd, SlDateFieldStart } from './date-field-parts';
import { ANGULAR_DATE_FIELD_DOCS, ANGULAR_DATE_FIELD_TOKENS } from './date-field.docs';

interface DateFieldStoryArgs {
  clearable: boolean;
  locale: string;
  size: DateFieldSize;
  variant: DateFieldVariant;
}

const NINTH: PlainDate = plainDate(2026, 9, 9);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_FIELD_DOCS.dateField.scenes, {
    playground: Playground,
    locale: Locale,
    sizes: Sizes,
    variants: Variants,
    range: Range,
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
  SlDateField,
  SlDateFieldEnd,
  SlDateFieldStart,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
];

const meta: Meta<DateFieldStoryArgs> = {
  title: 'Components/DateField',
  component: SlDateField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Field',
        description:
          'A date typed one field at a time, in the order the reader’s own locale writes it. Each field is a spin button; the three together are one group whose name is the whole date; and the control belongs in a reactive form, with its own validator for the rules nothing outside it can see.',
        framework: 'Angular',
        ...ANGULAR_DATE_FIELD_DOCS.dateField,
        tokens: ANGULAR_DATE_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateFieldStoryArgs>;

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
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
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

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: { clearable: true, locale: 'pt-BR', size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Vencimento</label>
          <div
            slDateField
            name="vencimento"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [clearable]="clearable"
          ></div>
          <span slFieldDescription>The invoice is due on this date.</span>
        </div>
      </div>`,
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
        'Day, month and year, separated by slashes, with an empty dd/mm/aaaa — all three coming from Intl.',
        `<div slDateField locale="pt-BR" aria-label="Date" [defaultValue]="ninth"></div>
         <div slDateField locale="pt-BR" aria-label="Empty date"></div>`,
      ) +
        scene(
          'en-US',
          'The same directive, month first, because that is what the locale writes and nobody wrote a format string.',
          `<div slDateField locale="en-US" aria-label="Date" [defaultValue]="ninth"></div>
           <div slDateField locale="en-US" aria-label="Empty date"></div>`,
        ) +
        scene(
          'de-DE',
          'Full stops rather than slashes, and a placeholder that reads tt.mm.jjjj because Tag, Monat and Jahr are the words.',
          `<div slDateField locale="de-DE" aria-label="Datum" [defaultValue]="ninth"></div>
           <div slDateField locale="de-DE" aria-label="Leeres Datum"></div>`,
        ) +
        scene(
          'ja-JP',
          'The year comes first, and the placeholder is the ideograph rather than four repeats of it — a name one character long is used whole.',
          `<div slDateField locale="ja-JP" aria-label="日付" [defaultValue]="ninth"></div>
           <div slDateField locale="ja-JP" aria-label="空の日付"></div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'On its own',
        'Three steps of type, height and inside padding, all from the control scales the theme restates per density.',
        `<div slDateField size="sm" locale="pt-BR" aria-label="Small" [defaultValue]="ninth"></div>
         <div slDateField size="md" locale="pt-BR" aria-label="Default" [defaultValue]="ninth"></div>
         <div slDateField size="lg" locale="pt-BR" aria-label="Large" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'Inside a field',
          'The control takes the field’s step rather than its own default: a small field holding a medium control is one row disagreeing with itself.',
          `<div slField size="sm">
             <label slFieldLabel>Vencimento</label>
             <div slDateField locale="pt-BR" [defaultValue]="ninth"></div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Issue date</label>
             <div slDateField locale="pt-BR" [defaultValue]="ninth"></div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'outline',
        'The default. It takes the ground it is placed on, so a form inside a card and the same form on the page both read correctly.',
        `<div slDateField variant="outline" locale="pt-BR" aria-label="Contorno" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'subtle',
          'Sinks into the page. Right where a form is a block of many fields and the frames would otherwise be the loudest thing on it.',
          `<div slDateField variant="subtle" locale="pt-BR" aria-label="Discreto" [defaultValue]="ninth"></div>`,
        ) +
        scene(
          'plain',
          'Nothing at rest, and the same box while it is used, so a table row does not reflow when the pointer crosses it.',
          `<div slDateField variant="plain" locale="pt-BR" aria-label="Simples" [defaultValue]="ninth"></div>`,
        ) +
        scene(
          'In a dense row',
          'plain in the place it exists for: a cell that is only a control while somebody is in it.',
          `<div slDateField variant="plain" size="sm" locale="pt-BR" aria-label="Cell" [defaultValue]="ninth"></div>`,
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    props: {
      ninth: NINTH,
      lastYear: plainDate(2025, 12, 31),
      christmas: plainDate(2026, 12, 25),
      first: plainDate(2026, 1, 1),
      last: plainDate(2026, 12, 31),
      isChristmas: (date: PlainDate) => date.month === 12 && date.day === 25,
    },
    template: grid(
      2,
      scene(
        'Inside the bounds',
        'A date the rules accept. min and max reach every segment as aria-valuemin and aria-valuemax, so a screen reader hears the range.',
        `<div slDateField locale="pt-BR" aria-label="Dentro" [defaultValue]="ninth" [min]="first" [max]="last"></div>`,
      ) +
        scene(
          'Outside them',
          'The same rules with a value from 2025. The control states its own invalidity: nothing outside it knows the bounds.',
          `<div slField>
             <label slFieldLabel>Vencimento</label>
             <div slDateField locale="pt-BR" [defaultValue]="lastYear" [min]="first" [max]="last"></div>
             <span slFieldError>Escolha uma data de 2026.</span>
           </div>`,
        ) +
        scene(
          'A day that is refused',
          'isDateUnavailable takes a predicate rather than a list, so a weekend, a holiday and a booked day are all the same one line.',
          `<div slField>
             <label slFieldLabel>Delivery</label>
             <div slDateField locale="pt-BR" [defaultValue]="christmas" [isDateUnavailable]="isChristmas"></div>
             <span slFieldError>We do not deliver on Christmas.</span>
           </div>`,
        ) +
        scene(
          'A birth date',
          'yearPivot at 0 sends every two-digit year that would land ahead of this one into the last century, so typing 80 is 1980 and not 2080.',
          `<div slDateField locale="pt-BR" aria-label="Nascimento" [yearPivot]="0"></div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { ninth: NINTH, february: plainDate(2026, 2, 28) },
    template: grid(
      2,
      scene(
        'Read-only',
        'Still focusable, still selectable, still submitted. The ground says it is not yours to change and the ink says nothing at all — it must not read as disabled.',
        `<div slDateField readOnly locale="pt-BR" aria-label="Somente leitura" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'Disabled',
          'No key, no pointer, no tab stop, and the value still legible: a disabled form still has to say what it holds.',
          `<div slDateField disabled locale="pt-BR" aria-label="Desativado" [defaultValue]="ninth"></div>`,
        ) +
        scene(
          'Invalid',
          'Tab into it: the ring is retargeted to the danger colour rather than removed, because a focus indicator is a focus indicator before it is an error.',
          `<div slField invalid>
             <label slFieldLabel>Due date</label>
             <div slDateField locale="pt-BR" [defaultValue]="february"></div>
             <span slFieldError>This date has already passed.</span>
           </div>`,
        ) +
        scene(
          'Required',
          'The field draws the mark and the group carries aria-required, so the necessity is both seen and heard.',
          `<div slField required>
             <label slFieldLabel>Vencimento</label>
             <div slDateField locale="pt-BR"></div>
           </div>`,
        ),
    ),
  }),
};

export const Clear: Story = {
  parameters: scenario('clear'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'With something to clear',
        'The button is drawn because a segment holds a value. Press it: every field empties and focus lands on the first rather than nowhere.',
        `<div slDateField clearable locale="pt-BR" aria-label="With value" [defaultValue]="ninth"></div>`,
      ) +
        scene(
          'With nothing to clear',
          'The same control with an empty value. The button is withdrawn rather than disabled: a disabled button is one more thing to tab past.',
          `<div slDateField clearable locale="pt-BR" aria-label="Vazio"></div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'A word before the date',
        'The slot is a directive on the consumer’s own element, so a span, a kbd or an icon all work and none of them loses its own semantics.',
        `<div slDateField locale="pt-BR" aria-label="Com prefixo" [defaultValue]="ninth">
           <span slDateFieldStart>em</span>
         </div>`,
      ) +
        scene(
          'A note after it',
          'The end slot is quieter than the value: an adornment annotates, and a reader looking for the date should not have to step over it.',
          `<div slDateField locale="pt-BR" aria-label="Com fuso" [defaultValue]="ninth">
             <span slDateFieldEnd>UTC−3</span>
           </div>`,
        ) +
        scene(
          'Both, with a clear button',
          'The three inner controls share one frame and one border, and the glyph ends the same distance from the edge as the digits begin from it.',
          `<div slDateField clearable locale="pt-BR" aria-label="Completo" [defaultValue]="ninth">
             <span slDateFieldStart>em</span>
             <span slDateFieldEnd>UTC−3</span>
           </div>`,
        ) +
        scene(
          'In a narrow column',
          'Below 320 pixels the frame holds and the date keeps its columns, because a segment’s width is stated in digits rather than measured from its content.',
          measure(
            `<div slDateField clearable locale="pt-BR" aria-label="Estreito" [defaultValue]="ninth"></div>`,
          ),
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: {
      form: new FormGroup({ vencimento: new FormControl<PlainDate | null>(NINTH) }),
      first: plainDate(2026, 10, 1),
    },
    template: grid(
      1,
      scene(
        'A reactive form',
        'The control is driven by formControlName, and min reports as a form error through Validator rather than through a validator the application had to write.',
        `<form [formGroup]="form">
           <div slField>
             <label slFieldLabel>Vencimento</label>
             <div slDateField locale="pt-BR" formControlName="vencimento" [min]="first"></div>
             <span slFieldError>Escolha uma data a partir de outubro.</span>
             <span slFieldDescription>
               valor: {{ form.value.vencimento | json }} · erros: {{ form.controls.vencimento.errors | json }}
             </span>
           </div>
         </form>`,
        'block',
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { request: null as unknown },
    template: grid(
      1,
      scene(
        'A date halfway through',
        'Type a day and a month and stop. The value stays null and the segments say what is already there — the state every surveyed implementation collapses into an empty one.',
        `<div slField>
           <label slFieldLabel>Nascimento</label>
           <div slDateField locale="pt-BR" (valueChange)="request = $event"></div>
           <span slFieldDescription>
             valor: {{ request?.value | json }} · segmentos: {{ request?.segments | json }}
           </span>
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { ninth: NINTH },
    template: grid(
      2,
      scene(
        'A template reaches the instance',
        'exportAs hands the directive back, so focus() and clear() are reachable from a button beside it without a component of its own.',
        `<div slDateField #data="slDateField" locale="pt-BR" aria-label="Controlado" [defaultValue]="ninth"></div>
         <button type="button" (click)="data.focus()">focus()</button>
         <button type="button" (click)="data.clear()">clear()</button>`,
      ) +
        scene(
          'The derived date',
          'date() is a signal over the segments, so a template reads the value without an event handler and without a second copy of it.',
          `<div slDateField #lido="slDateField" locale="pt-BR" aria-label="Lido" [defaultValue]="ninth"></div>
           <span>{{ lido.date() | json }}</span>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: {
      december: plainDate(2026, 12, 9),
      january: plainDate(2026, 1, 31),
    },
    template: grid(
      2,
      scene(
        'Stepping wraps inside a field',
        'Put focus on the month and press ArrowUp from December: it becomes January and the year does not move. One press changes one field.',
        `<div slDateField locale="pt-BR" aria-label="Dezembro" [defaultValue]="december"></div>`,
      ) +
        scene(
          'The day a short month could not hold',
          'From 31 January, press ArrowUp on the month twice. February shows 28 and March shows 31 again — the 31 is remembered rather than thrown away.',
          `<div slDateField locale="pt-BR" aria-label="Trinta e um" [defaultValue]="january"></div>`,
        ) +
        scene(
          'Typing moves on when a field is full',
          'Type 3 into the month and focus goes on, because 30 is not a month. Type 3 into the day and it waits, because 30 and 31 are both still reachable.',
          `<div slDateField locale="pt-BR" aria-label="Typing"></div>`,
        ) +
        scene(
          'Pasting a whole date',
          'Paste 09/09/2026 or 2026-09-09 into it. The locale’s own shape is read first, so 12/03 is March here and December to an American reader.',
          `<div slDateField locale="pt-BR" aria-label="Colagem"></div>`,
        ),
    ),
  }),
};
