import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody, SlCardHeader, SlCardMedia } from '@slotted/angular/card';
import { SlGrid } from '@slotted/angular/grid';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlImage } from './image';
import type { ImageFit, ImagePosition, ImageRadius } from './image';
import { provideImageDefaults } from './image-defaults';
import { SlImageFallback, SlImagePlaceholder } from './image-slots';
import { ANGULAR_IMAGE_DOCS, ANGULAR_IMAGE_TOKENS } from './image.docs';

interface ImageStoryArgs {
  bordered: boolean;
  fit: ImageFit;
  position: ImagePosition;
  radius: ImageRadius;
  ratio: 'square' | 'landscape' | 'portrait' | 'video' | 'wide';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_IMAGE_DOCS.image.scenes, {
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

/*
 * Field-survey photographs, from Lorem Picsum by fixed id so the same picture
 * comes back every time the page is opened. `preview` is the forty-pixel
 * version of the first, which is what a blurred placeholder is made from;
 * `missing` is an id the service does not have, so the request really fails.
 */
const PHOTOS = {
  slope: 'https://picsum.photos/id/1015/800/600',
  slopeWide: 'https://picsum.photos/id/1015/1600/600',
  slopePortrait: 'https://picsum.photos/id/1015/600/800',
  preview: 'https://picsum.photos/id/1015/40/30',
  ridge: 'https://picsum.photos/id/1018/1600/600',
  canoe: 'https://picsum.photos/id/1011/600/800',
  canyon: 'https://picsum.photos/id/1016/800/600',
  forest: 'https://picsum.photos/id/1019/800/600',
  valley: 'https://picsum.photos/id/1043/800/600',
  missing: 'https://picsum.photos/id/9999999/800/600',
  tiny: 'https://picsum.photos/id/1015/96/72',
  sources: [
    { srcSet: 'https://picsum.photos/id/1015/800/600.webp', type: 'image/webp' },
    { media: '(max-width: 480px)', srcSet: 'https://picsum.photos/id/1015/600/800' },
  ],
  sites: [
    {
      id: 12,
      name: 'Site 12 — fjord lookout',
      photo: 'https://picsum.photos/id/1015/800/600',
      status: undefined,
      position: 'center',
    },
    {
      id: 14,
      name: 'Site 14 — lake crossing',
      photo: 'https://picsum.photos/id/1011/600/800',
      status: undefined,
      position: 'top',
    },
    {
      id: 15,
      name: 'Site 15 — red escarpment',
      photo: 'https://picsum.photos/id/1016/800/600',
      status: undefined,
      position: 'center',
    },
    {
      id: 17,
      name: 'Site 17 — forest track',
      photo: 'https://picsum.photos/id/1019/800/600',
      status: 'loading',
      position: 'center',
    },
    {
      id: 18,
      name: 'Site 18 — valley floor',
      photo: 'https://picsum.photos/id/1043/800/600',
      status: undefined,
      position: 'center',
    },
    {
      id: 21,
      name: 'Site 21 — quarry',
      photo: 'https://picsum.photos/id/9999999/800/600',
      status: undefined,
      position: 'center',
    },
  ],
};

const family = moduleMetadata({
  imports: [
    SlImage,
    SlImageFallback,
    SlImagePlaceholder,
    SlButton,
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlCardMedia,
    SlGrid,
    SlSkeleton,
    SlStack,
    SlText,
  ],
});

const meta: Meta<ImageStoryArgs> = {
  title: 'Components/Image',
  component: SlImage,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Image',
        description:
          'A picture, and what stands in for it before it arrives and after it fails: the platform’s img with every attribute it has, a frame composed from slAspectRatio when a ratio was decided, a fit, a focal point, a corner and an edge.',
        framework: 'Angular',
        ...ANGULAR_IMAGE_DOCS.image,
        tokens: ANGULAR_IMAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ImageStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
  /** How small the subject may legitimately be, when it is small by design. */
  floor?: number,
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}"${floor === undefined ? '' : ` data-collapse-floor="${floor}"`}>${body}</div>
  </section>`;

/** A ground behind a picture shown whole, so the letterbox reads. */
const sunken = (body: string) =>
  `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack">${body}</div>`;

export const Playground: Story = {
  args: { bordered: false, fit: 'cover', position: 'center', radius: 'md', ratio: 'landscape' },
  argTypes: {
    fit: { control: 'select', options: ['cover', 'contain', 'fill', 'none', 'scale-down'] },
    position: { control: 'select', options: ['center', 'top', 'bottom', 'start', 'end'] },
    radius: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    ratio: { control: 'select', options: ['square', 'landscape', 'portrait', 'video', 'wide'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...PHOTOS },
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <div
    slImage
    alt="The fjord lookout at site 12, from the cliff path"
    [src]="slopeWide"
    [ratio]="ratio"
    [fit]="fit"
    [position]="position"
    [radius]="radius"
    [bordered]="bordered"
  ></div>
</div>`,
  }),
};

export const Sizing: Story = {
  parameters: scenario('sizing'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('width and height', 'The element reserves 4:3 before the first byte, and the picture is its own size, shrunk to the column.', `<div slImage alt="The fjord lookout at site 12" width="800" height="600" [src]="slope"></div>`)}
  ${scene('layout="fill"', 'The box is the parent’s in both axes — here a tall viewport — and cover crops the picture to it.', `<div class="slotted-demo-viewport" data-size="tall"><div slImage alt="The fjord lookout at site 12" layout="fill" [src]="slope"></div></div>`)}
  ${scene('width and height, still loading', 'The reserved 4:3 box is the sunken ground until the picture reports.', `<div slImage alt="The fjord lookout at site 12" width="800" height="600" status="loading" [src]="slope"></div>`)}
  ${scene('Nothing decided, still loading', 'No ratio, no width, no height, and a request that has not answered: there is no box to hold, and the stage is empty until the picture reports.', `<div slImage alt="The fjord lookout at site 12" status="loading" [src]="missing"></div>`)}
</div>`,
  }),
};

export const Ratio: Story = {
  parameters: scenario('ratio'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('ratio="landscape"', 'A wide photograph cropped to 4:3 at the column’s width.', `<div slImage alt="The ridge above site 12" radius="md" ratio="landscape" [src]="ridge"></div>`)}
  ${scene('ratio="portrait"', 'The same kind of frame, 3:4, holding a landscape.', `<div slImage alt="The fjord lookout at site 12" radius="md" ratio="portrait" [src]="slope"></div>`)}
  ${scene('ratio="wide", still loading', 'The 21:9 frame is held at the column’s width before anything arrives.', `<div slImage alt="The ridge above site 12" radius="md" ratio="wide" status="loading" [src]="ridge"></div>`)}
  ${scene('[ratio]="[2, 1]"', 'A pair the product decided, written on the frame as 2 / 1.', `<div slImage alt="The ridge above site 12" radius="md" [ratio]="[2, 1]" [src]="ridge"></div>`)}
</div>`,
  }),
};

export const Fit: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'sm' })] })],
  parameters: scenario('fit'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('fit="cover"', 'Cropped to fill the square; the sides of the 4:3 go.', `<div slImage alt="The fjord lookout at site 12" fit="cover" ratio="square" [src]="slope"></div>`)}
  ${scene('fit="contain"', 'Shown whole, letterboxed above and below on the page’s own ground.', sunken(`<div slImage alt="The fjord lookout at site 12" fit="contain" ratio="square" [src]="slope"></div>`))}
  ${scene('fit="fill"', 'Stretched to the square: the cliff is a third taller than it is.', `<div slImage alt="The fjord lookout at site 12" fit="fill" ratio="square" [src]="slope"></div>`)}
  ${scene('fit="none"', 'A 96 by 72 picture drawn at its natural size in the middle of the frame.', sunken(`<div slImage alt="The fjord lookout at site 12" fit="none" ratio="square" [src]="tiny"></div>`))}
  ${scene('fit="scale-down"', 'The same as none here; it would be contain if the picture were larger than the frame.', sunken(`<div slImage alt="The fjord lookout at site 12" fit="scale-down" ratio="square" [src]="tiny"></div>`))}
</div>`,
  }),
};

