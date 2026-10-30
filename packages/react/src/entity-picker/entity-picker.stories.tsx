import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState, type ReactNode } from 'react';

import { Field, FieldDescription, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { EntityPicker } from './entity-picker';
import { REACT_ENTITY_PICKER_DOCS, REACT_ENTITY_PICKER_TOKENS } from './entity-picker.docs';
import type {
  Entity,
  EntityPickerMedia,
  EntityPickerOverflow,
  EntityPickerSize,
  EntityPickerValueRequest,
  EntityPickerVariant,
  EntitySource,
} from './entity-picker.types';
import { localEntitySource, rememberRecent } from '@slotted/core/entity-picker';

/* ── A CRM workspace: people, teams, accounts, deals ──────────────────── */

const PEOPLE: Entity[] = [
  {
    id: 'usr_ana',
    label: 'Ana Souza',
    description: 'ana.souza@northwind.io',
    meta: 'Admin',
    scope: 'people',
  },
  {
    id: 'usr_ana2',
    label: 'Ana Souza',
    description: 'a.souza@partner.example',
    meta: 'Guest',
    scope: 'people',
  },
  { id: 'usr_bruno', label: 'Bruno Lima', description: 'bruno.lima@northwind.io', scope: 'people' },
  {
    id: 'usr_carla',
    label: 'Carla Dias',
    description: 'carla.dias@northwind.io',
    meta: 'Sales',
    scope: 'people',
  },
  {
    id: 'usr_daniel',
    label: 'Daniel Okafor',
    description: 'daniel.okafor@northwind.io',
    scope: 'people',
  },
  {
    id: 'usr_elisa',
    label: 'Elisa Prado',
    description: 'On leave until 14 October',
    disabled: true,
    scope: 'people',
  },
  {
    id: 'usr_fabio',
    label: 'Fabian Nolan',
    description: 'fabian.nolan@northwind.io',
    meta: 'Support',
    scope: 'people',
  },
  { id: 'usr_grace', label: 'Grace Park', description: 'grace.park@northwind.io', scope: 'people' },
  { id: 'usr_hugo', label: 'Hugo Matos', description: 'hugo.matos@northwind.io', scope: 'people' },
  {
    id: 'usr_iara',
    label: 'Iara Costa',
    description: 'iara.costa@northwind.io',
    meta: 'Design',
    scope: 'people',
  },
  { id: 'usr_kenji', label: 'Kenji Mori', description: 'kenji.mori@northwind.io', scope: 'people' },
  {
    id: 'usr_marta',
    label: 'Marta Silva',
    description: 'marta.silva@northwind.io',
    scope: 'people',
  },
  {
    id: 'usr_nadia',
    label: 'Nadia Haddad',
    description: 'nadia.haddad@northwind.io',
    scope: 'people',
  },
  {
    id: 'usr_otavio',
    label: 'Otis Reed',
    description: 'otis.reed@northwind.io',
    scope: 'people',
  },
  {
    id: 'usr_paula',
    label: 'Paula Antunes',
    description: 'paula.antunes@northwind.io',
    scope: 'people',
  },
];

const TEAMS: Entity[] = [
  {
    id: 'team_platform',
    label: 'Platform',
    description: '#platform · 18 members',
    meta: 'Team',
    group: 'Teams',
    avatar: { shape: 'square' },
    scope: 'people',
  },
  {
    id: 'team_design',
    label: 'Design',
    description: '#design · 7 members',
    meta: 'Team',
    group: 'Teams',
    avatar: { shape: 'square' },
    scope: 'people',
  },
];

const ACCOUNTS: Entity[] = [
  {
    id: 'acc_412',
    label: 'Acme Corporation',
    description: 'ACC-00412 · Lisbon',
    meta: 'Customer',
    avatar: null,
    scope: 'accounts',
  },
  {
    id: 'acc_1877',
    label: 'Acme Holdings',
    description: 'ACC-01877 · Porto',
    meta: 'Partner',
    avatar: null,
    scope: 'accounts',
  },
  {
    id: 'acc_2203',
    label: 'Northwind Traders',
    description: 'ACC-02203 · Braga',
    meta: 'Customer',
    avatar: null,
    scope: 'accounts',
  },
  {
    id: 'ct_51',
    label: 'Rita Fonseca',
    description: 'Acme Corporation · Procurement',
    scope: 'contacts',
  },
  { id: 'ct_52', label: 'Thomas Vance', description: 'Northwind Traders · CFO', scope: 'contacts' },
  {
    id: 'deal_88',
    label: 'Acme — 2027 renewal',
    description: 'DEAL-0088 · €184,000',
    meta: 'Negotiation',
    avatar: null,
    scope: 'deals',
  },
];

const INTERNATIONAL: Entity[] = [
  {
    id: 'usr_maria',
    label: 'Maria Eduarda Albuquerque de Vasconcelos Cavalcanti Sobrinho',
    description: 'maria.eduarda.albuquerque.vasconcelos@departamento-juridico.example.com',
    meta: 'Legal',
  },
  { id: 'usr_nour', label: 'نور الهدى العبدالله', description: 'nour@northwind.io' },
  { id: 'usr_zoe', label: 'Zoë Ångström-Łukasiewicz', description: 'zoe.angstrom@northwind.pl' },
  {
    id: 'usr_token',
    label: 'svc_billing_reconciliation_nightly_batch_runner',
    description: 'usr_7f3a9c21e4b04d8f9e1a2b3c4d5e6f70',
    meta: 'Service',
  },
];

const EVERYONE = [...PEOPLE, ...TEAMS];

const STAGES = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
];

