import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlNumberField } from './number-field';
import type {
  NumberFieldClamp,
  NumberFieldSize,
  NumberFieldStepper,
  NumberFieldVariant,
} from './number-field-defaults';
import { SlNumberFieldInput } from './number-field-input';
import { SlNumberFieldEnd, SlNumberFieldScrub, SlNumberFieldStart } from './number-field-parts';
import { ANGULAR_NUMBER_FIELD_DOCS, ANGULAR_NUMBER_FIELD_TOKENS } from './number-field.docs';

interface NumberFieldStoryArgs {
  clamp: NumberFieldClamp;
  size: NumberFieldSize;
  stepper: NumberFieldStepper;
  variant: NumberFieldVariant;
  wheel: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_NUMBER_FIELD_DOCS.numberField.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    stepper: Stepper,
    range: Range,
    format: Format,
    formatOn: FormatOn,
    locale: Locale,
    adornments: Adornments,
    scrub: Scrub,
    states: States,
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
  SlNumberField,
  SlNumberFieldEnd,
  SlNumberFieldInput,
  SlNumberFieldScrub,
  SlNumberFieldStart,
];

const meta: Meta<NumberFieldStoryArgs> = {
  title: 'Components/NumberField',
  component: SlNumberField,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Number Field',
        description:
          'One numeric value, written for a locale by Intl.NumberFormat, moved by the arrows or by two buttons, in a frame around a text input that carries the APG’s spinbutton role.',
        framework: 'Angular',
        ...ANGULAR_NUMBER_FIELD_DOCS.numberField,
        tokens: ANGULAR_NUMBER_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<NumberFieldStoryArgs>;

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
  args: {
    clamp: 'blur',
    size: 'md',
    stepper: 'stacked',
    variant: 'outline',
    wheel: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Quantidade</label>
          <div slNumberField [size]="size" [variant]="variant" [stepper]="stepper">
            <input
              slNumberFieldInput
              defaultValue="3"
              min="1"
              max="99"
              [clamp]="clamp"
              [wheel]="wheel"
            />
          </div>
          <span slFieldDescription>Maximum of 99 units per order.</span>
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'Height, inline padding, type, glyph and the stepper column all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<div slNumberField size="sm"><input slNumberFieldInput defaultValue="8" /></div>
         <div slNumberField size="md"><input slNumberFieldInput defaultValue="12" /></div>
         <div slNumberField size="lg"><input slNumberFieldInput defaultValue="24" /></div>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium control is a field and a control disagreeing about one row, so the control reads the field’s step before the application token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Parcelas</label>
             <div slNumberField>
               <input slNumberFieldInput defaultValue="12" min="1" max="24" />
             </div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Valor da parcela</label>
             <div slNumberField>
               <input
                 slNumberFieldInput
                 defaultValue="1480"
                 locale="pt-BR"
                 [format]="{ style: 'currency', currency: 'BRL' }"
               />
             </div>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A frame that takes the ground it is placed on',
        'outline paints no ground of its own, so the same amount looks right on a page, inside a card and inside a sunken panel without a second token.',
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
         </div>
         <div slNumberField variant="subtle">
           <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
         </div>`,
      ) +
        scene(
          'A cell that is only a control while it is used',
          'plain shows no border at rest and keeps exactly the same box, so a table row does not reflow when the pointer crosses it. Hover one and the edge arrives.',
          `<div slNumberField variant="plain" stepper="none">
             <input slNumberFieldInput defaultValue="240" />
           </div>
           <div slNumberField variant="plain" stepper="none">
             <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
           </div>`,
        ),
    ),
  }),
};

export const Stepper: Story = {
  parameters: scenario('stepper'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A column at the end, and a button at each end',
        'Hold either button: it steps once, waits, and then repeats until you let go. The split arrangement is the only one whose targets clear 24 pixels in both axes, which is what a thumb needs.',
        `<div slNumberField stepper="stacked"><input slNumberFieldInput defaultValue="12" /></div>
         <div slNumberField stepper="split">
           <input slNumberFieldInput defaultValue="3" min="1" max="99" />
         </div>`,
      ) +
        scene(
          'No buttons at all, and the field that keeps them',
          'An amount in a dense table is typed and never spun, so two buttons in that cell are two things to hit by mistake. The arrows still work in both.',
          `<div slNumberField stepper="none">
             <input
               slNumberFieldInput
               defaultValue="1480"
               locale="pt-BR"
               [format]="{ style: 'currency', currency: 'BRL' }"
             />
           </div>
           <div slNumberField stepper="stacked">
             <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
           </div>`,
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The bound, and the button that stops at it',
        'The first control is already at its maximum and the second at its minimum: the stepper that would leave the range is disabled rather than silently inert, so its name still announces and it looks unavailable.',
        `<div slNumberField><input slNumberFieldInput defaultValue="10" min="0" max="10" /></div>
         <div slNumberField><input slNumberFieldInput defaultValue="0" min="0" max="10" /></div>`,
      ) +
        scene(
          'Three answers to a value outside the range',
          'Type 400 into each and tab away. blur returns it to 100, strict refused the keystroke that would have left the range, and none keeps what you typed and reports it as invalid.',
          `<div slNumberField>
             <input slNumberFieldInput min="0" max="100" clamp="blur" placeholder="clamp=blur" />
           </div>
           <div slNumberField>
             <input slNumberFieldInput min="0" max="100" clamp="strict" placeholder="clamp=strict" />
           </div>
           <div slNumberField>
             <input slNumberFieldInput min="0" max="100" clamp="none" placeholder="clamp=none" />
           </div>`,
        ),
    ),
  }),
};

export const Format: Story = {
  parameters: scenario('format'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Currency, percent and unit',
        'One numeric type, written three ways. The percent control holds 0.125 and shows 12,5%: what a reader types and what a server receives are the same number in both directions.',
        `<div slNumberField>
           <input
             slNumberFieldInput
             defaultValue="1480"
             locale="pt-BR"
             [format]="{ style: 'currency', currency: 'BRL' }"
           />
         </div>
         <div slNumberField>
           <input
             slNumberFieldInput
             defaultValue="0.125"
             locale="pt-BR"
             step="0.01"
             [format]="{ style: 'percent' }"
           />
         </div>
         <div slNumberField>
           <input
             slNumberFieldInput
             defaultValue="240"
             locale="pt-BR"
             [format]="{ style: 'unit', unit: 'kilogram', unitDisplay: 'short' }"
           />
         </div>`,
      ) +
        scene(
          'Precision, and the symbol that is not part of the value',
          'maximumFractionDigits is where precision is stated, and it also decides which keys the filter admits: the integer control below refuses a decimal separator outright.',
          `<div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="1.5"
               min="0"
               [format]="{ maximumFractionDigits: 0 }"
             />
           </div>
           <div slNumberField>
             <input slNumberFieldInput defaultValue="12.5" locale="pt-BR" />
             <span slNumberFieldEnd>%</span>
           </div>`,
        ),
    ),
  }),
};

export const FormatOn: Story = {
  parameters: scenario('formatOn'),
  render: () => ({
    template: grid(
      2,
      scene(
        'change — regrouped as it is typed',
        'Select the value and type 1234567 back into each. The separators arrive with the digits, so the magnitude is checkable at the moment it is being got wrong, and the caret stays on the character it was on because it is counted in the reader’s own characters rather than in string indices.',
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="1234567" locale="pt-BR" />
         </div>
         <div slNumberField>
           <input
             slNumberFieldInput
             defaultValue="1234567"
             locale="pt-BR"
             [format]="{ style: 'currency', currency: 'BRL' }"
           />
         </div>`,
      ) +
        scene(
          'commit — held until the field is left',
          'The same two amounts, and the same two at rest: the axis changes nothing until a key is pressed. Retype them and the text stays 1234567 until blur, Enter, a stepper press or a key step — the model React Aria, Base UI, Zag, Carbon and Fluent ship, and what an amount pasted and audited rather than typed wants. The number moves on every keystroke that parses under both.',
          `<div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="1234567"
               locale="pt-BR"
               formatOn="commit"
             />
           </div>
           <div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="1234567"
               locale="pt-BR"
               formatOn="commit"
               [format]="{ style: 'currency', currency: 'BRL' }"
             />
           </div>`,
        ),
    ),
  }),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One number, three ways of writing it',
        'Paste “R$ 1.480,00” into the first and “١٬٤٨٠” into the third: both parse, because the parser is built from the same Intl parts the formatter writes with.',
        `<div slNumberField><input slNumberFieldInput defaultValue="1480.5" locale="pt-BR" /></div>
         <div slNumberField><input slNumberFieldInput defaultValue="1480.5" locale="en-US" /></div>
         <div slNumberField><input slNumberFieldInput defaultValue="1480.5" locale="ar-EG" /></div>`,
      ) +
        scene(
          'The same decision, taken per control or once for the application',
          'A form where one amount reads 1.234 as a thousand and another as one point two three four is a form that loses money, so provideSlotted carries the locale for the whole application.',
          `<div slNumberField>
             <input slNumberFieldInput defaultValue="1480.5" locale="pt-BR" />
           </div>
           <div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="98765.43"
               locale="pt-BR"
               [format]="{ style: 'currency', currency: 'BRL' }"
             />
           </div>`,
        ),
    ),
  }),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A mark before the value and a unit after it',
        'Neither is ever squeezed: the value gives up width first, because the value is the part that can scroll. Switch the toolbar to rtl and R$ stays before the amount.',
        `<div slNumberField>
           <span slNumberFieldStart>R$</span>
           <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
           <span slNumberFieldEnd>BRL</span>
         </div>
         <div slNumberField>
           <input slNumberFieldInput defaultValue="240" min="0" />
           <span slNumberFieldEnd>un</span>
         </div>`,
      ) +
        scene(
          'Inside the value, or beside it',
          'The first control’s symbol comes from format and is part of what a reader copies; the second’s is a directive on the consumer’s own element, never selected and never parsed.',
          `<div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="1480"
               locale="pt-BR"
               [format]="{ style: 'currency', currency: 'BRL' }"
             />
           </div>
           <div slNumberField>
             <span slNumberFieldStart>R$</span>
             <input slNumberFieldInput defaultValue="1480" locale="pt-BR" />
           </div>`,
        ),
    ),
  }),
};

