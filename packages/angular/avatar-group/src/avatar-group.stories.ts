import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAvatar } from '../../avatar/src/avatar';
import type { AvatarGroupLayout, AvatarShape, AvatarSize } from '../../avatar/src/avatar';
import { SlAvatarGroup } from './avatar-group';
import { SlAvatarGroupItem } from './avatar-group-item';
import { ANGULAR_AVATAR_GROUP_DOCS, ANGULAR_AVATAR_GROUP_TOKENS } from './avatar-group.docs';

interface AvatarGroupStoryArgs {
  layout: AvatarGroupLayout;
  max: number;
  shape: AvatarShape;
  size: AvatarSize;
}

const portrait = () => `https://i.pravatar.cc/128?random=${Math.random()}`;

const PEOPLE = [
  { name: 'Ada Lovelace', src: portrait() },
  { name: 'Grace Hopper', src: portrait() },
  { name: 'Alan Turing', src: '' },
  { name: 'Katherine Johnson', src: portrait() },
  { name: 'Barbara Liskov', src: '' },
  { name: 'Donald Knuth', src: '' },
  { name: 'Margaret Hamilton', src: '' },
];

const members = (count = PEOPLE.length, extra = '') =>
  PEOPLE.slice(0, count)
    .map(
      (person) =>
        `<li slAvatarGroupItem><span slAvatar ${extra} name="${person.name}"${
          person.src === '' ? '' : ` src="${person.src}"`
        }></span></li>`,
    )
    .join('');

const links = (count: number) =>
  PEOPLE.slice(0, count)
    .map(
      (person) =>
        `<li slAvatarGroupItem><a slAvatar href="#profile" name="${person.name}"${
          person.src === '' ? '' : ` src="${person.src}"`
        }></a></li>`,
    )
    .join('');

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${body}</div>
  </section>`;

const IMPORTS = [SlAvatar, SlAvatarGroup, SlAvatarGroupItem];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Overflow as never,
});

const meta: Meta<AvatarGroupStoryArgs> = {
  title: 'Components/Avatar Group',
  component: SlAvatarGroup,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Avatar Group',
        description:
          'A list of faces, overlapped or apart, ending in a summary of the ones it does not show.',
        framework: 'Angular',
        ...ANGULAR_AVATAR_GROUP_DOCS.avatarGroup,
        tokens: ANGULAR_AVATAR_GROUP_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AvatarGroupStoryArgs>;

export const Playground: Story = {
  args: { layout: 'stack', max: 5, shape: 'circle', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <ul slAvatarGroup aria-label="Reviewers" [layout]="layout" [max]="max" [shape]="shape" [size]="size">
    ${members()}
  </ul>
</div>`,
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'stack',
    'Each member covers a fifth of the one before it, and the ring separating them is the surface the group stands on.',
    `<ul slAvatarGroup aria-label="Reviewers, stacked">${members(5)}</ul>`,
  )}
  ${scene(
    'spread',
    'Laid apart on a step of the space scale, and wrapping, because a row of eight faces at 420 pixels has to go somewhere.',
    `<ul slAvatarGroup aria-label="Attendees" layout="spread" [max]="false">${members()}</ul>`,
  )}
</div>`,
  }),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Within the limit',
    'Nothing is summarized: a +1 beside four faces is one more circle than showing the fifth.',
    `<ul slAvatarGroup aria-label="Five reviewers">${members(5)}</ul>`,
  )}
  ${scene(
    'Above it',
    'max counts the discs, the summary included, so a limit of five never draws six. The summary is called by the names it stands for — inspect it with a screen reader.',
    `<ul slAvatarGroup aria-label="Seven reviewers">${members()}</ul>`,
  )}
  ${scene(
    'Three of forty',
    'The page renders three and knows there are forty. It knows three names, so it names none of them and takes the label the page supplies.',
    `<ul slAvatarGroup aria-label="Attendees" [total]="40" overflowLabel="37 more attendees">${members(3)}</ul>`,
  )}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  ${['xs', 'sm', 'md', 'lg', 'xl']
    .map(
      (size) =>
        `<div class="slotted-demo-row"><ul slAvatarGroup aria-label="Reviewers, ${size}" size="${size}">${members()}</ul></div>`,
    )
    .join('')}
  <p>
    The group states the size it lays out at, because the overlap is a fraction of a member's box
    and no child can compute that for its parent. A member that states its own size still wins.
  </p>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Members that open a profile',
    'Tab through them: the member under the caret rises, so its focus ring is never half-hidden under the next avatar.',
    `<ul slAvatarGroup aria-label="Assignees">${links(6)}</ul>`,
  )}
  ${scene(
    'On a sunken row',
    'The ring is a color, not a boolean, so a group inside a card or a colored row is still a row of separate faces.',
    `<div style="background: var(--slotted-surface-sunken); padding: var(--slotted-space-5)">
       <ul slAvatarGroup aria-label="Reviewers on a sunken row" style="--slotted-avatar-ring-color: var(--slotted-surface-sunken)">${members()}</ul>
     </div>`,
  )}
  ${scene(
    'Squares, for workspaces',
    'The group decides the shape once; a member that states its own still wins.',
    `<ul slAvatarGroup aria-label="Workspaces" shape="square" variant="solid">
       <li slAvatarGroupItem><span slAvatar name="Acme Inc"></span></li>
       <li slAvatarGroupItem><span slAvatar name="Beacon Labs"></span></li>
       <li slAvatarGroupItem><span slAvatar name="Cinder Co"></span></li>
     </ul>`,
  )}
</div>`,
  }),
};

export const Extremes: Story = {
  parameters: scenario('extremes'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <ul slAvatarGroup aria-label="A hundred and four reviewers" size="sm" [total]="104">${members(5)}</ul>
  </div>
  <div class="slotted-demo-row">
    <ul slAvatarGroup aria-label="A group of one">${members(1)}</ul>
  </div>
  <div class="slotted-demo-row">
    <ul slAvatarGroup aria-label="A group with a deactivated member">
      <li slAvatarGroupItem><span slAvatar name="Ada Lovelace"></span></li>
      <li slAvatarGroupItem><span slAvatar name="Grace Hopper" disabled></span></li>
      <li slAvatarGroupItem><span slAvatar name="Alan Turing"></span></li>
    </ul>
  </div>
  <div class="slotted-demo-row">
    <ul slAvatarGroup aria-label="An empty group"></ul>
  </div>
  <p>
    A three-figure summary, a group of one that summarizes nothing, a deactivated member that does
    not rise on hover, and an empty group that takes no room at all — so a row built from a
    permission filter does not leave a gap nobody can see in the markup.
  </p>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <ul slAvatarGroup aria-label="Reviewers" locale="pt-BR">${members()}</ul>
  </div>
  <p>
    A list of five, named “Reviewers”, with a summary called by the names it stands for — joined
    with <code>Intl.ListFormat</code> for the locale, so it reads “Barbara Liskov, Donald Knuth e
    Margaret Hamilton” here. No English string is shipped to make it, which is what every surveyed
    implementation does instead.
  </p>
</div>`,
  }),
};
