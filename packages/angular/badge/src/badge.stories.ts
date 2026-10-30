import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheck, lucideChevronDown } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlAvatar } from '../../avatar/src/avatar';
import { SlButton } from '../../button/src/button';
import { SlIconButton } from '../../button/src/icon-button';
import { SlInline } from '../../inline/src/inline';
import { SlHeading } from '../../typography/src/heading';
import { SlText } from '../../typography/src/text';
import { SlVisuallyHidden } from '../../visually-hidden/src/visually-hidden';
import { SlBadge } from './badge';
import type { BadgeShape, BadgeSize, BadgeTone, BadgeVariant } from './badge';
import { SlBadgeAnchor } from './badge-anchor';
import { SlBadgeEnd, SlBadgeStart } from './badge-content';
import { provideBadgeDefaults } from './badge-defaults';
import { ANGULAR_BADGE_DOCS, ANGULAR_BADGE_TOKENS } from './badge.docs';

interface BadgeStoryArgs {
  content: string;
  shape: BadgeShape;
  size: BadgeSize;
  tone: BadgeTone;
  variant: BadgeVariant;
}

const TONES = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS = ['solid', 'soft', 'outline'];
const SIZES = ['sm', 'md', 'lg'];
const PLACEMENTS = ['top-end', 'top-start', 'bottom-end', 'bottom-start'];
const LOCALES = ['en-US', 'de-DE', 'fr-FR', 'ar-EG'];

/** The artwork belongs to the consumer, and it is Lucide's: a character is never an icon. */
const glyph = (name: string) => `<ng-icon aria-hidden="true" name="${name}"></ng-icon>`;
const CHECK = glyph('lucideCheck');
const BELL = glyph('lucideBell');
const CHEVRON = glyph('lucideChevronDown');

/** A round host, so the circular overlap has something to sit on. */
const AVATAR = [
  'align-items: center',
  'background: var(--slotted-tone-accent-surface)',
  'block-size: 2.5rem',
  'border-radius: var(--slotted-radius-full)',
  'color: var(--slotted-tone-accent-text)',
  'display: inline-flex',
  'font-weight: 600',
  'inline-size: 2.5rem',
  'justify-content: center',
].join('; ');

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${body}</div>
  </section>`;

const IMPORTS = [
  NgIcon,
  SlAvatar,
  SlBadge,
  SlBadgeAnchor,
  SlBadgeEnd,
  SlBadgeStart,
  SlButton,
  SlIconButton,
  SlInline,
  SlHeading,
  SlText,
  SlVisuallyHidden,
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta: Meta<BadgeStoryArgs> = {
  title: 'Components/Badge',
  component: SlBadge,
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [provideIcons({ lucideBell, lucideCheck, lucideChevronDown })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Badge',
        description:
          'A count, a status or a short piece of metadata — in the flow, or on the corner of something else.',
        framework: 'Angular',
        ...ANGULAR_BADGE_DOCS.badge,
        tokens: ANGULAR_BADGE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

export const Playground: Story = {
  args: { content: 'Pending', shape: 'pill', size: 'md', tone: 'warning', variant: 'soft' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slBadge [tone]="tone" [variant]="variant" [size]="size" [shape]="shape">{{ content }}</span>
  </div>
</div>`,
  }),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${VARIANTS.map((variant) =>
    scene(
      variant,
      'All three paint the same tone edge; only the ground changes.',
      `<div class="slotted-demo-row">${TONES.map(
        (tone) => `<span slBadge tone="${tone}" variant="${variant}">${tone}</span>`,
      ).join('')}</div>`,
    ),
  ).join('')}
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Three steps',
    'The box is the badge’s own line box plus its inset, so no size can clip its type.',
    `<div class="slotted-demo-row">${SIZES.map(
      (size) => `<span slBadge tone="success" size="${size}">Paid</span>`,
    ).join('')}</div>`,
  )}
  ${scene(
    'With a glyph',
    '<code>slBadgeStart</code> and <code>slBadgeEnd</code> put a glyph on either side of the words.',
    `<div class="slotted-demo-row">${SIZES.map(
      (size) =>
        `<span slBadge tone="accent" variant="solid" size="${size}"><span slBadgeStart>${CHECK}</span>Verified</span>`,
    ).join('')}</div>`,
  )}
  ${scene(
    'Density',
    'Type and glyph read the control scale, so a badge shrinks with the controls beside it. Change the density in the toolbar.',
    `<div class="slotted-demo-row">
      <span slBadge>Draft</span>
      <span slBadge tone="danger" variant="solid" [count]="8"></span>
      <span slBadge tone="accent" variant="outline">Sort<span slBadgeEnd>${CHEVRON}</span></span>
    </div>`,
  )}
