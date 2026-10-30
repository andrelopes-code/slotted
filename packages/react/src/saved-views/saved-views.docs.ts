import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import savedViewsTokens from '@slotted/styles/saved-views/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SAVED_VIEWS_TOKENS = savedViewsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SavedViews decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SavedViews, usePersistedSavedViews } from '@slotted/react';\nimport type { GridView, SavedViewsState } from '@slotted/core/grid';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'role="group" named by label; data-ui="saved-views", data-modified while the grid differs from the view in use, data-open while the layer is open. The trigger and revert on one row that wraps.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Names the view in use — Default when none is — truncated on one line with the whole name in title and in the DOM, then modified, then a chevron. Opens the popover (aria-haspopup="dialog").',
  },
  {
    part: 'modified',
    element: 'span',
    required: false,
    purpose:
      'Inside the trigger while the grid differs from the view in use: a dot in the accent solid and the word Modified, so the state is never color alone and the trigger’s name says it.',
  },
  {
    part: 'revert',
    element: 'button',
    required: false,
    purpose:
      'Beside the trigger while modified: asks for the view in use again, emits onViewApply with action revert and moves focus to the trigger.',
  },
  {
    part: 'panel',
    element: 'div inside PopoverContent',
    required: true,
    purpose:
      'Carries data-ui="saved-views" itself, because the layer is portalled out of the root. At --slotted-saved-views-panel-inline-size, narrowing when the popover has less room.',
  },
  {
    part: 'list',
    element: 'ul role="list"',
    required: true,
    purpose: 'The built-in view first, then the saved views in the order the state holds them.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One view: data-view with its id, data-current on the view in use, data-default on the default, data-built-in on the built-in view, data-editing while its form or confirmation replaces it.',
  },
  {
    part: 'apply',
    element: 'button',
    required: true,
    purpose:
      'The view’s name across the row; aria-current="true" and a check on the view in use. A long name wraps; nothing is cut.',
  },
  {
    part: 'default-mark',
    element: 'span inside apply',
    required: false,
    purpose:
      'A pin after the name of the view a visit opens on, with the word default hidden for the eye, so the button reads “Late orders default”.',
  },
  {
    part: 'actions',
    element: 'button, a Menu trigger',
    required: true,
    purpose:
      'The row’s menu, named “Actions for {name}”: Rename, Set as default, Delete. On the built-in view only Set as default.',
  },
  {
    part: 'form',
    element: 'form',
    required: false,
    purpose:
      'A Field with the name label, a TextField and the error, then Cancel and the submit: in the row for a rename, above the footer for Save as new view…',
  },
  {
    part: 'footer',
    element: 'div',
    required: true,
    purpose:
      'Save as new view… and Save. Save overwrites the view in use and is disabled on the built-in view and while nothing is modified.',
  },
  {
    part: 'confirm',
    element: 'div role="group"',
    required: false,
    purpose:
      'In the row being deleted: “Delete “{name}”?”, Cancel and Delete in the danger tone. Focus lands on Cancel.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Open the trigger and apply My region: the line below changes to the view the family handed over. Press Sort by total to make the view in use differ from its saved form.',
    snippet: defineSnippet({
      id: 'saved-views-react-playground',
      language: 'tsx',
      label: 'Uncontrolled, over the grid’s current view',
      source: `<SavedViews
  builtIn={defaults}
  columns={columns}
  current={current}
  defaultState={views}
  onViewApply={(view) => setCurrent(view)}
/>;`,
    }),
  },
  {
    id: 'modified-and-revert',
    title: 'Modified, and Revert',
    note: 'The view in use differs from Late orders by its sort: the trigger carries the dot and the word, Revert sits beside it, and Save in the panel is enabled. Revert hands the saved view back through onViewApply.',
    snippet: defineSnippet({
      id: 'saved-views-react-modified',
      language: 'tsx',
      label: 'The comparison is the family’s; the grid is the consumer’s',
      source: `<SavedViews
  builtIn={defaults}
  current={{ ...late, query: { ...late.query, sort: byTotal } }}
  defaultState={views}
  onViewApply={(view, request) => {
    if (request.action === 'revert') setCurrent(view);
  }}
/>;`,
    }),
  },
  {
    id: 'save-as',
    title: 'Save as a new view',
    note: 'Save as new view… opens a named field above the footer. An empty name and a name another view has — case aside, Default included — mark the field invalid with its message; a valid one creates the view from the current one and makes it the view in use.',
    snippet: defineSnippet({
      id: 'saved-views-react-save-as',
      language: 'tsx',
      label: 'What a create request carries',
      source: `const onStateChange = (state: SavedViewsState, request: SavedViewsRequest) => {
  if (request.action === 'create') track('view.created', { count: state.views.length });
  setViews(state);
};`,
    }),
  },
  {
    id: 'rename',
    title: 'Rename in the row',
    note: 'The row’s menu, then Rename: the row becomes the form holding the name, Enter submits with the reason submit and focus returns to the renamed row. Escape cancels the form and leaves the panel open.',
    snippet: defineSnippet({
      id: 'saved-views-react-rename',
      language: 'tsx',
      label: 'Refusing a rename the server rejects',
      source: `const onStateChange = (state: SavedViewsState, request: SavedViewsRequest) => {
  if (request.action === 'rename' && !canRename) request.cancel();
  else setViews(state);
};`,
    }),
  },
  {
    id: 'delete',
    title: 'Delete, confirmed in the row',
    note: 'Delete asks in place, naming the view, with focus on Cancel. Confirming carries the reason remove. Deleting the view in use leaves the built-in view in its place, and the grid keeps its arrangement — which then reads as modified.',
    snippet: defineSnippet({
      id: 'saved-views-react-delete',
      language: 'tsx',
      label: 'A delete request',
      source: `const onStateChange = (state: SavedViewsState, request: SavedViewsRequest) => {
  if (request.action === 'delete') api.deleteView(request.previous.activeId);
  setViews(state);
};`,
    }),
  },
  {
    id: 'default-view',
    title: 'The default view',
    note: 'Set as default moves the pin: that view is the one a visit opens on. With usePersistedSavedViews, a visit whose store holds no view in use opens on the default and hands it over once as openedDefault.',
    snippet: defineSnippet({
      id: 'saved-views-react-default',
      language: 'tsx',
      label: 'Opening on the default view',
      source: `const views = usePersistedSavedViews({ key: 'orders:views', columns });
const grid = usePersistedGridView({
  key: 'orders:grid',
  columns,
  defaultQuery: views.openedDefault?.query,
});`,
    }),
  },
  {
    id: 'built-in',
    title: 'The built-in view',
    note: 'Default is the application’s own arrangement: first in the list, never renamed, overwritten or deleted, and its menu holds Set as default alone. On it Save is disabled; Save as new view… is how a reader keeps a change.',
    snippet: defineSnippet({
      id: 'saved-views-react-built-in',
      language: 'tsx',
      label: 'Starting on the built-in view',
      source: `<SavedViews
  builtIn={defaults}
  current={current}
  defaultState={{ views, defaultId: null, activeId: null }}
/>;`,
    }),
  },
  {
    id: 'persistence',
    title: 'Kept across visits',
    note: 'usePersistedSavedViews reads the store once with parseSavedViews — total, so a malformed entry is no views — and writes serializeSavedViews after each change. The line shows the entry as it is written. A store that throws leaves the views in memory.',
    snippet: defineSnippet({
      id: 'saved-views-react-persistence',
      language: 'tsx',
      label: 'One key in localStorage',
      source: `const views = usePersistedSavedViews({ key: 'orders:views' });

<SavedViews
  builtIn={defaults}
  current={current}
  onStateChange={views.onStateChange}
  state={views.state}
/>;`,
    }),
  },
  {
    id: 'with-data-grid',
    title: 'Over a data grid',
    note: 'The family above a DataGrid bound through usePersistedGridView: the store opens on Late orders, the default. Sort a column, hide one or change the search, and the trigger says Modified; apply High value and the grid takes its sort and its compact density.',
    snippet: defineSnippet({
      id: 'saved-views-react-grid',
      language: 'tsx',
      label: 'The view is the grid’s three values',
      source: `const current = { columns: grid.columnState, query: grid.query, density: grid.density };

<SavedViews
  builtIn={defaults}
  columns={columns}
  current={current}
  onStateChange={views.onStateChange}
  onViewApply={(view) => {
    grid.onQueryChange(view.query, request);
    grid.onColumnStateChange(view.columns, request);
    grid.onDensityChange(view.density);
  }}
  state={views.state}
/>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab to the trigger and press Enter: focus lands on the view in use. Tab walks apply and actions row by row, then the footer. In a form Enter submits and Escape cancels the form without closing the panel; a second Escape closes it and focus returns to the trigger.',
    snippet: defineSnippet({
      id: 'saved-views-react-keyboard',
      language: 'tsx',
      label: 'Opening from the application',
      source: `const views = useRef<SavedViewsHandle>(null);

useHotkey('Mod+Shift+V', () => views.current?.open());`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The root is a group named Views; the trigger says the view and Modified; the view in use carries aria-current; the default reads “default” after its name. Applying, saving, renaming, deleting and moving the default are announced politely.',
    snippet: defineSnippet({
      id: 'saved-views-react-a11y',
      language: 'tsx',
      label: 'Naming the group in context',
      source: `<SavedViews aria-label="Order views" builtIn={defaults} current={current} />;`,
    }),
  },
  {
    id: 'long-names',
    title: 'Long names',
    note: 'A name longer than the trigger is cut with an ellipsis there, with the whole name in title and in the accessible name; in the list it wraps, and a single unbroken reference breaks anywhere rather than pushing the actions out of the row.',
    snippet: defineSnippet({
      id: 'saved-views-react-long',
      language: 'tsx',
      label: 'The names a desk writes',
      source: `const views = {
  views: [{ id: 'mw', name: 'Late orders from the Midwest distributors', view }],
  defaultId: 'mw',
  activeId: 'mw',
};`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onStateChange',
    payload:
      '(state: SavedViewsState, request: { value, previous, reason, action, source, cancelled, cancel() })',
    when: 'Before the views move: apply, save, create, rename, delete, default. Reasons pointer and keyboard from presses, submit from a form, remove from a confirmed delete, programmatic from the handle. Not emitted when the state would not change; cancel() refuses the change and nothing is applied.',
  },
  {
    name: 'onViewApply',
    payload: '(view: GridView, request)',
    when: 'After an apply or a revert the state request did not refuse: the saved view parsed with parseGridView against columns, or builtIn for the built-in view. The consumer writes it into the grid.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the layer moves: pointer or keyboard on the trigger, escape, outsidePress, apply and save closing it, programmatic from the handle. Escape with a form open is not emitted: the form is cancelled instead.',
  },
];

export const REACT_SAVED_VIEWS_DOCS = {
  savedViews: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'current',
        'GridView',
        '—',
        'SavedViews',
        'The view the grid shows now: its column state, query and density. Compared with the view in use by sameGridView',
      ],
      [
        'builtIn',
        'GridView',
        '—',
        'SavedViews',
        'The built-in view, named messages.builtIn: the application’s defaults, handed back when it is applied',
      ],
      [
        'columns',
        'readonly GridColumn[]',
        '—',
        'SavedViews',
        'The model, so views are serialized and compared against the columns they name',
      ],
      [
        'state',
        'SavedViewsState',
        '—',
        'SavedViews',
        'Present means the consumer owns the views, for the life of the component: { views, defaultId, activeId }',
      ],
      [
        'defaultState',
        'SavedViewsState',
        'no views',
        'SavedViews',
        'The views an uncontrolled instance starts from, read once',
      ],
      ['open', 'boolean', '—', 'SavedViews', 'Present means the consumer owns the layer'],
      [
        'defaultOpen',
        'boolean',
        'false',
        'SavedViews',
        'The layer an uncontrolled instance starts with',
      ],
      [
        'messages',
        'Partial<SavedViewsMessages>',
        '—',
        'SavedViews',
        'Words laid over the language in force, key by key: the group’s and the panel’s name (label) and every other word; {name} is the view’s name',
      ],
      [
        'ref',
        'Ref<SavedViewsHandle>',
        '—',
        'SavedViews',
        'element, focus(), open(), close(), apply(id) — the last three with the reason programmatic',
      ],
      [
        'usePersistedSavedViews',
        '({ key, storage?, columns? }) => { state, onStateChange, openedDefault }',
        'localStorage',
        'a hook',
        'Reads once, writes after every change, tolerates a store that throws; null keeps the views in memory',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"div">',
        '—',
        'SavedViews',
        'aria-*, data-*, className, style and handlers reach the root; a consumer’s aria-label or role wins',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA Authoring Practices pattern covers a list of named views, so the family is built from the ones that do: the trigger opens a non-modal dialog (aria-haspopup="dialog", aria-expanded, aria-controls) held by the popover family, and each row’s actions control is the Menu Button pattern held by the menu family. Inside the panel everything is a native button, a list and a form in native tab order.',
      'The root is a group named Views, so the trigger reads “Late orders Modified, button, Views group”. The view in use carries aria-current="true" and a check; the default view reads “default” after its name from a hidden word beside the pin. Modified is a word and a dot, never the dot alone.',
      'Escape inside a form or a confirmation cancels it and keeps the panel open — the popover asks to close in the capture phase and the family refuses that request; a second Escape closes the panel and focus returns to the trigger. A submitted form focuses the row it changed, a cancelled one the control that opened it, a confirmed delete the row above.',
      'An empty or duplicate name marks the field invalid, and the error joins the input’s description through the field family. Applying, saving, renaming, deleting and moving the default are announced politely through the shared live announcer, because each changes something outside the focused control.',
    ],
    snippets: [
      defineSnippet({
        id: 'saved-views-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="saved-views" data-part="root" role="group" aria-label="Views" data-modified>
  <button data-part="trigger" aria-haspopup="dialog" aria-expanded="true" title="Late orders">
    <span data-label>Late orders</span>
    <span data-part="modified">Modified</span>
  </button>
  <button data-part="revert">Revert</button>
</div>;

<div data-ui="saved-views" data-part="panel">
  <ul data-part="list" role="list">
    <li data-part="item" data-view="__default" data-built-in>
      …
    </li>
    <li data-part="item" data-view="late" data-current data-default>
      <button data-part="apply" aria-current="true">
        <span data-label>Late orders</span>
        <span data-part="default-mark">
          <span>default</span>
        </span>
      </button>
      <button data-part="actions" aria-haspopup="menu" aria-label="Actions for Late orders" />
    </li>
  </ul>
  <div data-part="footer">…</div>
</div>;`,
      }),
      defineSnippet({
        id: 'saved-views-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='saved-views'] {
  --slotted-saved-views-panel-inline-size: 22rem;
}`,
      }),
    ],
  },
} as const;
