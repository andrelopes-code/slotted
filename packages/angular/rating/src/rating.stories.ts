import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlRating, SlRatingCaption, SlRatingSymbol } from './rating';
import type { RatingSize, RatingStep, RatingTone } from './rating-defaults';
import { ANGULAR_RATING_DOCS, ANGULAR_RATING_TOKENS } from './rating.docs';

interface RatingStoryArgs {
  clearable: boolean;
  disabled: boolean;
  invalid: boolean;
  max: number;
  readOnly: boolean;
  size: RatingSize;
  step: RatingStep;
  tone: RatingTone;
}

/** The word for each star of a five-point scale, the first for no rating at all. */
const WORDS = ['Tap a star', 'Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_RATING_DOCS.rating.scenes, {
    playground: Playground,
    half: Half,
    states: States,
    field: InAField,
    labels: Labels,
    keyboard: Keyboard,
    touch: Touch,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlGlyph,
  SlIcon,
  SlRating,
  SlRatingCaption,
  SlRatingSymbol,
  SlText,
];

const meta: Meta<RatingStoryArgs> = {
  title: 'Components/Rating',
  component: SlRating,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Rating',
        description:
          'An ordinal value chosen from a row of symbols, around native radios that share a name. The arrows stop at both ends, a half step is a second radio over half the star, and a finger dragged along the row checks the star under it.',
        framework: 'Angular',
        ...ANGULAR_RATING_DOCS.rating,
        tokens: ANGULAR_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<RatingStoryArgs>;

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

const CAPTION = `<ng-template slRatingCaption let-value="value" let-preview="preview">{{
  words[preview ?? value ?? 0]
}}</ng-template>`;

export const Playground: Story = {
  args: {
    clearable: true,
    disabled: false,
    invalid: false,
    max: 5,
    readOnly: false,
    size: 'md',
    step: 1,
    tone: 'warning',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    step: { control: 'inline-radio', options: [1, 0.5] },
    tone: { control: 'inline-radio', options: ['accent', 'info', 'success', 'warning', 'danger'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, value: 4, words: WORDS },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slRating
          aria-label="Qualidade do som"
          [(value)]="value"
          [size]="size"
          [tone]="tone"
          [max]="max"
          [step]="step"
          [clearable]="clearable"
          [disabled]="disabled"
          [readOnly]="readOnly"
          [invalid]="invalid"
        >
          <ng-template slRatingCaption let-value="value" let-preview="preview">{{
            max === 5 && step === 1 ? words[preview ?? value ?? 0] : (preview ?? value ?? '—')
          }}</ng-template>
        </div>
      </div>`,
  }),
};

export const Half: Story = {
  parameters: scenario('half'),
  render: () => ({
    props: { comfort: 3.5, fit: null },
    template: grid(
      2,
      scene(
        'Half a star, pressed where it is drawn',
        'The half radio covers the inline-start half of each star and sits above the whole one, so the pointer and the arrow keys both reach 3,5. The caption writes the number in the locale.',
        `<div slRating aria-label="Comfort" [step]="0.5" [(value)]="comfort">
           <ng-template slRatingCaption let-value="value" let-preview="preview">{{
             preview ?? value ?? 'No rating'
           }}</ng-template>
         </div>`,
      ) +
        scene(
          'Starting empty',
          'With no value, Tab lands on the first radio — the half of the first star — and ArrowRight moves in steps of one half.',
          `<div slRating aria-label="Ajuste" [step]="0.5" [(value)]="fit"></div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { words: WORDS },
    template: grid(
      3,
      scene(
        'Read-only, which is not disabled',
        'Every radio keeps its tab stop and the lit stars keep their colour, because the value is real; a press and the arrow keys are refused, and aria-readonly says so.',
        `<div slRating aria-label="Nota publicada" readOnly [value]="4">${CAPTION}</div>`,
      ) +
        scene(
          'Disabled',
          'The row leaves the tab order through the native attribute on every radio, and the stars dim together with the caption.',
          `<div slRating aria-label="Locked rating" disabled [value]="2">${CAPTION}</div>`,
        ) +
        scene(
          'Required and still empty',
          'Invalid reddens the edge of every star and announces aria-invalid; required is aria-required, never the native attribute on a radio.',
          `<div slRating aria-label="Required rating" invalid required>
             <span slRatingCaption>Choose a rating</span>
           </div>`,
        ),
    ),
  }),
};

export const InAField: Story = {
  parameters: scenario('field'),
  render: () => ({
    props: { control: new FormControl<number | null>(null, Validators.required), words: WORDS },
    template: grid(
      2,
      scene(
        'A required rating in a review form',
        'The field gives the label, the description and the error; the rating is the value accessor and the validator. Tab through it once without choosing, and the error appears.',
        `<div slField required [invalid]="control.touched && control.invalid">
           <label slFieldLabel>Sound quality</label>
           <p slFieldDescription>From 1 (terrible) to 5 (excellent).</p>
           <div slRating [formControl]="control">${CAPTION}</div>
           <p slFieldError>Choose a rating to submit the review.</p>
         </div>
         <span slText size="sm" tone="muted">form value: {{ control.value ?? 'null' }}</span>`,
        'block',
      ) +
        scene(
          'The field decides the size',
          'A small field holding a medium rating would be two sizes in one row, so the rating reads the field’s step before the application’s.',
          `<div slField size="sm">
             <label slFieldLabel>Delivery</label>
             <div slRating [value]="5"></div>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => ({
    props: { words: WORDS, recommend: 8 },
    template: grid(
      1,
      scene(
        'A word for each star',
        'The caption is the consumer’s ng-template, handed the value and the preview: hover a star and its word replaces the chosen one until the pointer leaves.',
        `<div slRating aria-label="Qualidade do som" [value]="4">${CAPTION}</div>`,
      ) +
        scene(
          'A scale of ten, and a reworded radio name',
          'Ten stars stay one row and shrink rather than wrap; each radio is named from the itemLabel message, reworded here for this instance only.',
          `<div
             slRating
             aria-label="Recomendaria a um amigo"
             size="lg"
             [max]="10"
             [(value)]="recommend"
             [messages]="{ itemLabel: 'Nota {value} de {max}' }"
           >
             <ng-template slRatingCaption let-value="value" let-preview="preview">{{
               preview ?? value ?? 'No rating'
             }}</ng-template>
           </div>`,
          'block',
        ) +
        scene(
          'A symbol of the consumer’s',
          'slRatingSymbol replaces the star in both the unlit and the lit part, so the stylesheet clips a circle the way it clips a star — the dotted scale of a travel site.',
          `<div slRating aria-label="Location" tone="success" [value]="3">
             <ng-template slRatingSymbol>
               <span slIcon><svg slGlyph name="circle"></svg></span>
             </ng-template>
           </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { words: WORDS, service: 3, mirrored: 2 },
    template: grid(
      2,
      scene(
        'The arrows stop at both ends',
        'ArrowRight and ArrowUp raise by one step and stop at five; ArrowLeft and ArrowDown lower and stop at one; Home and End reach both ends; Backspace and Delete empty it. Focus follows the new value.',
        `<div slRating aria-label="Atendimento" [(value)]="service">${CAPTION}</div>`,
      ) +
        scene(
          'In a right-to-left page',
          'The inline arrows follow the direction the page is written in, so ArrowLeft raises the value here; the block arrows do not swap, because up is more in every script.',
          `<div dir="rtl">
             <div slRating aria-label="تقييم" [(value)]="mirrored"></div>
           </div>`,
        ),
    ),
  }),
};

export const Touch: Story = {
  parameters: scenario('touch'),
  render: () => ({
    props: { words: WORDS, battery: 4 },
    template: grid(
      1,
      scene(
        'Drag a finger along the row',
        'On a touch screen or with a pen, a drag checks the star under the finger and the root carries data-dragging while it lasts. The row keeps vertical panning, so the page still scrolls; a mouse hovers and presses instead.',
        `<div slRating aria-label="Battery life" size="lg" [(value)]="battery">${CAPTION}</div>`,
      ),
    ),
  }),
};
