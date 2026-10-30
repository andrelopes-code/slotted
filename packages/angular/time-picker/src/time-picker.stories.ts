import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTimePicker } from './time-picker';
import type {
  TimePickerCloseOnSelect,
  TimePickerPlacement,
  TimePickerSize,
  TimePickerVariant,
} from './time-picker-defaults';
import { SlTimePickerOption } from './time-picker-option';
import { SlTimePickerFooter, SlTimePickerPresets } from './time-picker-parts';
import { ANGULAR_TIME_PICKER_DOCS, ANGULAR_TIME_PICKER_TOKENS } from './time-picker.docs';

interface TimePickerStoryArgs {
  clearable: boolean;
  closeOnSelect: TimePickerCloseOnSelect;
  locale: string;
  placement: TimePickerPlacement;
  size: TimePickerSize;
  step: number;
  variant: TimePickerVariant;
}

const TEN: PlainTime = plainTime(10, 0);
const MORNING: PlainTime = plainTime(9, 0);
const NOON: PlainTime = plainTime(12, 0);
const EVENING: PlainTime = plainTime(18, 0);
/** Stated rather than read from the clock, so every scene reads the same twice. */
const NOW: PlainTime = plainTime(9, 47);

/** A clinic's own hours: no step describes them, and `options` states them. */
const CLINIC: PlainTime[] = [
  plainTime(9, 0),
  plainTime(9, 20),
  plainTime(11, 40),
  plainTime(13, 45),
  plainTime(16, 0),
];
const MARKS: PlainTime[] = [
  plainTime(0, 0, 15),
  plainTime(0, 0, 30),
  plainTime(0, 0, 45),
  plainTime(0, 1, 0),
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIME_PICKER_DOCS.timePicker.scenes, {
    playground: Playground,
    panel: Panel,
    explicit: Explicit,
    seconds: Seconds,
    step: Step,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    now: Now,
    relative: Relative,
    presets: Presets,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlTimePicker,
  SlTimePickerFooter,
  SlTimePickerOption,
  SlTimePickerPresets,
];

const meta: Meta<TimePickerStoryArgs> = {
  title: 'Components/TimePicker',
  component: SlTimePicker,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Picker',
        description:
          'A time field, a trigger, and a list of times behind them. One panel shape at every step — a listbox of whole times — because the field beside it already types every second, and options states any set a step cannot describe. The panel complements the typing and never blocks it.',
        framework: 'Angular',
        ...ANGULAR_TIME_PICKER_DOCS.timePicker,
        tokens: ANGULAR_TIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimePickerStoryArgs>;

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

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;
/** Every open panel needs room under it, and the stage is what gives it. */
const tall = (body: string) => `<div class="slotted-demo-viewport" data-size="tall">${body}</div>`;

const BOUNDS = `[min]="morning" [max]="lateMorning" [referenceTime]="now"`;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    locale: 'pt-BR',
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, now: NOW },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Start time</label>
          <div
            slTimePicker
            name="start"
            [locale]="locale"
            [size]="size"
            [variant]="variant"
            [placement]="placement"
            [closeOnSelect]="closeOnSelect"
            [step]="step"
            [clearable]="clearable"
            [referenceTime]="now"
          ></div>
          <span slFieldDescription>Escolha na lista ou escreva no campo.</span>
        </div>
      </div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 30), now: NOW, ten: TEN },
    template: grid(
      1,
      scene(
        'A listbox of whole times',
        'Every row says the whole time, which is what a reader choosing a slot reads at a glance. One axis is also what makes Home, End, type-ahead and the two arrows all mean something.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen aria-label="Hora" [step]="1800" [defaultValue]="ten" ${BOUNDS}></div>`,
        ),
      ),
    ),
  }),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => ({
    props: { clinic: CLINIC, now: NOW, chosen: plainTime(11, 40) },
    template: grid(
      1,
      scene(
        "A clinic's own hours",
        '09:00, 09:20, 11:40, 13:45, 16:00. No step describes that, and a predicate can only subtract from times that fall on one — so options states them outright.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen aria-label="Hora da consulta" [options]="clinic" [defaultValue]="chosen" [referenceTime]="now"></div>`,
        ),
      ),
    ),
  }),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => ({
    props: { marks: MARKS, now: NOW, chosen: plainTime(0, 0, 30) },
    template: grid(
      1,
      scene(
        'Marks of a few seconds',
        'A day at a one-second step is 86 400 rows and not a list; a stated set of marks is four, and the field types any second the list does not offer.',
        tall(
          `<div slTimePicker locale="pt-BR" granularity="second" defaultOpen aria-label="Marca do intervalo" [options]="marks" [defaultValue]="chosen" [referenceTime]="now"></div>`,
        ),
      ),
    ),
  }),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => ({
    props: { now: NOW, base: plainTime(9, 7), lateMorning: plainTime(10, 30) },
    template: grid(
      2,
      scene(
        'An hour, and a quarter of one',
        'A step in seconds. The list is what the step makes it, and the field still accepts anything between two rows.',
        `<div slTimePicker locale="pt-BR" aria-label="Hora cheia" [step]="3600" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" aria-label="Quarto de hora" [step]="900" [referenceTime]="now"></div>`,
      ) +
        scene(
          'Counted from the lower bound',
          'min 09:07 with a quarter-hour step offers 09:07, 09:22, 09:37 — the platform’s own rule for input[type=time].',
          tall(
            `<div slTimePicker locale="pt-BR" defaultOpen aria-label="Base" [min]="base" [max]="lateMorning" [step]="900" [referenceTime]="now"></div>`,
          ),
        ),
    ),
  }),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => ({
    props: {
      opens: MORNING,
      closes: EVENING,
      inside: plainTime(11, 30),
      outside: plainTime(20, 0),
      now: NOW,
    },
    template: grid(
      2,
      scene(
        'Inside the hours',
        'min and max fence the list and the value together: nothing outside them is offered, and nothing outside them is accepted.',
        `<div slTimePicker locale="pt-BR" aria-label="Dentro" [min]="opens" [max]="closes" [defaultValue]="inside" [referenceTime]="now"></div>`,
      ) +
        scene(
          'Outside them',
          'A value past the fence is invalid whatever the field around the picker says, and the two rings retarget together.',
          `<div slTimePicker locale="pt-BR" aria-label="Fora" [min]="opens" [max]="closes" [defaultValue]="outside" [referenceTime]="now"></div>`,
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: {
      isLunch: (time: PlainTime) => time.hour === 12,
      from: plainTime(11, 0),
      to: plainTime(13, 0),
      now: NOON,
    },
    template: grid(
      2,
      scene(
        'Disabled, which is the default',
        'The noon hour stays in the list and answers nothing. A list that silently drops rows is a list whose step the reader cannot infer.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen aria-label="Desativadas" [isTimeUnavailable]="isLunch" [min]="from" [max]="to" [step]="1800" [referenceTime]="now"></div>`,
        ),
      ) +
        scene(
          "Hidden, which is the consumer's choice",
          'The same predicate with unavailableOptions="hide". The rows are gone and the step is no longer readable from the list.',
          tall(
            `<div slTimePicker locale="pt-BR" defaultOpen unavailableOptions="hide" aria-label="Escondidas" [isTimeUnavailable]="isLunch" [min]="from" [max]="to" [step]="1800" [referenceTime]="now"></div>`,
          ),
        ),
    ),
  }),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW },
    template: grid(
      1,
      scene(
        'One press for the current time',
        'It is the zero case of the field’s relative expression, drawn as a labelled control so a reader who never discovers that + opens a duration still has the one press.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen [messages]="{ now: 'Agora' }" aria-label="Agora" ${BOUNDS}></div>`,
        ),
      ),
    ),
  }),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW, ten: TEN },
    template: grid(
      1,
      scene(
        'The panel complements the typing',
        'Put focus in the field and press Alt+ArrowDown: the panel opens and focus stays on the segments. Press + and the duration expression opens with the panel still showing.',
        tall(
          `<div slTimePicker locale="pt-BR" aria-label="A escrever" [defaultValue]="ten" ${BOUNDS}></div>`,
        ),
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW },
    template: grid(
      1,
      scene(
        'Shortcuts and actions the product owns',
        'This family ships no list of shortcuts: "start of the shift" is a business clock. What it ships is the column they stand in.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen closeOnSelect="never" aria-label="With shortcuts" ${BOUNDS}>
             <div slTimePickerPresets>
               <button type="button">Shift start</button>
               <button type="button">Lunch</button>
             </div>
             <div slTimePickerFooter>
               <button type="button">Aplicar</button>
             </div>
           </div>`,
        ),
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { ten: TEN, now: NOW },
    template: grid(
      2,
      scene(
        'On its own',
        'Three steps of type, height and inside padding, and the trigger’s own box follows each.',
        `<div slTimePicker locale="pt-BR" size="sm" aria-label="Small" [defaultValue]="ten" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" size="md" aria-label="Default" [defaultValue]="ten" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" size="lg" aria-label="Large" [defaultValue]="ten" [referenceTime]="now"></div>`,
      ) +
        scene(
          'Inside a field',
          'The picker takes the field’s step rather than its own default.',
          `<div slField size="sm">
             <label slFieldLabel>Start time</label>
             <div slTimePicker locale="pt-BR" [defaultValue]="ten" [referenceTime]="now"></div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { ten: TEN, now: NOW },
    template: grid(
      1,
      scene(
        'The three frames',
        'How much the control shows at rest. The panel does not change with it: a surface floating over the page has its own ground.',
        `<div slTimePicker locale="pt-BR" variant="outline" aria-label="Outline" [defaultValue]="ten" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" variant="subtle" aria-label="Subtle" [defaultValue]="ten" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" variant="plain" aria-label="Plain" [defaultValue]="ten" [referenceTime]="now"></div>`,
      ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW },
    template: grid(
      2,
      scene(
        'Below, from the start edge',
        'The default, and where a form wants it. What the positioner actually resolved is written back as data-placement.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen placement="bottom-start" aria-label="Below" ${BOUNDS}></div>`,
        ),
      ) +
        scene(
          'Above, from the end edge',
          'The same surface asked to start elsewhere. It still moves if the room says so.',
          tall(
            `<div slTimePicker locale="pt-BR" defaultOpen placement="top-end" aria-label="Above" ${BOUNDS}></div>`,
          ),
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { ten: TEN, now: NOW, closes: EVENING, outside: plainTime(20, 0) },
    template: grid(
      2,
      scene(
        'Read-only and disabled',
        'Read-only keeps the value readable and the panel shut; disabled answers no press at all.',
        `<div slTimePicker locale="pt-BR" readOnly aria-label="Read-only" [defaultValue]="ten" [referenceTime]="now"></div>
         <div slTimePicker locale="pt-BR" disabled aria-label="Disabled" [defaultValue]="ten" [referenceTime]="now"></div>`,
      ) +
        scene(
          'Invalid and required, in a field',
          'The message is the field’s and the state is the control’s. The two rings retarget together, so they never disagree.',
          `<div slField invalid>
             <label slFieldLabel>Start time</label>
             <div slTimePicker locale="pt-BR" [max]="closes" [defaultValue]="outside" [referenceTime]="now"></div>
             <span slFieldError>Outside business hours.</span>
           </div>
           <div slField required>
             <label slFieldLabel>Hora de fim</label>
             <div slTimePicker locale="pt-BR" [referenceTime]="now"></div>
           </div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: {
      form: new FormGroup({ start: new FormControl<PlainTime | null>(TEN) }),
      now: NOW,
    },
    template: grid(
      1,
      scene(
        'A reactive form',
        'The picker hands the value to the field it composes, and the field is the ControlValueAccessor — so a form reads one control rather than two.',
        `<form [formGroup]="form">
           <div slField>
             <label slFieldLabel>Start time</label>
             <div slTimePicker locale="pt-BR" formControlName="start" required [referenceTime]="now"></div>
             <span slFieldDescription>Control value: {{ form.value.start | json }}</span>
           </div>
         </form>`,
      ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW },
    template: grid(
      1,
      scene(
        'In a narrow column',
        'The panel takes the anchor’s width, floored so a narrow field never produces a column too tight to read a time in. Below 480 pixels on a finger it becomes a sheet instead.',
        measure(
          tall(
            `<div slTimePicker locale="pt-BR" defaultOpen aria-label="Estreito" ${BOUNDS}></div>`,
          ),
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { morning: MORNING, lateMorning: plainTime(11, 0), now: NOW, ten: TEN },
    template: grid(
      2,
      scene(
        'The consumer draws the row',
        'An ng-template rather than a projected slot, because it is re-rendered once per option — the case NgTemplateOutlet exists for. The row itself, with its role, its states and its keyboard, stays the family’s.',
        tall(
          `<div slTimePicker locale="pt-BR" defaultOpen aria-label="With own rows" [step]="1200" ${BOUNDS}>
             <ng-template slTimePickerOption let-time let-label="label" let-selected="selected">
               <span>{{ label }}</span>
               @if (selected) {
                 <span>·</span>
               }
             </ng-template>
           </div>`,
        ),
      ) +
        scene(
          'The instance a template can reach',
          'exportAs gives the template the component itself: openSurface() and closeSurface() move the surface without a pointer, and focus() puts the reader on the first segment.',
          `<div slTimePicker #hora="slTimePicker" locale="pt-BR" aria-label="With instance" [defaultValue]="ten" [referenceTime]="now"></div>
           <button type="button" (click)="hora.openSurface()">Open</button>
           <button type="button" (click)="hora.focus()">Focus</button>`,
          'row',
          40,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { morning: MORNING, lateMorning: NOON, now: NOW, ten: TEN },
    template: grid(
      1,
      scene(
        'Put focus in it and try them',
        'Alt+ArrowDown from a segment opens the panel and leaves focus there. Tab to the trigger and press ArrowDown to move into the list; inside it the arrows walk, Home and End reach the ends, PageUp and PageDown cross one hour boundary each, digits jump to a time, and Enter chooses. Escape closes and puts focus back on the trigger.',
        tall(
          `<div slTimePicker locale="pt-BR" aria-label="Teclado" [step]="900" [defaultValue]="ten" ${BOUNDS}></div>`,
        ),
      ),
    ),
  }),
};
