import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import navigationMenuTokens from '@slotted/styles/navigation-menu/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_NAVIGATION_MENU_TOKENS = navigationMenuTokens.map((name) => ({
  name,
  purpose: 'Theme-owned NavigationMenu decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlNavigationMenu, SlNavigationMenuContent, SlNavigationMenuDescription, SlNavigationMenuFooter, SlNavigationMenuGroup, SlNavigationMenuGroupLabel, SlNavigationMenuIcon, SlNavigationMenuItem, SlNavigationMenuLabel, SlNavigationMenuLink, SlNavigationMenuLinks, SlNavigationMenuList, SlNavigationMenuTrigger, provideNavigationMenuDefaults } from '@slotted/angular/navigation-menu';",
  selector:
    '[slNavigationMenu], ul[slNavigationMenuList], li[slNavigationMenuItem], button[slNavigationMenuTrigger], [slNavigationMenuContent], a[slNavigationMenuLink], ul[slNavigationMenuLinks], [slNavigationMenuGroup], [slNavigationMenuGroupLabel], [slNavigationMenuIcon], [slNavigationMenuLabel], [slNavigationMenuDescription], [slNavigationMenuFooter]',
  exportAs:
    'slNavigationMenu, slNavigationMenuItem, slNavigationMenuTrigger, slNavigationMenuContent, slNavigationMenuLink',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the nav carrying slNavigationMenu, or a div inside a panel',
    required: true,
    purpose:
      'The navigation landmark, named by messages.navigation unless the consumer wrote an aria-label. position: relative — the surface and every panel are placed against it — and the measured geometry is written on it.',
  },
  {
    part: 'list',
    element: 'ul',
    required: true,
    purpose: 'The sections and the top-level links, in a row or a column.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One section — a trigger followed by its panel — or one top-level link. data-value names it; data-open while its panel is shown; data-disabled when it refuses interaction.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'The section’s button: aria-expanded, aria-controls pointing at its panel, data-open, and data-current while its panel holds the current page. Always a native button, because the family wires it.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The chevron-down Glyph element at the trigger’s end, a half turn while open; chevron-right in a directional box in a column.',
  },
  {
    part: 'link',
    element: 'the a carrying slNavigationMenuLink',
    required: false,
    purpose:
      'A destination, at the top level beside the triggers or inside a panel. aria-current="page" and data-current while current; aria-disabled with the press refused while disabled, the href kept.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'One section’s panel, after its trigger in the same item: hidden while closed, data-open while shown, data-motion while it crosses another. A query container sized by its columns.',
  },
  {
    part: 'links',
    element: 'ul',
    required: false,
    purpose:
      'The grid of links in a panel or a group. Its columns come from the panel’s columns and fall to one below 480 pixels of panel.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose: 'A column of a panel with a title: role="group", named by its group-label.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The group’s title, in the small type and the muted ink.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose: 'A rich link’s mark, standing on the title’s first line and aligned to its letters.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose: 'A rich link’s title. It wraps rather than clips.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A rich link’s description: two lines to the eye, the whole text in the DOM.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The panel’s last row, under a rule that runs the panel’s width: the consumer’s call to action, its words starting in the links’ column.',
  },
  {
    part: 'viewport',
    element: 'div',
    required: true,
    purpose:
      'The one surface — ground, edge, shadow, radius — rendered after the list, sized and placed from the open panel and moving between sections. Not rendered by a nested root.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: false,
    purpose:
      'The mark on the surface’s edge that points at the open trigger, sliding with the surface. Rendered when arrow is true.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis from the controls. Rest the pointer on a section, press it, walk the row with the arrow keys, and widen or narrow the window: the surface follows the open trigger and moves to fit.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-playground',
      language: 'angular',
      label: 'A row of sections',
      source: `<nav slNavigationMenu aria-label="Main">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="products">
      <button slNavigationMenuTrigger>Products</button>
      <div slNavigationMenuContent>…</div>
    </li>
    <li slNavigationMenuItem value="docs">
      <a slNavigationMenuLink routerLink="/docs">Documentation</a>
    </li>
  </ul>
</nav>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Anatomy',
    note: 'Every part, each labelled by its own name: a trigger and its panel in one item, a top-level link beside it, a group with its label, a rich link with icon, label and description, the footer, and the surface with its arrow.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-anatomy',
      language: 'angular',
      label: 'The parts',
      source: `<nav slNavigationMenu arrow [value]="'section'">
  <ul slNavigationMenuList>
    <li slNavigationMenuItem value="section">
      <button slNavigationMenuTrigger>trigger</button>
      <div slNavigationMenuContent columns="2">
        <div slNavigationMenuGroup>
          <div slNavigationMenuGroupLabel>group-label</div>
          <ul slNavigationMenuLinks>
            <li>
              <a slNavigationMenuLink href="/a"
                ><span slNavigationMenuIcon>…</span><span slNavigationMenuLabel>label</span
                ><span slNavigationMenuDescription>description</span></a
              >
            </li>
          </ul>
        </div>
        <div slNavigationMenuFooter>footer</div>
      </div>
    </li>
    <li slNavigationMenuItem value="link"><a slNavigationMenuLink href="/link">link</a></li>
  </ul>
</nav>`,
    }),
  },
  {
    id: 'links',
    title: 'A panel of plain links',
    note: 'The shortest panel: one column of words at the control’s height. Its first letter starts in the column the trigger’s label starts in, because the surface opens at the trigger and the insets add up to the control’s.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-links',
      language: 'angular',
      label: 'One column of links',
      source: `<li slNavigationMenuItem value="company">
  <button slNavigationMenuTrigger>Company</button>
  <div slNavigationMenuContent>
    <ul slNavigationMenuLinks>
      <li><a slNavigationMenuLink routerLink="/about">About us</a></li>
      <li><a slNavigationMenuLink routerLink="/careers">Careers</a></li>
    </ul>
  </div>
</li>`,
    }),
  },
  {
    id: 'rich',
    title: 'Rich links in two columns',
    note: 'A mark, a title and two lines of description per destination, in columns="2". The mark sits on the title’s letters, not in the middle of its line; a description longer than two lines is cut to the eye and read whole.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-rich',
      language: 'angular',
      label: 'A rich link',
      source: `<div slNavigationMenuContent columns="2">
  <ul slNavigationMenuLinks>
    <li>
      <a slNavigationMenuLink routerLink="/warehouse">
        <span slNavigationMenuIcon><ng-icon name="lucideWarehouse" /></span>
        <span slNavigationMenuLabel>Warehouse</span>
        <span slNavigationMenuDescription>Receipts, issues and stock by location.</span>
      </a>
    </li>
  </ul>
</div>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups as columns',
    note: 'Three titled groups in columns="3", each named by its label for a screen reader. Below 480 pixels of panel the groups stack two and one, and the lists inside fall to one column.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-groups',
      language: 'angular',
      label: 'A titled group',
      source: `<div slNavigationMenuContent columns="3">
  <div slNavigationMenuGroup>
    <div slNavigationMenuGroupLabel>By industry</div>
    <ul slNavigationMenuLinks>
      <li><a slNavigationMenuLink routerLink="/retail">Retail</a></li>
    </ul>
  </div>
</div>`,
    }),
  },
  {
    id: 'footer',
    title: 'A footer with a call to action',
    note: 'The panel’s last row under a rule that runs its full width; the words start in the links’ column and the action ends on their edge. The action is the consumer’s own Button.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-footer',
      language: 'angular',
      label: 'A footer',
      source: `<div slNavigationMenuFooter>
  <span slText size="xs" tone="muted">New: demand forecast per warehouse.</span>
  <a slButtonLink size="sm" routerLink="/products">See all</a>
</div>`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'current on a link — or the aria-current a router writes — is the page the reader is on, drawn on the accent ground. The section holding it takes the accent ink on its trigger, so it reads with every panel closed.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-current',
      language: 'angular',
      label: 'The current page',
      source: `<a slNavigationMenuLink routerLink="/fleet" routerLinkActive ariaCurrentWhenActive="page">Fleet</a>`,
    }),
  },
  {
    id: 'vertical',
    title: 'A column of sections',
    note: 'orientation="vertical": the panel opens at the column’s end, level with the trigger, and slides in along the line. In a column with no room at its end — a phone — it drops under the trigger and the chevron turns to point at it.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-vertical',
      language: 'angular',
      label: 'A column',
      source: `<nav slNavigationMenu orientation="vertical" arrow>…</nav>`,
    }),
  },
  {
    id: 'nested',
    title: 'A second level in the same panel',
    note: 'A slNavigationMenu inside a panel is a second level: a div, vertical, with no surface of its own. Its open section stands beside its list behind a rule that runs the full height, and following a link there closes every level.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-nested',
      language: 'angular',
      label: 'A second level',
      source: `<div slNavigationMenuContent columns="3">
  <div slNavigationMenu [value]="'tools'">
    <ul slNavigationMenuList>
      <li slNavigationMenuItem value="tools">
        <button slNavigationMenuTrigger>Tools</button>
        <div slNavigationMenuContent columns="2">…</div>
      </li>
    </ul>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Rest, an open section holding the pointer’s ground, a current section in the accent ink, a current link on the accent ground, a disabled section and a disabled link — readable, refused, and still in the tab order.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-states',
      language: 'angular',
      label: 'Disabled section and link',
      source: `<li slNavigationMenuItem value="partners" disabled>
  <button slNavigationMenuTrigger>Partners</button>
  <div slNavigationMenuContent></div>
</li>
<li slNavigationMenuItem value="blog">
  <a slNavigationMenuLink disabled href="/blog">Blog</a>
</li>`,
    }),
  },
  {
    id: 'size',
    title: 'Sizes',
    note: 'sm, md and lg read the control scale — 30, 34 and 38 pixels at comfortable — so the row stands at the height of the field and the button beside it in any density.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-size',
      language: 'angular',
      label: 'A small row',
      source: `<nav slNavigationMenu size="sm">…</nav>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A section named in eight words, a title that wraps to two lines, a description cut after two, a link with no mark and a reference with no spaces: the panel holds its columns and the surface holds the panel.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-content',
      language: 'angular',
      label: 'A long title',
      source: `<span slNavigationMenuLabel>Replenishment planning between regional warehouses</span>`,
    }),
  },
  {
    id: 'controlled',
    title: 'The open section, owned by the application',
    note: '[(value)] and valueChangeRequest: every request carries its reason — pointer, keyboard, escape, outsidePress, blur, select or programmatic — and the application decides. The log under the row prints each one.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-controlled',
      language: 'angular',
      label: 'Two-way, with the reason',
      source: `<nav slNavigationMenu [(value)]="section" (valueChangeRequest)="log($event.reason)">…</nav>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'provideNavigationMenuDefaults() sets the hover delays, closeOnSelect, the size and the arrow for every menu under it; an instance that states any of them still wins. Here the menu opens fifty milliseconds after the pointer rests.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-defaults',
      language: 'angular',
      label: 'Defaults for a subtree',
      source: `<!-- providers: [provideNavigationMenuDefaults({ arrow: true, openDelay: 50, size: 'sm' })] -->
<nav slNavigationMenu>…</nav>`,
    }),
  },
  {
    id: 'composition',
    title: 'In a site header, with a router',
    note: 'The family in the context region of a slTopNavigation, beside the mark and the account; each link carries a routerLink with routerLinkActive, which writes aria-current, and the family reads it.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-composition',
      language: 'angular',
      label: 'A router link',
      source: `<a slNavigationMenuLink routerLink="/fleet" routerLinkActive ariaCurrentWhenActive="page">Fleet</a>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches every top-level control and the links of an open panel after its trigger. Enter and Space toggle a section; ArrowLeft and ArrowRight walk the row; ArrowDown enters an open panel and ArrowUp from its first link returns to the trigger; Home and End reach the ends; Escape closes and lands on the trigger.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-keyboard',
      language: 'angular',
      label: 'Focus a section from the instance',
      source: `<nav slNavigationMenu #menu="slNavigationMenu">…</nav>
<button type="button" (click)="menu.focus('products')">Focus Products</button>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A navigation landmark named Main, a list of four items, “Products, button, collapsed”, and on Enter the panel’s links after it in the reading order. No menu role is written anywhere.',
    snippet: defineSnippet({
      id: 'navigation-menu-angular-accessibility',
      language: 'angular',
      label: 'The landmark’s name',
      source: `<nav slNavigationMenu aria-label="Main">…</nav>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload:
      'ChangeRequest<string | null>: value, previous, reason (pointer | keyboard | escape | outsidePress | blur | select | programmatic), source and cancel()',
    when: 'Before the open section moves: a press or a resting pointer on a trigger, a pointer leaving the root, Escape, a press outside, focus leaving the root, a panel link followed, or open()/close() on the instance. Cancelling keeps the section, and [(value)] stays where it was.',
  },
  {
    name: '(click), (pointerenter) on a trigger; (click) on a link',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them, on the consumer’s own element. preventDefault() in (click) refuses the family’s part.',
  },
];

