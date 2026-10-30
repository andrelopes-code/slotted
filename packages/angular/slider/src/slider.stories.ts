import { ReactiveFormsModule } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSlider } from './slider';
import type { SliderOrientation, SliderSize, SliderValueLabel } from './slider-defaults';
import { ANGULAR_SLIDER_DOCS, ANGULAR_SLIDER_TOKENS } from './slider.docs';

interface SliderStoryArgs {
  orientation: SliderOrientation;
  size: SliderSize;
  step: number;
  valueLabel: SliderValueLabel;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SLIDER_DOCS.slider.scenes, {
    playground: Playground,
    sizes: Sizes,
    orientation: Orientation,
    range: Range,
    marks: Marks,
    origin: Origin,
    format: Format,
    valueLabel: ValueLabel,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlButton,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlSlider,
];

const QUALITY = [
  { value: 0, label: 'Low' },
  { value: 25, label: 'Reduced' },
  { value: 50, label: 'Medium' },
  { value: 75, label: 'High' },
  { value: 100, label: 'Maximum' },
];

const DELIVERY = [
  { value: 0, label: 'Economy' },
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Same-day express' },
];

const ZERO = [{ value: 0, label: '0' }];
const CURRENCY = { currency: 'BRL', style: 'currency' } as const;
const PERCENT = { style: 'percent' } as const;
const AMOUNT = { maximumFractionDigits: 2, minimumFractionDigits: 2 } as const;

const meta: Meta<SliderStoryArgs> = {
  title: 'Components/Slider',
  component: SlSlider,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Slider',
        description:
          'One value or several on a scale, held in a real input[type=range] under every thumb, moved by the pointer or by the whole APG keyboard table, and written for a locale by Intl.NumberFormat.',
        framework: 'Angular',
        ...ANGULAR_SLIDER_DOCS.slider,
        tokens: ANGULAR_SLIDER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SliderStoryArgs>;

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

/** A narrow column, for showing what a scale does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: { orientation: 'horizontal', size: 'md', step: 1, valueLabel: 'auto' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Volume</label>
          <div
            slSlider
            [defaultValue]="40"
            [size]="size"
            [orientation]="orientation"
            [valueLabel]="valueLabel"
            [step]="step"
          ></div>
          <span slFieldDescription>Applies to all alerts in the app.</span>
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
        'The thumb, the type and the target grow with the step; the rail keeps its weight, because a rail is a line and not a control.',
        `<div slSlider size="sm" aria-label="Small" [defaultValue]="25"></div>
         <div slSlider size="md" aria-label="Medium" [defaultValue]="50"></div>
         <div slSlider size="lg" aria-label="Large" [defaultValue]="75"></div>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium control is a field and a control disagreeing about one row, so the slider reads the field’s step before the token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Compression</label>
             <div slSlider [defaultValue]="30"></div>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Nitidez</label>
             <div slSlider [defaultValue]="70"></div>
           </div>`,
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
        'A mixing desk',
        'Three vertical scales, each with its minimum at the bottom — where the browser’s own vertical range input puts it, and where a fader’s zero belongs.',
        `<div slSlider orientation="vertical" valueLabel="always" aria-label="Treble" [defaultValue]="70"></div>
         <div slSlider orientation="vertical" valueLabel="always" aria-label="Mid" [defaultValue]="35"></div>
         <div slSlider orientation="vertical" valueLabel="none" aria-label="Bass" [defaultValue]="50"></div>`,
        'row',
      ) +
        scene(
          'The same scale, lying down',
          'Up and Down mean more and less in both orientations. Only Right and Left mirror, because they name a side and a side changes with the reading direction.',
          `<div slSlider aria-label="Horizontal" [defaultValue]="70"></div>
           <div slSlider aria-label="Com marcas" [defaultValue]="50" [marks]="[0, 50, 100]"></div>`,
        ),
    ),
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    props: { currency: CURRENCY },
    template: grid(
      2,
      scene(
        'A price band',
        'Each thumb’s min and max follow its neighbour, so the two cannot cross — and a screen reader is told the range each one actually has rather than the scale’s.',
        `<div
           slSlider
           locale="pt-BR"
           name="preco"
           [defaultValue]="[240, 780]"
           [max]="1000"
           [step]="10"
           [format]="currency"
           [thumbLabels]="['Minimum price', 'Maximum price']"
         ></div>`,
      ) +
        scene(
          'Two steps apart, always',
          'minStepsBetween keeps a gap the reader cannot close. Drag the left thumb into the right one: it stops two steps short, and the announced maximum stops with it.',
          `<div
             slSlider
             valueLabel="always"
             [defaultValue]="[40, 60]"
             [step]="5"
             [minStepsBetween]="2"
             [thumbLabels]="['Start', 'End']"
           ></div>`,
        ),
    ),
  }),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => ({
    props: { quality: QUALITY },
    template: grid(
      2,
      scene(
        'A five-step scale',
        'Ticks stand beside the rail rather than on it, so none of them has to be legible against the fill and against the empty channel at once. The first and last labels align inside the control.',
        `<div slSlider aria-label="Qualidade" [defaultValue]="50" [step]="25" [marks]="quality"></div>`,
      ) +
        scene(
          'A ruler, and the same scale at 360 pixels',
          'Numbers alone draw ticks and reserve no room for labels. Narrow the column and the rail shrinks with it: a slider is fluid rather than reflowing, so the thumb and the type keep their size.',
          `<div slSlider aria-label="Parcelas" [defaultValue]="6" [max]="10" [marks]="[2, 4, 6, 8]"></div>` +
            measure(
              `<div slSlider aria-label="Qualidade estreita" [defaultValue]="50" [step]="25" [marks]="quality"></div>`,
            ),
        ),
    ),
  }),
};

export const Origin: Story = {
  parameters: scenario('origin'),
  render: () => ({
    props: { zero: ZERO },
    template: grid(
      2,
      scene(
        'A gain that fills from nought',
        'A balance control is not a volume: nought is in the middle, and the fill runs outward from it in whichever direction the value went.',
        `<div slSlider aria-label="Gain" [defaultValue]="3" [min]="-10" [max]="10" [origin]="0" [marks]="zero"></div>
         <div slSlider aria-label="Correction" [defaultValue]="-6" [min]="-10" [max]="10" [origin]="0" [marks]="zero"></div>`,
      ) +
        scene(
          'And the same scale filling from an end',
          'origin defaults to min, which is what a volume wants: the fill is how much there is, measured from nothing.',
          `<div slSlider aria-label="Volume" [defaultValue]="3" [min]="-10" [max]="10"></div>
           <div slSlider aria-label="Restante" origin="max" [defaultValue]="3" [min]="-10" [max]="10"></div>`,
        ),
    ),
  }),
};

export const Format: Story = {
  parameters: scenario('format'),
  render: () => ({
    props: { currency: CURRENCY, percent: PERCENT, amount: AMOUNT },
    template: grid(
      2,
      scene(
        'A currency and a percentage',
        'The number is the domain value and the string is a formatting of it, through the same Intl.NumberFormat the number field uses. The read-out, the bubble and aria-valuetext all read the same one.',
        `<div slSlider locale="pt-BR" aria-label="Budget" [defaultValue]="1480" [max]="4000" [step]="20" [format]="currency"></div>
         <div slSlider aria-label="Share" [defaultValue]="0.4" [max]="1" [step]="0.01" [format]="percent"></div>`,
      ) +
        scene(
          'One value, two locales',
          'The separator, the grouping and the numbering system are the locale’s. A form where one scale reads 1.480 as a thousand and another as one point four eight is a form that loses money.',
          `<div slSlider locale="pt-BR" aria-label="In Portuguese" [defaultValue]="1480" [max]="4000" [step]="20" [format]="amount"></div>
           <div slSlider locale="en-US" aria-label="In English" [defaultValue]="1480" [max]="4000" [step]="20" [format]="amount"></div>`,
        ),
    ),
  }),
};

export const ValueLabel: Story = {
  parameters: scenario('valueLabel'),
  render: () => ({
    props: { delivery: DELIVERY },
    template: grid(
      2,
      scene(
        'While it moves, or always',
        'The room the bubble stands in is reserved either way, so the rail does not move down when a drag begins. Focus one of these and the number appears without anything shifting.',
        `<div slSlider valueLabel="auto" aria-label="Automatic" [defaultValue]="40"></div>
         <div slSlider valueLabel="always" aria-label="Always" [defaultValue]="70"></div>`,
      ) +
        scene(
          'And a scale whose values are words',
          'A bubble is for a number. A value that is a sentence belongs in a label of the consumer’s own, so none withdraws both the bubble and the read-out.',
          `<div slField>
             <label slFieldLabel>Delivery</label>
             <div slSlider valueLabel="none" [defaultValue]="2" [max]="2" [marks]="delivery"></div>
             <span slFieldDescription>Express, same day.</span>
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
        'At rest, and in error',
        'Invalid reddens the fill and the thumb and retargets the focus ring; it is never color alone, because aria-invalid announces it and the field says it in words.',
        `<div slSlider aria-label="Normal" [defaultValue]="62"></div>
         <div slField [invalid]="true">
           <label slFieldLabel>Share</label>
           <div slSlider [defaultValue]="96"></div>
           <p slFieldError>The share cannot exceed ninety percent.</p>
         </div>`,
      ) +
        scene(
          'Read-only is not disabled',
          'Read-only keeps the ink at full strength and steps the scale onto a neutral tone: the value is real and still submitted. Disabled mutes all of it, answers no key and lifts nothing off the page.',
          `<div slSlider readOnly aria-label="Somente leitura" [defaultValue]="30"></div>
           <div slSlider disabled aria-label="Desativado" [defaultValue]="30"></div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { delivery: DELIVERY, amount: AMOUNT },
    template: grid(
      2,
      scene(
        'A label of four words, and a scale at 360 pixels',
        'Nothing is truncated and nothing leaves the DOM: a label longer than the space between two ticks wraps, and the one at the end of the scale aligns inside the control rather than hanging off it.',
        `<div slSlider valueLabel="none" aria-label="Delivery" [defaultValue]="2" [max]="2" [marks]="delivery"></div>` +
          measure(
            `<div slSlider valueLabel="none" aria-label="Narrow delivery" [defaultValue]="1" [max]="2" [marks]="delivery"></div>`,
          ),
      ) +
        scene(
          'A negative range, written for a locale',
          'The value is its own bidi run, so a minus sign stays in front of the amount in a right-to-left document. Switch the toolbar to rtl and read the read-out again.',
          `<div
             slSlider
             locale="pt-BR"
             valueLabel="always"
             [defaultValue]="[-1480, 2960]"
             [min]="-4000"
             [max]="4000"
             [step]="20"
             [format]="amount"
             [thumbLabels]="['Minimum balance', 'Maximum balance']"
           ></div>`,
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
        'A field, and the template reaching the instance',
        'The field supplies the label, the error and the identifier with nothing written. exportAs reaches focusThumb, the one action a value cannot express.',
        `<div slField [invalid]="true">
           <label slFieldLabel>Share</label>
           <div slSlider name="share" [defaultValue]="96" #scale="slSlider"></div>
           <p slFieldError>The share cannot exceed ninety percent.</p>
         </div>
         <button slButton type="button" size="sm" variant="outline" (click)="scale.focusThumb(0)">
           Focar o valor
         </button>`,
      ) +
        scene(
          'And the same control inside a reactive form',
          'The component is the control: formControl owns the value, disable() reaches the whole scale, and Angular 22’s Signal Forms bind through the same accessor with nothing added here.',
          `<div slSlider [defaultValue]="[20, 80]" [thumbLabels]="['Minimum', 'Maximum']" valueLabel="always"></div>`,
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
        'Tab to a thumb: arrows step by one, Shift and the page keys by ten, Home and End reach this thumb’s own bounds. In the range below, Home on the upper thumb stops at the lower one.',
        `<div slSlider valueLabel="always" aria-label="One value" [defaultValue]="40"></div>
         <div slSlider valueLabel="always" [defaultValue]="[20, 80]" [thumbLabels]="['Minimum', 'Maximum']"></div>`,
      ) +
        scene(
          'Which arrows mirror',
          'Switch the toolbar to rtl and press Right: the thumb moves toward the end of the track you can see, which is the left. Up and Down never mirror — a scale has a direction and bidi is not it.',
          `<div slSlider valueLabel="always" aria-label="Direction" [defaultValue]="40" [marks]="[0, 50, 100]"></div>`,
        ),
    ),
  }),
};