</div>`,
  }),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Pill, square, dot',
    'A one-figure pill is as round as its own inset allows; a dot draws no value at all.',
    `<div class="slotted-demo-row">
      <span slBadge tone="accent" variant="solid" shape="pill">7</span>
      <span slBadge tone="accent" variant="solid" shape="square">7</span>
      <span slBadge tone="accent" variant="solid" shape="dot"><span slVisuallyHidden>Live</span></span>
    </div>`,
  )}
  ${scene(
    'The words a dot cannot say',
    'Colour alone is not a signal. The hidden text is out of flow, so it costs no space.',
    `<div class="slotted-demo-row">
      ${[
        ['success', 'solid', 'Deployed'],
        ['warning', 'solid', 'Building'],
        ['danger', 'solid', 'Offline'],
        ['secondary', 'outline', 'Queued'],
      ]
        .map(
          ([tone, variant, label]) =>
            `<div slInline align="center" [gap]="3">
              <span slBadge tone="${tone}" variant="${variant}" shape="dot"><span slVisuallyHidden>${label}</span></span>
              <span slText>${label}</span>
            </div>`,
        )
        .join('')}
    </div>`,
  )}
</div>`,
  }),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'The ceiling',
    'Above <code>max</code> the badge shows the ceiling and a plus; <code>[max]="false"</code> shows the real total.',
    `<div class="slotted-demo-row">
      ${[1, 8, 42, 99, 140]
        .map((count) => `<span slBadge tone="danger" variant="solid" [count]="${count}"></span>`)
        .join('')}
      <span slBadge tone="danger" variant="solid" [count]="140" [max]="999"></span>
      <span slBadge [count]="1234" [max]="false"></span>
    </div>`,
  )}
  ${scene(
    'Nought',
    'A count of nought takes the badge out of the page. <code>showZero</code> is for the screens where nought is a value.',
    `<div class="slotted-demo-row">
      <div slInline align="center" [gap]="3">
        <span slBadge tone="danger" variant="solid" [count]="0"></span>
        <span slText>nothing rendered</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge [count]="0" showZero></span>
        <span slText>nought as a value</span>
      </div>
    </div>`,
  )}
  ${scene(
    'The digits the locale writes',
    '<code>Intl.NumberFormat</code>, not string interpolation.',
    `<div class="slotted-demo-row">
      ${LOCALES.map(
        (locale) =>
          `<div slInline align="center" [gap]="3">
            <span slBadge tone="accent" locale="${locale}" [count]="1234" [max]="false"></span>
            <span slText size="sm" tone="muted">${locale}</span>
          </div>`,
      ).join('')}
    </div>`,
  )}
