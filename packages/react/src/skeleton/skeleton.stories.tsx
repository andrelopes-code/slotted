import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Badge } from '../badge';
import { Skeleton } from './skeleton';
import { SkeletonDefaultsProvider } from './skeleton-defaults';
import { SkeletonRegion } from './skeleton-region';
import { SkeletonText } from './skeleton-text';
import { REACT_SKELETON_DOCS, REACT_SKELETON_TOKENS } from './skeleton.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SKELETON_DOCS.skeleton.scenes, {
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

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Skeleton',
        description:
          'The geometry content will occupy, reserved before the content arrives, and the region that owns the wait.',
        framework: 'React',
        ...REACT_SKELETON_DOCS.skeleton,
        tokens: REACT_SKELETON_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'stack',
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

/** A load that never finishes, so a demonstration can be looked at. */
function useToggle(interval: number) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setOn((value) => !value), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return on;
}

/**
 * The controlled placeholder inside the row it would really stand in, rather
 * than alone in the middle of a wide canvas. Turning `loading` off in the
 * controls is the demonstration: the row has to stay exactly where it is.
 */
export const Playground: Story = {
  args: {
    animation: 'shimmer',
    loading: true,
    shape: 'circle',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="stack">
      <div className="slotted-demo-row">
        <Skeleton {...args}>
          <Avatar name="Ada Lovelace" size="md" />
        </Skeleton>
        <div className="slotted-demo-stack">
          <Skeleton loading={args.loading ?? true} shape="text">
            Ada Lovelace
          </Skeleton>
          <Skeleton loading={args.loading ?? true} shape="text">
            Billing administrator
          </Skeleton>
        </div>
      </div>
    </div>
  ),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label='shape="text"'
        layout="prose"
        note="A bar the height of the type around it, sitting on the same optical line as the words it replaces."
      >
        <p>
          Invoice <Skeleton inlineSize="5rem" shape="text" /> was issued to{' '}
          <Skeleton inlineSize="7rem" shape="text" /> and is awaiting payment.
        </p>
      </Scene>
      <Scene
        label='shape="block"'
        note="An image, a chart, a card. Its height is yours or its content's, and with neither it is one line tall rather than nothing."
      >
        <Skeleton blockSize="5rem" shape="block" />
        <Skeleton shape="block" />
      </Scene>
      <Scene
        label='shape="circle"'
        layout="row"
        note="The disc a person's picture will land in. It takes Avatar's own word and Avatar's own scale."
      >
        <Skeleton shape="circle" size="sm" />
        <Skeleton shape="circle" size="md" />
        <Skeleton shape="circle" size="lg" />
      </Scene>
      <Scene
        label='shape="square"'
        layout="row"
        note="The other box an avatar can be — a team, an organization, a bot — with the corner Avatar derives from the box."
      >
        <Skeleton shape="square" size="sm" />
        <Skeleton shape="square" size="md" />
        <Skeleton shape="square" size="lg" />
      </Scene>
    </div>
  ),
};

export const Text: Story = {
  parameters: scenario('text'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="lines"
        note="Three rows above the prose they stand for. Compare the pitch: a row and a line of the paragraph sit the same distance apart, and the bar fills the same share of it that the words do."
      >
        <SkeletonText />
        <p>
          Payment for this invoice was received on 14 March and applied to the outstanding balance.
          The remaining amount is due within thirty days.
        </p>
      </Scene>
      <Scene
        label="lastLineSize"
        note="The short tail is what makes a stack of bars read as prose. A single row keeps its full width, because a lone short bar stands for a sentence that was never there."
      >
        <SkeletonText lines={1} />
        <SkeletonText lastLineSize="35%" lines={4} />
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="size, against the picture it reserves"
        note="Each placeholder sits above the avatar that replaces it. The pair has to be one box at every step, and stay one box when the density changes."
      >
        <div className="slotted-demo-row">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Skeleton key={size} shape="circle" size={size} />
          ))}
        </div>
        <div className="slotted-demo-row">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Avatar key={size} name="Ada Lovelace" size={size} />
          ))}
        </div>
      </Scene>
    </div>
  ),
};

export const Wrapping: Story = {
  parameters: scenario('wrapping'),
  render: () => {
    const pending = useToggle(2400);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="A placeholder over its own content"
          note="The same markup twice a second. Nothing moves when the badge appears, because the box was the badge's box all along."
        >
          <Skeleton loading={pending} shape="block">
            <Badge tone="success" variant="soft">
              Paid in full
            </Badge>
          </Skeleton>
          <Skeleton loading={pending} shape="text">
            Ada Lovelace
          </Skeleton>
        </Scene>
        <Scene
          label="A placeholder that describes instead"
          note="Geometry typed by hand for content that is not there to measure. It is the right tool when there is no markup yet, and the one that can be wrong."
        >
          <Skeleton blockSize="1.5rem" inlineSize="7rem" shape="block" />
          <Skeleton inlineSize="9rem" shape="text" />
        </Scene>
      </div>
    );
  },
};

