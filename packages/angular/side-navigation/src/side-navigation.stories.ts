import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartNoAxesColumn,
  lucideCreditCard,
  lucideFileText,
  lucideLifeBuoy,
  lucideMapPin,
  lucidePackage,
  lucidePlus,
  lucideSettings,
  lucideTruck,
  lucideUsers,
  lucideWarehouse,
} from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import {
  SlAppShell,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavToggle,
} from '@slotted/angular/app-shell';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlKbd } from '@slotted/angular/kbd';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlSideNavigation } from './side-navigation';
import { provideSideNavigationDefaults } from './side-navigation-defaults';
import type {
  SideNavigationMode,
  SideNavigationSize,
  SideNavigationTruncate,
} from './side-navigation-defaults';
import {
  SlSideNavigationActions,
  SlSideNavigationCount,
  SlSideNavigationDescription,
  SlSideNavigationDivider,
  SlSideNavigationEnd,
  SlSideNavigationGroup,
  SlSideNavigationIcon,
  SlSideNavigationItem,
  SlSideNavigationLabel,
  SlSideNavigationLink,
  SlSideNavigationList,
  SlSideNavigationSection,
  SlSideNavigationSectionLabel,
  SlSideNavigationSkeleton,
  SlSideNavigationTrigger,
} from './side-navigation-parts';
import {
  ANGULAR_SIDE_NAVIGATION_DOCS,
  ANGULAR_SIDE_NAVIGATION_TOKENS,
} from './side-navigation.docs';

