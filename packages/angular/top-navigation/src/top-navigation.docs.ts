import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import topNavigationTokens from '@slotted/styles/top-navigation/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TOP_NAVIGATION_TOKENS = topNavigationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned TopNavigation decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlTopNavigation, SlTopNavigationAccount, SlTopNavigationAction, SlTopNavigationActions, SlTopNavigationBrand, SlTopNavigationContext, SlTopNavigationCount, SlTopNavigationHelp, SlTopNavigationHome, SlTopNavigationItem, SlTopNavigationLink, SlTopNavigationList, SlTopNavigationMark, SlTopNavigationName, SlTopNavigationNav, SlTopNavigationNotifications, SlTopNavigationSearch, SlTopNavigationTrigger, provideTopNavigationDefaults } from '@slotted/angular/top-navigation';",
  selector:
    '[slTopNavigation], [slTopNavigationBrand], [slTopNavigationHome], [slTopNavigationMark], [slTopNavigationName], [slTopNavigationContext], nav[slTopNavigationNav], ul[slTopNavigationList], li[slTopNavigationItem], a[slTopNavigationLink], button[slTopNavigationTrigger], [slTopNavigationSearch], [slTopNavigationActions], a[slTopNavigationHelp], button[slTopNavigationHelp], button[slTopNavigationNotifications], [slTopNavigationCount], button[slTopNavigationAccount], a[slTopNavigationAction], button[slTopNavigationAction]',
  exportAs:
    'slTopNavigation, slTopNavigationNav, slTopNavigationList, slTopNavigationItem, slTopNavigationLink, slTopNavigationTrigger, slTopNavigationSearch, slTopNavigationActions, slTopNavigationHelp, slTopNavigationNotifications, slTopNavigationAccount, slTopNavigationAction, slTopNavigationMore',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the header carrying slTopNavigation, or a div inside app-shell',
    required: true,
    purpose:
      'The bar, and the query container it answers: data-ui="top-navigation", data-size, data-frame while it paints its own ground, data-search-open while the search has taken the bar. A header on its own — the banner landmark; inside the shell’s banner, which already is one, a div.',
  },
  {
    part: 'skip',
    element: 'a, rendered by the root',
    required: false,
    purpose:
      'The first focusable thing in the bar: a link to #skipTo, visible only while focused. Rendered when skipTo names a target; inside app-shell the shell already renders one per region.',
  },
  {
    part: 'brand',
    element: 'div',
    required: true,
    purpose:
      'The start cluster: app-shell’s nav-toggle when the bar is in the shell, then home. It starts on the row inset the shell publishes, so the toggle and the mark stand over the marks in the column.',
  },
  {
    part: 'home',
    element: 'a with an href, or a span without one',
    required: false,
    purpose:
      'The mark and the name, linked to the start of the application. Below 480 pixels the name leaves the eye and not the DOM, so the link keeps its accessible name. routerLink lives on the same element.',
  },
  {
    part: 'mark',
    element: 'span',
    required: false,
    purpose: 'The box the logo stands in: square, the height of the bar’s controls, aria-hidden.',
  },
  {
    part: 'name',
    element: 'span',
    required: false,
    purpose:
      'The product’s name, one line, cut with an ellipsis at --slotted-top-navigation-name-max.',
  },
  {
    part: 'context',
    element: 'div',
    required: false,
    purpose:
      'What the application is right now — the workspace, the store, the environment — as the consumer’s own content. It keeps its width in the bar; below 600 pixels the element is moved to the top of the panel.',
  },
  {
    part: 'nav',
    element: 'nav',
    required: false,
    purpose:
      'The navigation landmark, named by messages.navigation unless the consumer writes aria-label, and a navigation-menu root on the same element through a host directive: data-ui="navigation-menu", the shared surface after its list, and [(value)], valueChangeRequest and the menu’s delays bound on slTopNavigationNav. It builds the panel right after itself in DOM order.',
  },
  {
    part: 'list',
    element: 'ul',
    required: false,
    purpose: 'The destinations, in the consumer’s order, with more in its own li at the end.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose:
      'One destination or one section. Carries data-value, data-priority, data-collapsed while the width has folded it, data-current and data-disabled.',
  },
  {
    part: 'link',
    element: 'a',
    required: false,
    purpose:
      'The destination, with aria-current="page" while current — read from the router’s own attribute when it writes one. aria-disabled and a refused press while disabled, the href kept.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'A section that opens: the navigation-menu trigger of the slNavigationMenuContent after it in the same item — aria-expanded, aria-controls, data-open, the chevron, a press and a resting pointer.',
  },
  {
    part: 'indicator',
    element: 'span, rendered by the trigger',
    required: false,
    purpose:
      'The trigger’s chevron, the chevron-down Glyph element, turned half a turn while open.',
  },
  {
    part: 'more',
    element: 'button, rendered by the list',
    required: false,
    purpose:
      'The disclosure button of the panel: aria-expanded, aria-controls, data-overflow with the count of what folded, data-current while the current destination is folded. Shown by the stylesheet as soon as anything folds.',
  },
  {
    part: 'panel',
    element: 'div, built by the nav',
    required: false,
    purpose:
      'What did not fit, inside the root and right after the nav: the context, the panel-list, the help. Under the bar, full width below 480 pixels. Present in the DOM closed, out of sight and out of the tab order.',
  },
  {
    part: 'panel-list',
    element: 'ul, built by the nav',
    required: false,
    purpose:
      'The list the folded items are moved into while the panel is present — the same li, so a section keeps its panel, which opens in line under its trigger there, and a link keeps its badge — and moved back from when it has left.',
  },
  {
    part: 'search',
    element: 'div',
    required: false,
    purpose:
      'The search region, with the consumer’s text-field inside, standing at the start of the middle of the bar and growing to 28rem, never under 12rem: the first thing to give way when the bar is short of room. Below 600 pixels it exists only while searchOpen, and then takes the whole bar.',
  },
  {
    part: 'search-toggle',
    element: 'button, rendered by the actions',
    required: false,
    purpose:
      'The magnifier that asks searchOpen to be true, rendered whenever the bar has a search and shown below 600 pixels while the search is closed.',
  },
  {
    part: 'search-close',
    element: 'button, rendered by the search',
    required: false,
    purpose: 'The cross at the end of the open search below 600 pixels: the pointer’s way back.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The end cluster, in the consumer’s order. Recommended: search, help, notifications, account — Carbon’s order, which a reader has learnt.',
  },
  {
    part: 'help',
    element: 'a with an href, or a button',
    required: false,
    purpose:
      'The question mark. Its projected content is its label, clipped in the bar and shown as a row in the panel below 480 pixels; the family’s message when there is none.',
  },
  {
    part: 'notifications',
    element: 'button',
    required: false,
    purpose: 'The bell, with count in its corner. It never folds.',
  },
  {
    part: 'count',
    element: 'span',
    required: false,
    purpose:
      'The number of what is waiting, drawn by the family over the bell’s top-end corner as tabular figures on an accent disc that becomes a pill from two digits, out of the flow so the control keeps the bell’s width. Inside the button, so inside its name.',
  },
  {
    part: 'account',
    element: 'button',
    required: false,
    purpose:
      'A pill around the consumer’s avatar — xs at md, one step under the control — and, above 600 pixels, a name beside it. slMenuTriggerFor on the same element. It never folds.',
  },
  {
    part: 'action',
    element: 'a with an href, or a button',
    required: false,
    purpose:
      'A global control of the product’s own — approvals, tasks — in the same square, ink and states as the marked controls. The consumer projects its glyph, sized by the control, and names it: label when the words carry a count, aria-label when they do not. slTopNavigationCount inside it stands over its corner. It never folds.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'The bar of a freight operator',
    note: 'Aurora Logistics’ bar with every region filled, in a desktop room. The room scrolls sideways where the page is narrower; the steps the bar folds at are the next demonstration.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-playground',
      language: 'angular',
      label: 'The bar',
      source: `<header slTopNavigation value="dashboard" skipTo="content">
  <div slTopNavigationBrand>
    <a slTopNavigationHome routerLink="/">
      <span slTopNavigationMark><ng-icon name="auroraMark" /></span>
      <span slTopNavigationName>Aurora Logistics</span>
    </a>
  </div>
  <nav slTopNavigationNav>
    <ul slTopNavigationList>
      <li slTopNavigationItem value="dashboard" priority="high">
        <a slTopNavigationLink routerLink="/dashboard">Dashboard</a>
      </li>
      <li slTopNavigationItem value="reports" priority="low">
        <a slTopNavigationLink routerLink="/reports">Reports</a>
      </li>
    </ul>
  </nav>
  <div slTopNavigationSearch>
    <div slTextField variant="subtle">
      <input slTextFieldInput type="search" placeholder="Search loads, customers, routes…" />
    </div>
  </div>
  <div slTopNavigationActions>
    <a slTopNavigationHelp routerLink="/ajuda"></a>
    <button slTopNavigationNotifications><span slTopNavigationCount>3</span></button>
    <button slTopNavigationAccount>
      <span slAvatar size="xs"><span slAvatarFallback>AB</span></span>
    </button>
  </div>
</header>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, named',
    note: 'The bar with each part labelled by its data-part: the brand, the context, the destinations with a section trigger, the search, and the four global controls. The panel and its list stand in the DOM after the nav, closed.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-anatomy',
      language: 'angular',
      label: 'The parts a consumer writes',
      source: `<header slTopNavigation>
  <div slTopNavigationBrand>
    <a slTopNavigationHome href="/">
      <span slTopNavigationMark>…</span>
      <span slTopNavigationName>name</span>
    </a>
  </div>
  <div slTopNavigationContext>…</div>
  <nav slTopNavigationNav>
    <ul slTopNavigationList>
      <li slTopNavigationItem value="link"><a slTopNavigationLink href="/link">link</a></li>
      <li slTopNavigationItem value="trigger">
        <button slTopNavigationTrigger>trigger</button>
        <div slNavigationMenuContent>…</div>
      </li>
    </ul>
  </nav>
  <div slTopNavigationSearch>…</div>
  <div slTopNavigationActions>
    <a slTopNavigationHelp href="/help"></a>
    <button slTopNavigationNotifications><span slTopNavigationCount>3</span></button>
    <button slTopNavigationAccount>…</button>
  </div>
</header>`,
    }),
  },
  {
    id: 'priority',
    title: 'Three steps of the width',
    note: 'The same bar in four rooms of a stated width. On a desktop everything shows; on a laptop (under 1024) the low items have folded into more; a tablet at 640 folds the same low items and keeps the rest; on a phone the medium ones fold under 600, where the search becomes a magnifier and the context moves to the panel, and the high ones and the help fold under 480, where the name leaves the eye.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-priority',
      language: 'angular',
      label: 'Which destination gives way first',
      source: `<ul slTopNavigationList>
  <li slTopNavigationItem value="dashboard" priority="high">
    <a slTopNavigationLink href="/dashboard">Dashboard</a>
  </li>
  <li slTopNavigationItem value="routes"><a slTopNavigationLink href="/routes">Routes</a></li>
  <li slTopNavigationItem value="faturacao" priority="low">
    <a slTopNavigationLink href="/faturacao">Billing</a>
  </li>
</ul>`,
    }),
  },
  {
    id: 'panel',
    title: 'What folded, under the bar',
    note: 'Press more: on a phone the panel takes the bar’s whole width, on a tablet it stands under the bar’s end. The folded destinations are rows, the workspace at the top and help at the bottom. A press on a row closes it with the reason select; Escape returns focus to more; a press outside closes it too.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-panel',
      language: 'angular',
      label: 'The panel, bound two ways',
      source: `<header slTopNavigation [(moreOpen)]="moreOpen" (moreOpenChangeRequest)="log($event.reason)">
  …
</header>`,
    }),
  },
  {
    id: 'search',
    title: 'The search gives way to a magnifier',
    note: 'On a laptop the field stands at the start of the middle of the bar, after the brand and the destinations. On a phone it is a magnifier in the actions; pressing it opens the field over the whole bar with focus inside, and Escape, the cross or focus leaving it hand the bar back.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-search',
      language: 'angular',
      label: 'The search region and its field',
      source: `<div slTopNavigationSearch>
  <div slTextField variant="subtle">
    <span slTextFieldStart><ng-icon name="lucideSearch" size="16" /></span>
    <input slTextFieldInput type="search" aria-label="Procurar" placeholder="Procurar cargas…" />
    <span slTextFieldEnd><kbd slShortcut keys="mod+k" size="sm" variant="soft"></kbd></span>
  </div>
</div>`,
    }),
  },
  {
    id: 'sections',
    title: 'A section that opens a panel of destinations',
    note: 'Frota is a section of the navigation menu the nav part already is: its panel opens on the shared surface under the bar, a resting pointer opens it after a delay, and a second section switches without one. Folded into the panel, the section opens its links in line.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-sections',
      language: 'angular',
      label: 'A section and its panel',
      source: `<li slTopNavigationItem value="frota">
  <button slTopNavigationTrigger>Frota</button>
  <div slNavigationMenuContent>
    <ul slNavigationMenuLinks>
      <li><a slNavigationMenuLink routerLink="/fleet/vehicles">Vehicles</a></li>
    </ul>
  </div>
</li>`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'value on the root names the destination and a press asks it to move with the device’s reason; a link that states current itself wins. Where the current destination has folded, more carries the mark in its place.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-current',
      language: 'angular',
      label: 'The destination bound two ways',
      source: `<header slTopNavigation [(value)]="value" (valueChangeRequest)="log($event.reason)">…</header>`,
    }),
  },
  {
    id: 'actions',
    title: 'The global controls',
    note: 'Help as a link to a help center or as the trigger of a popover; the bell with a count over its corner that grows to a pill away from it; the account as a menu’s trigger; a control of the product’s own — approvals — in the same square, with its own glyph and the same count. Each carries its name for a reader and repeats it in a tooltip.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-actions',
      language: 'angular',
      label: 'Notifications, approvals and the account as triggers',
      source: `<div slTopNavigationActions>
  <a slTopNavigationHelp href="/ajuda"></a>
  <ng-container slPopover>
    <button slTopNavigationAction slPopoverTrigger [label]="'Approvals, ' + pending() + ' pending'">
      <ng-icon name="lucideClipboardCheck" />
      <span slTopNavigationCount>{{ pending() }}</span>
    </button>
    <ng-template slPopoverLayer><div slPopoverContent>…</div></ng-template>
  </ng-container>
  <ng-container slPopover>
    <button slTopNavigationNotifications slPopoverTrigger>
      <span slTopNavigationCount>12</span>
    </button>
    <ng-template slPopoverLayer><div slPopoverContent>…</div></ng-template>
  </ng-container>
  <button slTopNavigationAccount [slMenuTriggerFor]="account">
    <span slAvatar size="xs"><span slAvatarFallback>AB</span></span>
  </button>
  <sl-menu #account>…</sl-menu>
</div>`,
    }),
  },
  {
    id: 'context',
    title: 'What the application is right now',
    note: 'A workspace switcher and an environment badge after the brand. On a phone the whole region is moved to the top of the panel — the same element, so the switcher still opens its menu there.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-context',
      language: 'angular',
      label: 'The workspace and the environment',
      source: `<div slTopNavigationContext>
  <button slButton size="sm" tone="secondary" variant="ghost" [slMenuTriggerFor]="workspaces">
    Portland · Operations
    <span slButtonEnd><ng-icon name="lucideChevronsUpDown" /></span>
  </button>
  <sl-menu #workspaces>…</sl-menu>
  <span slBadge size="sm" tone="warning" variant="soft">Staging</span>
</div>`,
    }),
  },
  {
    id: 'size',
    title: 'Three control heights',
    note: 'sm, md and lg move every control in the bar together — the mark, the destinations, the four global controls — and the bar’s own height with them. All three move again with density.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-size',
      language: 'angular',
      label: 'The compact step',
      source: `<header slTopNavigation size="sm">…</header>`,
    }),
  },
  {
    id: 'states',
    title: 'The states a destination can be in',
    note: 'Current, a section open, disabled — a disabled destination keeps its href and its name and refuses the press — and the hover, press and focus every control answers. Help and the account with their layers open hold the pointer’s ground.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-states',
      language: 'angular',
      label: 'A disabled destination',
      source: `<li slTopNavigationItem value="faturacao" disabled>
  <a slTopNavigationLink href="/faturacao">Billing</a>
</li>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A product name of nine words, cut with an ellipsis and, when the room runs out, given up before any control; destinations of four words each; a count of three characters; the account with a name beside the avatar; and the same bar in a right-to-left document.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-content',
      language: 'angular',
      label: 'A name beside the avatar',
      source: `<button slTopNavigationAccount>
  <span slAvatar size="xs"><span slAvatarFallback>MB</span></span>
  <span>Maria Bartolomeu</span>
</button>`,
    }),
  },
  {
    id: 'shell',
    title: 'Inside the shell',
    note: 'The bar as the only child of app-shell’s banner: a div rather than a second banner, no ground of its own, the shell’s nav-toggle in the brand and the mark over the column’s marks. Press the toggle and the bar keeps its place.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-shell',
      language: 'angular',
      label: 'The banner holding the bar',
      source: `<div slAppShell>
  <header slAppShellBanner>
    <div slTopNavigation value="dashboard">
      <div slTopNavigationBrand>
        <button slAppShellNavToggle></button>
        <a slTopNavigationHome href="/">…</a>
      </div>
      …
    </div>
  </header>
  <nav slAppShellNav>…</nav>
  <main slAppShellMain>…</main>
</div>`,
    }),
  },
  {
    id: 'standalone',
    title: 'On its own, above a page',
    note: 'A header with its own ground, rule and inset, a skip link that appears on the first Tab, and a page under it. Nothing here is sticky: an application that wants the bar pinned writes position: sticky on it.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-standalone',
      language: 'angular',
      label: 'A framed header with a skip link',
      source: `<header slTopNavigation skipTo="conteudo">…</header>
<main id="conteudo" tabindex="-1">…</main>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for an application',
    note: 'The provider carries the size and the frame for every bar under it — an application at the large step — and a bar that states one itself still wins. The words on the icon-only controls come from the language in force.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-defaults',
      language: 'ts',
      label: 'The provider',
      source: `@Component({
  providers: [provideTopNavigationDefaults({ size: 'lg' })],
  template: '<header slTopNavigation>…</header>',
})
export class Shell {}`,
    }),
  },
  {
    id: 'composition',
    title: 'Composed with what sits beside it',
    note: 'routerLink and routerLinkActive on the destination, which is where aria-current comes from; a badge in the context; a kbd in the search; a navigation-menu panel on a section, a menu on the account and on the workspace; a popover on the bell.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-composition',
      language: 'angular',
      label: 'The router’s link as the destination',
      source: `<li slTopNavigationItem value="cargas">
  <a slTopNavigationLink routerLink="/cargas" routerLinkActive ariaCurrentWhenActive="page">
    Cargas
  </a>
</li>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches every control, in the order they stand: the skip link, the mark, each destination, more, the panel when it is open, the search, help, the bell, the account. Escape closes the panel or the open search and lands on the control that opened it. The reason each request carries is shown.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-keyboard',
      language: 'angular',
      label: 'Which device asked',
      source: `<header
  slTopNavigation
  (moreOpenChangeRequest)="log($event.reason)"
  (searchOpenChangeRequest)="log($event.reason)"
  (valueChangeRequest)="log($event.reason)"
>
  …
</header>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A banner landmark holding a navigation landmark with a list of links, one of them current; a button named More that expands a panel; a search; and three buttons named for what they open. Nothing is a menubar and nothing writes tabindex.',
    snippet: defineSnippet({
      id: 'top-navigation-angular-accessibility',
      language: 'angular',
      label: 'The landmarks’ names',
      source: `<header slTopNavigation aria-label="Aurora">
  <nav slTopNavigationNav aria-label="Principal">…</nav>
</header>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload:
      'ChangeRequest<string | null>: value, previous, reason (pointer | keyboard | programmatic), source and cancel()',
    when: 'Before the current destination moves, on a press of a link. Cancelling refuses; the navigation itself is the anchor’s. value itself is a model, so [(value)] follows.',
  },
  {
    name: 'moreOpenChangeRequest',
    payload:
      'ChangeRequest<boolean> with reason (pointer | keyboard | select | escape | outsidePress | resize | programmatic)',
    when: 'Before the panel opens or closes: a press on more, a link pressed inside the panel, Escape, a press outside, the width widening until nothing is folded, or openMore()/closeMore() on the instance. moreOpen is a model.',
  },
  {
    name: 'searchOpenChangeRequest',
    payload:
      'ChangeRequest<boolean> with reason (pointer | keyboard | escape | blur | resize | programmatic)',
    when: 'Below 600 pixels: before the magnifier opens the field, and before Escape, the cross, focus leaving the field or the width widening past 600 closes it. Above, the value has no effect. searchOpen is a model.',
  },
  {
    name: 'collapseChange',
    payload: 'readonly string[]: the values of the folded items in DOM order',
    when: 'After the set of folded items changed: the bar crossed one of its three steps. A fact, not a request — the width decided it.',
  },
  {
    name: '(click), (focus), (keydown) on every control',
    payload: 'the element’s own events',
    when: 'Whenever the a or button fires them, on the consumer’s own element. preventDefault() in (click) refuses the family’s part.',
  },
];

