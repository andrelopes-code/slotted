import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './avatar';
import { AvatarDefaultsProvider } from './avatar-defaults';
import { REACT_AVATAR_DOCS, REACT_AVATAR_TOKENS } from './avatar.docs';
import type { AvatarSize, AvatarTone, AvatarVariant } from './avatar.types';

const portrait = () => `https://i.pravatar.cc/128?random=${Math.random()}`;
const ADA = portrait();
const GRACE = portrait();
const MISSING = '/there-is-no-such-picture.png';

const SIZES: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const TONES: readonly Exclude<AvatarTone, 'auto'>[] = [
  'accent',
  'secondary',
  'success',
  'warning',
  'danger',
];
const VARIANTS: readonly AvatarVariant[] = ['soft', 'solid'];

const PEOPLE = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Barbara Liskov',
  'Donald Knuth',
];

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
        description:
          'A picture of a person or an entity, and what stands in when there is none: the initials taken from the name, then a glyph the family owns.',
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
  args: { name: 'Ada Lovelace', shape: 'circle', size: 'lg', tone: 'auto', variant: 'soft' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar {...args} />
        <Avatar {...args} src={ADA} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Five steps</span>
          <span className="slotted-demo-scene__note">
            Every one of them answers density: switch the toolbar to dense and the row shrinks with
            the controls beside it.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {SIZES.map((size) => (
              <Avatar key={size} name="Ada Lovelace" size={size} />
            ))}
          </div>
          <div className="slotted-demo-row">
            {SIZES.map((size) => (
              <Avatar key={size} name="Ada Lovelace" size={size} src={ADA} />
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A size no step holds</span>
          <span className="slotted-demo-scene__note">
            The profile header wants 96 pixels, which is one custom property rather than a sixth
            step no theme could retune.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar
            name="Ada Lovelace"
            src={ADA}
            style={{ '--slotted-avatar-size': '6rem' } as CSSProperties}
          />
        </div>
      </section>
    </div>
  ),
};

export const Fallback: Story = {
  parameters: scenario('fallback'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The picture</span>
          <span className="slotted-demo-scene__note">
            It crosses over the letters as it arrives.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar name="Ada Lovelace" size="lg" src={ADA} />
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The initials</span>
          <span className="slotted-demo-scene__note">
            Derived from the name, and never a broken image when the request fails.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar name="Grace Hopper" size="lg" src={MISSING} />
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The glyph</span>
          <span className="slotted-demo-scene__note">
            An unassigned ticket has no name, so there are no initials to write.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Avatar size="lg" />
        </div>
      </section>
    </div>
  ),
};

export const Identity: Story = {
  parameters: scenario('identity'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Derived from the name</span>
          <span className="slotted-demo-scene__note">
            The same person keeps the same colour in a list that is re-sorted and a table that is
            paged. Five tones mean collisions are certain: the colour is an aid to scanning, and the
            name is the identifier.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {PEOPLE.map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Stated, and painted two ways</span>
        </header>
        <div className="slotted-demo-stage">
          {VARIANTS.map((variant) => (
            <div className="slotted-demo-row" key={variant}>
              {TONES.map((tone) => (
                <Avatar key={tone} name="Ada Lovelace" tone={tone} variant={variant} />
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Names that are not two Latin words</span>
          <span className="slotted-demo-scene__note">
            Segmented by grapheme and upper-cased for the locale: a surrogate pair is one letter,
            and Turkish i is İ. A word is skipped over whatever it opens with, and what a name
            carries in brackets — a pronoun set, a role, an address — is not read as a name.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <Avatar name="山田 太郎" />
            <Avatar name="Ада Лавлейс" />
            <Avatar name="محمد صلاح" />
            <Avatar locale="tr" name="işık ışık" />
            <Avatar name="ada.lovelace@example.com" />
            <Avatar name="Ada Lovelace (she/her)" />
            <Avatar name="Prince" />
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar name="Ada Lovelace" size="lg" src={ADA} />
        <Avatar name="Acme Inc" shape="square" size="lg" tone="accent" variant="solid" />
        <Avatar name="Release bot" shape="square" size="lg" />
      </div>
      <p>
        A circle is a person and a square is a team, an organisation or a bot — Primer’s rule, taken
        with its meaning. The corner is a sixth of the box, so it is the same shape at every step.
      </p>
    </div>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar name="Ada Lovelace" size="lg" status="idle" />
        <Avatar name="Ada Lovelace" size="lg" src={ADA} status="loading" />
        <Avatar name="Ada Lovelace" size="lg" src={ADA} status="loaded" />
        <Avatar name="Ada Lovelace" size="lg" src={MISSING} status="error" />
        <Avatar disabled name="Ada Lovelace" size="lg" src={ADA} status="loaded" />
      </div>
      <p>
        Four statuses, because a boolean cannot say whether the picture failed, is still coming, or
        was never asked for. They are written here to hold the page still; ordinarily the family
        derives them, reports them through <code>onStatusChange</code>, and lets a status you pass
        win over the derivation.
      </p>
    </div>
  ),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Avatar
          name="Ada Lovelace"
          render={(props) => <a {...props} href="#profile" />}
          src={ADA}
        />
        <Avatar
          name="Grace Hopper"
          render={(props) => <button {...props} type="button" />}
          src={GRACE}
        />
        <Avatar name="Alan Turing" render={(props) => <a {...props} href="#profile" />} size="xs" />
        <Avatar
          disabled
          name="Barbara Liskov"
          render={(props) => <button {...props} disabled type="button" />}
        />
      </div>
      <p>
        Tab through the row. An avatar is not a command, so it paints nothing at rest; it paints the
        focus ring and the hover edge only on an element the browser itself treats as interactive,
        and holds both back when it is disabled. The extra-small link grows its hit area to the WCAG
        minimum without moving anything.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <AvatarDefaultsProvider size="lg">
          <Avatar name="Ada Lovelace" src={ADA} />
          <Avatar decorative name="Ada Lovelace" src={ADA} />
          <Avatar />
        </AvatarDefaultsProvider>
      </div>
      <p>
        The first announces “Ada Lovelace”, in every one of the four statuses: the name is on the
        root and the picture takes an empty <code>alt</code>, so it does not become “AL” while the
        photograph is on its way. The second is <code>decorative</code> — the name is written beside
        it, and announcing it would read the person twice. The third has no name at all and is
        therefore <code>aria-hidden</code>, which is the rule Icon already takes.
      </p>
    </div>
  ),
};
