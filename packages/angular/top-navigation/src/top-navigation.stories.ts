import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown, lucideClipboardCheck, lucideSearch } from '@ng-icons/lucide';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import {
  SlAppShell,
  SlAppShellBanner,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavToggle,
} from '@slotted/angular/app-shell';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlShortcut } from '@slotted/angular/kbd';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import {
  SlPopover,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlStack } from '@slotted/angular/stack';
import {
  SlTextField,
  SlTextFieldEnd,
  SlTextFieldInput,
  SlTextFieldStart,
} from '@slotted/angular/text-field';
import {
  SlNavigationMenuContent,
  SlNavigationMenuDescription,
  SlNavigationMenuLabel,
  SlNavigationMenuLink,
  SlNavigationMenuLinks,
} from '@slotted/angular/navigation-menu';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderHeading,
  SlPageHeaderSubheading,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlText } from '@slotted/angular/typography';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlTopNavigation } from './top-navigation';
import { provideTopNavigationDefaults } from './top-navigation-defaults';
import type { TopNavigationSize } from './top-navigation-defaults';
import {
  SlTopNavigationAccount,
  SlTopNavigationAction,
  SlTopNavigationActions,
  SlTopNavigationBrand,
  SlTopNavigationContext,
  SlTopNavigationCount,
  SlTopNavigationHelp,
  SlTopNavigationHome,
  SlTopNavigationItem,
  SlTopNavigationLink,
  SlTopNavigationList,
  SlTopNavigationMark,
  SlTopNavigationName,
  SlTopNavigationNav,
  SlTopNavigationNotifications,
  SlTopNavigationSearch,
  SlTopNavigationTrigger,
} from './top-navigation-parts';
import { ANGULAR_TOP_NAVIGATION_DOCS, ANGULAR_TOP_NAVIGATION_TOKENS } from './top-navigation.docs';

