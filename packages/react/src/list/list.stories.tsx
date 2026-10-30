import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Card, CardBody, CardHeader } from '../card';
import { Checkbox } from '../checkbox';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemLink,
  ListItemStart,
} from '../list-item';
import { Skeleton } from '../skeleton';
import { Heading, Text } from '../typography';
import { List } from './list';
import { ListDefaultsProvider } from './list-defaults';
import { ListEmpty, ListSection } from './list-parts';
import { REACT_LIST_DOCS, REACT_LIST_TOKENS } from './list.docs';

const FOLDERS = [
  { count: '128', href: '#photos', name: 'Photos' },
  { count: '12', href: '#recordings', name: 'Recordings' },
  { count: '4', href: '#exports', name: 'Exports' },
];

const rows = () =>
  FOLDERS.map((folder) => (
    <ListItem key={folder.name}>
      <ListItemLink href={folder.href}>
        <ListItemBody>
          <ListItemLabel>{folder.name}</ListItemLabel>
        </ListItemBody>
        <ListItemEnd>{folder.count}</ListItemEnd>
      </ListItemLink>
    </ListItem>
  ));

const plainRows = (labels: readonly string[]) =>
  labels.map((label) => (
    <ListItem key={label}>
      <ListItemContent>
        <ListItemBody>
          <ListItemLabel>{label}</ListItemLabel>
        </ListItemBody>
      </ListItemContent>
    </ListItem>
  ));

const Scene = ({
  children,
  label,
  note,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
}) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_LIST_DOCS.list.scenes, {
    playground: Playground,
    variant: Variant,
    marker: Marker,
    sections: Sections,
    inset: Inset,
    states: States,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/List',
  component: List,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'List',
        description:
          'A vertical run of related rows, with groups, an empty message and a marker the family draws itself.',
        framework: 'React',
        ...REACT_LIST_DOCS.list,
        tokens: REACT_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    inset: false,
    loading: false,
    marker: 'none',
    ordered: false,
    size: 'md',
    variant: 'ruled',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <List {...args} aria-label="Folders">
      {rows()}
    </List>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="plain"
        note="Nothing between the rows. The rhythm of the inset is what separates them, which is right for a short run inside a card."
      >
        <List aria-label="Plain" variant="plain">
          {plainRows(['Photos', 'Recordings'])}
        </List>
      </Scene>
      <Scene
        label="ruled"
        note="A hairline between rows, drawn by the row below — the only element that knows whether it is the first of its list."
      >
        <List aria-label="Ruled" variant="ruled">
          {plainRows(['Photos', 'Recordings'])}
        </List>
      </Scene>
      <Scene
        label="framed"
        note="The rules, plus a box around the set. The frame clips its own corners, so the first row hover fill does not square off a rounded edge."
      >
        <List aria-label="Framed" variant="framed">
          {plainRows(['Photos', 'Recordings'])}
        </List>
      </Scene>
      <Scene
        label="separated"
        note="A surface per row, and the one variant that spends a gap. A list of cards and a list of rows are the same family in two arrangements."
      >
        <List aria-label="Separated" variant="separated">
          {plainRows(['Photos', 'Recordings'])}
        </List>
      </Scene>
    </div>
  ),
};

export const Marker: Story = {
  parameters: scenario('marker'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="bullet, on a ul"
        note="Drawn geometry from the glyph scale, not a bullet character: it keeps its shape and its weight whatever typeface the reader has."
      >
        <List aria-label="Bulleted" marker="bullet">
          {plainRows([
            'A mark that survives a change of typeface',
            'A second line, so the mark can be seen sitting on the first rather than in the middle of the block',
          ])}
        </List>
      </Scene>
      <Scene
        label="number, on an ol"
        note="The element carries the reading order and the axis carries the mark, which is why an ordered set can paint its own badges and still read in order."
      >
        <List aria-label="Setup" marker="number" ordered>
          {plainRows(['Open the workspace', 'Choose a theme', 'Invite the rest of the team'])}
        </List>
      </Scene>
      <Scene
        label="A count that restarts per group"
        note="Each group opens its own count rather than running through the set, which is what a numbered list of groups means."
      >
        <List aria-label="Runs" marker="number" ordered variant="ruled">
          <ListSection label="First run">
            {plainRows(['Import the archive', 'Check the report'])}
          </ListSection>
          <ListSection label="Later">{plainRows(['Import the archive'])}</ListSection>
        </List>
      </Scene>
    </div>
  ),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A group, and the heading that names it"
        note="The nested list is named by the heading through aria-labelledby, so a reader who lands inside the group is told which group it is."
      >
        <List aria-label="Library" variant="ruled">
          <ListSection label="Folders" level="3">
            {rows().slice(0, 2)}
          </ListSection>
          <ListSection label="Notes" level="3">
            {plainRows(['Weekly review', 'Archive'])}
          </ListSection>
        </List>
      </Scene>
      <Scene
        label="sticky, over a set that scrolls"
        note="The heading takes the set surface and the library sticky stack level, so a row scrolling under it is covered rather than showing through. Scroll the stage to see it hold."
      >
        <div className="slotted-demo-scroll">
          <List aria-label="Scrolling library" variant="ruled">
            <ListSection label="Folders" level="3" sticky>
              {plainRows(['Photos', 'Recordings', 'Exports', 'Invoices'])}
            </ListSection>
            <ListSection label="Notes" level="3" sticky>
              {plainRows(['Weekly review', 'Archive', 'Drafts', 'Templates'])}
            </ListSection>
          </List>
        </div>
      </Scene>
      <Scene
        label="level='none'"
        note="A set whose groups are not document structure. The name still reads as a name and still names the nested list; what it does not do is add a heading to the outline."
      >
        <List aria-label="Filters" variant="plain">
          <ListSection label="Recently used" level="none">
            {plainRows(['Overdue', 'Unassigned'])}
          </ListSection>
        </List>
      </Scene>
    </div>
  ),
};