interface SideNavigationStoryArgs {
  autoExpand: boolean;
  guides: boolean;
  mode: SideNavigationMode;
  multiple: boolean;
  size: SideNavigationSize;
  truncate: SideNavigationTruncate;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SIDE_NAVIGATION_DOCS.sideNavigation.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    groups: Groups,
    hybrid: Hybrid,
    sections: Sections,
    current: Current,
    compact: Compact,
    flyout: Flyout,
    size: Size,
    states: States,
    content: Content,
    loading: Loading,
    shell: Shell,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<SideNavigationStoryArgs> = {
  title: 'Components/SideNavigation',
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          lucideChartNoAxesColumn,
          lucideCreditCard,
          lucideFileText,
          lucideLifeBuoy,
          lucideMapPin,
          lucidePackage,
          lucidePlus,
          lucideSettings,
          lucideTruck,
          lucideUsers,
          lucideWarehouse,
        }),
      ],
    }),
    moduleMetadata({
      imports: [
        NgIcon,
        SlSideNavigation,
        SlSideNavigationSection,
        SlSideNavigationSectionLabel,
        SlSideNavigationList,
        SlSideNavigationItem,
        SlSideNavigationLink,
        SlSideNavigationTrigger,
        SlSideNavigationIcon,
        SlSideNavigationLabel,
        SlSideNavigationDescription,
        SlSideNavigationCount,
        SlSideNavigationEnd,
        SlSideNavigationActions,
        SlSideNavigationGroup,
        SlSideNavigationDivider,
        SlSideNavigationSkeleton,
        SlAppShell,
        SlAppShellBanner,
        SlAppShellBrand,
        SlAppShellMain,
        SlAppShellNav,
        SlAppShellNavBody,
        SlAppShellNavToggle,
        SlAvatar,
        SlAvatarFallback,
        SlBadge,
        SlButton,
        SlKbd,
        SlStack,
        SlText,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'SideNavigation',
        description:
          'A column of destinations: nested groups, a current destination, a rail when the room is under ninety-six pixels, and a tooltip wherever a label cannot show its own words.',
        framework: 'Angular',
        ...ANGULAR_SIDE_NAVIGATION_DOCS.sideNavigation,
        tokens: ANGULAR_SIDE_NAVIGATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SideNavigationStoryArgs>;

/* ── Templates ─────────────────────────────────────────────────────────── */

const icon = (name: string) => `<span slSideNavigationIcon><ng-icon name="${name}" /></span>`;

const destination = (
  value: string,
  label: string,
  glyph: string | null = null,
  extra = '',
  attributes = '',
) => `<li slSideNavigationItem value="${value}" ${attributes}>
  <a slSideNavigationLink href="#${value}">
    ${glyph === null ? '' : icon(glyph)}
    <span slSideNavigationLabel>${label}</span>
    ${extra}
  </a>
</li>`;

const count = (n: number | string) => `<span slSideNavigationCount>${n}</span>`;

const aurora = (attributes = '') => `<nav slSideNavigation value="orders" ${attributes}>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>Operations</div>
    <ul slSideNavigationList>
      ${destination('dashboard', 'Dashboard', 'lucideChartNoAxesColumn')}
      ${destination('shipments', 'Shipments', 'lucideTruck', count(19))}
      ${destination('orders', 'Orders', 'lucidePackage', count(412))}
      <li slSideNavigationItem value="deliveries">
        <button slSideNavigationTrigger>
          ${icon('lucideMapPin')}
          <span slSideNavigationLabel>Deliveries</span>
          ${count(38)}
        </button>
        <ul slSideNavigationGroup>
          ${destination('today', 'Today')}
          ${destination('late', 'Late', null, '<span slSideNavigationEnd><span slBadge size="sm" tone="danger" variant="soft">3</span></span>')}
          ${destination('done', 'Done')}
        </ul>
      </li>
      ${destination('warehouses', 'Warehouses', 'lucideWarehouse')}
      ${destination('customers', 'Customers', 'lucideUsers')}
    </ul>
  </div>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>System</div>
    <ul slSideNavigationList>
      ${destination('settings', 'Settings', 'lucideSettings')}
      ${destination('support', 'Support', 'lucideLifeBuoy')}
      ${destination('billing', 'Billing', 'lucideCreditCard', '<span slSideNavigationDescription>Available on the Team plan</span>', 'disabled')}
    </ul>
  </div>
</nav>`;

const scene = (label: string, note: string, body: string) => `<section class="slotted-demo-scene">
  <header class="slotted-demo-scene__header">
    <span class="slotted-demo-scene__label">${label}</span>
    <span class="slotted-demo-scene__note">${note}</span>
  </header>
  <div class="slotted-demo-stage" data-layout="block">${body}</div>
</section>`;

const grid = (columns: 1 | 2 | 3, ...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${scenes.join('')}</div>`;

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

/* ── Stories ───────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: {
    autoExpand: true,
    guides: true,
    mode: 'auto',
    multiple: true,
    size: 'md',
    truncate: 'end',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `<div class="slotted-demo-stage" data-layout="block">${measure(
      aurora(
        `[expanded]="['deliveries']" [mode]="mode" [size]="size" [truncate]="truncate" [multiple]="multiple" [autoExpand]="autoExpand" [guides]="guides"`,
      ),
    )}</div>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: `<div class="slotted-demo-stage" data-layout="block">${measure(`<nav slSideNavigation value="row" [expanded]="['branch']">
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>section-label</div>
    <ul slSideNavigationList>
      <li slSideNavigationItem value="row">
        <a slSideNavigationLink href="#row">
          ${icon('lucidePackage')}
          <span slSideNavigationLabel>label</span>
          <span slSideNavigationDescription>description</span>
          ${count(12)}
        </a>
        <div slSideNavigationActions><code slText size="xs" tone="muted">actions</code></div>
      </li>
      <li slSideNavigationItem value="hybrid">
        <a slSideNavigationLink href="#hybrid">
          ${icon('lucideFileText')}
          <span slSideNavigationLabel>link + trigger</span>
          <span slSideNavigationEnd><span slBadge size="sm" tone="secondary" variant="soft">end</span></span>
        </a>
        <button slSideNavigationTrigger></button>
        <ul slSideNavigationGroup>${destination('hybrid-child', 'group › item › link')}</ul>
      </li>
      <li slSideNavigationItem value="branch">
        <button slSideNavigationTrigger>${icon('lucideTruck')}<span slSideNavigationLabel>trigger</span></button>
        <ul slSideNavigationGroup>${destination('child', 'group › item › link')}</ul>
      </li>
      <li slSideNavigationDivider></li>
      <li slSideNavigationSkeleton></li>
    </ul>
  </div>
</nav>`)}</div>`,
  }),
};

const groups = (attributes: string) => `<nav slSideNavigation ${attributes}>
  <ul slSideNavigationList>
    <li slSideNavigationItem value="deliveries">
      <button slSideNavigationTrigger>${icon('lucideMapPin')}<span slSideNavigationLabel>Deliveries</span>${count(38)}</button>
      <ul slSideNavigationGroup>
        ${destination('today', 'Today')}
        ${destination('late', 'Late')}
        ${destination('done', 'Done')}
      </ul>
    </li>
    <li slSideNavigationItem value="settings">
      <button slSideNavigationTrigger>${icon('lucideSettings')}<span slSideNavigationLabel>Settings</span></button>
      <ul slSideNavigationGroup>
        ${destination('org', 'Organization')}
        ${destination('users', 'Users')}
      </ul>
    </li>
  </ul>
</nav>`;

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Any number open',
        'Press Deliveries and Settings in turn: each opens on its own track, the chevron turns down, and the rows inside fade in as the room for them arrives.',
        measure(groups(`value="today" [expanded]="['deliveries']"`)),
      ),
      scene(
        'One at a time',
        'multiple=false: opening Settings closes Deliveries in the same request, so the column never holds two open groups.',
        measure(groups(`[expanded]="['deliveries']" [multiple]="false"`)),
      ),
    ),
  }),
};

