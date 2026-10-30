import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import appShellTokens from '@slotted/styles/app-shell/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_APP_SHELL_TOKENS = appShellTokens.map((name) => ({
  name,
  purpose: 'Theme-owned App Shell decision',
}));

const imports: ReferenceImport = {
  source: `import {
  SlAppShell,
  SlAppShellActions,
  SlAppShellAside,
  SlAppShellAsideBody,
  SlAppShellAsideFooter,
  SlAppShellAsideHeader,
  SlAppShellAsideResizer,
  SlAppShellAsideToggle,
  SlAppShellBanner,
  SlAppShellBrand,
  SlAppShellCenter,
  SlAppShellFooter,
  SlAppShellMain,
  SlAppShellNav,
  SlAppShellNavBody,
  SlAppShellNavFooter,
  SlAppShellNavHeader,
  SlAppShellNavRail,
  SlAppShellNavToggle,
  SlAppShellProgress,
  provideAppShellDefaults,
} from '@slotted/angular/app-shell';`,
  selector:
    '[slAppShell] on the frame; header[slAppShellBanner], nav[slAppShellNav], main[slAppShellMain], aside[slAppShellAside], footer[slAppShellFooter] on the regions; [slAppShellBrand], [slAppShellCenter], [slAppShellActions], [slAppShellNavRail], [slAppShellNavHeader], [slAppShellNavBody], [slAppShellNavFooter], [slAppShellAsideHeader], [slAppShellAsideBody], [slAppShellAsideFooter] on their parts; button[slAppShellNavToggle] and button[slAppShellAsideToggle] on the controls; [slAppShellProgress] on any element inside the frame, for the wait',
  exportAs:
    'slAppShell, slAppShellBanner, slAppShellBrand, slAppShellCenter, slAppShellActions, slAppShellNav, slAppShellNavRail, slAppShellNavHeader, slAppShellNavBody, slAppShellNavFooter, slAppShellMain, slAppShellAside, slAppShellAsideHeader, slAppShellAsideBody, slAppShellAsideFooter, slAppShellFooter, slAppShellNavToggle, slAppShellAsideToggle, slAppShellProgress',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame: a grid of four rows and three columns, and the query container the whole family answers. Deliberately not a sectioning element — a main inside an article stops being a landmark, and the root has to be placeable anywhere without changing what the five regions mean. Carries data-ui="app-shell", every axis as a data-* attribute, and data-open for the navigation region.',
  },
  {
    part: 'skip',
    element: 'div holding one a per region',
    required: false,
    purpose:
      'The links that jump past the chrome, written from the regions that rendered and are open: a link to a region nobody rendered, or to a pane the reader closed, is a dead destination. First focusable thing in the document, out of the flow until it is focused. Not a landmark.',
  },
  {
    part: 'banner',
    element: 'header',
    required: false,
    purpose:
      'The banner landmark, earned from the element rather than from a role. Three clusters: what starts the line, what grows, what ends it.',
  },
  {
    part: 'brand',
    element: 'div',
    required: false,
    purpose:
      'The start cluster: the toggle, the mark, the name of the application or of the workspace. Shortened to one line by default, so a name never pushes the frame wider than the space there is.',
  },
  {
    part: 'center',
    element: 'div',
    required: false,
    purpose:
      'The middle of the bar, and the one cluster that grows: a search field, a breadcrumb trail, the route title, tabs. Without it a bar is two clusters and a void — which is what the first version of this page photographed.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The end cluster: notifications, help, account. A control in it keeps its width; what runs out of room is the middle.',
  },
  {
    part: 'nav-toggle',
    element: 'button',
    required: false,
    purpose:
      'The disclosure control for the navigation region: aria-expanded, aria-controls and the family’s own label, all taken from the shell’s context rather than from where it stands. Draws the panel-open or panel-close Glyph element by state, mirrored by navSide and by direction.',
  },
  {
    part: 'nav',
    element: 'nav',
    required: false,
    purpose:
      'The navigation landmark, and one element across all three modes: the rail is this nav at another inline size, which keeps the focus and the scroll position where the reader left them. Its inline axis clips and its block axis scrolls, so a single column taller than the region keeps its foot reachable. A footer that must stay visible goes in nav-footer, between nav-header and a nav-body that scrolls. A query container of its own, named slotted-app-shell-nav, so the rows inside answer the rail without the shell telling them anything.',
  },
  {
    part: 'nav-rail',
    element: 'div, or any element the directive is placed on',
    required: false,
    purpose:
      'A strip of marks before the column: the first level of a two-level navigation, inside the one navigation landmark and under its one open state. With it the region is two columns; closed to rail it keeps the strip and lets the column go. Recognized by :has(), so no attribute is written and a server render has the grid on its first paint.',
  },
  {
    part: 'nav-header',
    element: 'div',
    required: false,
    purpose:
      'The pinned top of the column: the workspace switcher, the mark. Under primary="nav" it takes the banner’s height, so the workspace and the bar sit on one line.',
  },
  {
    part: 'nav-body',
    element: 'div',
    required: false,
    purpose:
      'The middle, and the only part of the column that scrolls. Ant and Mantine let the list overflow the region, which takes the account control off the screen the moment an application has more destinations than height.',
  },
  {
    part: 'nav-footer',
    element: 'div',
    required: false,
    purpose: 'The pinned bottom: the account, the collapse control.',
  },
  {
    part: 'scrim',
    element: 'div',
    required: false,
    purpose:
      'The veil under an overlaid region, mounted only while a layer is modal. It stops where the layer stops — under the banner — so the reader keeps their bearings.',
  },
  {
    part: 'main',
    element: 'main',
    required: true,
    purpose:
      'The main landmark and the skip link’s destination. The skip link and focusMain() write tabindex="-1" for the focus they move, and blur or the next pointer press inside removes it: a main focusable all the time takes the focus of every click on its text, and the next key draws the ring around the page.',
  },
  {
    part: 'progress',
    element: 'the consumer’s element, holding one [slProgressBar] at placement="edge-start"',
    required: false,
    purpose:
      'The wait for the next page. A transparent frame the stylesheet lays over main in every arrangement — its grid area, its margins, its corners — so the bar covers the line between the chrome and the content and the card’s corners clip it. Placed anywhere inside the frame; main is aria-busy while the bar is painted.',
  },
  {
    part: 'aside',
    element: 'aside',
    required: false,
    purpose:
      'The complementary landmark, carrying the family’s own label. It opens and closes the way the navigation does — a column beside the content or a layer over it, by asideMode — and carries its own data-open, because the root’s is the navigation’s. Closed, it leaves the layout: a pane has no rail.',
  },
  {
    part: 'aside-resizer',
    element: 'any element carrying slAppShellAsideResizer',
    required: false,
    purpose:
      'The pane’s inner edge, from the WAI-ARIA Window Splitter pattern: focusable, role="separator", aria-controls the pane, its three values the extent as whole percentages of the shell. Placed inside the aside; rendering it is the capability. Drawn on the column alone — under asideMode="overlay" or a closed pane it is hidden, and a row under the content hides it.',
  },
  {
    part: 'line',
    element: 'span inside the aside-resizer, aria-hidden',
    required: false,
    purpose:
      'One of the splitter family’s two hairlines on the pane’s edge, drawn from the splitter tokens: fading away from the grip at rest, running the strip under the hand, the drag and the keyboard.',
  },
  {
    part: 'grip',
    element: 'span inside the aside-resizer, aria-hidden',
    required: false,
    purpose: 'The dot matrix between the two lines, two columns by three rows, in the line’s step.',
  },
  {
    part: 'aside-header',
    element: 'div',
    required: false,
    purpose:
      'The pinned top of the pane: its title, which takes the room, and the control that closes it.',
  },
  {
    part: 'aside-body',
    element: 'div',
    required: false,
    purpose:
      'The middle, and the only part of the pane that scrolls. It stands on the inset the head and the foot stand on, so its content lines up with the title; inset="none" drops it for content that brings its own — a page, a detail panel, a list to the edges.',
  },
  {
    part: 'aside-footer',
    element: 'div',
    required: false,
    purpose:
      'The pinned bottom: the actions that close the task the pane holds, aligned to the end.',
  },
  {
    part: 'aside-toggle',
    element: 'button',
    required: false,
    purpose:
      'The disclosure control for the pane, with the navigation control’s wiring: in the pane’s own header, in the banner’s actions, or anywhere else, and there is still exactly one control carrying the pane’s state. The same pair of marks, turned the other way.',
  },
  {
    part: 'footer',
    element: 'footer',
    required: false,
    purpose:
      'The contentinfo landmark: the application’s footer, not the page’s action bar — that one is footer[slPageFooter], inside main.',
  },
  {
    part: 'layer',
    element: 'div with display: contents',
    required: true,
    purpose:
      'The application’s portal root, named once through setPortalContainer so every slDialog, slDrawer, slMenu and toast under this shell lands here instead of on the body.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Aurora Logistics, a freight operator’s back office, whole: the search a coordinator reaches for first, the destinations with their counts, the order table with the consignment that has no price yet, and the detail pane with its own head, body and foot. Every axis is on the controls below — change navSide and the pane moves to the other side with it; close the pane and the content takes the room.',
    snippet: defineSnippet({
      id: 'app-shell-angular-playground',
      language: 'angular',
      label: 'The frame of a route',
      source: `<div slAppShell>
  <header slAppShellBanner>…</header>
  <nav slAppShellNav>…</nav>
  <main slAppShellMain>…</main>
  <aside slAppShellAside>…</aside>
  <footer slAppShellFooter>…</footer>
</div>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'The frame with nothing in it',
    note: 'Every part the contract declares, drawn as its own name. Everything else on this page is a product standing in these boxes; this is the family on its own — four rows, three columns, one gutter, the card the content stands on, three clusters in the bar, and a pane with a head, a body and a foot.',
    snippet: defineSnippet({
      id: 'app-shell-angular-anatomy',
      language: 'angular',
      label: 'Every part, once',
      source: `<div slAppShell>
  <header slAppShellBanner>
    <div slAppShellBrand>
      <button slAppShellNavToggle></button>
    </div>
    <div slAppShellCenter>…</div>
    <div slAppShellActions>…</div>
  </header>
  <nav slAppShellNav>
    <div slAppShellNavHeader>…</div>
    <div slAppShellNavBody>…</div>
    <div slAppShellNavFooter>…</div>
  </nav>
  <main slAppShellMain>…</main>
  <aside slAppShellAside>
    <div slAppShellAsideHeader>
      …
      <button slAppShellAsideToggle></button>
    </div>
    <div slAppShellAsideBody>…</div>
    <div slAppShellAsideFooter>…</div>
  </aside>
  <footer slAppShellFooter>…</footer>
</div>`,
    }),
  },
  {
    id: 'regions',
    title: 'Five regions, five landmarks',
    note: 'Each region is the HTML element that already means what it is, so none of them writes a role: header is banner, nav is navigation, main is main, aside is complementary, footer is contentinfo. The root is a div precisely so that stays true — a main inside an article is not a landmark. Cadence has no pane and no footer, and the landmark list is then exactly three.',
    snippet: defineSnippet({
      id: 'app-shell-angular-regions',
      language: 'angular',
      label: 'The elements the landmarks come from',
      source: `<div slAppShell canvas="flush" primary="nav">
  <nav slAppShellNav>…</nav>
  <header slAppShellBanner>…</header>
  <main slAppShellMain>…</main>
</div>`,
    }),
  },
  {
    id: 'banner',
    title: 'Three clusters, and the one that grows',
    note: 'brand starts the line, center takes whatever room is left, actions ends it. Aurora puts a search field with its shortcut in the middle; Cadence puts the route’s trail there and the route’s actions at the end; Atrium puts a title. What each holds is the product’s — slTextField, slBreadcrumb, slAvatar — and where it goes is the shell’s. Narrow the frame: the middle gives way first, and a control in actions keeps its width rather than breaking its label one letter per line.',
    snippet: defineSnippet({
      id: 'app-shell-angular-banner',
      language: 'angular',
      label: 'What starts the line, what grows, what ends it',
      source: `<header slAppShellBanner>
  <div slAppShellBrand>
    <button slAppShellNavToggle></button>
    <span>Aurora</span>
  </div>
  <div slAppShellCenter>
    <div slTextField size="sm" variant="subtle">
      <span slTextFieldStart><ng-icon name="lucideSearch" /></span>
      <input slTextFieldInput type="search" placeholder="Search…" />
    </div>
  </div>
  <div slAppShellActions>
    <button slIconButton aria-label="Notifications">…</button>
    <span slAvatar><span slAvatarFallback>AB</span></span>
  </div>
</header>`,
    }),
  },
  {
    id: 'canvas',
    title: 'The plane every region sits on',
    note: 'One input decides the plane of every region at once, and each of its four values is drawn and tested in every primary and both separations. inset lifts the content and the pane onto cards over a sunken frame; flush runs every region edge to edge and draws its seams; floating lifts the column onto a card of its own as well; panel holds the column, the content and the pane in one card with the bar on the frame above it. The same product on all four.',
    snippet: defineSnippet({
      id: 'app-shell-angular-canvas',
      language: 'angular',
      label: 'Four planes, one frame',
      source: `<div slAppShell canvas="inset">…</div>
<div slAppShell canvas="flush">…</div>
<div slAppShell canvas="floating">…</div>
<div slAppShell canvas="panel">…</div>`,
    }),
  },
  {
    id: 'separation',
    title: 'A rule, or a tone',
    note: 'Where two regions touch without a gutter — every seam of flush, the seams inside the panel card, the bar over the content under primary="main" — separation decides what is drawn. rule is a line. tone is no line: the chrome regions take a ground 0.036 OKLab L from the surface, and the subtle tones inside them are recomputed from that ground so a hover still answers. Under forced colors a tone separates nothing, and the rule is drawn whatever the input says.',
    snippet: defineSnippet({
      id: 'app-shell-angular-separation',
      language: 'angular',
      label: 'The two ways a seam is drawn',
      source: `<div slAppShell canvas="flush" separation="rule">…</div>
<div slAppShell canvas="flush" separation="tone">…</div>
<div slAppShell canvas="panel" primary="main" separation="tone">…</div>`,
    }),
  },
  {
    id: 'theming',
    title: 'Every region repaintable, one at a time',
    note: 'Cadence paints its column dark on a light frame with two declarations: data-slotted-scheme on the region, and one custom property for the ground. Written on the region rather than on the frame, the property resolves in the region’s scope, so the destinations, the counts and the focus ring are calibrated against the ground they are actually on. Switch the page to dark: the column stays the column, and the frame joins it.',
    snippet: defineSnippet({
      id: 'app-shell-angular-theming',
      language: 'angular',
      label: 'A dark column, in two declarations',
      source: `<div slAppShell canvas="flush" primary="nav">
  <nav slAppShellNav class="cadence-nav" data-slotted-scheme="dark">…</nav>
</div>

<!-- .cadence-nav { --slotted-app-shell-nav-surface: var(--slotted-surface-sunken); } -->`,
    }),
  },
  {
    id: 'navModes',
    title: 'Inline, overlaid, and the width that decides',
    note: 'inline makes the region a column; overlay takes it out of the grid and over the content with a veil, a focus scope and inert on everything behind it; auto answers the shell’s own inline size at 600 pixels — not the window’s, which is why the narrow frame here behaves like a phone inside a wide page. Press the toggle in the overlaid frame: Escape and a press outside both close it.',
    snippet: defineSnippet({
      id: 'app-shell-angular-nav-modes',
      language: 'angular',
      label: 'The three modes',
      source: `<div slAppShell navMode="inline">…</div>
<div slAppShell navMode="overlay">…</div>
<div slAppShell navMode="auto">…</div>`,
    }),
  },
  {
    id: 'rail',
    title: 'What a closed region leaves behind',
    note: 'rail keeps a strip one mark column wide with a row’s inset on each side: every destination stays reachable by its mark, the region stays in the tab order, and the column’s own query container is what tells the rows to drop their labels. hidden takes the region out of the layout and the tab order entirely. Under primary="nav" the control stands in the column’s own foot, over the column it moves, and survives the rail.',
    snippet: defineSnippet({
      id: 'app-shell-angular-rail',
      language: 'angular',
      label: 'The two answers to a closed region',
      source: `<div slAppShell collapsedTo="rail" [navOpen]="false">…</div>
<div slAppShell collapsedTo="hidden" [navOpen]="false">…</div>`,
    }),
  },
  {
    id: 'navRail',
    title: 'Two levels, one region',
    note: 'slAppShellNavRail puts a strip of marks before the column: the modules in the strip, the destinations of the chosen module in the column. It is one nav landmark and one open state, where the field ships two sidebars with a state each. Closed to rail, the strip stays and the column goes — cut while the width moves, then out of the tab order. The control that moves the region stands at the foot of the strip, the part that survives. The module is the product’s state, held here in a signal.',
    snippet: defineSnippet({
      id: 'app-shell-angular-nav-rail',
      language: 'angular',
      label: 'A strip of modules and the column of one',
      source: `<div slAppShell primary="main">
  <header slAppShellBanner>…</header>
  <nav slAppShellNav>
    <div slAppShellNavRail aria-label="Modules">
      @for (module of modules; track module.id) {
        <button
          slIconButton
          type="button"
          tone="secondary"
          [variant]="module.id === moduleId() ? 'solid' : 'ghost'"
          [attr.aria-current]="module.id === moduleId() ? 'true' : null"
          [attr.aria-label]="module.label"
          (click)="moduleId.set(module.id)"
        >
          <ng-icon [name]="module.icon" />
        </button>
      }
      <button slAppShellNavToggle></button>
    </div>
    <div slAppShellNavHeader>{{ module().label }}</div>
    <div slAppShellNavBody>
      <div slSideNavigation [value]="module().current">…</div>
    </div>
  </nav>
  <main slAppShellMain>…</main>
</div>`,
    }),
  },
  {
    id: 'aside',
    title: 'The pane opens on a selection, and closes from its own head',
    note: 'The pane holds the second open state, under the same shape as the navigation’s: a two-way asideOpen model and asideOpenChangeRequest with a reason. Select a row and the product opens the pane; press the control in the pane’s head, or Escape when it is a layer, and it closes — the content takes the room, because a closed pane leaves no rail. The skip link to the pane exists only while it is open. Drag the pane’s inner edge, or focus it and press the arrows, Home and End: the two-way asideExtent is a fraction of the shell between minAsideExtent and maxAsideExtent, and asideExtentChangeRequest says which hand moved it.',
    snippet: defineSnippet({
      id: 'app-shell-angular-aside',
      language: 'angular',
      label: 'A pane the product opens and the reader closes',
      source: `<div
  slAppShell
  [asideOpen]="selected() !== undefined"
  (asideOpenChangeRequest)="$event.value ? null : selected.set(undefined)"
>
  <main slAppShellMain>
    <div slTable selectionMode="single" [value]="selectedKeys()" (valueChange)="select($event)">
      …
    </div>
  </main>
  <aside slAppShellAside>
    <div slAppShellAsideResizer></div>
    <div slAppShellAsideHeader>
      <span>{{ selected() }}</span>
      <button slAppShellAsideToggle></button>
    </div>
    <div slAppShellAsideBody>…</div>
    <div slAppShellAsideFooter>…</div>
  </aside>
</div>`,
    }),
  },
  {
    id: 'overlay',
    title: 'The layer, and what it does to the rest',
    note: 'Atrium overlays its navigation at every width. While the layer is modal, the rest of the shell is inert — the banner and its toggle included, exactly as a dialog’s trigger is — and the ways out are Escape, the veil, a destination, and whatever control the product put in the panel. The pane is a layer of its own under the same policies: escape="none" keeps it open on Escape, outsidePress="none" keeps it open on a press outside, modal={false} draws no veil and inerts nothing.',
    snippet: defineSnippet({
      id: 'app-shell-angular-overlay',
      language: 'angular',
      label: 'The policies a layer answers',
      source: `<div slAppShell navMode="overlay" escape="close" outsidePress="close" modal>…</div>
<div slAppShell asideMode="overlay" escape="none" outsidePress="none" [modal]="false">…</div>`,
    }),
  },
  {
    id: 'primary',
    title: 'Which region reaches the corner',
    note: 'banner spans the full width and the navigation starts below it, which is Aurora. nav spans the full height and the banner starts beside it, which is Cadence: the workspace and the bar sit on one line, and the control that moves the column stands in the column’s own head. main spans the column the full height as well and puts the bar in the plane of the content, inside the card that holds the page. The grid changes where a region is drawn and never where it is written, so the focus order is the same under all three.',
    snippet: defineSnippet({
      id: 'app-shell-angular-primary',
      language: 'angular',
      label: 'Three arrangements, one focus order',
      source: `<div slAppShell primary="banner">…</div>
<div slAppShell primary="nav">…</div>
<div slAppShell primary="main">…</div>`,
    }),
  },
  {
    id: 'sides',
    title: 'Sides, sizes and the mirror',
    note: 'Atrium puts the navigation at the end of the line and the pane at the start; the controls turn their marks with them. Switch the direction to right-to-left and the whole frame mirrors, because every distance is logical. navSize and asideSize are steps on the family’s own scale — a theme retunes a step, and nothing retunes a pixel string.',
    snippet: defineSnippet({
      id: 'app-shell-angular-sides',
      language: 'angular',
      label: 'The region at the other end of the line',
      source: `<div slAppShell navSide="end" navSize="sm" asideSize="sm">…</div>`,
    }),
  },
  {
    id: 'scroll',
    title: 'Who scrolls',
    note: 'content, the default, makes the shell the height it was given — capped at 100dvh, which is the space a mobile browser actually has — and lets only the content column and the pane’s body scroll, so the banner, the column and the pane’s head and foot stay put. document lets the shell grow and the whole document scroll, and the banner travels with it; a page-header inside then owns the sticky offset on its own.',
    snippet: defineSnippet({
      id: 'app-shell-angular-scroll',
      language: 'angular',
      label: 'The height the shell takes',
      source: `<div slAppShell scroll="content">…</div>
<div slAppShell scroll="document">…</div>`,
    }),
  },
  {
    id: 'progress',
    title: 'The wait for the next page',
    note: 'slAppShellProgress draws an indeterminate bar on the line between the chrome and the content — wherever the canvas draws that line — after 200 ms, holds it for at least 400 ms, and marks main aria-busy for exactly as long as it is painted. A page header inside a busy content region draws no bar of its own. Pass loading from the router; nothing in the family knows one.',
    snippet: defineSnippet({
      id: 'app-shell-angular-progress',
      language: 'angular',
      label: 'Driven by the Angular Router',
      source: `<div slAppShell>
  <header slAppShellBanner>…</header>
  <main slAppShellMain>…</main>
  <div slAppShellProgress [loading]="navigating()"></div>
</div>

<!-- navigating = toSignal(router.events.pipe(filter(isStartOrEnd), map((e) => e instanceof NavigationStart))) -->`,
    }),
  },
  {
    id: 'skipLinks',
    title: 'The first thing a keyboard meets',
    note: 'Press Tab from the top of the frame: a link to the content appears, then one to the navigation, then one to the pane — one per region that rendered and is open, out of the flow until focused. The link makes the content region focusable for that one focus, so it moves the focus as well as the scroll.',
    snippet: defineSnippet({
      id: 'app-shell-angular-skip',
      language: 'angular',
      label: 'Written from the regions that exist',
      source: `<div slAppShell [messages]="{ skipToMain: 'Skip to the order' }">
  <main slAppShellMain>…</main>
</div>`,
    }),
  },
  {
    id: 'persistence',
    title: 'Telling the reader’s choice from the layout’s',
    note: 'Every request carries a reason. pointer and keyboard are the reader’s own choice; resize is the layout closing the region because the shell became narrow; select is a destination; escape and outsidePress are the layer. A product that persists the reader’s preference writes one line on the request — if the reason is not resize, persist — and keeps the wide preference through every narrow window the reader ever opens. Narrow the frame and read the log.',
    snippet: defineSnippet({
      id: 'app-shell-angular-persistence',
      language: 'angular',
      label: 'Persisting the press and ignoring the resize',
      source: `<div
  slAppShell
  [(navOpen)]="open"
  (navOpenChangeRequest)="$event.reason === 'resize' || persist($event.value)"
>
  …
</div>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'provideAppShellDefaults carries every axis and the strings for every shell under the injector, and a shell that states any of them itself still wins. exportAs reaches the instance from the template: openNav, closeNav, openAside, closeAside and focusMain are the actions an input cannot express. The element the directive sits on was always the consumer’s, so there is nothing to substitute.',
    snippet: defineSnippet({
      id: 'app-shell-angular-defaults',
      language: 'ts',
      label: 'Fourteen decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [provideAppShellDefaults({ canvas: 'flush', navSize: 'lg', primary: 'nav' })],
});

// In a template: <div slAppShell #shell="slAppShell">…</div>
// and a button that calls shell.closeAside().`,
    }),
  },
  {
    id: 'composition',
    title: 'The families that live inside it',
    note: 'The shell owns where a region is drawn and nothing about what is in it. slPage with landmark="none" and scroll="ancestor" lives in the content region, so its header sticks at the top of the column the shell scrolls; an sl-drawer opened from the page lands in the shell’s own layer, over the content and under nothing; slDialog, slMenu and toasts do the same. Long translated labels truncate in the column rather than pushing the frame wider.',
    snippet: defineSnippet({
      id: 'app-shell-angular-composition',
      language: 'angular',
      label: 'A page inside the content region',
      source: `<main slAppShellMain>
  <main slPage landmark="none" scroll="ancestor" width="full">
    <header slPageHeader>…</header>
    <div slPageBody>…</div>
  </main>
</main>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The landmarks and the keyboard',
    note: 'Walk the landmark list of this frame: banner, navigation, main, complementary, contentinfo, one of each and none of them written as a role. Then Tab through it: skip link, banner, toggle, navigation, content, pane, the pane’s control, footer — the DOM order, and it does not move when primary does. Enter and Space work both controls, which is the whole of the Disclosure pattern’s keyboard; the control takes its wiring from the shell, so it stands wherever the product wants it.',
    snippet: defineSnippet({
      id: 'app-shell-angular-accessibility',
      language: 'angular',
      label: 'The name the region carries',
      source: `<nav slAppShellNav aria-label="Main navigation">…</nav>
<aside slAppShellAside aria-label="Order details">…</aside>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'navOpenChangeRequest',
    payload: 'AppShellOpenRequest',
    when: 'Before the navigation region moves, and never for a value equal to the current one. The request carries value, previous, reason, the originating event as source, and cancel() — call it and nothing commits. (navOpenChange) fires afterwards with the committed boolean, as every model does.',
  },
  {
    name: 'asideOpenChangeRequest',
    payload: 'AppShellOpenRequest',
    when: 'Before the secondary pane moves, with the same shape. The reasons a pane can carry are pointer, keyboard, escape, outsidePress, resize and programmatic — no select, because a pane has no destinations. (asideOpenChange) fires afterwards.',
  },
  {
    name: 'asideExtentChangeRequest',
    payload: 'AppShellAsideExtentRequest',
    when: 'Before the pane’s extent moves, already held inside minAsideExtent and maxAsideExtent, with the reason pointer for a drag on the aside-resizer, keyboard for an arrow, Home or End, and programmatic otherwise. undefined is the pane back on its asideSize step. (asideExtentChange) fires afterwards.',
  },
];

export const ANGULAR_APP_SHELL_DOCS = {
  appShell: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'navOpen',
        'model<boolean>',
        'true',
        'slAppShell',
        'Whether the navigation region is showing its full panel. A model signal, so [navOpen] alone reports, (navOpenChange) alone listens, and [(navOpen)] is the two-way binding the ecosystem expects. React ships navOpen and defaultNavOpen as two props; this binding has one, and the asymmetry is the ecosystem’s rather than the family’s',
      ],
      [
        'asideOpen',
        'model<boolean>',
        'true',
        'slAppShell',
        'Whether the secondary pane is showing, under the same rule. A product that opens the pane on a selection binds the selection to this',
      ],
      [
        'asideExtent',
        'model<number | undefined>',
        '—',
        'slAppShell',
        'The measure of the pane as a column, as a fraction of the shell’s inline size. Unset, asideSize decides. The pane writes it as --slotted-app-shell-aside-extent in cqi, which the stylesheet reads in the column alone: a layer keeps its step',
      ],
      [
        'minAsideExtent',
        'number',
        '0.16',
        'slAppShell',
        'The smallest fraction of the shell the reader may give the pane, and Home’s target. aria-valuemin is this times a hundred',
      ],
      [
        'maxAsideExtent',
        'number',
        '0.6',
        'slAppShell',
        'The largest fraction, and End’s target. aria-valuemax is this times a hundred',
      ],
      [
        'inset',
        "'none' | undefined",
        '—',
        'slAppShellAsideBody',
        'none drops the body’s own padding, for content that brings its own inset. Written as data-inset',
      ],
      [
        'primary',
        "'banner' | 'nav' | 'main'",
        'banner',
        'slAppShell, provideAppShellDefaults',
        'Which region reaches the corner. Under nav the navigation spans every row and its head takes the banner’s height so the two marks sit on one line; under main it does too, and the banner stands inside the card that holds the content',
      ],
      [
        'canvas',
        "'inset' | 'flush' | 'floating' | 'panel'",
        'inset',
        'slAppShell, provideAppShellDefaults',
        'The plane of every region at once. inset: content and pane as cards over a sunken frame. flush: every region edge to edge, seams drawn. floating: the column a card as well. panel: column, content and pane in one card, the bar and the footer on the frame',
      ],
      [
        'navMode',
        "'inline' | 'overlay' | 'auto'",
        'auto',
        'slAppShell, provideAppShellDefaults',
        'How the region occupies space. auto is inline at or above 600 pixels of the shell’s own inline size and overlay below it, answered in CSS for the layout and in script for the keyboard',
      ],
      [
        'asideMode',
        "'inline' | 'overlay' | 'auto'",
        'auto',
        'slAppShell, provideAppShellDefaults',
        'How the pane occupies space: the navigation’s pair, resolved on the same width. inline is a column beside the content, or a row under it when there is no room; overlay is a layer from the end the navigation is not on',
      ],
      [
        'navSide',
        "'start' | 'end'",
        'start',
        'slAppShell, provideAppShellDefaults',
        'Which end of the line the region sits at. Logical, so a right-to-left document mirrors the whole frame; the pane sits at the other end, and both controls turn their marks',
      ],
      [
        'navSize',
        "'sm' | 'md' | 'lg'",
        'md',
        'slAppShell, provideAppShellDefaults',
        'The width of the open region, as a step on the family’s own scale. A theme retunes the step; nothing retunes a pixel string',
      ],
      [
        'asideSize',
        "'sm' | 'md' | 'lg'",
        'md',
        'slAppShell, provideAppShellDefaults',
        'The width of the secondary pane, on the same kind of scale',
      ],
      [
        'collapsedTo',
        "'rail' | 'hidden'",
        'rail',
        'slAppShell, provideAppShellDefaults',
        'What a closed inline navigation leaves behind. rail keeps a strip the width of a target and keeps the tab order; hidden takes the region out of both. A closed pane always leaves nothing: it has no marks to keep',
      ],
      [
        'scroll',
        "'content' | 'document'",
        'content',
        'slAppShell, provideAppShellDefaults',
        'content makes the shell the height it was given, capped at 100dvh, and only the content column and the pane’s body scroll; document lets the shell grow and the banner travel with it',
      ],
      [
        'separation',
        "'rule' | 'tone'",
        'rule',
        'slAppShell, provideAppShellDefaults',
        'What draws a seam where two regions touch without a gutter. rule is a line; tone is a ground of its own on the chrome regions, with the subtle tones inside them recomputed from it. Where a gutter separates, it draws nothing either way',
      ],
      [
        'modal',
        'boolean',
        'true',
        'slAppShell, provideAppShellDefaults',
        'Whether an overlaid region contains focus and makes every other region inert. Only the overlaid modes read it, and it applies to whichever layer is open',
      ],
      [
        'escape',
        "'close' | 'none'",
        'close',
        'slAppShell, provideAppShellDefaults',
        'Whether Escape closes an overlaid region. Registered in the capture phase by @slotted/core/dismissable-layer, so a handler inside the panel runs after the layer has already asked',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'slAppShell, provideAppShellDefaults',
        'Whether a press outside an overlaid panel closes it',
      ],
      [
        'back',
        "'close' | 'none'",
        'close',
        'slAppShell, provideAppShellDefaults',
        "The platform's way back — a phone's gesture, a browser's button — closes the layer instead of leaving the page, while it is modal: @slotted/core/dismissable-layer holds one close watcher per modal layer where the browser has CloseWatcher, and one history entry elsewhere, and answers the way back with the reason back",
      ],
      [
        'closeOnNavigate',
        'boolean',
        'true',
        'slAppShell, provideAppShellDefaults',
        'Whether a click on an a[href] inside the overlaid navigation closes it, with the reason select — a router’s preventDefault included, an aria-disabled link excluded. Without it a phone costs two taps per destination',
      ],
      [
        'messages',
        'Partial<AppShellMessages>',
        '—',
        'slAppShell',
        'Words laid over the language in force, key by key — aside, close, closeAside, nav, open, openAside, progress, resizeAside, skipToAside, skipToMain, skipToNav: the two regions’ accessible names, the two controls’ labels in each state, the wait’s name, the pane edge’s name, and the three skip links. An aria-label written on the element itself still wins',
      ],
      [
        'loading',
        'boolean',
        'true',
        'slAppShellProgress',
        'Whether the next page is on its way. The bar appears once it has lasted delay (200 ms), stays at least minDuration (400 ms), and main carries aria-busy for exactly that long; an aria-busy written on main wins. value, min, max, buffer, valueText, label, tone, size (sm by default), delay and minDuration reach the bar, (withdraw) reports the moment it goes, and provideProgressIndicatorDefaults() wins over the shell’s timing',
      ],
    ]),
    composition: apiRows([
      [
        'content projection',
        'anything',
        '—',
        'every region',
        'The family owns where a region is drawn, its landmark, its width and its state, and nothing about what is in it. The bar’s three clusters, the column’s three ends, the content, the pane’s three parts and the footer each take whatever an application puts there — its own search, its own account, another family, its own markup',
      ],
      [
        'published geometry',
        '--slotted-app-shell-row-*',
        '—',
        'anything inside a region',
        'Six numbers the shell publishes for the rows a product brings: row-inset, row-mark, row-gap, row-height, row-font-size and row-line-height. Every row on this page reads them and states nothing of its own, which is what keeps a destination’s mark under the control in the bar',
      ],
      [
        'custom properties',
        '--slotted-app-shell-*',
        '—',
        'the frame or any region',
        'A ground and an ink per region, plus every measure the frame stands on. Each region reads the public name and falls back to the plane’s default, so a property written on the region resolves in the region’s own scope. The full list is under Theme-owned decisions below',
      ],
      [
        'data-part selectors',
        '[data-ui="app-shell"] [data-part="…"]',
        '—',
        'every part',
        'Anything the properties do not reach is one selector away. [data-ui="app-shell"][data-open] is the navigation; [data-part="aside"][data-open] is the pane',
      ],
      [
        'the element is the consumer’s',
        'a directive, not a wrapper',
        '—',
        'every part',
        'slAppShellBanner goes on the consumer’s own header, slAppShellMain on their main, and so on. There is no render prop because there is nothing to substitute: the element was already theirs',
      ],
      [
        'exportAs',
        "'slAppShell' and one per part",
        '—',
        'a template',
        'Reaches the instance: #shell="slAppShell" then shell.navOpen(), shell.asideOpen(), shell.openNav(), shell.closeNav(), shell.openAside(), shell.closeAside(), shell.focusMain(), shell.resolvedMode() and shell.resolvedAsideMode()',
      ],
      [
        'provideAppShellDefaults()',
        '{ …fourteen axes }',
        '—',
        'an injector',
        'What an application decides once for every route, through APP_SHELL_DEFAULTS. A shell that states any of them itself still wins',
      ],
      [
        'ng-content',
        'projected, in the consumer’s own order',
        '—',
        'slAppShell',
        'The regions are projected rather than slotted by name, so their DOM order is the consumer’s — which is what keeps the focus order theirs too. The skip links, the veil and the portal root are the component’s own',
      ],
      [
        'button[slAppShellNavToggle] and button[slAppShellAsideToggle] anywhere',
        'take their wiring from the shell',
        '—',
        'inside slAppShell',
        'id, aria-expanded, aria-controls, the label and the handler come from the shell, so each control can stand in the banner, in its region’s own head or foot, or anywhere else — and there is still exactly one control carrying each state. Where it goes is written on this page under Rail',
      ],
      [
        'HostAttributeToken',
        'a written attribute survives',
        '—',
        'slAppShellNav, slAppShellMain, slAppShellAside, slAppShellNavToggle, slAppShellAsideToggle',
        'An aria-label, an id or an aria-controls the consumer wrote is read before the family writes its own, so a host binding never erases what the template said',
      ],
      [
        'setPortalContainer',
        'the layer part, named once',
        '—',
        'every overlay under the shell',
        'slDialog, slDrawer, slMenu, slPopover, slTooltip and toasts land in the shell’s own layer instead of on the body, which is what keeps an application’s overlays inside the application’s stacking context',
      ],
      [
        'zoneless and OnPush',
        'signals throughout',
        '—',
        'slAppShell',
        'Every resolved axis is a computed, the width gate and the two layers are effects torn down by DestroyRef, and there is no markForCheck anywhere',
      ],
    ]),
    accessibility: [
      'The structure is the WAI-ARIA APG’s Landmark Regions (w3.org/WAI/ARIA/apg/practices/landmark-regions/), and every one of the five is earned from the element rather than written as a role: header in the context of the body is banner, nav is navigation, main is main, aside is complementary, footer is contentinfo. The root is a div for exactly that reason — a main inside a sectioning element stops being a landmark, and the shell has to be placeable anywhere.',
      'Both controls are the APG’s Disclosure pattern (w3.org/WAI/ARIA/apg/patterns/disclosure/): real buttons, so Enter and Space activate them natively, carrying aria-expanded and aria-controls pointing at their region. One departure is written and costed: under collapsedTo="rail" the navigation does not disappear, it narrows — aria-expanded is still true or false about the region’s full form, and the region stays in the tab order because a rail whose destinations cannot be reached is not a rail. The pane has no such departure: closed, it leaves the layout and the tab order.',
      'A document with more than one navigation or complementary landmark needs a unique label on each, so both regions carry the family’s strings and a consumer may replace either per instance. Each control’s own name changes with the state — “Open navigation” and “Close navigation”, “Open side panel” and “Close side panel” — because a control whose name never changes leaves the reader to infer the state from aria-expanded alone.',
      'The skip links are written from the regions that rendered and are open, so no link ever points at a target nobody built or the reader closed, and the main link writes tabindex="-1" on main before it moves the focus: without it the browser moves the scroll and leaves the focus behind in Safari and Firefox. Blur or the next pointer press inside removes the attribute, so a click on the content never focuses main.',
      'While an overlaid region is modal, @slotted/core/focus contains the keyboard inside it and returns it to the control that opened it on close, and every region beside it — the banner included — takes inert, so Tab cannot reach them and a screen reader does not read them. The ways out are Escape, the veil, a destination, and whatever control the product put in the panel. Two layers can be open together only with both modes forced, and @slotted/core/dismissable-layer keeps one stack, so Escape reaches the topmost.',
      'The pane’s edge is the APG’s Window Splitter (w3.org/WAI/ARIA/apg/patterns/windowsplitter/): a focusable separator with aria-orientation="vertical", aria-controls pointing at the pane and aria-valuemin, aria-valuemax and aria-valuenow as whole percentages of the shell, named “Resize panel”. ArrowLeft and ArrowRight move it sixteen pixels, sixty-four with Shift, by the direction on the screen — so ArrowLeft grows an end pane and shrinks a start one, mirrored in right-to-left — and Home and End go to the limits.',
      'Nothing important depends on hover, the frame answers its own inline size rather than the window’s — which is what makes a 400% zoom behave like a narrow window — and every transition comes from the motion scale, so prefers-reduced-motion collapses all of them at once.',
    ],
    snippets: [
      defineSnippet({
        id: 'app-shell-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="app-shell"
  data-part="root"
  data-primary="banner"
  data-canvas="inset"
  data-nav-mode="inline"
  data-aside-mode="inline"
  data-nav-side="start"
  data-nav-size="md"
  data-aside-size="md"
  data-collapsed-to="rail"
  data-scroll="content"
  data-separation="rule"
  data-open
>
  <div data-part="skip">
    <a href="#…-main">Skip to content</a>
  </div>
  <header data-part="banner">
    <div data-part="brand">
      <button data-part="nav-toggle" aria-expanded="true" aria-controls="…-nav"></button>
    </div>
    <div data-part="center">…</div>
    <div data-part="actions">…</div>
  </header>
  <nav data-part="nav" id="…-nav" aria-label="Main navigation">
    <div data-part="nav-rail">…</div>
    <div data-part="nav-header">…</div>
    <div data-part="nav-body">…</div>
    <div data-part="nav-footer">…</div>
  </nav>
  <main data-part="main" id="…-main">…</main>
  <aside data-part="aside" id="…-aside" aria-label="Side panel" data-open>
    <div data-part="aside-header">
      …
      <button data-part="aside-toggle" aria-expanded="true" aria-controls="…-aside"></button>
    </div>
    <div data-part="aside-body">…</div>
    <div data-part="aside-footer">…</div>
  </aside>
  <footer data-part="footer">…</footer>
  <div data-part="layer"></div>
</div>`,
      }),
      defineSnippet({
        id: 'app-shell-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `/* Every measure the frame stands on. */
[data-ui='app-shell'] {
  --slotted-app-shell-gutter: var(--slotted-space-6);
  --slotted-app-shell-row-inset-size: var(--slotted-space-4);
  --slotted-app-shell-row-mark-size: var(--slotted-control-height-md);
  --slotted-app-shell-row-text-size: var(--slotted-font-size-sm);
  --slotted-app-shell-row-text-line-height: var(--slotted-line-height-sm);
  --slotted-app-shell-rail-size: 3rem;
  --slotted-app-shell-nav-size-md: 16rem;
  --slotted-app-shell-nav-overlay-size: 22rem;
  --slotted-app-shell-aside-size-md: 20rem;
  --slotted-app-shell-banner-block-size: 3.5rem;
  --slotted-app-shell-radius: var(--slotted-radius-md);
  --slotted-app-shell-elevation: var(--slotted-shadow-sm);
  --slotted-app-shell-border-color: var(--slotted-border-subtle);
  /* The ground separation="tone" gives the chrome regions. */
  --slotted-app-shell-tone-surface: var(--slotted-tone-secondary-subtle-hover);
  /* A background-image layer over the frame's color: a wash, a photograph. */
  --slotted-app-shell-frame-image: radial-gradient(
    60% 80% at 0% 0%,
    var(--slotted-tone-accent-surface),
    transparent
  );
}

/* The six the shell publishes, for the rows a product brings. Read them; do
   not restate them. The navigation parts publish a seventh,
   --slotted-app-shell-row-ring-inset: the padding they add for an outward
   focus ring. */
.my-nav-item {
  min-block-size: var(--slotted-app-shell-row-height);
  padding-inline: var(--slotted-app-shell-row-inset);
  gap: var(--slotted-app-shell-row-gap);
  font-size: var(--slotted-app-shell-row-font-size);
  line-height: var(--slotted-app-shell-row-line-height);
}

/* A ground and an ink per region, each falling back to the plane's default. */
[data-ui='app-shell'] {
  --slotted-app-shell-frame: var(--slotted-surface-sunken);
  --slotted-app-shell-canvas: var(--slotted-surface);
  --slotted-app-shell-nav-surface: transparent;
  --slotted-app-shell-aside-surface: var(--slotted-surface);
  --slotted-app-shell-footer-color: var(--slotted-text-muted);
  /* The bar of the two scrolling bodies: thumb and track. */
  --slotted-app-shell-scrollbar-thumb-color: var(--slotted-border-strong);
  --slotted-app-shell-scrollbar-track-color: transparent;
}

/* A dark column on a light frame: the property resolves in the region's own
   scope, and data-slotted-scheme restates every tone inside it. */
[data-ui='app-shell'] > [data-part='nav'] {
  --slotted-app-shell-nav-surface: var(--slotted-surface-sunken);
}`,
      }),
    ],
  },
} as const;