export const Region: Story = {
  parameters: scenario('region'),
  render: () => {
    const pending = useToggle(3000);
    return (
      <div className="slotted-demo-grid" data-columns="1">
        <Scene
          label="One region, one wait"
          note="Every placeholder reads the region rather than its own prop, the whole subtree leaves the tab order, and the status message is said once instead of six times."
        >
          <SkeletonRegion messages={{ label: 'Loading members' }} loading={pending}>
            <div className="slotted-demo-stack">
              {['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson'].map((name) => (
                <div className="slotted-demo-row" key={name}>
                  <Skeleton loading={pending} shape="circle" size="md">
                    <Avatar name={name} size="md" />
                  </Skeleton>
                  <Skeleton loading={pending} shape="text">
                    {name}
                  </Skeleton>
                </div>
              ))}
            </div>
          </SkeletonRegion>
        </Scene>
      </div>
    );
  },
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => {
    const pending = useToggle(900);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="No timing"
          note="A load that finishes every nine hundred milliseconds. The placeholder appears and vanishes with it, and the row never settles — that churn is the flash."
        >
          <SkeletonRegion messages={{ label: 'Loading member' }} loading={pending}>
            <div className="slotted-demo-row">
              <Skeleton shape="circle" size="md">
                <Avatar name="Ada Lovelace" size="md" />
              </Skeleton>
              <Skeleton shape="text">Ada Lovelace</Skeleton>
            </div>
          </SkeletonRegion>
        </Scene>
        <Scene
          label="delay={600} minDuration={600}"
          note="The same load beside it. Nothing is painted until the wait has lasted six hundred milliseconds, and anything painted stays for six hundred more, so the row changes half as often."
        >
          <SkeletonRegion
            delay={600}
            messages={{ label: 'Loading member' }}
            loading={pending}
            minDuration={600}
          >
            <div className="slotted-demo-row">
              <Skeleton shape="circle" size="md">
                <Avatar name="Grace Hopper" size="md" />
              </Skeleton>
              <Skeleton shape="text">Grace Hopper</Skeleton>
            </div>
          </SkeletonRegion>
        </Scene>
      </div>
    );
  },
};

export const Animation: Story = {
  parameters: scenario('animation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label='animation="shimmer"'
        note="The default. A band crosses the placeholder, which is what says the content is still coming rather than that there is none."
      >
        <SkeletonText animation="shimmer" lines={2} />
        <Skeleton animation="shimmer" blockSize="3rem" shape="block" />
      </Scene>
      <Scene
        label='animation="pulse"'
        note="The quiet one, for a page with many regions at once. The fill dims toward the ground and back; the rim never moves, so the shape stays put."
      >
        <SkeletonText animation="pulse" lines={2} />
        <Skeleton animation="pulse" blockSize="3rem" shape="block" />
      </Scene>
      <Scene
        label='animation="none"'
        note="Still, and the same shape. It is what every value becomes under prefers-reduced-motion, so this is also what a reader who asked for stillness sees."
      >
        <SkeletonText animation="none" lines={2} />
        <Skeleton animation="none" blockSize="3rem" shape="block" />
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    const pending = useToggle(3200);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="A member row"
          note="Each placeholder reserves the box its own family will occupy — an avatar disc, two lines of type, a chip — so the row does not move when the data lands."
        >
          <SkeletonRegion messages={{ label: 'Loading members' }} loading={pending}>
            <div className="slotted-demo-row">
              <Skeleton shape="circle" size="md">
                <Avatar name="Grace Hopper" size="md" />
              </Skeleton>
              <div className="slotted-demo-stack">
                <Skeleton shape="text">Grace Hopper</Skeleton>
                <Skeleton shape="text">Billing administrator</Skeleton>
              </div>
              <Skeleton shape="block">
                <Badge tone="success" variant="soft">
                  Active
                </Badge>
              </Skeleton>
            </div>
          </SkeletonRegion>
        </Scene>
        <Scene
          label="Defaults for a whole application"
          note="The provider decides the animation, the measure and the timing once. A region or a box that states its own still wins over it."
        >
          <SkeletonDefaultsProvider animation="pulse" lastLineSize="45%">
            <SkeletonRegion>
              <SkeletonText lines={3} />
            </SkeletonRegion>
          </SkeletonDefaultsProvider>
        </Scene>
      </div>
    );
  },
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="A narrow column"
        note="Four rows in a 240-pixel measure. The rows follow the column rather than overflowing it, and the short tail is still the last of them."
      >
        <div className="slotted-demo-measure">
          <SkeletonText lines={4} />
        </div>
      </Scene>
      <Scene
        label='dir="rtl"'
        note="The short row moves to the other end and the band sweeps the other way, because the family reads the direction rather than the screen."
      >
        <SkeletonText dir="rtl" lines={3} />
      </Scene>
      <Scene
        label="A heading"
        layout="prose"
        note="No size prop anywhere: the bar is one em of whatever type surrounds it, so it is heading-tall inside a heading and caption-short inside a caption."
      >
        <h2>
          <Skeleton inlineSize="70%" shape="text" />
        </h2>
        <small>
          <Skeleton inlineSize="50%" shape="text" />
        </small>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => {
    const pending = useToggle(4000);
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="Focus never enters a waiting region"
          note="Tab from the button above and focus reaches the one below it, skipping the covered button entirely — it is inert, not merely hidden."
        >
          <Button variant="outline">Before</Button>
          <SkeletonRegion messages={{ label: 'Loading actions' }} loading={pending}>
            <Skeleton shape="block">
              <Button tone="accent">Approve invoice</Button>
            </Skeleton>
          </SkeletonRegion>
          <Button variant="outline">After</Button>
        </Scene>
        <Scene
          label='live="off"'
          note="A region whose wait the reader is not waiting on says nothing, exactly as a badge decides whether it is a live region at all."
        >
          <SkeletonRegion live="off" loading={pending}>
            <SkeletonText lines={2} />
          </SkeletonRegion>
        </Scene>
      </div>
    );
  },
};