export const Hybrid: Story = {
  parameters: scenario('hybrid'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Link and trigger side by side',
        'Reports navigates; the chevron beside it opens the children and is named by the same label. Finance holds the current destination and says so while closed.',
        measure(`<nav slSideNavigation value="invoices" [expanded]="['reports']">
  <ul slSideNavigationList>
    <li slSideNavigationItem value="reports">
      <a slSideNavigationLink href="#reports">${icon('lucideChartNoAxesColumn')}<span slSideNavigationLabel>Reports</span></a>
      <button slSideNavigationTrigger></button>
      <ul slSideNavigationGroup>${destination('monthly', 'Monthly')}${destination('yearly', 'Annual')}</ul>
    </li>
    <li slSideNavigationItem value="finance">
      <button slSideNavigationTrigger>${icon('lucideCreditCard')}<span slSideNavigationLabel>Finance</span></button>
      <ul slSideNavigationGroup>${destination('invoices', 'Invoices')}</ul>
    </li>
  </ul>
</nav>`),
      ),
      scene(
        'Five levels',
        'Under a row with a mark the children stand under its words; under a row without one the indent is a constant step, so the fifth level still has room for a name.',
        measure(`<nav slSideNavigation value="bh" [autoExpand]="false" [expanded]="['regions', 'southeast', 'minas']">
  <ul slSideNavigationList>
    <li slSideNavigationItem value="regions">
      <button slSideNavigationTrigger>${icon('lucideMapPin')}<span slSideNavigationLabel>By region</span>${count(128)}</button>
      <ul slSideNavigationGroup>
        ${destination('north', 'North')}
        <li slSideNavigationItem value="southeast">
          <button slSideNavigationTrigger><span slSideNavigationLabel>Sudeste</span></button>
          <ul slSideNavigationGroup>
            ${destination('sp', 'Atlanta', null, count(36))}
            <li slSideNavigationItem value="minas">
              <button slSideNavigationTrigger><span slSideNavigationLabel>Florida</span></button>
              <ul slSideNavigationGroup>
                ${destination('bh', 'Miami', null, count(12))}
                ${destination('udi', 'Orlando and Central Florida')}
              </ul>
            </li>
          </ul>
        </li>
        <li slSideNavigationItem value="south">
          <button slSideNavigationTrigger><span slSideNavigationLabel>Sul</span></button>
          <ul slSideNavigationGroup>${destination('cwb', 'Curitiba')}</ul>
        </li>
      </ul>
    </li>
  </ul>
</nav>`),
      ),
    ),
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => ({
    template: `<div class="slotted-demo-stage" data-layout="block">${measure(`<nav slSideNavigation value="orders">
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>Operations</div>
    <ul slSideNavigationList>
      ${destination('dashboard', 'Dashboard', 'lucideChartNoAxesColumn')}
      ${destination('orders', 'Orders', 'lucidePackage', count(412))}
      ${destination('warehouses', 'Warehouses', 'lucideWarehouse')}
    </ul>
  </div>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>Administration</div>
    <ul slSideNavigationList>
      ${destination('users', 'Users', 'lucideUsers')}
      ${destination('settings', 'Settings', 'lucideSettings')}
      <li slSideNavigationDivider></li>
      <li slSideNavigationItem value="new">
        <button slSideNavigationLink>
          ${icon('lucidePlus')}
          <span slSideNavigationLabel>New load</span>
          <span slSideNavigationEnd><kbd slKbd>N</kbd></span>
        </button>
      </li>
    </ul>
  </div>
</nav>`)}</div>`,
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    props: {
      value: signal<string | null>('orders'),
      reason: signal('—'),
    },
    template: grid(
      2,
      scene(
        'Owned by the application',
        'A press asks value to move and the application sets it. Go to Late moves it from outside: the destination is inside a closed group, so autoExpand opens Deliveries with the reason select.',
        measure(`<div slStack [gap]="4">
  <p slText size="sm" tone="muted">value: {{ value() ?? 'null' }} · reason: {{ reason() }}</p>
  <button slButton size="sm" variant="outline" (click)="value.set('late')">Ir para Atrasadas</button>
  ${aurora(`[value]="value()" (valueChangeRequest)="value.set($event.value); reason.set($event.reason)"`)}
</div>`),
      ),
      scene(
        'Hidden, and said by the parent',
        'autoExpand off: Late is current inside a closed Deliveries, so the parent row carries the ground until the group opens and the leaf takes it.',
        measure(aurora(`value="late" [autoExpand]="false"`)),
      ),
    ),
  }),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    template: grid(
      2,
      scene(
        'mode=compact',
        'A rail of marks, each a square the width of the mark, centerd. Hover or focus a row for its name; Shipments and Orders carry a dot for the count they cannot show.',
        measure(aurora('mode="compact"')),
      ),
      scene(
        'mode=auto, read from the width',
        'The same column with no mode stated. In this measure it is labelled; in the shell’s collapsed region, fifty pixels wide, the stylesheet makes it a rail before any script runs.',
        measure(aurora()),
      ),
    ),
  }),
};

