import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSkeleton } from './skeleton';
import type { SkeletonShape } from './skeleton';
import { ANGULAR_SKELETON_DOCS, ANGULAR_SKELETON_TOKENS } from './skeleton.docs';

interface SkeletonStoryArgs {
  shape: SkeletonShape;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Shapes as never,
});

const meta: Meta<SkeletonStoryArgs> = {
  title: 'Components/Skeleton',
  component: SlSkeleton,
  decorators: [moduleMetadata({ imports: [SlSkeleton] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Skeleton',
        description: 'A placeholder that holds the space content will take.',
        framework: 'Angular',
        ...ANGULAR_SKELETON_DOCS.skeleton,
        tokens: ANGULAR_SKELETON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SkeletonStoryArgs>;

export const Playground: Story = {
  args: { shape: 'text' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <span slSkeleton [shape]="shape"></span>
</div>`,
  }),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">text</span>
      <span class="slotted-demo-scene__note">A line high, the width available.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <span slSkeleton></span>
        <span slSkeleton style="inline-size: 70%"></span>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">rectangle</span>
      <span class="slotted-demo-scene__note">Sized by the consumer, for a picture.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slSkeleton shape="rectangle" style="block-size: 4rem; inline-size: 100%"></span>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">circle</span>
      <span class="slotted-demo-scene__note">Square by aspect ratio, for an avatar.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slSkeleton shape="circle"></span>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div aria-busy="true" class="slotted-demo-row">
    <span slSkeleton shape="circle"></span>
    <div class="slotted-demo-stack" style="flex: 1">
      <span slSkeleton style="inline-size: 40%"></span>
      <span slSkeleton style="inline-size: 70%"></span>
    </div>
  </div>
  <p>
    The placeholders take the space the finished row will take, so nothing moves when the content
    arrives.
  </p>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div aria-busy="true" aria-live="polite" class="slotted-demo-stack">
      <span slSkeleton></span>
      <span slSkeleton style="inline-size: 55%"></span>
    </div>
    <p>
      Every placeholder above is hidden from assistive technology. The region around them carries
      aria-busy, which is what a screen reader hears; the shapes themselves have nothing to say
      until the content replaces them.
    </p>
  </div>
</div>`,
  }),
};
