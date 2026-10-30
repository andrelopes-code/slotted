import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dashboardGridTokens from '@slotted/styles/dashboard-grid/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DASHBOARD_GRID_TOKENS = dashboardGridTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Dashboard Grid decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  DashboardGrid,\n  DashboardWidget,\n  DashboardGridDefaultsProvider,\n  usePersistedDashboardLayout,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'data-ui="dashboard-grid", data-editing while editing. The container named dashboard-grid whose inline size picks the size class; the column counts reach it as --_dg-columns-*.',
  },
  {
    part: 'edit-bar',
    element: 'div',
    required: false,
    purpose:
      'role="group" named messages.editBar, above the grid while editing and editBar is true.',
  },
  {
    part: 'edit-status',
    element: 'p',
    required: false,
    purpose:
      'The instructions every handle is described by. Visually hidden, and still referenced, when editBar is false.',
  },
  {
    part: 'edit-actions',
    element: 'div',
    required: false,
    purpose:
      'Add widget, Reset layout, Cancel and Done at the bar’s inline end; wraps under the status.',
  },
  {
    part: 'add',
    element: 'button, a Button and a Menu trigger',
    required: false,
    purpose: 'A menu of the hidden widgets by title. Present only while a widget is hidden.',
  },
  {
    part: 'reset',
    element: 'button, a Button',
    required: false,
    purpose:
      'Asks for the empty layout: every widget at its defaults, in the order of the children.',
  },
  {
    part: 'cancel',
    element: 'button, a Button',
    required: false,
    purpose: 'Asks for the layout editing began from, then leaves editing.',
  },
  {
    part: 'done',
    element: 'button, a Button',
    required: false,
    purpose: 'Leaves editing with the reason submit.',
  },
  {
    part: 'grid',
    element: 'ul role="list"',
    required: true,
    purpose:
      'One element in from the root, so the container query can change its tracks. Named by the aria-label or aria-labelledby written on DashboardGrid.',
  },
  {
    part: 'widget',
    element: 'li',
    required: true,
    purpose:
      'One per visible widget, placed at its cell by --_dg-x, --_dg-y, --_dg-w and --_dg-h, and by --_dg-span-medium in the medium class. data-key, data-status, data-loading, data-movable, data-resizable, data-dragging, data-resizing.',
  },
  {
    part: 'title',
    element: 'h2 to h6',
    required: true,
    purpose:
      'The widget’s heading at headingLevel; two lines, then an ellipsis. Names the article.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose: 'The line under the title; describes the article.',
  },
  {
    part: 'detail',
    element: 'a, or button',
    required: false,
    purpose:
      'The external glyph and “Open {title}”: an a for detailHref, a button for onDetail alone.',
  },
  {
    part: 'handle',
    element: 'button, a Menu trigger',
    required: false,
    purpose:
      'While editing, a pill of six dots standing on the card’s top edge: the widget’s keyboard stop, its menu, and where a finger picks it up. Alt+Arrow moves, Shift+Arrow resizes, Delete hides.',
  },
  {
    part: 'skeleton',
    element: 'div',
    required: false,
    purpose: 'While loading: the consumer’s skeleton, or one Skeleton block filling the body.',
  },
  {
    part: 'message',
    element: 'div around a ResultState',
    required: false,
    purpose:
      'status="empty" or "error", centred in the body; the error names Try again when onRetry is given.',
  },
  {
    part: 'retry',
    element: 'button, a Button',
    required: false,
    purpose: 'Try again under the error message; calls onRetry.',
  },
  {
    part: 'busy-indicator',
    element: 'span',
    required: false,
    purpose:
      'A line along the top of the body while busy; aria-hidden, since the article carries aria-busy.',
  },
  {
    part: 'resize-handle',
    element: 'span',
    required: false,
    purpose:
      'Five per widget while editing and resizable, data-edge start, end, bottom, bottom-start or bottom-end: a strip straddling the edge with a pill at its middle, or an arc on a bottom corner. data-active on the one being pulled. aria-hidden: the keyboard’s path is Shift+Arrow and the menu.',
  },
  {
    part: 'size-readout',
    element: 'span',
    required: false,
    purpose:
      '“10 × 4” on a chip of the accent at the corner being pulled, while a pointer resizes the widget; aria-hidden, the change is announced.',
  },
  {
    part: 'placeholder',
    element: 'li',
    required: false,
    purpose:
      'During a gesture: the cells the widget in hand will land in, in the accent’s lightest wash with a hairline; aria-hidden.',
  },
  {
    part: 'empty',
    element: 'div around a ResultState',
    required: false,
    purpose: 'In place of the grid when no widget is visible.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Trailhead’s sales overview on the page’s sunken ground: four figures, a chart and a table, each filling its widget. Edit layout enters the mode; every request is written under the grid with its change, its key and its reason.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-playground',
      language: 'tsx',
      label: 'A controlled dashboard',
      source: `const [layout, setLayout] = useState<DashboardLayout>([]);
const [editing, setEditing] = useState(false);

<DashboardGrid
  aria-label="Sales overview"
  editing={editing}
  layout={layout}
  onEditingChange={setEditing}
  onLayoutChange={setLayout}
>
  <DashboardWidget defaultColumns={3} title="Revenue" value="revenue">
    <RevenueFigure />
  </DashboardWidget>
  <DashboardWidget defaultColumns={8} defaultRows={4} title="Revenue by week" value="trend">
    <RevenueTrend />
  </DashboardWidget>
</DashboardGrid>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'What a widget is made of',
    note: 'While editing, a pill stands on each card’s top edge — its handle — and its sides and bottom corners take a pull. The header keeps the title, the description, the consumer’s Export and the way to the widget’s own page.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-anatomy',
      language: 'tsx',
      label: 'Every slot of a widget',
      source: `<DashboardWidget
  actions={<Button size="sm">Export</Button>}
  description="Last twelve weeks, all channels"
  detailHref="/reports/revenue"
  footer={<Text size="sm">Updated 4 minutes ago</Text>}
  title="Revenue by week"
  value="trend"
>
  <RevenueTrend />
</DashboardWidget>;`,
    }),
  },
  {
    id: 'editing',
    title: 'An explicit edit mode',
    note: 'A dot marks the middle of every free cell, the handles pop in, and the bar offers Add widget for the hidden Refunds, Reset, Cancel and Done. A card carried to another cell pushes what it covers down, and Cancel returns the layout editing started from.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-editing',
      language: 'tsx',
      label: 'The mode is a value like the layout',
      source: `<Button onClick={() => setEditing(true)}>Edit layout</Button>;

<DashboardGrid editing={editing} onEditingChange={setEditing}>
  …
</DashboardGrid>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every change from the keyboard',
    note: 'Tab to a handle: Alt with an arrow moves the widget a column, or trades places with the widget above or below; Shift with an arrow pulls its end or bottom edge; Delete hides it; Enter opens the same choices as a menu. Focus stays on the handle.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-keyboard',
      language: 'tsx',
      label: 'Nothing to wire',
      source: `<DashboardGrid defaultEditing>…</DashboardGrid>;`,
    }),
  },
  {
    id: 'constraints',
    title: 'Sizes and places a widget allows',
    note: 'Revenue is pinned: the others flow around it. Revenue by week never falls under four columns and three rows; Conversion has no edges to pull; Top products cannot be hidden, so its menu has no Hide.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-constraints',
      language: 'tsx',
      label: 'Limits belong to the widget',
      source: `<DashboardWidget movable={false} title="Revenue" value="revenue" />;
<DashboardWidget minColumns={4} minRows={3} title="Revenue by week" value="trend" />;
<DashboardWidget resizable={false} title="Conversion" value="conversion" />;
<DashboardWidget removable={false} title="Top products" value="products" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Waiting, refreshing, empty and failed',
    note: 'The header stays painted while the body waits: one block where the anatomy is unknown, the table’s own rows where it is. A refresh keeps the figure under a moving line; empty offers the next step, and failure offers Try again.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-states',
      language: 'tsx',
      label: 'Four states of one widget',
      source: `<DashboardWidget
  loading={pending}
  skeleton={<TopProductsSkeleton />}
  title="Top products"
  value="products"
/>;
<DashboardWidget busy={refreshing} title="Orders" value="orders" />;
<DashboardWidget
  emptyAction={<Button>Record a refund</Button>}
  status="empty"
  title="Refunds"
  value="refunds"
/>;
<DashboardWidget onRetry={() => refetch()} status="error" title="Conversion" value="conversion" />;`,
    }),
  },
  {
    id: 'responsive',
    title: 'One layout, three widths',
    note: 'One layout, three classes of the grid’s own width: from 1024 pixels every widget stands at its cell of twelve columns; from 600 the same order flows in halves and wholes; below 600 it is one column, each widget as tall as its content.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-responsive',
      language: 'tsx',
      label: 'Columns per class, when the halves do not suit',
      source: `<DashboardGrid columns={{ expanded: 12, medium: 6, compact: 1 }}>…</DashboardGrid>;`,
    }),
  },
  {
    id: 'persistence',
    title: 'A layout kept across visits',
    note: 'Carry or pull a widget and reload the page: the layout comes back from localStorage under the key trailhead-sales. Forget layout clears it. Text the store cannot read falls back to the default.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-persistence',
      language: 'tsx',
      label: 'The application names the store and the key',
      source: `const persisted = usePersistedDashboardLayout({ key: 'trailhead-sales' });

<DashboardGrid layout={persisted.layout} onLayoutChange={persisted.onLayoutChange}>
  …
</DashboardGrid>;`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for another product',
    note: 'Every word comes from the language in force: the bar, the handle’s name, the menu, the size readout and the announcements. SlottedProvider sets Portuguese here, and the defaults provider the heading level.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-labels',
      language: 'tsx',
      label: 'Portuguese, set once',
      source: `<SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
  <DashboardGridDefaultsProvider headingLevel={2}>
    <App />
  </DashboardGridDefaultsProvider>
</SlottedProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Names, shortcuts and announcements',
    note: 'The grid is a list named Sales overview, each widget an article named by its title. Here the page owns the controls: editBar is off, the instructions stay as the handles’ description, and Done in the page calls commitEditing.',
    snippet: defineSnippet({
      id: 'dashboard-grid-react-accessibility',
      language: 'tsx',
      label: 'The page’s own Done',
      source: `const grid = useRef<DashboardGridHandle>(null);

<Button onClick={() => grid.current?.commitEditing()}>Done</Button>;
<DashboardGrid aria-label="Sales overview" editBar={false} ref={grid}>
  …
</DashboardGrid>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onLayoutChange',
    payload:
      "(layout: DashboardLayout, request: ChangeRequest<DashboardLayout> & { change: { kind: 'move' | 'resize' | 'hide' | 'show' | 'reset' | 'cancel'; key: string | null } })",
    when: 'Once per gesture, at its end: a card dropped or an edge released (pointer), Alt+Arrow, Shift+Arrow or a menu item (keyboard or pointer), Delete or Hide (remove), Cancel (dismiss). The layout carries every widget at its cell, { key, x, y, w, h, hidden? }, and keeps entries no widget holds. cancel() refuses it.',
  },
  {
    name: 'onEditingChange',
    payload: '(editing: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the mode changes: Done (submit), Cancel (the press’s pointer or keyboard, after the layout request), commitEditing() and cancelEditing() (programmatic).',
  },
  {
    name: 'onRetry',
    payload: '(event: MouseEvent)',
    when: 'On DashboardWidget, when Try again under the error message is pressed.',
  },
  {
    name: 'onDetail',
    payload: '(event: MouseEvent)',
    when: 'On DashboardWidget, when the detail action is pressed; it is the only handler when no detailHref is given.',
  },
  {
    name: 'onKeyDown and the other native handlers',
    payload: 'the element’s own event',
    when: 'Reach the root and each li. The handle’s own keys are handled before its menu reads them, and a consumer handler on the grid still runs.',
  },
];

export const REACT_DASHBOARD_GRID_DOCS = {
  'dashboard-grid': {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'layout',
        'DashboardLayout',
        '—',
        'DashboardGrid',
        'Where each widget stands and how big it is: [{ key, x, y, w, h, hidden? }] in cells of the expanded class. Present means controlled',
      ],
      [
        'defaultLayout',
        'DashboardLayout',
        '[]',
        'DashboardGrid',
        'The uncontrolled start, read once, and what Reset asks for, controlled or not. A widget it does not name takes the first cell it fits, in the order of the children',
      ],
      ['editing', 'boolean', 'false', 'DashboardGrid', 'The edit mode. Present means controlled'],
      ['defaultEditing', 'boolean', 'false', 'DashboardGrid', 'The uncontrolled mode, read once'],
      [
        'columns',
        'number | { expanded, medium, compact }',
        '12',
        'DashboardGrid, DashboardGridDefaultsProvider',
        'Columns from 1024 pixels of the grid’s width; below it the widgets flow in halves and wholes of half as many, and below 600 in one column',
      ],
      [
        'editBar',
        'boolean',
        'true',
        'DashboardGrid, DashboardGridDefaultsProvider',
        'Whether the family draws Add, Reset, Cancel and Done while editing',
      ],
      [
        'headingLevel',
        "'auto' | 2 | 3 | 4 | 5 | 6",
        'auto',
        'DashboardGrid, DashboardWidget, DashboardGridDefaultsProvider',
        'The level of each widget’s title; auto is one rank under the heading around the grid — h2 in a page body, one deeper inside a section — and never above h2',
      ],
      [
        'expandedFrom',
        'number',
        '1024',
        'DashboardGrid',
        'The grid’s own width, in pixels, from which the expanded class applies; a grid beside a navigation rail keeps its layout with a lower value',
      ],
      [
        'messages',
        'Partial<DashboardGridMessages>',
        '—',
        'DashboardGrid',
        'Words laid over the language in force, key by key: editBar, editStatus, add, reset, cancel, done, handle, detail, retry, emptyTitle, errorTitle, empty, emptyEditing, the eight menu items, hide, size, moved, movedInOrder, resized, hidden, shown, resetDone, cancelled',
      ],
      [
        'ref',
        'Ref<DashboardGridHandle>',
        '—',
        'DashboardGrid',
        'element, focusWidget(key), commitEditing(), cancelEditing()',
      ],
      [
        'render',
        '(props: DashboardGridRootProps) => ReactElement',
        'a div',
        'DashboardGrid',
        'Substitutes the root element',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"div">',
        '—',
        'DashboardGrid',
        'id, className, style, data-* and handlers reach the root; aria-label and aria-labelledby name the list',
      ],
      [
        'value',
        'string',
        '—',
        'DashboardWidget',
        'The widget’s key in the layout. Required. Read from the grid’s child, inside a fragment too; a widget a component of the application renders declares it once mounted, so it is placed after the first paint',
      ],
      [
        'title',
        'string',
        '—',
        'DashboardWidget',
        'The heading, the article’s name, the handle’s name and the entry in Add widget. Required',
      ],
      ['description', 'ReactNode', '—', 'DashboardWidget', 'The line under the title'],
      [
        'defaultColumns',
        'number',
        '4',
        'DashboardWidget',
        'Expanded columns of a widget the layout does not name',
      ],
      [
        'defaultRows',
        'number',
        '2',
        'DashboardWidget',
        'Rows of a widget the layout does not name',
      ],
      [
        'rows',
        "'auto'",
        '—',
        'DashboardWidget',
        'Draws the widget as tall as its content, to a twelfth of a row’s step, and the widgets below rise or make room; at least one sub-row, or minRows when stated, at most maxRows. Moves and resizes read the content’s rows, rounded up',
      ],
      [
        'minColumns',
        'number',
        '2',
        'DashboardWidget',
        'The fewest expanded columns a resize leaves',
      ],
      [
        'maxColumns',
        'number',
        'columns',
        'DashboardWidget',
        'The most expanded columns a resize gives',
      ],
      ['minRows', 'number', '2', 'DashboardWidget', 'The fewest rows a resize leaves'],
      ['maxRows', 'number', '—', 'DashboardWidget', 'The most rows a resize gives'],
      [
        'movable',
        'boolean',
        'true',
        'DashboardWidget',
        'false fixes the widget at its cell; the others flow around it',
      ],
      [
        'resizable',
        'boolean',
        'true',
        'DashboardWidget',
        'false removes the edges, Shift+Arrow and the size items',
      ],
      ['removable', 'boolean', 'true', 'DashboardWidget', 'false removes Delete and Hide'],
      [
        'loading',
        'boolean',
        'false',
        'DashboardWidget',
        'The first answer has not arrived: the body shows a skeleton, with the skeleton family’s delay and minDuration',
      ],
      [
        'busy',
        'boolean',
        'false',
        'DashboardWidget',
        'A refresh of what is shown: the content stays, the article is aria-busy, a line moves along the top',
      ],
      [
        'status',
        "'ready' | 'empty' | 'error'",
        'ready',
        'DashboardWidget',
        'What the body says when it is not the content',
      ],
      [
        'skeleton',
        'ReactNode',
        'one block',
        'DashboardWidget',
        'The skeleton of the body’s own anatomy',
      ],
      [
        'emptyTitle / emptyDescription / emptyAction',
        'ReactNode',
        'messages.emptyTitle / — / —',
        'DashboardWidget',
        'The empty message and the action that creates the first entry',
      ],
      [
        'errorTitle / errorDescription',
        'ReactNode',
        'messages.errorTitle / —',
        'DashboardWidget',
        'The error message',
      ],
      [
        'detailHref',
        'string',
        '—',
        'DashboardWidget',
        'The widget’s own page, as a link in the corner',
      ],
      [
        'renderDetail',
        '(props: DashboardDetailProps) => ReactElement',
        '—',
        'DashboardWidget',
        'Renders the detail link — a router’s link — from the props the family gives it, href included; spread them all on the element returned',
      ],
      [
        'actions',
        'ReactNode',
        '—',
        'DashboardWidget',
        'The consumer’s controls in the header’s corner',
      ],
      ['footer', 'ReactNode', '—', 'DashboardWidget', 'Content under the body'],
      [
        'fill / size',
        'CardFill / CardSize',
        'outline / md',
        'DashboardWidget',
        'The card’s own axes',
      ],
      [
        'render',
        '(props: DashboardWidgetRootProps) => ReactElement',
        'an li',
        'DashboardWidget',
        'Substitutes the li; keep props.ref, the grid measures against it',
      ],
      [
        'DashboardGridDefaultsProvider',
        '{ columns, editBar, headingLevel }',
        '—',
        'a subtree',
        'The decisions an application takes once; an instance that states any of them wins. The words come from the language in force (SlottedProvider)',
      ],
      [
        'usePersistedDashboardLayout',
        '({ key, storage?, defaultLayout? }) => { layout, defaultLayout, onLayoutChange, clear }',
        'localStorage',
        'a component',
        'Reads the stored layout once and writes every change; a store that throws reads as empty. Spread on the grid, its defaultLayout is what Reset asks for',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a dashboard; the APG’s Listboxes with Rearrangeable Options example gives the move keys the family uses — Alt with an arrow, Delete to remove, focus kept on what moved, and a live confirmation — and each handle states its shortcuts in aria-keyshortcuts.',
      'The grid is a native list with role="list" restated, since a list styled as a grid loses its role in WebKit, and each widget is an li holding an article named by its heading, so a reader hears “Sales overview, list, 6 items” and walks the widgets by heading.',
      'The DOM holds the widgets by row and then column, so the order of Tab and of a screen reader is the order of the picture at every width; a gesture previews with CSS order and moves no element until it ends.',
      'Everything a pointer does has a single-pointer path, as WCAG 2.2 SC 2.5.7 asks: the handle is a menu button (Enter, Space or ArrowDown) whose items move, resize and hide the widget.',
      'Every change is announced once through the shared polite live region — “Orders moved to row 1, column 5”, “Revenue by week is 10 columns by 4 rows”, “Refunds hidden” — and the grid takes no key from the content inside a widget.',
      'Escape cancels a carry or a pull in progress and does not leave editing: throwing a rearranged dashboard away takes Cancel. A finger picks a widget up by its handle, so a finger on a card still scrolls the page.',
    ],
    snippets: [
      defineSnippet({
        id: 'dashboard-grid-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="dashboard-grid" data-part="root" data-editing="">
  <div data-part="edit-bar" role="group" aria-label="Layout">
    <p data-part="edit-status" id=":r1:-edit-status">
      Editing layout…
    </p>
    <div data-part="edit-actions">…</div>
  </div>
  <ul data-part="grid" role="list" aria-label="Sales overview">
    <li data-part="widget" data-key="revenue" data-status="ready" data-movable="" data-resizable="">
      <article data-ui="card" aria-labelledby=":r2:-title">
        <div data-part="header">
          <h3 data-part="title" id=":r2:-title">
            Revenue
          </h3>
          <div data-part="actions">
            <a data-part="detail" aria-label="Open Revenue" href="#revenue">
              …
            </a>
          </div>
        </div>
        <div data-part="body">…</div>
      </article>
      <button data-part="handle" aria-haspopup="menu" aria-describedby=":r1:-edit-status">
        …
      </button>
      <span data-part="resize-handle" data-edge="end" aria-hidden="true" />
    </li>
  </ul>
</div>;`,
      }),
      defineSnippet({
        id: 'dashboard-grid-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='dashboard-grid'] {
  --slotted-dashboard-grid-row-size: 5rem;
  --slotted-dashboard-grid-gap: var(--slotted-space-8);
}`,
      }),
    ],
  },
} as const;
