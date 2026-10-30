import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState, type ReactNode } from 'react';

import { Field, FieldDescription, FieldLabel } from '../field';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { ListboxLabel, ListboxMeta } from '../listbox';
import { Stack } from '../stack';
import { Text } from '../typography';
import { Transfer } from './transfer';
import { REACT_TRANSFER_DOCS, REACT_TRANSFER_TOKENS } from './transfer.docs';
import type {
  TransferItem,
  TransferLayout,
  TransferMoveRequest,
  TransferProps,
  TransferSide,
  TransferSize,
} from './transfer.types';

/* ── A project team, drawn from an engineering organization ────────────── */

const PEOPLE: TransferItem[] = [
  { key: 'ana', label: 'Anna Stone', description: 'Design · Seattle' },
  { key: 'bruno', label: 'Bruce Lane', description: 'Platform · Austin' },
  { key: 'carla', label: 'Carla Day', description: 'Platform · Portland' },
  { key: 'daniel', label: 'Daniel Okafor', description: 'Security · Lagos' },
  { key: 'elisa', label: 'Elise Pratt', description: 'On leave until 14 October', disabled: true },
  { key: 'fabio', label: 'Fabian Nash', description: 'Support · Miami' },
  { key: 'grace', label: 'Grace Park', description: 'Data · Seoul' },
  { key: 'hugo', label: 'Hugh Mason', description: 'Product · Austin' },
  { key: 'iara', label: 'Iara Costa', description: 'Design · Curitiba' },
  { key: 'kenji', label: 'Kenji Mori', description: 'Platform · Osaka' },
  { key: 'marta', label: 'Marta Silva', description: 'Product · Porto' },
  { key: 'nadia', label: 'Nadia Haddad', description: 'Security · Beirut' },
];

const TEAM = ['ana', 'kenji', 'marta'];

const WIDGETS: TransferItem[] = [
  { key: 'revenue', label: 'Revenue', description: 'Month to date, against target' },
  { key: 'active', label: 'Active users', description: 'Daily, rolling 28 days' },
  { key: 'conversion', label: 'Conversion', description: 'Trial to paid' },
  { key: 'pipeline', label: 'Pipeline', description: 'Open deals by stage' },
  { key: 'churn', label: 'Churn', description: 'Logo and revenue churn' },
  { key: 'support', label: 'Support queue', description: 'Open tickets by age' },
  { key: 'nps', label: 'NPS', description: 'Last 90 days' },
];

interface Permission extends TransferItem {
  scope: string;
}

const PERMISSIONS: Permission[] = [
  {
    key: 'billing.invoices.write',
    label: 'billing.invoices.write',
    description: 'Create, edit and void invoices on behalf of every customer account.',
    scope: 'Billing',
  },
  {
    key: 'override',
    label: 'Supercalifragilisticexpialidocious-administrative-override',
    scope: 'Admin',
  },
  { key: 'reports.read', label: 'Read reports', scope: 'Analytics' },
  { key: 'customers.read', label: 'Read customers', scope: 'CRM' },
  { key: 'customers.merge', label: 'Merge duplicate customer records', scope: 'CRM' },
];

const FIRST = [
  'Ana',
  'Bruno',
  'Carla',
  'Daniel',
  'Grace',
  'Hugo',
  'Iara',
  'Kenji',
  'Marta',
  'Nadia',
];
const LAST = [
  'Souza',
  'Lima',
  'Dias',
  'Okafor',
  'Park',
  'Matos',
  'Costa',
  'Mori',
  'Silva',
  'Haddad',
];
const TEAMS = ['Design', 'Platform', 'Security', 'Support', 'Data', 'Product'];
const DIRECTORY: TransferItem[] = Array.from({ length: 2000 }, (_, index) => ({
  key: `p${index}`,
  label: `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]} ${index + 1}`,
  description: TEAMS[index % TEAMS.length],
}));

function describe(request: TransferMoveRequest | null): string {
  if (!request) return 'No move yet.';
  return `onTargetKeysChange — direction: ${request.direction}, keys: [${request.keys.join(', ')}], reason: ${request.reason}`;
}

/** A transfer over a value this story owns, with the last move written under it. */
function Team({
  initial = TEAM,
  items = PEOPLE,
  ...props
}: Partial<TransferProps> & { initial?: readonly string[] }) {
  const [keys, setKeys] = useState<readonly string[]>(initial);
  const [last, setLast] = useState<TransferMoveRequest | null>(null);
  return (
    <Stack gap={3}>
      <Transfer
        aria-label="Project team"
        items={items}
        onTargetKeysChange={(next, request) => {
          setLast(request);
          setKeys(next);
        }}
        targetKeys={keys}
        {...props}
      />
      <Text size="sm" tone="muted">
        {describe(last)}
      </Text>
    </Stack>
  );
}

