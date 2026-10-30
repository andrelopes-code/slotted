import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBadgeCheck,
  lucideBanknote,
  lucideBell,
  lucideCalendarDays,
  lucideChartNoAxesColumn,
  lucideChevronsUpDown,
  lucideCircleCheck,
  lucideCircleHelp,
  lucideClipboardList,
  lucideFileText,
  lucideFilter,
  lucideFolderKanban,
  lucideHandshake,
  lucideInbox,
  lucideKanban,
  lucideLayoutDashboard,
  lucideLifeBuoy,
  lucideMap,
  lucidePackage,
  lucidePill,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSettings,
  lucideStethoscope,
  lucideTruck,
  lucideUndo2,
  lucideUsers,
  lucideWallet,
  lucideWarehouse,
} from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlButton, SlButtonStart, SlIconButton } from '@slotted/angular/button';
import { SlContainer } from '@slotted/angular/container';
import { SlDrawer, SlDrawerBody, SlDrawerTrigger } from '@slotted/angular/drawer';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlShortcut } from '@slotted/angular/kbd';
import { SlPage, SlPageBody, SlPageFooter } from '@slotted/angular/page';
import {
  SlSideNavigation,
  SlSideNavigationCount,
  SlSideNavigationEnd,
  SlSideNavigationIcon,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
} from '@slotted/angular/side-navigation';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderHeading,
  SlPageHeaderProgress,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import {
  SlTextField,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
} from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlAppShell,
  SlAppShellActions,
  SlAppShellAside,
  SlAppShellAsideBody,
  SlAppShellAsideFooter,
  SlAppShellAsideHeader,
  SlAppShellAsideResizer,
  SlAppShellAsideToggle,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellCenter,
  SlAppShellFooter,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavFooter,
  SlAppShellNavHeader,
  SlAppShellNavRail,
  SlAppShellNavToggle,
  SlAppShellProgress,
} from './app-shell';
import { provideAppShellDefaults } from './app-shell-defaults';
import { ANGULAR_APP_SHELL_DOCS, ANGULAR_APP_SHELL_TOKENS } from './app-shell.docs';

/* ── What every product is built from ─────────────────────────────────────── */

const MONEY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface Destination {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly count: number | null;
  readonly tone: 'accent' | 'secondary';
}

const item = (
  id: string,
  label: string,
  icon: string,
  count: number | null = null,
  tone: 'accent' | 'secondary' = 'secondary',
): Destination => ({ id, label, icon, count, tone });

/** A two-line row pinned at either end of the column. */
const account = (
  label: string,
  initials: string,
  name: string,
  role: string,
  avatar = 'size="sm" tone="secondary" variant="soft"',
) => `<button type="button" class="slotted-demo-nav-brand slotted-demo-nav-account" aria-label="${label}">
  <span class="slotted-demo-nav-item__mark"><span slAvatar ${avatar}><span slAvatarFallback>${initials}</span></span></span>
  <span class="slotted-demo-nav-aside">
    <span slText size="sm" tone="default" weight="medium">${name}</span>
    <span slText size="xs" tone="muted">${role}</span>
  </span>
  <span class="slotted-demo-nav-account__more"><ng-icon name="lucideChevronsUpDown" size="14" /></span>
</button>`;

/**
 * A run of destinations, read from a property of the story's data. It is
 * `side-navigation` inside the shell's nav region: rows on the geometry the
 * shell publishes, and the rail read from the region's own width.
 */
const items = (source: string) => `@for (item of ${source}; track item.id) {
  <li slSideNavigationItem [value]="item.id">
    <a slSideNavigationLink [href]="'#' + item.id">
      <span slSideNavigationIcon><ng-icon [name]="item.icon" size="16" /></span>
      <span slSideNavigationLabel>{{ item.label }}</span>
      @if (item.count !== null && item.tone === 'accent') {
        <span slSideNavigationEnd><span slBadge size="sm" tone="accent" variant="solid">{{ item.count }}</span></span>
      } @else if (item.count !== null) {
        <span slSideNavigationCount>{{ item.count }}</span>
      }
    </a>
  </li>
}`;

/** A titled section of destinations, or an untitled list at the top of the column. */
const section = (label: string | null, source: string) =>
  label === null
    ? `<ul slSideNavigationList>${items(source)}</ul>`
    : `<div slSideNavigationSection>
  <div slSideNavigationSectionLabel>${label}</div>
  <ul slSideNavigationList>${items(source)}</ul>
</div>`;

/** The column: a div, because the shell's region is already the landmark. */
const column = (...sections: string[]) =>
  `<div slSideNavigation [value]="current()">${sections.join('')}</div>`;

/**
 * A shell owns a screen, so every scene stands in a window the height of one,
 * and in a room the width of one: the docs column is 676 pixels at 1280, and a
 * column, a content card and a pane squeezed into it drew a content column a
 * few dozen pixels wide. `room = ''` is for the frame a scene measures narrow
 * on purpose.
 */
const viewport = (body: string, size = 'screen', room = 'desktop') => {
  const frame = `<div class="slotted-demo-viewport" data-frame="window" data-layout="page" data-size="${size}">${body}</div>`;
  return room === '' ? frame : `<div class="slotted-demo-room" data-room="${room}">${frame}</div>`;
};

const scene = (label: string, note: string, body: string) => `<section class="slotted-demo-scene">
  <header class="slotted-demo-scene__header">
    <span class="slotted-demo-scene__label">${label}</span>
    <span class="slotted-demo-scene__note">${note}</span>
  </header>
  <div class="slotted-demo-stage" data-layout="block">${body}</div>
</section>`;

