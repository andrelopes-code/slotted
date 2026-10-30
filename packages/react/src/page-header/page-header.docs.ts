import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import pageHeaderTokens from '@slotted/styles/page-header/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_PAGE_HEADER_TOKENS = pageHeaderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned PageHeader decision',
}));

const imports: ReferenceImport = {
  source:
    "import { PageHeader, PageHeaderTitleArea, PageHeaderNav, PageHeaderBack, PageHeaderBreadcrumbs, PageHeaderTitleRow, PageHeaderVisual, PageHeaderTitle, PageHeaderHeading, PageHeaderMarks, PageHeaderSubheading, PageHeaderActions, PageHeaderNavigation, PageHeaderArea, PageHeaderFigure, PageHeaderContent, PageHeaderDescription, PageHeaderControls, PageHeaderToggle, PageHeaderPin, PageHeaderProgress, PageHeaderTabs, PageHeaderDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'header, or the element render returns',
    required: true,
    purpose:
      'The family: sticky with a negative offset the size of the header area, carrying data-ui="page-header", the four axes, data-expanded, data-revealed, data-loading and the measured facts data-scrolled, data-stuck and data-compact. In a frame narrower than 600 pixels — a phone — it carries data-compact, is not sticky and scrolls away with the page. It is its own container, so the rows reflow on its own inline size.',
  },
  {
    part: 'title-area',
    element: 'div',
    required: true,
    purpose:
      'The strip that never leaves: the nav row, the title row. Sticky at 0 inside the root, opaque, above the header area in the stack. Below 600 pixels it is in the flow with the root.',
  },
  {
    part: 'nav',
    element: 'div',
    required: false,
    purpose: 'The row above the title: the way back, then the breadcrumbs.',
  },
  {
    part: 'back',
    element: 'a, or the element render returns',
    required: false,
    purpose:
      'The way back to where the reader came from. The arrow before it is the family’s, drawn from the glyph scale and mirrored in a right-to-left document. Beside breadcrumbs it yields to them — their first crumb says the same — and below 600 pixels, where the breadcrumbs go, it is what remains of the nav row. Write both once; the width decides. On a coarse pointer it is a full touch target without growing the row.',
  },
  {
    part: 'breadcrumbs',
    element: 'div',
    required: false,
    purpose:
      'The slot a Breadcrumb sits in. Hidden below 600 pixels, where the way back already says where the reader came from.',
  },
  {
    part: 'title-row',
    element: 'div',
    required: true,
    purpose:
      'Visual, title, actions and navigation on one row. What does not fit wraps under the title, in the order it has in the DOM.',
  },
  {
    part: 'visual',
    element: 'div',
    required: false,
    purpose:
      'The mark before the heading: an Avatar, an Icon, an image. On the title’s first line, as Primer’s LeadingVisual. No tone axis, because identity is not status.',
  },
  {
    part: 'title',
    element: 'div',
    required: true,
    purpose:
      'The column of heading, marks and subheading. A wrapping row, so the marks sit on the heading’s own line and the subheading takes the line under it.',
  },
  {
    part: 'heading',
    element: 'h1 to h3, from level, or the element render returns',
    required: true,
    purpose:
      'The heading. Expanded it wraps to two lines and then clamps, with the full text in title; snapped it is one line with an ellipsis, a step smaller. While loading it renders Skeleton’s text shape.',
  },
  {
    part: 'marks',
    element: 'div',
    required: false,
    purpose:
      'The status beside the heading — a Tag, a Badge, a StatusIndicator — centerd on the heading’s line. It wraps when there are many. Below 600 pixels it takes a line of its own under the heading, so the header is as tall waiting as loaded whatever the marks say.',
  },
  {
    part: 'subheading',
    element: 'p',
    required: false,
    purpose:
      'One line under the heading, in the muted text, part of what stays visible. Snapped, or below 600 pixels, it truncates to one line; otherwise it wraps to two lines and clamps.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The slot a Toolbar sits in, at the end of the title row. Overflow is the toolbar’s: with overflow="menu" what does not fit folds into its menu. Such a toolbar keeps the actions on the title row at every width: it fills what the title leaves, never narrower than its menu’s trigger, and folds what does not fit there, so what folded comes back when the row widens; loose buttons take a row of their own under the title. A toolbar without a frame gives its block inset back to the row, so it stands a control tall, the height the title reserves.',
  },
  {
    part: 'navigation',
    element: 'div',
    required: false,
    purpose:
      'The previous and next record, after the actions at the far end of the row, set apart by a rule. Below 600 pixels the row wraps under the title.',
  },
  {
    part: 'header-area',
    element: 'div, role="region"',
    required: false,
    purpose:
      'The region that collapses: figure and content. In the flow at rest, under the title area when scrolled past, stuck under it while pinned or revealed, a 0fr row when the control collapsed it — and then inert.',
  },
  {
    part: 'figure',
    element: 'div',
    required: false,
    purpose:
      'The picture of the record, a column before the content. Below 600 pixels it takes a row above it.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'A column of whatever only makes sense at rest: the description, a DescriptionList of facts, filters, indicators.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose:
      'A paragraph with a measure, inside the content. While loading it renders two lines of Skeleton.',
  },
  {
    part: 'controls',
    element: 'div',
    required: false,
    purpose:
      'A zero-height row on the chrome’s edge, carrying the rule and the pill that straddles it. Written after the header area, so it sits on the edge in every state without moving in the DOM.',
  },
  {
    part: 'toggle',
    element: 'button',
    required: false,
    purpose:
      'The disclosure control: aria-expanded, aria-controls naming the header area, and a name from messages that says which way it moves. Enter and Space are the platform’s.',
  },
  {
    part: 'pin',
    element: 'button',
    required: false,
    purpose:
      'A toggle button with aria-pressed, which is the pressed state the vocabulary has. It exists when it is rendered; there is no prop to hide it. The stylesheet hides it where the header is too much of the screen to hold — expanded it would take more than six tenths of the scrollport, or the header is narrower than 600 pixels — and a header held when that becomes true is let go, with the reason programmatic.',
  },
  {
    part: 'tabs',
    element: 'div',
    required: false,
    purpose:
      'The slot a Tabs sits in, last in the root. It stays visible under the title once the header area has scrolled past, because the root is what sticks.',
  },
  {
    part: 'progress',
    element: 'div, holding one ProgressBar at placement="edge-end"',
    required: false,
    purpose:
      'A refresh of what is already on screen. A row one hairline tall and the header’s whole width, written after the controls and before the tabs: there the bar covers the line the pill straddles, and with no tabs the root’s own hairline. It draws nothing while loading is true or inside a region that is aria-busy.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One purchase order screen with every axis on it, driven by the controls below the canvas. Scroll the page: the header area slides under the title and the tabs stay; scroll back and it returns.',
    snippet: defineSnippet({
      id: 'page-header-react-playground',
      language: 'tsx',
      label: 'A header inside a page',
      source: `<Page footer={<PageFooter>…</PageFooter>}>
  <PageHeader>
    <PageHeaderTitleArea>…</PageHeaderTitleArea>
    <PageHeaderArea>…</PageHeaderArea>
    <PageHeaderControls>
      <PageHeaderToggle />
      <PageHeaderPin />
    </PageHeaderControls>
  </PageHeader>
  <PageBody>…</PageBody>
</Page>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The way back and the breadcrumbs above; the visual, the heading with its mark and subheading, the actions and the record navigation on the title row; the description and the facts in the area that collapses; the pill on the edge; the tabs under it.',
    snippet: defineSnippet({
      id: 'page-header-react-anatomy',
      language: 'tsx',
      label: 'The twenty-one parts',
      source: `<PageHeader>
  <PageHeaderTitleArea>
    <PageHeaderNav>
      <PageHeaderBack href="/orders">Purchase orders</PageHeaderBack>
      <PageHeaderBreadcrumbs>
        <Breadcrumb>…</Breadcrumb>
      </PageHeaderBreadcrumbs>
    </PageHeaderNav>
    <PageHeaderTitleRow>
      <PageHeaderVisual>
        <Avatar name="Aurora Logistics" shape="square" size="lg" src={logo} />
      </PageHeaderVisual>
      <PageHeaderTitle>
        <PageHeaderHeading>Purchase order PO-2026-004521</PageHeaderHeading>
        <PageHeaderMarks>
          <Tag tone="warning">Under review</Tag>
        </PageHeaderMarks>
        <PageHeaderSubheading>Aurora Logistics LLC</PageHeaderSubheading>
      </PageHeaderTitle>
      <PageHeaderActions>
        <Toolbar aria-label="Order actions" overflow="menu">
          …
        </Toolbar>
      </PageHeaderActions>
      <PageHeaderNavigation>…</PageHeaderNavigation>
    </PageHeaderTitleRow>
  </PageHeaderTitleArea>
  <PageHeaderArea>
    <PageHeaderFigure>…</PageHeaderFigure>
    <PageHeaderContent>
      <PageHeaderDescription>…</PageHeaderDescription>
    </PageHeaderContent>
  </PageHeaderArea>
  <PageHeaderControls>
    <PageHeaderToggle />
    <PageHeaderPin />
  </PageHeaderControls>
  <PageHeaderTabs>
    <Tabs>…</Tabs>
  </PageHeaderTabs>
</PageHeader>;`,
    }),
  },
  {
    id: 'collapse',
    title: 'What a scroll does, and what the control does',
    note: 'Scroll the left screen: the area leaves with the reason scroll and the toggle offers to bring it back in place. Press the toggle at rest: the area folds as a grid track. The right screen is collapse="manual": the whole header stays while the page scrolls. In a Page with fill nothing scrolls outside the body: a scroller inside it snaps the area shut once it is past 16 pixels down, and opens it again back at its top. A header with no header area stays expanded: collapsed, it would hide nothing and only step the title down.',
    snippet: defineSnippet({
      id: 'page-header-react-collapse',
      language: 'tsx',
      label: 'Reading the reason off the request',
      source: `<PageHeader
  onExpandedChange={(expanded, request) => {
    if (request.reason !== 'scroll') save(expanded);
  }}
>
  …
</PageHeader>;`,
    }),
  },
  {
    id: 'pin',
    title: 'The pin',
    note: 'Pressed, the whole header stays while the page scrolls and the area counts into the chrome. Let go while stuck and the area stays revealed until the next scroll; collapse by the toggle and the pin lets go first. Narrow the stage below 600 pixels, or shorten the window until the header would take most of it: the pin goes, and a held header is let go.',
    snippet: defineSnippet({
      id: 'page-header-react-pin',
      language: 'tsx',
      label: 'A pin the application remembers',
      source: `<PageHeader
  pinned={pinned}
  onPinnedChange={(next, request) => {
    setPinned(next);
    if (request.reason !== 'programmatic') remember(next);
  }}
>
  …
</PageHeader>;`,
    }),
  },
  {
    id: 'when',
    title: 'A title for the bar, and a title for the header',
    note: 'The long title is written for expanded and the short one for snapped; the stylesheet shows one, so the accessibility tree has one heading at a time. Scroll to watch them swap.',
    snippet: defineSnippet({
      id: 'page-header-react-when',
      language: 'tsx',
      label: 'One attribute where Fiori has seven slots',
      source: `<PageHeaderTitle>
  <PageHeaderHeading data-when="expanded">Third-quarter tax compliance report</PageHeaderHeading>
  <PageHeaderHeading data-when="snapped">Tax compliance · Q3</PageHeaderHeading>
  <PageHeaderSubheading data-when="expanded">
    Consolidated across the 14 branches
  </PageHeaderSubheading>
</PageHeaderTitle>;`,
    }),
  },
  {
    id: 'size',
    title: 'The step the title sits at',
    note: 'sm for a header inside a pane, md for a screen, lg for the landing screen of a module. The snapped title always takes the step below, and level is a separate decision: an h2 may be lg.',
    snippet: defineSnippet({
      id: 'page-header-react-size',
      language: 'tsx',
      label: 'Size and rank, apart',
      source: `<PageHeader level="2" size="lg">
  …
</PageHeader>;`,
    }),
  },
  {
    id: 'navigation',
    title: 'Previous and next record',
    note: 'The two arrows at the far end of the title row move between orders without leaving the screen; the heading, the breadcrumb page and the facts follow. Below 600 pixels the pair wraps under the title with the actions.',
    snippet: defineSnippet({
      id: 'page-header-react-navigation',
      language: 'tsx',
      label: 'The arrows are the consumer’s buttons',
      source: `<PageHeaderNavigation>
  <IconButton aria-label="Previous order" onClick={previous} variant="ghost">
    <ChevronLeft />
  </IconButton>
  <IconButton aria-label="Next order" onClick={next} variant="ghost">
    <ChevronRight />
  </IconButton>
</PageHeaderNavigation>;`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions that fold',
    note: 'Six actions in a Toolbar with overflow="menu". Drag the stage narrower: what does not fit folds into the toolbar’s menu, in priority order, and the header itself decides nothing about it.',
    snippet: defineSnippet({
      id: 'page-header-react-actions',
      language: 'tsx',
      label: 'The toolbar owns the overflow',
      source: `<PageHeaderActions>
  <Toolbar aria-label="Order actions" overflow="menu">
    <ToolbarItem counterpart={<MenuItem>Reject</MenuItem>}>
      <Button variant="ghost">Reject</Button>
    </ToolbarItem>
    <ToolbarItem>
      <Button tone="accent">Aprovar</Button>
    </ToolbarItem>
    <ToolbarOverflow />
  </Toolbar>
</PageHeaderActions>;`,
    }),
  },
  {
    id: 'tabs',
    title: 'Tabs under the header',
    note: 'The tabs are the last thing in the root, so once the area has scrolled past they sit under the title with nothing between; the panels switch the content below. Scroll, then switch tabs: the header does not move.',
    snippet: defineSnippet({
      id: 'page-header-react-tabs',
      language: 'tsx',
      label: 'A Tabs in the slot, its panels in the body',
      source: `<PageHeaderTabs>
  <Tabs value={tab} onValueChange={setTab}>
    <TabList aria-label="Order sections">
      <Tab value="items">Items</Tab>
      <Tab value="history">History</Tab>
    </TabList>
  </Tabs>
</PageHeaderTabs>;`,
    }),
  },
  {
    id: 'loading',
    title: 'While the record arrives',
    note: 'Press Load: the heading, the subheading and the description stand as Skeleton text of their own width, the root says aria-busy, and the actions stay operable. Nothing moves when the words arrive.',
    snippet: defineSnippet({
      id: 'page-header-react-loading',
      language: 'tsx',
      label: 'The placeholder is skeleton’s',
      source: `<PageHeader loading={order === undefined}>…</PageHeader>;`,
    }),
  },
  {
    id: 'progress',
    title: 'A refresh of what is on screen',
    note: 'PageHeaderProgress draws an indeterminate bar over the line where the chrome ends, after 200 ms and for at least 400 ms, wherever it is written among the parts. With a pill over the tabs that line is the one the pill straddles, never the tab strip’s edge; otherwise it is the root’s hairline. The header writes no aria-busy: the region that waits — the page body — is the consumer’s to mark.',
    snippet: defineSnippet({
      id: 'page-header-react-progress',
      language: 'tsx',
      label: 'After the controls, before the tabs',
      source: `<PageHeader>
  <PageHeaderTitleArea>…</PageHeaderTitleArea>
  <PageHeaderControls>…</PageHeaderControls>
  <PageHeaderProgress loading={isRefetching} />
  <PageHeaderTabs>…</PageHeaderTabs>
</PageHeader>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A nine-word title clamps at two lines with the whole string in title; five marks wrap; a subheading of fifteen words wraps expanded and truncates snapped; a translated description keeps its measure. Scroll to see the bar hold one line.',
    snippet: defineSnippet({
      id: 'page-header-react-content',
      language: 'tsx',
      label: 'A title the bar cannot hold',
      source: `<PageHeaderHeading>
  Renewal of the ongoing supply contract for tires, tubes, and retreading services for the heavy
  fleet of the Southeast region
</PageHeaderHeading>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'Below 600 pixels',
    note: 'The family answers its own inline size: the header is not sticky and scrolls away with the page, nothing collapses it on scroll and the toggle still folds the area in place; the breadcrumbs go and the way back stays, the title steps down, the subheading takes one line, and the figure takes a row above the content. Actions written as Toolbar overflow="menu", each item with its counterpart, stay on the title row beside a plain title, and take a full row of their own under a rich one (a visual, marks or a subheading); either way they fold what does not fit into the menu, where every action is still reachable; loose actions and the navigation take the row under the title.',
    snippet: defineSnippet({
      id: 'page-header-react-narrow',
      language: 'tsx',
      label: 'Nothing to write: a container query',
      source: `<PageHeader>…</PageHeader>;`,
    }),
  },
  {
    id: 'composition',
    title: 'A page, a table, and the chrome they share',
    note: 'Inside a Page the rows align to its measure, the sections’ sticky headers and the table’s sticky column header stop under the page chrome — pinned, they stop lower — and the footer stays at the bottom. Scroll the whole screen.',
    snippet: defineSnippet({
      id: 'page-header-react-composition',
      language: 'tsx',
      label: 'The geometry the page publishes',
      source: `<Page footer={<PageFooter>…</PageFooter>}>
  <PageHeader>…</PageHeader>
  <PageBody>
    <Section sticky>
      <SectionHeader>…</SectionHeader>
      <SectionBody>
        <Table stickyHeader stickyTo="page">
          …
        </Table>
      </SectionBody>
    </Section>
  </PageBody>
</Page>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries size, level and collapse for every header under it; render substitutes the heading with the consumer’s own control; the handle moves the area with the reason programmatic.',
    snippet: defineSnippet({
      id: 'page-header-react-defaults',
      language: 'tsx',
      label: 'Three decisions, taken once',
      source: `<PageHeaderDefaultsProvider collapse="manual" size="sm">
  <PageHeader>…</PageHeader>
</PageHeaderDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard, the reasons, and what a reader hears',
    note: 'Tab walks the way back, the breadcrumbs, the actions, the navigation, the toggle and the pin, then the filters inside the area. Enter and Space on the toggle report keyboard; a click reports pointer; a scroll reports scroll. Tab into the collapsed area and watch it come back.',
    snippet: defineSnippet({
      id: 'page-header-react-accessibility',
      language: 'tsx',
      label: 'Which device asked',
      source: `<PageHeader onExpandedChange={(_next, request) => log(request.reason)}>…</PageHeader>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onExpandedChange',
    payload: '(expanded: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the header area moves. The request carries the new value, the value it replaces, the reason — pointer, keyboard, scroll or programmatic — the originating event, and cancel(), which refuses the move before anything commits. A cancelled scroll leaves the area where the scroll left it: the family writes no scroll position.',
  },
  {
    name: 'onPinnedChange',
    payload: '(pinned: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the pin moves, with the reason pointer, keyboard or programmatic. Pinning a collapsed header also asks the area to open, with the reason programmatic; collapsing by the toggle while pinned asks the pin to let go first.',
  },
  {
    name: 'onClick, onFocus, onKeyDown, on the toggle and the pin',
    payload: 'the element’s own events',
    when: 'Whenever the button fires them. The consumer’s handler runs first, and preventDefault() in onClick refuses the move.',
  },
];

export const REACT_PAGE_HEADER_DOCS = {
  pageHeader: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'expanded',
        'boolean',
        'true',
        'PageHeader',
        'Present means the consumer owns the header area’s state, for the life of the component. True while the area is at rest, pinned or revealed; false while it is scrolled past or collapsed by the control',
      ],
      [
        'defaultExpanded',
        'boolean',
        '—',
        'PageHeader',
        'The value an uncontrolled header area starts from, read once',
      ],
      [
        'pinned',
        'boolean',
        'false',
        'PageHeader',
        'Present means the consumer owns the pin’s state. Pinned, the whole header stays while the page scrolls',
      ],
      [
        'defaultPinned',
        'boolean',
        '—',
        'PageHeader',
        'The value an uncontrolled pin starts from, read once',
      ],
      [
        'variant',
        "'band' | 'plain' | 'floating'",
        'band',
        'PageHeader, PageHeaderDefaultsProvider',
        'band is a strip of the surface with a hairline under it, the page’s own header; plain paints no ground at rest and takes the surface back once content passes under the chrome (data-stuck), for a header inside a region with a ground of its own; floating is a box with the hairline all round and rounded corners that, once stuck, slides to an inset below the scroller’s edge and lifts by a shadow, for a header that stands inside padding. The ground changes over --slotted-page-header-ground-duration (the medium duration) with --slotted-page-header-ground-easing (the standard easing); a duration of 0s makes the change instant',
      ],
      [
        'material',
        'boolean',
        'false',
        'PageHeader, PageHeaderDefaultsProvider',
        'Once content passes under the chrome (data-stuck), its ground is the theme’s --slotted-surface-material and its backdrop filter --slotted-material-backdrop, in every variant; at rest each variant keeps its ground. --slotted-page-header-background and --slotted-page-header-backdrop-filter still win. The theme makes both opaque under prefers-reduced-transparency and forced colors',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'PageHeader, PageHeaderDefaultsProvider',
        'The step the title sits at, on the type scale. The snapped title takes the step below',
      ],
      [
        'level',
        "'1' | '2' | '3'",
        '1',
        'PageHeader, PageHeaderDefaultsProvider',
        'The rank of the heading, which decides its element. A page’s own header is 1',
      ],
      [
        'collapse',
        "'scroll' | 'manual'",
        'scroll',
        'PageHeader, PageHeaderDefaultsProvider',
        'scroll collapses the area when it leaves the scrollport and re-opens it when it returns; manual leaves it to the toggle, the pin and the application, and the whole header stays while the page scrolls',
      ],
      [
        'loading',
        'boolean',
        'false',
        'PageHeader',
        'The heading, the subheading and the description render Skeleton’s text shape in place of their words; the actions stay operable; the root carries aria-busy',
      ],
      [
        'messages',
        'Partial<PageHeaderMessages>',
        '—',
        'PageHeader',
        'Words laid over the language in force, key by key — expand, collapse, pin, unpin, headerArea and progress: the names the two controls, the region and the refresh bar carry. An aria-label written on the control itself still wins',
      ],
      [
        'PageHeaderProgress',
        'ProgressBar props but placement',
        'loading true, delay 200, minDuration 400, size sm',
        'PageHeaderProgress',
        'A refresh of the data already on screen. Every ProgressBar prop but placement passes through — value for a save that reports its fraction, tone, label — and a value set through ProgressIndicatorDefaultsProvider wins over the header’s timing',
      ],
      [
        'data-when',
        "'expanded' | 'snapped'",
        '—',
        'any part of the title area',
        'Shows the part in one state only. A snapped heading is the heading written twice, once with each value; the stylesheet shows one',
      ],
      [
        'title',
        'string',
        'the text, when it is a string',
        'PageHeaderHeading',
        'The full text, for a clamped title. Written by the family when the children are a string, and by the consumer otherwise',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the element and hands it every attribute: the heading becomes an editable field, the way back a router’s link, the area an article. The rank, the identifiers and the ARIA stay the family’s',
      ],
      [
        'ref',
        'Ref<PageHeaderHandle> on PageHeader; Ref<HTMLElement> on every part',
        '—',
        'PageHeader, every part',
        'On the root it is the handle — element, expand(), collapse(), pin(), unpin(), each carrying programmatic — and on a part it is the element itself',
      ],
      [
        'usePageHeader()',
        '() => PageHeaderContextValue',
        '—',
        'inside PageHeader',
        'What the parts read: expanded, pinned, scrolled, revealed, loading, the identifiers, the translator t, and setExpanded and setPinned with a reason. It throws outside a header',
      ],
      [
        'PageHeaderDefaultsProvider',
        '{ size, level, collapse }',
        '—',
        'a subtree',
        'The three decisions an application takes once. A header that states any of them itself still wins',
      ],
      [
        'usePage()',
        '() => PageContextValue | undefined',
        '—',
        'inside Page',
        'The measure the header aligns its rows to. Outside a page the rows take the content width',
      ],
    ]),
    accessibility: [
      'The practice is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/), the toggle answers the Disclosure pattern and the pin the Button pattern’s toggle form. The root is a header element inside the page’s main, which is a plain header and not a banner: the banner is the application shell’s, and a second one would be a second site header.',
      'The whole keyboard is the platform’s. The toggle and the pin are buttons, so Enter and Space move them without the family binding a key; Tab walks the title area in document order and then the header area while it is visible. The title area is deliberately not a button, because it holds links and buttons of its own and a button may not contain a control — which is where sap.f’s click-to-toggle title departs from the ARIA rules.',
      'The toggle carries aria-expanded and aria-controls naming the header area; the header area is a region named by the headerArea message; the pin carries aria-pressed. Their names say which way they move — Collapse header, Expand header, Pin header, Unpin header — and an aria-label written on the control wins over them.',
      'Collapsed by the control, the area is inert and aria-hidden, because a 0fr row leaves its controls in the DOM and out of sight. Scrolled past, it is neither: a control inside it that receives focus is scrolled back into view by the browser, and the header re-opens with the reason scroll, which is the right thing for the reader who pressed Tab.',
      'A snapped heading written with data-when is display: none in the other state, so the accessibility tree holds one heading at a time and a screen reader’s heading list never shows the title twice.',
      'The reason on every request is what lets a product tell the reader’s own move from the scroll’s: pointer and keyboard are the reader, programmatic is the application, and scroll is the page. The Angular binding emits the same request on expandedRequest and pinnedRequest.',
    ],
    snippets: [
      defineSnippet({
        id: 'page-header-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<header
  data-ui="page-header"
  data-part="root"
  data-size="md"
  data-level="1"
  data-collapse="scroll"
  data-expanded
  style="--slotted-page-header-collapse: 132px"
>
  <div data-ui="container" data-part="root" data-size="wide" data-inset="6">
    <div data-part="title-area">
      <div data-part="nav">
        <a data-part="back" href="/orders">
          Purchase orders
        </a>
        <div data-part="breadcrumbs">…</div>
      </div>
      <div data-part="title-row">
        <div data-part="visual">…</div>
        <div data-part="title">
          <h1 data-part="heading" id="h">
            Purchase order PC-2026-004521
          </h1>
          <div data-part="marks">…</div>
          <p data-part="subheading">Aurora Logistics LLC</p>
        </div>
        <div data-part="actions">…</div>
        <div data-part="navigation">…</div>
      </div>
    </div>
    <div data-part="header-area" role="region" id="a" aria-label="Page header">
      <div data-part="content">
        <p data-part="description">…</p>
      </div>
    </div>
    <div data-part="controls">
      <div>
        <button
          data-part="toggle"
          aria-expanded="true"
          aria-controls="a"
          aria-label="Collapse header"
        />
        <button data-part="pin" aria-pressed="false" aria-label="Pin header" />
      </div>
    </div>
    <div data-part="tabs">…</div>
  </div>
</header>;`,
      }),
      defineSnippet({
        id: 'page-header-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='page-header'] {
  --slotted-page-header-heading-size-md: var(--slotted-font-size-3xl);
  --slotted-page-header-padding-block: var(--slotted-space-6);
  --slotted-page-header-description-measure: 60ch;
}`,
      }),
    ],
  },
} as const;
