import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAvatar } from './avatar';
import type { AvatarSize } from './avatar';
import { SlAvatarFallback } from './avatar-fallback';
import { SlAvatarImage } from './avatar-image';
import { ANGULAR_AVATAR_DOCS, ANGULAR_AVATAR_TOKENS } from './avatar.docs';

const PORTRAIT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%231d4ed8'/><circle cx='32' cy='25' r='11' fill='%23dbeafe'/><path d='M9 64c3-14 11-20 23-20s20 6 23 20z' fill='%23dbeafe'/></svg>";

interface AvatarStoryArgs {
  portrait: string;
  size: AvatarSize;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<AvatarStoryArgs> = {
  title: 'Components/Avatar',
  component: SlAvatar,
  decorators: [moduleMetadata({ imports: [SlAvatar, SlAvatarFallback, SlAvatarImage] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Avatar',
        description: 'A picture of a person or an entity, and what stands in when there is none.',
        framework: 'Angular',
        ...ANGULAR_AVATAR_DOCS.avatar,
        tokens: ANGULAR_AVATAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AvatarStoryArgs>;

export const Playground: Story = {
  args: { portrait: PORTRAIT, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar [size]="size">
      <img slAvatarImage alt="Ada Lovelace" [src]="portrait" />
      <span slAvatarFallback>AL</span>
    </span>
  </div>
</div>`,
  }),
};

const sizeScene = (size: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${size}</span>
      <span class="slotted-demo-scene__note">The type in the fallback scales with the frame.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        <span slAvatar size="${size}">
          <img slAvatarImage alt="Ada Lovelace" [src]="portrait" />
          <span slAvatarFallback>AL</span>
        </span>
        <span slAvatar size="${size}"><span slAvatarFallback>AL</span></span>
      </div>
    </div>
  </section>`;

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { portrait: PORTRAIT },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${sizeScene('sm')}
  ${sizeScene('md')}
  ${sizeScene('lg')}
</div>`,
  }),
};

export const Fallback: Story = {
  parameters: scenario('fallback'),
  render: () => ({
    props: { portrait: PORTRAIT },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Picture arrives</span>
      <span class="slotted-demo-scene__note">The fallback leaves the document.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slAvatar>
        <img slAvatarImage alt="Ada Lovelace" [src]="portrait" />
        <span slAvatarFallback>AL</span>
      </span>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Picture fails</span>
      <span class="slotted-demo-scene__note">Initials stand in, and nothing flashes.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slAvatar>
        <img slAvatarImage alt="Grace Hopper" src="/there-is-no-such-picture.png" />
        <span slAvatarFallback>GH</span>
      </span>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">No picture at all</span>
      <span class="slotted-demo-scene__note">The fallback is the whole component.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slAvatar><span slAvatarFallback>+7</span></span>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { portrait: PORTRAIT },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar size="lg">
      <img slAvatarImage alt="" [src]="portrait" />
      <span slAvatarFallback></span>
    </span>
    <div class="slotted-demo-stack">
      <strong>Ada Lovelace</strong>
      <span>Owner</span>
    </div>
  </div>
  <p>
    The picture takes an empty alt and the fallback is empty, because the name is written out
    beside it. Repeating it would make a screen reader read the same person twice.
  </p>
</div>`,
  }),
};
