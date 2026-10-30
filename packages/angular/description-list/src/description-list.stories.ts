import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlLink } from '@slotted/angular/link';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import { SlTag } from '@slotted/angular/tag';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import {
  SlDescriptionList,
  SlDescriptionListAction,
  SlDescriptionListDescription,
  SlDescriptionListHint,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from './description-list';
import { provideDescriptionListDefaults } from './description-list.constants';
import {
  ANGULAR_DESCRIPTION_LIST_DOCS,
  ANGULAR_DESCRIPTION_LIST_TOKENS,
} from './description-list.docs';

interface DescriptionListStoryArgs {
  columns: 1 | 2 | 3;
  layout: 'row' | 'stack';
  variant: 'plain' | 'ruled' | 'framed';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DESCRIPTION_LIST_DOCS.descriptionList.scenes, {
    playground: Playground,
    layout: Layout,
    columns: Columns,
    variant: Variant,
    span: Span,
    actions: Actions,
    empty: Empty,
    hint: Hint,
    copy: Copy,
    reveal: Reveal,
    composition: Composition,
    content: Content,
    keyboard: Keyboard,
  }) as never;

const parts = [
  SlDescriptionList,
  SlDescriptionListAction,
  SlDescriptionListDescription,
  SlDescriptionListHint,
  SlDescriptionListItem,
  SlDescriptionListTerm,
];

const meta: Meta<DescriptionListStoryArgs> = {
  title: 'Components/Description List',
  component: SlDescriptionList,
  decorators: [
    moduleMetadata({
      imports: [
        ...parts,
        SlCard,
        SlCardBody,
        SlCardHeader,
        SlLink,
        SlSkeleton,
        SlStatusIndicator,
        SlTag,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Description List',
        description:
          'Pairs of a term and its description, read rather than edited. The details panel of a dense application.',
        framework: 'Angular',
        ...ANGULAR_DESCRIPTION_LIST_DOCS.descriptionList,
        tokens: ANGULAR_DESCRIPTION_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DescriptionListStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples end up against each other
 * and no story reaches for an inline style.
 *
 * Every stage is `block`. The family declares `container-type: inline-size` on
 * its root, so it no longer contributes its contents to its own intrinsic width
 * and a shrink-wrapping stage would resolve it to nothing —
 * `specs/story-layout.test.mjs` refuses the pairing.
 */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="block">${body}</div>
  </section>`;

const pair = (term: string, value: string, attributes = '') => `
  <div slDescriptionListItem>
    <dt slDescriptionListTerm>${term}</dt>
    <dd slDescriptionListDescription${attributes}>${value}</dd>
  </div>`;

const PANEL = `
  ${pair('Environment', 'Production')}
  ${pair('Region', 'eu-west-2')}
  ${pair('Created', '14 March 2024')}
  <div slDescriptionListItem>
    <dt slDescriptionListTerm>Owner</dt>
    <dd slDescriptionListDescription empty></dd>
  </div>`;

const NOTE =
  'Rotated the reconciliation credentials after the quarterly audit, moved the nightly job to the replica so the primary keeps its write budget, and left the old key active until the fifteenth for the two integrations that still read it.';

export const Playground: Story = {
  args: { columns: 1, layout: 'row', variant: 'plain' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div slDescriptionList [columns]="columns" [layout]="layout" [variant]="variant">${PANEL}</div>
</div>`,
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'layout="row"',
    'Every term shares one track sized to the widest of them, so the values start on one line down the panel. That is what a dl of independent groups cannot do without subgrid.',
    `<div slDescriptionList>${PANEL}</div>`,
  )}
  ${scene(
    'layout="stack"',
    'The value sits under its term. It is what a container narrower than the term width plus 12rem gets whether or not you ask for it, and what a long value wants before it wants a second column.',
    `<div slDescriptionList layout="stack">${PANEL}</div>`,
  )}
</div>`,
  }),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '[columns]="2"',
    'Two pairs to a row, each column group sizing its own term track. Narrow the window past 34rem of the panel and the second column goes before the row arrangement does.',
    `<div slDescriptionList [columns]="2">
      ${pair('Region', 'eu-west-2')}
      ${pair('Instances', '6')}
      ${pair('Created', '14 March 2024')}
      ${pair('Updated', '2 September 2026')}
    </div>`,
  )}
  ${scene(
    '[columns]="3"',
    'Three asked for, and as many drawn as the panel has room for: this stage is narrower than the 48rem three columns need, so the same list shows two here and one in a drawer. The count answers the panel, not the page.',
    `<div slDescriptionList [columns]="3">
      ${pair('Status', 'Active')}
      ${pair('Plan', 'Scale')}
      ${pair('Seats', '124')}
    </div>`,
  )}
</div>`,
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'variant="plain"',
    'Nothing between pairs but the distance between them. It is the form for the inside of a card, where the card already draws the box and a second frame would be two.',
    `<div slDescriptionList>${PANEL}</div>`,
  )}
  ${scene(
    'variant="ruled"',
    'A hairline under every pair, including the last — which is GOV.UK’s own summary list, and reads as a finished list rather than one that stopped.',
    `<div slDescriptionList variant="ruled">${PANEL}</div>`,
  )}
  ${scene(
    'variant="framed"',
    'The specification table: an outer frame, a hairline between rows, and a tinted term cell so the two columns read as two kinds of thing.',
    `<div slDescriptionList variant="framed">${PANEL}</div>`,
  )}
</div>`,
  }),
};

export const Span: Story = {
  parameters: scenario('span'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '[span]="2"',
    'The endpoint takes the whole row while the short pairs above it stay in two columns. Without it the consumer reorders the list to hide the problem.',
    `<div slDescriptionList [columns]="2">
      ${pair('Region', 'eu-west-2')}
      ${pair('Instances', '6')}
      <div slDescriptionListItem [span]="2">
        <dt slDescriptionListTerm>Endpoint</dt>
        <dd slDescriptionListDescription copy>billing-reconciler.eu-west-2.rds.example.com:5432</dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'slDescriptionListAction',
    'Tab to a Change link and a screen reader reads the term with it, because the action is described by its own dt. The last row offers what it is missing instead.',
    `<div slDescriptionList variant="ruled">
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Name</dt>
        <dd slDescriptionListDescription>Sarah Phillips</dd>
        <dd slDescriptionListAction><a slLink href="#name">Change</a></dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Address</dt>
        <dd slDescriptionListDescription>72 Guild Street, London, SE23 6FH</dd>
        <dd slDescriptionListAction><a slLink href="#address">Change</a></dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Contact details</dt>
        <dd slDescriptionListDescription empty></dd>
        <dd slDescriptionListAction><a slLink href="#contact">Add</a></dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'empty',
    'The first row draws a mark and reads as “Not provided” to a screen reader, because a panel of twelve empty rows saying it aloud is noise. The second was given words, so it shows them.',
    `<div slDescriptionList variant="ruled">
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Owner</dt>
        <dd slDescriptionListDescription empty></dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Escalation contact</dt>
        <dd slDescriptionListDescription empty placeholder="Not set yet"></dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Hint: Story = {
  parameters: scenario('hint'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'slDescriptionListHint',
    'A sentence under the name, inside the dt. A list that carries hints gives up the row arrangement earlier, because a label column wide enough for a sentence leaves a narrow panel with nothing for the value.',
    `<div slDescriptionList>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>
          Retention
          <span slDescriptionListHint>How long a deleted object stays recoverable.</span>
        </dt>
        <dd slDescriptionListDescription>30 days</dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>
          Seats
          <span slDescriptionListHint>Counted at the end of each billing period.</span>
        </dt>
        <dd slDescriptionListDescription>124 of 150</dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'copy',
    'Press either control: in an application the mark turns to a check for two seconds and a screen reader hears it, and here in an iframe with no clipboard permission the value is selected instead so you can still take it. The second row copies a value the reader never sees in that form.',
    `<div slDescriptionList>
      ${pair('Resource name', 'arn:aws:iam::421900075512:role/billing-reconciler', ' copy')}
      ${pair('IBAN', 'GB29 NWBK 6016 1331 9268 19', ' copy copyValue="GB29NWBK60161331926819"')}
    </div>`,
  )}
</div>`,
  }),
};

export const Reveal: Story = {
  parameters: scenario('reveal'),
  render: () => ({
    props: { note: NOTE, revealed: true },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '[clamp]="2"',
    'Two lines and a control on the value that has more than two; none on the value that has one, because a clamp is a maximum rather than a promise. Select the clamped text and paste it: every character is still there.',
    `<div slDescriptionList>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Change note</dt>
        <dd slDescriptionListDescription [clamp]="2">{{ note }}</dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Note that fits</dt>
        <dd slDescriptionListDescription [clamp]="2">Rotated the credentials.</dd>
      </div>
    </div>`,
  )}
  ${scene(
    '[revealed]',
    'The same value with the choice held outside the component, starting open. A list that remembers what a reader expanded passes it back in on the next render.',
    `<div slDescriptionList>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Change note</dt>
        <dd
          slDescriptionListDescription
          [clamp]="2"
          [revealed]="revealed"
          (revealedChange)="revealed = $event.value"
        >{{ note }}</dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideDescriptionListDefaults({ termWidth: '8rem', variant: 'framed' })],
    }),
  ],
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Inside a card',
    'Card owns the title and the header actions, which is why this family ships neither. The value slot takes a tag, a status indicator or a skeleton without knowing what any of them are.',
    `<div slCard>
      <div slCardHeader>Billing account</div>
      <div slCardBody>
        <div slDescriptionList>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Status</dt>
            <dd slDescriptionListDescription>
              <span slStatusIndicator status="success">Active</span>
            </dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Plan</dt>
            <dd slDescriptionListDescription><span slTag>Scale</span></dd>
          </div>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Next invoice</dt>
            <dd slDescriptionListDescription><span slSkeleton [inlineSize]="120"></span></dd>
          </div>
        </div>
      </div>
    </div>`,
  )}
  ${scene(
    'provideDescriptionListDefaults()',
    'One decision for every panel below it: the arrangement and the term width. An input on the list still wins over both. The words come from the language in force.',
    `<div slDescriptionList variant="framed" termWidth="8rem">
      ${pair('Key', 'sk_live_51N2xQe4Hh8bTqVzL', ' copy')}
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Owner</dt>
        <dd slDescriptionListDescription empty></dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Long, translated and unbroken',
    'A sixty-four character hash with nowhere to break, a German compound term at a term width of ten rem, and a right-to-left pair. The value breaks rather than leaving the box that owns it.',
    `<div slDescriptionList termWidth="10rem">
      ${pair('Checksum', '9f2c41b7e08a4d6cb35f7a1de2409c8871b0f4d9a6e3c5027bd18fa4e6c39017', ' copy')}
      ${pair('Rechnungsempfängeradresse', 'Friedrichstraße 12, 10117 Berlin')}
      ${pair('مالك المورد', 'فريق الفوترة')}
    </div>`,
  )}
  ${scene(
    'In a narrow column',
    'The same panel at 360 pixels: the row arrangement gives way to the stack, the terms stop sharing a track, and nothing overflows or truncates.',
    `<div class="slotted-demo-measure">
      <div slDescriptionList>
        ${pair('Checksum', '9f2c41b7e08a4d6cb35f7a1de2409c8871b0f4d9a6e3c5027bd18fa4e6c39017', ' copy')}
        ${pair('Region', 'eu-west-2')}
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { note: NOTE },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, Enter, Space',
    'Tab reaches the copy control, the reveal toggle and your own action, in reading order. Enter and Space activate the focused one, and the request says which of the two it was.',
    `<div slDescriptionList variant="ruled">
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Change note</dt>
        <dd slDescriptionListDescription copy [clamp]="2">{{ note }}</dd>
      </div>
      <div slDescriptionListItem>
        <dt slDescriptionListTerm>Name</dt>
        <dd slDescriptionListDescription>Sarah Phillips</dd>
        <dd slDescriptionListAction><a slLink href="#name">Change</a></dd>
      </div>
    </div>`,
  )}
</div>`,
  }),
};