const grid = (...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="1">${scenes.join('')}</div>`;

/* ── Aurora Logistics: the back office ────────────────────────────────────── */

const AURORA = [
  item('dashboard', 'Dashboard', 'lucideLayoutDashboard'),
  item('shipments', 'Shipments', 'lucideTruck', 19),
  item('orders', 'Orders', 'lucidePackage', 412),
  item('warehouses', 'Warehouses', 'lucideWarehouse'),
  item('customers', 'Customers', 'lucideUsers'),
  item('billing', 'Billing', 'lucideFileText', 7),
  item('reports', 'Reports', 'lucideChartNoAxesColumn'),
] as const;

const AURORA_LONG = AURORA.map((entry) =>
  entry.id === 'expedicoes'
    ? { ...entry, label: 'Sendungsverfolgung' }
    : entry.id === 'faturacao'
      ? { ...entry, label: 'Rechnungsstellung und Mahnwesen' }
      : entry,
);

const AURORA_SYSTEM = [
  item('definicoes', 'Settings', 'lucideSettings'),
  item('suporte', 'Support', 'lucideLifeBuoy'),
] as const;

const SHIPMENTS = [
  {
    id: 'ORD-4521',
    customer: 'Sherman Metalworks',
    route: 'Portland → Boise',
    carrier: 'Transcontinental Freight',
    weight: '3,240 kg',
    due: 'Sep 16, 14:00',
    value: 18420.5,
    state: 'in transit',
    tone: 'accent',
  },
  {
    id: 'ENC-4522',
    customer: 'Cooperativa do Vouga',
    route: 'Aveiro → Vigo',
    carrier: 'Galitrans',
    weight: '860 kg',
    due: '15 set, 09:30',
    value: 2380,
    state: 'at risk',
    tone: 'danger',
  },
  {
    id: 'ORD-4523',
    customer: 'Beacon Pharma',
    route: 'Denver → Madrid',
    carrier: 'Transcontinental Freight',
    weight: '1,120 kg',
    due: 'Sep 17, 11:00',
    value: 41290.9,
    state: 'pending',
    tone: 'warning',
  },
  {
    id: 'ORD-4524',
    customer: 'Avon Textiles',
    route: 'Dallas → Lyon',
    carrier: '—',
    weight: '4,800 kg',
    due: '19 set',
    value: null,
    state: 'pending',
    tone: 'warning',
  },
  {
    id: 'ORD-4519',
    customer: 'Atlantic Distribution',
    route: 'Tacoma → Honolulu',
    carrier: 'Pacific Lines',
    weight: '12,400 kg',
    due: 'Sep 12, 16:20',
    value: 7640.25,
    state: 'delivered',
    tone: 'success',
  },
] as const;

const AURORA_NAV = (
  source = 'destinations',
  toggleInFooter = false,
) => `<nav slAppShellNav class="slotted-demo-nav">
  <div slAppShellNavHeader>
    ${account('Aurora Logistics — switch workspace', 'AL', 'Aurora Logistics', 'Portland · Operations', 'shape="square" size="sm" tone="accent" variant="solid"')}
  </div>
  <div slAppShellNavBody>
    ${column(section('Operations', source), section('System', 'system'))}
  </div>
  <div slAppShellNavFooter>
    ${toggleInFooter ? '<button slAppShellNavToggle></button>' : ''}
    ${account('Anna Bell — open account menu', 'AB', 'Anna Bell', 'Coordinator')}
  </div>
</nav>`;

const AURORA_BANNER = ({ center = true, toggle = true } = {}) => `<header slAppShellBanner>
  <div slAppShellBrand>
    ${toggle ? '<button slAppShellNavToggle></button>' : ''}
    <span class="slotted-demo-bar-wordmark">Aurora</span>
  </div>
  ${
    center
      ? `<div slAppShellCenter>
    <div slTextField class="slotted-demo-bar-search" size="sm" variant="subtle">
      <span slTextFieldStart><ng-icon name="lucideSearch" size="14" /></span>
      <input slTextFieldInput type="search" aria-label="Search" placeholder="Search orders, customers…" />
      <span slTextFieldEnd><kbd slShortcut keys="mod+k" size="sm" variant="soft"></kbd></span>
    </div>
  </div>`
      : ''
  }
  <div slAppShellActions>
    <button slIconButton class="slotted-demo-bar-optional" aria-label="Notifications — 3 unread" size="sm" tone="secondary" variant="ghost"><ng-icon name="lucideBell" size="16" /></button>
    <button slIconButton class="slotted-demo-bar-optional" aria-label="Help" size="sm" tone="secondary" variant="ghost"><ng-icon name="lucideCircleHelp" size="16" /></button>
    <span slAvatar size="sm" tone="accent" variant="soft"><span slAvatarFallback>AB</span></span>
  </div>
</header>`;

const SHIPMENTS_TABLE = (
  selection = '',
) => `<div slTable [columns]="4" variant="ruled" ${selection}>
  <div slTableContent>
    <caption slTableCaption>Encomendas em curso</caption>
    <thead slTableHead>
      <tr slTableRow>
        <th slTableColumnHeader>Order</th>
        <th slTableColumnHeader>Customer</th>
        <th slTableColumnHeader numeric>Amount</th>
        <th slTableColumnHeader>Status</th>
      </tr>
    </thead>
    <tbody slTableBody>
      @for (row of shipments; track row.id) {
        <tr slTableRow [value]="row.id">
          <th slTableRowHeader>{{ row.id }}</th>
          <td slTableCell>{{ row.customer }}</td>
          <td slTableCell numeric>{{ row.value === null ? '—' : money.format(row.value) }}</td>
          <td slTableCell><span slTag shape="pill" size="sm" [tone]="row.tone" variant="soft"><span slTagBody>{{ row.state }}</span></span></td>
        </tr>
      }
    </tbody>
  </div>
</div>`;

const AURORA_CONTENT = (
  body = SHIPMENTS_TABLE(),
  title = 'Encomendas',
  headerProgress = '',
) => `<main slPage landmark="none" scroll="ancestor" width="full">
  <header slPageHeader level="1" size="md">
    <div slPageHeaderTitleArea>
      <div slPageHeaderTitleRow>
        <div slPageHeaderTitle>
          <h1 slPageHeaderHeading>${title}</h1>
          <p slPageHeaderSubheading>412 in progress · 19 awaiting carrier confirmation</p>
        </div>
        <div slPageHeaderActions><button slButton size="sm" tone="secondary" variant="outline">Filters</button></div>
      </div>
    </div>
    ${headerProgress}
  </header>
  <div slPageBody>${body}</div>
  <footer slPageFooter>
    <button slButton size="sm" tone="secondary" variant="ghost">Exportar</button>
    <button slButton size="sm" tone="accent">Nova encomenda</button>
  </footer>
</main>`;

const AURORA_PANE = `<aside slAppShellAside>
  <div slAppShellAsideHeader>
    <span class="slotted-demo-pane-title">{{ selectedRow().id }} · {{ selectedRow().customer }}</span>
    <button slAppShellAsideToggle></button>
  </div>
  <div slAppShellAsideBody>
    <dl class="slotted-demo-pane-fields">
      <dt>Rota</dt><dd>{{ selectedRow().route }}</dd>
      <dt>Transportador</dt><dd>{{ selectedRow().carrier }}</dd>
      <dt>Weight</dt><dd>{{ selectedRow().weight }}</dd>
      <dt>Amount</dt><dd>{{ selectedRow().value === null ? '—' : money.format(selectedRow().value) }}</dd>
      <dt>Expected delivery</dt><dd>{{ selectedRow().due }}</dd>
      <dt>Status</dt><dd><span slTag shape="pill" size="sm" [tone]="selectedRow().tone" variant="soft"><span slTagBody>{{ selectedRow().state }}</span></span></dd>
    </dl>
  </div>
  <div slAppShellAsideFooter>
    <button slButton size="sm" tone="secondary" variant="outline">Rastrear</button>
    <button slButton size="sm" tone="accent">Confirmar</button>
  </div>
</aside>`;

/** The pane with its edge: rendering the resizer is the whole of that capability. */
const AURORA_PANE_RESIZABLE = AURORA_PANE.replace(
  '<aside slAppShellAside>',
  '<aside slAppShellAside>\n  <div slAppShellAsideResizer></div>',
);

const AURORA_FOOTER = `<footer slAppShellFooter>
  <span slText size="xs" tone="muted">Aurora 4.2.0 · Production environment · Signed in at 08:14</span>
</footer>`;

const aurora = (
  attributes = '',
  {
    aside = true,
    center = true,
    content = AURORA_CONTENT(),
    footer = false,
    nav = AURORA_NAV(),
    progress = '',
    room = 'desktop',
    size = 'screen',
    toggle = true,
  } = {},
) =>
  viewport(
    `<div slAppShell ${attributes}>
  ${AURORA_BANNER({ center, toggle })}
  ${nav}
  <main slAppShellMain>${content}</main>
  ${progress}
  ${aside ? AURORA_PANE : ''}
  ${footer ? AURORA_FOOTER : ''}
</div>`,
    size,
    room,
  );

/* ── Aurora with a navigation of two levels ───────────────────────────────── */

interface NavGroup {
  readonly label: string | null;
  readonly items: readonly Destination[];
}

interface Module {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly current: string;
  readonly groups: readonly NavGroup[];
}

const MODULES: readonly Module[] = [
  {
    id: 'operacao',
    label: 'Operations',
    icon: 'lucideTruck',
    current: 'encomendas',
    groups: [
      {
        label: null,
        items: [
          item('dashboard', 'Dashboard', 'lucideLayoutDashboard'),
          item('shipments', 'Shipments', 'lucideTruck', 19),
          item('orders', 'Orders', 'lucidePackage', 412),
        ],
      },
      {
        label: 'Warehouse',
        items: [
          item('armazens', 'Warehouses', 'lucideWarehouse'),
          item('devolucoes', 'Returns', 'lucideUndo2', 4, 'accent'),
          item('inventario', 'Inventory', 'lucideClipboardList'),
        ],
      },
    ],
  },
  {
    id: 'financas',
    label: 'Finance',
    icon: 'lucideWallet',
    current: 'faturacao',
    groups: [
      {
        label: null,
        items: [
          item('faturacao', 'Billing', 'lucideFileText', 7),
          item('recebimentos', 'Receipts', 'lucideBanknote'),
          item('despesas', 'Expenses', 'lucideWallet'),
        ],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'lucideUsers',
    current: 'accounts',
    groups: [
      {
        label: null,
        items: [
          item('contas', 'Contas', 'lucideUsers', 86),
          item('contratos', 'Contratos', 'lucideHandshake'),
          item('qualidade', 'Qualidade', 'lucideBadgeCheck'),
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'lucideChartNoAxesColumn',
    current: 'desempenho',
    groups: [
      {
        label: null,
        items: [
          item('desempenho', 'Desempenho', 'lucideChartNoAxesColumn'),
          item('margens', 'Margens', 'lucideWallet'),
        ],
      },
    ],
  },
];

/**
 * The region of a two-level navigation: the modules in a strip of marks, the
 * destinations of the chosen module in the column. The control that moves the
 * region stands at the foot of the strip, the part that survives closing it.
 */
const RAIL_NAV = `<nav slAppShellNav class="slotted-demo-nav">
  <div slAppShellNavRail aria-label="Modules">
    <span slAvatar shape="square" size="sm" tone="accent" variant="solid"><span slAvatarFallback>AL</span></span>
    @for (module of modules; track module.id) {
      <button
        slIconButton
        type="button"
        size="md"
        tone="secondary"
        [variant]="module.id === moduleId() ? 'solid' : 'ghost'"
        [attr.aria-current]="module.id === moduleId() ? 'true' : null"
        [attr.aria-label]="module.label"
        (click)="moduleId.set(module.id)"
      ><ng-icon [name]="module.icon" size="16" /></button>
    }
    <span class="slotted-demo-rail-end">
      <button slIconButton type="button" size="md" tone="secondary" variant="ghost" aria-label="Settings"><ng-icon name="lucideSettings" size="16" /></button>
      <button slAppShellNavToggle></button>
    </span>
  </div>
  <div slAppShellNavHeader>
    <span class="slotted-demo-rail-title">
      <span slText size="sm" weight="semibold">{{ module().label }}</span>
      <span slText size="xs" tone="muted">Aurora Logistics · Portland</span>
    </span>
  </div>
  <div slAppShellNavBody>
    <div slSideNavigation [value]="module().current">
      @for (group of module().groups; track $index) {
        @if (group.label === null) {
          ${section(null, 'group.items')}
        } @else {
          ${section('{{ group.label }}', 'group.items')}
        }
      }
    </div>
  </div>
  <div slAppShellNavFooter>
    ${account('Anna Bell — open account menu', 'AB', 'Anna Bell', 'Coordinator')}
  </div>
</nav>`;

const auroraRail = (attributes = '', { aside = false, wordmark = false } = {}) =>
  viewport(
    `<div slAppShell asideMode="inline" navMode="inline" ${attributes}>
  <header slAppShellBanner>
    <div slAppShellBrand>${wordmark ? '<span class="slotted-demo-bar-wordmark">Aurora</span>' : ''}</div>
    <div slAppShellCenter>
      <nav slBreadcrumb aria-label="Trilho">
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="#modulo">{{ module().label }}</a></li>
          <li slBreadcrumbItem><span slBreadcrumbPage>Encomendas</span></li>
        </ol>
      </nav>
    </div>
    <div slAppShellActions>
      <button slIconButton type="button" size="sm" tone="secondary" variant="ghost" aria-label="Notifications — 3 unread"><ng-icon name="lucideBell" size="16" /></button>
      <span slAvatar size="sm" tone="accent" variant="soft"><span slAvatarFallback>AB</span></span>
    </div>
  </header>
  ${RAIL_NAV}
  <main slAppShellMain>${AURORA_CONTENT()}</main>
  ${aside ? AURORA_PANE : ''}
</div>`,
  );

/* ── Cadence: the product tracker ─────────────────────────────────────────── */

const CADENCE_TOP = [
  item('inbox', 'Caixa de entrada', 'lucideInbox', 4, 'accent'),
  item('mine', 'Os meus itens', 'lucideCircleCheck'),
] as const;

const CADENCE_SPACE = [
  item('cycle', 'Ciclo 14', 'lucideRefreshCw'),
  item('projects', 'Projetos', 'lucideFolderKanban'),
  item('board', 'Quadro', 'lucideKanban'),
  item('roadmap', 'Roteiro', 'lucideMap'),
] as const;

const ISSUES = [
  {
    id: 'PLT-812',
    title: 'Migrate queues to the new broker',
    owner: 'RT',
    estimate: '5',
    state: 'in progress',
    tone: 'accent',
  },
  {
    id: 'PLT-809',
    title: 'Limites de taxa por inquilino',
    owner: 'MS',
    estimate: '3',
    state: 'in review',
    tone: 'warning',
  },
  {
    id: 'PLT-804',
    title: 'Automatic secret rotation',
    owner: 'RT',
    estimate: '8',
    state: 'blocked',
    tone: 'danger',
  },
  {
    id: 'PLT-798',
    title: 'p99 latency dashboard',
    owner: 'JC',
    estimate: '2',
    state: 'done',
    tone: 'success',
  },
  {
    id: 'PLT-795',
    title: 'Retirar API v1',
    owner: 'MS',
    estimate: '5',
    state: 'in progress',
    tone: 'accent',
  },
] as const;

const CADENCE_NAV = `<nav slAppShellNav class="slotted-demo-nav slotted-demo-shell-repaint-nav" data-slotted-scheme="dark">
  <div slAppShellNavHeader>
    ${account('Cadence — switch workspace', 'C', 'Cadence', 'Platform Team', 'shape="square" size="sm" tone="accent" variant="solid"')}
    <button slAppShellNavToggle></button>
  </div>
  <div slAppShellNavBody>
    ${column(section(null, 'cadenceTop'), section('Workspace', 'cadenceSpace'))}
  </div>
  <div slAppShellNavFooter>
    ${account('Ray Turner — open account menu', 'RT', 'Ray Turner', 'Engineering')}
  </div>
</nav>`;

const CADENCE_BANNER = `<header slAppShellBanner>
  <div slAppShellBrand></div>
  <div slAppShellCenter>
    <nav slBreadcrumb aria-label="Location">
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#platform">Platform</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink href="#cycle">Ciclo 14</a></li>
        <li slBreadcrumbItem><span slBreadcrumbPage>Em curso</span></li>
      </ol>
    </nav>
  </div>
  <div slAppShellActions>
    <button slButton class="slotted-demo-bar-optional" size="sm" tone="secondary" variant="ghost"><span slButtonStart><ng-icon name="lucideFilter" size="14" /></span>Filtrar</button>
    <button slButton size="sm" tone="accent"><span slButtonStart><ng-icon name="lucidePlus" size="14" /></span>Novo item</button>
  </div>
</header>`;

const CADENCE_CONTENT = (body = '') => `<main slPage landmark="none" scroll="ancestor" width="full">
  <header slPageHeader level="1" size="md">
    <div slPageHeaderTitleArea>
      <div slPageHeaderTitleRow>
        <div slPageHeaderTitle>
          <h1 slPageHeaderHeading>Cycle 14 · In progress</h1>
          <p slPageHeaderSubheading>18 items · 6 done · ends in 5 days</p>
        </div>
      </div>
    </div>
  </header>
  <div slPageBody>${
    body ||
    `<div slTable [columns]="5" variant="plain">
    <div slTableContent>
      <caption slTableCaption>Itens do ciclo</caption>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Item</th>
          <th slTableColumnHeader>Title</th>
          <th slTableColumnHeader>Owner</th>
          <th slTableColumnHeader numeric>Estimate</th>
          <th slTableColumnHeader>Status</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (issue of issues; track issue.id) {
          <tr slTableRow [value]="issue.id">
            <th slTableRowHeader>{{ issue.id }}</th>
            <td slTableCell>{{ issue.title }}</td>
            <td slTableCell>{{ issue.owner }}</td>
            <td slTableCell numeric>{{ issue.estimate }}</td>
            <td slTableCell><span slTag shape="pill" size="sm" [tone]="issue.tone" variant="soft"><span slTagBody>{{ issue.state }}</span></span></td>
          </tr>
        }
      </tbody>
    </div>
  </div>`
  }</div>
</main>`;

const cadence = (attributes = '', { content = CADENCE_CONTENT(), size = 'screen' } = {}) =>
  viewport(
    `<div slAppShell canvas="flush" primary="nav" ${attributes}>
  ${CADENCE_NAV}
  ${CADENCE_BANNER}
  <main slAppShellMain>${content}</main>
</div>`,
    size,
  );

/* ── Atrium: the clinic's front desk ─────────────────────────────────────── */

const ATRIO = [
  item('agenda', 'Agenda', 'lucideCalendarDays'),
  item('utentes', 'Utentes', 'lucideUsers'),
  item('consultas', 'Appointments', 'lucideStethoscope', 9),
  item('receitas', 'Prescriptions', 'lucidePill'),
  item('registos', 'Clinical records', 'lucideClipboardList'),
] as const;

const AGENDA = [
  { time: '09:00', patient: 'Carl Ames', kind: 'Routine visit' },
  { time: '09:30', patient: 'Beth Lowell', kind: 'First visit' },
  { time: '10:00', patient: 'Joan Mitchell', kind: 'Reassessment' },
  { time: '10:30', patient: '', kind: 'Opening' },
  { time: '11:00', patient: 'Tom Reed', kind: 'Routine visit' },
  { time: '11:30', patient: 'Iris Collins', kind: 'Tests' },
  { time: '14:00', patient: '', kind: 'Opening' },
  { time: '14:30', patient: 'Helen Shaw', kind: 'Routine visit' },
] as const;

const ATRIO_NAV = `<nav slAppShellNav class="slotted-demo-nav">
  <div slAppShellNavHeader>
    ${account('Atrium — switch branch', 'A', 'Atrium Clinic', 'Capitol Hill Branch', 'shape="square" size="sm" tone="accent" variant="solid"')}
  </div>
  <div slAppShellNavBody>${column(section(null, 'atrio'))}</div>
  <div slAppShellNavFooter>
    ${account('Martha Fields — open account menu', 'MF', 'Martha Fields', 'Front desk')}
  </div>
</nav>`;

const ATRIO_BANNER = (paneToggle = false) => `<header slAppShellBanner>
  <div slAppShellBrand><span class="slotted-demo-bar-wordmark">Atrium</span></div>
  <div slAppShellCenter>
    <span class="slotted-demo-bar-crumbs">
      <span>Schedule</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Tuesday, September 16</span>
    </span>
  </div>
  <div slAppShellActions>
    ${paneToggle ? '<button slAppShellAsideToggle></button>' : ''}
    <span slAvatar size="sm" tone="secondary" variant="soft"><span slAvatarFallback>MF</span></span>
    <button slAppShellNavToggle></button>
  </div>
</header>`;

const ATRIO_CONTENT = `<main slPage landmark="none" scroll="ancestor" width="full">
  <header slPageHeader level="1" size="md">
    <div slPageHeaderTitleArea>
      <div slPageHeaderTitleRow>
        <div slPageHeaderTitle>
          <h1 slPageHeaderHeading>Tuesday schedule</h1>
          <p slPageHeaderSubheading>9 appointments · 2 openings · Dr. Helen Shaw</p>
        </div>
      </div>
    </div>
  </header>
  <div slPageBody>
    <dl class="slotted-demo-pane-fields">
      @for (slot of agenda; track slot.time) {
        <dt>{{ slot.time }}</dt>
        <dd>
          <span slText size="sm" [tone]="slot.patient === '' ? 'muted' : 'default'" weight="medium">{{ slot.patient === '' ? 'Vaga' : slot.patient }}</span>
          @if (slot.patient !== '') {
            <span slText size="xs" tone="muted">{{ slot.kind }}</span>
          }
        </dd>
      }
    </dl>
  </div>
</main>`;

const ATRIO_PANE = `<aside slAppShellAside>
  <div slAppShellAsideHeader>
    <span class="slotted-demo-pane-title">Nova consulta · 10:30</span>
    <button slAppShellAsideToggle></button>
  </div>
  <div slAppShellAsideBody>
    <div class="slotted-demo-pane-form">
      <div slField><label slFieldLabel>Patient</label><div slTextField><input slTextFieldInput defaultValue="Joan Mitchell" /></div></div>
      <div slField><label slFieldLabel>Reason</label><div slTextField><input slTextFieldInput placeholder="Reassessment, tests, routine…" /></div></div>
      <div slField><label slFieldLabel>Phone</label><div slTextField><input slTextFieldInput defaultValue="+1 206 555 0118" inputmode="tel" /></div></div>
    </div>
  </div>
  <div slAppShellAsideFooter>
    <button slButton size="sm" tone="secondary" variant="ghost">Cancelar</button>
    <button slButton size="sm" tone="accent">Marcar</button>
  </div>
</aside>`;

const atrio = (attributes = '', { aside = true, paneToggle = false, size = 'screen' } = {}) =>
  viewport(
    `<div slAppShell navMode="overlay" navSide="end" [navOpen]="false" ${attributes}>
  ${ATRIO_BANNER(paneToggle)}
  ${ATRIO_NAV}
  <main slAppShellMain>${ATRIO_CONTENT}</main>
  ${aside ? ATRIO_PANE : ''}
</div>`,
    size,
  );

/* ── The frame with nothing in it ─────────────────────────────────────────── */

const SLOT = (
  part: string,
  note: string,
  fill = true,
) => `<span class="slotted-demo-slot"${fill ? ' data-fill' : ''}>
  <span>[data-part="${part}"]</span>
  <span class="slotted-demo-slot__note">${note}</span>
</span>`;

const ANATOMY = viewport(`<div slAppShell asideMode="inline" navMode="inline">
  <header slAppShellBanner>
    <div slAppShellBrand>
      <button slAppShellNavToggle></button>
      ${SLOT('brand', 'the brand', false)}
    </div>
    <div slAppShellCenter>${SLOT('center', 'what grows: search, trail, title')}</div>
    <div slAppShellActions>${SLOT('actions', 'what is global', false)}</div>
  </header>
  <nav slAppShellNav>
    <div slAppShellNavHeader>${SLOT('nav-header', 'the workspace')}</div>
    <div slAppShellNavBody>${SLOT('nav-body', 'the destinations, and what scrolls')}</div>
    <div slAppShellNavFooter>${SLOT('nav-footer', 'the account')}</div>
  </nav>
  <main slAppShellMain>${SLOT('main', 'a rota')}</main>
  <aside slAppShellAside>
    <div slAppShellAsideResizer></div>
    <div slAppShellAsideHeader>${SLOT('aside-header', 'the pane title', false)}<button slAppShellAsideToggle></button></div>
    <div slAppShellAsideBody>${SLOT('aside-body', 'the pane, and what scrolls')}</div>
    <div slAppShellAsideFooter>${SLOT('aside-footer', 'the pane actions', false)}</div>
  </aside>
  <footer slAppShellFooter>${SLOT('footer', 'the application footer')}</footer>
</div>`);

/* ── Wiring ───────────────────────────────────────────────────────────────── */

const DIRECTIVES = [
  SlAppShell,
  SlAppShellActions,
  SlAppShellAside,
  SlAppShellAsideBody,
  SlAppShellAsideFooter,
  SlAppShellAsideHeader,
  SlAppShellAsideResizer,
  SlAppShellAsideToggle,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellCenter,
  SlAppShellFooter,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavFooter,
  SlAppShellNavHeader,
  SlAppShellNavRail,
  SlAppShellNavToggle,
  SlAppShellProgress,
  SlAvatar,
  SlAvatarFallback,
  SlBadge,
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
  SlButton,
  SlButtonStart,
  SlContainer,
  SlDrawer,
  SlDrawerBody,
  SlDrawerTrigger,
  SlField,
  SlFieldLabel,
  SlIconButton,
  SlPage,
  SlPageBody,
  SlPageFooter,
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderHeading,
  SlPageHeaderProgress,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlShortcut,
  SlStack,
  SlTable,
  SlTableBody,
  SlTableCaption,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTag,
  SlTagBody,
  SlText,
  SlTextField,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
  SlSideNavigation,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
  SlSideNavigationList,
  SlSideNavigationItem,
  SlSideNavigationLink,
  SlSideNavigationIcon,
  SlSideNavigationLabel,
  SlSideNavigationCount,
  SlSideNavigationEnd,
  NgIcon,
];

/** Everything the templates read, in one place. */
class Data {
  readonly destinations = AURORA;
  readonly long = AURORA_LONG;
  readonly system = AURORA_SYSTEM;
  readonly shipments = SHIPMENTS;
  readonly cadenceTop = CADENCE_TOP;
  readonly cadenceSpace = CADENCE_SPACE;
  readonly issues = ISSUES;
  readonly atrio = ATRIO;
  readonly agenda = AGENDA;
  readonly money = MONEY;
  readonly current = signal('encomendas');
  readonly modules = MODULES;
  /** The module the reader is in: the product's state, not the shell's. */
  readonly moduleId = signal('operacao');
  readonly module = computed(
    () => MODULES.find((entry) => entry.id === this.moduleId()) ?? MODULES[0]!,
  );
  /** The row the pane shows; a table selection moves it. */
  readonly selected = signal<string | undefined>('ENC-4521');
  readonly selectedKeys = computed(() => (this.selected() === undefined ? [] : [this.selected()!]));
  readonly selectedRow = computed(
    () => SHIPMENTS.find((row) => row.id === this.selected()) ?? SHIPMENTS[0],
  );
  select(keys: readonly string[]) {
    this.selected.set(keys[0]);
  }
  /** A navigation and a refresh, each ending by itself. */
  readonly navigating = signal(false);
  readonly refreshing = signal(false);
  readonly title = signal('Encomendas');
  navigate() {
    this.navigating.set(true);
    this.title.update((current) => (current === 'Encomendas' ? 'ENC-4521' : 'Encomendas'));
    setTimeout(() => this.navigating.set(false), 1600);
  }
  refresh() {
    this.refreshing.set(true);
    setTimeout(() => this.refreshing.set(false), 1400);
  }
}

const story = (template: string, extra: Record<string, unknown> = {}): StoryObj<Data> => ({
  render: () => ({
    props: { ...new Data(), ...extra },
    template,
  }),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_APP_SHELL_DOCS.appShell.scenes, {
    playground: Playground,
    anatomy: AnatomyScene,
    regions: Regions,
    banner: BannerScene,
    canvas: Canvas,
    separation: Separation,
    theming: Theming,
    navModes: NavModes,
    rail: Rail,
    navRail: NavRail,
    aside: Aside,
    overlay: Overlay,
    primary: Primary,
    sides: Sides,
    scroll: Scroll,
    progress: Progress,
    skipLinks: SkipLinks,
    persistence: Persistence,
    defaults: Defaults,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<Data> = {
  title: 'Components/App Shell',
  decorators: [
    moduleMetadata({
      imports: DIRECTIVES,
      providers: [
        provideIcons({
          lucideBadgeCheck,
          lucideBanknote,
          lucideBell,
          lucideCalendarDays,
          lucideChartNoAxesColumn,
          lucideChevronsUpDown,
          lucideCircleCheck,
          lucideCircleHelp,
          lucideClipboardList,
          lucideFileText,
          lucideFilter,
          lucideFolderKanban,
          lucideHandshake,
          lucideInbox,
          lucideKanban,
          lucideLayoutDashboard,
          lucideLifeBuoy,
          lucideMap,
          lucidePackage,
          lucidePill,
          lucidePlus,
          lucideRefreshCw,
          lucideSearch,
          lucideSettings,
          lucideStethoscope,
          lucideTruck,
          lucideUndo2,
          lucideUsers,
          lucideWallet,
          lucideWarehouse,
        }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'App Shell',
        description:
          'The outer frame of a route: the regions that do not change when the content does. Five landmarks earned from their elements, a navigation region and a secondary pane that are each one element in every mode, a bar of three clusters, and a content column that is a card on the frame. Three products on this page — a freight back office, a product tracker, a clinic’s front desk — and every one of them is the same family.',
        framework: 'Angular',
        ...ANGULAR_APP_SHELL_DOCS.appShell,
        tokens: ANGULAR_APP_SHELL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;

export const Playground: StoryObj<Data> = {
  ...story(aurora('', { footer: true })),
  parameters: scenario('playground'),
};

export const AnatomyScene: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'What arrives with slAppShell, and nothing else',
        'Every part the contract declares, drawn as its own name. This is the whole of what the family brings: the tracks, the gutter, the card the content stands on, the three clusters of the bar, the three parts of the pane, the boxes the two controls fill. Every other scene on this page fills these boxes with a product — none of that is the family.',
        ANATOMY,
      ),
    ),
  ),
  parameters: scenario('anatomy'),
};

export const Regions: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'banner · navigation · main · complementary · contentinfo',
        'Open the accessibility tree on Aurora: five landmarks, one of each, and not a single role attribute in the markup. The names come from the elements; the navigation and the pane are labelled, because a document may hold more than one of either.',
        aurora('asideMode="inline" navMode="inline"', { footer: true }),
      ),
      scene(
        'The regions a product may not have',
        'Cadence has no pane and no footer: the tracks they would have taken are nought wide and nought tall, nothing is left holding space, and the skip links drop to two because a link to a region nobody rendered is a dead destination.',
        cadence('navMode="inline"'),
      ),
    ),
  ),
  parameters: scenario('regions'),
};

export const BannerScene: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'brand · center · actions — a search in the middle',
        "Aurora's bar: the control and the name start the line, a search field with its shortcut takes the room in the middle, and notifications, help and the account end it. Narrow the frame below thirty rems of bar and the search gives way; below twenty the optional controls go too. Nothing in actions ever breaks its label.",
        aurora('asideMode="inline" navMode="inline"', { size: 'tall' }),
      ),
      scene(
        "A trail in the middle, the route's actions at the end",
        "Cadence's bar holds the route rather than the application: an slBreadcrumb in center, a filter and a primary action in actions, and an empty brand because the workspace lives in the column's own head under primary='nav'. An empty cluster costs nothing.",
        cadence('navMode="inline"', { size: 'tall' }),
      ),
      scene(
        "A title in the middle, the pane's control at the end",
        "Atrium's bar names the day, and when the pane is closed its control stands in actions so the receptionist can reopen it from a fixed place — the same control that stands in the pane's own head while it is open.",
        atrio('asideMode="inline" [asideOpen]="false"', { paneToggle: true, size: 'tall' }),
      ),
    ),
  ),
  parameters: scenario('banner'),
};

export const Canvas: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "canvas='inset', the default",
        'The frame takes the sunken ground and carries no surface of its own; the content and the pane are cards with a radius, an edge and a shadow, and the gutter between them is what separates the regions. No rule is drawn anywhere.',
        aurora('asideMode="inline" canvas="inset" navMode="inline"', { footer: true }),
      ),
      scene(
        "canvas='flush'",
        "Every region runs edge to edge and each seam is drawn — between the regions, and between the pane's head, body and foot. The rows of the column stand one inset from the screen's edge and from the seam on both sides, so the closed strip stays centerd.",
        aurora('asideMode="inline" canvas="flush" navMode="inline"', { footer: true }),
      ),
      scene(
        "canvas='floating'",
        "The column is a card as well as the content: two cards and the pane on the sunken ground, a gutter apart. The control in the bar stands over the marks in the card, because the bar's inset counts the card's edge.",
        aurora('asideMode="inline" canvas="floating" navMode="inline"', { footer: true }),
      ),
      scene(
        "canvas='panel'",
        "One card holds the column, the content and the pane, with the bar and the footer on the frame outside it. Inside the card the regions meet at seams, and separation decides how those are drawn. The card is one box — the root's own pseudo-element — so no shadow falls across a seam.",
        aurora('asideMode="inline" canvas="panel" navMode="inline"', { footer: true }),
      ),
    ),
  ),
  parameters: scenario('canvas'),
};

export const Separation: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "separation='rule' on flush, the default",
        'A line of the thin border width at every seam where two regions touch without a gutter.',
        aurora('asideMode="inline" canvas="flush" navMode="inline"'),
      ),
      scene(
        "separation='tone' on flush",
        'No line: the bar, the column and the pane take a ground of their own, 0.036 OKLab L from the surface in light and in dark, and the content keeps the surface. Hover a destination — the subtle tones inside a toned region are recomputed from its ground, so the row still answers.',
        aurora('asideMode="inline" canvas="flush" navMode="inline" separation="tone"'),
      ),
      scene(
        "separation='tone' on panel, primary='main'",
        'Inside the one card the column and the pane are toned and the bar belongs to the content, so the only seam left is none at all. Under forced colors every ground is Canvas and the rule comes back whatever this axis says.',
        aurora(
          'asideMode="inline" canvas="panel" navMode="inline" primary="main" separation="tone"',
          {
            nav: AURORA_NAV('destinations', true),
            toggle: false,
          },
        ),
      ),
    ),
  ),
  parameters: scenario('separation'),
};

export const Theming: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'A dark column on a light frame — Cadence',
        "Two declarations and no variant: data-slotted-scheme='dark' on the region, so every tone inside it is restated rather than borrowed from the page it left, and --slotted-app-shell-nav-surface on the same element for the ground. The counts, the current destination and the focus ring are calibrated against the column they are on. Switch the page to dark: the column stays the column.",
        cadence('navMode="inline"'),
      ),
      scene(
        'The same frame, unpainted — Aurora',
        "What the family ships, and what Aurora keeps. Each region has its own ground and its own ink, each falling back to the plane's, so a product states only what differs — and the parts are addressable by data-part, so anything the properties do not reach is still one selector away.",
        aurora('asideMode="inline" navMode="inline"'),
      ),
      scene(
        'A wash behind the frame — --slotted-app-shell-frame-image',
        "One theme token, a background-image layer over the frame's color: two pools of the accent tone behind floating cards. The cards keep their own surface, so everything a reader reads stays on the ground it was calibrated for.",
        aurora(
          'asideMode="inline" canvas="floating" class="slotted-demo-frame-wash" navMode="inline" primary="main"',
          { nav: AURORA_NAV('destinations', true), toggle: false },
        ),
      ),
    ),
  ),
  parameters: scenario('theming'),
};

export const NavModes: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "navMode='inline'",
        'A column of the grid. The content column takes what is left, and closing the region widens it rather than covering it.',
        aurora('asideMode="inline" navMode="inline"'),
      ),
      scene(
        "navMode='auto' — the same shell, in a frame narrower than 600 pixels",
        "The shell answers its own inline size and not the window's: this frame is 420 pixels wide inside a page that is not, and both regions have already left the grid. Press the control — the panel comes in over the content and the veil covers what is behind it.",
        `<div class="slotted-demo-measure">${aurora('[asideOpen]="false"', { room: '', size: 'tall' })}</div>`,
      ),
      scene(
        "navMode='overlay' at any width — Atrium",
        'The mode forced, so a wide shell behaves like a narrow one: for a product whose navigation is a command surface rather than a column, and whose screen belongs to the agenda. Escape closes it, a press outside closes it, and focus returns to the control.',
        atrio('asideMode="inline"'),
      ),
    ),
  ),
  parameters: scenario('navModes'),
};

export const Rail: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "collapsedTo='rail', the default — closed, control in the bar",
        "A strip one mark column wide, with every destination still on it and still in the tab order. The labels went because the region is a query container of its own and each row answered its width — the shell told it nothing. Under primary='banner' the control stands at the start of the bar, over the column it moves.",
        aurora('asideMode="inline" collapsedTo="rail" [navOpen]="false" navMode="inline"'),
      ),
      scene(
        "collapsedTo='rail' — closed, control in the column's own foot",
        "Under primary='nav' the column reaches the corner and the bar starts beside it, so the control belongs in the column: here in its foot, above the person, where it survives the rail because the control is the width of a mark. Press it and the labels come back.",
        aurora(
          'asideMode="inline" collapsedTo="rail" [navOpen]="false" navMode="inline" primary="nav"',
          {
            aside: false,
            center: false,
            nav: AURORA_NAV('destinations', true),
            toggle: false,
          },
        ),
      ),
      scene(
        "collapsedTo='hidden' — closed",
        'The region keeps no measure and no tab stop. Press the control in the bar and it comes back, animating its width from nought. Mantine and Ant leave a zero-width navbar in the flow instead, and Tab still crosses every link inside it.',
        aurora('asideMode="inline" collapsedTo="hidden" [navOpen]="false" navMode="inline"'),
      ),
    ),
  ),
  parameters: scenario('rail'),
};

export const NavRail: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'slAppShellNavRail — open',
        "A two-level navigation inside one nav landmark: the modules in a strip of marks, the destinations of the chosen module in the column beside it. Press a module: the column changes, and the region's width does not. The module is the product's state; the shell holds only whether the region is open.",
        auroraRail('primary="main"'),
      ),
      scene(
        'slAppShellNavRail — closed to its strip',
        "collapsedTo='rail' with a strip of the rail's own keeps the strip and lets the column go: cut by the region while the width moves, then out of the tab order and the accessibility tree. The control at the foot of the strip brings the column back.",
        auroraRail('primary="main" [navOpen]="false"'),
      ),
      scene(
        "slAppShellNavRail on flush, separation='tone', primary='banner'",
        'The strip on the tone, the column and the bar on the tone beside it, the content on the surface — no line anywhere.',
        auroraRail('canvas="flush" primary="banner" separation="tone"', { wordmark: true }),
      ),
      scene(
        'slAppShellNavRail on floating, with the pane',
        "The strip and the column share one card; the seam between them is the axis's, here a rule.",
        auroraRail('canvas="floating" primary="main"', { aside: true }),
      ),
    ),
  ),
  parameters: scenario('navRail'),
};

export const Aside: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'Opened by a selection, closed from its own head',
        "Select a row: the product sets asideOpen from its selection and the pane opens with the consignment. Press the control in the pane's head: the shell asks with the reason pointer, the product clears the selection, and the content takes the room — a closed pane leaves no rail. The skip link to the pane exists only while it is open. Drag the pane's inner edge, or focus it and press the arrows, Home and End: the column follows asideExtent between 16 and 60 per cent of the shell, and the body's fields stand on the title's edge with no padding of their own.",
        viewport(`<div slAppShell asideMode="inline" navMode="inline" [asideOpen]="selected() !== undefined" (asideOpenChangeRequest)="$event.value ? null : selected.set(undefined)">
  ${AURORA_BANNER()}
  ${AURORA_NAV()}
  <main slAppShellMain>${AURORA_CONTENT(SHIPMENTS_TABLE('selectionMode="single" [value]="selectedKeys()" (valueChange)="select($event)"'))}</main>
  ${AURORA_PANE_RESIZABLE}
</div>`),
      ),
      scene(
        "asideMode='inline' in a frame narrower than 600 pixels",
        'No room beside the content, so the inline pane drops under it as a row of its own, taking at most half the shell. The head, the body and the foot hold: the body is what scrolls.',
        `<div class="slotted-demo-measure">${aurora('asideMode="inline" [navOpen]="false" navMode="inline"', { room: '', size: 'tall' })}</div>`,
      ),
      scene(
        "asideMode='overlay' — the pane as a layer, from the other end",
        "The navigation's layer mirrored: the pane slides in from the end the navigation is not on, stops under the banner, takes the veil, and returns focus to the control that opened it. Escape closes it. On the inset plane it is a card like every other region.",
        aurora('asideMode="overlay" [navOpen]="false" navMode="overlay"', {
          center: false,
          size: 'tall',
        }),
      ),
    ),
  ),
  parameters: scenario('aside'),
};

export const Overlay: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "modal — the default, Atrium's navigation open",
        'Open, and Tab: the keyboard never leaves the panel, and every region beside it carries inert — the banner included — so a screen reader does not read them either. That is the whole modal contract: the ways out are Escape, the veil and a destination, and Escape gives the focus back to the control.',
        atrio('asideMode="inline" modal="true"').replace('[navOpen]="false"', '[navOpen]="true"'),
      ),
      scene(
        'modal="false"',
        'The panel is over the content and nothing behind it is inert: for a shell whose navigation is a reference the reader consults while working. No veil is drawn, because a veil that stops nothing is a lie about what is reachable.',
        atrio('asideMode="inline" modal="false"').replace('[navOpen]="false"', '[navOpen]="true"'),
      ),
      scene(
        "escape='none' and outsidePress='none' — on the pane",
        "Both dismissals refused, so the pane closes only from its own control — for a form the receptionist is halfway through. Press Escape here and nothing happens; press the control in the pane's head and it closes. The same two axes govern the navigation's layer.",
        atrio('asideMode="overlay" escape="none" outsidePress="none"', { size: 'tall' }),
      ),
      scene(
        'closeOnNavigate="false"',
        'A click on a destination leaves the navigation open, for an application that loads the route behind it and wants the reader to keep their place in the list. With the default, the same click asks to close and says so with the reason select.',
        atrio('asideMode="inline" closeOnNavigate="false"').replace(
          '[navOpen]="false"',
          '[navOpen]="true"',
        ),
      ),
    ),
  ),
  parameters: scenario('overlay'),
};

export const Primary: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "primary='banner', the default — Aurora",
        'The bar spans the full width and the navigation starts under it, which is what an application with one global bar and several workspaces wants. The control stands at the start of the bar, over the column it moves.',
        aurora('asideMode="inline" navMode="inline" primary="banner"'),
      ),
      scene(
        "primary='nav' — Cadence",
        "The navigation reaches the corner and the bar starts beside it. The column's own head grows to the bar's height so the workspace and the trail sit on one line, and the control that moves the column stands in that head — and Tab still goes skip, banner, control, navigation, content, because the grid moved the drawing and not the writing.",
        cadence('navMode="inline"'),
      ),
      scene(
        "primary='main' — Aurora",
        "The column reaches both corners and the bar belongs to the content: it stands inside the card that holds the page, over the content's column alone, and the pane beside it spans the bar's row. The control moves to the column's foot. The focus order is still skip, banner, navigation, content.",
        aurora('asideMode="inline" navMode="inline" primary="main"', {
          nav: AURORA_NAV('destinations', true),
          toggle: false,
        }),
      ),
    ),
  ),
  parameters: scenario('primary'),
};

export const Sides: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "navSide='end' — Atrium, with the navigation in line",
        'The region moves to the other end of the line and the pane moves with it, to the side the navigation is not — so the two never stack on one edge. Both controls turn their marks with them. Switch the direction to right-to-left: the whole frame mirrors, because every distance is logical.',
        atrio('asideMode="inline"').replace(
          'navMode="overlay" navSide="end" [navOpen]="false"',
          'navMode="inline" navSide="end" [navOpen]="true"',
        ),
      ),
      scene(
        "navSize='sm' with asideSize='lg'",
        "Both are steps on the family's own scale rather than pixel strings: a theme retunes a step for every shell at once, and a consumer who needs an exact measure writes --slotted-app-shell-nav-size-md on the element.",
        aurora('asideMode="inline" asideSize="lg" navMode="inline" navSize="sm"'),
      ),
      scene(
        "navSize='lg' — and a destination whose name is long",
        'Fourteen characters of German where the mock had six: the label truncates inside its own row and the count stays put, because the row reserves the count first. The region did not grow and nothing wrapped.',
        aurora('asideMode="inline" navMode="inline" navSize="lg"', { nav: AURORA_NAV('long') }),
      ),
    ),
  ),
  parameters: scenario('sides'),
};

export const Scroll: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        "scroll='content', the default",
        "The shell is the height it was given, capped at 100dvh so a mobile browser's collapsing toolbar never makes it taller than the space there is. Scroll the table: the banner, the column, the pane's head and foot and the footer all stay, and only the column and the pane's body move.",
        aurora('asideMode="inline" navMode="inline" scroll="content"', {
          content: AURORA_CONTENT(
            `<div slStack [gap]="6">${SHIPMENTS_TABLE()}${SHIPMENTS_TABLE()}${SHIPMENTS_TABLE()}</div>`,
          ),
          footer: true,
        }),
      ),
      scene(
        "scroll='document'",
        'The shell grows with its content and the document scrolls, which is what a documentation site wants. The banner travels with it — the cost written in the contract, because a sticky banner here would have to write a custom property slPageHeader owns writing.',
        viewport(
          `<div slAppShell asideMode="inline" navMode="inline" scroll="document">
  ${AURORA_BANNER()}
  ${AURORA_NAV()}
  <main slAppShellMain>
    <div slContainer [inset]="6" size="wide">
      <div slStack [gap]="6">
        <span slText size="lg" weight="semibold">Encomendas</span>
        ${SHIPMENTS_TABLE()}
        ${SHIPMENTS_TABLE()}
      </div>
    </div>
  </main>
  ${AURORA_FOOTER}
</div>`,
          'tall',
        ),
      ),
    ),
  ),
  parameters: scenario('scroll'),
};

export const Progress: StoryObj<Data> = {
  ...story(
    `${grid(
      scene(
        'The next page, then a refresh of this one',
        "Open another page: after 200 ms the bar grows out of the content card's top border, travels until the page is ready, holds for at least 400 ms and goes back into the border; the content is aria-busy for exactly that long. Refresh the list draws the page header's own bar on its hairline instead. Both at once draws one bar, the shell's, because the header's gives way inside a busy region.",
        `<div class="slotted-demo-stack">
  <div class="slotted-demo-row">
    <button slButton size="sm" tone="accent" (click)="navigate()">Open another page</button>
    <button slButton size="sm" tone="secondary" variant="outline" (click)="refresh()">Refresh the list</button>
    <button slButton size="sm" tone="secondary" variant="ghost" (click)="navigate(); refresh()">Both at once</button>
  </div>
  ${aurora('navMode="inline"', {
    aside: false,
    content: AURORA_CONTENT(
      SHIPMENTS_TABLE(),
      '{{ title() }}',
      '<div slPageHeaderProgress [loading]="refreshing()"></div>',
    ),
    progress: '<div slAppShellProgress [loading]="navigating()"></div>',
    size: 'tall',
  })}
</div>`,
      ),
    )}<div class="slotted-demo-grid" data-columns="1">${[
      scene(
        "canvas='inset'",
        'The bar covers the top border of the content card and is clipped by its corners.',
        aurora('canvas="inset" navMode="inline"', {
          aside: false,
          center: false,
          progress: '<div slAppShellProgress [delay]="0"></div>',
          size: 'tall',
        }),
      ),
      scene(
        "canvas='flush'",
        "The bar covers the banner's seam, from the navigation column's edge to the frame's.",
        aurora('canvas="flush" navMode="inline"', {
          aside: false,
          center: false,
          progress: '<div slAppShellProgress [delay]="0"></div>',
          size: 'tall',
        }),
      ),
      scene(
        "canvas='floating'",
        "Two cards on the sunken ground; the bar is the content card's, under its corners.",
        aurora('canvas="floating" navMode="inline"', {
          aside: false,
          center: false,
          progress: '<div slAppShellProgress [delay]="0"></div>',
          size: 'tall',
        }),
      ),
      scene(
        "canvas='panel'",
        "One card holds the regions; the bar covers the card's top edge over the content.",
        aurora('canvas="panel" navMode="inline"', {
          aside: false,
          center: false,
          progress: '<div slAppShellProgress [delay]="0"></div>',
          size: 'tall',
        }),
      ),
    ].join('')}</div>`,
  ),
  parameters: scenario('progress'),
};

export const SkipLinks: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'Three regions, three links',
        "Click the frame and press Tab: the first link appears over the bar. Press Enter and the focus moves into the content itself — not only the scroll — because the link writes tabindex='-1' on main for that one focus. Tab again for the navigation, again for the pane.",
        aurora('asideMode="inline" navMode="inline"'),
      ),
      scene(
        'One region, one link',
        'The same shell without a pane and without a navigation: the links are written from the regions that actually rendered, so there is exactly one and it points at the content. A pane the reader closed drops its link the same way.',
        viewport(
          `<div slAppShell navMode="inline">
  ${AURORA_BANNER({ toggle: false })}
  <main slAppShellMain>${AURORA_CONTENT(SHIPMENTS_TABLE(), 'Monthly report')}</main>
</div>`,
          'tall',
        ),
      ),
    ),
  ),
  parameters: scenario('skipLinks'),
};

/**
 * The request log. A signal in `props` takes the two-way binding directly, so
 * this needs no component of its own — and a component would need a statically
 * analysable template, which a composed one is not.
 */
export const Persistence: StoryObj<Data> = {
  render: () => {
    const open = signal(true);
    const log = signal<readonly { reason: string; region: string; value: boolean }[]>([]);
    const record = (region: string) => (request: { reason: string; value: boolean }) =>
      log.update((entries) =>
        [{ reason: request.reason, region, value: request.value }, ...entries].slice(0, 6),
      );
    return {
      props: {
        ...new Data(),
        open,
        log,
        recordNav: record('navigation'),
        recordAside: record('pane'),
      },
      template: grid(
        scene(
          'Every request says why, for both regions',
          "Press a control: pointer. Press it with the keyboard: keyboard. Drag the browser window narrow until the frame crosses 600 pixels: resize, for the navigation and for the pane — the one reason a product ignores when it persists the reader's preference, and the only one no surveyed implementation reports.",
          `<div slStack [gap]="4">
            ${viewport(
              `<div slAppShell [(navOpen)]="open" (navOpenChangeRequest)="recordNav($event)" (asideOpenChangeRequest)="recordAside($event)">
                ${AURORA_BANNER()}
                ${AURORA_NAV()}
                <main slAppShellMain>${AURORA_CONTENT()}</main>
                ${AURORA_PANE}
              </div>`,
              'tall',
            )}
            <div class="slotted-demo-rows">
              @if (log().length === 0) {
                <span>No requests yet</span>
                <span>press a control, or narrow the window</span>
              }
              @for (entry of log(); track $index) {
                <span><code>{{ entry.reason }}</code></span>
                <span>{{ entry.region }} {{ entry.value ? 'open' : 'closed' }}</span>
              }
            </div>
          </div>`,
        ),
      ),
    };
  },
  parameters: scenario('persistence'),
};

export const Defaults: StoryObj<Data> = {
  render: () => ({
    props: new Data(),
    moduleMetadata: {
      providers: [
        provideAppShellDefaults({
          canvas: 'flush',
          navSize: 'lg',
        }),
      ],
    },
    template: grid(
      scene(
        'provideAppShellDefaults()',
        'Every shell under the injector is on the flush plane, with a large region — and the shell below states none of it. A shell that states any of them itself still wins. The words come from the language in force.',
        aurora('asideMode="inline" navMode="inline"'),
      ),
      scene(
        'exportAs, and the five actions an input cannot express',
        'openNav(), closeNav(), openAside() and closeAside() ask with the reason programmatic, and focusMain() does what the skip link does. The template reaches them through #shell="slAppShell", which is the Angular half of what a React ref hands back.',
        `<div slStack [gap]="4">
          <div class="slotted-demo-row">
            <button slButton size="sm" tone="secondary" variant="outline" (click)="shell.openNav()">openNav()</button>
            <button slButton size="sm" tone="secondary" variant="outline" (click)="shell.closeNav()">closeNav()</button>
            <button slButton size="sm" tone="secondary" variant="outline" (click)="shell.openAside()">openAside()</button>
            <button slButton size="sm" tone="secondary" variant="outline" (click)="shell.closeAside()">closeAside()</button>
            <button slButton size="sm" tone="accent" (click)="shell.focusMain()">focusMain()</button>
          </div>
          ${viewport(
            `<div slAppShell #shell="slAppShell" asideMode="inline" navMode="inline">
              ${AURORA_BANNER()}
              ${AURORA_NAV()}
              <main slAppShellMain>${AURORA_CONTENT()}</main>
              ${AURORA_PANE}
            </div>`,
            'tall',
          )}
        </div>`,
      ),
    ),
  }),
  parameters: scenario('defaults'),
};

export const Composition: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'slPage, slPageHeader, slTable — inside the content region',
        "The slPage carries landmark='none' because the document already has its main; its header sticks to the top of the column the shell gave it, and its footer waits at the bottom. The table's column header stops under the chrome without either family measuring the other.",
        aurora('asideMode="inline" navMode="inline"'),
      ),
      scene(
        "An sl-drawer opened from the page lands in the shell's own layer",
        "The shell names its layer part as the portal root once, so a drawer, a dialog, a menu or a toast opened anywhere under it lands over the content and inside the application's stacking context rather than on the body. Open it: the veil covers the frame, and Escape gives the focus back to the button.",
        cadence('navMode="inline"', {
          content:
            CADENCE_CONTENT(`<button slButton size="sm" tone="accent" [slDrawerTrigger]="d">Open PLT-812</button>
  <sl-drawer #d="slDrawer" side="end" size="md">
    <div slDrawerBody>
      <div slStack [gap]="3">
        <span slText size="sm" weight="semibold">PLT-812 · Migrate queues to the new broker</span>
        <span slText size="xs" tone="muted">The drawer opens on the shell layer, above the content and inside the application stacking context.</span>
      </div>
    </div>
  </sl-drawer>`),
          size: 'tall',
        }),
      ),
      scene(
        'An empty content region',
        "The shell holds while the application has nothing to show: the frame, the navigation and the chrome are all still there, and only the card is empty. A shell that collapsed here would take the reader's way out with it.",
        viewport(
          `<div slAppShell asideMode="inline" navMode="inline">
  ${AURORA_BANNER()}
  ${AURORA_NAV()}
  <main slAppShellMain>
    <div slContainer [inset]="8" size="wide">
      <div slStack align="center" [gap]="4">
        <ng-icon name="lucideInbox" size="28" />
        <span slText size="sm" weight="medium">No warehouse in this workspace</span>
        <span slText size="xs" tone="muted">Add the first one to start receiving orders.</span>
        <button slButton size="sm" tone="accent">Add warehouse</button>
      </div>
    </div>
  </main>
</div>`,
          'tall',
        ),
      ),
    ),
    { current: signal('armazens') },
  ),
  parameters: scenario('composition'),
};

export const Accessibility: StoryObj<Data> = {
  ...story(
    grid(
      scene(
        'The landmark list, and the tab order',
        "Five landmarks, none of them a role attribute. Tab: skip link, bar, control, navigation, content, pane, the pane's control, footer — the DOM order, and it is the same under primary='nav'. Enter and Space both work either control, which is the whole of the Disclosure pattern's keyboard.",
        aurora('asideMode="inline" navMode="inline"', { footer: true }),
      ),
      scene(
        'The control, anywhere',
        "Each control takes its id, its aria-expanded, its aria-controls, its name and its handler from the shell rather than from where it stands — so here the navigation's is in the column's own foot and the pane's is in the bar, and there is still exactly one control carrying the state of each region.",
        atrio('asideMode="inline" asideSize="sm" [asideOpen]="false" navSize="sm" primary="nav"', {
          paneToggle: true,
          size: 'tall',
        }).replace(
          'navMode="overlay" navSide="end" [navOpen]="false"',
          'navMode="inline" navSide="end" [navOpen]="false"',
        ),
      ),
    ),
  ),
  parameters: scenario('accessibility'),
};
