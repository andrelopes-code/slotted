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

export const REACT_SIDE_NAVIGATION_TOKENS = sideNavigationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SideNavigation decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SideNavigation, SideNavigationActions, SideNavigationCount, SideNavigationDefaultsProvider, SideNavigationDescription, SideNavigationDivider, SideNavigationEnd, SideNavigationGroup, SideNavigationIcon, SideNavigationItem, SideNavigationLabel, SideNavigationLink, SideNavigationList, SideNavigationSection, SideNavigationSectionLabel, SideNavigationSkeleton, SideNavigationTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav, or a div inside app-shell, or the element render returns',
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
    element: 'a with an href, or a button without one, or the element render returns',
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
      id: 'side-navigation-react-playground',
      language: 'tsx',
      label: 'A column of destinations',
      source: `<SideNavigation defaultValue="loads">
  <SideNavigationList>
    <SideNavigationItem value="dashboard">
      <SideNavigationLink href="/dashboard">
        <SideNavigationIcon>
          <ChartNoAxesColumn />
        </SideNavigationIcon>
        <SideNavigationLabel>Dashboard</SideNavigationLabel>
      </SideNavigationLink>
    </SideNavigationItem>
    <SideNavigationItem value="loads">
      <SideNavigationLink href="/loads">
        <SideNavigationIcon>
          <Package />
        </SideNavigationIcon>
        <SideNavigationLabel>Loads</SideNavigationLabel>
        <SideNavigationCount>12</SideNavigationCount>
      </SideNavigationLink>
    </SideNavigationItem>
  </SideNavigationList>
</SideNavigation>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, drawn as its own name',
    note: 'The frame with no product in it: each part the contract declares, labelled, so the family’s box can be told from the product’s content.',
    snippet: defineSnippet({
      id: 'side-navigation-react-anatomy',
      language: 'tsx',
      label: 'A section, a row with everything on it, and a group',
      source: `<SideNavigation>
  <SideNavigationSection>
    <SideNavigationSectionLabel>section-label</SideNavigationSectionLabel>
    <SideNavigationList>
      <SideNavigationItem value="row">
        <SideNavigationLink href="/row">
          <SideNavigationIcon>…</SideNavigationIcon>
          <SideNavigationLabel>label</SideNavigationLabel>
          <SideNavigationDescription>description</SideNavigationDescription>
          <SideNavigationCount>12</SideNavigationCount>
        </SideNavigationLink>
        <SideNavigationActions>…</SideNavigationActions>
      </SideNavigationItem>
      <SideNavigationItem value="branch">
        <SideNavigationTrigger>
          <SideNavigationLabel>trigger</SideNavigationLabel>
        </SideNavigationTrigger>
        <SideNavigationGroup>…</SideNavigationGroup>
      </SideNavigationItem>
      <SideNavigationDivider />
      <SideNavigationSkeleton />
    </SideNavigationList>
  </SideNavigationSection>
