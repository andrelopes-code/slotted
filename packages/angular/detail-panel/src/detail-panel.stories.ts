import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePackage } from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { ChangeRequest } from '@slotted/core/state';
import { SlActionBar, SlActionBarAction, SlActionBarActions } from '@slotted/angular/action-bar';
import {
  SlAlert,
  SlAlertActions,
  SlAlertContent,
  SlAlertDescription,
  SlAlertTitle,
} from '@slotted/angular/alert';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlDrawer, SlDrawerBody, SlDrawerClose } from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderBack,
  SlPageHeaderContent,
  SlPageHeaderControls,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderNav,
  SlPageHeaderNavigation,
  SlPageHeaderPin,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlPageHeaderToggle,
  SlPageHeaderVisual,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlSwitch } from '@slotted/angular/switch';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTimeline, SlTimelineItem, SlTimelineList } from '@slotted/angular/timeline';
import { SlToolbar, SlToolbarItem } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { Component, signal, viewChild } from '@angular/core';

import { SlDetailPanel, SlDetailPanelSection } from './detail-panel';
import { provideDetailPanelDefaults } from './detail-panel-defaults';
import type {
  DetailPanelAside,
  DetailPanelLayout,
  DetailPanelLevel,
  DetailPanelMount,
  DetailPanelScroll,
  DetailPanelSize,
  DetailPanelStatus,
} from './detail-panel-defaults';
import {
  SlDetailPanelAside,
  SlDetailPanelBanner,
  SlDetailPanelBody,
  SlDetailPanelFooter,
  SlDetailPanelMessage,
  SlDetailPanelTabs,
} from './detail-panel-parts';
import { ANGULAR_DETAIL_PANEL_DOCS, ANGULAR_DETAIL_PANEL_TOKENS } from './detail-panel.docs';

/* ── One sales order of Nexora Operations ─────────────────────────────── */

const MONEY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });

interface SalesOrder {
  id: string;
  customer: string;
  po: string;
  confirmed: string;
  status: string;
  tone: 'accent' | 'warning' | 'danger';
  total: string;
  delivery: string;
  warehouse: string;
  owner: string;
  team: string;
  terms: string;
  approval: string;
  outstanding: string;
  invoice: string;
}

const ORDERS: SalesOrder[] = [
  {
    id: 'SO-2026-01841',
    customer: 'Northwind Fabrication',
    po: 'NF-2026-118',
    confirmed: '3 de setembro de 2026',
    status: 'Confirmado',
    tone: 'accent',
    total: MONEY.format(12_480),
    delivery: '15 set 2026',
    warehouse: 'Dallas (TX-2)',
    owner: 'Daniel Okafor',
    team: 'Inside sales — South',
    terms: 'Net 45',
    approval: 'Approved · Sep 3',
    outstanding: MONEY.format(12_480),
    invoice: 'INV-2026-02887',
  },
  {
    id: 'SO-2026-01842',
    customer: 'Meridian Controls Group',
    po: 'MCG-77120',
    confirmed: '4 de setembro de 2026',
    status: 'Parcialmente atendido',
    tone: 'warning',
    total: MONEY.format(86_420),
    delivery: '18 set 2026',
    warehouse: 'Columbus (OH-1)',
    owner: 'Priya Raman',
    team: 'Inside sales — Midwest',
    terms: 'Net 30',
    approval: 'Approved · Sep 4',
    outstanding: MONEY.format(41_860),
    invoice: 'INV-2026-02891',
  },
  {
    id: 'SO-2026-01843',
    customer: 'Helios Automation GmbH',
    po: 'HA-DE-2026-Q3-00092817',
    confirmed: '5 de setembro de 2026',
    status: 'Em espera',
    tone: 'danger',
    total: MONEY.format(4_120),
    delivery: '22 set 2026',
    warehouse: 'Columbus (OH-1)',
    owner: 'Martha Silver',
    team: 'Key accounts',
    terms: 'Prepaid',
    approval: 'Pending',
    outstanding: MONEY.format(4_120),
    invoice: '—',
  },
];
const ORDER = ORDERS[1] as SalesOrder;