export const ANGULAR_TOP_NAVIGATION_DOCS = {
  topNavigation: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'model<string | null>',
        'null',
        'slTopNavigation',
        'The current destination’s value, two-way. A link that states current itself, or carries the router’s aria-current, still wins',
      ],
      [
        'moreOpen',
        'model<boolean>',
        'false',
        'slTopNavigation',
        'Whether the panel is shown, two-way',
      ],
      [
        'searchOpen',
        'model<boolean>',
        'false',
        'slTopNavigation',
        'Whether the search has taken the bar, below 600 pixels, two-way. Above 600 it has no effect',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slTopNavigation, provideTopNavigationDefaults',
        'The control height of everything in the bar, from the control scale',
      ],
      [
        'frame',
        'boolean',
        'true',
        'slTopNavigation, provideTopNavigationDefaults',
        'Whether the root paints its own ground, rule and inset. Unstated, it does on its own and not inside app-shell, whose banner already paints',
      ],
      [
        'landmark',
        'boolean',
        'true',
        'slTopNavigation, provideTopNavigationDefaults',
        'The intent the element carries: a header on its own, a div inside app-shell’s banner. The element is the consumer’s',
      ],
      [
        'skipTo',
        'string',
        '—',
        'slTopNavigation',
        'The id of the element the skip link jumps to. Absent, no skip link is rendered',
      ],
      [
        'messages',
        'Partial<TopNavigationMessages>',
        '—',
        'slTopNavigation',
        'Words laid over the language in force, key by key — navigation, more, moreCount, search, closeSearch, help, notifications, account, skip: the words on the controls that have no visible text',
      ],
      [
        'value',
        'string',
        '—',
        'slTopNavigationItem',
        'The item’s identity: what value names it by and what collapseChange reports',
      ],
      [
        'priority',
        "'high' | 'medium' | 'low'",
        'medium',
        'slTopNavigationItem',
        'Which step of the width folds the item: low under 1024 pixels, medium under 600, high under 480',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slTopNavigationItem',
        'The row and everything in it refuse interaction; the link keeps its href and its name',
      ],
      [
        'current',
        'boolean',
        '—',
        'slTopNavigationLink',
        'Whether this is the current destination, stated on the row. Unstated, an aria-current the router wrote is read instead; both win over the root’s value',
      ],
      [
        'aria-label',
        'string',
        'the family’s message',
        'slTopNavigationNav, slTopNavigationHelp, slTopNavigationNotifications, slTopNavigationAccount',
        'The name the consumer writes on the element, read before the family writes its own',
      ],
    ]),
    composition: apiRows([
      [
        'the element',
        'header, div, nav, ul, li, a, button, span',
        '—',
        'every part',
        'Every directive goes on the consumer’s own element, so routerLink, routerLinkActive, slMenuTriggerFor, slPopoverTrigger, native attributes and (click) live where they always do',
      ],
      [
        'exportAs',
        'slTopNavigation, slTopNavigationItem, slTopNavigationLink, slTopNavigationTrigger, slTopNavigationSearch, slTopNavigationMore',
        '—',
        'a template reference',
        'The root instance carries focus(), focusSearch(), openMore(), closeMore(), the three models, collapsed() and folded(); an item its value, priority, collapsed and current signals',
      ],
      [
        'provideTopNavigationDefaults()',
        '{ size, frame, landmark }',
        '—',
        'a component or route’s providers',
        'The decisions an application takes once, through the TOP_NAVIGATION_DEFAULTS token. A bar that states any of them itself still wins',
      ],
      [
        'injectTopNavigationDefaults()',
        '() => TopNavigationDefaults',
        '—',
        'inside an injection context',
        'What a bar renders as here, before it states anything of its own',
      ],
      [
        '@container slotted-top-navigation',
        'a container query in the consumer’s stylesheet',
        '—',
        'anything placed in context, search or actions',
        'The bar is a named query container, so a consumer’s own control answers the bar’s width — (inline-size < 600px) — without measuring anything',
      ],
    ]),
    accessibility: [
      'The bar is the banner landmark — a header in the context of the body, with no role written — and its destinations are the navigation landmark, a nav named Navigation unless the consumer names it. Inside app-shell the consumer writes a div, because the shell’s banner is already the banner and two banners in one document is what the resolution prevents.',
      'The destinations follow the WAI-ARIA APG’s Disclosure Navigation Menu example (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/): nav > ul > li > a, so a reader hears a list of so many links, one of them aria-current="page". The Navigation Menubar example’s own caution — that menubar demands functionality a site’s navigation does not need — is why nothing here is a menubar, nothing writes tabindex and no arrow key moves focus: every control is a tab stop.',
      'more is a button with aria-expanded and aria-controls pointing at the panel, and its name carries the count of what folded — More, 3, the moreCount message. The panel is built right after the nav, so Tab from more enters it, the way the disclosure pattern assumes; closed, it is visibility: hidden and its rows leave the tab sequence. Escape closes it and returns focus to more.',
      'The folded destinations are the consumer’s own elements, moved into the panel and back, so a section keeps its panel and a link keeps its badge, its href and the router’s aria-current. Below 480 pixels the name is clipped rather than removed, so the home link keeps its name; help’s label is clipped in the bar and shown in the panel, so help has one name in both places.',
      'Every icon-only control — the magnifier, the cross, help, the bell, the account, more — carries an accessible name from the family’s messages or the consumer’s aria-label, read with HostAttributeToken before the family writes its own, and repeats it in a tooltip on hover and on visible focus. The count stands inside the bell’s button, so a reader hears Notifications, 3 without the family composing a string.',
      'Below 600 pixels the open search moves focus into the field and the closed search returns it to the magnifier, unless focus already went somewhere else — which is what closed it. A disabled destination is aria-disabled with its href kept: perceivable, focusable, refused on press. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
    ],
    snippets: [
      defineSnippet({
        id: 'top-navigation-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<header data-ui="top-navigation" data-part="root" data-size="md" data-frame>
  <a data-part="skip" href="#conteudo">Skip to content</a>
  <div data-part="brand">
    <a data-part="home" href="/">
      <span data-part="mark" aria-hidden="true">…</span>
      <span data-part="name">Aurora Logistics</span>
    </a>
  </div>
  <nav data-part="nav" aria-label="Navigation">
    <ul data-part="list">
      <li data-part="item" data-value="dashboard" data-priority="high" data-current>
        <a data-part="link" href="/dashboard" aria-current="page" data-current>Dashboard</a>
      </li>
      <li data-part="item" data-value="billing" data-priority="low" data-collapsed>…</li>
      <li data-part="item">
        <button
          data-part="more"
          aria-label="More, 1"
          aria-expanded="false"
          aria-controls="p"
          data-overflow="1"
        ></button>
      </li>
    </ul>
  </nav>
  <div data-part="panel" id="p"><ul data-part="panel-list"></ul></div>
  <div data-part="search">
    …<button data-part="search-close" aria-label="Close search"></button>
  </div>
  <div data-part="actions">
    <button data-part="search-toggle" aria-label="Search"></button>
    <a data-part="help" href="/ajuda">Help</a>
    <button data-part="notifications" aria-label="Notifications">
      <span data-part="count">3</span>
    </button>
    <button data-part="account" aria-label="Account">…</button>
  </div>
</header>`,
      }),
      defineSnippet({
        id: 'top-navigation-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='top-navigation'] {
  --slotted-top-navigation-surface: var(--slotted-surface-inverse);
  --slotted-top-navigation-color: var(--slotted-text-inverse);
  --slotted-top-navigation-search-size: 32rem;
  --slotted-top-navigation-panel-size: 24rem;
}`,
      }),
    ],
  },
} as const;
