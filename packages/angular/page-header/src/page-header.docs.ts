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

export const ANGULAR_PAGE_HEADER_TOKENS = pageHeaderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned PageHeader decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlPageHeader, SlPageHeaderTitleArea, SlPageHeaderNav, SlPageHeaderBack, SlPageHeaderBreadcrumbs, SlPageHeaderTitleRow, SlPageHeaderVisual, SlPageHeaderTitle, SlPageHeaderHeading, SlPageHeaderMarks, SlPageHeaderSubheading, SlPageHeaderActions, SlPageHeaderNavigation, SlPageHeaderArea, SlPageHeaderFigure, SlPageHeaderContent, SlPageHeaderDescription, SlPageHeaderControls, SlPageHeaderToggle, SlPageHeaderPin, SlPageHeaderProgress, SlPageHeaderTabs, providePageHeaderDefaults } from '@slotted/angular/page-header';",
  selector:
    '[slPageHeader], [slPageHeaderTitleArea], [slPageHeaderNav], [slPageHeaderBack], [slPageHeaderBreadcrumbs], [slPageHeaderTitleRow], [slPageHeaderVisual], [slPageHeaderTitle], [slPageHeaderHeading], [slPageHeaderMarks], [slPageHeaderSubheading], [slPageHeaderActions], [slPageHeaderNavigation], [slPageHeaderArea], [slPageHeaderFigure], [slPageHeaderContent], [slPageHeaderDescription], [slPageHeaderControls], button[slPageHeaderToggle], button[slPageHeaderPin], [slPageHeaderProgress], [slPageHeaderTabs]',
  exportAs:
    'slPageHeader, slPageHeaderHeading, slPageHeaderArea, slPageHeaderToggle, slPageHeaderPin, slPageHeaderProgress',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the header carrying slPageHeader',
    required: true,
    purpose:
      'The family: sticky with a negative offset the size of the header area, carrying data-ui="page-header", the four axes, data-expanded, data-revealed, data-loading and the measured facts data-scrolled, data-stuck and data-compact. In a frame narrower than 600 pixels — a phone — it carries data-compact, is not sticky and scrolls away with the page. It is its own container, so the rows reflow on its own inline size.',
  },
  {
    part: 'title-area',
    element: 'the element carrying slPageHeaderTitleArea',
    required: true,
    purpose:
      'The strip that never leaves: the nav row, the title row. Sticky at 0 inside the root, opaque, above the header area in the stack. Below 600 pixels it is in the flow with the root.',
  },
  {
    part: 'nav',
    element: 'the element carrying slPageHeaderNav',
    required: false,
    purpose: 'The row above the title: the way back, then the breadcrumbs.',
  },
  {
    part: 'back',
    element: 'the a or button carrying slPageHeaderBack',
    required: false,
    purpose:
      'The way back to where the reader came from — a routerLink, usually. The arrow before it is the family’s, drawn from the glyph scale and mirrored in a right-to-left document. Beside breadcrumbs it yields to them — their first crumb says the same — and below 600 pixels, where the breadcrumbs go, it is what remains of the nav row. Write both once; the width decides. On a coarse pointer it is a full touch target without growing the row.',
  },
  {
    part: 'breadcrumbs',
    element: 'the element carrying slPageHeaderBreadcrumbs',
    required: false,
    purpose:
      'The slot a slBreadcrumb sits in. Hidden below 600 pixels, where the way back already says where the reader came from.',
  },
  {
    part: 'title-row',
    element: 'the element carrying slPageHeaderTitleRow',
    required: true,
    purpose:
      'Visual, title, actions and navigation on one row. What does not fit wraps under the title, in the order it has in the DOM.',
  },
  {
    part: 'visual',
    element: 'the element carrying slPageHeaderVisual',
    required: false,
    purpose:
      'The mark before the heading: an slAvatar, an slIcon, an image. On the title’s first line. No tone input, because identity is not status.',
  },
  {
    part: 'title',
    element: 'the element carrying slPageHeaderTitle',
    required: true,
    purpose:
      'The column of heading, marks and subheading. A wrapping row, so the marks sit on the heading’s own line and the subheading takes the line under it.',
  },
  {
    part: 'heading',
    element:
      'the h1 to h3 carrying slPageHeaderHeading, or any element, which then gets role="heading"',
    required: true,
    purpose:
      'The heading. Expanded it wraps to two lines and then clamps; snapped it is one line with an ellipsis, a step smaller. While loading it renders slSkeletonText in place of its words. A native heading gets nothing added; an input or a div gets the role and the level.',
  },
  {
    part: 'marks',
    element: 'the element carrying slPageHeaderMarks',
    required: false,
    purpose:
      'The status beside the heading — an slTag, an slBadge, an slStatusIndicator — centerd on the heading’s line. It wraps when there are many. Below 600 pixels it takes a line of its own under the heading, so the header is as tall waiting as loaded whatever the marks say.',
  },
  {
    part: 'subheading',
    element: 'the p carrying slPageHeaderSubheading',
    required: false,
    purpose:
      'One line under the heading, in the muted text, part of what stays visible. Snapped, or below 600 pixels, it truncates to one line; otherwise it wraps to two lines and clamps.',
  },
  {
    part: 'actions',
    element: 'the element carrying slPageHeaderActions',
    required: false,
    purpose:
      'The slot an slToolbar sits in, at the end of the title row. Overflow is the toolbar’s: with overflow="menu" what does not fit folds into its menu. Such a toolbar keeps the actions on the title row at every width: it fills what the title leaves, never narrower than its menu’s trigger, and folds what does not fit there, so what folded comes back when the row widens; loose buttons take a row of their own under the title. A toolbar without a frame gives its block inset back to the row, so it stands a control tall, the height the title reserves.',
  },
  {
    part: 'navigation',
    element: 'the element carrying slPageHeaderNavigation',
    required: false,
    purpose:
      'The previous and next record, after the actions at the far end of the row, set apart by a rule. Below 600 pixels the row wraps under the title.',
  },
  {
    part: 'header-area',
    element: 'the element carrying slPageHeaderArea, role="region"',
    required: false,
    purpose:
      'The region that collapses: figure and content. In the flow at rest, under the title area when scrolled past, stuck under it while pinned or revealed, a 0fr row when the control collapsed it — and then inert.',
  },
  {
    part: 'figure',
    element: 'the element carrying slPageHeaderFigure',
    required: false,
    purpose:
      'The picture of the record, a column before the content. Below 600 pixels it takes a row above it.',
  },
  {
    part: 'content',
    element: 'the element carrying slPageHeaderContent',
    required: false,
    purpose:
      'A column of whatever only makes sense at rest: the description, an slDescriptionList of facts, filters, indicators.',
  },
  {
    part: 'description',
    element: 'the p carrying slPageHeaderDescription',
    required: false,
    purpose:
      'A paragraph with a measure, inside the content. While loading it renders two lines of slSkeletonText.',
  },
  {
    part: 'controls',
    element: 'the element carrying slPageHeaderControls',
    required: false,
    purpose:
      'A zero-height row on the chrome’s edge, carrying the rule and the pill that straddles it. Written after the header area, so it sits on the edge in every state without moving in the DOM.',
  },
  {
    part: 'toggle',
    element: 'the button carrying slPageHeaderToggle',
    required: false,
    purpose:
      'The disclosure control: aria-expanded, aria-controls naming the header area, and a name from the messages that says which way it moves. Enter and Space are the platform’s.',
  },
  {
    part: 'pin',
    element: 'the button carrying slPageHeaderPin',
    required: false,
    purpose:
      'A toggle button with aria-pressed, which is the pressed state the vocabulary has. It exists when it is written; there is no input to hide it. The stylesheet hides it where the header is too much of the screen to hold — expanded it would take more than six tenths of the scrollport, or the header is narrower than 600 pixels — and a header held when that becomes true is let go, with the reason programmatic.',
  },
  {
    part: 'tabs',
    element: 'the element carrying slPageHeaderTabs',
    required: false,
    purpose:
      'The slot an slTabs sits in, last in the root. It stays visible under the title once the header area has scrolled past, because the root is what sticks.',
  },
  {
    part: 'progress',
    element:
      'the consumer’s element carrying slPageHeaderProgress, holding one [slProgressBar] at placement="edge-end"',
    required: false,
    purpose:
      'A refresh of what is already on screen. A row one hairline tall and the header’s whole width, wherever it is written among the parts: the bar covers the line the pill straddles when a pill stands over the tabs, and the root’s own hairline otherwise. It draws nothing while loading is true or inside a region that is aria-busy.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One purchase order screen with every input on it, driven by the controls below the canvas. Scroll the page: the header area slides under the title and the tabs stay; scroll back and it returns.',
    snippet: defineSnippet({
      id: 'page-header-angular-playground',
      language: 'angular',
      label: 'A header inside a page',
      source: `<main slPage>
  <header slPageHeader [(expanded)]="expanded" [(pinned)]="pinned">
    <div slPageHeaderTitleArea>…</div>
    <div slPageHeaderArea>…</div>
    <div slPageHeaderControls>
      <button slPageHeaderToggle></button>
      <button slPageHeaderPin></button>
    </div>
  </header>
  <div slPageBody>…</div>
  <footer slPageFooter>…</footer>
</main>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The way back and the breadcrumbs above; the visual, the heading with its mark and subheading, the actions and the record navigation on the title row; the description and the facts in the area that collapses; the pill on the edge; the tabs under it.',
    snippet: defineSnippet({
      id: 'page-header-angular-anatomy',
      language: 'angular',
      label: 'The twenty-one parts',
      source: `<header slPageHeader>
  <div slPageHeaderTitleArea>
    <div slPageHeaderNav>
      <a slPageHeaderBack routerLink="/orders">Purchase orders</a>
      <div slPageHeaderBreadcrumbs><nav slBreadcrumb>…</nav></div>
    </div>
    <div slPageHeaderTitleRow>
      <span slPageHeaderVisual
        ><span slAvatar name="Aurora Logistics" shape="square" size="lg" [src]="logo"></span
      ></span>
      <div slPageHeaderTitle>
        <h1 slPageHeaderHeading>Purchase order PC-2026-004521</h1>
        <span slPageHeaderMarks
          ><span slTag tone="warning"><span slTagBody>Under review</span></span></span
        >
        <p slPageHeaderSubheading>Aurora Logistics Inc.</p>
      </div>
      <div slPageHeaderActions>
        <div slToolbar aria-label="Order actions" overflow="menu">…</div>
      </div>
      <div slPageHeaderNavigation>…</div>
    </div>
  </div>
  <div slPageHeaderArea>
    <div slPageHeaderFigure>…</div>
    <div slPageHeaderContent><p slPageHeaderDescription>…</p></div>
  </div>
  <div slPageHeaderControls>
    <button slPageHeaderToggle></button>
    <button slPageHeaderPin></button>
  </div>
  <div slPageHeaderTabs><div slTabs>…</div></div>
</header>`,
    }),
  },
  {
    id: 'collapse',
    title: 'What a scroll does, and what the control does',
    note: 'Scroll the first screen: the area leaves with the reason scroll and the toggle offers to bring it back in place. Press the toggle at rest: the area folds as a grid track. The last screen is collapse="manual": the whole header stays while the page scrolls. In an slPage with fill nothing scrolls outside the body: a scroller inside it snaps the area shut once it is past 16 pixels down, and opens it again back at its top. A header with no header area stays expanded: collapsed, it would hide nothing and only step the title down.',
    snippet: defineSnippet({
      id: 'page-header-angular-collapse',
      language: 'angular',
      label: 'Reading the reason off the request',
      source: `<header slPageHeader (expandedRequest)="remember($event)">…</header>`,
    }),
  },
  {
    id: 'pin',
    title: 'The pin',
    note: 'Pressed, the whole header stays while the page scrolls and the area counts into the chrome. Let go while stuck and the area stays revealed until the next scroll; collapse by the toggle and the pin lets go first. Narrow the stage below 600 pixels, or shorten the window until the header would take most of it: the pin goes, and a held header is let go.',
    snippet: defineSnippet({
      id: 'page-header-angular-pin',
      language: 'angular',
      label: 'A pin the template binds',
      source: `<header slPageHeader [(pinned)]="pinned" (pinnedRequest)="onPin($event)">…</header>`,
    }),
  },
  {
    id: 'when',
    title: 'A title for the bar, and a title for the header',
    note: 'The long title is written for expanded and the short one for snapped; the stylesheet shows one, so the accessibility tree has one heading at a time. Scroll to watch them swap.',
    snippet: defineSnippet({
      id: 'page-header-angular-when',
      language: 'angular',
      label: 'One attribute where Fiori has seven slots',
      source: `<div slPageHeaderTitle>
  <h1 slPageHeaderHeading data-when="expanded">Third-quarter tax compliance report</h1>
  <h1 slPageHeaderHeading data-when="snapped">Tax compliance · Q3</h1>
  <p slPageHeaderSubheading data-when="expanded">Consolidated across the 14 branches</p>
</div>`,
    }),
  },
  {
    id: 'size',
    title: 'The step the title sits at',
    note: 'sm for a header inside a pane, md for a screen, lg for the landing screen of a module. The snapped title always takes the step below, and level is a separate decision: an h2 may be lg.',
    snippet: defineSnippet({
      id: 'page-header-angular-size',
      language: 'angular',
      label: 'Size and rank, apart',
      source: `<header slPageHeader level="2" size="lg">…</header>`,
    }),
  },
  {
    id: 'navigation',
    title: 'Previous and next record',
    note: 'The two arrows at the far end of the title row move between orders without leaving the screen; the heading, the mark and the subheading follow. Below 600 pixels the pair wraps under the title with the actions.',
    snippet: defineSnippet({
      id: 'page-header-angular-navigation',
      language: 'angular',
      label: 'The arrows are the consumer’s buttons',
      source: `<div slPageHeaderNavigation>
  <button slIconButton aria-label="Previous order" variant="ghost" (click)="previous()">…</button>
  <button slIconButton aria-label="Next order" variant="ghost" (click)="next()">…</button>
</div>`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions that fold',
    note: 'Six actions in an slToolbar with overflow="menu". Drag the stage narrower: what does not fit folds into the toolbar’s menu, in priority order, and the header itself decides nothing about it.',
    snippet: defineSnippet({
      id: 'page-header-angular-actions',
      language: 'angular',
      label: 'The toolbar owns the overflow',
      source: `<div slPageHeaderActions>
  <div slToolbar aria-label="Order actions" overflow="menu">
    <div slToolbarItem [slToolbarItemCounterpart]="reprovar">
      <button slButton variant="outline">Reject</button>
    </div>
    <div slToolbarItem><button slButton tone="accent">Aprovar</button></div>
    <sl-toolbar-overflow />
  </div>
</div>
<ng-template #reprovar><button slMenuItem>Reprovar</button></ng-template>`,
    }),
  },
  {
    id: 'tabs',
    title: 'Tabs under the header',
    note: 'The tabs are the last thing in the root, so once the area has scrolled past they sit under the title with nothing between; the body switches with them. Scroll, then switch tabs: the header does not move.',
    snippet: defineSnippet({
      id: 'page-header-angular-tabs',
      language: 'angular',
      label: 'An slTabs in the slot, the body switching with it',
      source: `<div slPageHeaderTabs>
  <div slTabs [(value)]="tab">
    <div slTabList aria-label="Order sections">
      <div slTab value="itens">Items</div>
      <div slTab value="historico">History</div>
    </div>
  </div>
</div>`,
    }),
  },
  {
    id: 'loading',
    title: 'While the record arrives',
    note: 'Press Load: the heading, the subheading and the description stand as slSkeletonText of their own width, the root says aria-busy, and the actions stay operable. Nothing moves when the words arrive.',
    snippet: defineSnippet({
      id: 'page-header-angular-loading',
      language: 'angular',
      label: 'The placeholder is skeleton’s',
      source: `<header slPageHeader [loading]="order() === undefined">…</header>`,
    }),
  },
  {
    id: 'progress',
    title: 'A refresh of what is on screen',
    note: 'slPageHeaderProgress draws an indeterminate bar over the line where the chrome ends, after 200 ms and for at least 400 ms, wherever it is written among the parts. With a pill over the tabs that line is the one the pill straddles, never the tab strip’s edge; otherwise it is the root’s hairline. The header writes no aria-busy: the region that waits — the page body — is the consumer’s to mark.',
    snippet: defineSnippet({
      id: 'page-header-angular-progress',
      language: 'angular',
      label: 'After the controls, before the tabs',
      source: `<header slPageHeader>
  <div slPageHeaderTitleArea>…</div>
  <div slPageHeaderControls>…</div>
  <div slPageHeaderProgress [loading]="refreshing()"></div>
  <div slPageHeaderTabs>…</div>
</header>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A nine-word title clamps at two lines; five marks wrap; a subheading of fifteen words wraps expanded and truncates snapped; a translated description keeps its measure. Scroll to see the bar hold one line.',
    snippet: defineSnippet({
      id: 'page-header-angular-content',
      language: 'angular',
      label: 'A title the bar cannot hold',
      source: `<h1 slPageHeaderHeading>
  Renewal of the continuing supply contract for tires, tubes and retreading services for the heavy
  fleet of the Southeast region
</h1>`,
    }),
  },
  {
    id: 'narrow',
    title: 'Below 600 pixels',
    note: 'The family answers its own inline size: the header is not sticky and scrolls away with the page, nothing collapses it on scroll and the toggle still folds the area in place; the breadcrumbs go and the way back stays, the title steps down, the subheading takes one line, and the figure takes a row above the content. Actions written as slToolbar overflow="menu", each item with its counterpart, stay on the title row beside a plain title, and take a full row of their own under a rich one (a visual, marks or a subheading); either way they fold what does not fit into the menu, where every action is still reachable; loose actions and the navigation take the row under the title.',
    snippet: defineSnippet({
      id: 'page-header-angular-narrow',
      language: 'angular',
      label: 'Nothing to write: a container query',
      source: `<header slPageHeader>…</header>`,
    }),
  },
  {
    id: 'composition',
    title: 'A page, a table, and the chrome they share',
    note: 'Inside an slPage the rows align to its measure, the sections’ sticky headers and the table’s sticky column header stop under the page chrome — pinned, they stop lower — and the footer stays at the bottom. Scroll the whole screen.',
    snippet: defineSnippet({
      id: 'page-header-angular-composition',
      language: 'angular',
      label: 'The geometry the page publishes',
      source: `<main slPage>
  <header slPageHeader>…</header>
  <div slPageBody>
    <section slSection sticky>
      <div slSectionHeader>…</div>
      <div slSectionBody><div slTable stickyHeader stickyTo="page">…</div></div>
    </section>
  </div>
  <footer slPageFooter>…</footer>
</main>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'providePageHeaderDefaults carries size, level and collapse for every header under it; the heading directive sits on the consumer’s own input while the family keeps the rank; the instance moves the area with the reason programmatic.',
    snippet: defineSnippet({
      id: 'page-header-angular-defaults',
      language: 'ts',
      label: 'Three decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [providePageHeaderDefaults({ collapse: 'manual', size: 'sm' })],
});`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard, the reasons, and what a reader hears',
    note: 'Tab walks the way back, the breadcrumbs, the actions, the navigation, the toggle and the pin, then the filters inside the area. Enter and Space on the toggle report keyboard; a click reports pointer; a scroll reports scroll. Tab into the collapsed area and watch it come back.',
    snippet: defineSnippet({
      id: 'page-header-angular-accessibility',
      language: 'angular',
      label: 'Which device asked',
      source: `<header slPageHeader (expandedRequest)="reasons.unshift($event.reason)">…</header>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'expandedRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the header area moves. The request carries the new value, the value it replaces, the reason — pointer, keyboard, scroll or programmatic — the originating event, and cancel(), which refuses the move before anything commits. A cancelled scroll leaves the area where the scroll left it.',
  },
  {
    name: 'expandedChange',
    payload: 'boolean',
    when: 'After the area moved, from the model. Bind [(expanded)] to follow it, or [expanded] and (expandedRequest) to own it.',
  },
  {
    name: 'pinnedRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the pin moves, with the reason pointer, keyboard or programmatic. Pinning a collapsed header also asks the area to open, with the reason programmatic; collapsing by the toggle while pinned asks the pin to let go first.',
  },
  {
    name: 'pinnedChange',
    payload: 'boolean',
    when: 'After the pin moved, from the model.',
  },
  {
    name: '(click), (focus), (keydown) on the toggle and the pin',
    payload: 'the element’s own events',
    when: 'Whenever the button fires them. The consumer’s handler runs as well, and preventDefault() in (click) refuses the move.',
  },
];

export const ANGULAR_PAGE_HEADER_DOCS = {
  pageHeader: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'expanded',
        'model<boolean>',
        'true',
        'slPageHeader',
        'Whether the header area is open. Two-way, so [(expanded)] follows it; true at rest, pinned or revealed, false while scrolled past or collapsed by the control',
      ],
      [
        'pinned',
        'model<boolean>',
        'false',
        'slPageHeader',
        'Whether the pin holds the area open. Two-way. Pinned, the whole header stays while the page scrolls',
      ],
      [
        'variant',
        "'band' | 'plain' | 'floating'",
        'band',
        'slPageHeader, providePageHeaderDefaults',
        'band is a strip of the surface with a hairline under it, the page’s own header; plain paints no ground at rest and takes the surface back once content passes under the chrome (data-stuck), for a header inside a region with a ground of its own; floating is a box with the hairline all round and rounded corners that, once stuck, slides to an inset below the scroller’s edge and lifts by a shadow, for a header that stands inside padding. The ground changes over --slotted-page-header-ground-duration (the medium duration) with --slotted-page-header-ground-easing (the standard easing); a duration of 0s makes the change instant',
      ],
      [
        'material',
        'boolean',
        'false',
        'slPageHeader, providePageHeaderDefaults',
        'Once content passes under the chrome (data-stuck), its ground is the theme’s --slotted-surface-material and its backdrop filter --slotted-material-backdrop, in every variant; at rest each variant keeps its ground. --slotted-page-header-background and --slotted-page-header-backdrop-filter still win. The theme makes both opaque under prefers-reduced-transparency and forced colors',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slPageHeader, providePageHeaderDefaults',
        'The step the title sits at, on the type scale. The snapped title takes the step below',
      ],
      [
        'level',
        "'1' | '2' | '3'",
        '1',
        'slPageHeader, providePageHeaderDefaults',
        'The rank of the heading. A native heading element written by the consumer is left alone; any other element carrying slPageHeaderHeading gets role="heading" and this level',
      ],
      [
        'collapse',
        "'scroll' | 'manual'",
        'scroll',
        'slPageHeader, providePageHeaderDefaults',
        'scroll collapses the area when it leaves the scrollport and re-opens it when it returns; manual leaves it to the toggle, the pin and the application, and the whole header stays while the page scrolls',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slPageHeader',
        'The heading, the subheading and the description render slSkeletonText in place of their words; the actions stay operable; the root carries aria-busy',
      ],
      [
        'messages',
        'Partial<PageHeaderMessages>',
        '—',
        'slPageHeader',
        'Words laid over the language in force, key by key — expand, collapse, pin, unpin, headerArea and progress: the names the two controls, the region and the refresh bar carry. An aria-label written on the control itself still wins',
      ],
      [
        'slPageHeaderProgress',
        'loading, value, min, max, buffer, valueText, label, tone, size, delay, minDuration; (withdraw)',
        'loading true, delay 200, minDuration 400, size sm',
        'slPageHeaderProgress',
        'A refresh of the data already on screen. Each input reaches the bar, (withdraw) reports the moment it goes, and provideProgressIndicatorDefaults() wins over the header’s timing',
      ],
      [
        'data-when',
        "'expanded' | 'snapped'",
        '—',
        'any part of the title area',
        'Shows the part in one state only. A snapped heading is the heading written twice, once with each value; the stylesheet shows one',
      ],
    ]),
    composition: apiRows([
      [
        'slPageHeaderHeading on any element',
        'directive',
        '—',
        'the consumer’s own element',
        'A native heading gets nothing added; an input, a link or a div gets role="heading" and the level, so an editable title keeps its rank',
      ],
      [
        'exportAs slPageHeader',
        'SlPageHeader',
        '—',
        'a template reference',
        'expand(), collapseArea(), pin() and unpin(), each carrying programmatic; expanded, pinned, scrolled and revealed as signals',
      ],
      [
        'providePageHeaderDefaults()',
        '{ size, level, collapse }',
        '—',
        'an injector',
        'The three decisions an application takes once. A header that states any of them itself still wins',
      ],
      [
        'slPage around it',
        'SlPage',
        '—',
        'the page',
        'The measure the header aligns its rows to, injected. Outside a page the rows take the content width',
      ],
      [
        'native attributes',
        'on every part',
        '—',
        'every part',
        'Every directive sits on the consumer’s own element, so id, class, routerLink and every listener stay where they were written',
      ],
    ]),
    accessibility: [
      'The practice is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/), the toggle answers the Disclosure pattern and the pin the Button pattern’s toggle form. The root is a header element inside the page’s main, which is a plain header and not a banner: the banner is the application shell’s.',
      'The whole keyboard is the platform’s. The toggle and the pin are the consumer’s own buttons, so Enter and Space move them without the family binding a key; Tab walks the title area in document order and then the header area while it is visible. The title area is deliberately not a button, because it holds links and buttons of its own and a button may not contain a control.',
      'The toggle carries aria-expanded and aria-controls naming the header area; the header area is a region named by the headerArea message; the pin carries aria-pressed. Their names say which way they move, and an aria-label written on the element wins over them — read with HostAttributeToken before anything is written.',
      'Collapsed by the control, the area is inert and aria-hidden, because a 0fr row leaves its controls in the DOM and out of sight. Scrolled past, it is neither: a control inside it that receives focus is scrolled back into view by the browser, and the header re-opens with the reason scroll.',
      'The heading is the consumer’s element: h1 to h3 written by hand keep their native semantics, and anything else carrying the directive gets role="heading" and aria-level from the level input, so an editable title stays a heading. A snapped heading written with data-when is display: none in the other state, so the heading list never shows the title twice.',
      'The reason on every request is what lets a product tell the reader’s own move from the scroll’s: pointer and keyboard are the reader, programmatic is the application, and scroll is the page. The React binding emits the same request on onExpandedChange and onPinnedChange.',
    ],
    snippets: [
      defineSnippet({
        id: 'page-header-angular-dom',
        language: 'angular',
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
        <a data-part="back" href="/orders">Purchase orders</a>
        <div data-part="breadcrumbs">…</div>
      </div>
      <div data-part="title-row">
        <div data-part="visual">…</div>
        <div data-part="title">
          <h1 data-part="heading" id="h">Purchase order PC-2026-004521</h1>
          <div data-part="marks">…</div>
          <p data-part="subheading">Aurora Logistics Inc.</p>
        </div>
        <div data-part="actions">…</div>
        <div data-part="navigation">…</div>
      </div>
    </div>
    <div data-part="header-area" role="region" id="a" aria-label="Page header">
      <div data-part="content"><p data-part="description">…</p></div>
    </div>
    <div data-part="controls">
      <div>
        <button
          data-part="toggle"
          aria-expanded="true"
          aria-controls="a"
          aria-label="Collapse header"
        ></button>
        <button data-part="pin" aria-pressed="false" aria-label="Pin header"></button>
      </div>
    </div>
    <div data-part="tabs">…</div>
  </div>
</header>`,
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
