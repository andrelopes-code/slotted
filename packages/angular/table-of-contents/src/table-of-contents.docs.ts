import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tableOfContentsTokens from '@slotted/styles/table-of-contents/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TABLE_OF_CONTENTS_TOKENS = tableOfContentsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned table-of-contents decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideTableOfContentsDefaults, SlTableOfContents, SlTableOfContentsLabel, SlTableOfContentsLink } from '@slotted/angular/table-of-contents';",
  selector: '[slTableOfContents]',
  exportAs: 'slTableOfContents',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own nav, or div, with slTableOfContents on it',
    required: true,
    purpose:
      'The landmark. It carries data-ui="table-of-contents", data-layout, data-size, and data-sticky, data-numbered, data-open, data-loading and data-empty while each holds. Named by aria-labelledby when there is a label and by aria-label from the messages when there is not; a name written on the element wins.',
  },
  {
    part: 'label',
    element: 'div, or a span inside the trigger',
    required: false,
    purpose:
      'The list’s title, from the label input or the slTableOfContentsLabel template. Outside the collapsed layout it stands above the list and names the landmark; inside it, it is the trigger’s fixed text.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'The collapsed layout’s button: aria-expanded, aria-controls naming the panel, Enter and Space from the platform, ArrowDown opening the list onto its first link.',
  },
  {
    part: 'current',
    element: 'span',
    required: false,
    purpose:
      'Inside the trigger: the current link’s text, cut at the end when the row is too narrow, so a reader on a phone knows where they are without opening the list.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The trigger’s chevron: the chevron-down Glyph element in an icon box, turned half a turn while open.',
  },
  {
    part: 'panel',
    element: 'div',
    required: true,
    purpose:
      'The region holding the list: the scrolling body of a sticky column, the inline scroller of the bar, the layer under the trigger when collapsed. It carries the id aria-controls names and, in the bar, data-overflow for the fade.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose:
      'The first level. An ordered list because the order is the document’s; the track stands on its start edge in the column, and numbered draws counters on it.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One entry, with data-depth from 1, data-value, and data-current while its link is current — so a theme may paint the row and not only the words.',
  },
  {
    part: 'link',
    element: 'a',
    required: true,
    purpose:
      'A real anchor to the fragment. aria-current="location" and data-current while current. Its content is the entry’s label, or the slTableOfContentsLink template; a modifier click is left to the platform.',
  },
  {
    part: 'group',
    element: 'ol',
    required: false,
    purpose:
      'An item’s children, indented one --slotted-table-of-contents-indent per level. Not shown in the horizontal layout.',
  },
  {
    part: 'marker',
    element: 'div',
    required: true,
    purpose:
      'The segment that slides along the track to the current link, aria-hidden and positioned by the family from a measurement. Zero size while nothing is current.',
  },
  {
    part: 'skeleton',
    element: 'li',
    required: false,
    purpose:
      'A row with an item’s geometry whose text is a skeleton bar; four of them while loading.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The customer record beside its list. Scroll the document and watch the marker slide to the section in view; press a link and the section lands under the top edge with focus on it. The controls below drive every axis.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-playground',
      language: 'angular',
      label: 'The list as data',
      source: `<nav slTableOfContents [items]="sections" label="On this page"></nav>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, named',
    note: 'The label above, the track on the list’s start edge, the marker on the current row, the group indented under its parent. Hover a link: the ink darkens and nothing moves. The current link is said twice, by its ink and by the marker, and never by the marker alone.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-anatomy',
      language: 'angular',
      label: 'One directive, the list drawn from data',
      source: `<nav slTableOfContents [items]="sections" [(value)]="section">
  <ng-template slTableOfContentsLabel>On this page</ng-template>
</nav>`,
    }),
  },
  {
    id: 'source',
    title: 'Read from the document’s own headings',
    note: 'The returns policy is prose; nobody wrote a list for it. source points at the article, the family reads its h2 and h3 after the view is built, writes an id on each heading that has none — “Return periods” becomes #return-periods — and rebuilds the list when the article changes.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-source',
      language: 'angular',
      label: 'The headings of a region',
      source: `<nav slTableOfContents label="Neste artigo" [levels]="[2, 3]" [source]="article"></nav>
<div #article slProse>…</div>`,
    }),
  },
  {
    id: 'items',
    title: 'The list as data, from a pipeline',
    note: 'A Markdown pipeline hands over a flat array with a level on each heading. nestOutline from the core outline module folds it into the tree items takes, and the same list renders on the server, which source cannot.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-items',
      language: 'ts',
      label: 'A flat outline, nested',
      source: `import { nestOutline } from '@slotted/core/outline';

const items = nestOutline(toc); // [{ id, label, level }]`,
    }),
  },
  {
    id: 'sticky',
    title: 'A column that stays while the document scrolls',
    note: 'sticky pins the list under the page’s chrome and gives it the rest of the viewport; with more links than fit, the panel scrolls and keeps the current link in view without moving the page. Scroll the document past the tenth section and watch the column follow.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-sticky',
      language: 'angular',
      label: 'Pinned under the chrome',
      source: `<nav slTableOfContents [items]="sections" label="On this page" sticky></nav>`,
    }),
  },
  {
    id: 'horizontal',
    title: 'The bar under a page title',
    note: 'In page-header’s tabs slot, the first level only, one line that scrolls sideways rather than squeezing its labels — the fade at the edge says there is more. Scroll the page: the header collapses, the bar stays, and the marker follows the section under it.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-horizontal',
      language: 'angular',
      label: 'Inside the header',
      source: `<div slPageHeaderTabs>
  <nav slTableOfContents [items]="sections" layout="horizontal"></nav>
</div>`,
    }),
  },
  {
    id: 'collapsed',
    title: 'A phone’s bar',
    note: 'One row: the title, the current section, a chevron. Press it and the list opens in a layer under it; choose a link and it closes, Escape closes it back onto the button, a press outside closes it. The layout is chosen by the consumer’s breakpoint, not by width — the sidebar column is narrower than this bar.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-collapsed',
      language: 'angular',
      label: 'Switched by the consumer’s breakpoint',
      source: `<nav
  slTableOfContents
  [items]="sections"
  label="On this page"
  [layout]="phone() ? 'collapsed' : 'vertical'"
></nav>`,
    }),
  },
  {
    id: 'numbered',
    title: 'Clauses, numbered',
    note: 'A supplier contract is read by clause number. numbered draws counters per level — 2., 2.1, 2.2 — in tabular figures, so a column of numbers lines up and a reader on the phone with legal can say “clause 3.2” and mean the same line.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-numbered',
      language: 'angular',
      label: 'Counters per level',
      source: `<nav slTableOfContents [items]="clauses" label="Clauses" numbered></nav>`,
    }),
  },
  {
    id: 'size',
    title: 'Three steps on the control scale',
    note: 'Each step is the control’s height, type and inset at that step, so a list at sm reads beside a small toolbar and one at lg beside a page title. The density switch in the toolbar moves all three.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-size',
      language: 'angular',
      label: 'The small step',
      source: `<nav slTableOfContents [items]="sections" size="sm"></nav>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover darkens the muted ink toward the page’s text; press goes all the way; the current link takes the accent ink and one step of weight; focus draws the ring inside the row so it never crosses the track. Nothing shifts by a pixel between any two of them.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-states',
      language: 'angular',
      label: 'The current link, two-way',
      source: `<nav slTableOfContents [items]="sections" [(value)]="section"></nav>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A heading of eleven words wraps to three lines and stays whole; an order reference with no space breaks inside itself rather than widening the column; an Arabic heading reads from the right. The bar cuts nothing either: it scrolls.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-content',
      language: 'ts',
      label: 'A long heading wraps',
      source: `const items = [
  { id: 'scope', label: 'Scope of application and definitions used in this document' },
  { id: 'ref', label: 'REF-2026-09-16-INDUSTRIAL-RETURN-000482915' },
];`,
    }),
  },
  {
    id: 'loading',
    title: 'While the document is still arriving',
    note: 'A record loaded from the server has no sections yet. loading draws four rows of skeleton with an item’s geometry, so the column keeps its width; a list with no entries and nothing loading draws nothing at all.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-loading',
      language: 'angular',
      label: 'Rows in the list’s place',
      source: `<nav slTableOfContents [items]="sections() ?? []" [loading]="!sections()"></nav>`,
    }),
  },
  {
    id: 'history',
    title: 'What a press does to the URL',
    note: 'push writes a history entry per section, so Back retraces the reading; replace keeps one entry and updates the hash, which is what a record page wants; none leaves the URL alone. The scroll and the focus are the same in all three; only the address bar differs.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-history',
      language: 'angular',
      label: 'One entry, updated',
      source: `<nav slTableOfContents [items]="sections" history="replace"></nav>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'The provider sets the levels a document outlines, whether the column pins, and what a press does to the URL — and every list under it reads them. The landmark’s name comes from the language in force. A list that states an axis itself still wins: the second one here is lg under a provider that said sm.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-defaults',
      language: 'ts',
      label: 'The provider',
      source: `bootstrapApplication(App, {
  providers: [
    provideTableOfContentsDefaults({
      history: 'replace',
      levels: [2, 4],
      size: 'sm',
      sticky: true,
    }),
  ],
});`,
    }),
  },
  {
    id: 'composition',
    title: 'Beside a resizable column, and with its own link',
    note: 'The list sits in a region a splitter sizes; the document scrolls in the body beside it, and the family finds that scroller from the first section without being told. Each link’s content is the consumer’s to shape: the template is handed the entry and whether it is current.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-composition',
      language: 'angular',
      label: 'The link’s content, templated',
      source: `<nav slTableOfContents [items]="sections">
  <ng-template slTableOfContentsLink let-entry let-current="current">
    <span slText [weight]="current ? 'semibold' : 'regular'">{{ entry.label }}</span>
  </ng-template>
</nav>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key the contract lists',
    note: 'Tab reaches each link in order. ArrowDown and ArrowUp walk them, Home and End jump to the ends, and in the bar ArrowRight and ArrowLeft do the same along the line. Enter follows the link and lands focus on the section, so the next Tab continues inside it.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-keyboard',
      language: 'angular',
      label: 'The instance, for the keys the page owns',
      source: `<nav slTableOfContents #list="slTableOfContents" [items]="sections"></nav>
<button slButton (click)="list.focus()">Focus the index</button>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader hears',
    note: 'A navigation landmark named “On this page”, a list of six items, and one link announced as “current location”. After Enter the reader hears the section’s heading, because focus moved there. The collapsed trigger announces expanded and collapsed, and Escape returns to it.',
    snippet: defineSnippet({
      id: 'table-of-contents-angular-accessibility',
      language: 'angular',
      label: 'Named by its label',
      source: `<nav slTableOfContents [items]="sections" label="On this page"></nav>
<!-- <nav aria-labelledby="…-label"> … <a aria-current="location"> -->`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the current target moves. The request carries the new id, the id it replaces, the reason — scroll from the observer, pointer or keyboard from a press, programmatic from scrollTo() — the originating event when there is one, and cancel(). A refused scroll request keeps the value; a refused press still scrolls, because the navigation is the anchor’s. [(value)] moves after the request is accepted.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the collapsed list opens or closes. The reason is pointer or keyboard on the trigger, select for a link chosen inside, escape and outsidePress from the layer, programmatic from a consumer. [(open)] moves after the request is accepted.',
  },
  {
    name: 'valueChange, openChange',
    payload: 'string | null; boolean',
    when: 'After each model moves: the two-way halves of [(value)] and [(open)], for a template that binds one directly.',
  },
];

export const ANGULAR_TABLE_OF_CONTENTS_DOCS = {
  tableOfContents: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'items',
        'TableOfContentsItemData[]',
        '—',
        'slTableOfContents',
        'The list as data: { id, label, children? }. Wins over source',
      ],
      [
        'source',
        'ElementRef<HTMLElement> | HTMLElement',
        '—',
        'slTableOfContents',
        'A region whose headings make the list, read after the view is built and again when its subtree changes. A heading without an id is given one from its text',
      ],
      [
        'levels',
        '[number, number]',
        '2,3',
        'slTableOfContents',
        'The lowest and highest heading level source keeps, inclusive',
      ],
      [
        'exclude',
        'string',
        '—',
        'slTableOfContents',
        'A selector: a heading matching it, or inside an element matching it, is left out of source',
      ],
      [
        'scroller',
        'ElementRef<HTMLElement> | HTMLElement | null',
        '—',
        'slTableOfContents',
        'The element that scrolls. Unset, it is the first target’s nearest scrolling ancestor; null is the viewport',
      ],
      [
        'offset',
        'number',
        '0',
        'slTableOfContents',
        'CSS pixels added under the page’s chrome, for the reading line and for where a target lands. The chrome itself is read from --slotted-page-sticky-top',
      ],
      [
        'value',
        'model<string | null>',
        'null',
        'slTableOfContents',
        'The current target’s id. Two-way: the list asks through valueChangeRequest and moves it once the request is accepted',
      ],
      [
        'open',
        'model<boolean>',
        'false',
        'slTableOfContents',
        'Whether the collapsed list is shown. Two-way, through openChangeRequest',
      ],
      [
        'layout',
        "'vertical' | 'horizontal' | 'collapsed'",
        'vertical',
        'slTableOfContents',
        'The column, the bar, or the trigger with the list under it. The consumer’s breakpoint decides; the family never decides by width',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slTableOfContents',
        'The row step, on the control scale: height, type and inset',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'slTableOfContents',
        'Pins the column under the page’s chrome, clear of it by --slotted-table-of-contents-sticky-inset, and gives it the rest of the viewport; the panel scrolls. Ignored in the collapsed layout',
      ],
      [
        'history',
        "'push' | 'replace' | 'none'",
        'push',
        'slTableOfContents',
        'What a press does to the URL: pushState, replaceState, or nothing. scrollTo() never writes it',
      ],
      ['numbered', 'boolean', 'false', 'slTableOfContents', 'Counters per level before each link'],
      [
        'landmark',
        'boolean',
        'true',
        'slTableOfContents',
        'Whether the host takes the landmark’s name. The element is the consumer’s: a nav is the landmark, a div inside one that already has a name is not',
      ],
      [
        'label',
        'string',
        '—',
        'slTableOfContents',
        'The list’s title, rendered as the label part and used as the landmark’s name. A slTableOfContentsLabel template wins over it. In the collapsed layout it is the trigger’s fixed text',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slTableOfContents',
        'Four rows of skeleton in the list’s place, and aria-busy on the host',
      ],
      [
        'messages',
        'Partial<TableOfContentsMessages>',
        '—',
        'slTableOfContents',
        'Words laid over the language in force: the landmark’s name when there is no label, and the collapsed trigger’s fixed text (navigation)',
      ],
    ]),
    composition: apiRows([
      [
        'slTableOfContentsLink',
        'ng-template, let-entry let-current="current"',
        '—',
        'a child of the host',
        'The content of every link, handed the entry and whether it is current. Without one the link shows the entry’s label',
      ],
      [
        'slTableOfContentsLabel',
        'ng-template',
        '—',
        'a child of the host',
        'The list’s title as a template, for a title with a mark or a count in it',
      ],
      [
        'exportAs slTableOfContents',
        'SlTableOfContents',
        '—',
        'the host',
        'focus() lands on the first link or the trigger; refresh() reads the headings and measures again; scrollTo(id) lands on a target with the reason programmatic and leaves the URL',
      ],
      [
        'provideTableOfContentsDefaults',
        '{ layout, size, sticky, history, numbered, landmark, levels, offset }',
        '—',
        'an injector',
        'The decisions an application takes once. A list that states any of them itself still wins',
      ],
      [
        'aria-label, aria-labelledby, id, class',
        'the host’s own attributes',
        '—',
        'the host',
        'Every attribute written on the element stays. A name the consumer writes wins over the label and the messages, read through HostAttributeToken before the family writes its own',
      ],
    ]),
    accessibility: [
      'The APG has no pattern for a table of contents (w3.org/WAI/ARIA/apg/patterns/, read 2026-09-16). What applies is a navigation landmark with a name, real links, and aria-current="location" from ARIA 1.2 — the token for the current place within a context — on exactly one link at a time.',
      'The platform supplies the landmark, the list of N items and the links; the family adds the name, the current token, and the arrow keys the Disclosure Navigation Menu example lists as optional, for the keyboard user who runs no screen reader. Every link stays in the tab sequence: nothing rolls.',
      'After a press, focus moves to the target with tabindex="-1" lent to it until it blurs, so a screen reader continues reading from the section and not from the list. A fragment navigation on its own moves only the sequential focus starting point.',
      'The collapsed trigger is a native button with aria-expanded and aria-controls; ArrowDown opens the list onto its first link, Escape closes it back onto the button, and a press outside closes it through the same dismissable layer every overlay in the library uses.',
      'The scroll is smooth unless the reader asked for reduced motion, read from prefers-reduced-motion; the marker’s travel and the chevron’s turn read the motion scale, which the theme collapses under the same query.',
    ],
    snippets: [
      defineSnippet({
        id: 'table-of-contents-angular-dom',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<nav
  slTableOfContents
  data-ui="table-of-contents"
  data-part="root"
  data-layout="vertical"
  data-size="md"
  aria-labelledby="slotted-table-of-contents-1-label"
>
  <div data-part="label" id="slotted-table-of-contents-1-label">On this page</div>
  <div data-part="panel" id="slotted-table-of-contents-1-panel">
    <div data-part="marker" aria-hidden="true"></div>
    <ol data-part="list">
      <li data-part="item" data-depth="1" data-value="addresses" data-current>
        <a data-part="link" href="#addresses" aria-current="location" data-current>Addresses</a>
        <ol data-part="group">
          <li data-part="item" data-depth="2" data-value="billing">
            <a data-part="link" href="#billing">Billing</a>
          </li>
        </ol>
      </li>
    </ol>
  </div>
</nav>`,
      }),
      defineSnippet({
        id: 'table-of-contents-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='table-of-contents'] {
  --slotted-table-of-contents-indent: var(--slotted-space-6);
  --slotted-table-of-contents-track-color: var(--slotted-border-strong);
  --slotted-table-of-contents-marker-color: var(--slotted-tone-success-solid);
  --slotted-table-of-contents-color-current: var(--slotted-tone-success-text);
}`,
      }),
    ],
  },
} as const;
