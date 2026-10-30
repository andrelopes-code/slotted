import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import detailPanelTokens from '@slotted/styles/detail-panel/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_DETAIL_PANEL_TOKENS = detailPanelTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DetailPanel decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDetailPanel, SlDetailPanelBody, SlDetailPanelSection, SlDetailPanelTabs, SlDetailPanelAside, SlDetailPanelBanner, SlDetailPanelMessage, SlDetailPanelFooter, provideDetailPanelDefaults } from '@slotted/angular/detail-panel';",
  selector:
    '[slDetailPanel], [slDetailPanelBody], ng-template[slDetailPanelSection], [slDetailPanelTabs], aside[slDetailPanelAside], [slDetailPanelBanner], [slDetailPanelMessage], footer[slDetailPanelFooter]',
  exportAs:
    'slDetailPanel, slDetailPanelBody, slDetailPanelSection, slDetailPanelTabs, slDetailPanelAside, slDetailPanelFooter',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the article carrying slDetailPanel',
    required: true,
    purpose:
      'The record, carrying data-ui="detail-panel", the seven axes, data-key for the record and aria-labelledby the page-header’s heading. Its first child is the [slPageHeader] the consumer writes; under scroll="self" it is the scroll container.',
  },
  {
    part: 'body',
    element: 'the element carrying slDetailPanelBody',
    required: true,
    purpose:
      'The column under the header: the vertical inset, and a Container inside at the page’s width and inset so the columns align with the header’s own container in every host. A [slContainer] inside reads the page.',
  },
  {
    part: 'banner',
    element: 'div',
    required: false,
    purpose:
      'An alert about the record — changed on the server, locked, archived — above the columns, the width of both. The consumer’s element carrying slDetailPanelBanner, projected above the columns.',
  },
  {
    part: 'columns',
    element: 'div',
    required: false,
    purpose:
      'The grid of main and aside: two tracks above 600 pixels of the root’s width, one below. Absent under status="not-found" and "error", where the message stands.',
  },
  {
    part: 'main',
    element: 'div',
    required: false,
    purpose: 'The column of sections, one rhythm step apart.',
  },
  {
    part: 'section',
    element: 'div, rendered by the body from ng-template[slDetailPanelSection]',
    required: false,
    purpose:
      'One named unit. Under layout="tabs" it is the tabpanel of the strip’s tab — hidden when not current, in the tab sequence, wired by id; under "stacked" it holds a [slSection] at the rank below the panel’s, with the label as heading and the count as a badge after it. data-current marks the one section is.',
  },
  {
    part: 'section-actions',
    element: 'div',
    required: false,
    purpose:
      'Under layout="tabs", the section’s own controls in a row at the inline end above its content. Under "stacked" they are the section’s actions part instead. Given as a TemplateRef through the section’s actions input.',
  },
  {
    part: 'aside',
    element: 'the aside carrying slDetailPanelAside',
    required: false,
    purpose:
      'The metadata column, a complementary landmark named by the aside message. Beside the sections above 600 pixels, in the column the aside axis names; under them below, with a rule above. Never hidden.',
  },
  {
    part: 'message',
    element: 'div',
    required: false,
    purpose:
      'In place of the columns under status="not-found" or "error": a centerd box, four space-12 tall, for a [slResultState]. The consumer’s element carrying slDetailPanelMessage. The header and the footer stay, so a drawer opened on a deleted record still closes.',
  },
  {
    part: 'footer',
    element: 'the footer carrying slDetailPanelFooter',
    required: false,
    purpose:
      'The row that stays at the bottom of whatever scrolls, under --slotted-page-sticky-bottom, with a Container inside. Projected last in the article; the slot an [slActionBar] sits in.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The sales order SO-2026-01842 of Meridian Controls Group, a screen tall, with every axis on the controls below. Switch layout to tabs and the strip appears in the header with the same three sections; switch aside to start and the fields move to the other column.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-playground',
      language: 'angular',
      label: 'A record: header, sections, aside',
      source: `<article slDetailPanel [recordKey]="order.id">
  <header slPageHeader>…</header>
  <div slDetailPanelBody>
    <ng-template slDetailPanelSection name="linhas" label="Linhas" [count]="4">
      <sl-order-lines />
    </ng-template>
    <ng-template slDetailPanelSection name="historico" label="History">
      <sl-order-history />
    </ng-template>
    <aside slDetailPanelAside><sl-order-fields /></aside>
  </div>
</article>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The page-header on top with its facts and its pill; the banner about a change on the server; the columns — three stacked sections at h3 with their counts and actions, the aside of fields with a rule beside it; and the footer stuck at the bottom with two actions. Scroll the box: the header snaps, the footer stays.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-anatomy',
      language: 'angular',
      label: 'The ten parts',
      source: `<article slDetailPanel [recordKey]="order.id">
  <header slPageHeader>…</header>
  <div slDetailPanelBody>
    <div slDetailPanelBanner><section slAlert tone="warning">…</section></div>
    <ng-template slDetailPanelSection name="linhas" label="Linhas">…</ng-template>
    <aside slDetailPanelAside>…</aside>
  </div>
  <footer slDetailPanelFooter><div slActionBar>…</div></footer>
</article>`,
    }),
  },
  {
    id: 'layout',
    title: 'layout: stacked, or tabs',
    note: 'The same three sections and the same section value. Stacked, each has a heading with its count and its actions in the heading row; tabbed, the strip sits in the header’s tabs slot, one section is the tabpanel, and its actions move to a row above the content.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-layout',
      language: 'angular',
      label: 'The strip goes in the header’s tabs slot',
      source: `<article slDetailPanel layout="tabs" [recordKey]="order.id">
  <header slPageHeader>
    …
    <div slDetailPanelTabs label="Order sections"></div>
  </header>
  <div slDetailPanelBody>…</div>
</article>`,
    }),
  },
  {
    id: 'aside',
    title: 'aside: end, start, or none',
    note: 'Where the fields stand. At the end, Jira’s and GitHub’s sidebar; at the start, HubSpot’s “about” column, with the rule on its other edge; none, and the sections take the whole width with no empty track beside them.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-aside',
      language: 'angular',
      label: 'The column the fields take',
      source: `<article slDetailPanel aside="start" [recordKey]="order.id">…</article>`,
    }),
  },
  {
    id: 'hosts',
    title: 'Three hosts, one anatomy',
    note: 'The same panel as a page’s content at level 1, as a drawer’s body with the drawer’s own close in the header actions, and as a split’s pane scrolling itself. Nothing in the panel names its host: scroll="self" is the one difference a pane makes. A pane that paints a ground of its own declares --slotted-page-ground with that ground, so a sticky section header inside the panel matches the pane and not the page.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-hosts',
      language: 'angular',
      label: 'In a drawer, and in a pane',
      source: `<div slDrawer [(open)]="open">
  <div slDrawerPanel>
    <div slDrawerBody>
      <article slDetailPanel [recordKey]="order.id">…</article>
    </div>
  </div>
</div>

<div
  class="pane"
  style="background: var(--slotted-surface); --slotted-page-ground: var(--slotted-surface)"
>
  <article slDetailPanel scroll="self" [recordKey]="order.id">…</article>
</div>`,
    }),
  },
  {
    id: 'navigation',
    title: 'Previous and next: focus follows the record',
    note: 'Press the next control in the header, or Tab to it and press Enter: the record changes, the scroller returns to its start, and — because focus was inside the panel — the heading takes focus and a screen reader announces the new order. A recordKey changed while focus is elsewhere moves nothing.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-navigation',
      language: 'angular',
      label: 'recordKey is the record’s identity',
      source: `<article slDetailPanel [recordKey]="order().id">
  <header slPageHeader>
    …
    <div slPageHeaderNavigation>
      <button slIconButton aria-label="Next order" (click)="next()">…</button>
    </div>
  </header>
  …
</article>`,
    }),
  },
  {
    id: 'sections',
    title: 'The section model: value, reason, mount',
    note: 'The value is controlled and every change is a request with a reason: the strip asks with pointer or keyboard, the link under the panel with programmatic, and the log below shows each one. Under stacked the same button scrolls the named section under the chrome and marks it data-current. mount="lazy" keeps a tab’s content once it has been seen.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-sections',
      language: 'angular',
      label: 'One value, three reasons',
      source: `<article
  slDetailPanel
  layout="tabs"
  mount="lazy"
  [section]="section()"
  (sectionRequest)="onRequest($event)"
  [recordKey]="order.id"
>
  …
</article>`,
    }),
  },
  {
    id: 'loading',
    title: 'loading: the frame waits, the words arrive',
    note: 'The record has not arrived. The heading and the subheading are the page-header’s skeleton; each section shows three placeholder lines in place of content that is not mounted; the aside four short ones. The tab labels stay, because they are known before the record is. Toggle the switch to see the words land without the frame moving.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-loading',
      language: 'angular',
      label: 'loading on the panel, and on the header',
      source: `<article slDetailPanel [loading]="loading()" [recordKey]="order.id">
  <header slPageHeader [loading]="loading()">…</header>
  <div slDetailPanelBody>…</div>
</article>`,
    }),
  },
  {
    id: 'status',
    title: 'status: not-found, and error',
    note: 'A record that does not exist and a request that failed need different words and different actions, so they are two statuses. Both replace the columns with the message and keep the chrome: the back link still goes back and the footer’s close still closes.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-status',
      language: 'angular',
      label: 'The message stands where the columns stood',
      source: `<article slDetailPanel status="not-found" recordKey="SO-2026-01900">
  <header slPageHeader>…</header>
  <div slDetailPanelBody>
    <div slDetailPanelMessage>
      <section slResultState status="not-found">
        <div slResultStateContent>
          <div slResultStateTitle>This order no longer exists</div>
        </div>
      </section>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'banner',
    title: 'banner: the record changed under the reader',
    note: 'Marta Silva registered a payment two minutes ago. The alert sits between the header and the columns, the width of both, in the flow rather than as a toast that disappears — it is read before the stale content, and Reload is the one action.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-banner',
      language: 'angular',
      label: 'An alert in the banner',
      source: `<div slDetailPanelBody>
  <div slDetailPanelBanner>
    <section slAlert tone="warning">
      <div slAlertContent>
        <div slAlertTitle>This invoice was changed by someone else</div>
      </div>
      <div slAlertActions>
        <button slButton size="sm" tone="warning">Recarregar</button>
      </div>
    </section>
  </div>
  …
</div>`,
    }),
  },
  {
    id: 'footer',
    title: 'footer: the actions that stay',
    note: 'In a box that scrolls itself the footer stays at the bottom edge, painted so the content passes under it, with an ActionBar inside aligned to the column above. Scroll to the end: the last section stops above the footer, not behind it.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-footer',
      language: 'angular',
      label: 'An action bar in the footer',
      source: `<article slDetailPanel scroll="self" [recordKey]="order.id">
  …
  <footer slDetailPanelFooter>
    <div slActionBar aria-label="Order actions" variant="plain">
      <div slActionBarActions>
        <div slActionBarAction><button slButton variant="ghost">Close</button></div>
        <div slActionBarAction><button slButton tone="accent">Record payment</button></div>
      </div>
    </div>
  </footer>
</article>`,
    }),
  },
  {
    id: 'sizes',
    title: 'size: sm, md, lg',
    note: 'One step moves the header’s title, the sections’ headings, the gap between the columns and the aside’s track together: 14, 16 and 18 rem. The size says nothing about rank — every heading here is the same h2.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-sizes',
      language: 'angular',
      label: 'The size reaches the header through its defaults',
      source: `<article slDetailPanel size="sm" [recordKey]="order.id">…</article>`,
    }),
  },
  {
    id: 'narrow',
    title: 'Below 600 pixels',
    note: 'The root measures its own width, not the viewport. At 360 pixels the columns are one: the aside follows the sections in the flow with a rule above it, the header’s actions wrap under the title, and nothing is hidden — a phone reader reaches every field a desktop reader does.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-narrow',
      language: 'angular',
      label: 'Nothing to write: the container query is the family’s',
      source: `<article slDetailPanel [recordKey]="order.id">…</article>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A title of a whole sentence, clamped by the page-header at three lines with the full text in its title attribute; a supplier reference with no spaces, which the aside wraps rather than widening; and twelve sections, whose strip scrolls with paging controls that are the tabs family’s own.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-content',
      language: 'angular',
      label: 'Twelve sections in the strip',
      source: `<article slDetailPanel layout="tabs" [recordKey]="order.id">
  <header slPageHeader>…</header>
  <div slDetailPanelBody>
    @for (month of months; track month) {
      <ng-template slDetailPanelSection [name]="month" [label]="month">…</ng-template>
    }
  </div>
</article>`,
    }),
  },
  {
    id: 'composition',
    title: 'What a section holds, and what sits beside it',
    note: 'A Table in the lines section, a Timeline feed in the history, a DescriptionList of fields in the aside with a copy control on the invoice, a Toolbar with overflow in the header’s actions and a Tag in its marks. Each is placed by the panel and owned by its own family; the panel writes none of their behavior.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-composition',
      language: 'angular',
      label: 'A timeline in the history section',
      source: `<ng-template slDetailPanelSection name="historico" label="History">
  <div slTimeline label="Order history" order="newest-first">
    @for (event of history; track event.time) {
      <li slTimelineItem [title]="event.title" [time]="event.time"></li>
    }
  </div>
</ng-template>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the layout, the aside’s side, the rank, the size, who scrolls, and the mount policy for every panel under it; the two panels here state nothing and both read tabbed with the fields at the start. The handle reaches focus() and scrollToSection().',
    snippet: defineSnippet({
      id: 'detail-panel-angular-defaults',
      language: 'ts',
      label: 'Six decisions, taken once',
      source: `@Component({
  providers: [provideDetailPanelDefaults({ aside: 'start', layout: 'tabs' })],
})
export class OrdersPage {}`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The article is named by the heading, so the record is announced by its identifier and customer; the aside is a complementary landmark named by the aside message; under tabs, Tab from the strip lands on the tabpanel with the outward ring and then on the table inside it. Press next: the heading takes focus and says the new record.',
    snippet: defineSnippet({
      id: 'detail-panel-angular-accessibility',
      language: 'angular',
      label: 'A consumer’s own name wins',
      source: `<article slDetailPanel aria-label="Sales order SO-2026-01842" [recordKey]="order.id">…</article>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'sectionRequest',
    payload: 'ChangeRequest<string | undefined>',
    when: 'Before the current section moves. The request carries the new value, the value it replaces, the reason — pointer or keyboard from the strip, programmatic from scrollToSection() or select() — the originating event, and cancel(), which refuses the move before anything commits. Under stacked the value arrives only as programmatic.',
  },
  {
    name: 'sectionChange',
    payload: 'string | undefined',
    when: 'After the section moved, from the model. Bind [(section)] to follow it, or [section] and (sectionRequest) to own it.',
  },
  {
    name: '(click), (focus), (keydown) on any part',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The family handles nothing on its own parts; the strip’s keys are the tabs family’s and the header’s are the page-header’s.',
  },
];

export const ANGULAR_DETAIL_PANEL_DOCS = {
  detailPanel: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'section',
        'model<string | undefined>',
        '—',
        'slDetailPanel',
        'The current section. Two-way, so [(section)] follows it; under tabs the selected tab, under stacked the section marked data-current and scrolled under the chrome. Unbound, a tabbed panel starts on its first section and a stacked one marks none',
      ],
      [
        'layout',
        "'stacked' | 'tabs'",
        'stacked',
        'slDetailPanel, provideDetailPanelDefaults',
        'Every section in the flow with a heading each, or a strip in the header’s tabs slot with one section shown. The section value is the same under both',
      ],
      [
        'aside',
        "'end' | 'start' | 'none'",
        'end',
        'slDetailPanel, provideDetailPanelDefaults',
        'Which column the aside takes above 600 pixels. none says the consumer renders no aside and the body is one column at every width',
      ],
      [
        'level',
        "'1' | '2' | '3'",
        '2',
        'slDetailPanel, provideDetailPanelDefaults',
        'The heading rank the page-header defaults to, through PAGE_HEADER_DEFAULTS provided for the subtree; stacked sections take the rank below. 1 in a page of its own, 2 in a drawer or a pane',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slDetailPanel, provideDetailPanelDefaults',
        'The page-header’s size default, the sections’ size, the gap between the columns and the aside’s track: 14, 16 or 18 rem',
      ],
      [
        'scroll',
        "'ancestor' | 'self'",
        'ancestor',
        'slDetailPanel, provideDetailPanelDefaults',
        'Who scrolls. ancestor for a page or a drawer, whose body scrolls; self for a pane, where the root is the scroll container and the header sticks inside it',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager'",
        'active',
        'slDetailPanel, provideDetailPanelDefaults',
        'Under tabs, when a section’s template is instantiated: only while current, once it has been current, or always. Inert under stacked',
      ],
      [
        'status',
        "'ready' | 'not-found' | 'error'",
        'ready',
        'slDetailPanel',
        'Whether the record is there. Under either failure the columns give way to the message and the header and footer stay',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slDetailPanel',
        'The record has not arrived: aria-busy on the root, skeleton lines in place of every section’s content and of the aside’s. The header’s own loading is bound on the header',
      ],
      [
        'recordKey',
        'string | number',
        '—',
        'slDetailPanel',
        'The identity of the record on screen, written as data-key. When it changes while focus is inside the root, the heading takes focus and the scroller returns to its start',
      ],
      [
        'messages',
        'PartialMessages<DetailPanelMessages>',
        '—',
        'slDetailPanel',
        'Words laid over the language in force, key by key: the aside’s accessible name (aside), and the root’s while loading and the heading has no words yet (loading)',
      ],
      [
        'name',
        'string',
        '—',
        'slDetailPanelSection',
        'Required. The value the section is named by in section and the URL; written as data-name',
      ],
      [
        'label',
        'string',
        '—',
        'slDetailPanelSection',
        'Required. The tab’s words under tabs, the heading under stacked',
      ],
      [
        'count',
        'number',
        '—',
        'slDetailPanelSection',
        'Drawn as a badge in the tab, or after the stacked heading',
      ],
      [
        'actions',
        'TemplateRef',
        '—',
        'slDetailPanelSection',
        'The section’s own controls: in the stacked heading’s actions column, or in a row above a tabbed section',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slDetailPanelSection',
        'Takes the tab out of the strip’s sequence. Inert under stacked',
      ],
      ['label', 'string', '—', 'slDetailPanelTabs', 'Required. The tab list’s accessible name'],
      [
        'aria-label',
        'string',
        'the aside message',
        'aside[slDetailPanelAside]',
        'A written name wins over the messages; read with HostAttributeToken before the family writes its own',
      ],
    ]),
    composition: apiRows([
      [
        '[slPageHeader]',
        'from @slotted/angular/page-header',
        '—',
        'the root’s first child',
        'The whole top: back, visual, heading, marks, subheading, actions, previous and next, the header area that snaps, the tabs slot. The panel provides PAGE_HEADER_DEFAULTS for its subtree from its own level and size through getters over signals; a header that states its own wins',
      ],
      [
        '[slDetailPanelTabs]',
        '{ label }',
        '—',
        'on the element in the header’s tabs slot',
        'The strip, rendered from the sections: an [slTabs] list. slPageHeaderTabs is a host directive, so the element is the slot; a [slTabActions] child is projected beside the list. Renders nothing under stacked',
      ],
      [
        'ng-template[slDetailPanelSection]',
        'TemplateRef',
        '—',
        'inside [slDetailPanelBody]',
        'A section is a template the body renders in either shape, which is what lets mount and loading decide whether the consumer’s view exists. Declaration order is the strip’s order',
      ],
      [
        'select(name, reason, source?)',
        'method',
        '—',
        'slDetailPanel',
        'Asks to move the current section with a reason; the request reaches (sectionRequest) first',
      ],
      [
        'scrollToSection(name) / focus()',
        'methods',
        '—',
        'slDetailPanel, through exportAs',
        'The move a template cannot express: the section with the reason programmatic, and focus on the page-header’s heading',
      ],
      [
        'provideDetailPanelDefaults',
        '{ layout, aside, level, size, scroll, mount }',
        '—',
        'a providers array',
        'The six decisions an application takes once. A panel that states any of them itself still wins',
      ],
      [
        'native attributes',
        'on every element',
        '—',
        'every part',
        'aria-*, data-*, class, style and (events) stay on the consumer’s own element; a written aria-label or aria-labelledby on the article replaces the heading wiring',
      ],
    ]),
    accessibility: [
      'There is no detail or record pattern in the WAI-ARIA Authoring Practices; the governing sources are the landmark practices (w3.org/WAI/ARIA/apg/practices/landmark-regions/) for the article and the aside, and the Tabs pattern (w3.org/WAI/ARIA/apg/patterns/tabs/) for the strip, which the tabs family holds. The root is an article — one self-contained record — named by aria-labelledby the page-header’s heading once it is in the DOM, so the record is announced by its identifier and its customer; a consumer’s own aria-label wins.',
      'Under layout="tabs" each section is the tabpanel of its tab: role="tabpanel", tabindex="0", aria-labelledby the tab, hidden when not current, and the tab’s aria-controls names it. The ids are the strip’s tabs family’s, handed to the panel on mount, so Tab from the selected tab lands on the shown section with the outward focus ring and then on its content. ArrowLeft, ArrowRight, Home and End on the strip are the tabs family’s, and under automatic activation each asks the panel to move section with the reason keyboard.',
      'The aside is an aside element — a complementary landmark — named by the aside message, Details in English, so a reader can jump to the fields from the landmark list and hears what they are. It is never hidden below a width: content a desktop has and a phone does not is content a phone reader cannot reach, so the aside follows the sections in the flow instead.',
      'Focus follows the record. When recordKey changes while document.activeElement is inside the root — the previous or next control was just pressed — the panel writes tabindex="-1" on the page-header’s heading, focuses it, and scrolls the container to its start, so a screen reader announces the new record rather than staying on a control whose record changed under it. When focus is elsewhere nothing moves.',
      'While loading the root carries aria-busy="true", every placeholder is the skeleton family’s and hidden from assistive technology, the tab labels stay because they are known before the record is, and the root is named by the loading message, Loading the record in English, until the heading has words. Under status="not-found" or "error" the message replaces the columns and the header, the back control and the footer stay, so a drawer opened on a deleted record still closes.',
    ],
    snippets: [
      defineSnippet({
        id: 'detail-panel-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<article
  data-ui="detail-panel"
  data-part="root"
  data-layout="tabs"
  data-aside="end"
  data-level="2"
  data-size="md"
  data-scroll="ancestor"
  data-mount="active"
  data-status="ready"
  data-key="SO-2026-01842"
  aria-labelledby=":r1:-heading"
>
  <header data-ui="page-header">
    <div data-part="tabs">
      <div data-ui="tabs">…</div>
    </div>
  </header>
  <div data-part="body">
    <div data-ui="container">
      <div data-part="banner">…</div>
      <div data-part="columns">
        <div data-part="main">
          <div
            data-part="section"
            role="tabpanel"
            tabindex="0"
            id=":r2:panel-linhas"
            aria-labelledby=":r2:tab-linhas"
            data-name="linhas"
            data-current
          >
            <div data-part="section-actions">…</div>
            <table>
              …
            </table>
          </div>
          <div data-part="section" role="tabpanel" hidden>…</div>
        </div>
        <aside data-part="aside" aria-label="Details">…</aside>
      </div>
    </div>
  </div>
  <footer data-part="footer">
    <div data-ui="container">…</div>
  </footer>
</article>
;`,
      }),
      defineSnippet({
        id: 'detail-panel-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='detail-panel'] {
  --slotted-detail-panel-aside-size-md: 18rem;
  --slotted-detail-panel-gap-md: var(--slotted-space-9);
  --slotted-detail-panel-rhythm: var(--slotted-space-9);
  --slotted-detail-panel-inset-block-md: var(--slotted-space-7);
  --slotted-detail-panel-border: var(--slotted-border-strong);
}`,
      }),
    ],
  },
} as const;