export const Flyout: Story = {
  parameters: scenario('flyout'),
  render: () => ({
    props: { flyout: signal<string | null>(null), reason: signal('—') },
    template: grid(
      2,
      scene(
        'Press Deliveries',
        'The group is presented beside the rail, from the trigger’s edge. A press outside, Escape, focus leaving it, or a destination inside it closes it, each with its reason.',
        measure(aurora('mode="compact"')),
      ),
      scene(
        'Owned by the application',
        'flyout names the one group beside the rail, or null. It is transient by design and never writes into expanded.',
        measure(`<div slStack [gap]="4">
  <p slText size="sm" tone="muted">flyout: {{ flyout() ?? 'null' }} · reason: {{ reason() }}</p>
  ${aurora(`mode="compact" [flyout]="flyout()" (flyoutChangeRequest)="flyout.set($event.value); reason.set($event.reason)"`)}
</div>`),
      ),
    ),
  }),
};

/** A shorter column, for the scenes that compare three of them. */
const short = (
  attributes = '',
) => `<nav slSideNavigation value="orders" [expanded]="['deliveries']" ${attributes}>
  <ul slSideNavigationList>
    ${destination('dashboard', 'Dashboard', 'lucideChartNoAxesColumn')}
    ${destination('orders', 'Encomendas', 'lucidePackage', count(412))}
    <li slSideNavigationItem value="deliveries">
      <button slSideNavigationTrigger>${icon('lucideMapPin')}<span slSideNavigationLabel>Deliveries</span>${count(38)}</button>
      <ul slSideNavigationGroup>${destination('today', 'Today')}${destination('late', 'Late')}</ul>
    </li>
    ${destination('settings', 'Settings', 'lucideSettings')}
  </ul>
</nav>`;

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: grid(
      1,
      scene(
        'sm',
        'Thirty-pixel rows on the compact control step, for a secondary navigation inside a page.',
        measure(short('size="sm"')),
      ),
      scene(
        'md',
        'The default. Inside app-shell it reads the row geometry the shell publishes, so every left edge in the frame agrees.',
        measure(short('size="md"')),
      ),
      scene(
        'lg',
        'Thirty-eight-pixel rows with the larger mark and type step, for a column that is the product’s primary surface.',
        measure(short('size="lg"')),
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Current, expanded, disabled',
        'Orders is current on the accent ground; Deliveries is expanded with its chevron down; Billing is disabled, dimmed and refusing the press with its href still in place.',
        measure(aurora(`[expanded]="['deliveries']"`)),
      ),
      scene(
        'Hover, press, focus',
        'Hover washes the row on the neutral ground; a press darkens it at once; Tab draws the ring inside the row, where a column that scrolls cannot clip it.',
        measure(aurora('value="dashboard"')),
      ),
    ),
  }),
};