interface DirectoryOptions {
  latency?: number;
  fail?: boolean;
  pageSize?: number;
}

/** A remote directory: it waits, it pages, it can fail, and it can lose a record. */
function directory(
  records: readonly Entity[],
  { latency = 400, fail = false, pageSize = 6 }: DirectoryOptions = {},
): EntitySource {
  const local = localEntitySource(records);
  const wait = (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, latency);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
  return {
    search: async (request, { signal }) => {
      await wait(signal);
      if (fail) throw new Error('The directory did not answer');
      const all = await local.search(request, { signal });
      const start = request.page * pageSize;
      return {
        items: all.items.slice(start, start + pageSize),
        total: all.items.length,
        hasMore: start + pageSize < all.items.length,
      };
    },
    resolve: async (ids, { signal }) => {
      await wait(signal);
      return records.filter((record) => ids.includes(record.id));
    },
  };
}

function describe(value: unknown, request: EntityPickerValueRequest<unknown> | null): string {
  if (request === null) return 'No request yet.';
  const names = request.entities.map((entity) => entity.label).join(', ');
  return `onValueChange — value: ${JSON.stringify(value)}, reason: ${request.reason}, entities: [${names}]`;
}

/** A picker over a value this story owns, with the last request written under it. */
function Logged(props: Record<string, unknown> & { initial?: unknown }) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<unknown>(initial);
  const [request, setRequest] = useState<EntityPickerValueRequest<unknown> | null>(null);
  return (
    <Stack gap={3}>
      <EntityPicker
        {...(rest as object)}
        onValueChange={(next: unknown, change: EntityPickerValueRequest<unknown>) => {
          setRequest(change);
          setValue(next);
        }}
        value={value as never}
      />
      <Text size="sm" tone="muted">
        {describe(value, request)}
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
  bindScenes(REACT_ENTITY_PICKER_DOCS['entity-picker'].scenes, {
    playground: Playground,
    single: Single,
    multiple: Multiple,
    'rich-results': RichResults,
    sections: Sections,
    scopes: Scopes,
    async: Async,
    creation: Creation,
    error: ErrorState,
    unresolved: Unresolved,
    limit: Limit,
    sizes: Sizes,
    variants: Variants,
    states: States,
    'long-content': LongContent,
    keyboard: Keyboard,
    form: Form,
    composition: Composition,
  });

interface PlaygroundArgs {
  selectionMode: 'single' | 'multiple';
  size: EntityPickerSize;
  variant: EntityPickerVariant;
  media: EntityPickerMedia;
  overflow: EntityPickerOverflow;
}

const meta = {
  title: 'Components/Entity picker',
  component: EntityPicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Entity picker',
        description:
          'A field that chooses records — people, accounts, teams — from a remote collection. The value is an id, or an array of ids, and every request carries the records behind it; the search, the next page and the resolution of an id are an adapter the family calls with an abort signal. Favorites and recent answer an empty query, a scope stands in front of the field, and a chosen set stays one line.',
        framework: 'React',
        ...REACT_ENTITY_PICKER_DOCS['entity-picker'],
        tokens: REACT_ENTITY_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof EntityPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const DIRECTORY = directory(EVERYONE);

export const Playground: Story = {
  args: {
    selectionMode: 'single',
    size: 'md',
    variant: 'outline',
    media: 'avatar',
    overflow: 'collapse',
  } as never,
  argTypes: {
    selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['outline', 'subtle', 'plain'] },
    media: { control: 'inline-radio', options: ['avatar', 'none'] },
    overflow: { control: 'inline-radio', options: ['collapse', 'wrap'] },
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => {
    const props = args as unknown as PlaygroundArgs;
    return (
      <One
        label="The owner of a deal"
        note="Focus the field, type a name, choose with the arrows and Enter; the request is written under the field with its value, reason and records."
      >
        <Field>
          <FieldLabel>Deal owner</FieldLabel>
          <Logged
            initial={props.selectionMode === 'multiple' ? ['usr_carla'] : 'usr_carla'}
            key={props.selectionMode}
            source={DIRECTORY}
            {...props}
          />
        </Field>
      </One>
    );
  },
};

export const Single: Story = {
  parameters: scenario('single'),
  render: () => (
    <One
      label="An account owner, already chosen"
      note="The face and the name stand in the field; typing searches, and leaving text that chose nothing puts Bruno Lima back."
    >
      <Field>
        <FieldLabel>Account owner</FieldLabel>
        <FieldDescription>Receives renewal reminders for this account.</FieldDescription>
        <EntityPicker defaultValue="usr_bruno" source={DIRECTORY} />
      </Field>
    </One>
  ),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => (
    <One
      label="Reviewers for a contract"
      note="Five reviewers in one line: what does not fit is counted by +N, and pressing it opens the popup on the Chosen section."
    >
      <Field>
        <FieldLabel>Reviewers</FieldLabel>
        <Logged
          initial={['usr_ana', 'usr_bruno', 'usr_carla', 'usr_daniel', 'usr_grace']}
          selectionMode="multiple"
          source={DIRECTORY}
        />
      </Field>
    </One>
  ),
};

export const RichResults: Story = {
  parameters: scenario('rich-results'),
  render: () => (
    <One
      label="Two people of one name"
      note="Type ana: both Ana Souza rows answer, told apart by their address and their role, and the matched span is marked."
    >
      <Field>
        <FieldLabel>Assign to</FieldLabel>
        <EntityPicker defaultInputValue="" items={EVERYONE} searchDelay={0} />
      </Field>
    </One>
  ),
};

function SectionsDemo() {
  const [recent, setRecent] = useState<Entity[]>([PEOPLE[6]!, PEOPLE[9]!]);
  return (
    <Field>
      <FieldLabel>Assignee</FieldLabel>
      <FieldDescription>Favorites and the last five people you chose come first.</FieldDescription>
      <EntityPicker
        favorites={[PEOPLE[0]!, TEAMS[0]!]}
        onValueChange={(_, request) => {
          const chosen = request.entities[0];
          if (chosen !== undefined) setRecent((list) => rememberRecent(list, chosen));
        }}
        recent={recent}
        source={DIRECTORY}
      />
    </Field>
  );
}

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <One
      label="Before anything is typed"
      note="Press the field: Favorites, Recent, then Results for the empty query, and no one twice. Choose someone and they move to the top of Recent."
    >
      <SectionsDemo />
    </One>
  ),
};

