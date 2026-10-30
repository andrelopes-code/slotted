import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlRadioGroup } from './radio-group';
import type {
  RadioGroupLabelPlacement,
  RadioGroupOrientation,
  RadioGroupSize,
} from './radio-group-defaults';
import { SlRadio, SlRadioDescription } from './radio-group-parts';
import { ANGULAR_RADIO_GROUP_DOCS, ANGULAR_RADIO_GROUP_TOKENS } from './radio-group.docs';

interface RadioGroupStoryArgs {
  disabled: boolean;
  invalid: boolean;
  labelPlacement: RadioGroupLabelPlacement;
  orientation: RadioGroupOrientation;
  readOnly: boolean;
  size: RadioGroupSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_RADIO_GROUP_DOCS.radioGroup.scenes, {
    playground: Playground,
    orientation: Orientation,
    tile: Tile,
    sizes: Sizes,
    states: States,
    placement: Placement,
    description: Description,
    field: InsideAFieldGroup,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlField,
  SlFieldGroup,
  SlFieldGroupLegend,
  SlFieldLabel,
  SlRadio,
  SlRadioDescription,
  SlRadioGroup,
  SlText,
  SlGrid,
];

const meta: Meta<RadioGroupStoryArgs> = {
  title: 'Components/RadioGroup',
  component: SlRadioGroup,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Radio Group',
        description:
          'One choice out of a set, around native radios that share a name — which is what buys the APG’s whole keyboard table, wrapping and right-to-left arrows included, without a roving tabindex existing in either binding.',
        framework: 'Angular',
        ...ANGULAR_RADIO_GROUP_DOCS.radioGroup,
        tokens: ANGULAR_RADIO_GROUP_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<RadioGroupStoryArgs>;

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

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

const SHIPPING = `<div slRadio value="standard">Standard delivery</div>
  <div slRadio value="express">Express delivery</div>
  <div slRadio value="pickup">Store pickup</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    invalid: false,
    labelPlacement: 'end',
    orientation: 'vertical',
    readOnly: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slRadioGroup
          aria-label="Forma de envio"
          defaultValue="standard"
          [size]="size"
          [orientation]="orientation"
          [labelPlacement]="labelPlacement"
          [disabled]="disabled"
          [invalid]="invalid"
          [readOnly]="readOnly"
        >
          ${SHIPPING}
        </div>
      </div>`,
  }),
};

