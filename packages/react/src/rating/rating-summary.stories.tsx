import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Grid, Measure, Scene } from '../field/field-demo';
import { RatingProvider } from './rating-defaults';
import { RatingSummary } from './rating-summary';
import { REACT_RATING_DOCS, REACT_RATING_TOKENS } from './rating.docs';

/** A strong consensus: 1.284 readings, four in five at five stars. */
const STRONG = [9, 18, 47, 158, 1052];
/** Few and split between the ends. */
const FEW = [3, 0, 1, 0, 4];
/** Many and split between the ends. */
const POLARISED = [40, 12, 10, 14, 60];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_RATING_DOCS.ratingSummary.scenes, {
    playground: Playground,
    filter: Filter,
    spectrum: Spectrum,
    insight: Insight,
    empty: Empty,
    narrow: Narrow,
  }) as never;

const meta = {
  title: 'Components/Rating/RatingSummary',
  component: RatingSummary,
  args: { counts: STRONG },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'RatingSummary',
        description:
          'The aggregate of many ratings: the mean, the count and one bar per level, or a spectrum on the axis of the scale with the mean, its 95% interval and one conclusion.',
        framework: 'React',
        ...REACT_RATING_DOCS.ratingSummary,
        tokens: REACT_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof RatingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'aria-label': 'Studio Pro Headphones ratings',
    counts: STRONG,
    filterable: false,
    locale: 'pt-BR',
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
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <RatingSummary {...args} />
    </div>
  ),
};

function Filtering() {
  const [levels, setLevels] = useState<readonly number[]>([5]);
  const shown = levels.length === 0 ? 'all ratings' : `${levels.join(', ')} stars`;
  return (
    <>
      <RatingSummary
        aria-label="Filter Studio Pro Headphones ratings"
        counts={STRONG}
        filterable
        locale="pt-BR"
        onSelectedLevelsChange={setLevels}
        selectedLevels={levels}
      />
      <p>Mostrando {shown}.</p>
    </>
  );
}

export const Filter: Story = {
  parameters: scenario('filter'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Levels as toggles"
        note="Each level is a button with aria-pressed; press five and four and the line below follows the controlled levels. Two on the spectrum below is disabled: nobody gave it."
        layout="block"
      >
        <Filtering />
        <RatingSummary
          aria-label="Filter Studio Mini Headphones ratings"
          counts={FEW}
          defaultSelectedLevels={[1]}
          filterable
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
    </Grid>
  ),
};

export const Spectrum: Story = {
  parameters: scenario('spectrum'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Many readings that agree"
        note="1.284 readings: the interval is a sliver around 4,7, the count gives the margin, and the buckets say 94% positive."
        layout="block"
      >
        <RatingSummary
          aria-label="Resumo do Fone Studio Pro"
          counts={STRONG}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
      <Scene
        label="Eight readings split between the ends"
        note="The margin passes half a star, so the count says the mean is uncertain and gives the interval in words; the columns show why a 3,3 here is not a lukewarm product."
        layout="block"
      >
        <RatingSummary
          aria-label="Resumo do Fone Studio Mini"
          counts={FEW}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
    </Grid>
  ),
};

export const Insight: Story = {
  parameters: scenario('insight'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Divided"
        note="Both ends hold at least a quarter of the readings: the cable is loved and hated, and the pill says so in the warning tone."
        layout="block"
      >
        <RatingSummary
          aria-label="Cabo USB-C"
          counts={POLARISED}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
      <Scene
        label="Few"
        note="Ten readings are under the threshold of thirty, so the conclusion is that there are too few to trust the mean."
        layout="block"
      >
        <RatingSummary
          aria-label="Capa de viagem"
          counts={[1, 0, 2, 3, 4]}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
      <Scene
        label="Consensus"
        note="More than four in five readings are positive: the conclusion is a consensus, in the success tone."
        layout="block"
      >
        <RatingSummary
          aria-label="Fone Studio Pro"
          counts={STRONG}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
      <Scene
        label="Thresholds moved by the provider"
        note="The same readings with consensus set at 95%: nothing else holds, so the conclusion is mixed. The provider sets thresholds once; an instance can still move one."
        layout="block"
      >
        <RatingProvider insightThresholds={{ consensus: 0.95 }}>
          <RatingSummary
            aria-label="Fone Studio Pro, limiar alto"
            counts={STRONG}
            locale="pt-BR"
            variant="spectrum"
          />
        </RatingProvider>
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Bars, nothing rated"
        note="No figure and no scale, because an absent mean is not a nought; the stars stay unlit and the count says why."
        layout="block"
      >
        <RatingSummary aria-label="No ratings" counts={[0, 0, 0, 0, 0]} locale="pt-BR" />
      </Scene>
      <Scene
        label="Spectrum, nothing rated"
        note="The axis stays so the page keeps its shape, and neither the mean, the interval, the conclusion nor the buckets are drawn."
        layout="block"
      >
        <RatingSummary
          aria-label="No ratings, spectrum"
          counts={[0, 0, 0, 0, 0]}
          locale="pt-BR"
          variant="spectrum"
        />
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Bars at a phone’s width"
        note="The aggregate and the distribution stand side by side while both fit; here they stack, and every bar keeps its label and count aligned with the one above."
        layout="block"
      >
        <Measure>
          <RatingSummary aria-label="Ratings, narrow" counts={STRONG} locale="pt-BR" />
        </Measure>
      </Scene>
      <Scene
        label="Spectrum at a phone’s width"
        note="The axis keeps five ticks and the count wraps under the figure instead of pushing the pill off the line."
        layout="block"
      >
        <Measure>
          <RatingSummary
            aria-label="Resumo, estreito"
            counts={POLARISED}
            locale="pt-BR"
            variant="spectrum"
          />
        </Measure>
      </Scene>
    </Grid>
  ),
};