export const Position: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'sm' })] })],
  parameters: scenario('position'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('position="start"', 'The wide picture keeps its start; in rtl, its end.', `<div slImage alt="The ridge above site 12" position="start" ratio="square" [src]="ridge"></div>`)}
  ${scene('position="center"', 'The middle of the wide picture, either way round.', `<div slImage alt="The ridge above site 12" position="center" ratio="square" [src]="ridge"></div>`)}
  ${scene('position="end"', 'The end of the wide picture; in rtl, its start.', `<div slImage alt="The ridge above site 12" position="end" ratio="square" [src]="ridge"></div>`)}
  ${scene('position="top"', 'The portrait keeps its top: the treeline over the water.', `<div slImage alt="A surveyor crossing the lake at site 14 by canoe" position="top" ratio="video" [src]="canoe"></div>`)}
  ${scene('position="bottom"', 'The portrait keeps its bottom: the canoe and the paddle.', `<div slImage alt="A surveyor crossing the lake at site 14 by canoe" position="bottom" ratio="video" [src]="canoe"></div>`)}
  ${scene('position="30% 20%"', 'A focal point from the CMS, written on the instance; the DOM says custom.', `<div slImage alt="A surveyor crossing the lake at site 14 by canoe" position="30% 20%" ratio="video" [src]="canoe"></div>`)}
