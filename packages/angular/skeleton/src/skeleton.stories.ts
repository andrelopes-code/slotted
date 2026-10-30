import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlSkeleton } from './skeleton';
import { SlSkeletonRegion } from './skeleton-region';
import { SlSkeletonText } from './skeleton-text';
import { provideSkeletonDefaults } from './skeleton-defaults';
import type { SkeletonAnimation, SkeletonShape, SkeletonSize } from './skeleton.constants';
import { ANGULAR_SKELETON_DOCS, ANGULAR_SKELETON_TOKENS } from './skeleton.docs';

interface SkeletonStoryArgs {
  animation: SkeletonAnimation;
  loading: boolean;
  shape: SkeletonShape;
  size: SkeletonSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SKELETON_DOCS.skeleton.scenes, {
    playground: Playground,
    shapes: Shapes,
    text: Text,
    sizes: Sizes,
    wrapping: Wrapping,
    region: Region,
    timing: Timing,
    animation: Animation,
    composition: Composition,
    content: Content,
    accessibility: Accessibility,
  }) as never;

const family = moduleMetadata({
  imports: [SlSkeleton, SlSkeletonText, SlSkeletonRegion, SlAvatar, SlBadge, SlButton],
});

const meta: Meta<SkeletonStoryArgs> = {
  title: 'Components/Skeleton',
  component: SlSkeleton,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Skeleton',
        description:
          'The geometry content will occupy, reserved before the content arrives, and the region that owns the wait.',
        framework: 'Angular',
        ...ANGULAR_SKELETON_DOCS.skeleton,
        tokens: ANGULAR_SKELETON_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SkeletonStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

/**
 * The controlled placeholder inside the row it would really stand in, rather
 * than alone in the middle of a wide canvas. Turning `loading` off in the
 * controls is the demonstration: the row has to stay exactly where it is.
 */
export const Playground: Story = {
  args: { animation: 'shimmer', loading: true, shape: 'circle', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-align="start" data-layout="stack">
  <div class="slotted-demo-row">
    <span slSkeleton [shape]="shape" [size]="size" [animation]="animation" [loading]="loading">
      <span slAvatar name="Ada Lovelace" size="md"></span>
    </span>
    <div class="slotted-demo-stack">
      <span slSkeleton shape="text" [loading]="loading">Ada Lovelace</span>
      <span slSkeleton shape="text" [loading]="loading">Billing administrator</span>
    </div>
  </div>
</div>`,
  }),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'shape="text"',
    'A bar the height of the type around it, sitting on the same optical line as the words it replaces.',
    `<p>
      Invoice <span slSkeleton shape="text" inlineSize="5rem"></span> was issued to
      <span slSkeleton shape="text" inlineSize="7rem"></span> and is awaiting payment.
    </p>`,
    'prose',
  )}
  ${scene(
    'shape="block"',
    "An image, a chart, a card. Its height is yours or its content's, and with neither it is one line tall rather than nothing.",
    `<span slSkeleton shape="block" blockSize="5rem"></span>
     <span slSkeleton shape="block"></span>`,
  )}
  ${scene(
    'shape="circle"',
    "The disc a person's picture will land in. It takes Avatar's own word and Avatar's own scale.",
    `<span slSkeleton shape="circle" size="sm"></span>
     <span slSkeleton shape="circle" size="md"></span>
     <span slSkeleton shape="circle" size="lg"></span>`,
    'row',
  )}
  ${scene(
    'shape="square"',
    'The other box an avatar can be — a team, an organization, a bot — with the corner Avatar derives from the box.',
    `<span slSkeleton shape="square" size="sm"></span>
     <span slSkeleton shape="square" size="md"></span>
     <span slSkeleton shape="square" size="lg"></span>`,
    'row',
  )}
</div>`,
  }),
};

