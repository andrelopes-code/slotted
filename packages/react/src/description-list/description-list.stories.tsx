import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Card, CardBody, CardHeader } from '../card';
import { Link } from '../link';
import { Skeleton } from '../skeleton';
import { StatusIndicator } from '../status-indicator';
import { Tag } from '../tag';
import { DescriptionList } from './description-list';
import { DescriptionListDefaultsProvider } from './description-list-defaults';
import {
  DescriptionListAction,
  DescriptionListDescription,
  DescriptionListHint,
  DescriptionListItem,
  DescriptionListTerm,
} from './description-list-parts';
import {
  REACT_DESCRIPTION_LIST_DOCS,
  REACT_DESCRIPTION_LIST_TOKENS,
} from './description-list.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DESCRIPTION_LIST_DOCS.descriptionList.scenes, {
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

const meta = {
  title: 'Components/Description List',
  component: DescriptionList,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Description List',
        description:
          'Pairs of a term and its description, read rather than edited. The details panel of a dense application.',
        framework: 'React',
        ...REACT_DESCRIPTION_LIST_DOCS.descriptionList,
        tokens: REACT_DESCRIPTION_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const NOTE =
  'Rotated the reconciliation credentials after the quarterly audit, moved the nightly job to the replica so the primary keeps its write budget, and left the old key active until the fifteenth for the two integrations that still read it.';

/**
 * Every stage on this page is `block`. The family declares
 * `container-type: inline-size` on its root, so it no longer contributes its
 * contents to its own intrinsic width and a shrink-wrapping stage would resolve
 * it to nothing — which `specs/story-layout.test.mjs` refuses.
 */
function Scene({
  children,
  label,
  note,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout="block">
        {children}
      </div>
    </section>
  );
}

function Pair({
  children,
  hint,
  term,
  ...props
}: React.ComponentProps<typeof DescriptionListDescription> & {
  hint?: string;
  term: string;
}) {
  return (
    <DescriptionListItem>
      <DescriptionListTerm>
        {term}
        {hint === undefined ? null : <DescriptionListHint>{hint}</DescriptionListHint>}
      </DescriptionListTerm>
      <DescriptionListDescription {...props}>{children}</DescriptionListDescription>
    </DescriptionListItem>
  );
}

function Panel(props: React.ComponentProps<typeof DescriptionList>) {
  return (
    <DescriptionList {...props}>
      <Pair term="Environment">Production</Pair>
      <Pair term="Region">eu-west-2</Pair>
      <Pair term="Created">14 March 2024</Pair>
      <Pair term="Owner">{null}</Pair>
    </DescriptionList>
  );
}

export const Playground: Story = {
  args: { columns: 1, layout: 'row', variant: 'plain' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Panel {...args} />
    </div>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='layout="row"'
        note="Every term shares one track sized to the widest of them, so the values start on one line down the panel. That is what a dl of independent groups cannot do without subgrid."
      >
        <Panel />
      </Scene>
      <Scene
        label='layout="stack"'
        note="The value sits under its term. It is what a container narrower than the term width plus 12rem gets whether or not you ask for it, and what a long value wants before it wants a second column."
      >
        <Panel layout="stack" />
      </Scene>
    </div>
  ),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="columns={2}"
        note="Two pairs to a row, each column group sizing its own term track. Narrow the window past 34rem of the panel and the second column goes before the row arrangement does."
      >
        <DescriptionList columns={2}>
          <Pair term="Region">eu-west-2</Pair>
          <Pair term="Instances">6</Pair>
          <Pair term="Created">14 March 2024</Pair>
          <Pair term="Updated">2 September 2026</Pair>
        </DescriptionList>
      </Scene>
      <Scene
        label="columns={3}"
        note="Three asked for, and as many drawn as the panel has room for: this stage is narrower than the 48rem three columns need, so the same list shows two here and one in a drawer. The count answers the panel, not the page."
      >
        <DescriptionList columns={3}>
          <Pair term="Status">Active</Pair>
          <Pair term="Plan">Scale</Pair>
          <Pair term="Seats">124</Pair>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='variant="plain"'
        note="Nothing between pairs but the distance between them. It is the form for the inside of a card, where the card already draws the box and a second frame would be two."
      >
        <Panel />
      </Scene>
      <Scene
        label='variant="ruled"'
        note="A hairline under every pair, including the last — which is GOV.UK's own summary list, and reads as a finished list rather than one that stopped."
      >
        <Panel variant="ruled" />
      </Scene>
      <Scene
        label='variant="framed"'
        note="The specification table: an outer frame, a hairline between rows, and a tinted term cell so the two columns read as two kinds of thing."
      >
        <Panel variant="framed" />
      </Scene>
    </div>
  ),
};