</div>`,
  }),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    props: PHOTOS,
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene('radius="none" · "sm" · "md" · "lg"', 'The four steps of the radius scale, on the same square picture.', `<div slGrid [columns]="4" [gap]="4"><div slImage alt="The fjord lookout at site 12" radius="none" ratio="square" [src]="slope"></div><div slImage alt="The fjord lookout at site 12" radius="sm" ratio="square" [src]="slope"></div><div slImage alt="The fjord lookout at site 12" radius="md" ratio="square" [src]="slope"></div><div slImage alt="The fjord lookout at site 12" radius="lg" ratio="square" [src]="slope"></div></div>`)}
  ${scene('bordered, beside the same picture without', 'A subtle inset edge on the left tile and none on the right; the two tiles are the same size, because the edge is drawn inside the box.', `<div slGrid [columns]="2" [gap]="4"><div slImage alt="The red escarpment at site 15" bordered radius="md" ratio="landscape" [src]="canyon"></div><div slImage alt="The red escarpment at site 15" radius="md" ratio="landscape" [src]="canyon"></div></div>`)}
</div>`,
  }),
};

export const Loading: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'md' })] })],
  parameters: scenario('loading'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('placeholder="surface"', 'The sunken ground, a step below the page in every scheme.', `<div slImage alt="The fjord lookout at site 12" ratio="landscape" status="loading" [src]="slope"></div>`)}
  ${scene('placeholder="blur"', 'A forty-pixel version of the same picture, scaled and blurred where the picture will be, with the same fit and focal point.', `<div slImage alt="The fjord lookout at site 12" placeholder="blur" ratio="landscape" status="loading" [placeholderSrc]="preview" [src]="slope"></div>`)}
  ${scene('placeholder="none"', 'Nothing painted; the frame still holds its shape, shown here on a sunken surface.', sunken(`<div slImage alt="The fjord lookout at site 12" placeholder="none" ratio="landscape" status="loading" [src]="slope"></div>`))}
  ${scene('[slImagePlaceholder]', 'An slSkeleton over the ground: the consumer’s own stand-in, with the family’s clip and corner.', `<div slImage alt="The fjord lookout at site 12" ratio="landscape" status="loading" [src]="slope"><span slImagePlaceholder slSkeleton shape="block"></span></div>`)}
</div>`,
  }),
};

export const Error: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'md' })] })],
  parameters: scenario('error'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="2" [gap]="6">
  ${scene('The picture is not there', 'The request fails, and the image-off glyph stands on the ground in the decided frame.', `<div slImage alt="The fjord lookout at site 12" ratio="landscape" [src]="missing"></div>`)}
  ${scene('Nothing reserved, and the picture is not there', 'No frame, no width: the fallback gives itself the minimum a glyph needs, and nothing more.', `<div slImage alt="The fjord lookout at site 12" [src]="missing"></div>`, 'block', 64)}
  ${scene('[slImageFallback]', 'A message and a retry in place of the glyph; the button is reachable only once the picture has failed.', `<div slImage alt="The fjord lookout at site 12" ratio="landscape" [src]="missing"><div slImageFallback slStack align="center" [gap]="3"><span slText size="sm" tone="muted">Photo unavailable</span><button slButton size="sm" variant="outline" type="button">Retry</button></div></div>`)}
  ${scene('fallbackSrc', 'The first URL failed and the second was tried in silence; the archived photograph is what shows, as loaded.', `<div slImage alt="The fjord lookout at site 12" ratio="landscape" [fallbackSrc]="slope" [src]="missing"></div>`)}
</div>`,
  }),
};

