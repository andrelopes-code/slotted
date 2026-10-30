import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlAvatar } from './avatar';
import type { AvatarShape, AvatarSize, AvatarTone, AvatarVariant } from './avatar';
import { SlAvatarFallback } from './avatar-fallback';
import { SlAvatarImage } from './avatar-image';
import { ANGULAR_AVATAR_DOCS, ANGULAR_AVATAR_TOKENS } from './avatar.docs';

interface AvatarStoryArgs {
  name: string;
  shape: AvatarShape;
  size: AvatarSize;
  tone: AvatarTone;
  variant: AvatarVariant;
}

const portrait = () => `https://i.pravatar.cc/128?random=${Math.random()}`;
const ADA = portrait();
const GRACE = portrait();
const MISSING = '/there-is-no-such-picture.png';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const TONES = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS = ['soft', 'solid'];
const PEOPLE = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Barbara Liskov',
  'Donald Knuth',
];

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${body}</div>
  </section>`;

const IMPORTS = [SlAvatar, SlAvatarFallback, SlAvatarImage];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<AvatarStoryArgs> = {
  title: 'Components/Avatar',
  component: SlAvatar,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Avatar',
        description:
          'A picture of a person or an entity, and what stands in when there is none: the initials taken from the name, then a glyph the family owns.',
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
  args: { name: 'Ada Lovelace', shape: 'circle', size: 'lg', tone: 'auto', variant: 'soft' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, picture: ADA },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar [name]="name" [size]="size" [shape]="shape" [tone]="tone" [variant]="variant"></span>
    <span slAvatar [name]="name" [size]="size" [shape]="shape" [tone]="tone" [variant]="variant" [src]="picture"></span>
  </div>
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { picture: ADA },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Five steps',
    'Every one of them answers density: switch the toolbar to dense and the row shrinks with the controls beside it.',
    `<div class="slotted-demo-row">${SIZES.map(
      (size) => `<span slAvatar name="Ada Lovelace" size="${size}"></span>`,
    ).join('')}</div>
     <div class="slotted-demo-row">${SIZES.map(
       (size) => `<span slAvatar name="Ada Lovelace" size="${size}" [src]="picture"></span>`,
     ).join('')}</div>`,
  )}
  ${scene(
    'A size no step holds',
    'The profile header wants 96 pixels, which is one custom property rather than a sixth step no theme could retune.',
    `<span slAvatar name="Ada Lovelace" [src]="picture" style="--slotted-avatar-size: 6rem"></span>`,
  )}
</div>`,
  }),
};

export const Fallback: Story = {
  parameters: scenario('fallback'),
  render: () => ({
    props: { picture: ADA, missing: MISSING },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'The picture',
    'It crosses over the letters as it arrives.',
    `<span slAvatar name="Ada Lovelace" size="lg" [src]="picture"></span>`,
  )}
  ${scene(
    'The initials',
    'Derived from the name, and never a broken image when the request fails.',
    `<span slAvatar name="Grace Hopper" size="lg" [src]="missing"></span>`,
  )}
  ${scene(
    'The glyph',
    'An unassigned ticket has no name, so there are no initials to write.',
    `<span slAvatar size="lg"></span>`,
  )}
</div>`,
  }),
};

export const Identity: Story = {
  parameters: scenario('identity'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Derived from the name',
    'The same person keeps the same color in a list that is re-sorted and a table that is paged. Five tones mean collisions are certain: the color is an aid to scanning, and the name is the identifier.',
    `<div class="slotted-demo-row">${PEOPLE.map(
      (name) => `<span slAvatar name="${name}"></span>`,
    ).join('')}</div>`,
  )}
  ${scene(
    'Stated, and painted two ways',
    'soft tints and keeps the tone edge; solid fills.',
    VARIANTS.map(
      (variant) =>
        `<div class="slotted-demo-row">${TONES.map(
          (tone) =>
            `<span slAvatar name="Ada Lovelace" tone="${tone}" variant="${variant}"></span>`,
        ).join('')}</div>`,
    ).join(''),
  )}
  ${scene(
    'Names that are not two Latin words',
    'Segmented by grapheme and upper-cased for the locale: a surrogate pair is one letter, and Turkish i is İ. A word is skipped over whatever it opens with, and what a name carries in brackets — a pronoun set, a role, an address — is not read as a name.',
    `<div class="slotted-demo-row">
      <span slAvatar name="山田 太郎"></span>
      <span slAvatar name="Ада Лавлейс"></span>
      <span slAvatar name="محمد صلاح"></span>
      <span slAvatar name="işık ışık" locale="tr"></span>
      <span slAvatar name="ada.lovelace@example.com"></span>
      <span slAvatar name="Ada Lovelace (she/her)"></span>
      <span slAvatar name="Prince"></span>
    </div>`,
  )}
</div>`,
  }),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    props: { picture: ADA },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar name="Ada Lovelace" size="lg" [src]="picture"></span>
    <span slAvatar name="Acme Inc" shape="square" size="lg" tone="accent" variant="solid"></span>
    <span slAvatar name="Release bot" shape="square" size="lg"></span>
  </div>
  <p>
    A circle is a person and a square is a team, an organization or a bot — Primer's rule, taken
    with its meaning. The corner is a sixth of the box, so it is the same shape at every step.
  </p>
</div>`,
  }),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    props: { picture: ADA, missing: MISSING },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar name="Ada Lovelace" size="lg" status="idle"></span>
    <span slAvatar name="Ada Lovelace" size="lg" status="loading" [src]="picture"></span>
    <span slAvatar name="Ada Lovelace" size="lg" status="loaded" [src]="picture"></span>
    <span slAvatar name="Ada Lovelace" size="lg" status="error" [src]="missing"></span>
    <span slAvatar name="Ada Lovelace" size="lg" status="loaded" disabled [src]="picture"></span>
  </div>
  <p>
    Four statuses, because a boolean cannot say whether the picture failed, is still coming, or was
    never asked for. They are written here to hold the page still; ordinarily the component derives
    them, reports them through <code>(statusChange)</code>, and lets a status you pass win over the
    derivation.
  </p>
</div>`,
  }),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => ({
    props: { ada: ADA, grace: GRACE },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <a slAvatar name="Ada Lovelace" href="#profile" [src]="ada"></a>
    <button slAvatar type="button" name="Grace Hopper" [src]="grace"></button>
    <a slAvatar name="Alan Turing" href="#profile" size="xs"></a>
    <button slAvatar type="button" name="Barbara Liskov" disabled></button>
  </div>
  <p>
    Tab through the row. The component is written on the element the page chose, so each of these
    keeps the platform's own behavior. An avatar paints nothing at rest; it paints the focus ring
    and the hover edge only where the browser treats it as interactive, and holds both back when it
    is disabled. The extra-small link grows its hit area to the WCAG minimum without moving
    anything.
  </p>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { picture: ADA },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slAvatar name="Ada Lovelace" size="lg" [src]="picture"></span>
    <span slAvatar name="Ada Lovelace" size="lg" decorative [src]="picture"></span>
    <span slAvatar size="lg"></span>
  </div>
  <p>
    The first announces “Ada Lovelace”, in every one of the four statuses: the name is on the root
    and the picture takes an empty <code>alt</code>, so it does not become “AL” while the photograph
    is on its way. The second is <code>decorative</code> — the name is written beside it, and
    announcing it would read the person twice. The third has no name at all and is therefore
    <code>aria-hidden</code>, which is the rule Icon already takes.
  </p>
</div>`,
  }),
};