function One({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        {children}
      </Scene>
    </Grid>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TRANSFER_DOCS.transfer.scenes, {
    playground: Playground,
    selection: Selection,
    search: Search,
    order: Order,
    drag: Drag,
    steps: Steps,
    states: States,
    virtualization: Virtualization,
    loading: Loading,
    content: Content,
    forms: Forms,
    labels: Labels,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

interface PlaygroundArgs {
  size: TransferSize;
  layout: TransferLayout;
  searchable: boolean;
  selectAll: boolean;
  reorderable: boolean;
}

const meta = {
  title: 'Components/Transfer',
  component: Transfer,
  args: { items: PEOPLE as never },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Transfer',
        description:
          'Two lists and the moves between them: what is available and what is chosen, each with its search, its count and a select-all box, and the moves in words as well as arrows. Every move is one request carrying the direction, the keys that moved and the reason; a narrow container turns the two columns into two steps.',
        framework: 'React',
        ...REACT_TRANSFER_DOCS.transfer,
        tokens: REACT_TRANSFER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Transfer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    size: 'md',
    layout: 'auto',
    searchable: true,
    selectAll: true,
    reorderable: false,
  } as never,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    layout: { control: 'inline-radio', options: ['auto', 'columns', 'steps'] },
    searchable: { control: 'boolean' },
    selectAll: { control: 'boolean' },
    reorderable: { control: 'boolean' },
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => {
    const props = args as unknown as PlaygroundArgs;
    return (
      <One
        label="Choosing a project team"
        note="Select two people and press Add; the move is written under the transfer with its direction, its keys and its reason."
      >
        <Team {...props} />
      </One>
    );
  },
};

function SelectionDemo() {
  const [selected, setSelected] = useState<readonly string[]>(['bruno', 'grace', 'kenji']);
  return (
    <Stack gap={3}>
      <Transfer
        aria-label="Project team"
        defaultTargetKeys={TEAM}
        items={PEOPLE}
        onSelectedKeysChange={(keys) => setSelected(keys)}
        selectedKeys={selected}
      />
      <Text size="sm" tone="muted">
        {`selectedKeys: [${selected.join(', ')}]`}
      </Text>
    </Stack>
  );
}

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <One
      label="One selection across both panes"
      note="Bruno and Grace are selected on the left and Kenji on the right: each header counts its own half, and the left box is half-filled."
    >
      <SelectionDemo />
    </One>
  ),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="By name and by team"
        note="The source is searched for platform: three people match their description, and Add all would move those three and no one else."
      >
        <Team defaultSourceQuery="platform" />
      </Scene>
      <Scene
        label="Nothing matches"
        note="The source is searched for zzz: the count says 0 of 9 shown and the list says No matches over a search mark."
      >
        <Team defaultSourceQuery="zzz" />
      </Scene>
    </Grid>
  ),
};

export const Order: Story = {
  parameters: scenario('order'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The dashboard’s widgets, in their order"
        note="Select Pipeline on the right and press Up, or hold Alt and press ArrowUp in the list. A move from the left joins the end."
      >
        <Team
          initial={['revenue', 'active', 'conversion', 'pipeline']}
          items={WIDGETS}
          messages={{ target: 'On the dashboard' }}
          reorderable
        />
      </Scene>
      <Scene
        label="The order of the collection"
        note="Without reorderable the chosen list follows the collection: Kenji, then Marta, then Ana would be drawn Ana, Kenji, Marta."
      >
        <Team initial={['kenji', 'marta', 'ana']} />
      </Scene>
    </Grid>
  ),
};

export const Drag: Story = {
  parameters: scenario('drag'),
  render: () => (
    <One
      label="Drag a person across, or up and down"
      note="Select Bruno and Carla, then drag Bruno: both travel. Inside the chosen list the line marks where they land; Escape cancels."
    >
      <Team defaultSelectedKeys={['bruno', 'carla']} reorderable />
    </One>
  ),
};

function StepsDemo() {
  const [pane, setPane] = useState<TransferSide>('source');
  return (
    <Stack gap={3}>
      <Team onPaneChange={(next) => setPane(next)} pane={pane} />
      <Text size="sm" tone="muted">
        {`pane: ${pane}`}
      </Text>
    </Stack>
  );
}