export const Sources: Story = {
  parameters: scenario('sources'),
  render: () => ({
    props: PHOTOS,
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene('sources', 'A WebP for browsers that take it, and below 480 pixels the portrait crop; above it, the landscape. Drag the window across that width and the picture changes.', `<div slImage alt="The fjord lookout at site 12" radius="md" ratio="landscape" [sources]="sources" [src]="slope"></div>`)}
</div>`,
  }),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    props: {
      ...PHOTOS,
      current: PHOTOS.slope,
      seen: [] as string[],
      report(this: { seen: string[] }, status: string) {
        this.seen = [...this.seen, status];
      },
    },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene('(statusChange)', 'Each button starts a new request; the log shows loaded for a picture that arrived and error for one that did not, and nothing for the loading in between, which is a fact the DOM already states.', `<div slGrid [columns]="2" [gap]="6"><div slImage alt="The fjord lookout at site 12" radius="md" ratio="landscape" [src]="current" (statusChange)="report($event)"></div><div slStack [gap]="3"><span slText size="sm" tone="muted">{{ seen.length === 0 ? 'Nothing reported yet.' : 'Reported: ' + seen.join(' → ') }}</span><div class="slotted-demo-row"><button slButton size="sm" variant="outline" type="button" (click)="current = canyon">Load another picture</button><button slButton size="sm" variant="outline" type="button" (click)="current = missing">Load a missing one</button></div></div></div>`)}
</div>`,
  }),
};

export const Interactive: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'md' })] })],
  parameters: scenario('interactive'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('A link', 'Tab to it for the ring outside the box; hover for the strong edge inside it.', `<a slImage href="#site-12" alt="Open site 12" ratio="square" [src]="slope"></a>`)}
  ${scene('A button', 'The same two states on a button that would open a Dialog with the full picture.', `<button slImage type="button" alt="Open the full-size photo of the lake crossing" ratio="square" [src]="canoe"></button>`)}
  ${scene('A link whose picture failed', 'Still a link, still focusable, still named; the glyph is what it shows.', `<a slImage href="#site-14" alt="Open site 14" ratio="square" [src]="missing"></a>`)}
</div>`,
  }),
};

export const InContext: Story = {
  decorators: [
    applicationConfig({ providers: [provideImageDefaults({ bordered: true, radius: 'md' })] }),
  ],
  parameters: scenario('in-context'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="3" [gap]="5">
  @for (site of sites; track site.id) {
    <article slCard>
      <div slCardMedia>
        <div slImage alt="" ratio="landscape" [position]="site.position" [src]="site.photo" [status]="site.status"></div>
      </div>
      <div slCardHeader><span slText weight="medium">{{ site.name }}</span></div>
      <div slCardBody><span slText size="sm" tone="muted">March survey</span></div>
    </article>
  }
</div>`,
  }),
};

export const Accessibility: Story = {
  decorators: [applicationConfig({ providers: [provideImageDefaults({ radius: 'md' })] })],
  parameters: scenario('accessibility'),
  render: () => ({
    props: PHOTOS,
    template: `
<div slGrid [columns]="3" [gap]="6">
  ${scene('Informative', 'The alt says what the picture shows, and a reader who cannot see it learns the finding.', `<div slImage alt="Rockfall debris below the red escarpment at site 15" ratio="landscape" [src]="canyon"></div>`)}
  ${scene('Decorative', 'alt="" beside the text that already names the site: the picture is skipped and the name is read once.', `<div slStack [gap]="3"><div slImage alt="" ratio="landscape" [src]="slope"></div><span slText weight="medium">Site 12 — fjord lookout</span></div>`)}
  ${scene('Functional, with a caption', 'The alt names the action of the button; the figcaption says what the picture is for, and neither repeats the other.', `<figure><button slImage type="button" alt="Open the full-size photo of site 15" ratio="landscape" [src]="canyon"></button><figcaption><span slText size="sm" tone="muted">Site 15 — red escarpment, March survey</span></figcaption></figure>`)}
</div>`,
  }),
};