const LINES = [
  {
    sku: 'MX-240',
    product: 'Servo Motor MX-240',
    quantity: 12,
    fulfilled: 6,
    unit: MONEY.format(3_240),
  },
  {
    sku: 'PLC-8',
    product: 'Controlador PLC-8 Series',
    quantity: 4,
    fulfilled: 4,
    unit: MONEY.format(5_180),
  },
  {
    sku: 'CB-4x15',
    product: 'Cabo blindado 4×1,5 mm²',
    quantity: 30,
    fulfilled: 30,
    unit: MONEY.format(412),
  },
  {
    sku: 'IS-18',
    product: 'Sensor indutivo IS-18',
    quantity: 60,
    fulfilled: 60,
    unit: MONEY.format(148),
  },
];

interface Event {
  title: string;
  description: string | undefined;
  time: string;
  tone: 'warning' | undefined;
  actor: string | undefined;
}

const HISTORY: Event[] = [
  {
    title: 'Partial shipment SHP-009841',
    description: '6 units of the Servo Motor MX-240 pending.',
    time: '2026-09-12T14:20:00Z',
    tone: 'warning',
    actor: undefined,
  },
  {
    title: 'Order confirmed',
    description: undefined,
    time: '2026-09-04T10:02:00Z',
    tone: undefined,
    actor: 'Priya Raman',
  },
  {
    title: 'Order created',
    description: undefined,
    time: '2026-09-03T16:45:00Z',
    tone: undefined,
    actor: 'Daniel Okafor',
  },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const LONG: SalesOrder = {
  ...ORDER,
  id: 'PO-2026-00731',
  customer:
    'Replacement of servo motors, controllers and shielded cabling for line 3 of the Columbus plant after the September audit',
  po: 'HA-DE-2026-Q3-00092817-COLUMBUS-L3-SERVO-PLC-REPL',
};

const PROPS = {
  order: ORDER,
  orders: ORDERS,
  lines: LINES,
  history: HISTORY,
  months: MONTHS,
  long: LONG,
};

const CHEVRON_LEFT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>`;
const CHEVRON_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>`;

/* ── Template fragments ─────────────────────────────────────────────────── */

/**
 * The top of the record: a page-header with the back link, the identifier
 * and the customer, the status as a mark, the actions, the previous and next
 * controls, the facts in the header area, and the strip in the tabs slot —
 * which draws nothing under `layout="stacked"`.
 */
function HEADER(
  options: {
    attributes?: string;
    close?: string;
    navigation?: string;
    strip?: boolean;
  } = {},
  record = 'order',
) {
  return `<header slPageHeader ${options.attributes === undefined ? '' : options.attributes}>
  <div slPageHeaderTitleArea>
    <div slPageHeaderNav><a slPageHeaderBack href="#orders">Sales orders</a></div>
    <div slPageHeaderTitleRow>
      <span slPageHeaderVisual><span slAvatar name="Sales order" shape="square" size="lg" tone="accent"><span slAvatarFallback><ng-icon name="lucidePackage"></ng-icon></span></span></span>
      <div slPageHeaderTitle>
        <h2 slPageHeaderHeading>{{ ${record}.id }} · {{ ${record}.customer }}</h2>
        <span slPageHeaderMarks><span slTag [tone]="${record}.tone" shape="pill" size="sm"><span slTagBody>{{ ${record}.status }}</span></span></span>
        <p slPageHeaderSubheading>Confirmed on {{ ${record}.confirmed }} · Customer PO {{ ${record}.po }}</p>
      </div>
      <div slPageHeaderActions>
        <div slToolbar aria-label="Order actions" overflow="menu">
          <span slToolbarItem><button slButton variant="ghost">Export</button></span>
          <span slToolbarItem><button slButton variant="outline">Issue invoice</button></span>
          <span slToolbarItem><button slButton tone="accent">Create shipment</button></span>
        </div>
        ${options.close === undefined ? '' : options.close}
      </div>
      ${options.navigation === undefined ? '' : options.navigation}
    </div>
  </div>
  <div slPageHeaderArea>
    <div slPageHeaderContent>
      <div slDescriptionList [columns]="3" layout="row">
        <div slDescriptionListItem><dt slDescriptionListTerm>Total</dt><dd slDescriptionListDescription>{{ ${record}.total }}</dd></div>
        <div slDescriptionListItem><dt slDescriptionListTerm>Requested delivery</dt><dd slDescriptionListDescription>{{ ${record}.delivery }}</dd></div>
        <div slDescriptionListItem><dt slDescriptionListTerm>Warehouse</dt><dd slDescriptionListDescription>{{ ${record}.warehouse }}</dd></div>
      </div>
    </div>
  </div>
  <div slPageHeaderControls>
    <button slPageHeaderToggle></button>
    <button slPageHeaderPin></button>
  </div>
  ${options.strip === false ? '' : '<div slDetailPanelTabs label="Order sections"></div>'}
</header>`;
}

const NAVIGATION = `<div slPageHeaderNavigation>
  <button slIconButton aria-label="Previous order" variant="ghost" (click)="previous()">${CHEVRON_LEFT}</button>
  <button slIconButton aria-label="Next order" variant="ghost" (click)="next()">${CHEVRON_RIGHT}</button>
</div>`;

const TABLE = `<div slTable aria-label="Order lines" [columns]="3" variant="plain">
  <div slTableContent>
    <thead slTableHead>
      <tr slTableRow>
        <th slTableColumnHeader>Product</th>
        <th slTableColumnHeader numeric>Qty.</th>
        <th slTableColumnHeader numeric>Unit price</th>
      </tr>
    </thead>
    <tbody slTableBody>
      @for (line of lines; track line.sku) {
        <tr slTableRow [value]="line.sku">
          <th slTableRowHeader>{{ line.product }}</th>
          <td slTableCell numeric>{{ line.fulfilled === line.quantity ? line.quantity : line.fulfilled + ' / ' + line.quantity }}</td>
          <td slTableCell numeric>{{ line.unit }}</td>
        </tr>
      }
    </tbody>
  </div>
</div>`;

const TIMELINE = `<div slTimeline label="Order history" order="newest-first" locale="pt-BR" timeZone="America/Sao_Paulo">
  <ol slTimelineList>
    @for (event of history; track event.time) {
      <li slTimelineItem [title]="event.title" [description]="event.description" [time]="event.time" [tone]="event.tone">
        @if (event.actor) { <div slTimelineActor>{{ event.actor }}</div> }
      </li>
    }
  </ol>
</div>`;

const SECTIONS = `<ng-template #exportActions>
  <button slButton size="sm" variant="outline">Export</button>
  <button slButton size="sm" tone="accent">Add line</button>
</ng-template>
<ng-template slDetailPanelSection name="lines" label="Lines" [count]="lines.length" [actions]="exportActions">${TABLE}</ng-template>
<ng-template slDetailPanelSection name="expedicoes" label="Shipments" [count]="1">
  <p slText size="sm"><strong>SHP-009841</strong> · FedEx Freight · In transit · 3 packages</p>
</ng-template>
<ng-template slDetailPanelSection name="historico" label="History">${TIMELINE}</ng-template>`;

function FIELDS(record = 'order') {
  return `<aside slDetailPanelAside>
  <div slDescriptionList layout="stack">
    <div slDescriptionListItem><dt slDescriptionListTerm>Owner</dt><dd slDescriptionListDescription>{{ ${record}.owner }}</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Team</dt><dd slDescriptionListDescription>{{ ${record}.team }}</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Terms</dt><dd slDescriptionListDescription>{{ ${record}.terms }}</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Approval</dt><dd slDescriptionListDescription>{{ ${record}.approval }}</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Payment</dt><dd slDescriptionListDescription>{{ ${record}.outstanding }} outstanding</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Invoice</dt><dd slDescriptionListDescription copy>{{ ${record}.invoice }}</dd></div>
  </div>
</aside>`;
}

const BANNER = `<div slDetailPanelBanner>
  <section slAlert tone="warning">
    <div slAlertContent>
      <div slAlertTitle>This order was changed by someone else</div>
      <p slAlertDescription>Martha Silver recorded a partial payment 2 minutes ago.</p>
    </div>
    <div slAlertActions><button slButton size="sm" tone="warning">Reload</button></div>
  </section>
</div>`;

const FOOTER = `<footer slDetailPanelFooter>
  <div slActionBar aria-label="Order actions" variant="plain">
    <div slActionBarActions>
      <div slActionBarAction><button slButton tone="secondary" variant="ghost">Close</button></div>
      <div slActionBarAction><button slButton tone="accent">Record payment</button></div>
    </div>
  </div>
</footer>`;

/** The whole record. */
function PANEL(
  options: {
    attributes?: string;
    banner?: string;
    fields?: string;
    footer?: string;
    header?: string;
    record?: string;
    sections?: string;
  } = {},
) {
  return `<article slDetailPanel [recordKey]="${options.record === undefined ? 'order' : options.record}.id" ${options.attributes === undefined ? '' : options.attributes}>
  ${options.header === undefined ? HEADER() : options.header}
  <div slDetailPanelBody>
    ${options.banner === undefined ? '' : options.banner}
    ${options.sections === undefined ? SECTIONS : options.sections}
    ${options.fields === undefined ? FIELDS() : options.fields}
  </div>
  ${options.footer === undefined ? '' : options.footer}
</article>`;
}

function room(body: string, size = 'screen', width = 'tablet') {
  return `<div class="slotted-demo-room" data-room="${width}"><div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="${size}">${body}</div></div>`;
}

function scene(label: string, note: string, body: string, layout = 'block') {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;
}

function grid(columns: 1 | 2 | 3, scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="${columns}">${scenes}</div>`;
}

const PARTS = [
  SlDetailPanel,
  SlDetailPanelSection,
  SlDetailPanelBody,
  SlDetailPanelAside,
  SlDetailPanelBanner,
  SlDetailPanelMessage,
  SlDetailPanelFooter,
  SlDetailPanelTabs,
  SlPageHeader,
  SlPageHeaderTitleArea,
  SlPageHeaderNav,
  SlPageHeaderBack,
  SlPageHeaderTitleRow,
  SlPageHeaderVisual,
  SlPageHeaderTitle,
  SlPageHeaderHeading,
  SlPageHeaderMarks,
  SlPageHeaderSubheading,
  SlPageHeaderActions,
  SlPageHeaderNavigation,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderControls,
  SlPageHeaderToggle,
  SlPageHeaderPin,
  SlAvatar,
  SlAvatarFallback,
  NgIcon,
  SlTag,
  SlTagBody,
  SlButton,
  SlIconButton,
  SlToolbar,
  SlToolbarItem,
  SlDescriptionList,
  SlDescriptionListItem,
  SlDescriptionListTerm,
  SlDescriptionListDescription,
  SlTable,
  SlTableContent,
  SlTableHead,
  SlTableBody,
  SlTableRow,
  SlTableColumnHeader,
  SlTableRowHeader,
  SlTableCell,
  SlTimeline,
  SlTimelineList,
  SlTimelineItem,
  SlAlert,
  SlAlertContent,
  SlAlertTitle,
  SlAlertDescription,
  SlAlertActions,
  SlActionBar,
  SlActionBarActions,
  SlActionBarAction,
  SlResultState,
  SlResultStateContent,
  SlResultStateTitle,
  SlResultStateDescription,
  SlResultStateActions,
  SlPage,
  SlPageBody,
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlSwitch,
  SlStack,
  SlInline,
  SlText,
];

/* ── Interactive demonstrations ────────────────────────────────────────── */

@Component({
  selector: 'sl-detail-panel-records-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: room(
    PANEL({
      attributes: '[layout]="layout"',
      header: HEADER({ navigation: NAVIGATION }, 'order()'),
      fields: FIELDS('order()'),
      record: 'order()',
    }),
  ),
  inputs: ['layout'],
})
class RecordsDemo {
  layout: DetailPanelLayout = 'stacked';
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly index = signal(1);
  readonly order = () => ORDERS[this.index()] as SalesOrder;
  previous() {
    this.index.update((current) => (ORDERS.length + current - 1) % ORDERS.length);
  }
  next() {
    this.index.update((current) => (current + 1) % ORDERS.length);
  }
}

@Component({
  selector: 'sl-detail-panel-model-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: `<div slStack [gap]="5">
    ${room(
      PANEL({
        attributes:
          'layout="tabs" mount="lazy" [section]="section()" (sectionRequest)="onRequest($event)" #panel="slDetailPanel"',
      }),
    )}
    <div slInline [gap]="3">
      <button slButton size="sm" variant="outline" (click)="panel.scrollToSection('historico')">
        scrollToSection('historico')
      </button>
      <button slButton size="sm" variant="outline" (click)="section.set('expedicoes')">
        section = 'expedicoes'
      </button>
    </div>
    <div slStack [gap]="1">
      @if (log().length === 0) {
        <p slText size="sm">No requests yet.</p>
      }
      @for (entry of log(); track $index) {
        <p slText size="sm">{{ entry }}</p>
      }
    </div>
  </div>`,
})
class ModelDemo {
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
  readonly section = signal<string | undefined>('linhas');
  readonly log = signal<string[]>([]);
  onRequest(request: ChangeRequest<string | undefined>) {
    const refused = request.reason === 'keyboard' && request.value === 'historico';
    if (refused) request.cancel();
    this.log.update((entries) =>
      [
        `${request.previous ?? '—'} → ${request.value} · ${request.reason}${refused ? ' · cancelled' : ''}`,
        ...entries,
      ].slice(0, 5),
    );
    if (!refused) this.section.set(request.value);
  }
}

@Component({
  selector: 'sl-detail-panel-stacked-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: `<div slStack [gap]="5">
    ${room(PANEL({ attributes: 'scroll="self" #panel="slDetailPanel"' }))}
    <div slInline [gap]="3">
      <button slButton size="sm" variant="outline" (click)="panel.scrollToSection('historico')">
        Go to history
      </button>
      <button slButton size="sm" variant="outline" (click)="panel.scrollToSection('linhas')">
        Go to lines
      </button>
    </div>
  </div>`,
})
class StackedDemo {
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
}

@Component({
  selector: 'sl-detail-panel-loading-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: `<div slStack [gap]="5">
    <label slSwitch [(checked)]="loading">loading</label>
    ${room(
      PANEL({
        attributes: '[layout]="layout" [loading]="loading()"',
        header: HEADER({ attributes: '[loading]="loading()"' }),
      }),
    )}
  </div>`,
  inputs: ['layout'],
})
class LoadingDemo {
  layout: DetailPanelLayout = 'tabs';
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
  readonly loading = signal(true);
}

@Component({
  selector: 'sl-detail-panel-drawer-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: `<div class="slotted-demo-room" data-room="laptop">
    <div class="slotted-demo-viewport" data-size="screen" data-layout="page" #box>
      <main slPage>
        <div slPageBody>
          <div slStack [gap]="4">
            <p slText>Sales orders · 4,812 records</p>
            <button slButton variant="outline" (click)="open.set(true)">Open SO-2026-01842</button>
          </div>
        </div>
      </main>
      <sl-drawer [container]="box" [(open)]="open" [modal]="false" side="end" size="lg">
        <div slDrawerBody>
          ${PANEL({
            header: HEADER({ close: '<button slDrawerClose></button>' }),
            footer: `<footer slDetailPanelFooter>
  <div slActionBar aria-label="Order actions" variant="plain">
    <div slActionBarActions>
      <div slActionBarAction><button slButton tone="secondary" variant="ghost" (click)="open.set(false)">Close</button></div>
      <div slActionBarAction><button slButton tone="accent">Record payment</button></div>
    </div>
  </div>
</footer>`,
          })}
        </div>
      </sl-drawer>
    </div>
  </div>`,
})
class DrawerDemo {
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
  readonly open = signal(true);
}

@Component({
  selector: 'sl-detail-panel-named-demo',
  standalone: true,
  imports: PARTS,
  providers: [provideIcons({ lucidePackage })],
  template: `<div slStack [gap]="5">
    <button slButton size="sm" variant="outline" (click)="panel()?.focus()">panel.focus()</button>
    ${room(PANEL({ attributes: 'aria-label="Sales order SO-2026-01842"' }))}
  </div>`,
})
class NamedDemo {
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
  readonly panel = viewChild(SlDetailPanel);
}

@Component({
  selector: 'sl-detail-panel-provided-demo',
  standalone: true,
  imports: PARTS,
  providers: [
    provideIcons({ lucidePackage }),
    provideDetailPanelDefaults({ aside: 'start', layout: 'tabs' }),
  ],
  template: `<div slStack [gap]="6">
    ${room(PANEL())}
    ${room(PANEL({ header: HEADER({}, 'first'), fields: FIELDS('first'), record: 'first' }))}
  </div>`,
})
class ProvidedDemo {
  readonly lines = LINES;
  readonly history = HISTORY;
  readonly order = ORDER;
  readonly first = ORDERS[0] as SalesOrder;
}

/* ── The page ───────────────────────────────────────────────────────────── */

interface DetailPanelStoryArgs {
  layout: DetailPanelLayout;
  aside: DetailPanelAside;
  level: DetailPanelLevel;
  size: DetailPanelSize;
  scroll: DetailPanelScroll;
  mount: DetailPanelMount;
  status: DetailPanelStatus;
  loading: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DETAIL_PANEL_DOCS.detailPanel.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    layout: Layout,
    aside: Aside,
    hosts: Hosts,
    navigation: Navigation,
    sections: Sections,
    loading: Loading,
    status: Status,
    banner: Banner,
    footer: Footer,
    sizes: Sizes,
    narrow: Narrow,
    content: Content,
    composition: Composition,
    defaults: Defaults,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<DetailPanelStoryArgs> = {
  title: 'Components/DetailPanel',
  decorators: [
    moduleMetadata({
      imports: [
        ...PARTS,
        RecordsDemo,
        ModelDemo,
        StackedDemo,
        LoadingDemo,
        DrawerDemo,
        NamedDemo,
        ProvidedDemo,
      ],
      providers: [provideIcons({ lucidePackage })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Detail Panel',
        description:
          'One record on screen: what identifies it, what state it is in, what can be done to it, and what happened to it. A page-header on top, sections stacked or tabbed, a column of fields beside them, a footer that stays — the same anatomy in a page, a drawer or a pane.',
        framework: 'Angular',
        ...ANGULAR_DETAIL_PANEL_DOCS.detailPanel,
        tokens: ANGULAR_DETAIL_PANEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DetailPanelStoryArgs>;

export const Playground: Story = {
  args: {
    layout: 'stacked',
    aside: 'end',
    level: '2',
    size: 'md',
    scroll: 'ancestor',
    mount: 'active',
    status: 'ready',
    loading: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...PROPS, ...args },
    template: room(
      PANEL({
        attributes:
          '[layout]="layout" [aside]="aside" [level]="level" [size]="size" [scroll]="scroll" [mount]="mount" [status]="status" [loading]="loading"',
        header: HEADER({ attributes: '[loading]="loading"' }),
      }),
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'Every part, written out',
        'The page-header with its facts and its pill on the chrome’s edge; the banner; three stacked sections at level 3, each with its count and the first with its actions; the aside with a rule beside it; the footer stuck at the bottom while the box scrolls.',
        room(PANEL({ attributes: 'scroll="self"', banner: BANNER, footer: FOOTER })),
      ),
    ),
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'stacked, the default',
        'Each section is a region with a heading at level 3 — one below the panel’s level 2 — its count as a badge after the words and its actions in the heading row. The strip in the header’s tabs slot draws nothing.',
        room(PANEL({ attributes: 'layout="stacked"' })),
      ) +
        scene(
          'tabs',
          'The same three sections: the strip appears at the bottom of the header, the lines section is the tabpanel, its actions move to a row above the table, and the aside stays beside every tab. Press History, or Tab to the strip and press ArrowRight.',
          room(PANEL({ attributes: 'layout="tabs"' })),
        ),
    ),
  }),
};

export const Aside: Story = {
  parameters: scenario('aside'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        "aside='end', the default",
        'The fields at the inline end, the rule on their start edge at the gap’s distance from both columns — Jira’s and GitHub’s sidebar.',
        room(PANEL({ attributes: 'aside="end" layout="tabs"' })),
      ) +
        scene(
          "aside='start'",
          'The fields first, the rule on their end edge — HubSpot’s “about” column. The DOM order does not change: the sections still come first for a reader, and the grid moves the column.',
          room(PANEL({ attributes: 'aside="start" layout="tabs"' })),
        ) +
        scene(
          "aside='none'",
          'No aside is rendered and the sections take the whole width; the grid has one track rather than an empty second one.',
          room(PANEL({ attributes: 'aside="none" layout="tabs"', fields: '' })),
        ),
    ),
  }),
};

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'A page of its own',
        'Inside a page the panel is the content and its level is 1: the page-header is a level 1 heading and the sections level 2. The header sticks under the page’s chrome and the body’s container takes the page’s width and inset, so the columns align with the title.',
        room(`<main slPage>${PANEL({ attributes: 'level="1"' })}</main>`),
      ) +
        scene(
          'A drawer beside the list',
          'The drawer is the host: it scrolls, closes on Escape and gives focus back; its close stands in the header’s actions and Close in the panel’s footer. The panel writes none of that. Close it and open it again from the button.',
          '<sl-detail-panel-drawer-demo></sl-detail-panel-drawer-demo>',
        ) +
        scene(
          'A pane that scrolls itself',
          "scroll='self': the root is the scroll container, a flex parent may shrink it, the page-header sticks inside it and the footer at its bottom edge. This is the second pane of a master–detail split.",
          room(PANEL({ attributes: 'scroll="self"', footer: FOOTER })),
        ),
    ),
  }),
};

export const Navigation: Story = {
  parameters: scenario('navigation'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Three orders, and the controls in the header',
        'Press the next control: the header, the facts and the fields change to the next order, the scroller returns to its start and the heading takes focus — read the focus ring on the title. Tab to the control first and press Enter to hear the new record announced.',
        '<sl-detail-panel-records-demo></sl-detail-panel-records-demo>',
      ),
    ),
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => ({
    template: grid(
      1,
      scene(
        "Controlled, with a reason, and mount='lazy'",
        'The application owns section. The strip asks with pointer or keyboard; the buttons ask with programmatic; the log shows each request. Reaching History by keyboard is refused here — the request is cancelled and the strip stays — while a press is accepted. Lazy: once a tab has been seen its template stays instantiated.',
        '<sl-detail-panel-model-demo></sl-detail-panel-model-demo>',
      ) +
        scene(
          'Stacked: the value is a place',
          'Under stacked the same value scrolls the named section under the sticky header — scroll-margin-block-start reads the chrome’s height — and marks it data-current. No control of the family moves it; a link, the URL or scrollToSection() does.',
          '<sl-detail-panel-stacked-demo></sl-detail-panel-stacked-demo>',
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Tabbed, loading',
        'The heading and the subheading are the page-header’s skeleton, bound on the header; the tab labels stay; the shown section has three placeholder lines and the aside four short ones. Switch it off: the words land and nothing moves.',
        '<sl-detail-panel-loading-demo layout="tabs"></sl-detail-panel-loading-demo>',
      ) +
        scene(
          'Stacked, loading',
          'Every section keeps its heading and its count — the frame is known before the record is — and shows placeholder lines in its body. The template is not instantiated until loading ends.',
          '<sl-detail-panel-loading-demo layout="stacked"></sl-detail-panel-loading-demo>',
        ),
    ),
  }),
};

const NOT_FOUND = `<div slDetailPanelMessage>
  <section slResultState status="not-found">
    <div slResultStateContent>
      <div slResultStateTitle>This order no longer exists</div>
      <p slResultStateDescription>SO-2026-01900 was deleted on September 10 by Priya Raman. The order list has been updated.</p>
    </div>
    <div slResultStateActions><button slButton variant="outline">Back to orders</button></div>
  </section>
</div>`;

const FAILED = `<div slDetailPanelMessage>
  <section slResultState status="error">
    <div slResultStateContent>
      <div slResultStateTitle>Could not load the order</div>
      <p slResultStateDescription>The sales service did not respond. The data in the header is the last known.</p>
    </div>
    <div slResultStateActions><button slButton tone="accent">Try again</button></div>
  </section>
</div>`;

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    props: { ...PROPS, missing: { ...ORDER, id: 'SO-2026-01900', customer: '', status: '' } },
    template: grid(
      1,
      scene(
        "status='not-found'",
        'The record was deleted. The header keeps the identifier and the back link, the message stands where the columns stood with a way back, and the footer’s Close still closes the drawer this would be in.',
        room(
          `<article slDetailPanel status="not-found" recordKey="SO-2026-01900">
  ${HEADER({ strip: false }, 'missing')}
  <div slDetailPanelBody>${NOT_FOUND}</div>
  ${FOOTER}
</article>`,
        ),
      ) +
        scene(
          "status='error'",
          'The request failed, which is a different sentence and a different action: the record exists, and Tentar de novo is the one thing to do. Same chrome, same place.',
          room(
            `<article slDetailPanel status="error" [recordKey]="order.id">
  ${HEADER({ strip: false })}
  <div slDetailPanelBody>${FAILED}</div>
  ${FOOTER}
</article>`,
          ),
        ),
    ),
  }),
};

export const Banner: Story = {
  parameters: scenario('banner'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'An alert in the banner',
        'The record changed on the server while the reader has it open. The alert sits under the sticky header and above the columns, the width of both, in the flow — read before the stale content — and Recarregar is the one action.',
        room(PANEL({ banner: BANNER })),
      ),
    ),
  }),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'An action bar that stays',
        'In a box that scrolls itself the footer stays at the bottom edge, painted so the content passes under it, its action bar aligned with the column above. Scroll to the end: the last section stops above the footer, not behind it.',
        room(PANEL({ attributes: 'scroll="self"', footer: FOOTER })),
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'sm',
        'A record in a narrow drawer: the title on xl, the section headings on md, a 14 rem aside and a tighter gap.',
        room(PANEL({ attributes: 'size="sm"' })),
      ) +
        scene(
          'md, the default',
          'A record in a page or a wide drawer: the title on 2xl, the section headings on lg, a 16 rem aside.',
          room(PANEL({ attributes: 'size="md"' })),
        ) +
        scene(
          'lg',
          'A record that is the screen: the title on 3xl, the section headings on xl, an 18 rem aside and the widest gap.',
          room(PANEL({ attributes: 'size="lg"' })),
        ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'A 375-pixel phone',
        'Below 600 pixels of the root’s own width the columns are one: the fields follow the sections with a rule above them, the header’s actions wrap under the title into the toolbar’s overflow, and every field a desktop reader has is still here.',
        room(PANEL(), 'screen', 'phone'),
      ) +
        scene(
          'The same phone, tabbed',
          'The strip scrolls when the tabs do not fit; the aside follows the shown section. Nothing is hidden by width.',
          room(PANEL({ attributes: 'layout="tabs"' }), 'screen', 'phone'),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'A title of a whole sentence, and a reference with no spaces',
        'The page-header clamps the heading at three lines with the full text in its title attribute; the aside wraps the supplier reference at any character rather than widening its 16 rem track.',
        room(
          PANEL({
            header: HEADER({}, 'long'),
            fields: `<aside slDetailPanelAside>
  <div slDescriptionList layout="stack">
    <div slDescriptionListItem><dt slDescriptionListTerm>Supplier</dt><dd slDescriptionListDescription>Helios Automation GmbH</dd></div>
    <div slDescriptionListItem><dt slDescriptionListTerm>Supplier reference</dt><dd slDescriptionListDescription>{{ long.po }}</dd></div>
  </div>
</aside>`,
            record: 'long',
          }),
        ),
      ) +
        scene(
          'Twelve sections',
          'A record with a section per month: the strip overflows and scrolls with the tabs family’s paging controls, and the section value still names one of them.',
          room(
            `<article slDetailPanel layout="tabs" [recordKey]="order.id">
  ${HEADER()}
  <div slDetailPanelBody>
    @for (month of months; track month; let i = $index) {
      <ng-template slDetailPanelSection [name]="month" [label]="month" [count]="i + 1">
        <p slText size="sm">{{ i + 1 }} order{{ i === 0 ? '' : 's' }} in {{ month }} 2026</p>
      </ng-template>
    }
  </div>
</article>`,
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: PROPS,
    template: grid(
      1,
      scene(
        'The families a record is made of',
        'A table in the lines, a timeline feed in the history, a description list in the aside with a copy control on the invoice, a toolbar with overflow in the header’s actions and a tag in its marks. The panel places each and owns none of their behavior.',
        room(PANEL()),
      ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Two panels under one provider',
        'Neither panel states a layout or an aside side; both read tabbed with the fields at the start. A panel that states its own still wins. The aside’s name comes from the language in force.',
        '<sl-detail-panel-provided-demo></sl-detail-panel-provided-demo>',
      ) +
        scene(
          'The instance',
          'focus() puts focus on the page-header’s heading, which is where a new record starts; scrollToSection() asks with the reason programmatic. A written aria-label replaces the heading wiring on the article.',
          '<sl-detail-panel-named-demo></sl-detail-panel-named-demo>',
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Landmarks and the tab sequence',
        'The article is named by its heading and the aside is a complementary landmark named by the aside message. Tab from the strip’s selected tab: the shown section takes the outward ring, then the table inside it, then the fields. Press next in the header and the heading takes focus.',
        '<sl-detail-panel-records-demo layout="tabs"></sl-detail-panel-records-demo>',
      ),
    ),
  }),
};
