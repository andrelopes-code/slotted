import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlListboxLabel, SlListboxMeta } from '@slotted/angular/listbox';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTransfer, SlTransferFooter, SlTransferItem } from './transfer';
import {
  type TransferItem,
  type TransferLayout,
  type TransferMoveRequest,
  type TransferSide,
  type TransferSize,
} from './transfer-defaults';
import { ANGULAR_TRANSFER_DOCS, ANGULAR_TRANSFER_TOKENS } from './transfer.docs';

/* ── A project team, drawn from an engineering organisation ────────────── */

const PEOPLE: TransferItem[] = [
  { key: 'ana', label: 'Anna Sutton', description: 'Design · Seattle' },
  { key: 'bruno', label: 'Brian Lee', description: 'Platform · Boston' },
  { key: 'carla', label: 'Carol Day', description: 'Platform · Portland' },
  { key: 'daniel', label: 'Daniel Okafor', description: 'Security · Lagos' },
  { key: 'elisa', label: 'Ellis Price', description: 'On leave until 14 October', disabled: true },
  { key: 'fabio', label: 'Frank Nash', description: 'Support · Miami' },
  { key: 'grace', label: 'Grace Park', description: 'Data · Seoul' },
  { key: 'hugo', label: 'Hugh Mathis', description: 'Product · Boston' },
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

/** A transfer over a value this story owns, with the last move written under it. */
@Component({
  selector: 'sl-transfer-team-demo',
  standalone: true,
  imports: [
    SlTransfer,
    SlTransferItem,
    SlTransferFooter,
    SlListboxLabel,
    SlListboxMeta,
    SlStack,
    SlText,
  ],
  template: `
    <div slStack [gap]="3">
      <div
        slTransfer
        aria-label="Project team"
        [items]="items()"
        [(targetKeys)]="keys"
        [defaultSelectedKeys]="selected()"
        [defaultSourceQuery]="sourceQuery()"
        [defaultPane]="startPane()"
        [size]="size()"
        [layout]="layout()"
        [searchable]="searchable()"
        [selectAll]="selectAll()"
        [reorderable]="reorderable()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [invalid]="invalid()"
        [required]="required()"
        [virtual]="virtual()"
        [itemSize]="virtual() ? 34 : undefined"
        [messages]="messages()"
        (targetKeysChangeRequest)="last.set($event)"
      >
        @if (scoped()) {
          <ng-template slTransferItem let-item>
            <span slListboxLabel>{{ item.label }}</span>
            <span slListboxMeta>{{ item.scope }}</span>
          </ng-template>
        }
      </div>
      <p slText size="sm" tone="muted">{{ described() }}</p>
    </div>
  `,
})
class TeamDemo {
  readonly items = input<readonly TransferItem[]>(PEOPLE);
  readonly initial = input<readonly string[]>(TEAM);
  readonly selected = input<readonly string[] | undefined>(undefined);
  readonly sourceQuery = input<string | undefined>(undefined);
  readonly startPane = input<TransferSide | undefined>(undefined);
  readonly size = input<TransferSize | undefined>(undefined);
  readonly layout = input<TransferLayout | undefined>(undefined);
  readonly searchable = input<boolean | undefined>(undefined);
  readonly selectAll = input<boolean | undefined>(undefined);
  readonly reorderable = input<boolean | undefined>(undefined);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly virtual = input(false);
  readonly scoped = input(false);
  readonly messages = input<Record<string, string> | undefined>(undefined);

  protected readonly keys = signal<readonly string[] | undefined>(undefined);
  protected readonly last = signal<TransferMoveRequest | null>(null);
  protected readonly described = computed(() => {
    const request = this.last();
    if (!request) return 'No move yet.';
    return `targetKeysChangeRequest — direction: ${request.direction}, keys: [${request.keys.join(', ')}], reason: ${request.reason}`;
  });

  ngOnInit() {
    this.keys.set(this.initial());
  }
}

/** A source that arrives eight at a time. */
@Component({
  selector: 'sl-transfer-loading-demo',
  standalone: true,
  imports: [SlTransfer],
  template: `<div
    slTransfer
    aria-label="Project team"
    [items]="items()"
    [loading]="loading()"
    [hasMore]="count() < 40"
    (loadMore)="next()"
  ></div>`,
})
class LoadingDemo {
  protected readonly count = signal(8);
  protected readonly loading = signal(false);
  protected readonly items = computed(() => DIRECTORY.slice(0, this.count()));

  next() {
    if (this.loading()) return;
    this.loading.set(true);
    window.setTimeout(() => {
      this.count.update((current) => current + 8);
      this.loading.set(false);
    }, 900);
  }
}

/** The transfer as a reactive form control. */
@Component({
  selector: 'sl-transfer-form-demo',
  standalone: true,
  imports: [SlTransfer, ReactiveFormsModule, SlText],
  template: `<form>
    <div
      slTransfer
      required
      aria-label="Reviewers"
      name="reviewers"
      [items]="people"
      [formControl]="control"
    ></div>
    <p slText size="sm" tone="muted">
      value: [{{ control.value.join(', ') }}] · valid: {{ control.valid }}
    </p>
  </form>`,
})
class FormDemo {
  protected readonly people = PEOPLE;
  protected readonly control = new FormControl<readonly string[]>(['daniel'], {
    nonNullable: true,
  });
}

@Component({
  selector: 'sl-transfer-provided-demo',
  standalone: true,
  imports: [TeamDemo],
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
  template: `<sl-transfer-team-demo
    [items]="permissions"
    [initial]="['customers.read']"
    [messages]="granting"
  />`,
})
class ProvidedDemo {
  protected readonly permissions = PERMISSIONS;
  protected readonly granting = {
    target: 'Concedidas',
    moveToTarget: 'Conceder',
    moveAllToTarget: 'Conceder todas',
    moveToSource: 'Revogar',
    moveAllToSource: 'Revogar todas',
  };
}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

const one = (label: string, note: string, body: string) => ({
  template: grid(scene(label, note, body)),
});

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TRANSFER_DOCS.transfer.scenes, {
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

interface TransferStoryArgs {
  size: TransferSize;
  layout: TransferLayout;
  searchable: boolean;
  selectAll: boolean;
  reorderable: boolean;
}

const meta: Meta<TransferStoryArgs> = {
  title: 'Components/Transfer',
  decorators: [moduleMetadata({ imports: [TeamDemo, LoadingDemo, FormDemo, ProvidedDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Transfer',
        description:
          'Two lists and the moves between them: what is available and what is chosen, each with its search, its count and a select-all box, and the moves in words as well as arrows. Every move is one request carrying the direction, the keys that moved and the reason; a narrow container turns the two columns into two steps.',
        framework: 'Angular',
        ...ANGULAR_TRANSFER_DOCS.transfer,
        tokens: ANGULAR_TRANSFER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TransferStoryArgs>;

export const Playground: Story = {
  args: { size: 'md', layout: 'auto', searchable: true, selectAll: true, reorderable: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    layout: { control: 'inline-radio', options: ['auto', 'columns', 'steps'] },
    searchable: { control: 'boolean' },
    selectAll: { control: 'boolean' },
    reorderable: { control: 'boolean' },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    ...one(
      'Choosing a project team',
      'Select two people and press Add; the move is written under the transfer with its direction, its keys and its reason.',
      `<sl-transfer-team-demo [size]="size" [layout]="layout" [searchable]="searchable" [selectAll]="selectAll" [reorderable]="reorderable" />`,
    ),
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () =>
    one(
      'One selection across both panes',
      'Bruno and Grace are selected on the left and Kenji on the right: each header counts its own half, and the left box is half-filled.',
      `<sl-transfer-team-demo [selected]="['bruno', 'grace', 'kenji']" />`,
    ),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () => ({
    template: grid(
      scene(
        'By name and by team',
        'The source is searched for platform: three people match their description, and Add all would move those three and no one else.',
        `<sl-transfer-team-demo sourceQuery="platform" />`,
      ) +
        scene(
          'Nothing matches',
          'The source is searched for zzz: the count says 0 of 9 shown and the list says No matches over a search mark.',
          `<sl-transfer-team-demo sourceQuery="zzz" />`,
        ),
    ),
  }),
};

export const Order: Story = {
  parameters: scenario('order'),
  render: () => ({
    props: { widgets: WIDGETS },
    template: grid(
      scene(
        'The dashboard’s widgets, in their order',
        'Select Pipeline on the right and press Up, or hold Alt and press ArrowUp in the list. A move from the left joins the end.',
        `<sl-transfer-team-demo [items]="widgets" [initial]="['revenue', 'active', 'conversion', 'pipeline']" [reorderable]="true" [messages]="{ target: 'On the dashboard' }" />`,
      ) +
        scene(
          'The order of the collection',
          'Without reorderable the chosen list follows the collection: Kenji, then Marta, then Ana would be drawn Ana, Kenji, Marta.',
          `<sl-transfer-team-demo [initial]="['kenji', 'marta', 'ana']" />`,
        ),
    ),
  }),
};

export const Drag: Story = {
  parameters: scenario('drag'),
  render: () =>
    one(
      'Drag a person across, or up and down',
      'Select Bruno and Carla, then drag Bruno: both travel. Inside the chosen list the line marks where they land; Escape cancels.',
      `<sl-transfer-team-demo [selected]="['bruno', 'carla']" [reorderable]="true" />`,
    ),
};

export const Steps: Story = {
  parameters: scenario('steps'),
  render: () => ({
    template: grid(
      scene(
        'A phone’s width',
        'The transfer answers its own width: at 375 pixels the switch picks the pane, and Add stands under the list it takes from.',
        `<div class="slotted-demo-room" data-room="phone"><sl-transfer-team-demo /></div>`,
      ) +
        scene(
          'Steps at any width',
          'layout="steps" fixes the answer, for a wizard step or a sheet that is wide enough for columns and should not use them.',
          `<sl-transfer-team-demo layout="steps" startPane="target" />`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      scene(
        'Disabled',
        'Every control stops and both panes take the disabled ground; the lists stay legible.',
        `<sl-transfer-team-demo [disabled]="true" />`,
      ) +
        scene(
          'Read-only',
          'The lists stay reachable and selectable, the counts still count, and every move is refused.',
          `<sl-transfer-team-demo [readOnly]="true" [selected]="['bruno']" />`,
        ) +
        scene(
          'Invalid and required',
          'No reviewer chosen: both panes take the danger edge and both lists say aria-required and aria-invalid.',
          `<sl-transfer-team-demo [initial]="[]" [invalid]="true" [required]="true" />`,
        ),
    ),
  }),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => ({
    props: { directory: DIRECTORY },
    ...one(
      'A directory of two thousand',
      'Both lists are windowed at 34 pixels an option; scroll the left list to the end, type Nadia to jump, and Add all moves every one of them.',
      `<sl-transfer-team-demo [items]="directory" [initial]="[]" [virtual]="true" />`,
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () =>
    one(
      'Eight at a time',
      'Scroll the left list to the end: the loading row asks for the next page, the list is busy while it arrives, and five pages later it stops.',
      `<sl-transfer-loading-demo />`,
    ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { permissions: PERMISSIONS },
    template: grid(
      scene(
        'Permissions, with their scope',
        'The slTransferItem template puts the scope in the listbox’s meta; the long description wraps and the unbroken key breaks rather than escaping the pane.',
        `<sl-transfer-team-demo size="lg" [scoped]="true" [items]="permissions" [initial]="['customers.read']" [messages]="{ source: 'Available permissions', target: 'Granted' }" />`,
      ) +
        scene(
          'A key the collection does not hold',
          'perm_7f3a91 was granted before the list was loaded: it stays in the chosen list, drawn with its key in the muted mono ink.',
          `<sl-transfer-team-demo [items]="permissions" [initial]="['customers.read', 'perm_7f3a91']" />`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () =>
    one(
      'Release reviewers',
      'A FormControl holds the chosen keys; required reports invalid while the list is empty, and name posts one hidden input per person.',
      `<sl-transfer-form-demo />`,
    ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () =>
    one(
      'Granting permissions, in Portuguese',
      'The language in force says every word; this transfer lays Concedidas, Conceder and Revogar over it, and the counts and the announcements follow.',
      `<sl-transfer-provided-demo />`,
    ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () =>
    one(
      'Every move from the keyboard',
      'Tab into the left list, arrow to Bruno and press Enter; Tab to the right list and press Delete; Alt+ArrowUp moves the option you are on.',
      `<sl-transfer-team-demo [reorderable]="true" />`,
    ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () =>
    one(
      'What a screen reader hears',
      'The Available group, the Available listbox, 12 options; after Add, the live region says 2 moved to Chosen.',
      `<sl-transfer-team-demo [selected]="['bruno', 'grace']" />`,
    ),
};
