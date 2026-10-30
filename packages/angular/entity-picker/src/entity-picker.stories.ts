import { Component, computed, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import { localEntitySource, rememberRecent } from '@slotted/core/entity-picker';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlEntityPicker, SlEntityPickerChip, SlEntityPickerOption } from './entity-picker';
import {
  type Entity,
  type EntityPickerMedia,
  type EntityPickerOverflow,
  type EntityPickerSelectionMode,
  type EntityPickerSize,
  type EntityPickerValue,
  type EntityPickerValueRequest,
  type EntityPickerVariant,
  type EntitySource,
} from './entity-picker-defaults';
import { ANGULAR_ENTITY_PICKER_DOCS, ANGULAR_ENTITY_PICKER_TOKENS } from './entity-picker.docs';

/* ── A CRM workspace: people, teams, accounts, deals ──────────────────── */

const PEOPLE: Entity[] = [
  { id: 'usr_ana', label: 'Ana Souza', description: 'ana.souza@northwind.io', meta: 'Admin' },
  { id: 'usr_ana2', label: 'Ana Souza', description: 'a.souza@partner.example', meta: 'Guest' },
  { id: 'usr_bruno', label: 'Bruno Lima', description: 'bruno.lima@northwind.io' },
  { id: 'usr_carla', label: 'Carla Dias', description: 'carla.dias@northwind.io', meta: 'Sales' },
  { id: 'usr_daniel', label: 'Daniel Okafor', description: 'daniel.okafor@northwind.io' },
  {
    id: 'usr_elisa',
    label: 'Elisa Prado',
    description: 'On leave until 14 October',
    disabled: true,
  },
  {
    id: 'usr_fabio',
    label: 'Fabian Nash',
    description: 'fabian.nash@northwind.io',
    meta: 'Support',
  },
  { id: 'usr_grace', label: 'Grace Park', description: 'grace.park@northwind.io' },
  { id: 'usr_hugo', label: 'Hugo Matos', description: 'hugo.matos@northwind.io' },
  { id: 'usr_iara', label: 'Iara Costa', description: 'iara.costa@northwind.io', meta: 'Design' },
  { id: 'usr_kenji', label: 'Kenji Mori', description: 'kenji.mori@northwind.io' },
  { id: 'usr_marta', label: 'Martha Silver', description: 'martha.silver@northwind.io' },
  { id: 'usr_nadia', label: 'Nadia Haddad', description: 'nadia.haddad@northwind.io' },
  { id: 'usr_otavio', label: 'Otto Reed', description: 'otto.reed@northwind.io' },
];

