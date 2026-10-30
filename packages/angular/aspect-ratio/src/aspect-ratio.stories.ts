import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlGrid } from '@slotted/angular/grid';
import { SlImage } from '@slotted/angular/image';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAspectRatio } from './aspect-ratio';
import type { AspectRatioName } from './aspect-ratio';
import { ANGULAR_ASPECT_RATIO_DOCS, ANGULAR_ASPECT_RATIO_TOKENS } from './aspect-ratio.docs';

interface AspectRatioStoryArgs {
  ratio: AspectRatioName;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ASPECT_RATIO_DOCS['aspect-ratio'].scenes, {
    playground: Playground,
    ratios: Ratios,
    custom: Custom,
    media: Media,
    growth: Growth,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

/*
 * Field-survey photographs, from Lorem Picsum by fixed id so the same picture
 * comes back every time the page is opened.
 */
const PHOTOS = {
  slope: 'https://picsum.photos/id/1015/800/600',
  ridge: 'https://picsum.photos/id/1018/1600/600',
  canoe: 'https://picsum.photos/id/1011/600/800',
  map: 'https://www.openstreetmap.org/export/embed.html?bbox=-8.6520%2C41.1400%2C-8.6000%2C41.1700&layer=mapnik',
  notes:
    'Survey notes, site 12, March. Access road passable to the second gate; the north-slope monitoring well was found dry and the datalogger battery at eleven per cent. The lake crossing to the east station shows the jetty rotten through and the fence on the ridge side has been cut in two places since the October visit. A translation of this note into German runs a third longer, and the frame grows with it the same way.',
};

const family = moduleMetadata({
  imports: [SlAspectRatio, SlGrid, SlImage, SlStack, SlText],
});

const meta: Meta<AspectRatioStoryArgs> = {
  title: 'Components/AspectRatio',
  component: SlAspectRatio,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'AspectRatio',
        description:
          'A box that is a stated proportion of its own width before anything is in it, so a picture, a map or a player arrives into room already held for it. The frame reserves; it never crops.',
        framework: 'Angular',
        ...ANGULAR_ASPECT_RATIO_DOCS['aspect-ratio'],
        tokens: ANGULAR_ASPECT_RATIO_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AspectRatioStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

/** A frame with nothing in it but its own name, so the proportion is the subject. */
const empty = (label: string) =>
  `<div class="slotted-demo-surface" data-surface="raised"><span slText size="sm" tone="muted">${label}</span></div>`;

export const Playground: Story = {
  args: { ratio: 'video' },
  argTypes: {
    ratio: { control: 'select', options: ['square', 'landscape', 'portrait', 'video', 'wide'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...PHOTOS },
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div class="slotted-demo-surface" data-surface="sunken" data-flow="stack">
    <div slAspectRatio [ratio]="ratio">
      <img alt="The fjord lookout at site 12, from the cliff path" [src]="slope" />
    </div>
  </div>
</div>`,
  }),
};

export const Ratios: Story = {
  parameters: scenario('ratios'),
  render: () => ({
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('ratio="square"', '1:1 — a thumbnail in a grid of people or products.', `<div slAspectRatio ratio="square">${empty('square · 1 / 1')}</div>`)}
  ${scene('ratio="landscape"', '4:3 — a survey photograph, a card’s media.', `<div slAspectRatio ratio="landscape">${empty('landscape · 4 / 3')}</div>`)}
  ${scene('ratio="portrait"', '3:4 — a person, a document page, a phone screen.', `<div slAspectRatio ratio="portrait">${empty('portrait · 3 / 4')}</div>`)}
  ${scene('ratio="video"', '16:9 — an embedded player, a dashboard tile.', `<div slAspectRatio ratio="video">${empty('video · 16 / 9')}</div>`)}
  ${scene('ratio="wide"', '21:9 — a hero across the top of a page.', `<div slAspectRatio ratio="wide">${empty('wide · 21 / 9')}</div>`)}
</div>`,
  }),
};

export const Custom: Story = {
  parameters: scenario('custom'),
  render: () => ({
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('[ratio]="[2, 1]"', 'The pair is written on the instance as 2 / 1, exactly as it was given.', `<div slAspectRatio [ratio]="[2, 1]">${empty('custom · 2 / 1')}</div>`)}
  ${scene('[ratio]="1.85"', 'A number is written as its own quotient, 1.85.', `<div slAspectRatio [ratio]="1.85">${empty('custom · 1.85')}</div>`)}
</div>`,
  }),
};

export const Media: Story = {
  parameters: scenario('media'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('A 4:3 photograph in a 16:9 frame', 'Shown whole, with the frame’s ground either side. Nothing is cropped.', `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack"><div slAspectRatio ratio="video"><img alt="The fjord lookout at site 12" [src]="slope" /></div></div>`)}
  ${scene('A wide photograph in a square frame', 'Letterboxed above and below, for the same reason.', `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack"><div slAspectRatio ratio="square"><img alt="The ridge above site 12" [src]="ridge" /></div></div>`)}
  ${scene('A portrait in a 16:9 frame', 'A tall picture is shown entire between two bands of ground.', `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack"><div slAspectRatio ratio="video"><img alt="A surveyor crossing the lake at site 14 by canoe" [src]="canoe" /></div></div>`)}
  ${scene('An embedded map', 'An iframe takes the frame’s size and has no object-fit; the frame is what keeps it 16:9.', `<div slAspectRatio ratio="video"><iframe frameborder="0" src="${PHOTOS.map}" title="Site 12 on the map"></iframe></div>`)}
</div>`,
  }),
};

export const Growth: Story = {
  parameters: scenario('growth'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('Two lines in a 16:9 frame', 'The text fits, and the frame keeps its ratio; the frame beneath sits where the ratio puts it.', `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack"><div slAspectRatio ratio="video"><div class="slotted-demo-surface" data-surface="sunken"><span slText size="sm">Two lines fit inside a 16:9 frame at this width, so the frame keeps its ratio.</span></div></div></div><div slAspectRatio ratio="video">${empty('the frame beneath')}</div>`)}
  ${scene('A paragraph that does not fit', 'The frame grows to the paragraph’s height instead of cutting it or laying it over the frame beneath.', `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack"><div slAspectRatio ratio="video"><div class="slotted-demo-surface" data-surface="sunken"><span slText size="sm">{{ notes }}</span></div></div></div><div slAspectRatio ratio="video">${empty('the frame beneath')}</div>`)}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('A caption over a picture', 'Two children, one cell: the caption is the second child and sits on the picture with nothing positioned by hand.', `<div slAspectRatio ratio="landscape"><img alt="" [src]="slope" /><div slStack justify="end"><div class="slotted-demo-surface" data-surface="inverse"><span slText size="sm" tone="inverse" weight="medium">Site 12 — fjord lookout</span></div></div></div>`)}
  ${scene('What slImage writes', 'An image given a ratio renders this frame inside its own root, and adds the crop, the corner and the two stand-ins.', `<div slImage alt="The fjord lookout at site 12" radius="md" ratio="landscape" [src]="slope"></div>`)}
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: PHOTOS,
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene('A frame on a figure, with a caption', 'The alt says what the picture shows and the figcaption says what it is for, and neither repeats the other.', `<figure><div slAspectRatio ratio="landscape"><img alt="The fjord lookout at site 12 from the cliff path, looking down the water" [src]="slope" /></div><figcaption><span slText size="sm" tone="muted">Site 12 — fjord lookout, March survey</span></figcaption></figure>`)}
</div>`,
  }),
};