export const Inset: Story = {
  parameters: scenario('inset'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Default, inside a Card"
        note="The rows carry their own inline padding, so every title sits two insets in from the card edge and the rule stops short of it on both sides."
      >
        <Card>
          <CardHeader>
            <Heading level={3} size="md">
              Members
            </Heading>
          </CardHeader>
          <CardBody>
            <List aria-label="Members" variant="ruled">
              {plainRows(['Ada Lovelace', 'Grace Hopper'])}
            </List>
          </CardBody>
        </Card>
      </Scene>
      <Scene
        label="inset"
        note="The rows give the padding back, so the titles line up with the heading above them and the rule runs the full width of the card body — which is the half disableGutters leaves out elsewhere."
      >
        <Card>
          <CardHeader>
            <Heading level={3} size="md">
              Members
            </Heading>
          </CardHeader>
          <CardBody>
            <List aria-label="Members" inset variant="ruled">
              {plainRows(['Ada Lovelace', 'Grace Hopper'])}
            </List>
          </CardBody>
        </Card>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="loading"
        note="aria-busy on the set, and nothing drawn: what stands in for the rows is Skeleton, composed by the page. A second family drawing placeholder geometry would be two answers to one question."
      >
        <List aria-label="Folders" loading variant="ruled">
          {['a', 'b', 'c'].map((key) => (
            <ListItem key={key}>
              <ListItemContent>
                <ListItemBody>
                  <Skeleton inlineSize="60%" />
                </ListItemBody>
                <ListItemEnd>
                  <Skeleton inlineSize="2rem" />
                </ListItemEnd>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </Scene>
      <Scene
        label="empty"
        note="The message is an li inside the set, so a reader hears it. Outside the list they would hear zero items and then silence, and the words would fall outside the frame."
      >
        <List aria-label="Results" variant="framed">
          <ListEmpty>
            <Heading level={3} size="md">
              No matches
            </Heading>
            <Text tone="muted">Clear the filter to see every folder again.</Text>
          </ListEmpty>
        </List>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A hundred rows, and a set that says how many"
        note="position and setSize belong to the row and are written only when the page knows them — a page of results, a filtered set. Every row present makes them unnecessary, and ARIA 1.2 says so."
      >
        <List aria-label="Results 41 to 43 of 128" variant="ruled">
          {[41, 42, 43].map((index) => (
            <ListItem key={index} position={index} setSize={128}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>Result {index}</ListItemLabel>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </Scene>
      <Scene
        label="A set in another script"
        note="The marker column, the inset and the trailing metadata all mirror, because every rule is a logical property. Switch the toolbar to rtl to read it the other way."
      >
        <List aria-label="مجلدات" marker="bullet">
          {plainRows(['مساحة العمل المشتركة', 'التسجيلات'])}
        </List>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="An inbox: Checkbox, Badge and a row that navigates"
        note="The set supplies the box and the rhythm. The chooser is Checkbox and the count is Badge, both composed — the family draws no check and no pill of its own."
      >
        <List aria-label="Inbox" variant="ruled">
          <ListItem selected>
            <ListItemContent>
              <ListItemStart>
                <Checkbox aria-label="Select Quarterly report" defaultChecked />
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Quarterly report</ListItemLabel>
                <ListItemDescription>Ada Lovelace · 14:02</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>
                <Badge tone="accent">3</Badge>
              </ListItemEnd>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemContent>
              <ListItemStart>
                <Checkbox aria-label="Select Invoice 4417" />
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Invoice 4417</ListItemLabel>
                <ListItemDescription>Northwind Traders · Yesterday</ListItemDescription>
              </ListItemBody>
            </ListItemContent>
          </ListItem>
        </List>
      </Scene>
      <Scene
        label="One decision for every list under it"
        note="ListDefaultsProvider sets the four the set hands down. A list that states one itself still wins, which is why the second set below is framed."
      >
        <ListDefaultsProvider size="sm" variant="ruled">
          <List aria-label="Inherited">{plainRows(['Reads the provider'])}</List>
          <List aria-label="Own" variant="framed">
            {plainRows(['States its own variant'])}
          </List>
        </ListDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A navigation list, in the landmark the page owns"
        note="The family writes no nav: a landmark is a decision about the page. The row says which one is current with aria-current, the one selection-shaped state ARIA 1.2 lets a listitem announce."
      >
        <nav aria-label="Sections">
          <List variant="plain">
            <ListItem current="page">
              <ListItemLink href="#billing">
                <ListItemBody>
                  <ListItemLabel>Billing</ListItemLabel>
                </ListItemBody>
              </ListItemLink>
            </ListItem>
            <ListItem>
              <ListItemLink href="#members">
                <ListItemBody>
                  <ListItemLabel>Members</ListItemLabel>
                </ListItemBody>
              </ListItemLink>
            </ListItem>
          </List>
        </nav>
      </Scene>
      <Scene
        label="A role the page wrote itself"
        note="The family writes role='list' because it drew its own marker. A page wiring a menu keeps the role it wrote — the family never overwrites it, and the keyboard that role needs is that page's to add."
      >
        <List aria-label="Row actions" role="menu" variant="framed">
          {plainRows(['Rename', 'Duplicate'])}
        </List>
      </Scene>
    </div>
  ),
};
