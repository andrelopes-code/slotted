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

export const REACT_NAVIGATION_MENU_TOKENS = navigationMenuTokens.map((name) => ({
  name,
  purpose: 'Theme-owned NavigationMenu decision',
}));

const imports: ReferenceImport = {
  source:
    "import { NavigationMenu, NavigationMenuContent, NavigationMenuDefaultsProvider, NavigationMenuDescription, NavigationMenuFooter, NavigationMenuGroup, NavigationMenuGroupLabel, NavigationMenuIcon, NavigationMenuItem, NavigationMenuLabel, NavigationMenuLink, NavigationMenuLinks, NavigationMenuList, NavigationMenuTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav, a div when nested, or the element render returns',
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
    element: 'a, or the element render returns',
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
      id: 'navigation-menu-react-playground',
      language: 'tsx',
      label: 'A row of sections',
      source: `<NavigationMenu aria-label="Main">
  <NavigationMenuList>
    <NavigationMenuItem value="products">
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>…</NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem value="docs">
      <NavigationMenuLink href="/docs">Documentation</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Anatomy',
    note: 'Every part, each labelled by its own name: a trigger and its panel in one item, a top-level link beside it, a group with its label, a rich link with icon, label and description, the footer, and the surface with its arrow.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-anatomy',
      language: 'tsx',
      label: 'The parts',
      source: `<NavigationMenu arrow defaultValue="section">
  <NavigationMenuList>
    <NavigationMenuItem value="section">
      <NavigationMenuTrigger>trigger</NavigationMenuTrigger>
      <NavigationMenuContent columns={2}>
        <NavigationMenuGroup>
          <NavigationMenuGroupLabel>group-label</NavigationMenuGroupLabel>
          <NavigationMenuLinks>
            <li>
              <NavigationMenuLink href="/a">
                <NavigationMenuIcon>…</NavigationMenuIcon>
                <NavigationMenuLabel>label</NavigationMenuLabel>
                <NavigationMenuDescription>description</NavigationMenuDescription>
              </NavigationMenuLink>
            </li>
          </NavigationMenuLinks>
        </NavigationMenuGroup>
        <NavigationMenuFooter>footer</NavigationMenuFooter>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem value="link">
      <NavigationMenuLink href="/link">link</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>;`,
    }),
  },
  {
    id: 'links',
    title: 'A panel of plain links',
    note: 'The shortest panel: one column of words at the control’s height. Its first letter starts in the column the trigger’s label starts in, because the surface opens at the trigger and the insets add up to the control’s.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-links',
      language: 'tsx',
      label: 'One column of links',
      source: `<NavigationMenuItem value="company">
  <NavigationMenuTrigger>Company</NavigationMenuTrigger>
  <NavigationMenuContent>
    <NavigationMenuLinks>
      <li>
        <NavigationMenuLink href="/about">About us</NavigationMenuLink>
      </li>
      <li>
        <NavigationMenuLink href="/careers">Careers</NavigationMenuLink>
      </li>
    </NavigationMenuLinks>
  </NavigationMenuContent>
</NavigationMenuItem>;`,
    }),
  },
  {
    id: 'rich',
    title: 'Rich links in two columns',
    note: 'A mark, a title and two lines of description per destination, in columns={2}. The mark sits on the title’s letters, not in the middle of its line; a description longer than two lines is cut to the eye and read whole.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-rich',
      language: 'tsx',
      label: 'A rich link',
      source: `<NavigationMenuContent columns={2}>
  <NavigationMenuLinks>
    <li>
      <NavigationMenuLink href="/warehouse">
        <NavigationMenuIcon>
          <Warehouse />
        </NavigationMenuIcon>
        <NavigationMenuLabel>Warehouse</NavigationMenuLabel>
        <NavigationMenuDescription>
          Receipts, issues and stock by location.
        </NavigationMenuDescription>
      </NavigationMenuLink>
    </li>
  </NavigationMenuLinks>
</NavigationMenuContent>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups as columns',
    note: 'Three titled groups in columns={3}, each named by its label for a screen reader. Below 480 pixels of panel the groups stack two and one, and the lists inside fall to one column.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-groups',
      language: 'tsx',
      label: 'A titled group',
      source: `<NavigationMenuContent columns={3}>
  <NavigationMenuGroup>
    <NavigationMenuGroupLabel>By industry</NavigationMenuGroupLabel>
    <NavigationMenuLinks>
      <li>
        <NavigationMenuLink href="/retail">Retail</NavigationMenuLink>
      </li>
    </NavigationMenuLinks>
  </NavigationMenuGroup>
</NavigationMenuContent>;`,
    }),
  },
  {
    id: 'footer',
    title: 'A footer with a call to action',
    note: 'The panel’s last row under a rule that runs its full width; the words start in the links’ column and the action ends on their edge. The action is the consumer’s own Button.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-footer',
      language: 'tsx',
      label: 'A footer',
      source: `<NavigationMenuFooter>
  <Text size="xs" tone="muted">
    New: demand forecast per warehouse.
  </Text>
  <ButtonLink href="/products" size="sm">
    See all
  </ButtonLink>
</NavigationMenuFooter>;`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'current on a link — or the aria-current a router writes — is the page the reader is on, drawn on the accent ground. The section holding it takes the accent ink on its trigger, so it reads with every panel closed.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-current',
      language: 'tsx',
      label: 'The current page',
      source: `<NavigationMenuLink current href="/fleet">
  Fleet
</NavigationMenuLink>;`,
    }),
  },
  {
    id: 'vertical',
    title: 'A column of sections',
    note: 'orientation="vertical": the panel opens at the column’s end, level with the trigger, and slides in along the line. In a column with no room at its end — a phone — it drops under the trigger and the chevron turns to point at it.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-vertical',
      language: 'tsx',
      label: 'A column',
      source: `<NavigationMenu orientation="vertical" arrow>
  …
</NavigationMenu>;`,
    }),
  },
  {
    id: 'nested',
    title: 'A second level in the same panel',
    note: 'A NavigationMenu inside a panel is a second level: a div, vertical, with no surface of its own. Its open section stands beside its list behind a rule that runs the full height, and following a link there closes every level.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-nested',
      language: 'tsx',
      label: 'A second level',
      source: `<NavigationMenuContent columns={3}>
  <NavigationMenu defaultValue="tools">
    <NavigationMenuList>
      <NavigationMenuItem value="tools">
        <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
        <NavigationMenuContent columns={2}>…</NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</NavigationMenuContent>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Rest, an open section holding the pointer’s ground, a current section in the accent ink, a current link on the accent ground, a disabled section and a disabled link — readable, refused, and still in the tab order.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-states',
      language: 'tsx',
      label: 'Disabled section and link',
      source: `<>
  <NavigationMenuItem disabled value="partners">
    <NavigationMenuTrigger>Partners</NavigationMenuTrigger>
    <NavigationMenuContent />
  </NavigationMenuItem>
  <NavigationMenuItem value="blog">
    <NavigationMenuLink disabled href="/blog">
      Blog
    </NavigationMenuLink>
  </NavigationMenuItem>
</>;`,
    }),
  },
  {
    id: 'size',
    title: 'Sizes',
    note: 'sm, md and lg read the control scale — 30, 34 and 38 pixels at comfortable — so the row stands at the height of the field and the button beside it in any density.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-size',
      language: 'tsx',
      label: 'A small row',
      source: `<NavigationMenu size="sm">…</NavigationMenu>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A section named in eight words, a title that wraps to two lines, a description cut after two, a link with no mark and a reference with no spaces: the panel holds its columns and the surface holds the panel.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-content',
      language: 'tsx',
      label: 'A long title',
      source: `<NavigationMenuLabel>Replenishment planning between regional warehouses</NavigationMenuLabel>;`,
    }),
  },
  {
    id: 'controlled',
    title: 'The open section, owned by the application',
    note: 'value and onValueChange: every request carries its reason — pointer, keyboard, escape, outsidePress, blur, select or programmatic — and the application decides. The log under the row prints each one.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-controlled',
      language: 'tsx',
      label: 'Controlled',
      source: `const [value, setValue] = useState<string | null>(null);

<NavigationMenu
  value={value}
  onValueChange={(next, request) => {
    log(request.reason);
    setValue(next);
  }}
>
  …
</NavigationMenu>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'NavigationMenuDefaultsProvider sets the hover delays, closeOnSelect, the size and the arrow for every menu under it; an instance that states any of them still wins. Here the menu opens fifty milliseconds after the pointer rests.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-defaults',
      language: 'tsx',
      label: 'Defaults for a subtree',
      source: `<NavigationMenuDefaultsProvider arrow openDelay={50} size="sm">
  <App />
</NavigationMenuDefaultsProvider>;`,
    }),
  },
  {
    id: 'composition',
    title: 'In a site header, with a router',
    note: 'The family in the context region of a TopNavigation, beside the mark and the account; each link is rendered through render as the router’s own link, which writes aria-current, and the family reads it.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-composition',
      language: 'tsx',
      label: 'A router link',
      source: `<NavigationMenuLink href="/fleet" render={(props) => <RouterLink {...props} to="/fleet" />}>
  Fleet
</NavigationMenuLink>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches every top-level control and the links of an open panel after its trigger. Enter and Space toggle a section; ArrowLeft and ArrowRight walk the row; ArrowDown enters an open panel and ArrowUp from its first link returns to the trigger; Home and End reach the ends; Escape closes and lands on the trigger.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-keyboard',
      language: 'tsx',
      label: 'Focus a section from the handle',
      source: `const menu = useRef<NavigationMenuHandle>(null);

menu.current?.focus('products');
menu.current?.open('products');`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A navigation landmark named Main, a list of four items, “Products, button, collapsed”, and on Enter the panel’s links after it in the reading order. No menu role is written anywhere.',
    snippet: defineSnippet({
      id: 'navigation-menu-react-accessibility',
      language: 'tsx',
      label: 'The landmark’s name',
      source: `<NavigationMenu aria-label="Main">…</NavigationMenu>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange(value, request)',
    payload:
      'the open section’s value or null, and a request with previous, reason (pointer | keyboard | escape | outsidePress | blur | select | programmatic), source and cancel()',
    when: 'Before the open section moves: a press or a resting pointer on a trigger, a pointer leaving the root, Escape, a press outside, focus leaving the root, a panel link followed, or open()/close() on the handle. Cancelling keeps the section.',
  },
  {
    name: 'onClick, onPointerEnter on a trigger; onClick on a link',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The consumer’s handler runs first, and preventDefault() refuses the family’s part.',
  },
];

export const REACT_NAVIGATION_MENU_DOCS = {
  navigationMenu: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string | null',
        '—',
        'NavigationMenu',
        'The open section’s value. Present means the consumer owns it; null is none',
      ],
      [
        'defaultValue',
        'string | null',
        '—',
        'NavigationMenu',
        'The section an uncontrolled menu starts with open, read once',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'NavigationMenu, NavigationMenuDefaultsProvider',
        'The control step of a trigger and of a top-level link',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'NavigationMenu',
        'A row under which panels open, or a column beside which they open. A nested menu is vertical unless it says otherwise',
      ],
      [
        'openDelay',
        'number',
        '200',
        'NavigationMenu, NavigationMenuDefaultsProvider',
        'Milliseconds a pointer rests on a trigger before its section opens. With a section open, another one opens at once',
      ],
      [
        'closeDelay',
        'number',
        '300',
        'NavigationMenu, NavigationMenuDefaultsProvider',
        'Milliseconds a pointer leaving the root waits before the section closes; a return cancels it',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'NavigationMenu, NavigationMenuDefaultsProvider, NavigationMenuLink',
        'Following a link inside a panel closes every level. A link’s own value wins',
      ],
      [
        'arrow',
        'boolean',
        'false',
        'NavigationMenu, NavigationMenuDefaultsProvider',
        'Draws the mark on the surface’s edge that points at the open trigger',
      ],
      [
        'messages',
        'Partial<NavigationMenuMessages>',
        '—',
        'NavigationMenu',
        'Words laid over the language in force: the landmark’s name when the consumer gives no aria-label (navigation)',
      ],
      [
        'value',
        'string',
        '—',
        'NavigationMenuItem',
        'The item’s identity: what the root’s value names it by. Reaches the DOM as data-value',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'NavigationMenuItem, NavigationMenuLink',
        'The section never opens and its trigger takes the native attribute; a link keeps its href and refuses the press',
      ],
      [
        'columns',
        '1 | 2 | 3',
        '1',
        'NavigationMenuContent',
        'How many columns of links or groups the panel lays out; the panel’s width follows',
      ],
      [
        'current',
        'boolean',
        '—',
        'NavigationMenuLink',
        'This link is the page the reader is on. Unstated, an aria-current="page" the router wrote is read',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'root, list, item, content, link, links, group, group-label, footer',
        'Substitutes the element and hands it every attribute: a router’s link, a header as the root. The trigger is fixed, because the family wires aria-expanded and aria-controls on it',
      ],
      [
        'ref',
        'Ref<NavigationMenuHandle> on the root, Ref<HTMLElement> on every part',
        '—',
        'every part',
        'The root’s handle carries open(value), close(), focus(value?) and the root element',
      ],
      [
        'useNavigationMenu()',
        '() => NavigationMenuContextValue',
        '—',
        'inside NavigationMenu',
        'What the parts read: the open value, the orientation, the crossing, and request()',
      ],
      [
        'useNavigationMenuItem()',
        '() => NavigationMenuItemContextValue',
        '—',
        'inside NavigationMenuItem',
        'What a section reads: its value, whether it is open, disabled or holds the current page, its panel’s id',
      ],
      [
        'NavigationMenuDefaultsProvider',
        '{ size, openDelay, closeDelay, closeOnSelect, arrow }',
        '—',
        'a subtree',
        'The decisions an application takes once. A menu that states any of them itself still wins',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure Navigation Menu (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), and no menu, menubar or menuitem role is written: the example’s own note refuses them for a site’s navigation. The DOM is nav > ul > li > (button + div) and (a), so a reader hears a navigation landmark, a list of so many items, a button that is collapsed or expanded, and links.',
      'Each panel follows its trigger in the DOM and is hidden while closed, so Tab reaches its links straight after the trigger — the order the pattern assumes — with no sentinel elements and no tabindex written anywhere. The arrow keys, Home and End are the pattern’s optional shortcut over that order, not a replacement for it.',
      'Escape closes the open section and returns focus to its trigger; focus leaving the root, a press outside it and a followed link close it too, each with its own reason so an application can tell them apart.',
      'The current page is aria-current="page" on its link and nowhere else. The trigger of the section holding it carries data-current for the stylesheet and no ARIA, because the page is the thing that is current.',
      'A disabled link is aria-disabled with its href kept: perceivable, focusable, and refused on press. A disabled section’s trigger takes the native attribute. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
      'Hover never decides anything a press cannot: a touch never opens by hover, and every section opens by its button.',
    ],
    snippets: [
      defineSnippet({
        id: 'navigation-menu-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<nav
  data-ui="navigation-menu"
  data-part="root"
  data-orientation="horizontal"
  data-size="md"
  aria-label="Main"
>
  <ul data-part="list">
    <li data-part="item" data-value="products" data-open>
      <button data-part="trigger" aria-expanded="true" aria-controls="p" data-open>
        Products
        <span data-part="indicator" aria-hidden="true">
          <span data-ui="icon" data-part="root" aria-hidden="true">
            <svg data-part="glyph" data-glyph="chevron-down" />
          </span>
        </span>
      </button>
      <div data-part="content" id="p" data-columns="2" data-open>
        <ul data-part="links">
          <li>
            <a data-part="link" href="/fleet" aria-current="page" data-current>
              Fleet
            </a>
          </li>
        </ul>
      </div>
    </li>
  </ul>
  <div data-part="viewport" data-open data-positioned>
    <span data-part="arrow" aria-hidden="true" />
  </div>
</nav>;`,
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