export const Span: Story = {
  parameters: scenario('span'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="span={2}"
        note="The endpoint takes the whole row while the four short pairs above it stay in two columns. Without it the consumer reorders the list to hide the problem."
      >
        <DescriptionList columns={2}>
          <Pair term="Region">eu-west-2</Pair>
          <Pair term="Instances">6</Pair>
          <DescriptionListItem span={2}>
            <DescriptionListTerm>Endpoint</DescriptionListTerm>
            <DescriptionListDescription copy>
              billing-reconciler.eu-west-2.rds.example.com:5432
            </DescriptionListDescription>
          </DescriptionListItem>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="DescriptionListAction"
        note="Tab to a Change link and a screen reader reads the term with it, because the action is described by its own dt. The last row offers what it is missing instead."
      >
        <DescriptionList variant="ruled">
          <DescriptionListItem>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>Sarah Phillips</DescriptionListDescription>
            <DescriptionListAction>
              <Link href="#name">Change</Link>
            </DescriptionListAction>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionListTerm>Address</DescriptionListTerm>
            <DescriptionListDescription>
              72 Guild Street, London, SE23 6FH
            </DescriptionListDescription>
            <DescriptionListAction>
              <Link href="#address">Change</Link>
            </DescriptionListAction>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionListTerm>Contact details</DescriptionListTerm>
            <DescriptionListDescription empty />
            <DescriptionListAction>
              <Link href="#contact">Add</Link>
            </DescriptionListAction>
          </DescriptionListItem>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A value the data did not have"
        note="The first row draws a mark and reads as “Not provided” to a screen reader, because a panel of twelve empty rows saying it aloud is noise. The second was given words, so it shows them."
      >
        <DescriptionList variant="ruled">
          <Pair term="Owner">{null}</Pair>
          <Pair term="Escalation contact" empty placeholder="Not set yet">
            {null}
          </Pair>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

export const Hint: Story = {
  parameters: scenario('hint'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="DescriptionListHint"
        note="A sentence under the name, inside the dt. A list that carries hints gives up the row arrangement earlier, because a label column wide enough for a sentence leaves a narrow panel with nothing for the value."
      >
        <DescriptionList>
          <Pair hint="How long a deleted object stays recoverable." term="Retention">
            30 days
          </Pair>
          <Pair hint="Counted at the end of each billing period." term="Seats">
            124 of 150
          </Pair>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="copy"
        note="Press either control: in an application the mark turns to a check for two seconds and a screen reader hears it, and here in an iframe with no clipboard permission the value is selected instead so you can still take it. The second row copies a value the reader never sees in that form."
      >
        <DescriptionList>
          <Pair copy term="Resource name">
            arn:aws:iam::421900075512:role/billing-reconciler
          </Pair>
          <Pair copy copyValue="GB29NWBK60161331926819" term="IBAN">
            GB29 NWBK 6016 1331 9268 19
          </Pair>
        </DescriptionList>
      </Scene>
    </div>
  ),
};

function Owned() {
  const [revealed, setRevealed] = useState(true);

  return (
    <DescriptionList>
      <DescriptionListItem>
        <DescriptionListTerm>Change note</DescriptionListTerm>
        <DescriptionListDescription
          clamp={2}
          onRevealedChange={(next) => setRevealed(next)}
          revealed={revealed}
        >
          {NOTE}
        </DescriptionListDescription>
      </DescriptionListItem>
    </DescriptionList>
  );
}

export const Reveal: Story = {
  parameters: scenario('reveal'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="clamp={2}"
        note="Two lines and a control on the value that has more than two; none on the value that has one, because a clamp is a maximum rather than a promise. Select the clamped text and paste it: every character is still there."
      >
        <DescriptionList>
          <Pair clamp={2} term="Change note">
            {NOTE}
          </Pair>
          <Pair clamp={2} term="Note that fits">
            Rotated the credentials.
          </Pair>
        </DescriptionList>
      </Scene>
      <Scene
        label="revealed"
        note="The same value with the choice held outside the component, starting open. A list that remembers what a reader expanded passes it back in on the next render."
      >
        <Owned />
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Inside a Card"
        note="Card owns the title and the header actions, which is why this family ships neither. The value slot takes a tag, a status indicator or a skeleton without knowing what any of them are."
      >
        <Card>
          <CardHeader>Billing account</CardHeader>
          <CardBody>
            <DescriptionList>
              <Pair term="Status">
                <StatusIndicator status="success">Active</StatusIndicator>
              </Pair>
              <Pair term="Plan">
                <Tag>Scale</Tag>
              </Pair>
              <Pair term="Next invoice">
                <Skeleton inlineSize={120} />
              </Pair>
            </DescriptionList>
          </CardBody>
        </Card>
      </Scene>
      <Scene
        label="DescriptionListDefaultsProvider"
        note="One decision for every panel below it: the arrangement and the term width. A prop on the list still wins over both. The words come from the language in force."
      >
        <DescriptionListDefaultsProvider termWidth="8rem" variant="framed">
          <DescriptionList>
            <Pair copy term="Chave">
              sk_live_51N2xQe4Hh8bTqVzL
            </Pair>
            <Pair term="Owner">{null}</Pair>
          </DescriptionList>
        </DescriptionListDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Long, translated and unbroken"
        note="A sixty-four character hash with nowhere to break, a German compound term at a term width of ten rem, and a right-to-left pair. The value breaks rather than leaving the box that owns it."
      >
        <DescriptionList termWidth="10rem">
          <Pair copy term="Checksum">
            9f2c41b7e08a4d6cb35f7a1de2409c8871b0f4d9a6e3c5027bd18fa4e6c39017
          </Pair>
          <Pair term="Rechnungsempfängeradresse">Friedrichstraße 12, 10117 Berlin</Pair>
          <Pair term="مالك المورد">فريق الفوترة</Pair>
        </DescriptionList>
      </Scene>
      <Scene
        label="In a narrow column"
        note="The same panel at 360 pixels: the row arrangement gives way to the stack, the terms stop sharing a track, and nothing overflows or truncates."
      >
        <div className="slotted-demo-measure">
          <DescriptionList>
            <Pair copy term="Checksum">
              9f2c41b7e08a4d6cb35f7a1de2409c8871b0f4d9a6e3c5027bd18fa4e6c39017
            </Pair>
            <Pair term="Region">eu-west-2</Pair>
          </DescriptionList>
        </div>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Tab, Enter, Space"
        note="Tab reaches the copy control, the reveal toggle and your own action, in reading order. Enter and Space activate the focused one, and the request says which of the two it was."
      >
        <DescriptionList variant="ruled">
          <Pair clamp={2} copy term="Change note">
            {NOTE}
          </Pair>
          <DescriptionListItem>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>Sarah Phillips</DescriptionListDescription>
            <DescriptionListAction>
              <Link href="#name">Change</Link>
            </DescriptionListAction>
          </DescriptionListItem>
        </DescriptionList>
      </Scene>
    </div>
  ),
};