const CRM = directory(ACCOUNTS);

export const Scopes: Story = {
  parameters: scenario('scopes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A related record, in one of three scopes"
        note="Switch from Accounts to Contacts: the search runs again with the same text in the new scope."
      >
        <Field>
          <FieldLabel>Related to</FieldLabel>
          <EntityPicker
            defaultScope="accounts"
            scopes={[
              { id: 'accounts', label: 'Accounts' },
              { id: 'contacts', label: 'Contacts' },
              { id: 'deals', label: 'Deals' },
            ]}
            source={CRM}
          />
        </Field>
      </Scene>
      <Scene
        label="The same field in a narrow column"
        note="At 360 pixels the scope yields width and cuts its word; it never takes a row of its own, so the field stays the height of its neighbours."
      >
        <Measure>
          <Field>
            <FieldLabel>Related to</FieldLabel>
            <EntityPicker
              defaultScope="opportunities"
              scopes={[
                { id: 'accounts', label: 'Accounts' },
                { id: 'opportunities', label: 'Opportunities' },
              ]}
              source={CRM}
            />
          </Field>
        </Measure>
      </Scene>
    </Grid>
  ),
};

const SLOW = directory(EVERYONE, { latency: 1400, pageSize: 5 });

export const Async: Story = {
  parameters: scenario('async'),
  render: () => (
    <One
      label="A directory that takes 1.4 seconds"
      note="Press the field: three skeleton records. Type b: the rows recede until the answer lands. Scroll to the end: the next page comes under one skeleton row."
    >
      <Field>
        <FieldLabel>Watcher</FieldLabel>
        <EntityPicker source={SLOW} />
      </Field>
    </One>
  ),
};