export const Steps: Story = {
  parameters: scenario('steps'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A phone’s width"
        note="The transfer answers its own width: at 375 pixels the switch picks the pane, and Add stands under the list it takes from."
      >
        <div className="slotted-demo-room" data-room="phone">
          <StepsDemo />
        </div>
      </Scene>
      <Scene
        label="Steps at any width"
        note='layout="steps" fixes the answer, for a wizard step or a sheet that is wide enough for columns and should not use them.'
      >
        <Team layout="steps" defaultPane="target" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Disabled"
        note="Every control stops and both panes take the disabled ground; the lists stay legible."
      >
        <Team disabled />
      </Scene>
      <Scene
        label="Read-only"
        note="The lists stay reachable and selectable, the counts still count, and every move is refused."
      >
        <Team readOnly defaultSelectedKeys={['bruno']} />
      </Scene>
      <Scene
        label="Invalid and required"
        note="No reviewer chosen: both panes take the danger edge and both lists say aria-required and aria-invalid."
      >
        <Team initial={[]} invalid required />
      </Scene>
    </Grid>
  ),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => (
    <One
      label="A directory of two thousand"
      note="Both lists are windowed at 34 pixels an option; scroll the left list to the end, type Nadia to jump, and Add all moves every one of them."
    >
      <Team initial={[]} itemSize={34} items={DIRECTORY} virtual />
    </One>
  ),
};

function LoadingDemo() {
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => DIRECTORY.slice(0, count), [count]);
  return (
    <Team
      hasMore={count < 40}
      initial={[]}
      items={items}
      loading={loading}
      onLoadMore={() => {
        if (loading) return;
        setLoading(true);
        window.setTimeout(() => {
          setCount((current) => current + 8);
          setLoading(false);
        }, 900);
      }}
    />
  );
}

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <One
      label="Eight at a time"
      note="Scroll the left list to the end: the loading row asks for the next page, the list is busy while it arrives, and five pages later it stops."
    >
      <LoadingDemo />
    </One>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Permissions, with their scope"
        note="renderItem puts the scope in the listbox’s meta; the long description wraps and the unbroken key breaks rather than escaping the pane."
      >
        <Team
          initial={['customers.read']}
          items={PERMISSIONS}
          messages={{ source: 'Available permissions', target: 'Granted' }}
          renderItem={(item) => (
            <>
              <ListboxLabel>{item.label}</ListboxLabel>
              <ListboxMeta>{(item as Permission).scope}</ListboxMeta>
            </>
          )}
          size="lg"
        />
      </Scene>
      <Scene
        label="A key the collection does not hold"
        note="perm_7f3a91 was granted before the list was loaded: it stays in the chosen list, drawn with its key in the muted mono ink."
      >
        <Team initial={['customers.read', 'perm_7f3a91']} items={PERMISSIONS} />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <One
      label="Release reviewers"
      note="The field names the transfer and carries its description; submitting posts reviewers once per chosen person."
    >
      <form onSubmit={(event) => event.preventDefault()}>
        <Field required>
          <FieldLabel>Reviewers</FieldLabel>
          <Transfer defaultTargetKeys={['daniel']} items={PEOPLE} name="reviewers" />
          <FieldDescription>At least one reviewer signs the release.</FieldDescription>
        </Field>
      </form>
    </One>
  ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => (
    <One
      label="Granting permissions, in Portuguese"
      note="The language in force says every word; this transfer lays Concedidas, Conceder and Revogar over it, and the counts and the announcements follow."
    >
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Team
          initial={['customers.read']}
          items={PERMISSIONS}
          messages={{
            target: 'Concedidas',
            moveToTarget: 'Conceder',
            moveAllToTarget: 'Conceder todas',
            moveToSource: 'Revogar',
            moveAllToSource: 'Revogar todas',
          }}
        />
      </SlottedProvider>
    </One>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <One
      label="Every move from the keyboard"
      note="Tab into the left list, arrow to Bruno and press Enter; Tab to the right list and press Delete; Alt+ArrowUp moves the option you are on."
    >
      <Team reorderable />
    </One>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <One
      label="What a screen reader hears"
      note="The Available group, the Available listbox, 12 options; after Add, the live region says 2 moved to Chosen."
    >
      <Team defaultSelectedKeys={['bruno', 'grace']} />
    </One>
  ),
};