export const Tile: Story = {
  parameters: scenario('tile'),
  render: () => ({
    template: grid(
      1,
      scene(
        'An exclusive set of surfaces',
        'Tab once into the set and the arrows move the choice through it — the items share a name, so the whole keyboard table is still the browser’s. The chosen tile carries a two-pixel accent edge, which is what survives the high-contrast scheme after the tint flattens.',
        `<div slRadioGroup name="plan-tile" variant="tile" defaultValue="team">
           <div slGrid [gap]="4" minItemWidth="sm">
             <div slRadio value="starter">
               Starter
               <p slRadioDescription>Up to three projects and one seat.</p>
             </div>
             <div slRadio value="team">
               Team
               <p slRadioDescription>Unlimited projects, ten seats and one year of history.</p>
             </div>
             <div slRadio value="scale" disabled>
               Scale
               <p slRadioDescription>Talk to sales.</p>
             </div>
           </div>
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Stacked, which is what a form uses',
        'The distance between two choices is the control gap the theme restates per density, so the same set reads at the same rhythm in a comfortable page and a dense table.',
        `<div slRadioGroup aria-label="Deadline, stacked" defaultValue="today">
           <div slRadio value="today">Today</div>
           <div slRadio value="tomorrow">Tomorrow</div>
           <div slRadio value="week">This week</div>
         </div>`,
      ) +
        scene(
          'In a row that wraps',
          'Two choices sit twice as far apart as a circle does from its own label, and aria-orientation is written here because the group owns its role. Narrow the window: the row wraps rather than clipping.',
          `<div slRadioGroup aria-label="Deadline, inline" orientation="horizontal" defaultValue="today">
             <div slRadio value="today">Today</div>
             <div slRadio value="tomorrow">Tomorrow</div>
             <div slRadio value="week">This week</div>
             <div slRadio value="none">No deadline set</div>
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'The circle, the type and the gap all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<div slRadioGroup aria-label="Compacto" size="sm" orientation="horizontal" defaultValue="a">
           <div slRadio value="a">Compacto</div>
           <div slRadio value="b">Other</div>
         </div>
         <div slRadioGroup aria-label="Default" size="md" orientation="horizontal" defaultValue="a">
           <div slRadio value="a">Default</div>
           <div slRadio value="b">Other</div>
         </div>
         <div slRadioGroup aria-label="Comfortable" size="lg" orientation="horizontal" defaultValue="a">
           <div slRadio value="a">Comfortable</div>
           <div slRadio value="b">Other</div>
         </div>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium set is a field and a control disagreeing about one row, so the group reads the field’s step before the application token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Prioridade</label>
             <div slRadioGroup defaultValue="low">
               <div slRadio value="low">Normal</div>
               <div slRadio value="high">Urgente</div>
             </div>
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      3,
      scene(
        'Invalid says it twice',
        'Every circle reddens and thickens together, because the high-contrast scheme paints every border the same black and colour alone would leave the two states identical there.',
        `<div slRadioGroup aria-label="No choice" invalid required>
           <div slRadio value="a">No choice yet</div>
           <div slRadio value="b">Second option</div>
         </div>`,
      ) +
        scene(
          'Read-only, which is not disabled',
          'Every item keeps its tab stop, its ring and its ink, and the chosen one keeps its accent, because the value is real and still submitted. Only the unchosen grounds and the pointer say otherwise.',
          `<div slRadioGroup aria-label="Plano contratado" readOnly defaultValue="a">
             <div slRadio value="a">Plano contratado</div>
             <div slRadio value="b">Outro plano</div>
           </div>`,
        ) +
        scene(
          'A set, and one option, out of reach',
          'The whole group leaves the tab order with one attribute; a single unavailable option dims from its own element’s state, and the browser skips it with the arrow keys for the same reason.',
          `<div slRadioGroup aria-label="Disabled" disabled defaultValue="a">
             <div slRadio value="a">Whole group disabled</div>
             <div slRadio value="b">Another option</div>
           </div>
           <div slRadioGroup aria-label="One unavailable option" defaultValue="a">
             <div slRadio value="a">Available</div>
             <div slRadio value="b" disabled>Unavailable</div>
           </div>`,
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The circle before the label',
        'The default, and the arrangement a form uses: the circle starts the row, the label owns the gap after it, and each description aligns under its own text.',
        `<div slRadioGroup aria-label="Payment" defaultValue="card">
           <div slRadio value="card">
             Credit card
             <p slRadioDescription>Up to twelve installments.</p>
           </div>
           <div slRadio value="slip">
             ACH transfer
             <p slRadioDescription>Clears within three business days.</p>
           </div>
         </div>`,
      ) +
        scene(
          'The circle after the label',
          'The controls line up with each other at the end of the row rather than each one hugging its own label, which is what a settings list needs and what a column of different-length labels would otherwise lose.',
          `<div slRadioGroup aria-label="Payment, reversed" labelPlacement="start" defaultValue="card">
             <div slRadio value="card">Credit card</div>
             <div slRadio value="slip">ACH transfer</div>
             <div slRadio value="zelle">Zelle</div>
           </div>`,
        ),
    ),
  }),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Described, and not named',
        'A screen reader on the second option hears the second sentence and not the first: each description reaches only its own item’s control, through aria-describedby.',
        `<div slRadioGroup aria-label="Plano" defaultValue="monthly">
           <div slRadio value="monthly">
             Monthly
             <p slRadioDescription>
               Billed on the 5th of every month. Can be canceled at any time, no fee.
             </p>
           </div>
           <div slRadio value="yearly">
             Annual
             <p slRadioDescription>Two months off, billed at signup.</p>
           </div>
         </div>`,
      ) +
        scene(
          'At the smallest step, in a narrow column',
          'The description drops one step below the label’s type and keeps its alignment under the text, so a set of options in a 320-pixel drawer still reads as a list rather than as a paragraph.',
          measure(
            `<div slRadioGroup aria-label="Plano, compacto" size="sm" defaultValue="monthly">
               <div slRadio value="monthly">
                 Mensal
                 <p slRadioDescription>Cobrado todo dia 5.</p>
               </div>
               <div slRadio value="yearly">
                 Anual
                 <p slRadioDescription>Dois meses de desconto.</p>
               </div>
             </div>`,
          ),
        ),
    ),
  }),
};

