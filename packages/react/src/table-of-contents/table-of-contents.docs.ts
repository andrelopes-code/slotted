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

export const REACT_TABLE_OF_CONTENTS_TOKENS = tableOfContentsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned table-of-contents decision',
}));

const imports: ReferenceImport = {
  source:
    "import { TableOfContents, TableOfContentsItem, TableOfContentsLink, TableOfContentsGroup, TableOfContentsDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav, or a div under landmark={false}, or the element render returns',
    required: true,
    purpose:
      'The landmark. It carries data-ui="table-of-contents", data-layout, data-size, and data-sticky, data-numbered, data-open, data-loading and data-empty while each holds. Named by aria-labelledby when there is a label and by aria-label from the messages when there is not.',
  },
  {
    part: 'label',
    element: 'div, or a span inside the trigger',
    required: false,
    purpose:
      'The list’s title, from the label prop. Outside the collapsed layout it stands above the list and names the landmark; inside it, it is the trigger’s fixed text.',
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
    element: 'li, or the element render returns',
    required: true,
    purpose:
      'One entry, with data-depth from 1, data-value, and data-current while its link is current — so a theme may paint the row and not only the words.',
  },
  {
    part: 'link',
    element: 'a, or the element render returns',
    required: true,
    purpose:
      'A real anchor to the fragment. aria-current="location" and data-current while current. The consumer’s onClick runs first; a modifier click is left to the platform.',
  },
  {
    part: 'group',
    element: 'ol, or the element render returns',
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
      id: 'table-of-contents-react-playground',
      language: 'tsx',
      label: 'The list as data',
      source: `<TableOfContents items={sections} label="On this page" />;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, named',
    note: 'The label above, the track on the list’s start edge, the marker on the current row, the group indented under its parent. Hover a link: the ink darkens and nothing moves. The current link is said twice, by its ink and by the marker, and never by the marker alone.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-anatomy',
      language: 'tsx',
      label: 'Written by hand, part by part',
      source: `<TableOfContents label="On this page">
  <TableOfContentsItem value="dados-gerais">
    <TableOfContentsLink>General information</TableOfContentsLink>
  </TableOfContentsItem>
  <TableOfContentsItem value="enderecos">
    <TableOfContentsLink>Addresses</TableOfContentsLink>
    <TableOfContentsGroup>
      <TableOfContentsItem value="faturacao">
        <TableOfContentsLink>Billing</TableOfContentsLink>
      </TableOfContentsItem>
    </TableOfContentsGroup>
  </TableOfContentsItem>
</TableOfContents>;`,
    }),
  },
  {
    id: 'source',
    title: 'Read from the document’s own headings',
    note: 'The returns policy is prose; nobody wrote a list for it. source points at the article, the family reads its h2 and h3 after mount, writes an id on each heading that has none — “Return deadlines” becomes #return-deadlines — and rebuilds the list when the article changes.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-source',
      language: 'tsx',
      label: 'The headings of a region',
      source: `const article = useRef<HTMLElement>(null);

<TableOfContents label="Neste artigo" levels={[2, 3]} source={article} />;
<div ref={article}>
  <Prose>…</Prose>
</div>;`,
    }),
  },
  {
    id: 'items',
    title: 'The list as data, from a pipeline',
    note: 'A Markdown pipeline hands over a flat array with a level on each heading. nestOutline from @slotted/core/outline folds it into the tree items takes, and the same list renders on the server, which source cannot.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-items',
      language: 'tsx',
      label: 'A flat outline, nested',
      source: `import { nestOutline } from '@slotted/core/outline';

const items = nestOutline(toc); // [{ id, label, level }]

<TableOfContents items={items} label="Neste artigo" />;`,
    }),
  },
  {
    id: 'sticky',
    title: 'A column that stays while the document scrolls',
    note: 'sticky pins the list under the page’s chrome and gives it the rest of the viewport; with more links than fit, the panel scrolls and keeps the current link in view without moving the page. Scroll the document past the tenth section and watch the column follow.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-sticky',
      language: 'tsx',
      label: 'Pinned under the chrome',
      source: `<TableOfContents items={sections} label="On this page" sticky />;`,
    }),
  },
  {
    id: 'horizontal',
    title: 'The bar under a page title',
    note: 'In page-header’s tabs slot, the first level only, one line that scrolls sideways rather than squeezing its labels — the fade at the edge says there is more. Scroll the page: the header collapses, the bar stays, and the marker follows the section under it.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-horizontal',
      language: 'tsx',
      label: 'Inside the header',
      source: `<PageHeaderTabs>
  <TableOfContents items={sections} layout="horizontal" />
</PageHeaderTabs>;`,
    }),
  },
  {
    id: 'collapsed',
    title: 'A phone’s bar',
    note: 'One row: the title, the current section, a chevron. Press it and the list opens in a layer under it; choose a link and it closes, Escape closes it back onto the button, a press outside closes it. The layout is chosen by the consumer’s breakpoint, not by width — the sidebar column is narrower than this bar.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-collapsed',
      language: 'tsx',
      label: 'Switched by the consumer’s breakpoint',
      source: `const phone = useMediaQuery('(max-width: 640px)');

<TableOfContents items={sections} layout={phone ? 'collapsed' : 'vertical'} />;`,
    }),
  },
  {
    id: 'numbered',
    title: 'Clauses, numbered',
    note: 'A supplier contract is read by clause number. numbered draws counters per level — 2., 2.1, 2.2 — in tabular figures, so a column of numbers lines up and a reader on the phone with legal can say “clause 3.2” and mean the same line.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-numbered',
      language: 'tsx',
      label: 'Counters per level',
      source: `<TableOfContents items={clauses} label="Clauses" numbered />;`,
    }),
  },
  {
    id: 'size',
    title: 'Three steps on the control scale',
    note: 'Each step is the control’s height, type and inset at that step, so a list at sm reads beside a small toolbar and one at lg beside a page title. The density switch in the toolbar moves all three.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-size',
      language: 'tsx',
      label: 'The small step',
      source: `<TableOfContents items={sections} size="sm" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover darkens the muted ink toward the page’s text; press goes all the way; the current link takes the accent ink and one step of weight; focus draws the ring inside the row so it never crosses the track. Nothing shifts by a pixel between any two of them.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-states',
      language: 'tsx',
      label: 'The current link, controlled',
      source: `const [section, setSection] = useState<string | null>('enderecos');

<TableOfContents items={sections} onValueChange={setSection} value={section} />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A heading of eleven words wraps to three lines and stays whole; an order reference with no space breaks inside itself rather than widening the column; an Arabic heading reads from the right. The bar cuts nothing either: it scrolls.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-content',
      language: 'tsx',
      label: 'A long heading wraps',
      source: `<TableOfContents
  items={[
    { id: 'ambito', label: 'Scope and definitions used in this document' },
    { id: 'ref', label: 'REF-2026-09-16-INDUSTRIAL-RETURN-000482915' },
  ]}
/>;`,
    }),
  },
  {
    id: 'loading',
    title: 'While the document is still arriving',
    note: 'A record loaded from the server has no sections yet. loading draws four rows of skeleton with an item’s geometry, so the column keeps its width; a list with no entries and nothing loading draws nothing at all.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-loading',
      language: 'tsx',
      label: 'Rows in the list’s place',
      source: `<TableOfContents items={sections ?? []} loading={sections === undefined} />;`,
    }),
  },
  {
    id: 'history',
    title: 'What a press does to the URL',
    note: 'push writes a history entry per section, so Back retraces the reading; replace keeps one entry and updates the hash, which is what a record page wants; none leaves the URL alone. The scroll and the focus are the same in all three; only the address bar differs.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-history',
      language: 'tsx',
      label: 'One entry, updated',
      source: `<TableOfContents history="replace" items={sections} />;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'The provider sets the levels a document outlines, whether the column pins, and what a press does to the URL — and every list under it reads them. The landmark’s name comes from the language in force. A list that states an axis itself still wins: the second one here is lg under a provider that said sm.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-defaults',
      language: 'tsx',
      label: 'The provider',
      source: `<TableOfContentsDefaultsProvider history="replace" levels={[2, 4]} size="sm" sticky>
  <App />
</TableOfContentsDefaultsProvider>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Beside a resizable column, and with its own link',
    note: 'The list sits in a region a splitter sizes; the document scrolls in the body beside it, and the family finds that scroller from the first section without being told. The link is the consumer’s to shape: render hands every attribute to whatever element they return.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-composition',
      language: 'tsx',
      label: 'The link, substituted',
      source: `<TableOfContentsLink render={(props) => <RouterLink {...props} />}>
  Dados gerais
</TableOfContentsLink>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key the contract lists',
    note: 'Tab reaches each link in order. ArrowDown and ArrowUp walk them, Home and End jump to the ends, and in the bar ArrowRight and ArrowLeft do the same along the line. Enter follows the link and lands focus on the section, so the next Tab continues inside it.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-keyboard',
      language: 'tsx',
      label: 'The handle, for the keys the page owns',
      source: `const list = useRef<TableOfContentsHandle>(null);

<TableOfContents items={sections} ref={list} />;
// a page shortcut: list.current?.focus()`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader hears',
    note: 'A navigation landmark named “On this page”, a list of six items, and one link announced as “current location”. After Enter the reader hears the section’s heading, because focus moved there. The collapsed trigger announces expanded and collapsed, and Escape returns to it.',
    snippet: defineSnippet({
      id: 'table-of-contents-react-accessibility',
      language: 'tsx',
      label: 'Named by its label',
      source: `<TableOfContents items={sections} label="On this page" />;
// <nav aria-labelledby="…-label"> … <a aria-current="location">`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the current target moves. The request carries the new id, the id it replaces, the reason — scroll from the observer, pointer or keyboard from a press, programmatic from scrollTo() — the originating event when there is one, and cancel(). A refused scroll request keeps the value; a refused press still scrolls, because the navigation is the anchor’s.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the collapsed list opens or closes. The reason is pointer or keyboard on the trigger, select for a link chosen inside, escape and outsidePress from the layer, programmatic from a consumer.',
  },
  {
    name: 'onClick, onKeyDown, onFocus, onBlur',
    payload: 'the element’s own events',
    when: 'Whenever the link or the root fires them. The consumer’s handler runs first and always runs; preventDefault() in a link’s onClick leaves the press to the platform.',
  },
];

export const REACT_TABLE_OF_CONTENTS_DOCS = {
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
        'TableOfContents',
        'The list as data: { id, label, children? }. children written as parts win over it',
      ],
      [
        'source',
        'RefObject<HTMLElement> | HTMLElement',
        '—',
        'TableOfContents',
        'A region whose headings make the list, read after mount and again when its subtree changes. A heading without an id is given one from its text',
      ],
      [
        'levels',
        '[number, number]',
        '2,3',
        'TableOfContents',
        'The lowest and highest heading level source keeps, inclusive',
      ],
      [
        'exclude',
        'string',
        '—',
        'TableOfContents',
        'A selector: a heading matching it, or inside an element matching it, is left out of source',
      ],
      [
        'scroller',
        'RefObject<HTMLElement> | HTMLElement | null',
        '—',
        'TableOfContents',
        'The element that scrolls. Unset, it is the first target’s nearest scrolling ancestor; null is the viewport',
      ],
      [
        'offset',
        'number',
        '0',
        'TableOfContents',
        'CSS pixels added under the page’s chrome, for the reading line and for where a target lands. The chrome itself is read from --slotted-page-sticky-top',
      ],
      [
        'value',
        'string | null',
        '—',
        'TableOfContents',
        'The current target’s id. Present means the consumer owns it for the life of the component',
      ],
      [
        'defaultValue',
        'string | null',
        'null',
        'TableOfContents',
        'What an uncontrolled list starts from, read once',
      ],
      [
        'open',
        'boolean',
        '—',
        'TableOfContents',
        'Whether the collapsed list is shown. Present means the consumer owns it',
      ],
      [
        'defaultOpen',
        'boolean',
        'false',
        'TableOfContents',
        'What an uncontrolled collapsed list starts from',
      ],
      [
        'layout',
        "'vertical' | 'horizontal' | 'collapsed'",
        'vertical',
        'TableOfContents',
        'The column, the bar, or the trigger with the list under it. The consumer’s breakpoint decides; the family never decides by width',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'TableOfContents',
        'The row step, on the control scale: height, type and inset',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'TableOfContents',
        'Pins the column under the page’s chrome, clear of it by --slotted-table-of-contents-sticky-inset, and gives it the rest of the viewport; the panel scrolls. Ignored in the collapsed layout',
      ],
      [
        'history',
        "'push' | 'replace' | 'none'",
        'push',
        'TableOfContents',
        'What a press does to the URL: pushState, replaceState, or nothing. scrollTo() never writes it',
      ],
      ['numbered', 'boolean', 'false', 'TableOfContents', 'Counters per level before each link'],
      [
        'landmark',
        'boolean',
        'true',
        'TableOfContents',
        'Whether the root is a nav with a name. false renders a div, for a list inside a landmark that already has one',
      ],
      [
        'label',
        'ReactNode',
        '—',
        'TableOfContents',
        'The list’s title, rendered as the label part and used as the landmark’s name. In the collapsed layout it is the trigger’s fixed text',
      ],
      [
        'loading',
        'boolean',
        'false',
        'TableOfContents',
        'Four rows of skeleton in the list’s place, and aria-busy on the root',
      ],
      [
        'messages',
        'Partial<TableOfContentsMessages>',
        '—',
        'TableOfContents',
        'Words laid over the language in force: the landmark’s name when there is no label, and the collapsed trigger’s fixed text (navigation)',
      ],
      [
        'value',
        'string',
        '—',
        'TableOfContentsItem',
        'The target’s id, without the hash. The link inside takes its href from it',
      ],
      [
        'href',
        'string',
        '#<value>',
        'TableOfContentsLink',
        'The fragment. Defaults to the item’s value; a different one is followed as written',
      ],
    ]),
    composition: apiRows([
      [
        'TableOfContentsItem, TableOfContentsLink, TableOfContentsGroup',
        'parts',
        '—',
        'children',
        'The list written by hand: an item per target, a link inside it, a group for its children. The root draws the label, the panel, the list and the marker around them',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'TableOfContents, TableOfContentsItem, TableOfContentsLink, TableOfContentsGroup',
        'Substitutes the element and hands it every attribute the family was going to write. The trigger, the panel and the marker are fixed: the keyboard, aria-controls and the measurement are theirs',
      ],
      [
        'ref',
        'Ref<TableOfContentsHandle>',
        '—',
        'TableOfContents',
        'focus() lands on the first link or the trigger; refresh() reads the headings and measures again; scrollTo(id) lands on a target with the reason programmatic and leaves the URL; root is the element',
      ],
      [
        'TableOfContentsDefaultsProvider',
        '{ layout, size, sticky, history, numbered, landmark, levels, offset }',
        '—',
        'a subtree',
        'The decisions an application takes once. A list that states any of them itself still wins',
      ],
      [
        'aria-label, aria-labelledby, id, className, data-*',
        'the element’s own attributes',
        '—',
        'every part',
        'Every native attribute reaches its element unchanged. A name the consumer writes on the root wins over the label and the messages',
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
        id: 'table-of-contents-react-dom',
        language: 'tsx',
        label: 'The anatomy as it reaches the DOM',
        source: `<nav
  data-ui="table-of-contents"
  data-part="root"
  data-layout="vertical"
  data-size="md"
  aria-labelledby="toc-label"
>
  <div data-part="label" id="toc-label">
    On this page
  </div>
  <div data-part="panel" id="toc-panel">
    <div data-part="marker" aria-hidden="true"></div>
    <ol data-part="list">
      <li data-part="item" data-depth="1" data-value="enderecos" data-current>
        <a data-part="link" href="#enderecos" aria-current="location" data-current>
          Addresses
        </a>
        <ol data-part="group">
          <li data-part="item" data-depth="2" data-value="faturacao">
            <a data-part="link" href="#faturacao">
              Billing
            </a>
          </li>
        </ol>
      </li>
    </ol>
  </div>
</nav>;`,
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
