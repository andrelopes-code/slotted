import { scenario } from '@slotted/storybook-workbench';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlRating, SlRatingCaption } from './rating';
import { SlRatingDisplay } from './rating-display';
import { SlRatingSummary } from './rating-summary';

const SIZES = ['sm', 'md', 'lg'];
const TONES = ['accent', 'info', 'success', 'warning', 'danger'];
const WORDS = ['Tap a star', 'Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];

const meta: Meta = {
  title: 'Components/Rating/Overview',
  decorators: [
    moduleMetadata({
      imports: [SlRating, SlRatingCaption, SlRatingDisplay, SlRatingSummary, SlText],
    }),
  ],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * One band of the overview page: the heading and its sentence in the sidebar
 * column, the demonstration in the wide one. The section carries the page's
 * inset and the gap between the columns; the intro is only the column.
 */
const band = (title: string, description: string, body: string) => `
  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>${title}</h2>
      <p>${description}</p>
    </header>
    <div class="slotted-component-lab__body">${body}</div>
  </section>`;

const page = (bands: string) => `<main class="slotted-component-lab">${bands}</main>`;

export const Members: Story = {
  parameters: scenario('members'),
  render: () => ({
    props: { value: 4, words: WORDS },
    template: page(
      band(
        'Rating',
        'The value a reader chooses: native radios sharing a name, one per step, under a row of stars that never wraps.',
        `<div class="slotted-demo-stage" data-layout="block">
           <div slRating aria-label="Qualidade do som" [(value)]="value">
             <ng-template slRatingCaption let-value="value" let-preview="preview">{{
               words[preview ?? value ?? 0]
             }}</ng-template>
           </div>
         </div>`,
      ) +
        band(
          'RatingDisplay',
          'The value a page reports: one image named by its value and count, in full, compact or histogram form.',
          `<div class="slotted-demo-stage" data-layout="stack">
             <div slRatingDisplay [value]="4.6" [count]="1284"></div>
             <div slRatingDisplay variant="histogram" [value]="4.7" [count]="1284" [distribution]="[9, 18, 47, 158, 1052]"></div>
           </div>`,
        ) +
        band(
          'RatingSummary',
          'The aggregate of many ratings, as bars per level or as a spectrum with the mean, its margin and one conclusion.',
          `<div class="slotted-demo-stage" data-layout="block">
             <section slRatingSummary aria-label="Reviews" [counts]="[9, 18, 47, 158, 1052]"></section>
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: page(
      band(
        'Sizes',
        'Three steps shared by all three members. The symbols keep their size under density; the text beside them follows it.',
        `<div class="slotted-demo-stage" data-layout="stack">${SIZES.map(
          (size) =>
            `<div class="slotted-demo-row">
               <div slRating aria-label="Tamanho ${size}" size="${size}" [value]="3"></div>
               <div slRatingDisplay size="${size}" [value]="4.6" [count]="1284"></div>
             </div>`,
        ).join('')}</div>`,
      ),
    ),
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    template: page(
      band(
        'Tones',
        'Four tones for the lit share; warning is the default. secondary is outside the axis, because a lit star in a ground colour reads as an unlit one.',
        `<div class="slotted-demo-stage" data-layout="stack">${TONES.map(
          (tone) =>
            `<div class="slotted-demo-row">
               <div slRating aria-label="Tom ${tone}" tone="${tone}" [value]="3.5" [step]="0.5"></div>
               <span slText size="sm" tone="muted">${tone}</span>
             </div>`,
        ).join('')}</div>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { mine: null as number | null, words: WORDS },
    template: page(
      band(
        'A product page',
        'The summary heads the reviews, each review reports its rating with the display, and the form at the end asks for the reader’s own with the input member — one family, three jobs.',
        `<div class="slotted-demo-stage" data-layout="block">
           <section slRatingSummary aria-label="Studio Pro Headphones reviews" filterable [counts]="[9, 18, 47, 158, 1052]"></section>
           <div class="slotted-demo-stack">
             <div class="slotted-demo-row">
               <div slRatingDisplay size="sm" [value]="5" [showValue]="false"></div>
               <span slText size="sm">Strong bass and excellent noise cancellation on the subway.</span>
             </div>
             <div class="slotted-demo-row">
               <div slRatingDisplay size="sm" [value]="3" [showValue]="false"></div>
               <span slText size="sm">Comfortable, but the battery lasts less than advertised.</span>
             </div>
           </div>
           <div slRating aria-label="Your rating" [(value)]="mine">
             <ng-template slRatingCaption let-value="value" let-preview="preview">{{
               words[preview ?? value ?? 0]
             }}</ng-template>
           </div>
         </div>`,
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: page(
      band(
        'What a screen reader hears',
        'The input member is a radiogroup whose radios are named "3 out of 5"; the display is one image named "Rated 4.6 out of 5, 1,284 ratings"; each level of a summary is named with its count and share. Captions, glyphs, bars and axes are aria-hidden, because each name already says what they draw.',
        `<div class="slotted-demo-stage" data-layout="stack">
           <div slRating aria-label="Rating" [value]="3"></div>
           <div slRatingDisplay [value]="4.6" [count]="1284"></div>
           <div slRating aria-label="Read-only rating" readOnly [value]="4"></div>
         </div>`,
      ),
    ),
  }),
};