function CreationDemo() {
  const [records, setRecords] = useState<Entity[]>(ACCOUNTS.filter((a) => a.scope === 'accounts'));
  const source = useMemo(() => directory(records, { latency: 250 }), [records]);
  return (
    <Field>
      <FieldLabel>Account</FieldLabel>
      <Logged
        onCreate={async (name: string) => {
          const created: Entity = {
            id: `acc_${records.length + 1}`,
            label: name,
            description: `ACC-${String(3000 + records.length)} · New`,
            meta: 'Prospect',
            avatar: null,
          };
          setRecords((list) => [...list, created]);
          return created;
        }}
        source={source}
      />
    </Field>
  );
}

export const Creation: Story = {
  parameters: scenario('creation'),
  render: () => (
    <One
      label="An account the CRM does not hold yet"
      note="Type Zeta Industries and take the last option: the account is created, chosen, and the request says submit."
    >
      <CreationDemo />
    </One>
  ),
};

const OFFLINE = directory(EVERYONE, { fail: true, latency: 300 });

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => (
    <One
      label="The directory is down"
      note="Type any name: the sentence says what failed, and Try again is an option — ArrowDown, then Enter. The chips already chosen stay."
    >
      <Field>
        <FieldLabel>Reviewers</FieldLabel>
        <EntityPicker
          entities={PEOPLE}
          defaultValue={['usr_ana', 'usr_kenji']}
          selectionMode="multiple"
          source={OFFLINE}
        />
      </Field>
    </One>
  ),
};

const RESOLVING = directory(EVERYONE, { latency: 1600 });

export const Unresolved: Story = {
  parameters: scenario('unresolved'),
  render: () => (
    <One
      label="A value that arrives as ids"
      note="Three ids from a server: two resolve after 1.6 seconds, and usr_deleted — an account removed last week — reads Unavailable and can still be removed."
    >
      <Field>
        <FieldLabel>Watchers</FieldLabel>
        <EntityPicker
          defaultValue={['usr_marta', 'usr_deleted', 'usr_hugo']}
          overflow="wrap"
          selectionMode="multiple"
          source={RESOLVING}
        />
      </Field>
    </One>
  ),
};

export const Limit: Story = {
  parameters: scenario('limit'),
  render: () => (
    <One
      label="At most three approvers"
      note="Two are chosen; choose a third and every other record goes unavailable, the announcer says the limit is reached, and removing one opens the list again."
    >
      <Field>
        <FieldLabel>Approvers</FieldLabel>
        <FieldDescription>Up to three people approve a discount above 20%.</FieldDescription>
        <EntityPicker
          defaultValue={['usr_ana', 'usr_carla']}
          max={3}
          selectionMode="multiple"
          source={DIRECTORY}
        />
      </Field>
    </One>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Scene
          key={size}
          label={`size="${size}"`}
          note="Beside a text field of the same step: one height, one type size, the face and the chips from the control scale."
        >
          <Stack gap={3}>
            <EntityPicker
              aria-label={`Owner, ${size}`}
              defaultValue="usr_ana"
              size={size}
              source={DIRECTORY}
            />
            <EntityPicker
              aria-label={`Reviewers, ${size}`}
              defaultValue={['usr_bruno', 'usr_carla']}
              selectionMode="multiple"
              size={size}
              source={DIRECTORY}
            />
            <TextField
              aria-label={`Deal name, ${size}`}
              defaultValue="Acme — 2027 renewal"
              size={size}
            />
          </Stack>
        </Scene>
      ))}
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={1}>
      <Scene label="outline, in a form" note="The default: the control’s edge, ground and lift.">
        <EntityPicker aria-label="Owner" defaultValue="usr_ana" source={DIRECTORY} />
      </Scene>
      <Scene
        label="subtle, on a sunken panel"
        note="The ground sinks with the panel and the edge softens."
      >
        <div className="slotted-demo-surface" data-surface="sunken">
          <EntityPicker
            aria-label="Owner"
            defaultValue="usr_bruno"
            source={DIRECTORY}
            variant="subtle"
          />
        </div>
      </Scene>
      <Scene
        label="plain, in the rows of a deal table"
        note="The row is the box: no edge, no corner, no lift; the frame shows only under the pointer or the caret, and the ring is drawn inward."
        layout="stack"
      >
        <div className="slotted-demo-rows">
          <span>Acme — 2027 renewal</span>
          <EntityPicker
            aria-label="Owner of Acme renewal"
            defaultValue="usr_carla"
            source={DIRECTORY}
            variant="plain"
          />
          <span>Northwind expansion</span>
          <EntityPicker
            aria-label="Owner of Northwind expansion"
            defaultValue="usr_kenji"
            source={DIRECTORY}
            variant="plain"
          />
        </div>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Disabled" note="No popup, no remove buttons, the faces faded with the ink.">
        <EntityPicker
          aria-label="Reviewers, disabled"
          defaultValue={['usr_ana', 'usr_bruno']}
          disabled
          selectionMode="multiple"
          source={DIRECTORY}
        />
      </Scene>
      <Scene
        label="Read-only"
        note="The name stays copyable and focusable; the popup and the removals are withheld."
      >
        <EntityPicker
          aria-label="Owner, read-only"
          defaultValue="usr_grace"
          readOnly
          source={DIRECTORY}
        />
      </Scene>
      <Scene
        label="Invalid and required"
        note="The edge and the ring turn to the danger tone; the field’s message names why."
      >
        <Field invalid required>
          <FieldLabel>Deal owner</FieldLabel>
          <EntityPicker source={DIRECTORY} />
        </Field>
      </Scene>
    </Grid>
  ),
};