const awkward = (attributes = '') => `<nav slSideNavigation value="september" ${attributes}>
  <ul slSideNavigationList>
    ${destination('config', 'Organization and integration settings', 'lucideSettings', count(120))}
    ${destination('september', 'Monthly report · September', 'lucideFileText', count(12))}
    ${destination('october', 'Monthly report · October', 'lucideFileText', count(4))}
    ${destination('url', 'https://aurora.example/reports/2026/monthly/september', 'lucideMapPin')}
    ${destination('customers', 'العملاء', 'lucideUsers', count(4))}
    ${destination('loads', 'Loads', 'lucidePackage', '<span slSideNavigationDescription>14 awaiting dispatch at the Long Beach warehouse</span>')}
  </ul>
</nav>`;

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      1,
      scene(
        'truncate=end',
        'The default: one line, cut at the end. Hover or focus a cut row and the tooltip carries the whole label — and the whole description under it.',
        measure(awkward()),
      ),
      scene(
        'truncate=middle',
        'The start and the tail survive, so setembro and outubro stay two rows. The whole text is the row’s accessible name.',
        measure(awkward('truncate="middle"')),
      ),
      scene(
        'truncate=none',
        'On request the label wraps and a URL breaks inside itself. A row twice the height of its neighbours is the cost, which is why it is not the default.',
        measure(awkward('truncate="none"')),
      ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Destinations on their way',
        'Three skeleton rows in the geometry of the rows they stand for: the mark’s square and the label’s bar, so nothing moves when the column lands.',
        measure(`<nav slSideNavigation value="dashboard" aria-busy="true">
  <ul slSideNavigationList>
    ${destination('dashboard', 'Dashboard', 'lucideChartNoAxesColumn')}
    <li slSideNavigationSkeleton labelSize="55%"></li>
    <li slSideNavigationSkeleton labelSize="70%"></li>
    <li slSideNavigationSkeleton labelSize="45%"></li>
  </ul>
</nav>`),
      ),
      scene(
        'Children on their way',
        'A group whose destinations are still loading: the row opened, the request carried its reason, and the skeletons hold the room.',
        measure(`<nav slSideNavigation [expanded]="['deliveries']">
  <ul slSideNavigationList>
    <li slSideNavigationItem value="deliveries">
      <button slSideNavigationTrigger>${icon('lucideMapPin')}<span slSideNavigationLabel>Deliveries</span></button>
      <ul slSideNavigationGroup aria-busy="true">
        <li slSideNavigationSkeleton labelSize="50%"></li>
        <li slSideNavigationSkeleton labelSize="65%"></li>
      </ul>
    </li>
  </ul>
</nav>`),
      ),
    ),
  }),
};

export const Shell: Story = {
  parameters: scenario('shell'),
  render: () => ({
    template: `<div class="slotted-demo-viewport" data-frame="window" data-layout="page" data-size="tall">
  <div slAppShell navMode="inline">
    <header slAppShellBanner>
      <div slAppShellBrand>
        <button slAppShellNavToggle></button>
        <span slText size="sm" weight="medium">Aurora Logistics</span>
      </div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavBody>
        ${aurora(`[expanded]="['deliveries']"`).replace('<nav slSideNavigation', '<div slSideNavigation').replace('</nav>', '</div>')}
      </div>
    </nav>
    <main slAppShellMain>
      <p slText size="sm" tone="muted">Press the toggle: the region narrows to its rail and the column follows, read from the region’s own width.</p>
    </main>
  </div>
</div>`,
  }),
};