export const InsideAFieldGroup: Story = {
  parameters: scenario('field'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The legend names the set',
        'The fieldset and its legend group and name the options, so the group renders no radiogroup role of its own — a second one named by the same legend would announce the same set twice.',
        `<fieldset slFieldGroup required>
           <legend slFieldGroupLegend>Payment method</legend>
           <div slRadioGroup name="payment" defaultValue="card">
             <div slRadio value="card">Card</div>
             <div slRadio value="zelle">Zelle</div>
             <div slRadio value="slip">ACH transfer</div>
           </div>
         </fieldset>`,
      ) +
        scene(
          'One attribute disables the whole set',
          'Only the fieldset carries disabled: the browser disables every radio inside it with nothing passed down, and each label dims from its own control’s state.',
          `<fieldset slFieldGroup disabled size="sm">
             <legend slFieldGroupLegend>While the order is under review</legend>
             <div slRadioGroup defaultValue="card">
               <div slRadio value="card">Card</div>
               <div slRadio value="zelle">Zelle</div>
             </div>
           </fieldset>`,
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
        'An option that wraps',
        'The circle stays on the first line box of the label rather than centring itself against the whole block, which is where align-items would put it as soon as the text reaches a second line.',
        `<div slRadioGroup aria-label="Long content" defaultValue="a">
           <div slRadio value="a">
             I authorize sharing the delivery data with the carrier responsible for the
             last leg of the route, including phone number and landmark.
             <p slRadioDescription>
               The circle stays on the first line of the label, and the description under the text.
             </p>
           </div>
           <div slRadio value="b">I do not authorize.</div>
         </div>`,
      ) +
        scene(
          'Content the family did not choose',
          'An unbroken digest breaks instead of taking the page’s horizontal scrollbar with it, and a right-to-left label mirrors the whole row — the same component, not a rearranged one.',
          measure(
            `<div slRadioGroup aria-label="Extreme content" defaultValue="a">
               <div slRadio value="a">
                 sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
               </div>
               <div slRadio value="b" dir="rtl">
                 أوافق على مشاركة بيانات التسليم مع شركة الشحن المسؤولة عن المرحلة الأخيرة.
               </div>
             </div>`,
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A set of choices that is a real list',
        'Angular pays one element for each root where React pays none: the host is the wrapper, so the markup a screen reader walks is a list of items rather than a stack of divs.',
        `<ul slRadioGroup aria-label="A real list" class="slotted-demo-list" defaultValue="a">
           <li slRadio value="a">A list item</li>
           <li slRadio value="b">And another below it</li>
         </ul>`,
      ) +
        scene(
          'The instance a template can reach',
          'exportAs hands the template the group itself, so a caption can read the chosen value without a second source of truth beside the one the group already holds.',
          `<div slRadioGroup #set="slRadioGroup" aria-label="Instance" defaultValue="a">
             <div slRadio value="a">First</div>
             <div slRadio value="b">Second</div>
           </div>
           <span slText size="sm" tone="muted">escolhida: {{ set.selection() }}</span>`,
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
        'One tab stop for the whole set',
        'Tab lands on the chosen item, or on the first when none is chosen; the arrows then move focus and selection together and wrap at both ends. No key listener exists in this family.',
        `<div slRadioGroup aria-label="One tab stop" defaultValue="b">
           <div slRadio value="a">First</div>
           <div slRadio value="b">Chosen, and where Tab lands</div>
           <div slRadio value="c">Terceira</div>
         </div>`,
      ) +
        scene(
          'Nothing chosen yet',
          'With no value the APG asks Tab to land on the first item and nothing to be selected until Space or an arrow key. That is the platform’s behaviour, left alone.',
          `<div slRadioGroup aria-label="No initial choice">
             <div slRadio value="a">First, and where Tab lands</div>
             <div slRadio value="b">Second</div>
           </div>`,
        ),
    ),
  }),
};