export const Text: Story = {
  parameters: scenario('text'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'lines',
    'Three rows above the prose they stand for. Compare the pitch: a row and a line of the paragraph sit the same distance apart, and the bar fills the same share of it that the words do.',
    `<div slSkeletonText></div>
     <p>
       Payment for this invoice was received on 14 March and applied to the outstanding balance.
       The remaining amount is due within thirty days.
     </p>`,
  )}
  ${scene(
    'lastLineSize',
    'The short tail is what makes a stack of bars read as prose. A single row keeps its full width, because a lone short bar stands for a sentence that was never there.',
    `<div slSkeletonText [lines]="1"></div>
     <div slSkeletonText [lines]="4" lastLineSize="35%"></div>`,
  )}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'size, against the picture it reserves',
    'Each placeholder sits above the avatar that replaces it. The pair has to be one box at every step, and stay one box when the density changes.',
    `<div class="slotted-demo-row">
       <span slSkeleton shape="circle" size="xs"></span>
       <span slSkeleton shape="circle" size="sm"></span>
       <span slSkeleton shape="circle" size="md"></span>
       <span slSkeleton shape="circle" size="lg"></span>
       <span slSkeleton shape="circle" size="xl"></span>
     </div>
     <div class="slotted-demo-row">
       <span slAvatar name="Ada Lovelace" size="xs"></span>
       <span slAvatar name="Ada Lovelace" size="sm"></span>
       <span slAvatar name="Ada Lovelace" size="md"></span>
       <span slAvatar name="Ada Lovelace" size="lg"></span>
       <span slAvatar name="Ada Lovelace" size="xl"></span>
     </div>`,
  )}
</div>`,
  }),
};

/** A load that never finishes, so a demonstration can be looked at. */
class Pending {
  pending = true;
  constructor(interval: number) {
    setInterval(() => (this.pending = !this.pending), interval);
  }
}

export const Wrapping: Story = {
  parameters: scenario('wrapping'),
  render: () => ({
    props: new Pending(2400),
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'A placeholder over its own content',
    "The same markup twice a second. Nothing moves when the badge appears, because the box was the badge's box all along.",
    `<span slSkeleton shape="block" [loading]="pending">
       <span slBadge tone="success" variant="soft">Paid in full</span>
     </span>
     <span slSkeleton shape="text" [loading]="pending">Ada Lovelace</span>`,
  )}
  ${scene(
    'A placeholder that describes instead',
    'Geometry typed by hand for content that is not there to measure. It is the right tool when there is no markup yet, and the one that can be wrong.',
    `<span slSkeleton shape="block" inlineSize="7rem" blockSize="1.5rem"></span>
     <span slSkeleton shape="text" inlineSize="9rem"></span>`,
  )}
</div>`,
  }),
};

export const Region: Story = {
  parameters: scenario('region'),
  render: () => ({
    props: new Pending(3000),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'One region, one wait',
    'Every placeholder reads the region rather than its own input, the whole subtree leaves the tab order, and the status message is said once instead of six times.',
    `<div slSkeletonRegion [messages]="{ label: 'Loading members' }" [loading]="pending">
       <div class="slotted-demo-stack">
         <div class="slotted-demo-row">
           <span slSkeleton shape="circle" size="md">
             <span slAvatar name="Ada Lovelace" size="md"></span>
           </span>
           <span slSkeleton shape="text">Ada Lovelace</span>
         </div>
         <div class="slotted-demo-row">
           <span slSkeleton shape="circle" size="md">
             <span slAvatar name="Grace Hopper" size="md"></span>
           </span>
           <span slSkeleton shape="text">Grace Hopper</span>
         </div>
         <div class="slotted-demo-row">
           <span slSkeleton shape="circle" size="md">
             <span slAvatar name="Katherine Johnson" size="md"></span>
           </span>
           <span slSkeleton shape="text">Katherine Johnson</span>
         </div>
       </div>
     </div>`,
  )}
</div>`,
  }),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => ({
    props: new Pending(900),
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'No timing',
    'A load that finishes every nine hundred milliseconds. The placeholder appears and vanishes with it, and the row never settles — that churn is the flash.',
    `<div slSkeletonRegion [messages]="{ label: 'Loading member' }" [loading]="pending">
       <div class="slotted-demo-row">
         <span slSkeleton shape="circle" size="md">
           <span slAvatar name="Ada Lovelace" size="md"></span>
         </span>
         <span slSkeleton shape="text">Ada Lovelace</span>
       </div>
     </div>`,
  )}
  ${scene(
    '[delay]="600" [minDuration]="600"',
    'The same load beside it. Nothing is painted until the wait has lasted six hundred milliseconds, and anything painted stays for six hundred more, so the row changes half as often.',
    `<div
       slSkeletonRegion
       [messages]="{ label: 'Loading member' }"
       [loading]="pending"
       [delay]="600"
       [minDuration]="600"
     >
       <div class="slotted-demo-row">
         <span slSkeleton shape="circle" size="md">
           <span slAvatar name="Grace Hopper" size="md"></span>
         </span>
         <span slSkeleton shape="text">Grace Hopper</span>
       </div>
     </div>`,
  )}
</div>`,
  }),
};

