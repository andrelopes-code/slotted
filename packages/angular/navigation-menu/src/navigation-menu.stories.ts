import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarDays,
  lucideChartNoAxesColumn,
  lucideFileText,
  lucidePackage,
  lucideTruck,
  lucideUsers,
  lucideWarehouse,
} from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlButton, SlButtonLink } from '@slotted/angular/button';
import {
  SlTopNavigation,
  SlTopNavigationAccount,
  SlTopNavigationActions,
  SlTopNavigationBrand,
  SlTopNavigationContext,
  SlTopNavigationHome,
  SlTopNavigationName,
} from '@slotted/angular/top-navigation';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlNavigationMenu } from './navigation-menu';
import { provideNavigationMenuDefaults } from './navigation-menu-defaults';
import type { NavigationMenuOrientation, NavigationMenuSize } from './navigation-menu-defaults';
import {
  SlNavigationMenuContent,
  SlNavigationMenuDescription,
  SlNavigationMenuFooter,
  SlNavigationMenuGroup,
  SlNavigationMenuGroupLabel,
  SlNavigationMenuIcon,
  SlNavigationMenuItem,
  SlNavigationMenuLabel,
  SlNavigationMenuLink,
  SlNavigationMenuLinks,
  SlNavigationMenuList,
  SlNavigationMenuTrigger,
} from './navigation-menu-parts';
import {
  ANGULAR_NAVIGATION_MENU_DOCS,
  ANGULAR_NAVIGATION_MENU_TOKENS,
} from './navigation-menu.docs';

