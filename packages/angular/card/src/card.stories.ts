import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlHeading } from '../../typography/src/heading';
import { SlText } from '../../typography/src/text';
import { SlCard } from './card';
import type { CardFill, CardOrientation, CardSize } from './card';
import { SlCardActions } from './card-actions';
import { SlCardLink } from './card-link';
import { SlCardBody } from './card-body';
import { SlCardFooter } from './card-footer';
import { SlCardHeader } from './card-header';
import { SlCardMedia } from './card-media';
import { SlCardSelection } from './card-selection';
import { ANGULAR_CARD_DOCS, ANGULAR_CARD_TOKENS } from './card.docs';

interface CardStoryArgs {
  disabled: boolean;
  fill: CardFill;
  orientation: CardOrientation;
  selected: boolean;
  size: CardSize;
}

/**
 * Button is still being rebuilt, so the reference page uses the platform
 * control rather than coupling Card's page to a family that is about to
 * change. What Card has to demonstrate is the surface around a control.
 */
const CONTROL = {
  background: 'var(--slotted-surface)',
  'block-size': 'var(--slotted-control-height-sm)',
  border: 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  'border-radius': 'var(--slotted-control-radius)',
  color: 'inherit',
  font: 'inherit',
  'font-size': 'var(--slotted-control-font-size-sm)',
  'font-weight': 'var(--slotted-control-font-weight)',
  'padding-inline': 'var(--slotted-control-padding-inline-sm)',
};

const BADGE = {
  background: 'var(--slotted-tone-warning-surface)',
  'border-radius': 'var(--slotted-radius-full)',
  color: 'var(--slotted-tone-warning-text)',
  'font-size': 'var(--slotted-font-size-xs)',
  'font-weight': 'var(--slotted-font-weight-medium)',
  'padding-block': 'var(--slotted-space-1)',
  'padding-inline': 'var(--slotted-space-4)',
};

const RULE = {
  'block-size': '0',
  border: '0',
  'border-block-start': 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  margin: '0',
};

const RULE_INSET = { ...RULE, 'margin-inline': 'var(--slotted-control-padding-inline-md)' };

const cover = (from: string, to: string, blockSize: string) => ({
  background: `linear-gradient(135deg, ${from}, ${to})`,
  'block-size': blockSize,
});

const COVER_TALL = cover('#4f46e5', '#06b6d4', '7rem');
const COVER_SHORT = cover('#4f46e5', '#06b6d4', '5rem');
const COVER_SIDE = cover('#f59e0b', '#ec4899', '100%');

const IMPORTS = [
  SlCard,
  SlCardActions,
  SlCardBody,
  SlCardFooter,
  SlCardHeader,
  SlCardLink,
  SlCardMedia,
  SlCardSelection,
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Anatomy as never,
});

