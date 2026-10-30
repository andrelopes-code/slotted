import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Grid } from '../grid';
import { Image } from '../image';
import { Stack } from '../stack';
import { Text } from '../typography';
import { AspectRatio } from './aspect-ratio';
import { REACT_ASPECT_RATIO_DOCS, REACT_ASPECT_RATIO_TOKENS } from './aspect-ratio.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_ASPECT_RATIO_DOCS['aspect-ratio'].scenes, {
    playground: Playground,
    ratios: Ratios,
    custom: Custom,
    media: Media,
    growth: Growth,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  args: { ratio: 'video' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'AspectRatio',
        description:
          'A box that is a stated proportion of its own width before anything is in it, so a picture, a map or a player arrives into room already held for it. The frame reserves; it never crops.',
        framework: 'React',
        ...REACT_ASPECT_RATIO_DOCS['aspect-ratio'],
        tokens: REACT_ASPECT_RATIO_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * Field-survey photographs, from Lorem Picsum by fixed id so the same picture
 * comes back every time the page is opened.
 */
const SLOPE = 'https://picsum.photos/id/1015/800/600';
const RIDGE = 'https://picsum.photos/id/1018/1600/600';
const CANOE = 'https://picsum.photos/id/1011/600/800';
const MAP =
  'https://www.openstreetmap.org/export/embed.html?bbox=-8.6520%2C41.1400%2C-8.6000%2C41.1700&layer=mapnik';

function Scene({
  children,
  label,
  layout = 'block',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** A frame with nothing in it but its own name, so the proportion is the subject. */
function Empty({ label }: { label: string }) {
  return (
    <div className="slotted-demo-surface" data-surface="raised">
      <Text size="sm" tone="muted">
        {label}
      </Text>
    </div>
  );
}

export const Playground: Story = {
  args: { ratio: 'video' },
  argTypes: {
    ratio: {
      control: 'select',
      options: ['square', 'landscape', 'portrait', 'video', 'wide'],
    },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
        <AspectRatio {...args}>
          <img alt="The fjord lookout at site 12, from the cliff path" src={SLOPE} />
        </AspectRatio>
      </div>
    </div>
  ),
};

export const Ratios: Story = {
  parameters: scenario('ratios'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene label='ratio="square"' note="1:1 — a thumbnail in a grid of people or products.">
        <AspectRatio ratio="square">
          <Empty label="square · 1 / 1" />
        </AspectRatio>
      </Scene>
      <Scene label='ratio="landscape"' note="4:3 — a survey photograph, a card’s media.">
        <AspectRatio ratio="landscape">
          <Empty label="landscape · 4 / 3" />
        </AspectRatio>
      </Scene>
      <Scene label='ratio="portrait"' note="3:4 — a person, a document page, a phone screen.">
        <AspectRatio ratio="portrait">
          <Empty label="portrait · 3 / 4" />
        </AspectRatio>
      </Scene>
      <Scene label='ratio="video"' note="16:9 — an embedded player, a dashboard tile.">
        <AspectRatio ratio="video">
          <Empty label="video · 16 / 9" />
        </AspectRatio>
      </Scene>
      <Scene label='ratio="wide"' note="21:9 — a hero across the top of a page.">
        <AspectRatio ratio="wide">
          <Empty label="wide · 21 / 9" />
        </AspectRatio>
      </Scene>
    </Grid>
  ),
};

export const Custom: Story = {
  parameters: scenario('custom'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="ratio={[2, 1]}"
        note="The pair is written on the instance as 2 / 1, exactly as it was given."
      >
        <AspectRatio ratio={[2, 1]}>
          <Empty label="custom · 2 / 1" />
        </AspectRatio>
      </Scene>
      <Scene label="ratio={1.85}" note="A number is written as its own quotient, 1.85.">
        <AspectRatio ratio={1.85}>
          <Empty label="custom · 1.85" />
        </AspectRatio>
      </Scene>
    </Grid>
  ),
};

export const Media: Story = {
  parameters: scenario('media'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="A 4:3 photograph in a 16:9 frame"
        note="Shown whole, with the frame’s ground either side. Nothing is cropped."
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
          <AspectRatio ratio="video">
            <img alt="The fjord lookout at site 12" src={SLOPE} />
          </AspectRatio>
        </div>
      </Scene>
      <Scene
        label="A wide photograph in a square frame"
        note="Letterboxed above and below, for the same reason."
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
          <AspectRatio ratio="square">
            <img alt="The ridge above site 12" src={RIDGE} />
          </AspectRatio>
        </div>
      </Scene>
      <Scene
        label="A portrait in a 16:9 frame"
        note="A tall picture is shown entire between two bands of ground."
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
          <AspectRatio ratio="video">
            <img alt="A surveyor crossing the lake at site 14 by canoe" src={CANOE} />
          </AspectRatio>
        </div>
      </Scene>
      <Scene
        label="An embedded map"
        note="An iframe takes the frame’s size and has no object-fit; the frame is what keeps it 16:9."
      >
        <AspectRatio ratio="video">
          <iframe frameBorder={0} src={MAP} title="Site 12 on the map" />
        </AspectRatio>
      </Scene>
    </Grid>
  ),
};

export const Growth: Story = {
  parameters: scenario('growth'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="Two lines in a 16:9 frame"
        note="The text fits, and the frame keeps its ratio; the frame beneath sits where the ratio puts it."
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
          <AspectRatio ratio="video">
            <div className="slotted-demo-surface" data-surface="sunken">
              <Text size="sm">
                Two lines fit inside a 16:9 frame at this width, so the frame keeps its ratio.
              </Text>
            </div>
          </AspectRatio>
        </div>
        <AspectRatio ratio="video">
          <Empty label="the frame beneath" />
        </AspectRatio>
      </Scene>
      <Scene
        label="A paragraph that does not fit"
        note="The frame grows to the paragraph’s height instead of cutting it or laying it over the frame beneath."
      >
        <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
          <AspectRatio ratio="video">
            <div className="slotted-demo-surface" data-surface="sunken">
              <Text size="sm">
                Survey notes, site 12, March. Access road passable to the second gate; the
                north-slope monitoring well was found dry and the datalogger battery at eleven per
                cent. The jetty at the lake crossing is rotten through and the fence on the ridge
                side has been cut in two places since the October visit. A translation of this note
                into German runs a third longer, and the frame grows with it the same way.
              </Text>
            </div>
          </AspectRatio>
        </div>
        <AspectRatio ratio="video">
          <Empty label="the frame beneath" />
        </AspectRatio>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="A caption over a picture"
        note="Two children, one cell: the caption is the second child and sits on the picture with nothing positioned by hand."
      >
        <AspectRatio ratio="landscape">
          <img alt="" src={SLOPE} />
          <Stack justify="end">
            <div className="slotted-demo-surface" data-surface="inverse">
              <Text size="sm" tone="inverse" weight="medium">
                Site 12 — fjord lookout
              </Text>
            </div>
          </Stack>
        </AspectRatio>
      </Scene>
      <Scene
        label="What Image writes"
        note="An Image given a ratio renders this frame inside its own root, and adds the crop, the corner and the two stand-ins."
      >
        <Image alt="The fjord lookout at site 12" radius="md" ratio="landscape" src={SLOPE} />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A frame on a figure, with a caption"
        note="render puts the frame on the figure; the alt says what the picture shows and the figcaption says what it is for, and neither repeats the other."
      >
        <figure>
          <AspectRatio ratio="landscape">
            <img
              alt="The fjord lookout at site 12 from the cliff path, looking down the water"
              src={SLOPE}
            />
          </AspectRatio>
          <figcaption>
            <Text size="sm" tone="muted">
              Site 12 — fjord lookout, March survey
            </Text>
          </figcaption>
        </figure>
      </Scene>
    </div>
  ),
};