export const Defaults: Story = {
  decorators: [
    applicationConfig({
      providers: [
        provideSideNavigationDefaults({ guides: false, multiple: false, truncate: 'middle' }),
      ],
    }),
  ],
  parameters: scenario('defaults'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One at a time, no guides, middle cut',
        'provideSideNavigationDefaults carries the three decisions for every column under it.',
        measure(aurora(`[expanded]="['deliveries']"`)),
      ),
      scene(
        'A column that states its own',
        'Under the same provider, guides stated on the column win: the guide is back and the rest still comes from the provider.',
        measure(aurora(`[expanded]="['deliveries']" guides`)),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Badge, Avatar, Kbd',
        'A toned count is a Badge in end; a person is an Avatar in icon; a shortcut is a Kbd. The family draws none of them and gives each its box.',
        measure(`<nav slSideNavigation value="inbox">
  <ul slSideNavigationList>
    ${destination('inbox', 'Caixa de entrada', 'lucidePackage', '<span slSideNavigationEnd><span slBadge size="sm" tone="danger" variant="solid">3</span></span>')}
    <li slSideNavigationItem value="ana">
      <a slSideNavigationLink href="#anna">
        <span slSideNavigationIcon><span slAvatar size="xs" tone="accent" variant="soft"><span slAvatarFallback>AB</span></span></span>
        <span slSideNavigationLabel>Anna Bell</span>
        <span slSideNavigationDescription>Coordinator</span>
      </a>
    </li>
    ${destination('search', 'Procurar', 'lucideChartNoAxesColumn', '<span slSideNavigationEnd><kbd slKbd>⌘K</kbd></span>')}
  </ul>
</nav>`),
      ),
      scene(
        'A router’s link, and actions beside a row',
        'The directive sits on the consumer’s own a, so routerLink and routerLinkActive live where they always do and an aria-current the router wrote is read. Actions stand outside the a.',
        measure(`<nav slSideNavigation>
  <ul slSideNavigationList>
    <li slSideNavigationItem value="loads">
      <a slSideNavigationLink href="#cargas" aria-current="page">${icon('lucidePackage')}<span slSideNavigationLabel>Loads</span></a>
    </li>
    <li slSideNavigationItem value="team">
      <a slSideNavigationLink href="#team">${icon('lucideUsers')}<span slSideNavigationLabel>Team</span></a>
      <div slSideNavigationActions>
        <button slButton size="sm" variant="ghost" aria-label="Add member"><ng-icon name="lucidePlus" size="14" /></button>
      </div>
    </li>
  </ul>
</nav>`),
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { log: signal('—') },
    template: grid(
      2,
      scene(
        'Tab, arrows, Home, End, Escape',
        'Tab lands on Dashboard like any link. ArrowDown walks the rows, skipping a closed group; open Deliveries, walk into it, and Escape closes it and lands on its trigger.',
        measure(aurora(`[expanded]="['deliveries']"`)),
      ),
      scene(
        'Which device asked',
        'Every request carries its reason: pointer or keyboard from a press, escape from the key, select when autoExpand opened a parent.',
        measure(`<div slStack [gap]="4">
  <p slText size="sm" tone="muted">{{ log() }}</p>
  ${aurora(`(expandedChangeRequest)="log.set('expanded → [' + $event.value.join(', ') + '] · ' + $event.reason)" (valueChangeRequest)="log.set('value → ' + $event.value + ' · ' + $event.reason)"`)}
</div>`),
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The landmark and its name',
        'A nav named Main navigation holding a list of nine items; each branch a button that says collapsed or expanded; one link that says current page.',
        measure(aurora(`aria-label="Main navigation" [expanded]="['deliveries']"`)),
      ),
      scene(
        'A rail keeps every name',
        'The label leaves the eye and not the DOM: a reader still hears Encomendas, current page, and a sighted keyboard user sees the tooltip on focus.',
        measure(aurora('mode="compact"')),
      ),
    ),
  }),
};
