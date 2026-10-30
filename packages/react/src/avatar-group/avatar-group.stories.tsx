import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { AvatarGroup } from './avatar-group';
import { REACT_AVATAR_GROUP_DOCS, REACT_AVATAR_GROUP_TOKENS } from './avatar-group.docs';

const portrait = () => `https://i.pravatar.cc/128?random=${Math.random()}`;

const PEOPLE = [
  { name: 'Ada Lovelace', src: portrait() },
  { name: 'Grace Hopper', src: portrait() },
  { name: 'Alan Turing', src: undefined },
  { name: 'Katherine Johnson', src: portrait() },
  { name: 'Barbara Liskov', src: undefined },
  { name: 'Donald Knuth', src: undefined },
  { name: 'Margaret Hamilton', src: undefined },
];

const members = (count = PEOPLE.length) =>
  PEOPLE.slice(0, count).map((person) => (
    <Avatar key={person.name} name={person.name} src={person.src} />
  ));

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Overflow as never,
});

const meta = {
  title: 'Components/Avatar Group',
  component: AvatarGroup,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Avatar Group',
        description:
          'A list of faces, overlapped or apart, ending in a summary of the ones it does not show.',
        framework: 'React',
        ...REACT_AVATAR_GROUP_DOCS.avatarGroup,
        tokens: REACT_AVATAR_GROUP_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { 'aria-label': 'Reviewers', layout: 'stack', max: 5, shape: 'circle', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <AvatarGroup {...args}>{members()}</AvatarGroup>
    </div>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">stack</span>
          <span className="slotted-demo-scene__note">
            Each member covers a fifth of the one before it, and the ring separating them is the
            surface the group stands on.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Reviewers, stacked">{members(5)}</AvatarGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">spread</span>
          <span className="slotted-demo-scene__note">
            Laid apart on a step of the space scale, and wrapping, because a row of eight faces at
            420 pixels has to go somewhere.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Attendees" layout="spread" max={false}>
            {members()}
          </AvatarGroup>
        </div>
      </section>
    </div>
  ),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Within the limit</span>
          <span className="slotted-demo-scene__note">
            Nothing is summarized: a +1 beside four faces is one more circle than showing the fifth.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Five reviewers">{members(5)}</AvatarGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Above it</span>
          <span className="slotted-demo-scene__note">
            max counts the discs, the summary included, so a limit of five never draws six. The
            summary is called by the names it stands for — inspect it with a screen reader.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Seven reviewers">{members()}</AvatarGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Three of forty</span>
          <span className="slotted-demo-scene__note">
            The page renders three and knows there are forty. It knows three names, so it names none
            of them and takes the label the page supplies.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Attendees" overflowLabel="37 more attendees" total={40}>
            {members(3)}
          </AvatarGroup>
        </div>
      </section>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-measure">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <div className="slotted-demo-row" key={size}>
          <AvatarGroup aria-label={`Reviewers, ${size}`} size={size}>
            {members()}
          </AvatarGroup>
        </div>
      ))}
      <p>
        The group states the size it lays out at, because the overlap is a fraction of a member’s
        box and no child can compute that for its parent. A member that states its own size still
        wins.
      </p>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Members that open a profile</span>
          <span className="slotted-demo-scene__note">
            Tab through them: the member under the caret rises, so its focus ring is never
            half-hidden under the next avatar.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Assignees">
            {PEOPLE.slice(0, 6).map((person) => (
              <Avatar
                key={person.name}
                name={person.name}
                render={(props) => <a {...props} href="#profile" />}
                src={person.src}
              />
            ))}
          </AvatarGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">On a sunken row</span>
          <span className="slotted-demo-scene__note">
            The ring is a color, not a boolean, so a group inside a card or a colored row is still a
            row of separate faces.
          </span>
        </header>
        <div
          className="slotted-demo-stage"
          style={{
            background: 'var(--slotted-surface-sunken)',
            padding: 'var(--slotted-space-5)',
          }}
        >
          <AvatarGroup
            aria-label="Reviewers on a sunken row"
            style={
              { '--slotted-avatar-ring-color': 'var(--slotted-surface-sunken)' } as CSSProperties
            }
          >
            {members()}
          </AvatarGroup>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Squares, for workspaces</span>
        </header>
        <div className="slotted-demo-stage">
          <AvatarGroup aria-label="Workspaces" shape="square" variant="solid">
            <Avatar name="Acme Inc" />
            <Avatar name="Beacon Labs" />
            <Avatar name="Cinder Co" />
          </AvatarGroup>
        </div>
      </section>
    </div>
  ),
};

export const Extremes: Story = {
  parameters: scenario('extremes'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <AvatarGroup aria-label="A hundred and four reviewers" size="sm" total={104}>
          {members(5)}
        </AvatarGroup>
      </div>
      <div className="slotted-demo-row">
        <AvatarGroup aria-label="A group of one">{members(1)}</AvatarGroup>
      </div>
      <div className="slotted-demo-row">
        <AvatarGroup aria-label="A group with a deactivated member">
          <Avatar name="Ada Lovelace" />
          <Avatar disabled name="Grace Hopper" />
          <Avatar name="Alan Turing" />
        </AvatarGroup>
      </div>
      <div className="slotted-demo-row">
        <AvatarGroup aria-label="An empty group" />
      </div>
      <p>
        A three-figure summary, a group of one that summarizes nothing, a deactivated member that
        does not rise on hover, and an empty group that takes no room at all — so a row built from a
        permission filter does not leave a gap nobody can see in the markup.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <AvatarGroup aria-label="Reviewers" locale="pt-BR">
          {members()}
        </AvatarGroup>
      </div>
      <p>
        A list of five, named “Reviewers”, with a summary called by the names it stands for — joined
        with <code>Intl.ListFormat</code> for the locale, so it reads “Barbara Liskov, Donald Knuth
        e Margaret Hamilton” here. No English string is shipped to make it, which is what every
        surveyed implementation does instead.
      </p>
    </div>
  ),
};