export const Scrub: Story = {
  parameters: scenario('scrub'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A layer’s geometry, as a design tool edits it',
        'Press a mark and drag sideways: two pixels per step, Shift for ten. The mark lifts to the value’s ink under the pointer, and the frame carries data-scrubbing while the drag lasts.',
        `<div slNumberField>
           <span slNumberFieldStart><span slNumberFieldScrub>L</span></span>
           <input slNumberFieldInput aria-label="Largura" defaultValue="320" min="0" />
           <span slNumberFieldEnd>px</span>
         </div>
         <div slNumberField>
           <span slNumberFieldStart><span slNumberFieldScrub>H</span></span>
           <input slNumberFieldInput aria-label="Altura" defaultValue="180" min="0" />
           <span slNumberFieldEnd>px</span>
         </div>`,
      ) +
        scene(
          'A coarser and a finer drag',
          'sensitivity is pixels per step: the angle takes four, so a full turn is a long but steady drag; the opacity stops at its bounds whatever the pointer does.',
          `<div slNumberField>
             <span slNumberFieldStart><span slNumberFieldScrub [sensitivity]="4">A</span></span>
             <input slNumberFieldInput aria-label="Angle" defaultValue="45" min="0" max="360" />
             <span slNumberFieldEnd>°</span>
           </div>
           <div slNumberField>
             <span slNumberFieldStart><span slNumberFieldScrub>O</span></span>
             <input slNumberFieldInput aria-label="Opacidade" defaultValue="100" min="0" max="100" />
             <span slNumberFieldEnd>%</span>
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Invalid, and what says so besides the border',
        'The border is the quietest part of it: aria-invalid announces the state and the field’s error says it in words, because in the high-contrast scheme the border cannot carry it at all.',
        `<div slField invalid>
           <label slFieldLabel>Desconto</label>
           <div slNumberField>
             <input
               slNumberFieldInput
               defaultValue="1.2"
               max="1"
               clamp="none"
               [format]="{ style: 'percent' }"
             />
           </div>
           <span slFieldError>The discount cannot exceed 100%.</span>
         </div>`,
      ) +
        scene(
          'Read-only is not disabled',
          'Read-only keeps full-strength ink and softens its edge, stays focusable and copyable and is still submitted; disabled is muted to a measured color rather than faded. Both disable the steppers instead of removing them.',
          `<div slNumberField><input slNumberFieldInput defaultValue="12" readOnly /></div>
           <div slNumberField><input slNumberFieldInput defaultValue="12" disabled /></div>
           <div slNumberField>
             <span slNumberFieldStart>R$</span>
             <input slNumberFieldInput defaultValue="1480" locale="pt-BR" disabled />
           </div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Longer than the box, and negative',
        'The value ellipsises rather than clipping mid-glyph, the digits are tabular so nothing shifts as they are typed over, and the minus sign stays in front of the amount in a right-to-left document.',
        `<div slNumberField>
           <input slNumberFieldInput defaultValue="1480320559774.25" locale="pt-BR" />
         </div>
         <div slNumberField>
           <span slNumberFieldStart>R$</span>
           <input slNumberFieldInput defaultValue="-1480" locale="pt-BR" />
           <span slNumberFieldEnd>BRL</span>
         </div>`,
      ) +
        scene(
          'At 240 pixels, and in another numbering system',
          'The value surrenders width first while the stepper keeps its target size, so the buttons stay hittable in a drawer as narrow as a phone.',
          measure(
            `<div slNumberField>
               <span slNumberFieldStart>R$</span>
               <input slNumberFieldInput defaultValue="1480320559" locale="pt-BR" />
             </div>`,
          ) +
            measure(
              `<div slNumberField stepper="split">
                 <input slNumberFieldInput defaultValue="1480" locale="ar-EG" />
               </div>`,
            ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { quantity: new FormControl<number | null>(3) },
    template: grid(
      2,
      scene(
        'A control that belongs in a reactive form',
        'ControlValueAccessor is the two-way binding the ecosystem expects, and it is why there is no [(value)]: a two-way binding has one slot and can carry neither a reason nor cancel(). The form receives the number, never the formatted string.',
        `<div slNumberField>
           <input slNumberFieldInput [formControl]="quantity" min="1" max="99" />
         </div>`,
      ) +
        scene(
          'Reaching the instance, and submitting the raw number',
          'exportAs hands the template the directive, which carries increment(), decrement() and inputElement. The hidden input beside the visible one carries 1480, never the formatted string.',
          `<div class="slotted-demo-row">
             <div slNumberField>
               <input slNumberFieldInput #campo="slNumberFieldInput" defaultValue="3" max="99" />
             </div>
             <button type="button" (click)="campo.increment()">Mais um</button>
           </div>
           <div slNumberField>
             <input
               slNumberFieldInput
               name="amount"
               defaultValue="1480"
               locale="pt-BR"
               [format]="{ style: 'currency', currency: 'BRL' }"
             />
           </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Every key the pattern lists',
        'Arrows step by 5, Shift and the page keys by 25, Alt by 0.5, Home reaches 0 and End reaches 100. Tab never lands on a stepper: twenty amounts in a form would be forty extra stops.',
        `<div slNumberField>
           <input
             slNumberFieldInput
             defaultValue="50"
             min="0"
             max="100"
             step="5"
             largeStep="25"
             smallStep="0.5"
           />
         </div>
         <div slNumberField>
           <input slNumberFieldInput defaultValue="4" min="2" step="3" snapToStep />
         </div>`,
      ) +
        scene(
          'The wheel, and the key that is left alone',
          'Focus the first control and turn the wheel over it; do the same on the second and nothing moves. Nothing is bound to Escape, and Enter commits the value and then submits the form.',
          `<div slNumberField>
             <input slNumberFieldInput defaultValue="50" min="0" max="100" wheel />
           </div>
           <div slNumberField>
             <input slNumberFieldInput defaultValue="50" min="0" max="100" />
           </div>`,
        ),
    ),
  }),
};
