import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';

import { Grid, Measure, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Glyph, Icon } from '../icon';
import { RatingDisplay } from './rating-display';
import { REACT_RATING_DOCS, REACT_RATING_TOKENS } from './rating.docs';

/** A shelf of headphones, the one product line every rating page draws. */
const PRODUCTS = [
  { name: 'Fone Studio Pro', counts: [9, 18, 47, 158, 1052] },
  { name: 'Fone Studio Max', counts: [4, 9, 31, 120, 148] },
  { name: 'Fone Studio Mini', counts: [3, 0, 1, 0, 4] },
  { name: 'Cabo USB-C', counts: [40, 12, 10, 14, 60] },
] as const;

const total = (counts: readonly number[]) => counts.reduce((sum, count) => sum + count, 0);
const mean = (counts: readonly number[]) =>
  counts.reduce((sum, count, index) => sum + count * (index + 1), 0) / total(counts);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_RATING_DOCS.ratingDisplay.scenes, {
    playground: Playground,
    fractions: Fractions,
    compact: Compact,
    histogram: Histogram,
    count: Count,
    content: Content,
  }) as never;

const meta = {
  title: 'Components/Rating/RatingDisplay',
  component: RatingDisplay,
  args: { value: 4.6 },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'RatingDisplay',
        description:
          'A rating the page reports: one image with one name, each symbol lit by its own fraction, in full, compact or with a histogram of the levels.',
        framework: 'React',
        ...REACT_RATING_DOCS.ratingDisplay,
        tokens: REACT_RATING_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof RatingDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    count: 1284,
    locale: 'pt-BR',
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
    variant: { control: 'inline-radio', options: ['full', 'compact', 'histogram'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <RatingDisplay {...args} distribution={PRODUCTS[0].counts} />
    </div>
  ),
};

export const Fractions: Story = {
  parameters: scenario('fractions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Each star lit by its own share"
        note="4,6 lights six tenths of the fifth star, 3,5 half of the fourth and 2,25 a quarter of the third. The number beside the stars is the reading that does not depend on seeing the fraction."
        layout="stack"
      >
        <SlottedProvider locale="pt-BR">
          <RatingDisplay value={4.6} />
          <RatingDisplay value={3.5} />
          <RatingDisplay value={2.25} />
          <RatingDisplay value={0.8} />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One star, in a table row"
        note="Where five stars do not fit, compact draws one beside the number and the count. The name still says the whole value, the scale and the count."
        layout="block"
      >
        <div className="slotted-demo-rows">
          {PRODUCTS.map((product) => (
            <Fragment key={product.name}>
              <span>{product.name}</span>
              <RatingDisplay
                count={total(product.counts)}
                locale="pt-BR"
                size="sm"
                value={mean(product.counts)}
                variant="compact"
              />
            </Fragment>
          ))}
        </div>
      </Scene>
    </Grid>
  ),
};

export const Histogram: Story = {
  parameters: scenario('histogram'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The shape beside the number"
        note="The Mini and the cable both average about 3,3: the bars show one split between one and five stars and the other spread across all five, a difference the mean hides."
        layout="block"
      >
        <div className="slotted-demo-rows">
          {PRODUCTS.map((product) => (
            <Fragment key={product.name}>
              <span>{product.name}</span>
              <RatingDisplay
                count={total(product.counts)}
                distribution={product.counts}
                locale="pt-BR"
                value={mean(product.counts)}
                variant="histogram"
              />
            </Fragment>
          ))}
        </div>
      </Scene>
    </Grid>
  ),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="With a count"
        // language: pt-BR
        note="The count is grouped by the locale and added to the accessible name: Avaliação 4,6 de 5, 1.284 avaliações."
        // language: en-US
        layout="stack"
      >
        <RatingDisplay count={1284} locale="pt-BR" value={4.6} />
      </Scene>
      <Scene
        label="Without one"
        note="Without a count the name says only the value, and no parentheses are drawn."
        layout="stack"
      >
        <RatingDisplay locale="pt-BR" value={3.5} />
      </Scene>
      <Scene
        label="Nobody rated it"
        note="Zero stars lit and a zero count: an empty row would read as a layout defect rather than as a product without ratings."
        layout="stack"
      >
        <RatingDisplay count={0} locale="pt-BR" value={0} />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Ten symbols in a narrow column"
        note="The row shrinks rather than wrapping: every item stays square and the star inside follows its width."
        layout="block"
      >
        <Measure>
          <RatingDisplay locale="pt-BR" max={10} value={7.5} />
        </Measure>
      </Scene>
      <Scene
        label="Another locale"
        note="The same value and count in en-US: the point becomes the decimal separator and the comma groups the thousands."
        layout="stack"
      >
        <RatingDisplay count={1284} locale="en-US" value={4.6} />
      </Scene>
      <Scene
        label="Another symbol"
        note="renderSymbol replaces the star in both layers, so the replacement lights and clips the way the star does."
        layout="stack"
      >
        <RatingDisplay
          locale="pt-BR"
          renderSymbol={() => (
            <Icon>
              <Glyph name="dot" />
            </Icon>
          )}
          tone="accent"
          value={3.5}
        />
      </Scene>
    </Grid>
  ),
};