const TEAMS: Entity[] = [
  {
    id: 'team_platform',
    label: 'Platform',
    description: '#platform · 18 members',
    meta: 'Team',
    group: 'Teams',
    avatar: { shape: 'square' },
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

/** A remote directory: it waits, it pages, it can fail, and it can lose a record. */
function directory(
  records: readonly Entity[],
  { latency = 400, fail = false, pageSize = 6 } = {},
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

const SOURCES: Record<string, EntitySource> = {
  directory: directory(EVERYONE),
  crm: directory(ACCOUNTS),
  slow: directory(EVERYONE, { latency: 1400, pageSize: 5 }),
  offline: directory(EVERYONE, { fail: true, latency: 300 }),
  resolving: directory(EVERYONE, { latency: 1600 }),
  international: directory(INTERNATIONAL, { latency: 200 }),
};

/** A picker over a value this story owns, with the last request written under it. */
@Component({
  selector: 'sl-entity-picker-logged-demo',
  standalone: true,
  imports: [SlEntityPicker, SlStack, SlText],
  template: `
    <div slStack [gap]="3">
      <sl-entity-picker
        [aria-label]="label()"
        [selectionMode]="mode()"
        [source]="sourceOf()"
        [defaultValue]="initial()"
        [size]="size()"
        [variant]="variant()"
        [media]="media()"
        [overflow]="overflow()"
        [max]="max()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [entities]="known()"
        (valueChangeRequest)="last.set($event)"
      />
      <p slText size="sm" tone="muted">{{ described() }}</p>
    </div>
  `,
})
class LoggedDemo {
  readonly label = input('Owner');
  readonly mode = input<EntityPickerSelectionMode>('single');
  readonly source = input('directory');
  readonly initial = input<EntityPickerValue | undefined>(undefined);
  readonly size = input<EntityPickerSize | undefined>(undefined);
  readonly variant = input<EntityPickerVariant | undefined>(undefined);
  readonly media = input<EntityPickerMedia | undefined>(undefined);
  readonly overflow = input<EntityPickerOverflow | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly known = input<readonly Entity[]>([]);

  protected readonly sourceOf = computed(() => SOURCES[this.source()]!);
  protected readonly last = signal<EntityPickerValueRequest | null>(null);
  protected readonly described = computed(() => {
    const request = this.last();
    if (request === null) return 'No request yet.';
    const names = request.entities.map((entity) => entity.label).join(', ');
    return `valueChangeRequest — value: ${JSON.stringify(request.value)}, reason: ${request.reason}, entities: [${names}]`;
  });
}

/** Favorites, and a recent list the application keeps with rememberRecent. */
@Component({
  selector: 'sl-entity-picker-sections-demo',
  standalone: true,
  imports: [SlEntityPicker, SlField, SlFieldLabel, SlFieldDescription],
  template: `
    <div slField>
      <label slFieldLabel>Assignee</label>
      <p slFieldDescription>Favorites and the last five people you chose come first.</p>
      <sl-entity-picker
        [favorites]="favorites"
        [recent]="recent()"
        [source]="source"
        (valueChangeRequest)="remember($event)"
      />
    </div>
  `,
})
class SectionsDemo {
  protected readonly favorites = [PEOPLE[0]!, TEAMS[0]!];
  protected readonly recent = signal<Entity[]>([PEOPLE[6]!, PEOPLE[9]!]);
  protected readonly source = SOURCES['directory']!;

  protected remember(request: EntityPickerValueRequest) {
    const chosen = request.entities[0];
    if (chosen !== undefined) this.recent.update((list) => rememberRecent(list, chosen));
  }
}

/** An account the CRM does not hold yet. */
@Component({
  selector: 'sl-entity-picker-creation-demo',
  standalone: true,
  imports: [SlEntityPicker, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Account</label>
      <sl-entity-picker [source]="source()" [createEntity]="createAccount" />
    </div>
  `,
})
class CreationDemo {
  private readonly records = signal<Entity[]>(ACCOUNTS.filter((a) => a.scope === 'accounts'));
  protected readonly source = computed(() => directory(this.records(), { latency: 250 }));
  protected readonly createAccount = async (name: string): Promise<Entity> => {
    const created: Entity = {
      id: `acc_${this.records().length + 1}`,
      label: name,
      description: `ACC-${3000 + this.records().length} · New`,
      meta: 'Prospect',
      avatar: null,
    };
    this.records.update((list) => [...list, created]);
    return created;
  };
}

/** A deal form with Reactive Forms. */
@Component({
  selector: 'sl-entity-picker-form-demo',
  standalone: true,
  imports: [
    SlEntityPicker,
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlTextField,
    SlTextFieldInput,
    SlSelect,
    SlSelectItem,
    SlText,
  ],
  template: `
    <form class="slotted-demo-stack" [formGroup]="form">
      <div slField>
        <label slFieldLabel>Deal name</label>
        <div slTextField><input slTextFieldInput formControlName="name" /></div>
      </div>
      <div slField>
        <label slFieldLabel>Owner</label>
        <sl-entity-picker required [source]="source" formControlName="owner" />
      </div>
      <div slField>
        <label slFieldLabel>Reviewers</label>
        <sl-entity-picker selectionMode="multiple" [source]="source" formControlName="reviewers" />
      </div>
      <div slField>
        <label slFieldLabel>Stage</label>
        <sl-select formControlName="stage">
          <sl-select-item value="qualification" label="Qualification" />
          <sl-select-item value="negotiation" label="Negotiation" />
          <sl-select-item value="won" label="Won" />
        </sl-select>
      </div>
      <p slText size="sm" tone="muted">{{ summary() }}</p>
    </form>
  `,
})
class FormDemo {
  protected readonly source = SOURCES['directory']!;
  protected readonly form = new FormGroup({
    name: new FormControl('Acme — 2027 renewal', { nonNullable: true }),
    owner: new FormControl<EntityPickerValue>('usr_carla', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reviewers: new FormControl<EntityPickerValue>(['usr_ana', 'usr_daniel', 'usr_grace'], {
      nonNullable: true,
    }),
    stage: new FormControl('negotiation', { nonNullable: true }),
  });
  protected summary() {
    return `owner: ${JSON.stringify(this.form.controls.owner.value)} · reviewers: ${JSON.stringify(this.form.controls.reviewers.value)} · valid: ${this.form.valid}`;
  }
}

/** Templates for the option and the chip, under a Portuguese provider. */
@Component({
  selector: 'sl-entity-picker-composition-demo',
  standalone: true,
  imports: [SlEntityPicker, SlEntityPickerOption, SlEntityPickerChip],
  template: `
    <sl-entity-picker
      aria-label="Reviewers, composed"
      selectionMode="multiple"
      [defaultValue]="['usr_ana', 'usr_carla']"
      [source]="source"
    >
      <ng-template slEntityPickerOption let-person>
        <span data-part="label" data-part-label="">{{ person.label }}</span>
        <span data-part="description" data-part-description=""
          >{{ person.description }} · Northwind</span
        >
      </ng-template>
      <ng-template slEntityPickerChip let-person
        >{{ person.label }}{{ person.meta ? ' · ' + person.meta : '' }}</ng-template
      >
    </sl-entity-picker>
  `,
})
class CompositionDemo {
  protected readonly source = SOURCES['directory']!;
}

@Component({
  selector: 'sl-entity-picker-provided-demo',
  standalone: true,
  imports: [SlEntityPicker, SlField, SlFieldLabel],
  providers: [provideSlotted({ locale: 'pt-BR' })],
  template: `
    <div slField>
      <label slFieldLabel>Owner</label>
      <sl-entity-picker
        [favorites]="favorites"
        [messages]="{ retry: 'Buscar outra vez' }"
        [source]="source"
      />
    </div>
  `,
})
class ProvidedDemo {
  protected readonly favorites = [PEOPLE[0]!];
  protected readonly source = SOURCES['directory']!;
}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string, layout = 'block') {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

const one = (label: string, note: string, body: string) => ({
  template: grid(scene(label, note, body)),
});

const field = (label: string, body: string) =>
  `<div slField><label slFieldLabel>${label}</label>${body}</div>`;

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_ENTITY_PICKER_DOCS['entity-picker'].scenes, {
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

interface EntityPickerStoryArgs {
  selectionMode: EntityPickerSelectionMode;
  size: EntityPickerSize;
  variant: EntityPickerVariant;
  media: EntityPickerMedia;
  overflow: EntityPickerOverflow;
}

const meta: Meta<EntityPickerStoryArgs> = {
  title: 'Components/Entity picker',
  decorators: [
    moduleMetadata({
      imports: [
        SlEntityPicker,
        SlField,
        SlFieldLabel,
        SlFieldDescription,
        SlStack,
        SlTextField,
        SlTextFieldInput,
        LoggedDemo,
        SectionsDemo,
        CreationDemo,
        FormDemo,
        CompositionDemo,
        ProvidedDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Entity picker',
        description:
          'A field that chooses records — people, accounts, teams — from a remote collection. The value is an id, or an array of ids, and every request carries the records behind it; the search, the next page and the resolution of an id are an adapter the family calls with an abort signal. Favorites and recent answer an empty query, a scope stands in front of the field, and a chosen set stays one line.',
        framework: 'Angular',
        ...ANGULAR_ENTITY_PICKER_DOCS['entity-picker'],
        tokens: ANGULAR_ENTITY_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<EntityPickerStoryArgs>;

export const Playground: Story = {
  args: {
    selectionMode: 'single',
    size: 'md',
    variant: 'outline',
    media: 'avatar',
    overflow: 'collapse',
  },
  argTypes: {
    selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['outline', 'subtle', 'plain'] },
    media: { control: 'inline-radio', options: ['avatar', 'none'] },
    overflow: { control: 'inline-radio', options: ['collapse', 'wrap'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: {
      ...args,
      initial: args.selectionMode === 'multiple' ? ['usr_carla'] : 'usr_carla',
    },
    template: grid(
      scene(
        'The owner of a deal',
        'Focus the field, type a name, choose with the arrows and Enter; the request is written under the field with its value, reason and records.',
        `<sl-entity-picker-logged-demo label="Deal owner" [mode]="selectionMode" [initial]="initial" [size]="size" [variant]="variant" [media]="media" [overflow]="overflow" />`,
      ),
    ),
  }),
};

export const Single: Story = {
  parameters: scenario('single'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    ...one(
      'An account owner, already chosen',
      'The face and the name stand in the field; typing searches, and leaving text that chose nothing puts Bruno Lima back.',
      `<div slField>
        <label slFieldLabel>Account owner</label>
        <p slFieldDescription>Receives renewal reminders for this account.</p>
        <sl-entity-picker defaultValue="usr_bruno" [source]="source" />
      </div>`,
    ),
  }),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => ({
    props: { initial: ['usr_ana', 'usr_bruno', 'usr_carla', 'usr_daniel', 'usr_grace'] },
    ...one(
      'Reviewers for a contract',
      'Five reviewers in one line: what does not fit is counted by +N, and pressing it opens the popup on the Chosen section.',
      `<sl-entity-picker-logged-demo label="Reviewers" mode="multiple" [initial]="initial" />`,
    ),
  }),
};

export const RichResults: Story = {
  parameters: scenario('rich-results'),
  render: () => ({
    props: { items: EVERYONE },
    ...one(
      'Two people of one name',
      'Type ana: both Ana Souza rows answer, told apart by their address and their role, and the matched span is marked.',
      field('Assign to', `<sl-entity-picker searchDelay="0" [items]="items" />`),
    ),
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () =>
    one(
      'Before anything is typed',
      'Press the field: Favorites, Recent, then Results for the empty query, and no one twice. Choose someone and they move to the top of Recent.',
      `<sl-entity-picker-sections-demo />`,
    ),
};

export const Scopes: Story = {
  parameters: scenario('scopes'),
  render: () => ({
    props: {
      source: SOURCES['crm'],
      scopes: [
        { id: 'accounts', label: 'Accounts' },
        { id: 'contacts', label: 'Contacts' },
        { id: 'deals', label: 'Deals' },
      ],
      narrowScopes: [
        { id: 'accounts', label: 'Accounts' },
        { id: 'opportunities', label: 'Opportunities' },
      ],
    },
    template: grid(
      scene(
        'A related record, in one of three scopes',
        'Switch from Accounts to Contacts: the search runs again with the same text in the new scope.',
        field(
          'Related to',
          `<sl-entity-picker [scopes]="scopes" [scope]="'accounts'" [source]="source" />`,
        ),
      ) +
        scene(
          'The same field in a narrow column',
          'In a 360-pixel column the scope yields width and cuts its word; it never takes a row of its own.',
          `<div class="slotted-demo-measure">${field(
            'Related to',
            `<sl-entity-picker [scopes]="narrowScopes" [scope]="'opportunities'" [source]="source" />`,
          )}</div>`,
        ),
    ),
  }),
};

export const Async: Story = {
  parameters: scenario('async'),
  render: () => ({
    props: { source: SOURCES['slow'] },
    ...one(
      'A directory that takes 1.4 seconds',
      'Press the field: three skeleton records. Type b: the rows recede until the answer lands. Scroll to the end: the next page comes under one skeleton row.',
      field('Watcher', `<sl-entity-picker [source]="source" />`),
    ),
  }),
};

export const Creation: Story = {
  parameters: scenario('creation'),
  render: () =>
    one(
      'An account the CRM does not hold yet',
      'Type Zeta Industries and take the last option: the account is created, chosen, and the request says submit.',
      `<sl-entity-picker-creation-demo />`,
    ),
};

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => ({
    props: { source: SOURCES['offline'], people: PEOPLE },
    ...one(
      'The directory is down',
      'Type any name: the sentence says what failed, and Try again is an option — ArrowDown, then Enter. The chips already chosen stay.',
      field(
        'Reviewers',
        `<sl-entity-picker selectionMode="multiple" [entities]="people" [defaultValue]="['usr_ana', 'usr_kenji']" [source]="source" />`,
      ),
    ),
  }),
};

export const Unresolved: Story = {
  parameters: scenario('unresolved'),
  render: () => ({
    props: { source: SOURCES['resolving'] },
    ...one(
      'A value that arrives as ids',
      'Three ids from a server: two resolve after 1.6 seconds, and usr_deleted — an account removed last week — reads Unavailable and can still be removed.',
      field(
        'Watchers',
        `<sl-entity-picker selectionMode="multiple" overflow="wrap" [defaultValue]="['usr_marta', 'usr_deleted', 'usr_hugo']" [source]="source" />`,
      ),
    ),
  }),
};

export const Limit: Story = {
  parameters: scenario('limit'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    ...one(
      'At most three approvers',
      'Two are chosen; choose a third and every other record goes unavailable, the announcer says the limit is reached, and removing one opens the list again.',
      `<div slField>
        <label slFieldLabel>Approvers</label>
        <p slFieldDescription>Up to three people approve a discount above 20%.</p>
        <sl-entity-picker selectionMode="multiple" max="3" [defaultValue]="['usr_ana', 'usr_carla']" [source]="source" />
      </div>`,
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    template: grid(
      (['sm', 'md', 'lg'] as const)
        .map((size) =>
          scene(
            `size="${size}"`,
            'Beside a text field of the same step: one height, one type size, the face and the chips from the control scale.',
            `<div slStack [gap]="3">
              <sl-entity-picker aria-label="Owner, ${size}" size="${size}" defaultValue="usr_ana" [source]="source" />
              <sl-entity-picker aria-label="Reviewers, ${size}" size="${size}" selectionMode="multiple" [defaultValue]="['usr_bruno', 'usr_carla']" [source]="source" />
              <div slTextField size="${size}"><input slTextFieldInput aria-label="Deal name, ${size}" value="Acme — 2027 renewal" /></div>
            </div>`,
          ),
        )
        .join(''),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    template: grid(
      scene(
        'outline, in a form',
        'The default: the control’s edge, ground and lift.',
        `<sl-entity-picker aria-label="Owner" defaultValue="usr_ana" [source]="source" />`,
      ) +
        scene(
          'subtle, on a sunken panel',
          'The ground sinks with the panel and the edge softens.',
          `<div class="slotted-demo-surface" data-surface="sunken"><sl-entity-picker aria-label="Owner" variant="subtle" defaultValue="usr_bruno" [source]="source" /></div>`,
        ) +
        scene(
          'plain, in the rows of a deal table',
          'The row is the box: no edge, no corner, no lift; the frame shows only under the pointer or the caret, and the ring is drawn inward.',
          `<div class="slotted-demo-rows">
            <span>Acme — 2027 renewal</span>
            <sl-entity-picker aria-label="Owner of Acme renewal" variant="plain" defaultValue="usr_carla" [source]="source" />
            <span>Northwind expansion</span>
            <sl-entity-picker aria-label="Owner of Northwind expansion" variant="plain" defaultValue="usr_kenji" [source]="source" />
          </div>`,
          'stack',
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    template: grid(
      scene(
        'Disabled',
        'No popup, no remove buttons, the faces faded with the ink.',
        `<sl-entity-picker aria-label="Reviewers, disabled" disabled selectionMode="multiple" [defaultValue]="['usr_ana', 'usr_bruno']" [source]="source" />`,
      ) +
        scene(
          'Read-only',
          'The name stays copyable and focusable; the popup and the removals are withheld.',
          `<sl-entity-picker aria-label="Owner, read-only" readOnly defaultValue="usr_grace" [source]="source" />`,
        ) +
        scene(
          'Invalid and required',
          'The edge and the ring turn to the danger tone; the field’s message names why.',
          `<div slField invalid required><label slFieldLabel>Deal owner</label><sl-entity-picker [source]="source" /></div>`,
        ),
    ),
  }),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: () => ({
    props: {
      source: SOURCES['international'],
      chosen: ['usr_maria', 'usr_nour', 'usr_zoe', 'usr_token'],
    },
    template: grid(
      scene(
        'Names nobody wrote for the design',
        'Open the list: the long name clamps at two lines, the address cuts with an ellipsis, the Arabic name reads right to left, the service token breaks.',
        `<sl-entity-picker aria-label="Watchers" selectionMode="multiple" [defaultValue]="chosen" [source]="source" />`,
      ) +
        scene(
          'In a 360-pixel column',
          'The first chip shortens with an ellipsis and +3 keeps its place; the field is still one line.',
          `<div class="slotted-demo-measure"><sl-entity-picker aria-label="Watchers, narrow" selectionMode="multiple" [defaultValue]="chosen" [source]="source" /></div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { source: SOURCES['directory'] },
    ...one(
      'Every key, in multiple',
      'Tab in, ArrowDown, PageDown, Enter to toggle, Escape to close; with the field empty, Backspace reaches the last chip, ArrowLeft walks the chips and Delete removes one.',
      field(
        'Reviewers',
        `<sl-entity-picker selectionMode="multiple" [defaultValue]="['usr_ana', 'usr_bruno']" [source]="source" />`,
      ),
    ),
  }),
};

export const Form: Story = {
  parameters: scenario('form'),
  render: () =>
    one(
      'A new deal',
      'The owner and the reviewers are Reactive Forms controls, required and validated, at the height of the name and the stage beside them.',
      `<sl-entity-picker-form-demo />`,
    ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      scene(
        'Option and chip templates',
        'The option adds the team after the address; the chip adds the role. The face, the check and the remove button stay the family’s.',
        `<sl-entity-picker-composition-demo />`,
      ) +
        scene(
          'Said once, in Portuguese',
          'provideSlotted sets the language for the subtree; the instance keeps its own retry message.',
          `<sl-entity-picker-provided-demo />`,
        ),
    ),
  }),
};
