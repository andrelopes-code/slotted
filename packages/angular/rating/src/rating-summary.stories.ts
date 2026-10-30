import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import type { RatingSize, RatingSummaryVariant, RatingTone } from './rating-defaults';
import { SlRatingSummary } from './rating-summary';
import { ANGULAR_RATING_DOCS, ANGULAR_RATING_TOKENS } from './rating.docs';

interface RatingSummaryStoryArgs {
  filterable: boolean;
  showInsight: boolean;
  size: RatingSize;
  tone: RatingTone;
  variant: RatingSummaryVariant;
}

/** One product's reviews, lowest level first: 1.284 readings, most of them five stars. */
const STUDIO_PRO = [9, 18, 47, 158, 1052];
/** Eight readings split between the two ends. */
const STUDIO_MINI = [3, 0, 1, 0, 4];
/** A cable nobody agrees about, with enough readings to trust the split. */
const USB_CABLE = [40, 12, 10, 14, 60];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_RATING_DOCS.ratingSummary.scenes, {
    playground: Playground,
    filter: Filter,
    spectrum: Spectrum,
    insight: Insight,
    empty: Empty,
    narrow: Narrow,
  }) as never;

const meta: Meta<RatingSummaryStoryArgs> = {
  title: 'Components/Rating/RatingSummary',
  component: SlRatingSummary,
  decorators: [moduleMetadata({ imports: [SlRatingSummary, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'RatingSummary',
        description:
          'The aggregate of many ratings: the mean, how many readings it is made of, and how they spread — as one bar per level, or as a spectrum with the mean, its 95% interval, three buckets and one conclusion.',
        framework: 'Angular',
        ...ANGULAR_RATING_DOCS.ratingSummary,
        tokens: ANGULAR_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<RatingSummaryStoryArgs>;

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
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

export const Playground: Story = {
  args: {
    filterable: false,
    showInsight: true,
    size: 'md',
    tone: 'warning',
    variant: 'bars',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: ['accent', 'info', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['bars', 'spectrum'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, counts: STUDIO_PRO },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <section
          slRatingSummary
          aria-label="Studio Pro Headphones reviews"
          [counts]="counts"
          [variant]="variant"
          [filterable]="filterable"
          [showInsight]="showInsight"
          [size]="size"
          [tone]="tone"
        ></section>
      </div>`,
  }),
};

export const Filter: Story = {
  parameters: scenario('filter'),
  render: () => ({
    props: { counts: STUDIO_MINI, levels: [5] as readonly number[] },
    template: grid(
      1,
      scene(
        'Levels that filter the reviews below',
        'Each level is a toggle button; the pressed ones are selectedLevels, bound two-way here and written under the summary. The levels nobody chose — two and four stars — are disabled.',
        `<section
           slRatingSummary
           aria-label="Filter Studio Mini Headphones reviews"
           filterable
           [counts]="counts"
           [(selectedLevels)]="levels"
         ></section>
         <span slText size="sm" tone="muted">selected levels: {{ levels.join(', ') || 'none' }}</span>`,
      ),
    ),
  }),
};

export const Spectrum: Story = {
  parameters: scenario('spectrum'),
  render: () => ({
    props: { pro: STUDIO_PRO, mini: STUDIO_MINI },
    template: grid(
      1,
      scene(
        'Many readings that agree',
        'The mean sits at 4,7 with a margin of ± 0,04, the interval is a sliver on the axis, 94% of the readings are positive, and the conclusion is consensus.',
        `<section
           slRatingSummary
           variant="spectrum"
           aria-label="Studio Pro Headphones review summary"
           filterable
           [counts]="pro"
         ></section>`,
      ) +
        scene(
          'Eight readings split between the ends',
          'The same mean of 3,3 a histogram-less summary would print as "average" is drawn here as two tall columns at the ends and an interval from 2,0 to 4,5 — and the conclusion says divided.',
          `<section
             slRatingSummary
             variant="spectrum"
             aria-label="Studio Mini Headphones review summary"
             filterable
             [counts]="mini"
           ></section>`,
        ),
    ),
  }),
};

export const Insight: Story = {
  parameters: scenario('insight'),
  render: () => ({
    props: { pro: STUDIO_PRO, mini: STUDIO_MINI, cable: USB_CABLE, few: [0, 1, 2, 6, 9] },
    template: grid(
      2,
      scene(
        'Consensus',
        'Four fifths or more of the readings positive, with enough of them to trust the mean: the pill takes the success tone.',
        `<section slRatingSummary variant="spectrum" aria-label="Consenso" [counts]="pro"></section>`,
      ) +
        scene(
          'Divided',
          'A quarter or more at each end — the cable’s 40 ones and 60 fives — is a split no mean describes, and the pill takes the warning tone.',
          `<section slRatingSummary variant="spectrum" aria-label="Divididas" [counts]="cable"></section>`,
        ) +
        scene(
          'Few',
          'Fewer than thirty readings, or a margin of half a level or more, and the conclusion says there are too few to trust the figure.',
          `<section slRatingSummary variant="spectrum" aria-label="Poucas" [counts]="few"></section>`,
        ) +
        scene(
          'Thresholds moved, and the pill hidden',
          'insightThresholds moves one line and keeps the others; showInsight false removes the conclusion and leaves the figure and the count.',
          `<section
             slRatingSummary
             variant="spectrum"
             aria-label="Custom thresholds"
             [counts]="cable"
             [insightThresholds]="{ divided: 0.5 }"
           ></section>
           <section
             slRatingSummary
             variant="spectrum"
             aria-label="No conclusion"
             [counts]="mini"
             [showInsight]="false"
           ></section>`,
        ),
    ),
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    props: { none: [0, 0, 0, 0, 0] },
    template: grid(
      2,
      scene(
        'Bars with no readings',
        'The figure and the scale are omitted — a missing mean is not nought — the stars are unlit, every level is a group with a zero-length bar, and the count says so in words.',
        `<section slRatingSummary aria-label="No reviews" [counts]="none"></section>`,
      ) +
        scene(
          'A spectrum with no readings',
          'No mean, no interval and no buckets are drawn, because each would be a claim about readings that do not exist; the axis stays so the empty chart still reads as a scale.',
          `<section
             slRatingSummary
             variant="spectrum"
             aria-label="No reviews, spectrum"
             [counts]="none"
           ></section>`,
        ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: { pro: STUDIO_PRO },
    template: grid(
      2,
      scene(
        'In a 360-pixel drawer',
        'The aggregate stacks above the distribution because the two no longer fit side by side, and every row of bars keeps its label, bar and count aligned with the rows above it.',
        `<div class="slotted-demo-measure">
           <section slRatingSummary size="sm" aria-label="Reviews, drawer" [counts]="pro"></section>
         </div>`,
      ) +
        scene(
          'The spectrum in the same column',
          'The columns narrow with the column and the axis labels keep their shares under each level; the buckets wrap onto a second line rather than overflow.',
          `<div class="slotted-demo-measure">
             <section
               slRatingSummary
               variant="spectrum"
               size="sm"
               aria-label="Espectro, gaveta"
               [counts]="pro"
             ></section>
           </div>`,
        ),
    ),
  }),
};