export const ANGULAR_NAVIGATION_MENU_DOCS = {
  navigationMenu: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'model<string | null>',
        'null',
        'slNavigationMenu',
        'The open section’s value, two-way; null is none',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slNavigationMenu, provideNavigationMenuDefaults',
        'The control step of a trigger and of a top-level link',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slNavigationMenu',
        'A row under which panels open, or a column beside which they open. A nested menu is vertical unless it says otherwise',
      ],
      [
        'openDelay',
        'number',
        '200',
        'slNavigationMenu, provideNavigationMenuDefaults',
        'Milliseconds a pointer rests on a trigger before its section opens. With a section open, another one opens at once',
      ],
      [
        'closeDelay',
        'number',
        '300',
        'slNavigationMenu, provideNavigationMenuDefaults',
        'Milliseconds a pointer leaving the root waits before the section closes; a return cancels it',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'slNavigationMenu, provideNavigationMenuDefaults, slNavigationMenuLink',
        'Following a link inside a panel closes every level. A link’s own value wins',
      ],
      [
        'arrow',
        'boolean',
        'false',
        'slNavigationMenu, provideNavigationMenuDefaults',
        'Draws the mark on the surface’s edge that points at the open trigger',
      ],
      [
        'messages',
        'Partial<NavigationMenuMessages>',
        '—',
        'slNavigationMenu',
        'Words laid over the language in force: the landmark’s name when the consumer gives no aria-label (navigation)',
      ],
      [
        'value',
        'string',
        '—',
        'slNavigationMenuItem',
        'The item’s identity: what the root’s value names it by. Reaches the DOM as data-value',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slNavigationMenuItem, slNavigationMenuLink',
        'The section never opens and its trigger takes the native attribute; a link keeps its href and refuses the press',
      ],
      [
        'columns',
        '1 | 2 | 3',
        '1',
        'slNavigationMenuContent',
        'How many columns of links or groups the panel lays out; the panel’s width follows',
      ],
      [
        'current',
        'boolean',
        '—',
        'slNavigationMenuLink',
        'This link is the page the reader is on. Unstated, an aria-current="page" that routerLinkActive wrote is read',
      ],
    ]),
    composition: apiRows([
      [
        'the element',
        'nav, div, ul, li, button, a, span',
        '—',
        'every part',
        'Every directive goes on the consumer’s own element, so routerLink, routerLinkActive, native attributes and (click) live where they always do. The trigger projects the consumer’s words and adds the chevron',
      ],
      [
        'exportAs',
        'slNavigationMenu, slNavigationMenuItem, slNavigationMenuTrigger, slNavigationMenuContent, slNavigationMenuLink',
        '—',
        'a template reference',
        'The root instance carries open(value), close(), focus(value?) and the value model; an item its value and open signal',
      ],
      [
        'provideNavigationMenuDefaults()',
        '{ size, openDelay, closeDelay, closeOnSelect, arrow }',
        '—',
        'a component or route’s providers',
        'The decisions an application takes once, through the NAVIGATION_MENU_DEFAULTS token. A menu that states any of them itself still wins',
      ],
      [
        'injectNavigationMenuDefaults()',
        '() => NavigationMenuDefaults',
        '—',
        'inside an injection context',
        'What a menu renders as here, before it states anything of its own',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure Navigation Menu (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), and no menu, menubar or menuitem role is written: the example’s own note refuses them for a site’s navigation. The DOM is nav > ul > li > (button + div) and (a), so a reader hears a navigation landmark, a list of so many items, a button that is collapsed or expanded, and links.',
      'Each panel follows its trigger in the DOM and is hidden while closed, so Tab reaches its links straight after the trigger — the order the pattern assumes — with no sentinel elements and no tabindex written anywhere. The arrow keys, Home and End are the pattern’s optional shortcut over that order, not a replacement for it.',
      'Escape closes the open section and returns focus to its trigger; focus leaving the root, a press outside it and a followed link close it too, each with its own reason so an application can tell them apart.',
      'The current page is aria-current="page" on its link and nowhere else; routerLinkActive with ariaCurrentWhenActive writes it and the family reads it. The trigger of the section holding it carries data-current for the stylesheet and no ARIA.',
      'A disabled link is aria-disabled with its href kept: perceivable, focusable, and refused on press. A disabled section’s trigger takes the native attribute. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
      'Hover never decides anything a press cannot: a touch never opens by hover, and every section opens by its button. Identifiers come from an application-scoped factory, so a server response and the first client render agree.',
    ],
    snippets: [
      defineSnippet({
        id: 'navigation-menu-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<nav
  slNavigationMenu
  aria-label="Main"
  data-ui="navigation-menu"
  data-part="root"
  data-orientation="horizontal"
  data-size="md"
>
  <ul data-part="list">
    <li data-part="item" data-value="products" data-open>
      <button data-part="trigger" aria-expanded="true" aria-controls="p" data-open>
        Products<span data-part="indicator" aria-hidden="true"
          ><span data-ui="icon" data-part="root" aria-hidden="true"
            ><svg data-part="glyph" data-glyph="chevron-down"></svg></span
        ></span>
      </button>
      <div data-part="content" id="p" data-columns="2" data-open>
        <ul data-part="links">
          <li><a data-part="link" href="/fleet" aria-current="page" data-current>Fleet</a></li>
        </ul>
      </div>
    </li>
  </ul>
  <div data-part="viewport" data-open data-positioned>
    <span data-part="arrow" aria-hidden="true"></span>
  </div>
</nav>`,
      }),
      defineSnippet({
        id: 'navigation-menu-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='navigation-menu'] {
  --slotted-navigation-menu-column-size: 17rem;
  --slotted-navigation-menu-viewport-radius: var(--slotted-radius-md);
  --slotted-navigation-menu-offset: var(--slotted-space-4);
  --slotted-navigation-menu-shadow: var(--slotted-shadow-lg);
}`,
      }),
    ],
  },
} as const;