</div>`,
  }),
};

export const Anchored: Story = {
  parameters: scenario('anchored'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Four corners',
    '<code>placement</code> is logical, so every corner mirrors in a right-to-left document.',
    `<div class="slotted-demo-row" style="gap: var(--slotted-space-10)">
      ${PLACEMENTS.map(
        (placement) =>
          `<span slBadgeAnchor placement="${placement}">
            <button slButton type="button" tone="secondary" variant="outline">${placement}</button>
            <span slBadge tone="danger" variant="solid" size="sm" [count]="4"><span slVisuallyHidden>unread messages</span></span>
          </span>`,
      ).join('')}
    </div>`,
  )}
  ${scene(
    'A round host',
    '<code>overlap="circle"</code> moves the badge in from the corner far enough to meet the curve.',
    `<div class="slotted-demo-row" style="gap: var(--slotted-space-10)">
      <span slBadgeAnchor placement="bottom-end" overlap="circle">
        <span aria-hidden="true" style="${AVATAR}">AL</span>
        <span slBadge tone="success" variant="solid" size="sm" shape="dot"><span slVisuallyHidden>Online</span></span>
      </span>
      <span slBadgeAnchor overlap="circle">
        <span aria-hidden="true" style="${AVATAR}">AL</span>
        <span slBadge tone="danger" variant="solid" size="sm" [count]="140"><span slVisuallyHidden>unread messages</span></span>
      </span>
    </div>`,
  )}
  ${scene(
    'A corner the page corrects',
    '<code>offset</code> moves the badge off the computed corner, in pixels. <code>x</code> runs along the inline axis, so the correction mirrors with the document.',
    `<div class="slotted-demo-row" style="gap: var(--slotted-space-10)">
      <span slBadgeAnchor overlap="circle" [offset]="{ x: -2, y: 2 }">
        <span slAvatar name="Ada Lovelace" size="lg"></span>
        <span slBadge tone="success" variant="solid" size="sm" shape="dot"><span slVisuallyHidden>Online</span></span>
      </span>
      <span slBadgeAnchor [offset]="{ x: 0, y: 0 }">
        <button slIconButton type="button" tone="secondary" variant="outline" aria-label="Notifications">
          <ng-icon name="lucideBell" aria-hidden="true"></ng-icon>
        </button>
        <span slBadge tone="danger" variant="solid" size="sm" [count]="4"><span slVisuallyHidden>unread messages</span></span>
      </span>
    </div>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideBadgeDefaults({ locale: 'de-DE', max: 9, size: 'sm', variant: 'solid' })],
    }),
  ],
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'In a heading and in a row',
    'A badge is phrasing content, so it is legal wherever text is.',
    `<div slInline align="center" [gap]="4">
      <h3 slHeading [level]="3">Invoice #4821</h3>
      <span slBadge tone="warning" variant="soft" size="md">Pending</span>
    </div>
    <table style="border-collapse: collapse; inline-size: 100%; text-align: start">
      <tbody>
        <tr>
          <td style="padding-block: var(--slotted-space-3)">Auth service</td>
          <td style="padding-block: var(--slotted-space-3)"><span slBadge tone="success" variant="soft">Healthy</span></td>
        </tr>
        <tr>
          <td style="padding-block: var(--slotted-space-3)">Billing worker</td>
          <td style="padding-block: var(--slotted-space-3)"><span slBadge tone="danger" variant="soft">Failing</span></td>
        </tr>
      </tbody>
    </table>`,
  )}
  ${scene(
    'A badge that navigates',
    'The directive is written on the anchor. The family paints the focus ring and never paints hover: a badge is not a command.',
    `<div class="slotted-demo-row">
      <a slBadge tone="accent" variant="outline" size="md" href="#releases">v4.2.0</a>
    </div>`,
  )}
  ${scene(
    'One decision for the application',
    '<code>provideBadgeDefaults</code> is set on this page: <code>size="sm"</code>, <code>variant="solid"</code>, <code>max=9</code> and <code>locale="de-DE"</code>. An explicit input still wins.',
    `<div class="slotted-demo-row">
      <span slBadge tone="accent">Beta</span>
      <span slBadge tone="danger" [count]="40"></span>
      <span slBadge [count]="1234" [max]="false"></span>
      <span slBadge tone="success" variant="soft" size="lg">Explicit wins</span>
    </div>`,
  )}
  ${scene(
    'Extreme content',
    'A badge is one line. Too long a string is clipped, not reflowed — the whole value stays in the DOM.',
    `<div class="slotted-demo-row" style="max-inline-size: 15rem">
      <span slBadge size="md" variant="soft">Awaiting finance approval since 14 March</span>
      <span slBadge size="md" variant="outline" tone="danger">Kontostandsüberprüfungsverfahren</span>
    </div>`,
  )}
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Naming the host',
    'The frame does not rewrite its host. Wire <code>aria-describedby</code> to the badge’s own id, or put the count in the host’s <code>aria-label</code>.',
    `<div class="slotted-demo-row" style="gap: var(--slotted-space-10)">
      <span slBadgeAnchor>
        <button slButton type="button" tone="secondary" variant="outline" aria-describedby="badge-inbox-count">Inbox</button>
        <span id="badge-inbox-count" slBadge tone="danger" variant="solid" size="sm" [count]="4"><span slVisuallyHidden>unread messages</span></span>
      </span>
      <span slBadgeAnchor>
        <button slIconButton type="button" aria-label="Notifications, 12 new">${BELL}</button>
        <span slBadge tone="danger" variant="solid" size="sm" [count]="12"></span>
      </span>
    </div>`,
  )}
  ${scene(
    'The announcement policy',
    '<code>live</code> is <code>off</code> by default. <code>polite</code> writes <code>role="status"</code>, <code>assertive</code> writes <code>role="alert"</code>.',
    `<div class="slotted-demo-row">
      <div slInline align="center" [gap]="3">
        <span slBadge tone="accent" variant="solid" live="polite" [count]="3"><span slVisuallyHidden>items in the queue</span></span>
        <span slText>polite</span>
      </div>
      <div slInline align="center" [gap]="3">
        <span slBadge tone="danger" variant="solid" live="assertive" [count]="3"><span slVisuallyHidden>failed jobs</span></span>
        <span slText>assertive</span>
      </div>
    </div>`,
  )}
</div>`,
  }),
};
