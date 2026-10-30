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

export const REACT_TOP_NAVIGATION_TOKENS = topNavigationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned TopNavigation decision',
}));

const imports: ReferenceImport = {
  source:
    "import { TopNavigation, TopNavigationAccount, TopNavigationAction, TopNavigationActions, TopNavigationBrand, TopNavigationContext, TopNavigationCount, TopNavigationDefaultsProvider, TopNavigationHelp, TopNavigationHome, TopNavigationItem, TopNavigationLink, TopNavigationList, TopNavigationMark, TopNavigationName, TopNavigationNav, TopNavigationNotifications, TopNavigationSearch, TopNavigationTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'header, or a div inside app-shell, or the element render returns',
    required: true,
    purpose:
      'The bar, and the query container it answers: data-ui="top-navigation", data-size, data-frame while it paints its own ground, data-search-open while the search has taken the bar. A header on its own — the banner landmark; inside the shell’s banner, which already is one, a div.',
  },
  {
    part: 'skip',
    element: 'a',
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
    element: 'a with an href, or a span without one, or the element render returns',
    required: false,
    purpose:
      'The mark and the name, linked to the start of the application. Below 480 pixels the name leaves the eye and not the DOM, so the link keeps its accessible name.',
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
      'What the application is right now — the workspace, the store, the environment — as the consumer’s own content. It keeps its width in the bar; below 600 pixels it is presented at the top of the panel.',
  },
  {
    part: 'nav',
    element: 'nav',
    required: false,
    purpose:
      'The navigation landmark, named by messages.navigation unless the consumer writes aria-label, and a navigation-menu root on the same element: data-ui="navigation-menu", the shared surface after its list, and the open section’s value, request and delays on TopNavigationNav. The panel follows it in DOM order.',
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
    element: 'a, or the element render returns',
    required: false,
    purpose:
      'The destination, with aria-current="page" while current. aria-disabled and a refused press while disabled, the href kept.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'A section that opens: the navigation-menu trigger of the NavigationMenuContent after it in the same item — aria-expanded, aria-controls, data-open, the chevron, a press and a resting pointer. Always a native button.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The trigger’s chevron, the chevron-down Glyph element, turned half a turn while open.',
  },
  {
    part: 'more',
    element: 'button',
    required: false,
    purpose:
      'The disclosure button of the panel: aria-expanded, aria-controls, data-overflow with the count of what folded, data-current while the current destination is folded. Shown by the stylesheet as soon as anything folds.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'What did not fit, inside the root and right after the nav: the context, the panel-list, the help. Under the bar, full width below 480 pixels. Present in the DOM closed, out of sight and out of the tab order.',
  },
  {
    part: 'panel-list',
    element: 'ul',
    required: false,
    purpose:
      'The list that receives the folded items — rendered into it while the panel is present, so a section keeps its panel, which opens in line under its trigger there, and a link keeps its badge.',
  },
  {
    part: 'search',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The search region, with the consumer’s TextField inside, standing at the start of the middle of the bar and growing to 28rem, never under 12rem: the first thing to give way when the bar is short of room. Below 600 pixels it exists only while searchOpen, and then takes the whole bar.',
  },
  {
    part: 'search-toggle',
    element: 'button',
    required: false,
    purpose:
      'The magnifier that asks searchOpen to be true, rendered by Actions whenever the bar has a search and shown below 600 pixels while the search is closed.',
  },
  {
    part: 'search-close',
    element: 'button',
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
    element: 'a with an href, or a button, or the element render returns',
    required: false,
    purpose:
      'The question mark. Its children are its label, clipped in the bar and shown as a row in the panel below 480 pixels; the family’s message when there are none.',
  },
  {
    part: 'notifications',
    element: 'button, or the element render returns',
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
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'A pill around the consumer’s Avatar — xs at md, one step under the control — and, above 600 pixels, a name beside it. Wrapped in Menu by the consumer. It never folds.',
  },
  {
    part: 'action',
    element: 'a with an href, a button without one, or the element render returns',
    required: false,
    purpose:
      'A global control of the product’s own — approvals, tasks — in the same square, ink and states as the marked controls. The consumer projects its glyph, sized by the control, and names it with aria-label. TopNavigationCount inside it stands over its corner. It never folds.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'The bar of a freight operator',
    note: 'Aurora Logistics’ bar with every region filled, in a desktop room. The room scrolls sideways where the page is narrower; the steps the bar folds at are the next demonstration.',
    snippet: defineSnippet({
      id: 'top-navigation-react-playground',
      language: 'tsx',
      label: 'The bar',
      source: `<TopNavigation defaultValue="dashboard" skipTo="content">
  <TopNavigationBrand>
    <TopNavigationHome href="/">
      <TopNavigationMark>
        <AuroraMark />
      </TopNavigationMark>
      <TopNavigationName>Aurora Logistics</TopNavigationName>
    </TopNavigationHome>
  </TopNavigationBrand>
  <TopNavigationNav>
    <TopNavigationList>
      <TopNavigationItem priority="high" value="dashboard">
        <TopNavigationLink href="/dashboard">Dashboard</TopNavigationLink>
      </TopNavigationItem>
      <TopNavigationItem priority="low" value="reports">
        <TopNavigationLink href="/reports">Reports</TopNavigationLink>
      </TopNavigationItem>
    </TopNavigationList>
  </TopNavigationNav>
  <TopNavigationSearch>
    <TextField placeholder="Search loads, customers, routes…" type="search" />
  </TopNavigationSearch>
  <TopNavigationActions>
    <TopNavigationHelp href="/ajuda" />
    <TopNavigationNotifications>
      <TopNavigationCount>3</TopNavigationCount>
    </TopNavigationNotifications>
    <TopNavigationAccount>
      <Avatar size="xs">AB</Avatar>
    </TopNavigationAccount>
  </TopNavigationActions>
</TopNavigation>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, named',
    note: 'The bar with each part labelled by its data-part: the brand, the context, the destinations with a section trigger, the search, and the four global controls. The panel and its list stand in the DOM after the nav, closed.',
    snippet: defineSnippet({
      id: 'top-navigation-react-anatomy',
      language: 'tsx',
      label: 'The parts a consumer writes',
      source: `<TopNavigation>
  <TopNavigationBrand>
    <TopNavigationHome href="/">
      <TopNavigationMark>…</TopNavigationMark>
      <TopNavigationName>name</TopNavigationName>
    </TopNavigationHome>
  </TopNavigationBrand>
  <TopNavigationContext>…</TopNavigationContext>
  <TopNavigationNav>
    <TopNavigationList>
      <TopNavigationItem value="link">
        <TopNavigationLink href="/link">link</TopNavigationLink>
      </TopNavigationItem>
      <TopNavigationItem value="trigger">
        <TopNavigationTrigger>trigger</TopNavigationTrigger>
      </TopNavigationItem>
    </TopNavigationList>
  </TopNavigationNav>
  <TopNavigationSearch>…</TopNavigationSearch>
  <TopNavigationActions>
    <TopNavigationHelp href="/help" />
    <TopNavigationNotifications>
      <TopNavigationCount>3</TopNavigationCount>
    </TopNavigationNotifications>
    <TopNavigationAccount>…</TopNavigationAccount>
  </TopNavigationActions>
</TopNavigation>;`,
    }),
  },
  {
    id: 'priority',
    title: 'Three steps of the width',
    note: 'The same bar in four rooms of a stated width. On a desktop everything shows; on a laptop (under 1024) the low items have folded into more; a tablet at 640 folds the same low items and keeps the rest; on a phone the medium ones fold under 600, where the search becomes a magnifier and the context moves to the panel, and the high ones and the help fold under 480, where the name leaves the eye.',
    snippet: defineSnippet({
      id: 'top-navigation-react-priority',
      language: 'tsx',
      label: 'Which destination gives way first',
      source: `<TopNavigationList>
  <TopNavigationItem priority="high" value="dashboard">
    <TopNavigationLink href="/dashboard">Dashboard</TopNavigationLink>
  </TopNavigationItem>
  <TopNavigationItem value="routes">
    <TopNavigationLink href="/rotas">Rotas</TopNavigationLink>
  </TopNavigationItem>
  <TopNavigationItem priority="low" value="faturacao">
    <TopNavigationLink href="/faturacao">Billing</TopNavigationLink>
  </TopNavigationItem>
</TopNavigationList>;`,
    }),
  },
  {
    id: 'panel',
    title: 'What folded, under the bar',
    note: 'Press more: on a phone the panel takes the bar’s whole width, on a tablet it stands under the bar’s end. The folded destinations are rows, the workspace at the top and help at the bottom. A press on a row closes it with the reason select; Escape returns focus to more; a press outside closes it too.',
    snippet: defineSnippet({
      id: 'top-navigation-react-panel',
      language: 'tsx',
      label: 'The panel, owned by the application',
      source: `const [moreOpen, setMoreOpen] = useState(false);

<TopNavigation moreOpen={moreOpen} onMoreOpenChange={(open) => setMoreOpen(open)}>
  …
</TopNavigation>;`,
    }),
  },
  {
    id: 'search',
    title: 'The search gives way to a magnifier',
    note: 'On a laptop the field stands at the start of the middle of the bar, after the brand and the destinations. On a phone it is a magnifier in the actions; pressing it opens the field over the whole bar with focus inside, and Escape, the cross or focus leaving it hand the bar back.',
    snippet: defineSnippet({
      id: 'top-navigation-react-search',
      language: 'tsx',
      label: 'The search region and its field',
      source: `<TopNavigationSearch>
  <TextField
    aria-label="Search"
    end={<Shortcut keys="mod+k" size="sm" variant="soft" />}
    placeholder="Search loads, customers, routes…"
    start={<Search aria-hidden size={16} />}
    type="search"
    variant="subtle"
  />
</TopNavigationSearch>;`,
    }),
  },
  {
    id: 'sections',
    title: 'A section that opens a panel of destinations',
    note: 'Frota is a section of the navigation menu the nav part already is: its panel opens on the shared surface under the bar, a resting pointer opens it after a delay, and a second section switches without one. Folded into the panel, the section opens its links in line.',
    snippet: defineSnippet({
      id: 'top-navigation-react-sections',
      language: 'tsx',
      label: 'A section and its panel',
      source: `<TopNavigationItem value="frota">
  <TopNavigationTrigger>Frota</TopNavigationTrigger>
  <NavigationMenuContent>
    <NavigationMenuLinks>
      <li>
        <NavigationMenuLink href="/fleet/vehicles">Vehicles</NavigationMenuLink>
      </li>
    </NavigationMenuLinks>
  </NavigationMenuContent>
</TopNavigationItem>;`,
    }),
  },
  {
    id: 'current',
    title: 'Where the reader is',
    note: 'value on the root names the destination and a press asks it to move with the device’s reason; a link that states current itself wins. Where the current destination has folded, more carries the mark in its place. With a router, usePressSelection paints the press before the route renders: the item is current at once, and the navigation runs after the frame that shows it. A click carrying a modifier key is left to the browser.',
    snippet: defineSnippet({
      id: 'top-navigation-react-current',
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

<TopNavigation value={selected ?? null}>
  <TopNavigationNav>
    <TopNavigationList>
      <TopNavigationItem value="/cargas">
        <TopNavigationLink href="/cargas" onClick={press('/cargas')}>
          Cargas
        </TopNavigationLink>
      </TopNavigationItem>
    </TopNavigationList>
  </TopNavigationNav>
</TopNavigation>;`,
    }),
  },
  {
    id: 'actions',
    title: 'The global controls',
    note: 'Help as a link to a help centre or as the trigger of a popover; the bell with a count over its corner that grows to a pill away from it; the account as a menu’s trigger; a control of the product’s own — approvals — in the same square, with its own glyph and the same count. Each carries its name for a reader and repeats it in a tooltip.',
    snippet: defineSnippet({
      id: 'top-navigation-react-actions',
      language: 'tsx',
      label: 'Notifications, approvals and the account as triggers',
      source: `<TopNavigationActions>
  <TopNavigationHelp href="/ajuda" />
  <Popover>
    <PopoverTrigger
      render={(props) => (
        <TopNavigationAction {...props} aria-label={\`Approvals, \${pending} pending\`}>
          <ClipboardCheck />
          <TopNavigationCount>{pending}</TopNavigationCount>
        </TopNavigationAction>
      )}
    />
    <PopoverContent>…</PopoverContent>
  </Popover>
  <Popover>
    <PopoverTrigger
      render={(props) => (
        <TopNavigationNotifications {...props}>
          <TopNavigationCount>12</TopNavigationCount>
        </TopNavigationNotifications>
      )}
    />
    <PopoverContent>…</PopoverContent>
  </Popover>
  <Menu>
    <MenuTrigger
      render={(props) => (
        <TopNavigationAccount {...props}>
          <Avatar size="xs">AB</Avatar>
        </TopNavigationAccount>
      )}
    />
    <MenuContent>…</MenuContent>
  </Menu>
</TopNavigationActions>;`,
    }),
  },
  {
    id: 'context',
    title: 'What the application is right now',
    note: 'A workspace switcher and an environment badge after the brand. On a phone the whole region moves to the top of the panel — the same elements, so the switcher still opens its menu there.',
    snippet: defineSnippet({
      id: 'top-navigation-react-context',
      language: 'tsx',
      label: 'The workspace and the environment',
      source: `<TopNavigationContext>
  <Menu>
    <MenuTrigger
      render={(props) => (
        <Button
          {...props}
          end={<ChevronsUpDown aria-hidden />}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          Portland · Operations
        </Button>
      )}
    />
    <MenuContent>…</MenuContent>
  </Menu>
  <Badge size="sm" tone="warning" variant="soft">
    Staging
  </Badge>
</TopNavigationContext>;`,
    }),
  },
  {
    id: 'size',
    title: 'Three control heights',
    note: 'sm, md and lg move every control in the bar together — the mark, the destinations, the four global controls — and the bar’s own height with them. All three move again with density.',
    snippet: defineSnippet({
      id: 'top-navigation-react-size',
      language: 'tsx',
      label: 'The compact step',
      source: `<TopNavigation size="sm">…</TopNavigation>;`,
    }),
  },
  {
    id: 'states',
    title: 'The states a destination can be in',
    note: 'Current, a section open, disabled — a disabled destination keeps its href and its name and refuses the press — and the hover, press and focus every control answers. Help and the account with their layers open hold the pointer’s ground.',
    snippet: defineSnippet({
      id: 'top-navigation-react-states',
      language: 'tsx',
      label: 'A disabled destination',
      source: `<TopNavigationItem disabled value="faturacao">
  <TopNavigationLink href="/faturacao">Billing</TopNavigationLink>
</TopNavigationItem>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A product name of nine words, cut with an ellipsis and, when the room runs out, given up before any control; destinations of four words each; a count of three characters; the account with a name beside the avatar; and the same bar in a right-to-left document.',
    snippet: defineSnippet({
      id: 'top-navigation-react-content',
      language: 'tsx',
      label: 'A name beside the avatar',
      source: `<TopNavigationAccount>
  <Avatar size="xs">MB</Avatar>
  <span>Maria Bartolomeu</span>
</TopNavigationAccount>;`,
    }),
  },
  {
    id: 'shell',
    title: 'Inside the shell',
    note: 'The bar as the only child of app-shell’s banner: a div rather than a second banner, no ground of its own, the shell’s nav-toggle in the brand and the mark over the column’s marks. Press the toggle and the bar keeps its place.',
    snippet: defineSnippet({
      id: 'top-navigation-react-shell',
      language: 'tsx',
      label: 'The banner holding the bar',
      source: `<AppShell>
  <AppShellBanner>
    <TopNavigation defaultValue="dashboard">
      <TopNavigationBrand>
        <AppShellNavToggle />
        <TopNavigationHome href="/">…</TopNavigationHome>
      </TopNavigationBrand>
      …
    </TopNavigation>
  </AppShellBanner>
  <AppShellNav>…</AppShellNav>
  <AppShellMain>…</AppShellMain>
</AppShell>;`,
    }),
  },
  {
    id: 'standalone',
    title: 'On its own, above a page',
    note: 'A header with its own ground, rule and inset, a skip link that appears on the first Tab, and a page under it. Nothing here is sticky: an application that wants the bar pinned writes position: sticky on it.',
    snippet: defineSnippet({
      id: 'top-navigation-react-standalone',
      language: 'tsx',
      label: 'A framed header with a skip link',
      source: `<>
  <TopNavigation skipTo="conteudo">…</TopNavigation>
  <main id="conteudo" tabIndex={-1}>
    …
  </main>
</>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for an application',
    note: 'The provider carries the size and the frame for every bar under it — an application at the large step — and a bar that states one itself still wins. The words on the icon-only controls come from the language in force.',
    snippet: defineSnippet({
      id: 'top-navigation-react-defaults',
      language: 'tsx',
      label: 'The provider',
      source: `<TopNavigationDefaultsProvider size="lg">
  <TopNavigation>…</TopNavigation>
</TopNavigationDefaultsProvider>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composed with what sits beside it',
    note: 'A router’s link as the destination through render, which is where aria-current comes from; a Badge in the context; a Kbd in the search; Menu on a section, on the account and on the workspace; Popover on the bell.',
    snippet: defineSnippet({
      id: 'top-navigation-react-composition',
      language: 'tsx',
      label: 'A router link as the destination',
      source: `<TopNavigationItem value="cargas">
  <TopNavigationLink render={(props) => <NavLink {...props} to="/cargas" />}>
    Cargas
  </TopNavigationLink>
</TopNavigationItem>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches every control, in the order they stand: the skip link, the mark, each destination, more, the panel when it is open, the search, help, the bell, the account. Escape closes the panel or the open search and lands on the control that opened it. The reason each request carries is shown.',
    snippet: defineSnippet({
      id: 'top-navigation-react-keyboard',
      language: 'tsx',
      label: 'Which device asked',
      source: `<TopNavigation
  onMoreOpenChange={(open, request) => log(request.reason)}
  onSearchOpenChange={(open, request) => log(request.reason)}
  onValueChange={(value, request) => log(request.reason)}
>
  …
</TopNavigation>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A banner landmark holding a navigation landmark with a list of links, one of them current; a button named Mais that expands a panel; a search; and three buttons named for what they open. Nothing is a menubar and nothing writes tabindex.',
    snippet: defineSnippet({
      id: 'top-navigation-react-accessibility',
      language: 'tsx',
      label: 'The landmarks’ names',
      source: `<TopNavigation aria-label="Aurora">
  <TopNavigationNav aria-label="Principal">…</TopNavigationNav>
</TopNavigation>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange(value, request)',
    payload:
      'the destination’s value, and a request with previous, reason (pointer | keyboard | programmatic), source and cancel()',
    when: 'Before the current destination moves, on a press of a link. Cancelling refuses; the navigation itself is the anchor’s.',
  },
  {
    name: 'onMoreOpenChange(open, request)',
    payload:
      'whether the panel is shown, and a request with reason (pointer | keyboard | select | escape | outsidePress | resize | programmatic)',
    when: 'Before the panel opens or closes: a press on more, a link pressed inside the panel, Escape, a press outside, the width widening until nothing is folded, or openMore()/closeMore() on the handle.',
  },
  {
    name: 'onSearchOpenChange(open, request)',
    payload:
      'whether the search has taken the bar, and a request with reason (pointer | keyboard | escape | blur | resize | programmatic)',
    when: 'Below 600 pixels: before the magnifier opens the field, and before Escape, the cross, focus leaving the field or the width widening past 600 closes it. Above, the value has no effect.',
  },
  {
    name: 'onCollapseChange(values, reason)',
    payload: 'the values of the folded items in DOM order, and the reason resize',
    when: 'After the set of folded items changed: the bar crossed one of its three steps. A fact, not a request — the width decided it.',
  },
  {
    name: 'onClick, onFocus, onKeyDown on every control',
    payload: 'the element’s own events',
    when: 'Whenever the a or button fires them. The consumer’s handler runs first, and preventDefault() in onClick refuses the family’s part.',
  },
];

export const REACT_TOP_NAVIGATION_DOCS = {
  topNavigation: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string | null',
        '—',
        'TopNavigation',
        'The current destination’s value. Present means the consumer owns it; a link that states current itself still wins',
      ],
      [
        'defaultValue',
        'string | null',
        '—',
        'TopNavigation',
        'The destination an uncontrolled bar starts on, read once',
      ],
      [
        'moreOpen',
        'boolean',
        '—',
        'TopNavigation',
        'Whether the panel is shown. Present means the consumer owns it',
      ],
      [
        'defaultMoreOpen',
        'boolean',
        'false',
        'TopNavigation',
        'Whether an uncontrolled bar starts with its panel open, read once',
      ],
      [
        'searchOpen',
        'boolean',
        '—',
        'TopNavigation',
        'Whether the search has taken the bar, below 600 pixels. Present means the consumer owns it; above 600 it has no effect',
      ],
      [
        'defaultSearchOpen',
        'boolean',
        'false',
        'TopNavigation',
        'Whether an uncontrolled bar starts with its search open, read once',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'TopNavigation, TopNavigationDefaultsProvider',
        'The control height of everything in the bar, from the control scale',
      ],
      [
        'frame',
        'boolean',
        'true',
        'TopNavigation, TopNavigationDefaultsProvider',
        'Whether the root paints its own ground, rule and inset. Unstated, it does on its own and not inside app-shell, whose banner already paints',
      ],
      [
        'landmark',
        'boolean',
        'true',
        'TopNavigation, TopNavigationDefaultsProvider',
        'Whether the root is a header. Unstated, it is one on its own and a div inside app-shell’s banner, which is already the landmark',
      ],
      [
        'skipTo',
        'string',
        '—',
        'TopNavigation',
        'The id of the element the skip link jumps to. Absent, no skip link is rendered',
      ],
      [
        'value, defaultValue, onValueChange',
        'string | null, (value, request) => void',
        '—',
        'TopNavigationNav',
        'The open section, on the nav part, which is a navigation-menu root: every way a section opens or closes asks with its reason. Not the current destination, which is the root’s value',
      ],
      [
        'arrow, openDelay, closeDelay, closeOnSelect',
        'boolean, number, number, boolean',
        'false, 200, 300, true',
        'TopNavigationNav',
        'The navigation menu’s own axes, read from NavigationMenuDefaultsProvider when unstated',
      ],
      [
        'messages',
        'Partial<TopNavigationMessages>',
        '—',
        'TopNavigation',
        'Words laid over the language in force, key by key — navigation, more, moreCount, search, closeSearch, help, notifications, account, skip: the words on the controls that have no visible text',
      ],
      [
        'value',
        'string',
        '—',
        'TopNavigationItem',
        'The item’s identity: what value names it by and what onCollapseChange reports',
      ],
      [
        'priority',
        "'high' | 'medium' | 'low'",
        'medium',
        'TopNavigationItem',
        'Which step of the width folds the item: low under 1024 pixels, medium under 600, high under 480',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'TopNavigationItem',
        'The row and everything in it refuse interaction; the link keeps its href and its name',
      ],
      [
        'current',
        'boolean',
        '—',
        'TopNavigationLink',
        'Whether this is the current destination, stated on the row — what a router’s link writes. It wins over the root’s value',
      ],
      [
        'href',
        'string',
        '—',
        'TopNavigationHome, TopNavigationLink, TopNavigationHelp',
        'Where the control leads. Home without one is a span; help without one is a button for the consumer to wrap',
      ],
      [
        'aria-label',
        'string',
        'the family’s message',
        'TopNavigationHelp, TopNavigationNotifications, TopNavigationAccount, TopNavigationAction, TopNavigationNav',
        'The name the consumer writes, kept over the family’s own',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'root, brand, home, mark, name, context, nav, list, item, link, search, actions, help, notifications, count, account',
        'Substitutes the element and hands it every attribute: a router’s link as the destination, a button as help. The trigger is fixed: the navigation menu wires it',
      ],
      [
        'ref',
        'Ref<TopNavigationHandle> on the root, Ref<HTMLElement> on every part',
        '—',
        'every part',
        'The root’s handle carries focus(), focusSearch(), openMore(), closeMore() and the root element; every other ref reaches the element itself',
      ],
      [
        'useTopNavigation()',
        '() => TopNavigationContextValue',
        '—',
        'inside TopNavigation',
        'What the parts read: the folded priorities, the collapsed values, the three values and the requests that move them, the panel and its list',
      ],
      [
        'useTopNavigationItem()',
        '() => TopNavigationItemContextValue',
        '—',
        'inside TopNavigationItem',
        'What a row reads: its value, its priority, whether it is folded, current or disabled',
      ],
      [
        'TopNavigationDefaultsProvider',
        '{ size, frame, landmark }',
        '—',
        'a subtree',
        'The decisions an application takes once. A bar that states any of them itself still wins',
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
      'The bar is the banner landmark — a header in the context of the body, with no role written — and its destinations are the navigation landmark, a nav named Navigation unless the consumer names it. Inside app-shell the root is a div, because the shell’s banner is already the banner and two banners in one document is what the resolution prevents.',
      'The destinations follow the WAI-ARIA APG’s Disclosure Navigation Menu example (w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/): nav > ul > li > a, so a reader hears a list of so many links, one of them aria-current="page". The Navigation Menubar example’s own caution — that menubar demands functionality a site’s navigation does not need — is why nothing here is a menubar, nothing writes tabindex and no arrow key moves focus: every control is a tab stop.',
      'more is a button with aria-expanded and aria-controls pointing at the panel, and its name carries the count of what folded — More, 3, the moreCount message. The panel stands in the DOM right after the nav, so Tab from more enters it, the way the disclosure pattern assumes; closed, it is visibility: hidden and its rows leave the tab sequence. Escape closes it and returns focus to more.',
      'The folded destinations are the consumer’s own elements rendered into the panel, so a section keeps its panel and a link keeps its badge, its href and its aria-current. Below 480 pixels the name is clipped rather than removed, so the home link keeps its name; help’s label is clipped in the bar and shown in the panel, so help has one name in both places.',
      'Every icon-only control — the magnifier, the cross, help, the bell, the account, more — carries an accessible name from the family’s messages or the consumer’s aria-label, and repeats it in a tooltip on hover and on visible focus. The count stands inside the bell’s button, so a reader hears Notifications, 3 without the family composing a string.',
      'Below 600 pixels the open search moves focus into the field and the closed search returns it to the magnifier, unless focus already went somewhere else — which is what closed it. A disabled destination is aria-disabled with its href kept: perceivable, focusable, refused on press. The item carries data-disabled and never aria-disabled, which ARIA 1.2 deprecates on listitem.',
    ],
    snippets: [
      defineSnippet({
        id: 'top-navigation-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<header data-ui="top-navigation" data-part="root" data-size="md" data-frame>
  <a data-part="skip" href="#conteudo">
    Skip to content
  </a>
  <div data-part="brand">
    <a data-part="home" href="/">
      <span data-part="mark" aria-hidden="true">
        …
      </span>
      <span data-part="name">Aurora Logistics</span>
    </a>
  </div>
  <nav data-part="nav" aria-label="Navigation">
    <ul data-part="list">
      <li data-part="item" data-value="dashboard" data-priority="high" data-current>
        <a data-part="link" href="/dashboard" aria-current="page" data-current>
          Dashboard
        </a>
      </li>
      <li data-part="item" data-value="faturacao" data-priority="low" data-collapsed>
        …
      </li>
      <li data-part="item">
        <button
          data-part="more"
          aria-label="More, 1"
          aria-expanded="false"
          aria-controls="p"
          data-overflow="1"
        />
      </li>
    </ul>
  </nav>
  <div data-part="panel" id="p">
    <ul data-part="panel-list" />
  </div>
  <div data-part="search">
    …<button data-part="search-close" aria-label="Close search" />
  </div>
  <div data-part="actions">
    <button data-part="search-toggle" aria-label="Search" />
    <a data-part="help" href="/ajuda">
      Help
    </a>
    <button data-part="notifications" aria-label="Notifications">
      <span data-part="count">3</span>
    </button>
    <button data-part="account" aria-label="Account">
      …
    </button>
  </div>
</header>;`,
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
