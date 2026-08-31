import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './avatar';
import { AvatarFallback } from './avatar-fallback';
import { AvatarImage } from './avatar-image';
import { REACT_AVATAR_DOCS, REACT_AVATAR_TOKENS } from './avatar.docs';

const PORTRAIT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%231d4ed8'/><circle cx='32' cy='25' r='11' fill='%23dbeafe'/><path d='M9 64c3-14 11-20 23-20s20 6 23 20z' fill='%23dbeafe'/></svg>";

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Avatar',
        description: 'A picture of a person or an entity, and what stands in when there is none.',
        framework: 'React',
        ...REACT_AVATAR_DOCS.avatar,
        tokens: REACT_AVATAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar {...args}>
          <AvatarImage alt="Ada Lovelace" src={PORTRAIT} />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <section className="slotted-demo-scene" key={size}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{size}</span>
            <span className="slotted-demo-scene__note">
              The type in the fallback scales with the frame.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              <Avatar size={size}>
                <AvatarImage alt="Ada Lovelace" src={PORTRAIT} />
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar size={size}>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Fallback: Story = {
  parameters: scenario('fallback'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Picture arrives</span>
          <span className="slotted-demo-scene__note">The fallback leaves the document.</span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar>
            <AvatarImage alt="Ada Lovelace" src={PORTRAIT} />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Picture fails</span>
          <span className="slotted-demo-scene__note">Initials stand in, and nothing flashes.</span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar>
            <AvatarImage alt="Grace Hopper" src="/there-is-no-such-picture.png" />
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">No picture at all</span>
          <span className="slotted-demo-scene__note">The fallback is the whole component.</span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar>
            <AvatarFallback>+7</AvatarFallback>
          </Avatar>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar size="lg">
          <AvatarImage alt="" src={PORTRAIT} />
          <AvatarFallback />
        </Avatar>
        <div className="slotted-demo-stack">
          <strong>Ada Lovelace</strong>
          <span>Owner</span>
        </div>
      </div>
      <p>
        The picture takes an empty alt and the fallback is empty, because the name is written out
        beside it. Repeating it would make a screen reader read the same person twice.
      </p>
    </div>
  ),
};