interface NavigationMenuStoryArgs {
  arrow: boolean;
  closeDelay: number;
  closeOnSelect: boolean;
  openDelay: number;
  orientation: NavigationMenuOrientation;
  size: NavigationMenuSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_NAVIGATION_MENU_DOCS.navigationMenu.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    links: Links,
    rich: Rich,
    groups: Groups,
    footer: Footer,
    current: Current,
    vertical: Vertical,
    nested: Nested,
    states: States,
    size: Size,
    content: Content,
    controlled: Controlled,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<NavigationMenuStoryArgs> = {
  title: 'Components/NavigationMenu',
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          lucideCalendarDays,
          lucideChartNoAxesColumn,
          lucideFileText,
          lucidePackage,
          lucideTruck,
          lucideUsers,
          lucideWarehouse,
        }),
      ],
    }),
    moduleMetadata({
      imports: [
        NgIcon,
        SlNavigationMenu,
        SlNavigationMenuList,
        SlNavigationMenuItem,
        SlNavigationMenuTrigger,
        SlNavigationMenuContent,
        SlNavigationMenuLinks,
        SlNavigationMenuLink,
        SlNavigationMenuIcon,
        SlNavigationMenuLabel,
        SlNavigationMenuDescription,
        SlNavigationMenuGroup,
        SlNavigationMenuGroupLabel,
        SlNavigationMenuFooter,
        SlTopNavigation,
        SlTopNavigationAccount,
        SlTopNavigationActions,
        SlTopNavigationBrand,
        SlTopNavigationContext,
        SlTopNavigationHome,
        SlTopNavigationName,
        SlAvatar,
        SlAvatarFallback,
        SlButton,
        SlButtonLink,
        SlText,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'NavigationMenu',
        description:
          'The sections of a site or an application in a row or a column, each a button that shows a panel of links on one shared surface that moves between them.',
        framework: 'Angular',
        ...ANGULAR_NAVIGATION_MENU_DOCS.navigationMenu,
        tokens: ANGULAR_NAVIGATION_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<NavigationMenuStoryArgs>;

/* ── Templates ─────────────────────────────────────────────────────────── */

/**
 * A box with room under the row for the panel, which is laid over the page
 * and takes no room of its own. The box clips, as a region of an application
 * does, and the surface measures itself against it.
 */
const room = (body: string, size: 'tall' | 'screen' = 'tall') =>
  `<div class="slotted-demo-viewport" data-place="top" data-size="${size}">${body}</div>`;

const scene = (label: string, note: string, body: string) => `<section class="slotted-demo-scene">
  <header class="slotted-demo-scene__header">
    <span class="slotted-demo-scene__label">${label}</span>
    <span class="slotted-demo-scene__note">${note}</span>
  </header>
  <div class="slotted-demo-stage" data-layout="block">${body}</div>
</section>`;

const grid = (columns: 1 | 2 | 3, ...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${scenes.join('')}</div>`;

const rich = (
  href: string,
  label: string,
  description: string,
  glyph: string | null,
  attributes = '',
) => `<li><a slNavigationMenuLink href="#${href}" ${attributes}>
  ${glyph === null ? '' : `<span slNavigationMenuIcon><ng-icon name="${glyph}" size="16" /></span>`}
  <span slNavigationMenuLabel>${label}</span>
  <span slNavigationMenuDescription>${description}</span>
</a></li>`;

const plain = (href: string, label: string, attributes = '') =>
  `<li><a slNavigationMenuLink href="#${href}" ${attributes}>${label}</a></li>`;

const productsPanel = (footer = true) => `<div slNavigationMenuContent columns="2">
  <ul slNavigationMenuLinks>
    ${rich('warehouse', 'Warehouse', 'Receipts, shipments and inventory by location.', 'lucideWarehouse')}
    ${rich('fleet', 'Fleet', 'Routes, fuel use and vehicle maintenance.', 'lucideTruck', 'current')}
    ${rich('billing', 'Billing', 'Invoices, credit notes and reconciliation.', 'lucideFileText')}
    ${rich('schedule', 'Schedule', 'Loading windows and scheduled deliveries.', 'lucideCalendarDays')}
    ${rich('customers', 'Customers', 'Accounts, contacts and commercial terms.', 'lucideUsers')}
    ${rich('reports', 'Reports', 'Available on the Business plan.', 'lucideChartNoAxesColumn', 'disabled')}
  </ul>
  ${
    footer
      ? `<div slNavigationMenuFooter>
    <span slText size="xs" tone="muted">New: demand forecast by warehouse.</span>
    <a slButtonLink size="sm" href="#products">See all</a>
  </div>`
      : ''
  }
</div>`;

const solutionsPanel = `<div slNavigationMenuContent columns="3">
  <div slNavigationMenuGroup>
    <div slNavigationMenuGroupLabel>By sector</div>
    <ul slNavigationMenuLinks>${plain('retalho', 'Retail')}${plain('industria', 'Industry')}${plain('saude', 'Healthcare')}</ul>
  </div>
  <div slNavigationMenuGroup>
    <div slNavigationMenuGroupLabel>By size</div>
    <ul slNavigationMenuLinks>${plain('pme', 'Small businesses')}${plain('media', 'Midsize')}${plain('grandes', 'Large accounts')}</ul>
  </div>
  <div slNavigationMenuGroup>
    <div slNavigationMenuGroupLabel>By team</div>
    <ul slNavigationMenuLinks>${plain('operacoes', 'Operations')}${plain('financas', 'Finance')}${plain('comercial', 'Sales')}</ul>
  </div>
</div>`;

const companyPanel = `<div slNavigationMenuContent>
  <ul slNavigationMenuLinks>${plain('sobre', 'About us')}${plain('carreiras', 'Careers')}${plain('imprensa', 'Press')}${plain('contactos', 'Contact')}</ul>
</div>`;

/** Aurora Logistics's site header: three sections and a direct link. */
const aurora = (attributes = '') => `<nav slNavigationMenu aria-label="Main" ${attributes}>
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="produtos">
      <button slNavigationMenuTrigger>Produtos</button>
      ${productsPanel()}
    </li>
    <li slNavigationMenuItem value="solucoes">
      <button slNavigationMenuTrigger>Solutions</button>
      ${solutionsPanel}
    </li>
    <li slNavigationMenuItem value="documentacao">
      <a slNavigationMenuLink href="#documentation">Documentation</a>
    </li>
    <li slNavigationMenuItem value="company">
      <button slNavigationMenuTrigger>Company</button>
      ${companyPanel}
    </li>
  </ul>
</nav>`;

const column = (
  attributes = '',
) => `<nav slNavigationMenu aria-label="Help" orientation="vertical" arrow ${attributes}>
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="home"><a slNavigationMenuLink href="#home">Home</a></li>
    <li slNavigationMenuItem value="help">
      <button slNavigationMenuTrigger>Help</button>
      <div slNavigationMenuContent>
        <ul slNavigationMenuLinks>${plain('guias', 'Guides')}${plain('api', 'API reference')}${plain('estado', 'Service status')}</ul>
      </div>
    </li>
    <li slNavigationMenuItem value="conta">
      <button slNavigationMenuTrigger>Account</button>
      <div slNavigationMenuContent>
        <ul slNavigationMenuLinks>${plain('profile', 'Profile')}${plain('invoices', 'Invoices')}</ul>
      </div>
    </li>
  </ul>
</nav>`;

/* ── Stories ───────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: {
    arrow: false,
    closeDelay: 300,
    closeOnSelect: true,
    openDelay: 200,
    orientation: 'horizontal',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: room(
      aurora(
        `value="produtos" [arrow]="arrow" [closeDelay]="closeDelay" [closeOnSelect]="closeOnSelect" [openDelay]="openDelay" [orientation]="orientation" [size]="size"`,
      ),
      'screen',
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: room(`<nav slNavigationMenu aria-label="Anatomia" arrow value="section">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="section">
      <button slNavigationMenuTrigger>trigger</button>
      <div slNavigationMenuContent columns="2">
        <div slNavigationMenuGroup>
          <div slNavigationMenuGroupLabel>group-label</div>
          <ul slNavigationMenuLinks>${rich('a', 'link › icon · label', 'description', 'lucidePackage')}</ul>
        </div>
        <div slNavigationMenuGroup>
          <div slNavigationMenuGroupLabel>links</div>
          <ul slNavigationMenuLinks>${plain('b', 'link')}${plain('c', 'link')}</ul>
        </div>
        <div slNavigationMenuFooter>
          <code slText size="xs" tone="muted">footer</code>
          <code slText size="xs" tone="muted">viewport ▸ arrow</code>
        </div>
      </div>
    </li>
    <li slNavigationMenuItem value="link"><a slNavigationMenuLink href="#link">link</a></li>
  </ul>
</nav>`),
  }),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => ({ template: room(aurora('value="company"')) }),
};

export const Rich: Story = {
  parameters: scenario('rich'),
  render: () => ({
    template: room(`<nav slNavigationMenu aria-label="Produtos" value="produtos">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="produtos">
      <button slNavigationMenuTrigger>Produtos</button>
      ${productsPanel(false)}
    </li>
    <li slNavigationMenuItem value="precos"><a slNavigationMenuLink href="#pricing">Pricing</a></li>
  </ul>
</nav>`),
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({ template: room(aurora('value="solucoes"')) }),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => ({ template: room(aurora('value="produtos"')) }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Every section closed',
        'Frota is the page: Produtos takes the accent ink on its trigger, so the reader sees which section they are in before opening anything.',
        room(aurora()),
      ),
      scene(
        'The section open',
        'Inside the panel the current link stands on the accent ground, with the accent edge in high-contrast.',
        room(aurora('value="produtos"')),
      ),
    ),
  }),
};

export const Vertical: Story = {
  parameters: scenario('vertical'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Beside the column',
        'The panel opens at the column’s end, level with Ajuda, with the arrow on the trigger’s middle.',
        room(column('value="ajuda"')),
      ),
      scene(
        'On a phone',
        'At 375 pixels the column has no room at its end: the panel drops under the trigger and the chevron turns down.',
        `<div class="slotted-demo-room" data-room="phone">${room(column('value="ajuda"'))}</div>`,
      ),
    ),
  }),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: () => ({
    template: room(`<nav slNavigationMenu aria-label="Catalog" value="catalogo">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="catalogo">
      <button slNavigationMenuTrigger>Catalog</button>
      <div slNavigationMenuContent columns="3">
        <div slNavigationMenu value="ferramentas">
          <ul slNavigationMenuList>
            <li slNavigationMenuItem value="ferramentas">
              <button slNavigationMenuTrigger>Tools</button>
              <div slNavigationMenuContent columns="2">
                <ul slNavigationMenuLinks>${plain('manuais', 'Hand')}${plain('eletricas', 'Power')}${plain('medicao', 'Measuring')}${plain('corte', 'Cutting')}</ul>
              </div>
            </li>
            <li slNavigationMenuItem value="embalagem">
              <button slNavigationMenuTrigger>Embalagem</button>
              <div slNavigationMenuContent columns="2">
                <ul slNavigationMenuLinks>${plain('caixas', 'Caixas')}${plain('paletes', 'Paletes')}</ul>
              </div>
            </li>
            <li slNavigationMenuItem value="seguranca">
              <button slNavigationMenuTrigger>Safety</button>
              <div slNavigationMenuContent columns="2">
                <ul slNavigationMenuLinks>${plain('epi', 'Personal protection')}</ul>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </li>
    <li slNavigationMenuItem value="marcas"><a slNavigationMenuLink href="#marcas">Marcas</a></li>
  </ul>
</nav>`),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: room(`<nav slNavigationMenu aria-label="Estados">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="produtos">
      <button slNavigationMenuTrigger>Produtos</button>
      <div slNavigationMenuContent><ul slNavigationMenuLinks>${plain('frota', 'Fleet', 'current')}</ul></div>
    </li>
    <li slNavigationMenuItem value="precos"><a slNavigationMenuLink href="#pricing" current>Pricing</a></li>
    <li slNavigationMenuItem value="parceiros" disabled>
      <button slNavigationMenuTrigger>Partners</button>
      <div slNavigationMenuContent></div>
    </li>
    <li slNavigationMenuItem value="blogue"><a slNavigationMenuLink href="#blogue" disabled>Blogue</a></li>
  </ul>
</nav>`),
  }),
};

const sized = (
  size: NavigationMenuSize,
) => `<nav slNavigationMenu aria-label="Size ${size}" size="${size}">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="company"><button slNavigationMenuTrigger>Company</button>${companyPanel}</li>
    <li slNavigationMenuItem value="pricing"><a slNavigationMenuLink href="#pricing">Pricing</a></li>
  </ul>
</nav>`;

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: grid(
      3,
      ...(['sm', 'md', 'lg'] as const).map((size) =>
        scene(
          size,
          `size="${size}" on the control scale: the trigger and the link stand at the height of a ${size} field.`,
          room(sized(size)),
        ),
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: room(`<nav slNavigationMenu aria-label="Extreme content" value="longo">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="longo">
      <button slNavigationMenuTrigger>Warehouse and distribution management</button>
      <div slNavigationMenuContent columns="2">
        <ul slNavigationMenuLinks>
          ${rich('reabastecimento', 'Replenishment planning across regional warehouses', 'Calculates transfers between warehouses from forecast demand, supplier lead times and the safety stock defined per item and per location.', 'lucideWarehouse')}
          ${rich('sem-marca', 'No mark', 'A rich link with no icon starts the title at the margin.', null)}
          ${rich('referencia', 'Item_reference_without_spaces_ABCDEFGHIJ', 'A string with no break.', 'lucideFileText')}
        </ul>
      </div>
    </li>
  </ul>
</nav>`),
  }),
};

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => ({
    props: { section: null as string | null, log: [] as string[] },
    template: room(
      `${aurora(`[(value)]="section" (valueChangeRequest)="log = [($event.value ?? 'null') + ' · ' + $event.reason].concat(log).slice(0, 3)"`)}
<output slText size="xs" tone="muted">{{ log.length === 0 ? 'Open a section.' : log.join(' — ') }}</output>`,
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  decorators: [
    applicationConfig({
      providers: [provideNavigationMenuDefaults({ arrow: true, openDelay: 50, size: 'sm' })],
    }),
  ],
  render: () => ({ template: room(aurora()) }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `<div class="slotted-demo-room" data-room="desktop">${room(`<header slTopNavigation>
  <div slTopNavigationBrand>
    <a slTopNavigationHome href="#home"><span slTopNavigationName>Aurora Logistics</span></a>
  </div>
  <div slTopNavigationContext>${aurora()}</div>
  <div slTopNavigationActions>
    <button slTopNavigationAccount aria-label="Conta de Ana Barros">
      <span slAvatar size="xs" tone="accent" variant="soft"><span slAvatarFallback>AB</span></span>
    </button>
  </div>
</header>`)}</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: room(
      `${aurora('#menu="slNavigationMenu"')}
<button slButton size="sm" variant="outline" type="button" (click)="menu.focus('produtos')">Focar Produtos</button>`,
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({ template: room(aurora()) }),
};
