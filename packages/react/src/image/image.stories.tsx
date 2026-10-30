import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Card, CardBody, CardHeader, CardMedia } from '../card';
import { Grid } from '../grid';
import { Skeleton } from '../skeleton';
import { Stack } from '../stack';
import { Text } from '../typography';
import { Image } from './image';
import { ImageDefaultsProvider } from './image-defaults';
import { REACT_IMAGE_DOCS, REACT_IMAGE_TOKENS } from './image.docs';
import type { ImageStatus } from './image.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_IMAGE_DOCS.image.scenes, {
    playground: Playground,
    sizing: Sizing,
    ratio: Ratio,
    fit: Fit,
    position: Position,
    appearance: Appearance,
    loading: Loading,
    error: Error,
    sources: Sources,
    status: Status,
    interactive: Interactive,
    'in-context': InContext,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Image',
  component: Image,
  args: { alt: '' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Image',
        description:
          'A picture, and what stands in for it before it arrives and after it fails: the platform’s img with every attribute it has, a frame composed from AspectRatio when a ratio was decided, a fit, a focal point, a corner and an edge.',
        framework: 'React',
        ...REACT_IMAGE_DOCS.image,
        tokens: REACT_IMAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * Field-survey photographs, from Lorem Picsum by fixed id so the same picture
 * comes back every time the page is opened. `PREVIEW` is the forty-pixel
 * version of the first, which is what a blurred placeholder is made from;
 * `MISSING` is an id the service does not have, so the request really fails.
 */
const SLOPE = 'https://picsum.photos/id/1015/800/600';
const SLOPE_WIDE = 'https://picsum.photos/id/1015/1600/600';
const SLOPE_PORTRAIT = 'https://picsum.photos/id/1015/600/800';
const SLOPE_WEBP = 'https://picsum.photos/id/1015/800/600.webp';
const PREVIEW = 'https://picsum.photos/id/1015/40/30';
const RIDGE = 'https://picsum.photos/id/1018/1600/600';
const CANOE = 'https://picsum.photos/id/1011/600/800';
const CANYON = 'https://picsum.photos/id/1016/800/600';
const FOREST = 'https://picsum.photos/id/1019/800/600';
const VALLEY = 'https://picsum.photos/id/1043/800/600';
const MISSING = 'https://picsum.photos/id/9999999/800/600';
const TINY = 'https://picsum.photos/id/1015/96/72';

function Scene({
  children,
  floor,
  label,
  layout = 'block',
  note,
}: {
  children: React.ReactNode;
  /** How small the subject may legitimately be, when it is small by design. */
  floor?: number | undefined;
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
      <div
        className="slotted-demo-stage"
        data-align="start"
        data-layout={layout}
        {...(floor === undefined ? {} : { 'data-collapse-floor': floor })}
      >
        {children}
      </div>
    </section>
  );
}

export const Playground: Story = {
  args: {
    alt: 'The fjord lookout at site 12, from the cliff path',
    bordered: false,
    fit: 'cover',
    position: 'center',
    radius: 'md',
    ratio: 'landscape',
    src: SLOPE_WIDE,
  },
  argTypes: {
    fit: { control: 'select', options: ['cover', 'contain', 'fill', 'none', 'scale-down'] },
    position: { control: 'select', options: ['center', 'top', 'bottom', 'start', 'end'] },
    radius: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    ratio: { control: 'select', options: ['square', 'landscape', 'portrait', 'video', 'wide'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <Image {...args} />
    </div>
  ),
};

export const Sizing: Story = {
  parameters: scenario('sizing'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label="width and height"
        note="The element reserves 4:3 before the first byte, and the picture is its own size, shrunk to the column."
      >
        <Image alt="The fjord lookout at site 12" height={600} src={SLOPE} width={800} />
      </Scene>
      <Scene
        label='layout="fill"'
        note="The box is the parent’s in both axes — here a tall viewport — and cover crops the picture to it."
      >
        <div className="slotted-demo-viewport" data-size="tall">
          <Image alt="The fjord lookout at site 12" layout="fill" src={SLOPE} />
        </div>
      </Scene>
      <Scene
        label="width and height, still loading"
        note="The reserved 4:3 box is the sunken ground until the picture reports."
      >
        <Image
          alt="The fjord lookout at site 12"
          height={600}
          src={SLOPE}
          status="loading"
          width={800}
        />
      </Scene>
      <Scene
        label="Nothing decided, still loading"
        note="No ratio, no width, no height, and a request that has not answered: there is no box to hold, and the stage is empty until the picture reports."
      >
        <Image alt="The fjord lookout at site 12" src={MISSING} status="loading" />
      </Scene>
    </Grid>
  ),
};

export const Ratio: Story = {
  parameters: scenario('ratio'),
  render: () => (
    <Grid columns={2} gap={6}>
      <Scene
        label='ratio="landscape"'
        note="A wide photograph cropped to 4:3 at the column’s width."
      >
        <Image alt="The ridge above site 12" radius="md" ratio="landscape" src={RIDGE} />
      </Scene>
      <Scene label='ratio="portrait"' note="The same kind of frame, 3:4, holding a landscape.">
        <Image alt="The fjord lookout at site 12" radius="md" ratio="portrait" src={SLOPE} />
      </Scene>
      <Scene
        label='ratio="wide", still loading'
        note="The 21:9 frame is held at the column’s width before anything arrives."
      >
        <Image
          alt="The ridge above site 12"
          radius="md"
          ratio="wide"
          src={RIDGE}
          status="loading"
        />
      </Scene>
      <Scene
        label="ratio={[2, 1]}"
        note="A pair the product decided, written on the frame as 2 / 1."
      >
        <Image alt="The ridge above site 12" radius="md" ratio={[2, 1]} src={RIDGE} />
      </Scene>
    </Grid>
  ),
};

export const Fit: Story = {
  parameters: scenario('fit'),
  render: () => (
    <ImageDefaultsProvider radius="sm">
      <Grid columns={3} gap={6}>
        <Scene label='fit="cover"' note="Cropped to fill the square; the sides of the 4:3 go.">
          <Image alt="The fjord lookout at site 12" fit="cover" ratio="square" src={SLOPE} />
        </Scene>
        <Scene
          label='fit="contain"'
          note="Shown whole, letterboxed above and below on the page’s own ground."
        >
          <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
            <Image alt="The fjord lookout at site 12" fit="contain" ratio="square" src={SLOPE} />
          </div>
        </Scene>
        <Scene
          label='fit="fill"'
          note="Stretched to the square: the cliff is a third taller than it is."
        >
          <Image alt="The fjord lookout at site 12" fit="fill" ratio="square" src={SLOPE} />
        </Scene>
        <Scene
          label='fit="none"'
          note="A 96 by 72 picture drawn at its natural size in the middle of the frame."
        >
          <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
            <Image alt="The fjord lookout at site 12" fit="none" ratio="square" src={TINY} />
          </div>
        </Scene>
        <Scene
          label='fit="scale-down"'
          note="The same as none here; it would be contain if the picture were larger than the frame."
        >
          <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
            <Image alt="The fjord lookout at site 12" fit="scale-down" ratio="square" src={TINY} />
          </div>
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};

export const Position: Story = {
  parameters: scenario('position'),
  render: () => (
    <ImageDefaultsProvider radius="sm">
      <Grid columns={3} gap={6}>
        <Scene label='position="start"' note="The wide picture keeps its start; in rtl, its end.">
          <Image alt="The ridge above site 12" position="start" ratio="square" src={RIDGE} />
        </Scene>
        <Scene label='position="center"' note="The middle of the wide picture, either way round.">
          <Image alt="The ridge above site 12" position="center" ratio="square" src={RIDGE} />
        </Scene>
        <Scene label='position="end"' note="The end of the wide picture; in rtl, its start.">
          <Image alt="The ridge above site 12" position="end" ratio="square" src={RIDGE} />
        </Scene>
        <Scene
          label='position="top"'
          note="The portrait keeps its top: the treeline over the water."
        >
          <Image
            alt="A surveyor crossing the lake at site 14 by canoe"
            position="top"
            ratio="video"
            src={CANOE}
          />
        </Scene>
        <Scene
          label='position="bottom"'
          note="The portrait keeps its bottom: the canoe and the paddle."
        >
          <Image
            alt="A surveyor crossing the lake at site 14 by canoe"
            position="bottom"
            ratio="video"
            src={CANOE}
          />
        </Scene>
        <Scene
          label='position="30% 20%"'
          note="A focal point from the CMS, written on the instance; the DOM says custom."
        >
          <Image
            alt="A surveyor crossing the lake at site 14 by canoe"
            position="30% 20%"
            ratio="video"
            src={CANOE}
          />
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='radius="none" · "sm" · "md" · "lg"'
        note="The four steps of the radius scale, on the same square picture."
        layout="row"
      >
        <Grid columns={4} gap={4}>
          <Image alt="The fjord lookout at site 12" radius="none" ratio="square" src={SLOPE} />
          <Image alt="The fjord lookout at site 12" radius="sm" ratio="square" src={SLOPE} />
          <Image alt="The fjord lookout at site 12" radius="md" ratio="square" src={SLOPE} />
          <Image alt="The fjord lookout at site 12" radius="lg" ratio="square" src={SLOPE} />
        </Grid>
      </Scene>
      <Scene
        label="bordered, beside the same picture without"
        note="A subtle inset edge on the left tile and none on the right; the two tiles are the same size, because the edge is drawn inside the box."
      >
        <Grid columns={2} gap={4}>
          <Image
            alt="The red escarpment at site 15"
            bordered
            radius="md"
            ratio="landscape"
            src={CANYON}
          />
          <Image alt="The red escarpment at site 15" radius="md" ratio="landscape" src={CANYON} />
        </Grid>
      </Scene>
    </div>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <ImageDefaultsProvider radius="md">
      <Grid columns={2} gap={6}>
        <Scene
          label='placeholder="surface"'
          note="The sunken ground, a step below the page in every scheme."
        >
          <Image
            alt="The fjord lookout at site 12"
            ratio="landscape"
            src={SLOPE}
            status="loading"
          />
        </Scene>
        <Scene
          label='placeholder="blur"'
          note="A forty-pixel version of the same picture, scaled and blurred where the picture will be, with the same fit and focal point."
        >
          <Image
            alt="The fjord lookout at site 12"
            placeholder="blur"
            placeholderSrc={PREVIEW}
            ratio="landscape"
            src={SLOPE}
            status="loading"
          />
        </Scene>
        <Scene
          label='placeholder="none"'
          note="Nothing painted; the frame still holds its shape, shown here on a sunken surface."
        >
          <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
            <Image
              alt="The fjord lookout at site 12"
              placeholder="none"
              ratio="landscape"
              src={SLOPE}
              status="loading"
            />
          </div>
        </Scene>
        <Scene
          label="placeholderContent"
          note="A Skeleton over the ground: the consumer’s own stand-in, with the family’s clip and corner."
        >
          <Image
            alt="The fjord lookout at site 12"
            placeholderContent={<Skeleton shape="block" />}
            ratio="landscape"
            src={SLOPE}
            status="loading"
          />
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};

export const Error: Story = {
  parameters: scenario('error'),
  render: () => (
    <ImageDefaultsProvider radius="md">
      <Grid columns={2} gap={6}>
        <Scene
          label="The picture is not there"
          note="The request fails, and the image-off glyph stands on the ground in the decided frame."
        >
          <Image alt="The fjord lookout at site 12" ratio="landscape" src={MISSING} />
        </Scene>
        <Scene
          floor={64}
          label="Nothing reserved, and the picture is not there"
          note="No frame, no width: the fallback gives itself the minimum a glyph needs, and nothing more."
        >
          <Image alt="The fjord lookout at site 12" src={MISSING} />
        </Scene>
        <Scene
          label="fallback"
          note="A message and a retry in place of the glyph; the button is reachable only once the picture has failed."
        >
          <Image
            alt="The fjord lookout at site 12"
            fallback={
              <Stack align="center" gap={3}>
                <Text size="sm" tone="muted">
                  Photo unavailable
                </Text>
                <Button size="sm" variant="outline">
                  Retry
                </Button>
              </Stack>
            }
            ratio="landscape"
            src={MISSING}
          />
        </Scene>
        <Scene
          label="fallbackSrc"
          note="The first URL failed and the second was tried in silence; the archived photograph is what shows, as loaded."
        >
          <Image
            alt="The fjord lookout at site 12"
            fallbackSrc={SLOPE}
            ratio="landscape"
            src={MISSING}
          />
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};

export const Sources: Story = {
  parameters: scenario('sources'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="sources"
        note="A WebP for browsers that take it, and below 480 pixels the portrait crop; above it, the landscape. Drag the window across that width and the picture changes."
      >
        <Image
          alt="The fjord lookout at site 12"
          radius="md"
          ratio="landscape"
          sources={[
            { srcSet: SLOPE_WEBP, type: 'image/webp' },
            { media: '(max-width: 480px)', srcSet: SLOPE_PORTRAIT },
          ]}
          src={SLOPE}
        />
      </Scene>
    </div>
  ),
};

function StatusLog() {
  const [seen, setSeen] = useState<readonly ImageStatus[]>([]);
  const [src, setSrc] = useState(SLOPE);

  return (
    <Stack gap={4}>
      <Grid columns={2} gap={6}>
        <Image
          alt="The fjord lookout at site 12"
          onStatusChange={(status) => setSeen((log) => [...log, status])}
          radius="md"
          ratio="landscape"
          src={src}
        />
        <Stack gap={3}>
          <Text size="sm" tone="muted">
            {seen.length === 0 ? 'Nothing reported yet.' : `Reported: ${seen.join(' → ')}`}
          </Text>
          <div className="slotted-demo-row">
            <Button size="sm" variant="outline" onClick={() => setSrc(CANYON)}>
              Load another picture
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSrc(MISSING)}>
              Load a missing one
            </Button>
          </div>
        </Stack>
      </Grid>
    </Stack>
  );
}

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="onStatusChange"
        note="Each button starts a new request; the log shows loaded for a picture that arrived and error for one that did not, and nothing for the loading in between, which is a fact the DOM already states."
      >
        <StatusLog />
      </Scene>
    </div>
  ),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => (
    <ImageDefaultsProvider radius="md">
      <Grid columns={3} gap={6}>
        <Scene
          label="A link"
          note="Tab to it for the ring outside the box; hover for the strong edge inside it."
        >
          <Image
            alt="Open site 12"
            ratio="square"
            render={(props) => <a {...props} href="#site-12" />}
            src={SLOPE}
          />
        </Scene>
        <Scene
          label="A button"
          note="The same two states on a button that would open a Dialog with the full picture."
        >
          <Image
            alt="Open the full-size photo of the lake crossing"
            ratio="square"
            render={(props) => <button {...props} type="button" />}
            src={CANOE}
          />
        </Scene>
        <Scene
          label="A link whose picture failed"
          note="Still a link, still focusable, still named; the glyph is what it shows."
        >
          <Image
            alt="Open site 14"
            ratio="square"
            render={(props) => <a {...props} href="#site-14" />}
            src={MISSING}
          />
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};

const SITES = [
  { id: 12, name: 'Site 12 — fjord lookout', photo: SLOPE, status: undefined, position: 'center' },
  { id: 14, name: 'Site 14 — lake crossing', photo: CANOE, status: undefined, position: 'top' },
  {
    id: 15,
    name: 'Site 15 — red escarpment',
    photo: CANYON,
    status: undefined,
    position: 'center',
  },
  { id: 17, name: 'Site 17 — forest track', photo: FOREST, status: 'loading', position: 'center' },
  { id: 18, name: 'Site 18 — valley floor', photo: VALLEY, status: undefined, position: 'center' },
  { id: 21, name: 'Site 21 — quarry', photo: MISSING, status: undefined, position: 'center' },
] as const;

export const InContext: Story = {
  parameters: scenario('in-context'),
  render: () => (
    <ImageDefaultsProvider bordered radius="md">
      <Grid columns={3} gap={5}>
        {SITES.map((site) => (
          <Card key={site.id} render={(props) => <article {...props} />}>
            <CardMedia>
              <Image
                alt=""
                position={site.position}
                ratio="landscape"
                src={site.photo}
                {...(site.status === undefined ? {} : { status: site.status })}
              />
            </CardMedia>
            <CardHeader>
              <Text weight="medium">{site.name}</Text>
            </CardHeader>
            <CardBody>
              <Text size="sm" tone="muted">
                March survey
              </Text>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </ImageDefaultsProvider>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <ImageDefaultsProvider radius="md">
      <Grid columns={3} gap={6}>
        <Scene
          label="Informative"
          note="The alt says what the picture shows, and a reader who cannot see it learns the finding."
        >
          <Image
            alt="Rockfall debris below the red escarpment at site 15"
            ratio="landscape"
            src={CANYON}
          />
        </Scene>
        <Scene
          label="Decorative"
          note='alt="" beside the text that already names the site: the picture is skipped and the name is read once.'
        >
          <Stack gap={3}>
            <Image alt="" ratio="landscape" src={SLOPE} />
            <Text weight="medium">Site 12 — fjord lookout</Text>
          </Stack>
        </Scene>
        <Scene
          label="Functional, with a caption"
          note="The alt names the action of the button; the figcaption says what the picture is for, and neither repeats the other."
        >
          <figure>
            <Image
              alt="Open the full-size photo of site 15"
              ratio="landscape"
              render={(props) => <button {...props} type="button" />}
              src={CANYON}
            />
            <figcaption>
              <Text size="sm" tone="muted">
                Site 15 — red escarpment, March survey
              </Text>
            </figcaption>
          </figure>
        </Scene>
      </Grid>
    </ImageDefaultsProvider>
  ),
};