export const Animation: Story = {
  parameters: scenario('animation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'animation="shimmer"',
    'The default. A band crosses the placeholder, which is what says the content is still coming rather than that there is none.',
    `<div slSkeletonText animation="shimmer" [lines]="2"></div>
     <span slSkeleton animation="shimmer" shape="block" blockSize="3rem"></span>`,
  )}
  ${scene(
    'animation="pulse"',
    'The quiet one, for a page with many regions at once. The fill dims toward the ground and back; the rim never moves, so the shape stays put.',
    `<div slSkeletonText animation="pulse" [lines]="2"></div>
     <span slSkeleton animation="pulse" shape="block" blockSize="3rem"></span>`,
  )}
  ${scene(
    'animation="none"',
    'Still, and the same shape. It is what every value becomes under prefers-reduced-motion, so this is also what a reader who asked for stillness sees.',
    `<div slSkeletonText animation="none" [lines]="2"></div>
     <span slSkeleton animation="none" shape="block" blockSize="3rem"></span>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    family,
    applicationConfig({
      providers: [
        provideSkeletonDefaults({
          animation: 'shimmer',
          lastLineSize: '45%',
        }),
      ],
    }),
  ],
  render: () => ({
    props: new Pending(3200),
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'A member row',
    'Each placeholder reserves the box its own family will occupy — an avatar disc, two lines of type, a chip — so the row does not move when the data lands.',
    `<div slSkeletonRegion [messages]="{ label: 'Loading members' }" animation="shimmer" [loading]="pending">
       <div class="slotted-demo-row">
         <span slSkeleton shape="circle" size="md">
           <span slAvatar name="Grace Hopper" size="md"></span>
         </span>
         <div class="slotted-demo-stack">
           <span slSkeleton shape="text">Grace Hopper</span>
           <span slSkeleton shape="text">Billing administrator</span>
         </div>
         <span slSkeleton shape="block">
           <span slBadge tone="success" variant="soft">Active</span>
         </span>
       </div>
     </div>`,
  )}
  ${scene(
    'Defaults for a whole application',
    'provideSkeletonDefaults decides the animation, the measure and the timing once. A region or a box that states its own still wins over it — the row beside this one does.',
    `<div slSkeletonRegion>
       <div slSkeletonText [lines]="3"></div>
     </div>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'A narrow column',
    'Four rows in a 240-pixel measure. The rows follow the column rather than overflowing it, and the short tail is still the last of them.',
    `<div class="slotted-demo-measure">
       <div slSkeletonText [lines]="4"></div>
     </div>`,
  )}
  ${scene(
    'dir="rtl"',
    'The short row moves to the other end and the band sweeps the other way, because the family reads the direction rather than the screen.',
    `<div slSkeletonText dir="rtl" [lines]="3"></div>`,
  )}
  ${scene(
    'A heading',
    'No size input anywhere: the bar is one em of whatever type surrounds it, so it is heading-tall inside a heading and caption-short inside a caption.',
    `<h2><span slSkeleton shape="text" inlineSize="70%"></span></h2>
     <small><span slSkeleton shape="text" inlineSize="50%"></span></small>`,
    'prose',
  )}
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: new Pending(4000),
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Focus never enters a waiting region',
    'Tab from the button above and focus reaches the one below it, skipping the covered button entirely — it is inert, not merely hidden.',
    `<button slButton variant="outline" type="button">Before</button>
     <div slSkeletonRegion [messages]="{ label: 'Loading actions' }" [loading]="pending">
       <span slSkeleton shape="block">
         <button slButton tone="accent" type="button">Approve invoice</button>
       </span>
     </div>
     <button slButton variant="outline" type="button">After</button>`,
  )}
  ${scene(
    'live="off"',
    'A region whose wait the reader is not waiting on says nothing, exactly as a badge decides whether it is a live region at all.',
    `<div slSkeletonRegion live="off" [loading]="pending">
       <div slSkeletonText [lines]="2"></div>
     </div>`,
  )}
</div>`,
  }),
};
