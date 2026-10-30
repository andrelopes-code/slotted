import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge, SlBadgeAnchor } from '@slotted/angular/badge';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

import { provideStatusIndicatorDefaults } from './status-indicator-defaults';
import { SlStatusIndicator, SlStatusIndicatorDetail } from './status-indicator';
import {
  ANGULAR_STATUS_INDICATOR_DOCS,
  ANGULAR_STATUS_INDICATOR_TOKENS,
} from './status-indicator.docs';
import type {
  StatusIndicatorLive,
  StatusIndicatorMark,
  StatusIndicatorSize,
  StatusIndicatorStatus,
} from './status-indicator.constants';

interface StatusIndicatorStoryArgs {
  live: StatusIndicatorLive;
  mark: StatusIndicatorMark;
  pulse: boolean;
  size: StatusIndicatorSize;
  status: StatusIndicatorStatus;
}

const STATUSES: readonly { status: StatusIndicatorStatus; words: string }[] = [
  { status: 'neutral', words: 'Draft' },
  { status: 'info', words: 'Live' },
  { status: 'success', words: 'Healthy' },
  { status: 'warning', words: 'Degraded' },
  { status: 'danger', words: 'Failed' },
  { status: 'unknown', words: 'No data' },
];

const SIZES: readonly StatusIndicatorSize[] = ['sm', 'md', 'lg'];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_STATUS_INDICATOR_DOCS.statusIndicator.scenes, {
    playground: Playground,
    statuses: Statuses,
    marks: Marks,
    sizes: Sizes,
    pulse: Pulse,
    announcements: Announcements,
    context: Context,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<StatusIndicatorStoryArgs> = {
  title: 'Components/StatusIndicator',
  component: SlStatusIndicator,
  decorators: [
    moduleMetadata({
      imports: [
        SlAvatar,
        SlBadge,
        SlBadgeAnchor,
        SlHeading,
        SlStatusIndicator,
        SlStatusIndicatorDetail,
        SlText,
        SlVisuallyHidden,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Status Indicator',
        description:
          'The operational state of something the application observes: a mark, the word it stands for, and a name a reader always hears.',
        framework: 'Angular',
        ...ANGULAR_STATUS_INDICATOR_DOCS.statusIndicator,
        tokens: ANGULAR_STATUS_INDICATOR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StatusIndicatorStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** An indicator beside the words a screen reader reads out for it. */
const heard = (indicator: string, says: string) =>
  `<div>${indicator}</div><span slText size="sm" tone="muted">${says}</span>`;

/** A row of a service table: the name takes the room, the status takes the end. */
const row = (service: string, indicator: string) =>
  `<span slText>${service}</span><div>${indicator}</div>`;

export const Playground: Story = {
  args: {
    live: 'off',
    mark: 'dot',
    pulse: false,
    size: 'md',
    status: 'success',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="prose">
        <p slText>The checkout service is <span slStatusIndicator [status]="status" [mark]="mark" [size]="size" [live]="live" [pulse]="pulse">Healthy</span> and has been since the deploy at 09:14. A status is only ever as legible as the row it interrupts, which is why this one is written inside a sentence.</p>
      </div>`,
  }),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The six, and what a product calls them',
        'Each maps onto one of the library’s five tones. The words are the product’s; the tone and the glyph are the family’s.',
        `<div class="slotted-demo-rows">${STATUSES.map(({ status, words }) =>
          row(status, `<span slStatusIndicator status="${status}">${words}</span>`),
        ).join('')}</div>`,
      ) +
        scene(
          'The two that share a tone',
          'neutral is filled and unknown is a dashed ring as wide as a lit dot, so “nothing is happening” and “nobody knows” are never told apart by color alone.',
          `<span slStatusIndicator status="neutral">Draft — nothing has started</span>` +
            `<span slStatusIndicator status="unknown">No data — the agent stopped reporting</span>` +
            `<span slStatusIndicator status="neutral" mark="icon">Draft — nothing has started</span>` +
            `<span slStatusIndicator status="unknown" mark="icon">No data — the agent stopped reporting</span>`,
        ),
    ),
  }),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => ({
    template: grid(
      2,
      scene(
        'dot',
        'The compact mark: one cap tall, so it is the height of the letters beside it at every size and every density.',
        STATUSES.map(
          ({ status, words }) => `<span slStatusIndicator status="${status}">${words}</span>`,
        ).join(''),
      ) +
        scene(
          'icon',
          'Six circles, the glyphs alert and toast draw for the same tones. The silhouette is what still separates the six when the color is gone — in grayscale, in high contrast, and under forced colors.',
          STATUSES.map(
            ({ status, words }) =>
              `<span slStatusIndicator status="${status}" mark="icon">${words}</span>`,
          ).join(''),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps',
        'Type from the control type scale and glyph from the control glyph scale, so a status shrinks with the controls it sits among when density changes.',
        SIZES.map(
          (size) =>
            `<span slStatusIndicator status="success" size="${size}">Healthy · ${size}</span>`,
        ).join('') +
          SIZES.map(
            (size) =>
              `<span slStatusIndicator status="warning" mark="icon" size="${size}">Degraded · ${size}</span>`,
          ).join(''),
      ) +
        scene(
          'sm, which is what a table wants',
          'The step a dense row is built for: the indicator takes the row’s own height rather than pushing it taller, and the mark still clears its contrast.',
          `<div class="slotted-demo-rows">` +
            row(
              'checkout-api',
              `<span slStatusIndicator status="success" size="sm">Healthy</span>`,
            ) +
            row(
              'payments-worker',
              `<span slStatusIndicator status="warning" size="sm">Degraded</span>`,
            ) +
            row(
              'legacy-billing',
              `<span slStatusIndicator status="unknown" size="sm">No data</span>`,
            ) +
            `</div>`,
        ),
    ),
  }),
};

export const Pulse: Story = {
  parameters: scenario('pulse'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A value moving while the reader watches',
        'A wave leaves the dot and fades, then rests before the next beat. An icon mark does not pulse. It is an enhancement: the tone, the glyph and the word have already said what the status is.',
        `<span slStatusIndicator status="info" pulse>Deploying to production</span>` +
          `<span slStatusIndicator status="danger" pulse>Error rate climbing</span>` +
          `<span slStatusIndicator status="warning" pulse>Certificate expiring today</span>`,
      ) +
        scene(
          'What it is not for',
          'A status that settled last week does not pulse. Motion that repeats forever and carries no news is the thing reduced motion exists to stop, and this family stops it either way.',
          `<span slStatusIndicator status="success">Healthy since Tuesday</span>` +
            `<span slStatusIndicator status="neutral">Draft, unchanged</span>`,
        ),
    ),
  }),
};

export const Announcements: Story = {
  parameters: scenario('announcements'),
  render: () => ({
    template: grid(
      3,
      scene(
        'live="off"',
        'The default, and the right answer for a status that was already on the page. Shoelace makes every badge a live region and announces text nobody changed.',
        `<span slStatusIndicator status="success">Healthy</span>` +
          `<span slText size="sm" tone="muted">No role at all in the DOM</span>`,
      ) +
        scene(
          'live="polite"',
          'role="status": an implicit aria-atomic means the mark and its word are announced together, once, when the reader is next idle.',
          `<span slStatusIndicator status="info" live="polite">Deploying</span>` +
            `<span slText size="sm" tone="muted">role="status" on the root</span>`,
        ) +
        scene(
          'live="assertive"',
          'role="alert", which interrupts whatever is being read. It belongs to something the reader has to act on now, and to nothing else.',
          `<span slStatusIndicator status="danger" live="assertive">Region offline</span>` +
            `<span slText size="sm" tone="muted">role="alert" on the root</span>`,
        ),
    ),
  }),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A column of services',
        'The words take the page’s own color and the tone stays on the mark, so the status column reads as easily as the column of names beside it.',
        `<div class="slotted-demo-rows">` +
          row('checkout-api', `<span slStatusIndicator status="success" size="sm">Healthy</span>`) +
          row(
            'payments-worker',
            `<span slStatusIndicator status="warning" size="sm">Degraded</span>`,
          ) +
          row(
            'search-index',
            `<span slStatusIndicator status="info" size="sm" pulse>Reindexing<span slStatusIndicatorDetail>62% · 4 min left</span></span>`,
          ) +
          row(
            'legacy-billing',
            `<span slStatusIndicator status="unknown" size="sm">No data</span>`,
          ) +
          `</div>`,
      ) +
        scene(
          'On a surface the family did not choose',
          'The mark brings its own tone and the words inherit, so an indicator on an inverse header keeps its meaning without a variant for it.',
          `<div class="slotted-demo-surface" data-surface="inverse"><span slStatusIndicator status="success" mark="icon">All systems operational</span></div>` +
            `<div class="slotted-demo-surface" data-surface="sunken"><span slStatusIndicator status="danger" mark="icon">Two incidents open</span></div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      3,
      scene(
        'A status that is a sentence',
        'It wraps rather than truncating, and the mark holds the first line’s cap. Half an instruction is wrong where a taller row is only taller.',
        `<div class="slotted-demo-measure"><span slStatusIndicator status="warning" mark="icon">Waiting for approval from the security review board since Tuesday</span></div>`,
      ) +
        scene(
          'A token with nothing to break on',
          'A container digest has no space and no hyphen, so it breaks mid-string rather than widening the column past the viewport. Nothing is removed from the DOM.',
          `<div class="slotted-demo-measure"><span slStatusIndicator status="danger">sha256:9f2b7c1de4a80b35c7f9a1e6d2408baf5c31</span></div>`,
        ) +
        scene(
          'Another language, decided once',
          'A catalog for the locale replaces the six fallback words, so a bare mark announces “Fehler” without a translation call at any call site.',
          `<span slStatusIndicator status="danger"></span>` +
            `<span slStatusIndicator status="success">Bereitstellung abgeschlossen</span>` +
            `<span slStatusIndicator status="warning" mark="icon">Zertifikat läuft ab</span>`,
        ),
    ),
  }),
  decorators: [
    applicationConfig({
      providers: [
        provideSlotted({
          locale: 'de-DE',
          catalogs: {
            'de-DE': {
              statusIndicator: { danger: 'Fehler', success: 'Erfolgreich', warning: 'Warnung' },
            },
          },
        }),
      ],
    }),
  ],
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      3,
      scene(
        'One decision for the application',
        'The provider sets the mark, the size, the announcing and the wording once. An indicator that states any of them still wins over it.',
        `<span slStatusIndicator status="success">Healthy</span>` +
          `<span slStatusIndicator status="success" mark="dot">Healthy, stated</span>`,
      ) +
        scene(
          'The consumer’s own element',
          'The selector is a bare attribute, so the host stays whatever it already was — an anchor here, and a table cell in a real page — with its href and its focus ring intact.',
          `<a slStatusIndicator status="danger" href="#build-4821">Build 4821 failed</a>` +
            `<output slStatusIndicator status="info">Deploy queued</output>`,
        ) +
        scene(
          'A mark on a corner belongs to badge',
          'Placing a mark on the corner of something else is badge’s anchor, and two families answering that would be two answers. The cost: a corner mark cannot carry this family’s glyph.',
          `<span slBadgeAnchor overlap="circle"><span slAvatar name="Ada Lovelace"></span><span slBadge shape="dot" tone="success"><span slVisuallyHidden>Online</span></span></span>` +
            `<span slStatusIndicator status="success" size="sm">Ada Lovelace is online</span>`,
        ),
    ),
  }),
  decorators: [
    applicationConfig({
      providers: [provideStatusIndicatorDefaults({ mark: 'icon', size: 'sm' })],
    }),
  ],
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A mark with no words still has one',
        'Each of these announces a word that is in the document and clipped from view, so it is read, found by a page search, and available to an aria-labelledby elsewhere.',
        `<div class="slotted-demo-rows">` +
          heard(
            `<span slStatusIndicator status="success"></span>`,
            '“Success”, from the family’s own table',
          ) +
          heard(
            `<span slStatusIndicator status="unknown"></span>`,
            '“Unknown”, in the same six words',
          ) +
          heard(
            `<span slStatusIndicator status="danger" label="Deploy failed"></span>`,
            '“Deploy failed”, from the application',
          ) +
          heard(
            `<span slStatusIndicator status="danger">Build 4821 failed</span>`,
            '“Build 4821 failed”, from the words on the page',
          ) +
          `</div>`,
      ) +
        scene(
          'Color is never the only carrier',
          'Every indicator has words. Where a product cannot show them, the icon mark gives each status a silhouette of its own — which is what survives the reader’s own high-contrast mode.',
          `<h3 slHeading>Two ways to say the same six things</h3>` +
            `<p slText>A dot beside its own word, or a glyph that keeps its meaning with the color switched off. The dot is lit with a halo of its own color, and the glyph set is six circles, so no two statuses are told apart by color alone.</p>` +
            `<div class="slotted-demo-row">` +
            `<span slStatusIndicator status="success" mark="icon">Healthy</span>` +
            `<span slStatusIndicator status="warning" mark="icon">Degraded</span>` +
            `<span slStatusIndicator status="danger" mark="icon">Failed</span>` +
            `</div>`,
          'prose',
        ),
    ),
  }),
};