const meta: Meta<CardStoryArgs> = {
  title: 'Components/Card',
  component: SlCard,
  decorators: [moduleMetadata({ imports: [...IMPORTS, SlHeading, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Card',
        description:
          'A bounded surface that groups one subject, with a media, a header, a body and a footer that are all optional.',
        framework: 'Angular',
        ...ANGULAR_CARD_DOCS.card,
        tokens: ANGULAR_CARD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CardStoryArgs>;

export const Playground: Story = {
  args: { disabled: false, fill: 'outline', orientation: 'vertical', selected: false, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, badge: BADGE, control: CONTROL, cover: COVER_TALL },
    template: `
<div class="slotted-demo-measure">
  <div
    slCard
    [orientation]="orientation"
    [fill]="fill"
    [size]="size"
    [selected]="selected"
    [disabled]="disabled"
  >
    <div slCardMedia><div [style]="cover"></div></div>
    <div slCardHeader>
      <h3 slHeading [level]="3" size="xl">Northwind billing</h3>
      <span slText size="sm" tone="muted">Invoices, payment methods and the address they are issued to.</span>
      <span slCardActions><span [style]="badge">Overdue</span></span>
    </div>
    <div slCardBody>
      <span slText>The next invoice settles on the first working day of October against the card ending 4417.</span>
    </div>
    <div slCardFooter>
      <button type="button" [style]="control">Pay now</button>
      <button type="button" [style]="control">Download</button>
    </div>
  </div>
</div>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: { cover: COVER_SHORT },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Every region</span>
      <span class="slotted-demo-scene__note">Media, header, body, footer.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardMedia><div [style]="cover"></div></div>
        <div slCardHeader>
          <h3 slHeading [level]="3" size="lg">Northwind</h3>
          <span slText size="sm" tone="muted">Twelve open invoices</span>
        </div>
        <div slCardBody><span slText>Settling on the first working day of October.</span></div>
        <div slCardFooter><span slText size="xs" tone="muted">Updated 12 minutes ago</span></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A body alone</span>
      <span class="slotted-demo-scene__note">The same inset as a full card, not a tighter one.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardBody><span slText>A region at either end absorbs the padding its neighbour would carry.</span></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Header and footer</span>
      <span class="slotted-demo-scene__note">A missing body leaves no gap behind.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardHeader><h3 slHeading [level]="3" size="lg">Storage</h3></div>
        <div slCardFooter><span slText size="xs" tone="muted">84 GB of 200 GB</span></div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    props: { badge: BADGE, rule: RULE, ruleInset: RULE_INSET },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">outline · sm</span>
      <span class="slotted-demo-scene__note">A hairline edge and the tightest inset.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard fill="outline" size="sm">
        <div slCardHeader><h3 slHeading [level]="3" size="md">outline</h3></div>
        <div slCardBody><span slText>A hairline edge and the tightest inset.</span></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">elevated · md</span>
      <span class="slotted-demo-scene__note">The same edge, plus the smallest step of the shadow scale.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard fill="elevated" size="md">
        <div slCardHeader><h3 slHeading [level]="3" size="md">elevated</h3></div>
        <div slCardBody><span slText>The same edge, plus the smallest step of the shadow scale.</span></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">subtle · lg</span>
      <span class="slotted-demo-scene__note">A filled surface that recedes into the page.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard fill="subtle" size="lg">
        <div slCardHeader><h3 slHeading [level]="3" size="md">subtle</h3></div>
        <div slCardBody><span slText>A filled surface that recedes into the page.</span></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene" data-span="full">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A rule between two regions</span>
      <span class="slotted-demo-scene__note">Composition, not an axis: a Divider written between two regions runs edge to edge because each region owns its own inset, and inset on the rule lines it up with the text instead.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardHeader>
          <h3 slHeading [level]="3" size="lg">Review pictures</h3>
          <span slCardActions><span [style]="badge">200 new</span></span>
        </div>
        <hr [style]="rule" />
        <div slCardBody><span slText>Two hundred images have been uploaded since the last visit.</span></div>
        <hr [style]="ruleInset" />
        <div slCardFooter><span slText size="xs" tone="muted">The second rule is inset.</span></div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    props: { cover: COVER_SIDE },
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene" data-span="full">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Horizontal</span>
      <span class="slotted-demo-scene__note">The media keeps the first column while the card is wide enough. Narrow the window: below 24rem of card width it returns to the top, because the card answers its own inline size rather than the viewport.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard orientation="horizontal">
        <div slCardMedia><div [style]="cover"></div></div>
        <div slCardHeader>
          <h3 slHeading [level]="3" size="lg">Quarterly report</h3>
          <span slText size="sm" tone="muted">PDF · 2.4 MB</span>
        </div>
        <div slCardBody><span slText>Revenue, retention and the two accounts that moved them.</span></div>
        <div slCardFooter><span slText size="xs" tone="muted">Shared with four people</span></div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">One destination</span>
      <span class="slotted-demo-scene__note">Hover and tab into it: the whole surface responds, and the link is named "Northwind Traders" rather than by every string in the card.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardHeader>
          <a slCardLink href="#northwind" style="color: inherit; text-decoration: none">
            <h3 slHeading [level]="3" size="lg">Northwind Traders</h3>
          </a>
          <span slText size="sm" tone="muted">Twelve open invoices</span>
        </div>
        <div slCardBody><span slText>The footer sits above the stretched hit area.</span></div>
        <div slCardFooter><a href="#settings">Billing settings</a></div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A choice</span>
      <span class="slotted-demo-scene__note">The card is the label, so the whole surface is the target. slCardSelection keeps the column; the control announces the state the card paints.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <form class="slotted-demo-stack">
        <label slCard>
          <div slCardHeader>
            <span slCardSelection><input type="radio" name="plan" value="starter" /></span>
            <h3 slHeading [level]="3" size="lg">Starter</h3>
            <span slText size="sm" tone="muted">Two seats, no shared billing</span>
          </div>
        </label>
        <label slCard selected>
          <div slCardHeader>
            <span slCardSelection><input type="radio" name="plan" value="team" checked /></span>
            <h3 slHeading [level]="3" size="lg">Team</h3>
            <span slText size="sm" tone="muted">Twenty seats, shared billing and audit history</span>
          </div>
        </label>
        <label slCard disabled>
          <div slCardHeader>
            <span slCardSelection><input type="radio" name="plan" value="enterprise" disabled /></span>
            <h3 slHeading [level]="3" size="lg">Enterprise</h3>
            <span slText size="sm">Not available on this account</span>
          </div>
        </label>
        <label slCard fill="subtle">
          <div slCardHeader>
            <span slCardSelection><input type="checkbox" name="audit" value="audit" /></span>
            <h3 slHeading [level]="3" size="lg">Audit history</h3>
            <span slText size="sm" tone="muted">Kept for seven years</span>
          </div>
        </label>
      </form>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { control: CONTROL },
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">An article</span>
      <span class="slotted-demo-scene__note">The page says what the card is; the family only says how it is bounded.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <article slCard aria-labelledby="card-post">
        <div slCardHeader>
          <h3 id="card-post" slHeading [level]="3" size="lg">Shipping the rebuild</h3>
          <span slText size="sm" tone="muted">1 September 2026</span>
        </div>
        <div slCardBody><span slText>Every family now reads the same surface, the same inset and the same edge.</span></div>
      </article>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Content the card did not choose</span>
      <span class="slotted-demo-scene__note">An unbroken name, a long body and more actions than fit on one line.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div slCard>
        <div slCardHeader>
          <h3 slHeading [level]="3" size="lg" style="overflow-wrap: anywhere">contoso-manufacturing-emea-consolidated-settlement</h3>
        </div>
        <div slCardBody>
          <span slText>Payment terms run to thirty days from the issue date, and a disputed line is held out of the settlement until it is resolved.</span>
        </div>
        <div slCardFooter>
          <button type="button" [style]="control">Approve</button>
          <button type="button" [style]="control">Dispute</button>
          <button type="button" [style]="control">Share with the finance team</button>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};
