import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import sideNavigationTokens from '@slotted/styles/side-navigation/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SIDE_NAVIGATION_TOKENS = sideNavigationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SideNavigation decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlSideNavigation, SlSideNavigationActions, SlSideNavigationCount, SlSideNavigationDescription, SlSideNavigationDivider, SlSideNavigationEnd, SlSideNavigationGroup, SlSideNavigationIcon, SlSideNavigationItem, SlSideNavigationLabel, SlSideNavigationLink, SlSideNavigationList, SlSideNavigationSection, SlSideNavigationSectionLabel, SlSideNavigationSkeleton, SlSideNavigationTrigger, provideSideNavigationDefaults } from '@slotted/angular/side-navigation';",
  selector:
    '[slSideNavigation], [slSideNavigationSection], [slSideNavigationSectionLabel], ul[slSideNavigationList], li[slSideNavigationItem], a[slSideNavigationLink], button[slSideNavigationLink], button[slSideNavigationTrigger], [slSideNavigationIcon], [slSideNavigationLabel], [slSideNavigationDescription], [slSideNavigationCount], [slSideNavigationEnd], [slSideNavigationActions], ul[slSideNavigationGroup], li[slSideNavigationDivider], li[slSideNavigationSkeleton]',
  exportAs:
    'slSideNavigation, slSideNavigationItem, slSideNavigationLink, slSideNavigationTrigger, slSideNavigationGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the nav carrying slSideNavigation, or a div inside app-shell',
    required: true,
    purpose:
      'The column, and the query container it answers: data-ui="side-navigation", the axes, data-compact once measured. A nav with an aria-label on its own; inside the shell’s nav region, which is already the landmark, a div.',
  },
  {
    part: 'section',
    element: 'div',
    required: false,
    purpose: 'A titled run of destinations. Several may stand under one root.',
  },
  {
    part: 'section-label',
    element: 'div',
    required: false,
    purpose:
      'The section’s title, on the marks’ own edge. It wraps rather than clips, and in the rail it becomes a rule.',
  },
  {
    part: 'list',
    element: 'ul',
    required: true,
    purpose:
      'The items of one level: the top level, or a section’s. A real list, so a reader hears how many.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'A row: a link, a trigger, or both, plus optional actions and a group. Carries data-value, data-current, data-expanded, data-open and data-disabled — the states the stylesheet reads.',
  },
  {
    part: 'link',
    element: 'a[slSideNavigationLink] with an href, or button[slSideNavigationLink]',
    required: false,
    purpose:
      'The destination, with aria-current="page" while current; or a command in the column as a button with the same row. aria-disabled and a refused press while disabled, the href kept.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'The disclosure button of the group: aria-expanded, aria-controls. Alone it is the whole row; beside a link it is a mark-only button named by the row’s label. In the rail, a trigger without a link opens the flyout.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The box the mark stands in, the width the shell publishes for a row mark. What is left of a row in the rail.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The row’s text: one line, cut at the end or in the middle by truncate and carried whole by the tooltip when it is cut. In the rail it leaves the eye and not the DOM.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'The second line, in the muted ink; the page’s own ink on the current row. Hidden in the rail.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose:
      'The suffix with a tone: a Badge, a Kbd. Hidden in the rail, where the mark carries a dot instead.',
  },
  {
    part: 'count',
    element: 'span',
    required: false,
    purpose:
      'A quantity beside a destination, drawn by the family as tabular figures in the muted ink. Never cut. Hidden in the rail, where the mark carries a dot.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The trigger’s chevron, the chevron-right Glyph element in a directional icon box: along the reading direction while closed, down while open, mirrored in a right-to-left document.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose: 'Controls beside the row, outside its a or button. Hidden in the rail.',
  },
  {
    part: 'group',
    element: 'ul',
    required: false,
    purpose:
      'An item’s children, named by the row’s label. Inline it is the second track of the item and opens with it; in the rail the same list is presented in the flyout.',
  },
  {
    part: 'divider',
    element: 'li role="separator"',
    required: false,
    purpose: 'A rule between items that keeps the list a list.',
  },
  {
    part: 'skeleton',
    element: 'li aria-hidden',
    required: false,
    purpose:
      'A row still arriving: an item’s geometry with Skeleton boxes for the mark and the label.',
  },
  {
    part: 'flyout',
    element: 'div, in the portal container',
    required: false,
    purpose:
      'The layer beside the rail that presents one group. Composed from portal, positioner, presence and dismissable-layer; it carries its own data-ui because it stands outside the root.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One column with every axis on it, driven by the controls below the canvas. Tab reaches every row; the arrows walk them.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-playground',
      language: 'angular',
      label: 'A column of destinations',
      source: `<nav slSideNavigation [(value)]="value">
  <ul slSideNavigationList>
    <li slSideNavigationItem value="dashboard">
      <a slSideNavigationLink routerLink="/dashboard">
        <span slSideNavigationIcon><lucide-icon name="chart-no-axes-column" /></span>
        <span slSideNavigationLabel>Dashboard</span>
      </a>
    </li>
    <li slSideNavigationItem value="loads">
      <a slSideNavigationLink routerLink="/loads">
        <span slSideNavigationIcon><lucide-icon name="package" /></span>
        <span slSideNavigationLabel>Loads</span>
        <span slSideNavigationCount>12</span>
      </a>
    </li>
  </ul>
</nav>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, drawn as its own name',
    note: 'The frame with no product in it: each part the contract declares, labelled, so the family’s box can be told from the product’s content.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-anatomy',
      language: 'angular',
      label: 'A section, a row with everything on it, and a group',
      source: `<nav slSideNavigation>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>section-label</div>
    <ul slSideNavigationList>
      <li slSideNavigationItem value="row">
        <a slSideNavigationLink href="/row">
          <span slSideNavigationIcon>…</span>
          <span slSideNavigationLabel>label</span>
          <span slSideNavigationDescription>description</span>
          <span slSideNavigationCount>12</span>
        </a>
        <div slSideNavigationActions>…</div>
      </li>
      <li slSideNavigationItem value="branch">
        <button slSideNavigationTrigger><span slSideNavigationLabel>trigger</span></button>
        <ul slSideNavigationGroup>
          …
        </ul>
      </li>
      <li slSideNavigationDivider></li>
      <li slSideNavigationSkeleton></li>
    </ul>
  </div>
</nav>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups that open and close',
    note: 'A trigger is the whole row and its group opens on a track that grows to its own height; the chevron turns from along the line to down. Under multiple=false the sibling closes.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-groups',
      language: 'angular',
      label: 'A group under a trigger',
      source: `<li slSideNavigationItem value="deliveries">
  <button slSideNavigationTrigger>
    <span slSideNavigationIcon><lucide-icon name="truck" /></span>
    <span slSideNavigationLabel>Deliveries</span>
    <span slSideNavigationCount>38</span>
  </button>
  <ul slSideNavigationGroup>
    <li slSideNavigationItem value="today">
      <a slSideNavigationLink routerLink="/deliveries/today"
        ><span slSideNavigationLabel>Today</span></a
      >
    </li>
  </ul>
</li>`,
    }),
  },
  {
    id: 'hybrid',
    title: 'A destination that is also a parent',
    note: 'The APG hybrid row: the link navigates and a mark-only trigger beside it opens the children, named by the row’s label. Five levels deep, the indent below the marked level is a constant step.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-hybrid',
      language: 'angular',
      label: 'A link and its trigger side by side',
      source: `<li slSideNavigationItem value="reports">
  <a slSideNavigationLink routerLink="/reports">
    <span slSideNavigationIcon><lucide-icon name="chart-no-axes-column" /></span>
    <span slSideNavigationLabel>Reports</span>
  </a>
  <button slSideNavigationTrigger></button>
  <ul slSideNavigationGroup>
    …
  </ul>
</li>`,
    }),
  },
  {
    id: 'sections',
    title: 'Sections, a divider and a command',
    note: 'Two titled sections under one root, a divider between rows that keeps the list a list, and a row that is a button — a command in the column, never current.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-sections',
      language: 'angular',
      label: 'Titled sections',
      source: `<nav slSideNavigation>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>Operations</div>
    <ul slSideNavigationList>
      …
    </ul>
  </div>
  <div slSideNavigationSection>
    <div slSideNavigationSectionLabel>Administration</div>
    <ul slSideNavigationList>
      <li slSideNavigationDivider></li>
      <li slSideNavigationItem value="new">
        <button slSideNavigationLink (click)="openDialog()">
          <span slSideNavigationIcon><lucide-icon name="plus" /></span>
          <span slSideNavigationLabel>New load</span>
        </button>
      </li>
    </ul>
  </div>
</nav>`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'value on the root names the destination and a press asks it to move; a link that states current itself wins. The parent of a hidden destination is marked until its group opens, and autoExpand opens it.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-current',
      language: 'angular',
      label: 'The destination owned by the application',
      source: `<nav slSideNavigation [value]="value()" (valueChangeRequest)="value.set($event.value)">…</nav>`,
    }),
  },
  {
    id: 'compact',
    title: 'The rail',
    note: 'Under mode="compact" — or under 96 pixels of its own width — every part but the mark leaves the eye; the label stays in the DOM, a tooltip repeats it, and a row with a count carries a dot.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-compact',
      language: 'angular',
      label: 'A rail of marks',
      source: `<nav slSideNavigation mode="compact" value="loads">…</nav>`,
    }),
  },
  {
    id: 'flyout',
    title: 'A group beside the rail',
    note: 'In the rail, pressing a trigger without a link presents its group in a layer beside it. ArrowDown walks into it, Escape returns to the trigger, and focus leaving it closes it.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-flyout',
      language: 'angular',
      label: 'The flyout, owned by the application',
      source: `<nav slSideNavigation mode="compact" [(flyout)]="flyout">…</nav>`,
    }),
  },
  {
    id: 'size',
    title: 'Three row heights',
    note: 'md reads the row geometry app-shell publishes, so a column in the shell stands on the shell’s own edges; sm and lg read the control scale, and all three move with density.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-size',
      language: 'angular',
      label: 'The compact step',
      source: `<nav slSideNavigation size="sm">…</nav>`,
    }),
  },
  {
    id: 'states',
    title: 'The states a row can be in',
    note: 'Current, expanded, open, disabled, and the hover, press and focus every row answers. A disabled destination keeps its href and its name, and refuses the press.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-states',
      language: 'angular',
      label: 'A disabled row',
      source: `<li slSideNavigationItem value="billing" disabled>
  <a slSideNavigationLink href="/billing">
    <span slSideNavigationIcon><lucide-icon name="credit-card" /></span>
    <span slSideNavigationLabel>Billing</span>
    <span slSideNavigationDescription>Available on the Team plan</span>
  </a>
</li>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long label cut at the end with its whole text in the tooltip; the same column cut in the middle, where setembro and outubro stay apart; a URL; a title in another script; and wrapping, on request.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-content',
      language: 'angular',
      label: 'Where the cut falls',
      source: `<nav slSideNavigation truncate="middle">…</nav>`,
    }),
  },
  {
    id: 'loading',
    title: 'A column still arriving',
    note: 'Skeleton rows in the geometry of the rows they stand for, so nothing moves when the destinations land; the root carries aria-busy.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-loading',
      language: 'angular',
      label: 'Three rows on their way',
      source: `<nav slSideNavigation aria-busy="true">
  <ul slSideNavigationList>
    <li slSideNavigationSkeleton labelSize="55%"></li>
    <li slSideNavigationSkeleton labelSize="70%"></li>
    <li slSideNavigationSkeleton labelSize="45%"></li>
  </ul>
</nav>`,
    }),
  },
  {
    id: 'shell',
    title: 'Inside the shell',
    note: 'The column in app-shell’s nav region: a div rather than a second landmark, rows on the shell’s published geometry, and the rail read from the region’s own width when the shell collapses.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-shell',
      language: 'angular',
      label: 'The nav region holding the column',
      source: `<div slAppShell>
  <header slAppShellBanner>…</header>
  <nav slAppShellNav>
    <div slAppShellNavBody>
      <div slSideNavigation value="orders">…</div>
    </div>
  </nav>
  <main slAppShellMain>…</main>
</div>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for an application',
    note: 'The provider carries the axes for every column under it — a product whose groups open one at a time, with no guides — and a column that states one itself still wins.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-defaults',
      language: 'ts',
      label: 'The provider',
      source: `@Component({
  providers: [
    provideSideNavigationDefaults({ guides: false, multiple: false, truncate: 'middle' }),
  ],
  template: '<nav slSideNavigation>…</nav>',
})
export class Settings {}`,
    }),
  },
  {
    id: 'composition',
    title: 'Composed with what sits beside it',
    note: 'A Badge in end for a count that carries a tone, an Avatar in icon for a person, a Kbd for a shortcut, and a router’s own link through render, which is where aria-current comes from.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-composition',
      language: 'angular',
      label: 'A router link as the row',
      source: `<a slSideNavigationLink routerLink="/loads" routerLinkActive ariaCurrentWhenActive="page">
  <span slSideNavigationIcon><lucide-icon name="package" /></span>
  <span slSideNavigationLabel>Loads</span>
  <span slSideNavigationEnd><span slBadge tone="danger" size="sm">3</span></span>
</a>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches every row. ArrowDown and ArrowUp walk the visible rows, Home and End jump, Escape closes the group holding focus and lands on its trigger. The reason each request carries is shown.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-keyboard',
      language: 'angular',
      label: 'Which device asked',
      source: `<nav
  slSideNavigation
  (expandedChangeRequest)="log($event.reason)"
  (valueChangeRequest)="log($event.reason)"
>
  …
</nav>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A navigation landmark holding a list; each branch a button with aria-expanded and aria-controls; each destination a link, one of them aria-current; a hybrid trigger named by its row.',
    snippet: defineSnippet({
      id: 'side-navigation-angular-accessibility',
      language: 'angular',
      label: 'The landmark’s name',
      source: `<nav slSideNavigation aria-label="Main navigation">…</nav>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload:
      'ChangeRequest<string | null>: value, previous, reason (pointer | keyboard | programmatic), source and cancel()',
    when: 'Before the current destination moves, on a press of an a with an href. Cancelling refuses; [(value)] then stays where it was.',
  },
  {
    name: 'expandedChangeRequest',
    payload:
      'ChangeRequest<readonly string[]>: the whole set of open values, with reason (pointer | keyboard | select | escape | programmatic)',
    when: 'Before a group opens or closes: a press on its trigger, Escape inside it, autoExpand reaching the current destination (select), or expand()/collapse() on the instance.',
  },
  {
    name: 'flyoutChangeRequest',
    payload:
      'ChangeRequest<string | null>: the group beside the rail or null, with reason (pointer | keyboard | select | escape | outsidePress | blur | resize | programmatic)',
    when: 'Before the flyout opens or closes: a trigger pressed in the rail, a link pressed inside it, Escape, a press outside, focus leaving it, or the rail widening.',
  },
  {
    name: '(click), (focus), (keydown) on every row',
    payload: 'the element’s own events',
    when: 'Whenever the a or button fires them, on the consumer’s own element. preventDefault() in (click) refuses the family’s part.',
  },
];

export const ANGULAR_SIDE_NAVIGATION_DOCS = {
  sideNavigation: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'model<string | null>',
        'null',
        'slSideNavigation',
        'The current destination’s value, two-way. A link that states current itself, or carries an aria-current a router wrote, still wins',
      ],
      [
        'expanded',
        'model<readonly string[]>',
        '[]',
        'slSideNavigation',
        'The set of open groups, two-way',
      ],
      [
        'flyout',
        'model<string | null>',
        'null',
        'slSideNavigation',
        'The one group presented beside the rail, two-way. It never writes into expanded',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slSideNavigation, provideSideNavigationDefaults',
        'The row height. md reads the geometry app-shell publishes, with the control scale as the fallback; sm and lg read their own steps',
      ],
      [
        'mode',
        "'auto' | 'expanded' | 'compact'",
        'auto',
        'slSideNavigation, provideSideNavigationDefaults',
        'auto is a rail below compactAt pixels of the root’s own width and a labelled column above; the other two force one',
      ],
      [
        'truncate',
        "'end' | 'middle' | 'none'",
        'end',
        'slSideNavigation, provideSideNavigationDefaults',
        'Where a label that does not fit is cut. end is the stylesheet’s ellipsis; middle keeps the start and the tail; none wraps. A cut label opens the tooltip with the whole text',
      ],
      [
        'multiple',
        'boolean',
        'true',
        'slSideNavigation, provideSideNavigationDefaults',
        'Whether more than one group may be open at once. Off, opening one closes the rest',
      ],
      [
        'autoExpand',
        'boolean',
        'true',
        'slSideNavigation, provideSideNavigationDefaults',
        'Whether the ancestors of the current destination open by themselves, with the reason select',
      ],
      [
        'guides',
        'boolean',
        'true',
        'slSideNavigation, provideSideNavigationDefaults',
        'Whether a guide runs down each open group, under the parent’s mark or on its text edge',
      ],
      [
        'landmark',
        'boolean',
        'true',
        'slSideNavigation, provideSideNavigationDefaults',
        'Whether the family writes the landmark’s name. Unstated, it does on its own and not inside app-shell, whose nav region is already the landmark. The element is the consumer’s: a nav standing alone, a div inside the shell',
      ],
      [
        'compactAt',
        'number',
        '96',
        'slSideNavigation, provideSideNavigationDefaults',
        'The width, in CSS pixels, under which mode="auto" is compact. The stylesheet’s own breakpoint is the same number',
      ],
      [
        'messages',
        'Partial<SideNavigationMessages>',
        '—',
        'slSideNavigation',
        'Words laid over the language in force: the landmark’s name when the consumer gives no aria-label (navigation)',
      ],
      [
        'value',
        'string',
        '—',
        'li[slSideNavigationItem]',
        'The item’s identity: what value, expanded and flyout name it by. Reaches the DOM as data-value',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'li[slSideNavigationItem]',
        'The row refuses the press and keeps its href, its name and its place in the tab order; the trigger takes the native attribute',
      ],
      [
        'current',
        'boolean',
        '—',
        'a[slSideNavigationLink]',
        'Stated on the row itself, it wins over the root’s value. Unstated, an aria-current the router wrote on the element (routerLinkActive with ariaCurrentWhenActive) is read instead',
      ],
      [
        'href',
        'string',
        '—',
        'a[slSideNavigationLink]',
        'The destination, the element’s own; routerLink writes it. On button[slSideNavigationLink] the row is a command in the column, never current',
      ],
      [
        'labelSize',
        'number | string',
        '60%',
        'li[slSideNavigationSkeleton]',
        'How wide the label’s bar is drawn',
      ],
    ]),
    composition: apiRows([
      [
        'the element',
        'nav, div, ul, li, a, button, span',
        '—',
        'every part',
        'Every directive goes on the consumer’s own element, so routerLink, routerLinkActive, native attributes and (click) live where they always do. A part with a template — link, trigger, skeleton — projects the consumer’s content',
      ],
      [
        'exportAs',
        'slSideNavigation, slSideNavigationItem, slSideNavigationLink, slSideNavigationTrigger, slSideNavigationGroup',
        '—',
        'a template reference',
        'The root instance carries focus(), expand(value), collapse(value) and the three models; an item its value, expanded and current signals',
      ],
      [
        'provideSideNavigationDefaults()',
        '{ size, mode, truncate, multiple, autoExpand, guides, landmark, compactAt }',
        '—',
        'a component or route’s providers',
        'The decisions an application takes once, through the SIDE_NAVIGATION_DEFAULTS token. A column that states any of them itself still wins',
      ],
      [
        'injectSideNavigationDefaults()',
        '() => SideNavigationDefaults',
        '—',
        'inside an injection context',
        'What a column renders as here, before it states anything of its own',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure Navigation Menu with Top-Level Links (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/), and no role is written: the DOM is nav > ul > li > (a | button) + ul, so a reader hears a navigation landmark, a list of so many items, a link or a button, and a nested list. The tree role is refused on the APG’s own advice — it demands functionality a site’s navigation does not need.',
      'Every link and trigger is in the page tab sequence and nothing here writes tabindex. The arrow keys, Home and End — optional in the pattern and adopted — walk the visible rows, into the flyout when it is open; Escape closes the group holding focus and lands on its trigger, as the pattern lists. A closed group is visibility: hidden, so its rows leave the tab sequence and the accessibility tree together.',
      'A trigger carries aria-expanded and aria-controls, and its group aria-labelledby pointing at the row’s label; a trigger beside a link is named by that same label through aria-labelledby, so the hybrid row is heard as “Reports, link” then “Reports, button, collapsed”. Identifiers come from an application-scoped factory, so a server response and the first client render agree.',
      'The current destination is aria-current="page" on the link and nowhere else. The parent of a destination the reader cannot see carries data-current for the stylesheet and no ARIA, because the destination is the thing that is current.',
      'In the rail the label is clipped to a pixel rather than removed, so the link keeps its accessible name; a tooltip repeats it on hover, on visible focus and on press-and-hold. Under truncate a row whose label the binding measured as cut opens the same tooltip, and a middle cut writes the whole text as aria-label so the name is the name and not the cut.',
      'A disabled destination is aria-disabled with its href kept: perceivable, focusable, and refused on press, so a reader can reach the row and hear why it is unavailable. A disabled trigger takes the native attribute. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
    ],
    snippets: [
      defineSnippet({
        id: 'side-navigation-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<nav
  data-ui="side-navigation"
  data-part="root"
  data-mode="auto"
  data-size="md"
  data-truncate="end"
  data-guides
  aria-label="Navigation"
>
  <div data-part="section">
    <div data-part="section-label">Operations</div>
    <ul data-part="list">
      <li data-part="item" data-value="loads" data-current>
        <a data-part="link" href="/loads" aria-current="page" data-current>
          <span data-part="icon" aria-hidden="true"> … </span>
          <span data-part="label" id="l-a"> Loads </span>
          <span data-part="count">12</span>
        </a>
      </li>
      <li data-part="item" data-value="deliveries" data-expanded>
        <button data-part="trigger" id="t-b" aria-expanded="true" aria-controls="g-b">
          <span data-part="label" id="l-b"> Deliveries </span>
          <span data-part="indicator" aria-hidden="true">
            <span data-ui="icon" data-part="root" data-directional aria-hidden="true">
              <svg data-part="glyph" data-glyph="chevron-right"></svg>
            </span>
          </span>
        </button>
        <ul data-part="group" id="g-b" aria-labelledby="l-b">
          …
        </ul>
      </li>
    </ul>
  </div>
</nav>`,
      }),
      defineSnippet({
        id: 'side-navigation-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='side-navigation'] {
  --slotted-side-navigation-current-background: var(--slotted-tone-secondary-surface);
  --slotted-side-navigation-current-color: var(--slotted-text);
  --slotted-side-navigation-radius: var(--slotted-radius-lg);
  --slotted-side-navigation-indent-step: var(--slotted-space-8);
}`,
      }),
    ],
  },
} as const;
