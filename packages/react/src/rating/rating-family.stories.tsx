import { scenario } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Rating } from './rating';
import { RatingDisplay } from './rating-display';
import { RatingSummary } from './rating-summary';
import type { RatingSize, RatingTone } from './rating.types';

const SIZES: readonly RatingSize[] = ['sm', 'md', 'lg'];
const TONES: readonly RatingTone[] = ['accent', 'info', 'success', 'warning', 'danger'];
const COUNTS = [9, 18, 47, 158, 1052];

function LabSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="slotted-component-lab__section">
      <header className="slotted-component-lab__intro">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="slotted-component-lab__body">{children}</div>
    </section>
  );
}

const meta = {
  title: 'Components/Rating/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Members: Story = {
  parameters: scenario('members'),
  render: () => (
    <main className="slotted-component-lab">
      <SlottedProvider locale="pt-BR">
        <LabSection
          description='Three members share one contract, one stylesheet and data-ui="rating". Rating is the value a reader gives, RatingDisplay the value a page reports, RatingSummary the aggregate of many.'
          title="Rating"
        >
          <Grid columns={1}>
            <Scene
              label="The value a reader gives"
              note="Native radios that share a name; hover previews, a press on the lit star empties it."
              layout="stack"
            >
              <Rating aria-label="Your rating" defaultValue={4} />
            </Scene>
          </Grid>
        </LabSection>
        <LabSection
          description="An image with one name: any fraction, in full, compact or with a histogram of the levels."
          title="RatingDisplay"
        >
          <Grid columns={1}>
            <Scene
              label="The value a page reports"
              note="The same stars, lit by fractions, beside the number and the count."
              layout="stack"
            >
              <RatingDisplay count={1284} value={4.7} />
              <RatingDisplay count={1284} distribution={COUNTS} value={4.7} variant="histogram" />
            </Scene>
          </Grid>
        </LabSection>
        <LabSection
          description="A region: the mean and one bar per level, or the spectrum with its interval and its conclusion."
          title="RatingSummary"
        >
          <Grid columns={1}>
            <Scene
              label="The aggregate of many"
              note="Every number comes from summarizeRatings in @slotted/core/rating, so both bindings draw the same conclusion."
              layout="block"
            >
              <RatingSummary aria-label="Ratings" counts={COUNTS} />
            </Scene>
          </Grid>
        </LabSection>
      </SlottedProvider>
    </main>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      {SIZES.map((size) => (
        <Scene
          key={size}
          label={size}
          note="The symbol does not follow density — its geometry is a target — while the text beside it does."
          layout="stack"
        >
          <Rating aria-label={`Rating ${size}`} defaultValue={4} size={size} />
          <RatingDisplay count={1284} locale="pt-BR" size={size} value={4.6} />
        </Scene>
      ))}
    </Grid>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <Grid columns={2}>
      {TONES.map((tone) => (
        <Scene
          key={tone}
          label={tone}
          note="The lit star takes the tone’s solid step; the unlit one stays on the secondary surface. warning is the default."
          layout="stack"
        >
          <Rating aria-label={`Rating ${tone}`} defaultValue={3} tone={tone} />
          <RatingDisplay locale="pt-BR" tone={tone} value={3.5} />
        </Scene>
      ))}
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A product page"
        note="The summary leads, filters the reviews below it, and each review reports its own rating in compact form; the reader’s own rating is the input member at the end."
        layout="block"
      >
        <SlottedProvider locale="pt-BR">
          <RatingSummary aria-label="Studio Pro Headphones ratings" counts={COUNTS} filterable />
          <div className="slotted-demo-rows">
            <span>Anna, 2 days ago</span>
            <RatingDisplay size="sm" value={5} variant="compact" />
            <span>Brian, 1 week ago</span>
            <RatingDisplay size="sm" value={4} variant="compact" />
          </div>
          <Rating aria-label="Your rating of the Studio Pro Headphones" />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Named radios"
        note="Each radio is named by itemLabel — 3 de 5 — and the group by its label; the caption is hidden."
        layout="stack"
      >
        <Rating aria-label="Qualidade" caption="Regular" defaultValue={3} locale="pt-BR" />
      </Scene>
      <Scene
        label="One image, one name"
        // language: pt-BR
        note="The display is role=img named Avaliação 4,6 de 5, 1.284 avaliações; nothing inside is read twice."
        // language: en-US
        layout="stack"
      >
        <RatingDisplay count={1284} locale="pt-BR" value={4.6} />
      </Scene>
      <Scene
        label="Levels in words"
        note="Each level is named with its count and share, and the spectrum’s conclusion is text, never a color alone."
        layout="block"
      >
        <RatingSummary aria-label="Resumo" counts={COUNTS} locale="pt-BR" variant="spectrum" />
      </Scene>
    </Grid>
  ),
};
