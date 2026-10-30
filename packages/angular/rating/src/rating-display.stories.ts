import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import type { RatingDisplayVariant, RatingSize, RatingTone } from './rating-defaults';
import { SlRatingDisplay } from './rating-display';
import { ANGULAR_RATING_DOCS, ANGULAR_RATING_TOKENS } from './rating.docs';

interface RatingDisplayStoryArgs {
  count: number;
  max: number;
  showValue: boolean;
  size: RatingSize;
  tone: RatingTone;
  value: number;
  variant: RatingDisplayVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_RATING_DOCS.ratingDisplay.scenes, {
    playground: Playground,
    fractions: Fractions,
    compact: Compact,
    histogram: Histogram,
    count: Count,
    content: Content,
  }) as never;

const meta: Meta<RatingDisplayStoryArgs> = {
  title: 'Components/Rating/RatingDisplay',
  component: SlRatingDisplay,
  decorators: [moduleMetadata({ imports: [SlRatingDisplay, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'RatingDisplay',
        description:
          'A rating the page reports rather than asks for: one image of lit symbols, named by its value and its count, drawing any fraction — and, in the histogram variant, the spread behind the mean.',
        framework: 'Angular',
        ...ANGULAR_RATING_DOCS.ratingDisplay,
        tokens: ANGULAR_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<RatingDisplayStoryArgs>;

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

/** A product list row: its name at the start, the histogram display at the end. */
const productRow = (name: string, display: string) => `
  <div class="slotted-demo-row">
    <span slText size="sm">${name}</span>
    ${display}
  </div>`;

export const Playground: Story = {
  args: {
    count: 1284,
    max: 5,
    showValue: true,
    size: 'md',
    tone: 'warning',
    value: 4.6,
    variant: 'full',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: ['accent', 'info', 'success', 'warning', 'danger'] },
    value: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    variant: { control: 'inline-radio', options: ['full', 'compact', 'histogram'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, distribution: [9, 18, 47, 158, 1052] },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slRatingDisplay
          [value]="value"
          [max]="max"
          [count]="count"
          [size]="size"
          [tone]="tone"
          [variant]="variant"
          [showValue]="showValue"
          [distribution]="distribution"
        ></div>
      </div>`,
  }),
};

export const Fractions: Story = {
  parameters: scenario('fractions'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Tenths of a star',
        'Each item reads its own lit share: 4,6 lights six tenths of the fifth star and 1,3 three tenths of the second. The number to one place is written beside the row.',
        `<div slRatingDisplay [value]="4.6"></div>
         <div slRatingDisplay [value]="3.3"></div>
         <div slRatingDisplay [value]="1.3"></div>`,
      ) +
        scene(
          'At every size',
          'The symbol does not follow density — a star of 20 pixels in a dense table is still a star — while the text beside it does.',
          `<div slRatingDisplay size="sm" [value]="2.25"></div>
           <div slRatingDisplay size="md" [value]="2.25"></div>
           <div slRatingDisplay size="lg" [value]="2.25"></div>`,
        ),
    ),
  }),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One star, the number and the count',
        'The form a product card or a table cell has room for. The image is still named by the whole value and the scale, so nothing is lost for a screen reader.',
        `<div class="slotted-demo-rows">
           <span>sm</span>
           <div slRatingDisplay variant="compact" size="sm" [value]="4.6" [count]="1284"></div>
           <span>md</span>
           <div slRatingDisplay variant="compact" [value]="4.6" [count]="1284"></div>
           <span>lg</span>
           <div slRatingDisplay variant="compact" size="lg" [value]="3.3" [count]="87"></div>
         </div>`,
        'block',
      ) +
        scene(
          'In a product card’s meta line',
          'Beside a price and a stock line, the compact display keeps to one line and one text step, and its count is grouped in the locale.',
          `<div class="slotted-demo-row">
             <span slText weight="semibold">Fone Studio Pro</span>
             <div slRatingDisplay variant="compact" size="sm" [value]="4.7" [count]="1284"></div>
             <span slText size="sm" tone="muted">R$ 1.299,00</span>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const Histogram: Story = {
  parameters: scenario('histogram'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A list of products, each with its spread',
        'Two products at 3,3 read differently once their distributions stand beside the mean: the Mini is split between ones and fives, the cable is spread across every level.',
        `<div class="slotted-demo-stack">
           ${productRow(
             'Studio Pro Headphones',
             `<div slRatingDisplay variant="histogram" aria-label="Average 4.7 of 5, 1,284 reviews, strong consensus" [value]="4.7" [count]="1284" [distribution]="[9, 18, 47, 158, 1052]"></div>`,
           )}
           ${productRow(
             'Studio Mini Headphones',
             `<div slRatingDisplay variant="histogram" aria-label="Average 3.3 of 5, 8 reviews, divided opinions" [value]="3.3" [count]="8" [distribution]="[3, 0, 1, 0, 4]"></div>`,
           )}
           ${productRow(
             'USB-C Cable',
             `<div slRatingDisplay variant="histogram" aria-label="Average 3.3 of 5, 136 reviews, divided opinions" [value]="3.3" [count]="136" [distribution]="[40, 12, 10, 14, 60]"></div>`,
           )}
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => ({
    template: grid(
      2,
      scene(
        'With a count, and without one',
        'count writes the grouped number beside the stars and joins the name: "Rated 4.6 out of 5, 1,284 ratings". Without it the name is only the value and the scale.',
        `<div slRatingDisplay [value]="4.6" [count]="1284"></div>
         <div slRatingDisplay [value]="4.6"></div>`,
      ) +
        scene(
          'Nobody has rated it yet',
          'A rating with no readings says 0,0 and (0) and draws every star unlit, rather than hiding and leaving the reader to guess.',
          `<div slRatingDisplay [value]="0" [count]="0"></div>`,
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
        'A scale of ten and twelve million readings',
        'Ten stars in a narrow column shrink rather than wrap, and a count of twelve million is grouped in the locale with tabular figures.',
        `<div class="slotted-demo-measure">
           <div slRatingDisplay size="lg" [max]="10" [value]="8.2" [count]="12408117"></div>
         </div>`,
        'block',
      ) +
        scene(
          'In a right-to-left page',
          'The row mirrors: the first star is at the inline start, and a fractional star lights from that side.',
          `<div dir="rtl" lang="ar">
             <div slRatingDisplay locale="ar" [value]="3.6" [count]="245"></div>
           </div>`,
        ),
    ),
  }),
};