interface TopNavigationStoryArgs {
  frame: boolean;
  size: TopNavigationSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOP_NAVIGATION_DOCS.topNavigation.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    priority: Priority,
    panel: Panel,
    search: Search,
    sections: Sections,
    current: Current,
    actions: Actions,
    context: Context,
    size: Size,
    states: States,
    content: Content,
    shell: Shell,
    standalone: Standalone,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<TopNavigationStoryArgs> = {
  title: 'Components/TopNavigation',
  decorators: [
    applicationConfig({
      providers: [provideIcons({ lucideChevronsUpDown, lucideClipboardCheck, lucideSearch })],
    }),
    moduleMetadata({
      imports: [
        NgIcon,
        SlNavigationMenuContent,
        SlNavigationMenuDescription,
        SlNavigationMenuLabel,
        SlNavigationMenuLink,
        SlNavigationMenuLinks,
        SlTopNavigation,
        SlTopNavigationBrand,
        SlTopNavigationHome,
        SlTopNavigationMark,
        SlTopNavigationName,
        SlTopNavigationContext,
        SlTopNavigationNav,
        SlTopNavigationList,
        SlTopNavigationItem,
        SlTopNavigationLink,
        SlTopNavigationTrigger,
        SlTopNavigationSearch,
        SlTopNavigationActions,
        SlTopNavigationHelp,
        SlTopNavigationNotifications,
        SlTopNavigationCount,
        SlTopNavigationAccount,
        SlTopNavigationAction,
        SlAppShell,
        SlAppShellBanner,
        SlAppShellMain,
        SlAppShellNav,
        SlAppShellNavBody,
        SlAppShellNavToggle,
        SlAvatar,
        SlAvatarFallback,
        SlBadge,
        SlButton,
        SlButtonEnd,
        SlPage,
        SlPageBody,
        SlPageHeader,
        SlPageHeaderHeading,
        SlPageHeaderSubheading,
        SlPageHeaderTitle,
        SlPageHeaderTitleArea,
        SlPageHeaderTitleRow,
        SlMenu,
        SlMenuGroup,
        SlMenuItem,
        SlMenuSeparator,
        SlMenuTrigger,
        SlPopover,
        SlPopoverBody,
        SlPopoverContent,
        SlPopoverDescription,
        SlPopoverHeader,
        SlPopoverLayer,
        SlPopoverTitle,
        SlPopoverTrigger,
        SlShortcut,
        SlStack,
        SlText,
        SlTextField,
        SlTextFieldEnd,
        SlTextFieldInput,
        SlTextFieldStart,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TopNavigation',
        description:
          'The bar across the top of an application: the mark, what the application is right now, the destinations, the search and the global controls, folding by priority into a panel as its own width goes.',
        framework: 'Angular',
        ...ANGULAR_TOP_NAVIGATION_DOCS.topNavigation,
        tokens: ANGULAR_TOP_NAVIGATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TopNavigationStoryArgs>;

/* ── Templates ─────────────────────────────────────────────────────────── */

/** The freight operator's mark: a consumer's own artwork, as any mark is. */
const MARK = `<svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
  <rect fill="var(--slotted-tone-accent-solid)" height="18" rx="5" width="18" x="3" y="3" />
  <path d="M7 15.5 12 7l5 8.5" stroke="var(--slotted-tone-accent-on-solid)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
</svg>`;

const brand = (name = 'Aurora Logistics') => `<div slTopNavigationBrand>
  <a slTopNavigationHome href="#home">
    <span slTopNavigationMark>${MARK}</span>
    <span slTopNavigationName>${name}</span>
  </a>
</div>`;

const item = (value: string, label: string, priority = 'medium', attributes = '') =>
  `<li slTopNavigationItem value="${value}" priority="${priority}" ${attributes}><a slTopNavigationLink href="#${value}">${label}</a></li>`;

/** The section that opens a panel of destinations: Frota, after Cargas. */
const fleet = () => `<li slTopNavigationItem value="frota">
  <button slTopNavigationTrigger>Frota</button>
  <div slNavigationMenuContent columns="2">
    <ul slNavigationMenuLinks>
      <li><a slNavigationMenuLink href="#vehicles"><span slNavigationMenuLabel>Vehicles</span><span slNavigationMenuDescription>License plates, capacity and documents.</span></a></li>
      <li><a slNavigationMenuLink href="#drivers"><span slNavigationMenuLabel>Drivers</span><span slNavigationMenuDescription>Schedules, licenses and driving hours.</span></a></li>
      <li><a slNavigationMenuLink href="#maintenance"><span slNavigationMenuLabel>Maintenance</span><span slNavigationMenuDescription>Scheduled services and open breakdowns.</span></a></li>
    </ul>
  </div>
</li>`;

const destinations = ({
  disabled = [],
  withFleet = true,
  only,
}: { disabled?: readonly string[]; only?: number; withFleet?: boolean } = {}) => {
  const rows = [
    item('dashboard', 'Dashboard', 'high'),
    item('loads', 'Loads', 'high'),
    ...(withFleet ? [fleet()] : []),
    item('reports', 'Reports', 'low'),
    item('billing', 'Billing', 'low', disabled.includes('billing') ? 'disabled' : ''),
  ];
  return `<nav slTopNavigationNav><ul slTopNavigationList>${(only === undefined ? rows : rows.slice(0, only)).join('')}</ul></nav>`;
};

const search = (attributes = '') => `<div slTopNavigationSearch>
  <div slTextField variant="subtle" ${attributes}>
    <span slTextFieldStart><ng-icon name="lucideSearch" size="16" /></span>
    <input slTextFieldInput type="search" aria-label="Search" placeholder="Search loads, customers, routes…" />
    <span slTextFieldEnd><kbd slShortcut keys="mod+k" size="sm" variant="soft"></kbd></span>
  </div>
</div>`;

const workspace = (
  ref = 'workspaces',
) => `<button slButton size="sm" tone="secondary" variant="ghost" [slMenuTriggerFor]="${ref}">
  Portland · Operations
  <span slButtonEnd><ng-icon name="lucideChevronsUpDown" /></span>
</button>
<sl-menu #${ref} align="start" side="bottom">
  <sl-menu-group label="Workspaces">
    <button slMenuItem>Portland · Operations</button>
    <button slMenuItem>Seattle · Distribution</button>
    <button slMenuItem>Madrid · Cross-border</button>
  </sl-menu-group>
</sl-menu>`;

const context = (ref = 'workspaces', environment = false) => `<div slTopNavigationContext>
  ${workspace(ref)}
  ${environment ? '<span slBadge size="sm" tone="warning" variant="soft">Staging</span>' : ''}
</div>`;

const notifications = (
  count: number | string = 3,
  attributes = '',
) => `<ng-container slPopover align="end" side="bottom" ${attributes}>
  <button slTopNavigationNotifications slPopoverTrigger><span slTopNavigationCount>${count}</span></button>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader><div slPopoverTitle>Notifications</div></div>
      <div slPopoverBody><div slPopoverDescription>Load 4821 delivered in Austin · North Route 40 min late · Invoice 2026-0917 awaiting approval</div></div>
    </div>
  </ng-template>
</ng-container>`;

/** A control of the product's own beside the bell: approvals, with its own glyph and the same count. */
const approvals = (
  count: number | string = 7,
) => `<ng-container slPopover align="end" side="bottom">
  <button slTopNavigationAction slPopoverTrigger label="Approvals, ${count} pending">
    <ng-icon name="lucideClipboardCheck" />
    <span slTopNavigationCount>${count}</span>
  </button>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader><div slPopoverTitle>Approvals</div></div>
      <div slPopoverBody><div slPopoverDescription>Quote 2026-114 above the discount · Credit note 88 awaiting validation</div></div>
    </div>
  </ng-template>
</ng-container>`;

const account = (
  ref = 'account',
  name = '',
  attributes = '',
) => `<button slTopNavigationAccount [slMenuTriggerFor]="${ref}" ${attributes}>
  <span slAvatar size="xs" tone="accent" variant="soft"><span slAvatarFallback>AB</span></span>
  ${name === '' ? '' : `<span>${name}</span>`}
</button>
<sl-menu #${ref} align="end" side="bottom">
  <sl-menu-group label="Anna Barnes · Dispatcher">
    <button slMenuItem>Profile</button>
    <button slMenuItem>Preferences</button>
  </sl-menu-group>
  <hr slMenuSeparator />
  <button slMenuItem>Sign out</button>
</sl-menu>`;

const helpLink = `<a slTopNavigationHelp href="#ajuda"></a>`;

const helpPopover = `<ng-container slPopover align="end" side="bottom">
  <button slTopNavigationHelp slPopoverTrigger></button>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader><div slPopoverTitle>Help</div></div>
      <div slPopoverBody><div slPopoverDescription>Documentation, keyboard shortcuts and Aurora’s support channel.</div></div>
    </div>
  </ng-template>
</ng-container>`;

const actions = ({
  accountName = '',
  count = 3,
  help = 'link',
  ref = 'a',
}: {
  accountName?: string;
  count?: number | string;
  help?: 'link' | 'popover';
  ref?: string;
} = {}) => `<div slTopNavigationActions>
  ${help === 'link' ? helpLink : helpPopover}
  ${notifications(count)}
  ${account(`account${ref}`, accountName)}
</div>`;

/** The whole bar of Aurora Logistics' back office. */
const aurora = ({
  attributes = '',
  ref = 'a',
  withContext = true,
  withSearch = true,
}: { attributes?: string; ref?: string; withContext?: boolean; withSearch?: boolean } = {}) =>
  `<header slTopNavigation value="dashboard" ${attributes}>
  ${brand()}
  ${withContext ? context(`workspaces${ref}`) : ''}
  ${destinations()}
  ${withSearch ? search() : ''}
  ${actions({ ref })}
</header>`;

/** The four rooms a bar is read in; each lands in one of the family's steps. */
type Room = 'desktop' | 'laptop' | 'tablet' | 'phone';

/**
 * A bar's stage: a room of a stated width — the documentation column is
 * narrower than the bar's widest step, so the width is the scene's to say —
 * holding a viewport four rems tall for a bar on its own, or a tall window
 * when a layer opens under it.
 */
const stage = (body: string, room: Room = 'desktop', tall = false) =>
  `<div class="slotted-demo-room" data-room="${room}"><div class="slotted-demo-viewport" ${tall ? 'data-size="tall"' : ''}>${body}</div></div>`;

const scene = (label: string, note: string, body: string) => `<section class="slotted-demo-scene">
  <header class="slotted-demo-scene__header">
    <span class="slotted-demo-scene__label">${label}</span>
    <span class="slotted-demo-scene__note">${note}</span>
  </header>
  <div class="slotted-demo-stage" data-layout="block">${body}</div>
</section>`;

const grid = (...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="1">${scenes.join('')}</div>`;

const framed = (room: Room, body: string) =>
  `<div class="slotted-demo-room" data-room="${room}"><div class="slotted-demo-viewport" data-frame="window" data-layout="page" data-size="tall">${body}</div></div>`;

/* ── Stories ───────────────────────────────────────────────────────────── */

export const Playground: Story = {
  args: { frame: true, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: stage(
      aurora({ attributes: `[frame]="frame" [size]="size" skipTo="conteudo"` }),
      'desktop',
      true,
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: stage(`<header slTopNavigation value="link">
  <div slTopNavigationBrand>
    <a slTopNavigationHome href="#home">
      <span slTopNavigationMark>${MARK}</span>
      <span slTopNavigationName>name</span>
    </a>
  </div>
  <div slTopNavigationContext><code slText size="xs" tone="muted">context</code></div>
  <nav slTopNavigationNav>
    <ul slTopNavigationList>
      ${item('link', 'link', 'high')}
      <li slTopNavigationItem value="trigger" priority="high">
        <button slTopNavigationTrigger>trigger › indicator</button>
        <div slNavigationMenuContent columns="1"><ul slNavigationMenuLinks><li><a slNavigationMenuLink href="#content">navigation-menu › content › link</a></li></ul></div>
      </li>
      ${item('folded', 'item priority=low', 'low')}
    </ul>
  </nav>
  <div slTopNavigationSearch>
    <div slTextField variant="subtle"><input slTextFieldInput aria-label="search" placeholder="search › text-field" /></div>
  </div>
  <div slTopNavigationActions>
    <a slTopNavigationHelp href="#help">help</a>
    <button slTopNavigationNotifications><span slTopNavigationCount>3</span></button>
    <button slTopNavigationAccount><span slAvatar size="xs" tone="secondary" variant="soft"><span slAvatarFallback>ac</span></span></button>
  </div>
</header>`),
  }),
};

export const Priority: Story = {
  parameters: scenario('priority'),
  render: () => ({
    template: grid(
      scene(
        'Desktop, 1024 pixels',
        'Above 1024 every destination stands in the bar, the search is a field, and more is nowhere.',
        stage(aurora({ ref: 'p1' }), 'desktop'),
      ),
      scene(
        'Laptop, 900 pixels',
        'Under 1024: Reports and Billing — the low ones — have folded, and more counts two. Everything else keeps its place, and the field keeps its floor.',
        stage(aurora({ ref: 'p2' }), 'laptop'),
      ),
      scene(
        'Tablet, 640 pixels',
        'Under 1024 and from 600 up, the bar folds as on the laptop: Reports and Billing are in more, which counts two. Fleet — the medium one — the workspace, the field and the name keep their places in the bar.',
        stage(aurora({ ref: 'p3' }), 'tablet'),
      ),
      scene(
        'Phone, 375 pixels',
        'Under 600 Fleet — the medium one — folds, the workspace moves to the panel and the search becomes a magnifier in the actions; under 480 Dashboard and Loads — the high ones — fold too, help moves to the panel, the name leaves the eye, and the gaps close up. More counts five. What stays is the mark, more, the magnifier, the bell and the account.',
        stage(aurora({ ref: 'p4' }), 'phone'),
      ),
      scene(
        'Nothing to fold',
        'A bar with no destinations, no context and no help renders no more at any width: there is nothing for a panel to hold.',
        stage(
          `<header slTopNavigation>${brand()}<div slTopNavigationActions>${notifications()}${account('accountp5')}</div></header>`,
          'phone',
        ),
      ),
    ),
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { moreOpen: signal(true), reason: signal('—') },
    template: grid(
      scene(
        'Open on a phone, everything folded',
        'The panel takes the bar’s whole width: the workspace first, the destinations as rows — Dashboard current, Fleet with its chevron — and Help last. Press Loads: the panel closes with select.',
        `<div slStack gap="4">${stage(
          aurora({
            attributes: `[(moreOpen)]="moreOpen" (moreOpenChangeRequest)="reason.set($event.reason)"`,
            ref: 'n1',
          }),
          'phone',
          true,
        )}<p slText size="sm" tone="muted">Last request: {{ reason() }}</p></div>`,
      ),
      scene(
        'Open on a tablet, the low ones folded',
        'Above 480 the panel stands under the bar’s end at 20rem. Tab from more into it, press Escape, and focus returns to more; a press outside closes it too, and a press on more toggles it.',
        stage(aurora({ attributes: `[moreOpen]="true"`, ref: 'n2' }), 'tablet', true),
      ),
      scene(
        'A folded section keeps its menu',
        'Fleet folded into the panel still opens its own menu: the row is the same element, with the same slMenuTriggerFor on it.',
        stage(
          `<header slTopNavigation [moreOpen]="true">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${fleet()}</ul></nav><div slTopNavigationActions>${account('accountn3')}</div></header>`,
          'phone',
          true,
        ),
      ),
    ),
  }),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () => ({
    template: grid(
      scene(
        'Laptop: the field',
        'Above 600 the field stands in the middle of the bar, up to 28rem wide, with the shortcut at its end. Nothing here needs the magnifier.',
        stage(aurora({ ref: 's1', withContext: false }), 'laptop'),
      ),
      scene(
        'Phone: the magnifier',
        'Below 600 the field has left and a magnifier stands first in the actions. Press it: the field takes the bar and focus lands in it.',
        stage(aurora({ ref: 's2', withContext: false }), 'phone'),
      ),
      scene(
        'Phone: the field open over the bar',
        'Everything else has left the eye; the cross at the end and Escape hand the bar back and return focus to the magnifier. Focus leaving the field closes it too.',
        stage(
          aurora({ attributes: `[searchOpen]="true"`, ref: 's3', withContext: false }),
          'phone',
        ),
      ),
    ),
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => ({
    template: grid(
      scene(
        'Frota opens a menu',
        'Press Fleet: slMenuTriggerFor writes aria-expanded and data-open on the trigger, the chevron turns, and the items are the menu’s own. Arrow keys inside are the menu’s.',
        stage(
          `<header slTopNavigation value="dashboard">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}${fleet()}</ul></nav><div slTopNavigationActions>${account('accountx1')}</div></header>`,
          'laptop',
          true,
        ),
      ),
      scene(
        'Two sections side by side',
        'Operations and Administration as two sections of one navigation menu: one surface, one open at a time, and moving the pointer from one to the other switches without a delay.',
        stage(
          `<header slTopNavigation>${brand()}<nav slTopNavigationNav><ul slTopNavigationList>
  <li slTopNavigationItem value="operacoes" priority="high">
    <button slTopNavigationTrigger>Operations</button>
    <div slNavigationMenuContent columns="1"><ul slNavigationMenuLinks><li><a slNavigationMenuLink href="#loads">Loads</a></li><li><a slNavigationMenuLink href="#routes">Routes</a></li><li><a slNavigationMenuLink href="#deliveries">Deliveries</a></li></ul></div>
  </li>
  <li slTopNavigationItem value="administracao" priority="high">
    <button slTopNavigationTrigger>Administration</button>
    <div slNavigationMenuContent columns="1"><ul slNavigationMenuLinks><li><a slNavigationMenuLink href="#users">Users</a></li><li><a slNavigationMenuLink href="#billing">Billing</a></li><li><a slNavigationMenuLink href="#integrations">Integrations</a></li></ul></div>
  </li>
</ul></nav><div slTopNavigationActions>${account('accountx2')}</div></header>`,
          'laptop',
          true,
        ),
      ),
    ),
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    props: { value: signal<string | null>('cargas'), reason: signal('—') },
    template: grid(
      scene(
        'Bound two ways',
        'Press a destination: the request carries pointer, or keyboard for Enter, and value follows. The request can be cancelled before it does.',
        `<div slStack gap="4">${stage(
          `<header slTopNavigation [(value)]="value" (valueChangeRequest)="reason.set($event.reason)">${brand()}${destinations({ withFleet: false })}<div slTopNavigationActions>${account('accountc1')}</div></header>`,
          'desktop',
        )}<p slText size="sm" tone="muted">value: {{ value() ?? 'null' }} · last reason: {{ reason() }}</p></div>`,
      ),
      scene(
        'A link that says so itself',
        'Routes states current on the row — what routerLinkActive writes as aria-current — and wins over the root’s value, which names Dashboard.',
        stage(
          `<header slTopNavigation value="dashboard">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}<li slTopNavigationItem value="routes" priority="high"><a slTopNavigationLink href="#routes" current>Routes</a></li></ul></nav></header>`,
          'laptop',
        ),
      ),
      scene(
        'The current destination, folded',
        'Billing is current and low priority; on a laptop it has folded, and more carries the current mark in its place.',
        stage(
          `<header slTopNavigation value="faturacao">${brand()}${destinations({ withFleet: false })}<div slTopNavigationActions>${account('accountc2')}</div></header>`,
          'laptop',
        ),
      ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: grid(
      scene(
        'Help as a destination, the bell, the account',
        'Help is a link to the help center; the bell opens a popover with what is waiting; the account opens a menu under the avatar. Hover any of them for its name.',
        stage(
          `<header slTopNavigation>${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}</ul></nav>${actions({ ref: 'g1' })}</header>`,
          'laptop',
          true,
        ),
      ),
      scene(
        'Help as a trigger',
        'Without an href, help is a button the consumer wraps: here a popover with the documentation, the shortcuts and the support channel.',
        stage(
          `<header slTopNavigation>${brand()}${actions({ help: 'popover', ref: 'g2' })}</header>`,
          'laptop',
          true,
        ),
      ),
      scene(
        'A control of the product’s own',
        'Approvals beside the bell: the same square, ink, hover and focus ring as the controls the family marks, the product’s own glyph inside, and the count over its corner. Nothing in the cluster is a different kind of button.',
        stage(
          `<header slTopNavigation>${brand()}<div slTopNavigationActions>${helpLink}${approvals()}${notifications()}${account('accountg4')}</div></header>`,
          'laptop',
          true,
        ),
      ),
      scene(
        'One digit, two, three',
        'The count is a disc for one digit and a pill from two, growing outward so it never covers the bell or the control beside it. 99+ is the product’s own format.',
        stage(
          `<header slTopNavigation>${brand()}<div slTopNavigationActions>${notifications(3)}${notifications(12)}${notifications('99+')}${account('accountg3')}</div></header>`,
          'tablet',
        ),
      ),
    ),
  }),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => ({
    template: grid(
      scene(
        'After the brand',
        'The workspace switcher opens a menu of the operator’s three sites; the environment badge says this is not production. Both are the consumer’s own content in the context region.',
        stage(
          `<header slTopNavigation>${brand()}${context('workspacesk1', true)}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}</ul></nav><div slTopNavigationActions>${account('accountk1')}</div></header>`,
          'laptop',
          true,
        ),
      ),
      scene(
        'Moved to the panel',
        'On a phone the whole region has moved to the top of the panel — the same element, so the switcher still opens its menu from there.',
        stage(
          `<header slTopNavigation [moreOpen]="true">${brand()}${context('workspacesk2', true)}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}</ul></nav><div slTopNavigationActions>${account('accountk2')}</div></header>`,
          'phone',
          true,
        ),
      ),
    ),
  }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: grid(
      scene(
        'sm',
        'Thirty-pixel controls at comfortable: a bar for a dense tool.',
        stage(aurora({ attributes: 'size="sm"', ref: 'z1', withContext: false })),
      ),
      scene(
        'md',
        'The default, and the step the shell’s row geometry is read at: thirty-four pixels.',
        stage(aurora({ attributes: 'size="md"', ref: 'z2', withContext: false })),
      ),
      scene(
        'lg',
        'Thirty-eight-pixel controls, for a product with room to breathe.',
        stage(aurora({ attributes: 'size="lg"', ref: 'z3', withContext: false })),
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      scene(
        'Current, open, disabled',
        'Dashboard is current; press Fleet to see the open section hold its ground; Billing is disabled — grey, still focusable, its href kept and its press refused; the account is disabled too.',
        stage(
          `<header slTopNavigation value="dashboard">${brand()}${destinations({ disabled: ['billing'] })}<div slTopNavigationActions>${helpLink}${notifications()}<button slTopNavigationAccount disabled><span slAvatar size="xs" tone="secondary" variant="soft"><span slAvatarFallback>JR</span></span></button></div></header>`,
          'desktop',
          true,
        ),
      ),
      scene(
        'Hover, press, focus',
        'Every control answers the pointer with a ground and a press with a darker one; Tab draws the ring outside each.',
        stage(
          `<header slTopNavigation>${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}${item('routes', 'Routes', 'high')}</ul></nav><div slTopNavigationActions>${account('accountst1')}</div></header>`,
          'desktop',
        ),
      ),
      scene(
        'Open layers hold the ground',
        'A bell whose popover is open, an account whose menu is open: data-open keeps the hover ground while the layer is up.',
        stage(
          `<header slTopNavigation>${brand()}<div slTopNavigationActions>${notifications(2, '[open]="true"')}${account('accountst2')}</div></header>`,
          'laptop',
          true,
        ),
      ),
    ),
  }),
};

const longBar = (ref: string) =>
  `<header slTopNavigation value="acompanhamento">${brand('Integrated International Logistics Operations Management Platform')}<nav slTopNavigationNav><ul slTopNavigationList>${item('acompanhamento', 'Order tracking', 'high')}${item('planeamento', 'Route and time-window planning', 'low')}</ul></nav>${actions({ count: '99+', ref })}</header>`;

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      scene(
        'A long name and long destinations',
        'Integrated International Logistics Operations Management Platform is cut at 16rem; the destinations keep their words; the count keeps its three characters.',
        stage(longBar('ct1'), 'desktop'),
      ),
      scene(
        'The same content on a tablet',
        'The longer destination has folded, the name has shortened to its ellipsis — it gives way before any control does — and the pill still reads 99+.',
        stage(longBar('ct2'), 'tablet'),
      ),
      scene(
        'A name beside the avatar',
        'Maria Bartolomeu stands beside her avatar above 600 pixels and gives way below it; the avatar is the whole control on a phone.',
        stage(
          `<header slTopNavigation value="dashboard">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}</ul></nav>${search()}${actions({ accountName: 'Maria Bartolomeu', ref: 'ct3' })}</header>`,
          'desktop',
        ),
      ),
      scene(
        'Right to left',
        'The same bar under dir=rtl: the brand at the start, the actions at the end, the count at the bell’s inline-end corner, the chevron still pointing down.',
        stage(`<header slTopNavigation value="lawha" dir="rtl">
  <div slTopNavigationBrand><a slTopNavigationHome href="#home"><span slTopNavigationMark>${MARK}</span><span slTopNavigationName>أورورا للخدمات اللوجستية</span></a></div>
  <nav slTopNavigationNav aria-label="التنقل"><ul slTopNavigationList>
    ${item('lawha', 'لوحة التحكم', 'high')}
    ${item('shahnat', 'الشحنات', 'high')}
    <li slTopNavigationItem value="ustul"><button slTopNavigationTrigger>الأسطول</button><div slNavigationMenuContent columns="1"><ul slNavigationMenuLinks><li><a slNavigationMenuLink href="#markabat">المركبات</a></li><li><a slNavigationMenuLink href="#saiqun">السائقون</a></li></ul></div></li>
  </ul></nav>
  <div slTopNavigationSearch><div slTextField variant="subtle"><input slTextFieldInput type="search" aria-label="بحث" placeholder="ابحث عن الشحنات والعملاء…" /></div></div>
  <div slTopNavigationActions>
    <a slTopNavigationHelp href="#ajuda" aria-label="مساعدة"></a>
    <button slTopNavigationNotifications aria-label="الإشعارات"><span slTopNavigationCount>٣</span></button>
    <button slTopNavigationAccount aria-label="الحساب"><span slAvatar size="xs" tone="accent" variant="soft"><span slAvatarFallback>أب</span></span></button>
  </div>
</header>`),
      ),
    ),
  }),
};

export const Shell: Story = {
  parameters: scenario('shell'),
  render: () => ({
    template: framed(
      'desktop',
      `<div slAppShell navMode="inline">
    <header slAppShellBanner>
      <div slTopNavigation value="dashboard">
        <div slTopNavigationBrand>
          <button slAppShellNavToggle></button>
          <a slTopNavigationHome href="#home"><span slTopNavigationMark>${MARK}</span><span slTopNavigationName>Aurora Logistics</span></a>
        </div>
        ${context('workspacessh')}
        ${destinations()}
        ${search()}
        ${actions({ ref: 'sh' })}
      </div>
    </header>
    <nav slAppShellNav>
      <div slAppShellNavBody><p slText size="sm" tone="muted">The shell’s navigation column.</p></div>
    </nav>
    <main slAppShellMain>
      <p slText size="sm" tone="muted">The bar is a div inside the shell’s banner: no second landmark, no ground of its own, and its brand on the shell’s row inset so the toggle and the mark stand over the column’s marks. Press the toggle: the column narrows to its rail and the bar gains the width.</p>
    </main>
  </div>`,
    ),
  }),
};

export const Standalone: Story = {
  parameters: scenario('standalone'),
  render: () => ({
    template: framed(
      'desktop',
      `${aurora({ attributes: 'skipTo="conteudo-standalone"', ref: 'sa' })}
  <main slPage id="conteudo-standalone" landmark="none" scroll="ancestor" width="full" tabindex="-1">
    <header slPageHeader level="1" size="md">
      <div slPageHeaderTitleArea>
        <div slPageHeaderTitleRow>
          <div slPageHeaderTitle>
            <h1 slPageHeaderHeading>Operations dashboard</h1>
            <p slPageHeaderSubheading>412 loads in progress · 19 awaiting transport</p>
          </div>
        </div>
      </div>
    </header>
    <div slPageBody>
      <p slText size="sm" tone="muted">Press Tab once from the top of the page: the skip link appears at the start of the bar and Enter lands focus on this page, past every control in it.</p>
    </div>
  </main>`,
    ),
  }),
};

export const Defaults: Story = {
  decorators: [
    applicationConfig({
      providers: [provideTopNavigationDefaults({ size: 'lg' })],
    }),
  ],
  parameters: scenario('defaults'),
  render: () => ({
    template: grid(
      scene(
        'An application at the large step',
        'The provider carries the size; the bar does not state it. The words the icon-only controls are named by — hover the bell — come from the language in force.',
        stage(
          `<header slTopNavigation value="dashboard">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}${item('routes', 'Routes', 'high')}</ul></nav><div slTopNavigationActions><a slTopNavigationHelp href="#help"></a><button slTopNavigationNotifications><span slTopNavigationCount>3</span></button>${account('accountd1')}</div></header>`,
          'laptop',
        ),
      ),
      scene(
        'The bar still wins',
        'Under the same provider, a bar that states size="sm" renders at the small step.',
        stage(
          `<header slTopNavigation size="sm">${brand()}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}${item('routes', 'Routes', 'high')}</ul></nav><div slTopNavigationActions>${account('accountd2')}</div></header>`,
          'laptop',
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: scene(
      'Everything the bar composes',
      'A destination carrying the router’s aria-current, the workspace menu and the environment badge in the context, the shortcut in the search, a menu on Fleet and on the account, a popover on the bell.',
      stage(
        `<header slTopNavigation>${brand()}${context('workspacesco', true)}<nav slTopNavigationNav><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}<li slTopNavigationItem value="loads" priority="high"><a slTopNavigationLink href="#loads" aria-current="page">Loads</a></li>${fleet()}</ul></nav>${search()}${actions({ ref: 'co' })}</header>`,
        'desktop',
        true,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: {
      log: signal<string[]>([]),
      record(this: { log: ReturnType<typeof signal<string[]>> }, what: string) {
        this.log.update((entries) => [what, ...entries].slice(0, 6));
      },
    },
    template: scene(
      'Every control is a tab stop, on a tablet',
      'Skip, the mark, the workspace, Dashboard, Loads, Fleet, more, the panel’s rows when it is open, the field, help, the bell, the account — in that order, with no arrow keys.',
      `<div slStack gap="4">${stage(
        aurora({
          attributes: `skipTo="conteudo-keyboard" (moreOpenChangeRequest)="record('more ' + ($event.value ? 'open' : 'closed') + ' · ' + $event.reason)" (searchOpenChangeRequest)="record('search ' + ($event.value ? 'open' : 'closed') + ' · ' + $event.reason)" (valueChangeRequest)="record('value ' + $event.value + ' · ' + $event.reason)"`,
          ref: 'kb',
        }),
        'tablet',
        true,
      )}<div slStack gap="1">
  @if (log().length === 0) {
    <p slText size="sm" tone="muted">Tab through the bar; press Enter on a destination or on more; press Escape inside the panel.</p>
  }
  @for (entry of log(); track $index) {
    <p slText size="sm" tone="muted">{{ entry }}</p>
  }
</div></div>`,
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: scene(
      'Two landmarks, one list, four named buttons',
      'Open the accessibility tree: banner › navigation Main › list › link Dashboard, current page …; button More, 2, collapsed; search Search; link Help; button Notifications 3; button Account.',
      stage(
        `<header slTopNavigation aria-label="Aurora" value="dashboard">${brand()}<nav slTopNavigationNav aria-label="Main"><ul slTopNavigationList>${item('dashboard', 'Dashboard', 'high')}${item('loads', 'Loads', 'high')}${item('routes', 'Routes')}${item('reports', 'Reports', 'low')}${item('billing', 'Billing', 'low')}</ul></nav>${search()}${actions({ ref: 'ac' })}</header>`,
        'laptop',
      ),
    ),
  }),
};
