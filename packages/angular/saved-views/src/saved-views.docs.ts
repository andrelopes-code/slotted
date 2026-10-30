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

export const ANGULAR_SAVED_VIEWS_TOKENS = savedViewsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlSavedViews decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlSavedViews, persistedSavedViews } from '@slotted/angular/saved-views';\nimport type { GridView, SavedViewsState } from '@slotted/core/grid';",
  selector: 'sl-saved-views',
  exportAs: 'slSavedViews',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-saved-views',
    required: true,
    purpose:
      'The host: role="group" named by label, data-ui="saved-views", data-modified while the grid differs from the view in use, data-open while the layer is open. A role or aria-label written on the host wins.',
  },
  {
    part: 'trigger',
    element: 'button[slPopoverTrigger]',
    required: true,
    purpose:
      'Names the view in use — Default when none is — truncated on one line with the whole name in title and in the DOM, then modified, then a chevron. Opens the popover (aria-haspopup="dialog").',
  },
  {
    part: 'modified',
    element: 'span',
    required: false,
    purpose:
      'Inside the trigger while the grid differs from the view in use: a dot in the accent solid and the word Modified, so the state is never color alone.',
  },
  {
    part: 'revert',
    element: 'button',
    required: false,
    purpose:
      'Beside the trigger while modified: asks for the view in use again, emits viewApply with action revert and moves focus to the trigger.',
  },
  {
    part: 'panel',
    element: 'div inside slPopoverContent',
    required: true,
    purpose:
      'Carries data-ui="saved-views" itself, because the layer is portalled out of the host. At --slotted-saved-views-panel-inline-size, narrowing when the popover has less room.',
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
    element: 'button[slMenuTriggerFor]',
    required: true,
    purpose:
      'The row’s sl-menu, named “Actions for {name}”: Rename, Set as default, Delete. On the built-in view only Set as default.',
  },
  {
    part: 'form',
    element: 'form',
    required: false,
    purpose:
      'An slField with the name label, an slTextField and the slFieldError, then Cancel and the submit: in the row for a rename, above the footer for Save as new view…',
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
      id: 'saved-views-angular-playground',
      language: 'angular',
      label: 'Unbound state, over the grid’s current view',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [columns]="columns"
  [current]="current()"
  [defaultState]="views"
  (viewApply)="current.set($event.view)"
/>`,
    }),
  },
  {
    id: 'modified-and-revert',
    title: 'Modified, and Revert',
    note: 'The view in use differs from Late orders by its sort: the trigger carries the dot and the word, Revert sits beside it, and Save in the panel is enabled. Revert hands the saved view back through viewApply.',
    snippet: defineSnippet({
      id: 'saved-views-angular-modified',
      language: 'angular',
      label: 'The comparison is the family’s; the grid is the consumer’s',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [current]="current()"
  [(state)]="views"
  (viewApply)="current.set($event.view)"
/>`,
    }),
  },
  {
    id: 'save-as',
    title: 'Save as a new view',
    note: 'Save as new view… opens a named field above the footer. An empty name and a name another view has — case aside, Default included — mark the field invalid with its message; a valid one creates the view from the current one and makes it the view in use.',
    snippet: defineSnippet({
      id: 'saved-views-angular-save-as',
      language: 'angular',
      label: 'What a create request carries',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [current]="current()"
  [(state)]="views"
  (stateChangeRequest)="$event.action === 'create' && track($event.value.views.length)"
/>`,
    }),
  },
  {
    id: 'rename',
    title: 'Rename in the row',
    note: 'The row’s menu, then Rename: the row becomes the form holding the name, Enter submits with the reason submit and focus returns to the renamed row. Escape cancels the form and leaves the panel open.',
    snippet: defineSnippet({
      id: 'saved-views-angular-rename',
      language: 'angular',
      label: 'Refusing a rename the server rejects',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [current]="current()"
  [(state)]="views"
  (stateChangeRequest)="$event.action === 'rename' && !canRename && $event.cancel()"
/>`,
    }),
  },
  {
    id: 'delete',
    title: 'Delete, confirmed in the row',
    note: 'Delete asks in place, naming the view, with focus on Cancel. Confirming carries the reason remove. Deleting the view in use leaves the built-in view in its place, and the grid keeps its arrangement — which then reads as modified.',
    snippet: defineSnippet({
      id: 'saved-views-angular-delete',
      language: 'angular',
      label: 'A delete request',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [current]="current()"
  [(state)]="views"
  (stateChangeRequest)="$event.action === 'delete' && api.deleteView($event.previous)"
/>`,
    }),
  },
  {
    id: 'default-view',
    title: 'The default view',
    note: 'Set as default moves the pin: that view is the one a visit opens on. With persistedSavedViews, a visit whose store holds no view in use opens on the default and hands it over once as openedDefault.',
    snippet: defineSnippet({
      id: 'saved-views-angular-default',
      language: 'ts',
      label: 'Opening on the default view',
      source: `const views = persistedSavedViews({ key: 'orders:views', columns });
const grid = persistedGridView({
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
      id: 'saved-views-angular-built-in',
      language: 'angular',
      label: 'Starting on the built-in view',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [current]="current()"
  [defaultState]="{ views: views, defaultId: null, activeId: null }"
/>`,
    }),
  },
  {
    id: 'persistence',
    title: 'Kept across visits',
    note: 'persistedSavedViews reads the store once with parseSavedViews — total, so a malformed entry is no views — and writes serializeSavedViews after each change from an effect. The field shows the entry as it is written. A store that throws leaves the views in memory.',
    snippet: defineSnippet({
      id: 'saved-views-angular-persistence',
      language: 'angular',
      label: 'One key in localStorage',
      source: `<sl-saved-views [builtIn]="defaults" [current]="current()" [(state)]="views.state" />`,
    }),
  },
  {
    id: 'with-data-grid',
    title: 'Over a data grid',
    note: 'The family above an sl-data-grid bound through persistedGridView: the store opens on Late orders, the default. Sort a column, hide one or change the search, and the trigger says Modified; apply High value and the grid takes its sort and its compact density.',
    snippet: defineSnippet({
      id: 'saved-views-angular-grid',
      language: 'angular',
      label: 'The view is the grid’s three signals',
      source: `<sl-saved-views
  [builtIn]="defaults"
  [columns]="columns"
  [current]="{ columns: grid.columnState(), query: grid.query(), density: grid.density() }"
  [(state)]="views.state"
  (viewApply)="write($event.view)"
/>
<sl-data-grid
  aria-label="Orders"
  rowKey="id"
  [columns]="columns"
  [rows]="orders"
  [(query)]="grid.query"
  [(columnState)]="grid.columnState"
  [density]="grid.density()"
/>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab to the trigger and press Enter: focus lands on the view in use. Tab walks apply and actions row by row, then the footer. In a form Enter submits and Escape cancels the form without closing the panel; a second Escape closes it and focus returns to the trigger.',
    snippet: defineSnippet({
      id: 'saved-views-angular-keyboard',
      language: 'angular',
      label: 'Opening from the application',
      source: `<button slButton type="button" (click)="views.show()">Open the views</button>
<sl-saved-views #views="slSavedViews" [builtIn]="defaults" [current]="current()" />`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The host is a group named Views; the trigger says the view and Modified; the view in use carries aria-current; the default reads “default” after its name. Applying, saving, renaming, deleting and moving the default are announced politely.',
    snippet: defineSnippet({
      id: 'saved-views-angular-a11y',
      language: 'ts',
      label: 'Translated once for the application',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
  {
    id: 'long-names',
    title: 'Long names',
    note: 'A name longer than the trigger is cut with an ellipsis there, with the whole name in title and in the accessible name; in the list it wraps, and a single unbroken reference breaks anywhere rather than pushing the actions out of the row.',
    snippet: defineSnippet({
      id: 'saved-views-angular-long',
      language: 'ts',
      label: 'The names a desk writes',
      source: `const views: SavedViewsState = {
  views: [{ id: 'mw', name: 'Late orders from the Midwest distributors', view }],
  defaultId: 'mw',
  activeId: 'mw',
};`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'stateChangeRequest',
    payload: 'SavedViewsRequest — { value, previous, reason, action, source, cancelled, cancel() }',
    when: 'Before the views move: apply, save, create, rename, delete, default. Reasons pointer and keyboard from presses, submit from a form, remove from a confirmed delete, programmatic from apply(). Not emitted when the state would not change; cancel() keeps the model where it was and nothing is applied.',
  },
  {
    name: 'stateChange',
    payload: 'SavedViewsState',
    when: 'The model’s own event, after a request that was not refused; what [(state)] binds.',
  },
  {
    name: 'viewApply',
    payload: '{ view: GridView, request: SavedViewsRequest }',
    when: 'After an apply or a revert the state request did not refuse: the saved view parsed with parseGridView against columns, or builtIn for the built-in view. The consumer writes it into the grid.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the layer moves: pointer or keyboard on the trigger, escape, outsidePress, apply and save closing it, programmatic from show() and hide(). Escape with a form open is not emitted: the form is cancelled instead.',
  },
];

export const ANGULAR_SAVED_VIEWS_DOCS = {
  savedViews: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'current',
        'input.required<GridView>',
        '—',
        'sl-saved-views',
        'The view the grid shows now: its column state, query and density. Compared with the view in use by sameGridView',
      ],
      [
        'builtIn',
        'input.required<GridView>',
        '—',
        'sl-saved-views',
        'The built-in view, named messages.builtIn: the application’s defaults, emitted when it is applied',
      ],
      [
        'columns',
        'readonly GridColumn[]',
        '—',
        'sl-saved-views',
        'The model, so views are serialized and compared against the columns they name',
      ],
      [
        'state',
        'model<SavedViewsState | undefined>',
        '—',
        'sl-saved-views',
        'The views: { views, defaultId, activeId }. Two-way; cancel stateChangeRequest to hold it',
      ],
      [
        'defaultState',
        'SavedViewsState',
        'no views',
        'sl-saved-views',
        'The views an unbound instance starts from',
      ],
      [
        'open',
        'model<boolean | undefined>',
        '—',
        'sl-saved-views',
        'Whether the layer is open. Two-way',
      ],
      [
        'defaultOpen',
        'boolean',
        'false',
        'sl-saved-views',
        'The layer an unbound instance starts with',
      ],
      [
        'messages',
        'Partial<SavedViewsMessages>',
        '—',
        'sl-saved-views',
        'Words laid over the language in force, key by key: the group’s and the panel’s name (label) and every other word; {name} is the view’s name',
      ],
      [
        'exportAs',
        'slSavedViews',
        '—',
        'sl-saved-views',
        'show(), hide(), focus(), apply(id) — show, hide and apply with the reason programmatic',
      ],
      [
        'persistedSavedViews',
        '({ key, storage?, columns?, injector? }) => { state, openedDefault }',
        'localStorage',
        'an injection context',
        'A WritableSignal read once and written from an effect after every change; tolerates a store that throws, and null keeps the views in memory',
      ],
      [
        'native attributes',
        'role, aria-label, data-*',
        '—',
        'sl-saved-views',
        'A static role or aria-label written on the host is read before the host bindings and wins',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA Authoring Practices pattern covers a list of named views, so the family is built from the ones that do: the trigger opens a non-modal dialog (aria-haspopup="dialog", aria-expanded, aria-controls) held by the popover family, and each row’s actions control is the Menu Button pattern held by the menu family. Inside the panel everything is a native button, a list and a form in native tab order.',
      'The host is a group named Views, so the trigger reads “Late orders Modified, button, Views group”. The view in use carries aria-current="true" and a check; the default view reads “default” after its name from a hidden word beside the pin. Modified is a word and a dot, never the dot alone.',
      'Escape inside a form or a confirmation cancels it and keeps the panel open — the popover asks to close in the capture phase and the family refuses that request; a second Escape closes the panel and focus returns to the trigger. A submitted form focuses the row it changed, a cancelled one the control that opened it, a confirmed delete the row above.',
      'An empty or duplicate name marks the field invalid, and the error joins the input’s description through the field family. Applying, saving, renaming, deleting and moving the default are announced politely through the shared live announcer, because each changes something outside the focused control.',
    ],
    snippets: [
      defineSnippet({
        id: 'saved-views-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<sl-saved-views
  data-ui="saved-views"
  data-part="root"
  role="group"
  aria-label="Views"
  data-modified
>
  <button data-part="trigger" aria-haspopup="dialog" aria-expanded="true" title="Late orders">
    <span data-label>Late orders</span>
    <span data-part="modified">Modified</span>
  </button>
  <button data-part="revert">Revert</button>
</sl-saved-views>
<div data-ui="saved-views" data-part="panel">
  <ul data-part="list" role="list">
    <li data-part="item" data-view="__default" data-built-in>…</li>
    <li data-part="item" data-view="late" data-current data-default>
      <button data-part="apply" aria-current="true">
        <span data-label>Late orders</span>
        <span data-part="default-mark"><span>default</span></span>
      </button>
      <button
        data-part="actions"
        aria-haspopup="menu"
        aria-label="Actions for Late orders"
      ></button>
    </li>
  </ul>
  <div data-part="footer">…</div>
</div>`,
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