const INTERNATIONAL_SOURCE = directory(INTERNATIONAL, { latency: 200 });

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Names nobody wrote for the design"
        note="Open the list: the long name clamps at two lines, the address cuts with an ellipsis, the Arabic name reads right to left, the service token breaks."
      >
        <EntityPicker
          aria-label="Watchers"
          defaultValue={['usr_maria', 'usr_nour', 'usr_zoe', 'usr_token']}
          selectionMode="multiple"
          source={INTERNATIONAL_SOURCE}
        />
      </Scene>
      <Scene
        label="In a 360-pixel column"
        note="The first chip shortens with an ellipsis and +3 keeps its place; the field is still one line."
      >
        <Measure>
          <EntityPicker
            aria-label="Watchers, narrow"
            defaultValue={['usr_maria', 'usr_nour', 'usr_zoe', 'usr_token']}
            selectionMode="multiple"
            source={INTERNATIONAL_SOURCE}
          />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <One
      label="Every key, in multiple"
      note="Tab in, ArrowDown, PageDown, Enter to toggle, Escape to close; with the field empty, Backspace reaches the last chip, ArrowLeft walks the chips and Delete removes one."
    >
      <Field>
        <FieldLabel>Reviewers</FieldLabel>
        <EntityPicker
          defaultValue={['usr_ana', 'usr_bruno']}
          selectionMode="multiple"
          source={DIRECTORY}
        />
      </Field>
    </One>
  ),
};

export const Form: Story = {
  parameters: scenario('form'),
  render: () => (
    <One
      label="A new deal"
      note="The owner and the reviewers stand at the height of the name and the stage beside them; submitted, they send one field per id."
    >
      <form onSubmit={(event) => event.preventDefault()}>
        <Stack gap={4}>
          <Field>
            <FieldLabel>Deal name</FieldLabel>
            <TextField defaultValue="Acme — 2027 renewal" name="name" />
          </Field>
          <Field>
            <FieldLabel>Owner</FieldLabel>
            <EntityPicker defaultValue="usr_carla" name="owner" source={DIRECTORY} />
          </Field>
          <Field>
            <FieldLabel>Reviewers</FieldLabel>
            <EntityPicker
              defaultValue={['usr_ana', 'usr_daniel', 'usr_grace']}
              name="reviewers"
              selectionMode="multiple"
              source={DIRECTORY}
            />
          </Field>
          <Field>
            <FieldLabel>Stage</FieldLabel>
            <Select defaultValue="negotiation" items={STAGES}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Stack>
      </form>
    </One>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="renderOption and renderChip"
        note="The option adds the team after the address; the chip adds the role. The face, the check and the remove button stay the family’s."
      >
        <EntityPicker
          aria-label="Reviewers, composed"
          defaultValue={['usr_ana', 'usr_carla']}
          renderChip={(person) =>
            `${person.label}${person.meta === undefined ? '' : ` · ${person.meta}`}`
          }
          renderOption={(person) => (
            <>
              <span data-part="label" data-part-label="">
                {person.label}
              </span>
              <span
                data-part="description"
                data-part-description=""
              >{`${person.description ?? ''} · Northwind`}</span>
            </>
          )}
          selectionMode="multiple"
          source={DIRECTORY}
        />
      </Scene>
      <Scene
        label="Said once, in Portuguese"
        note="SlottedProvider sets the language for the subtree; the instance keeps its own retry message."
      >
        <SlottedProvider locale="pt-BR">
          <Field>
            <FieldLabel>Owner</FieldLabel>
            <EntityPicker
              favorites={[PEOPLE[0]!]}
              messages={{ retry: 'Buscar outra vez' }}
              source={DIRECTORY}
            />
          </Field>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};
