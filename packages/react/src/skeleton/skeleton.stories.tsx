import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from './skeleton';
import { REACT_SKELETON_DOCS, REACT_SKELETON_TOKENS } from './skeleton.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Shapes as never,
});

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Skeleton',
        description: 'A placeholder that holds the space content will take.',
        framework: 'React',
        ...REACT_SKELETON_DOCS.skeleton,
        tokens: REACT_SKELETON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { shape: 'text' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Skeleton {...args} />
    </div>
  ),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">text</span>
          <span className="slotted-demo-scene__note">A line high, the width available.</span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <Skeleton />
            <Skeleton style={{ inlineSize: '70%' }} />
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">rectangle</span>
          <span className="slotted-demo-scene__note">Sized by the consumer, for a picture.</span>
        </header>
        <div className="slotted-demo-stage">
          <Skeleton shape="rectangle" style={{ blockSize: '4rem', inlineSize: '100%' }} />
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">circle</span>
          <span className="slotted-demo-scene__note">Square by aspect ratio, for an avatar.</span>
        </header>
        <div className="slotted-demo-stage">
          <Skeleton shape="circle" />
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div aria-busy="true" className="slotted-demo-row">
        <Skeleton shape="circle" />
        <div className="slotted-demo-stack" style={{ flex: 1 }}>
          <Skeleton style={{ inlineSize: '40%' }} />
          <Skeleton style={{ inlineSize: '70%' }} />
        </div>
      </div>
      <p>
        The placeholders take the space the finished row will take, so nothing moves when the
        content arrives.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <div aria-busy="true" aria-live="polite" className="slotted-demo-stack">
          <Skeleton />
          <Skeleton style={{ inlineSize: '55%' }} />
        </div>
        <p>
          Every placeholder above is hidden from assistive technology. The region around them
          carries aria-busy, which is what a screen reader hears; the shapes themselves have nothing
          to say until the content replaces them.
        </p>
      </div>
    </div>
  ),
};