</SideNavigation>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups that open and close',
    note: 'A trigger is the whole row and its group opens on a track that grows to its own height; the chevron turns from along the line to down. Under multiple=false the sibling closes.',
    snippet: defineSnippet({
      id: 'side-navigation-react-groups',
      language: 'tsx',
      label: 'A group under a trigger',
      source: `<SideNavigationItem value="deliveries">
  <SideNavigationTrigger>
    <SideNavigationIcon>
      <Truck />
    </SideNavigationIcon>
    <SideNavigationLabel>Deliveries</SideNavigationLabel>
    <SideNavigationCount>38</SideNavigationCount>
  </SideNavigationTrigger>
  <SideNavigationGroup>
    <SideNavigationItem value="today">
      <SideNavigationLink href="/deliveries/today">
        <SideNavigationLabel>Today</SideNavigationLabel>
      </SideNavigationLink>
    </SideNavigationItem>
  </SideNavigationGroup>
</SideNavigationItem>;`,
    }),
  },
  {
    id: 'hybrid',
    title: 'A destination that is also a parent',
    note: 'The APG hybrid row: the link navigates and a mark-only trigger beside it opens the children, named by the row’s label. Five levels deep, the indent below the marked level is a constant step.',
    snippet: defineSnippet({
      id: 'side-navigation-react-hybrid',
      language: 'tsx',
      label: 'A link and its trigger side by side',
      source: `<SideNavigationItem value="reports">
  <SideNavigationLink href="/reports">
    <SideNavigationIcon>
      <ChartNoAxesColumn />
    </SideNavigationIcon>
    <SideNavigationLabel>Reports</SideNavigationLabel>
  </SideNavigationLink>
  <SideNavigationTrigger />
  <SideNavigationGroup>…</SideNavigationGroup>
</SideNavigationItem>;`,
    }),
  },
  {
    id: 'sections',
    title: 'Sections, a divider and a command',
    note: 'Two titled sections under one root, a divider between rows that keeps the list a list, and a row that is a button — a command in the column, never current.',
    snippet: defineSnippet({
      id: 'side-navigation-react-sections',
      language: 'tsx',
      label: 'Titled sections',
      source: `<SideNavigation>
  <SideNavigationSection>
    <SideNavigationSectionLabel>Operations</SideNavigationSectionLabel>
    <SideNavigationList>…</SideNavigationList>
  </SideNavigationSection>
  <SideNavigationSection>
    <SideNavigationSectionLabel>Administration</SideNavigationSectionLabel>
    <SideNavigationList>
      <SideNavigationDivider />
      <SideNavigationItem value="new">
        <SideNavigationLink onClick={() => openDialog()}>
          <SideNavigationIcon>
            <Plus />
          </SideNavigationIcon>
          <SideNavigationLabel>New load</SideNavigationLabel>
        </SideNavigationLink>
      </SideNavigationItem>
    </SideNavigationList>
  </SideNavigationSection>
</SideNavigation>;`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'value on the root names the destination and a press asks it to move; a link that states current itself wins. The parent of a hidden destination is marked until its group opens, and autoExpand opens it. With a router, usePressSelection paints the press before the route renders: the item is current at once, and the navigation runs after the frame that shows it. A click carrying a modifier key is left to the browser.',
    snippet: defineSnippet({
      id: 'side-navigation-react-current',
      language: 'tsx',
      label: 'The destination owned by the router',
      source: `const { pathname } = useLocation();
const navigate = useNavigate();
const { selected, select } = usePressSelection(pathname);

const press = (to: string) => (event: MouseEvent) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  select(to, () => navigate(to));
};

<SideNavigation value={selected ?? null}>
  …
  <SideNavigationItem value="/orders">
    <SideNavigationLink href="/orders" onClick={press('/orders')}>
      Orders
    </SideNavigationLink>
  </SideNavigationItem>
</SideNavigation>;`,
    }),
  },
  {
    id: 'compact',
    title: 'The rail',
    note: 'Under mode="compact" — or under 96 pixels of its own width — every part but the mark leaves the eye; the label stays in the DOM, a tooltip repeats it, and a row with a count carries a dot.',
    snippet: defineSnippet({
      id: 'side-navigation-react-compact',
      language: 'tsx',
      label: 'A rail of marks',
      source: `<SideNavigation mode="compact" defaultValue="loads">
  …
</SideNavigation>;`,
    }),
  },
  {
    id: 'flyout',
    title: 'A group beside the rail',
    note: 'In the rail, pressing a trigger without a link presents its group in a layer beside it. ArrowDown walks into it, Escape returns to the trigger, and focus leaving it closes it.',
    snippet: defineSnippet({
      id: 'side-navigation-react-flyout',
      language: 'tsx',
      label: 'The flyout, owned by the application',
      source: `const [flyout, setFlyout] = useState<string | null>(null);

<SideNavigation mode="compact" flyout={flyout} onFlyoutChange={setFlyout}>
  …
</SideNavigation>;`,
    }),
  },
  {
    id: 'size',
    title: 'Three row heights',
    note: 'md reads the row geometry app-shell publishes, so a column in the shell stands on the shell’s own edges; sm and lg read the control scale, and all three move with density.',
    snippet: defineSnippet({
      id: 'side-navigation-react-size',
      language: 'tsx',
      label: 'The compact step',
      source: `<SideNavigation size="sm">…</SideNavigation>;`,
    }),
  },
  {
    id: 'states',
    title: 'The states a row can be in',
    note: 'Current, expanded, open, disabled, and the hover, press and focus every row answers. A disabled destination keeps its href and its name, and refuses the press.',
    snippet: defineSnippet({
      id: 'side-navigation-react-states',
      language: 'tsx',
      label: 'A disabled row',
      source: `<SideNavigationItem disabled value="billing">
  <SideNavigationLink href="/billing">
    <SideNavigationIcon>
      <CreditCard />
    </SideNavigationIcon>
    <SideNavigationLabel>Billing</SideNavigationLabel>
    <SideNavigationDescription>Available on the Team plan</SideNavigationDescription>
  </SideNavigationLink>
</SideNavigationItem>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long label cut at the end with its whole text in the tooltip; the same column cut in the middle, where setembro and outubro stay apart; a URL; a title in another script; and wrapping, on request.',
    snippet: defineSnippet({
      id: 'side-navigation-react-content',
      language: 'tsx',
      label: 'Where the cut falls',
      source: `<SideNavigation truncate="middle">…</SideNavigation>;`,
    }),
  },
  {
    id: 'loading',
    title: 'A column still arriving',
    note: 'Skeleton rows in the geometry of the rows they stand for, so nothing moves when the destinations land; the root carries aria-busy.',
    snippet: defineSnippet({
      id: 'side-navigation-react-loading',
      language: 'tsx',
      label: 'Three rows on their way',
      source: `<SideNavigation aria-busy="true">
  <SideNavigationList>
    <SideNavigationSkeleton labelSize="55%" />
    <SideNavigationSkeleton labelSize="70%" />
    <SideNavigationSkeleton labelSize="45%" />
  </SideNavigationList>
</SideNavigation>;`,
    }),
  },
  {
    id: 'shell',
    title: 'Inside the shell',
    note: 'The column in app-shell’s nav region: a div rather than a second landmark, rows on the shell’s published geometry, and the rail read from the region’s own width when the shell collapses.',
    snippet: defineSnippet({
      id: 'side-navigation-react-shell',
      language: 'tsx',
      label: 'The nav region holding the column',
      source: `<AppShell>
  <AppShellBanner>…</AppShellBanner>
  <AppShellNav>
    <AppShellNavBody>
      <SideNavigation defaultValue="orders">…</SideNavigation>
    </AppShellNavBody>
  </AppShellNav>
  <AppShellMain>…</AppShellMain>
</AppShell>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for an application',
    note: 'The provider carries the axes for every column under it — a product whose groups open one at a time, with no guides — and a column that states one itself still wins.',
    snippet: defineSnippet({
      id: 'side-navigation-react-defaults',
      language: 'tsx',
      label: 'The provider',
      source: `<SideNavigationDefaultsProvider guides={false} multiple={false} truncate="middle">
  <SideNavigation>…</SideNavigation>
</SideNavigationDefaultsProvider>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composed with what sits beside it',
    note: 'A Badge in end for a count that carries a tone, an Avatar in icon for a person, a Kbd for a shortcut, and a router’s own link through render, which is where aria-current comes from.',
    snippet: defineSnippet({
      id: 'side-navigation-react-composition',
      language: 'tsx',
      label: 'A router link as the row',
      source: `<SideNavigationLink render={(props) => <NavLink {...props} to="/loads" />}>
  <SideNavigationIcon>
    <Package />
  </SideNavigationIcon>
  <SideNavigationLabel>Loads</SideNavigationLabel>
  <SideNavigationEnd>
    <Badge tone="danger" size="sm">
      3
    </Badge>
  </SideNavigationEnd>
</SideNavigationLink>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches every row. ArrowDown and ArrowUp walk the visible rows, Home and End jump, Escape closes the group holding focus and lands on its trigger. The reason each request carries is shown.',
    snippet: defineSnippet({
      id: 'side-navigation-react-keyboard',
      language: 'tsx',
      label: 'Which device asked',
      source: `<SideNavigation
  onExpandedChange={(expanded, request) => log(request.reason)}
  onValueChange={(value, request) => log(request.reason)}
>
  …
</SideNavigation>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A navigation landmark holding a list; each branch a button with aria-expanded and aria-controls; each destination a link, one of them aria-current; a hybrid trigger named by its row.',
    snippet: defineSnippet({
      id: 'side-navigation-react-accessibility',
      language: 'tsx',
      label: 'The landmark’s name',
      source: `<SideNavigation aria-label="Main navigation">…</SideNavigation>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange(value, request)',
    payload:
      'the destination’s value, and a request with previous, reason (pointer | keyboard | programmatic), source and cancel()',
    when: 'Before the current destination moves, on a press of a link with an href. Cancelling refuses; the navigation itself is the anchor’s.',
  },
  {
    name: 'onExpandedChange(expanded, request)',
    payload:
      'the whole set of open values, and a request with reason (pointer | keyboard | select | escape | programmatic)',
    when: 'Before a group opens or closes: a press on its trigger, Escape inside it, autoExpand reaching the current destination (select), or expand()/collapse() on the handle.',
  },
  {
    name: 'onFlyoutChange(flyout, request)',
    payload:
      'the value of the group shown beside the rail or null, and a request with reason (pointer | keyboard | select | escape | outsidePress | blur | resize | programmatic)',
    when: 'Before the flyout opens or closes: a trigger pressed in the rail, a link pressed inside it, Escape, a press outside, focus leaving it, or the rail widening.',
  },
  {
    name: 'onClick, onFocus, onKeyDown on every row',
    payload: 'the element’s own events',
    when: 'Whenever the a or button fires them. The consumer’s handler runs first, and preventDefault() in onClick refuses the family’s part.',
  },
];

export const REACT_SIDE_NAVIGATION_DOCS = {
  sideNavigation: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string | null',
        '—',
        'SideNavigation',
        'The current destination’s value. Present means the consumer owns it; a link that states current itself still wins',
      ],
      [
        'defaultValue',
        'string | null',
        '—',
        'SideNavigation',
        'The destination an uncontrolled column starts on, read once',
      ],
      [
        'expanded',
        'readonly string[]',
        '—',
        'SideNavigation',
        'The set of open groups. Present means the consumer owns it',
      ],
      [
        'defaultExpanded',
        'readonly string[]',
        '—',
        'SideNavigation',
        'The groups an uncontrolled column starts with open, read once',
      ],
      [
        'flyout',
        'string | null',
        '—',
        'SideNavigation',
        'The one group presented beside the rail. Present means the consumer owns it; it never writes into expanded',
      ],
      [
        'defaultFlyout',
        'string | null',
        '—',
        'SideNavigation',
        'The group an uncontrolled column starts with in the flyout, read once',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SideNavigation, SideNavigationDefaultsProvider',
        'The row height. md reads the geometry app-shell publishes, with the control scale as the fallback; sm and lg read their own steps',
      ],
      [
        'mode',
        "'auto' | 'expanded' | 'compact'",
        'auto',
        'SideNavigation, SideNavigationDefaultsProvider',
        'auto is a rail below compactAt pixels of the root’s own width and a labelled column above; the other two force one',
      ],
      [
        'truncate',
        "'end' | 'middle' | 'none'",
        'end',
        'SideNavigation, SideNavigationDefaultsProvider',
        'Where a label that does not fit is cut. end is the stylesheet’s ellipsis; middle keeps the start and the tail; none wraps. A cut label opens the tooltip with the whole text',
      ],
      [
        'multiple',
        'boolean',
        'true',
        'SideNavigation, SideNavigationDefaultsProvider',
        'Whether more than one group may be open at once. Off, opening one closes the rest',
      ],
      [
        'autoExpand',
        'boolean',
        'true',
        'SideNavigation, SideNavigationDefaultsProvider',
        'Whether the ancestors of the current destination open by themselves, with the reason select',
      ],
      [
        'guides',
        'boolean',
        'true',
        'SideNavigation, SideNavigationDefaultsProvider',
        'Whether a guide runs down each open group, under the parent’s mark or on its text edge',
      ],
      [
        'landmark',
        'boolean',
        'true',
        'SideNavigation, SideNavigationDefaultsProvider',
        'Whether the root is a nav. Unstated, it is one on its own and a div inside app-shell, whose nav region is already the landmark',
      ],
      [
        'compactAt',
        'number',
        '96',
        'SideNavigation, SideNavigationDefaultsProvider',
        'The width, in CSS pixels, under which mode="auto" is compact. The stylesheet’s own breakpoint is the same number',
      ],
      [
        'messages',
        'Partial<SideNavigationMessages>',
        '—',
        'SideNavigation',
        'Words laid over the language in force: the landmark’s name when the consumer gives no aria-label (navigation)',
      ],
      [
        'value',
        'string',
        '—',
        'SideNavigationItem',
        'The item’s identity: what value, expanded and flyout name it by. Reaches the DOM as data-value',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'SideNavigationItem',
        'The row refuses the press and keeps its href, its name and its place in the tab order; the trigger takes the native attribute',
      ],
      [
        'current',
        'boolean',
        '—',
        'SideNavigationLink',
        'Stated on the row itself — what a router’s link writes — it wins over the root’s value',
      ],
      [
        'href',
        'string',
        '—',
        'SideNavigationLink',
        'The destination. Without one the row is a button: a command in the column, never current',
      ],
      [
        'labelSize',
        'number | string',
        '60%',
        'SideNavigationSkeleton',
        'How wide the label’s bar is drawn',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part but indicator, skeleton and flyout',
        'Substitutes the element and hands it every attribute: a router’s link as the row, a button for a command, a section as an aside',
      ],
      [
        'ref',
        'Ref<SideNavigationHandle> on the root, Ref<HTMLElement> on every part',
        '—',
        'every part',
        'The root’s handle carries focus(), expand(value), collapse(value) and the root element; every other ref reaches the element itself',
      ],
      [
        'useSideNavigation()',
        '() => SideNavigationContextValue',
        '—',
        'inside SideNavigation',
        'What the parts read: the axes, whether the column is compact, the three values and the requests that move them',
      ],
      [
        'useSideNavigationItem()',
        '() => SideNavigationItemContextValue',
        '—',
        'inside SideNavigationItem',
        'What a row reads: its value, whether it is expanded, current or holds the current destination, its identifiers',
      ],
      [
        'SideNavigationDefaultsProvider',
        '{ size, mode, truncate, multiple, autoExpand, guides, landmark, compactAt }',
        '—',
        'a subtree',
        'The decisions an application takes once. A column that states any of them itself still wins',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure Navigation Menu with Top-Level Links (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/), and no role is written: the DOM is nav > ul > li > (a | button) + ul, so a reader hears a navigation landmark, a list of so many items, a link or a button, and a nested list. The tree role is refused on the APG’s own advice — it demands functionality a site’s navigation does not need.',
      'Every link and trigger is in the page tab sequence and nothing here writes tabindex. The arrow keys, Home and End — optional in the pattern and adopted — walk the visible rows, into the flyout when it is open; Escape closes the group holding focus and lands on its trigger, as the pattern lists. A closed group is visibility: hidden, so its rows leave the tab sequence and the accessibility tree together.',
      'A trigger carries aria-expanded and aria-controls, and its group aria-labelledby pointing at the row’s label; a trigger beside a link is named by that same label through aria-labelledby, so the hybrid row is heard as “Reports, link” then “Reports, button, collapsed”. Identifiers come from useId, so a server response and the first client render agree.',
      'The current destination is aria-current="page" on the link and nowhere else. The parent of a destination the reader cannot see carries data-current for the stylesheet and no ARIA, because the destination is the thing that is current.',
      'In the rail the label is clipped to a pixel rather than removed, so the link keeps its accessible name; a tooltip repeats it on hover, on visible focus and on press-and-hold. Under truncate a row whose label the binding measured as cut opens the same tooltip, and a middle cut writes the whole text as aria-label so the name is the name and not the cut.',
      'A disabled destination is aria-disabled with its href kept: perceivable, focusable, and refused on press, so a reader can reach the row and hear why it is unavailable. A disabled trigger takes the native attribute. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
    ],
    snippets: [
      defineSnippet({
        id: 'side-navigation-react-dom',
        language: 'tsx',
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
          <span data-part="icon" aria-hidden="true">
            …
          </span>
          <span data-part="label" id="l-a">
            Loads
          </span>
          <span data-part="count">12</span>
        </a>
      </li>
      <li data-part="item" data-value="deliveries" data-expanded>
        <button data-part="trigger" id="t-b" aria-expanded="true" aria-controls="g-b">
          <span data-part="label" id="l-b">
            Deliveries
          </span>
          <span data-part="indicator" aria-hidden="true">
            <span data-ui="icon" data-part="root" data-directional aria-hidden="true">
              <svg data-part="glyph" data-glyph="chevron-right" />
            </span>
          </span>
        </button>
        <ul data-part="group" id="g-b" aria-labelledby="l-b">
          …
        </ul>
      </li>
    </ul>
  </div>
</nav>;`,
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
