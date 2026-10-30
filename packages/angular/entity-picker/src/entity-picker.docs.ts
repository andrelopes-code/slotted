import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import entityPickerTokens from '@slotted/styles/entity-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_ENTITY_PICKER_TOKENS = entityPickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlEntityPicker decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlEntityPicker, SlEntityPickerChip, SlEntityPickerOption, SlEntityPickerOptionDescription, SlEntityPickerOptionLabel, SlEntityPickerOptionMedia, SlEntityPickerOptionMeta, provideEntityPickerDefaults } from '@slotted/angular/entity-picker';",
  selector:
    'sl-entity-picker, ng-template[slEntityPickerOption], ng-template[slEntityPickerChip], [slEntityPickerOptionLabel], [slEntityPickerOptionDescription], [slEntityPickerOptionMeta], [slEntityPickerOptionMedia]',
  exportAs: 'slEntityPicker',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-entity-picker',
    required: true,
    purpose:
      'data-ui="entity-picker", data-size, data-variant, data-selection-mode, data-overflow and the states; role="group" named by the field when scopes are shown. The scope and the frame share one line at every width.',
  },
  {
    part: 'scope',
    element: 'div around an sl-select',
    required: false,
    purpose: 'The scope a search runs in, joined to the front of the frame. Only with [scopes].',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose: 'The frame, and the anchor the popup hangs from.',
  },
  {
    part: 'selection',
    element: 'span around an slAvatar',
    required: false,
    purpose: 'single: the chosen record’s face before its name, aria-hidden.',
  },
  {
    part: 'values',
    element: 'div',
    required: false,
    purpose: 'multiple: role="grid" named by the label and the count of chips.',
  },
  {
    part: 'chips',
    element: 'div',
    required: false,
    purpose:
      'multiple: role="row" of tag chips with a face, a name and a remove button; data-loading while an id resolves, data-unresolved when it never does, and a "+N" chip with data-count under overflow="collapse".',
  },
  {
    part: 'field',
    element: 'span',
    required: false,
    purpose: 'multiple: the gridcell that holds the input.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'role="combobox", aria-autocomplete="list", aria-activedescendant naming the highlight.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose: 'Empties the choice and the text, with reason clear.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose: 'Opens and closes the popup; tabindex="-1".',
  },
  {
    part: 'arrow',
    element: 'span',
    required: false,
    purpose: 'The chevron in the trigger.',
  },
  {
    part: 'busy',
    element: 'span, the spinner family',
    required: false,
    purpose: 'Replaces the chevron while a search or a single resolution travels.',
  },
  {
    part: 'positioner',
    element: 'div, portalled',
    required: true,
    purpose: 'The layer, built from an ng-template on open and destroyed on close.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose: 'role="listbox"; aria-multiselectable in multiple; aria-busy while a search travels.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose: 'Chosen, Favorites, Recent, Results or a group by entity.group; role="group".',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The heading of a group, drawn only when more than one group shows.',
  },
  {
    part: 'item',
    element: 'div',
    required: false,
    purpose:
      'One record, role="option"; data-create marks the offer to create, data-retry the offer to search again.',
  },
  {
    part: 'media',
    element: 'span around an slAvatar',
    required: false,
    purpose: 'The face, spanning both lines; a glyph on the two offers.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose: 'The name, two lines at most.',
  },
  {
    part: 'match',
    element: 'mark, from slHighlight',
    required: false,
    purpose: 'The span of the name the query found.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'The identifier that tells two records of one name apart.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose: 'A short fact on the name’s line.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose: 'The check on a chosen record.',
  },
  {
    part: 'error',
    element: 'div',
    required: false,
    purpose: 'The failure, above the retry option.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'Nothing answered and nothing can be created.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose: 'Three skeleton records while the first page travels. aria-hidden.',
  },
  {
    part: 'more',
    element: 'div',
    required: false,
    purpose: 'One skeleton record while the next page travels. aria-hidden.',
  },
  {
    part: 'status',
    element: 'div',
    required: true,
    purpose: 'role="status": the count, the minimum length, the wait.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'An owner for a deal, from a directory that answers after 400ms. Change the mode, size, variant, media and overflow below; every request is written under the field with its reason.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-playground',
      language: 'angular',
      label: 'An owner from a remote directory',
      source: `<sl-entity-picker
  aria-label="Owner"
  [source]="directory"
  [(value)]="owner"
  (valueChangeRequest)="log($event)"
/>`,
    }),
  },
  {
    id: 'single',
    title: 'One record',
    note: 'The chosen name is the text of the field and the face stands before it. Typing searches; leaving text that chose nothing puts the name back.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-single',
      language: 'angular',
      label: 'Single',
      source: `<div slField>
  <label slFieldLabel>Account owner</label>
  <sl-entity-picker defaultValue="usr_bruno" [source]="directory" />
</div>`,
    }),
  },
  {
    id: 'multiple',
    title: 'Several records',
    note: 'Reviewers as chips with faces. Choosing keeps the popup open and empties the query; the field stays one line, and what does not fit is counted by +N.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-multiple',
      language: 'angular',
      label: 'Multiple',
      source: `<sl-entity-picker
  aria-label="Reviewers"
  selectionMode="multiple"
  [defaultValue]="['usr_ana', 'usr_bruno', 'usr_carla']"
  [source]="directory"
/>`,
    }),
  },
  {
    id: 'rich-results',
    title: 'A record, not a string',
    note: 'The face, the name, the identifier under it and a short fact on its line. Two people called Ana Souza are told apart by their address, in the list and in what a screen reader hears.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-rich',
      language: 'ts',
      label: 'The shape a source returns',
      source: `const record: Entity = {
  id: 'usr_ana',
  label: 'Ana Souza',
  description: 'ana.souza@northwind.io',
  meta: 'Admin',
};`,
    }),
  },
  {
    id: 'sections',
    title: 'Favorites and recent',
    note: 'Press the empty field: favorites, then recent, then what the empty query returned, with no id twice. rememberRecent keeps the application’s list.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-sections',
      language: 'angular',
      label: 'Sections on an empty query',
      source: `<sl-entity-picker
  aria-label="Assignee"
  [favorites]="pinned"
  [recent]="recent()"
  [source]="directory"
  (valueChangeRequest)="remember($event)"
/>`,
    }),
  },
  {
    id: 'scopes',
    title: 'Searching in a scope',
    note: 'An sl-select joined to the front of the field chooses what the search runs over; the scope rides on every request.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-scopes',
      language: 'angular',
      label: 'Scopes',
      source: `<sl-entity-picker aria-label="Related record" [scopes]="scopes" [(scope)]="scope" [source]="crm" />`,
    }),
  },
  {
    id: 'async',
    title: 'Waiting for the source',
    note: 'The first page waits as three skeleton records; a new query dims the rows already shown; the next page arrives under a skeleton row at the end. Nothing is drawn for an answer faster than 200ms.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-async',
      language: 'ts',
      label: 'A paged source',
      source: `const directory: EntitySource = {
  search: async ({ query, cursor }, { signal }) => {
    const page = await api.people({ query, cursor, signal });
    return { items: page.people, hasMore: page.next !== null, cursor: page.next };
  },
};`,
    }),
  },
  {
    id: 'creation',
    title: 'Creating what is not there',
    note: 'Type a company the source does not hold: the last option offers to create it, and the record createEntity returns is chosen with reason submit.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-creation',
      language: 'angular',
      label: 'createEntity',
      source: `<sl-entity-picker aria-label="Account" [createEntity]="createAccount" [source]="accounts" />`,
    }),
  },
  {
    id: 'error',
    title: 'When the source fails',
    note: 'The sentence names what failed and the option under it searches again — ArrowDown reaches it and Enter takes it. Chips already chosen stay.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-error',
      language: 'angular',
      label: 'A failing source',
      source: `<sl-entity-picker aria-label="Owner" [source]="offline" />`,
    }),
  },
  {
    id: 'unresolved',
    title: 'Ids without records',
    note: 'A value that arrives as ids: each chip waits as a skeleton while resolve runs, and an id the source never returns reads Unavailable and stays removable.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-unresolved',
      language: 'angular',
      label: 'Resolving ids',
      source: `<sl-entity-picker
  aria-label="Watchers"
  selectionMode="multiple"
  [defaultValue]="['usr_marta', 'usr_deleted']"
  [source]="directory"
/>`,
    }),
  },
  {
    id: 'limit',
    title: 'A limit',
    note: 'At three approvers every other record goes aria-disabled and the field says it is complete; removing one opens the list again.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-limit',
      language: 'angular',
      label: 'max',
      source: `<sl-entity-picker aria-label="Approvers" max="3" selectionMode="multiple" [source]="directory" />`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'sm, md and lg beside a text field of the same step: the frame, the face and the chips follow the control scale.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-sizes',
      language: 'angular',
      label: 'size',
      source: `<sl-entity-picker aria-label="Owner" size="sm" [source]="directory" />`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline in a form, subtle on a sunken panel, plain inside a table cell whose row is the box — square, no lift, the ring drawn inward.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-variants',
      language: 'angular',
      label: 'variant',
      source: `<sl-entity-picker aria-label="Owner" variant="plain" [source]="directory" />`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled drops the remove buttons and fades the faces; read-only keeps the name copyable and withholds the popup; invalid retargets the edge and the ring.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-states',
      language: 'angular',
      label: 'States',
      source: `<sl-entity-picker aria-label="Owner" disabled [source]="directory" />
<sl-entity-picker aria-label="Owner" readOnly [source]="directory" />
<sl-entity-picker aria-label="Owner" invalid required [source]="directory" />`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A nine-word name clamps to two lines, a long address to one with an ellipsis, an Arabic name reads right to left, and a token with no spaces breaks.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-long',
      language: 'angular',
      label: 'Long content',
      source: `<sl-entity-picker aria-label="Watchers" selectionMode="multiple" [source]="international" />`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key',
    note: 'ArrowDown opens and moves, PageDown jumps ten, Enter chooses, Escape closes then reverts; in multiple, Backspace from an empty field goes to the last chip and a second press removes it.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-keyboard',
      language: 'angular',
      label: 'Keyboard',
      source: `<sl-entity-picker aria-label="Reviewers" selectionMode="multiple" [source]="directory" />`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'A deal form with Reactive Forms: the owner and the reviewers are form controls, required, and stand at the height of the fields beside them.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-form',
      language: 'angular',
      label: 'formControl',
      source: `<sl-entity-picker
  aria-label="Reviewers"
  required
  selectionMode="multiple"
  [formControl]="reviewers"
  [source]="directory"
/>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'An option template adds the team after the address; a chip template adds the role; provideSlotted says every sentence in Portuguese once.',
    snippet: defineSnippet({
      id: 'entity-picker-angular-composition',
      language: 'angular',
      label: 'Templates',
      source: `<sl-entity-picker aria-label="Reviewers" selectionMode="multiple" [source]="directory">
  <ng-template slEntityPickerOption let-person>
    <span slEntityPickerOptionLabel>{{ person.label }}</span>
    <span slEntityPickerOptionDescription>{{ person.description }} · Northwind</span>
  </ng-template>
  <ng-template slEntityPickerChip let-person>{{ person.label }} · {{ person.meta }}</ng-template>
</sl-entity-picker>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string | null | readonly string[]> & { entities: readonly Entity[] }',
    when: 'Before the choice moves: a press (pointer), Enter (keyboard), a removal (remove), clear (clear), a created record (submit). cancel() refuses it; otherwise value and a form control follow.',
  },
  {
    name: 'valueChange',
    payload: 'string | null | readonly string[]',
    when: 'The model half of [(value)], after a request nobody cancelled.',
  },
  {
    name: 'inputValueChangeRequest / inputValueChange',
    payload: 'ChangeRequest<string> / string',
    when: 'The text: typing (keyboard), a choice (select), clear (clear), leaving text that chose nothing (blur).',
  },
  {
    name: 'openChangeRequest / openChange',
    payload: 'ChangeRequest<boolean> / boolean',
    when: 'The popup: focus and keys (keyboard), a press on the input or the trigger (pointer), escape, outsidePress, select, blur.',
  },
  {
    name: 'highlightedValueChangeRequest / highlightedValueChange',
    payload: 'ChangeRequest<string | null> / string | null',
    when: 'The highlight: arrows (keyboard), hovering (pointer).',
  },
  {
    name: 'scopeChangeRequest / scopeChange',
    payload: 'ChangeRequest<string | null> / string | null',
    when: 'The scope, from the sl-select in front of the field (pointer, keyboard).',
  },
  {
    name: 'create',
    payload: '{ query: string; reason }',
    when: 'The offer to create is taken; [createEntity] makes the record, which is then chosen.',
  },
];

export const ANGULAR_ENTITY_PICKER_DOCS = {
  'entity-picker': {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'selectionMode',
        "'single' | 'multiple'",
        'single',
        'sl-entity-picker',
        'One id or an array of ids',
      ],
      [
        'source',
        'EntitySource',
        '—',
        'sl-entity-picker',
        'search(request, { signal }) and resolve(ids, { signal })',
      ],
      [
        'items',
        'readonly Entity[]',
        '—',
        'sl-entity-picker',
        'A list the application holds, filtered locally',
      ],
      [
        'entities',
        'readonly Entity[]',
        '[]',
        'sl-entity-picker',
        'Records the application already knows',
      ],
      [
        'favorites',
        'readonly Entity[]',
        '[]',
        'sl-entity-picker',
        'The first section on an empty query',
      ],
      ['recent', 'readonly Entity[]', '[]', 'sl-entity-picker', 'The section after favorites'],
      [
        'scopes',
        'readonly { id; label }[]',
        '[]',
        'sl-entity-picker',
        'Draws an sl-select in front of the field',
      ],
      [
        'value',
        'model<string | null | readonly string[]>',
        'null',
        'sl-entity-picker',
        'Two-way ids',
      ],
      [
        'defaultValue',
        'string | readonly string[]',
        '—',
        'sl-entity-picker',
        'The uncontrolled start, read once',
      ],
      ['inputValue', 'model<string>', "''", 'sl-entity-picker', 'Two-way text'],
      ['open', 'model<boolean>', 'false', 'sl-entity-picker', 'Two-way popup'],
      ['highlightedValue', 'model<string | null>', 'null', 'sl-entity-picker', 'Two-way highlight'],
      ['scope', 'model<string | null>', 'null', 'sl-entity-picker', 'Two-way scope'],
      [
        'createEntity',
        '(query) => Entity | Promise<Entity | null>',
        '—',
        'sl-entity-picker',
        'Draws the offer to create',
      ],
      ['max', 'number', 'null', 'sl-entity-picker', 'multiple: the most records chosen'],
      ['searchDelay', 'number', '250', 'sl-entity-picker', 'Milliseconds after the last keystroke'],
      ['minQueryLength', 'number', '0', 'sl-entity-picker', 'Below it nothing is asked'],
      [
        'media',
        "'avatar' | 'none'",
        'avatar',
        'sl-entity-picker',
        'Faces in rows, chips and the field',
      ],
      [
        'overflow',
        "'collapse' | 'wrap'",
        'collapse',
        'sl-entity-picker',
        'multiple: one line with +N, or three lines',
      ],
      [
        'openOn',
        "'input' | 'focus' | 'manual'",
        'input',
        'sl-entity-picker',
        'input: typing or a press opens; focus: every focus too; manual: only the trigger and the arrows',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'sl-entity-picker', 'The control step; a field sets it'],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'sl-entity-picker',
        'plain gives the box to a cell',
      ],
      ['side', "'bottom' | 'top'", 'bottom', 'sl-entity-picker', 'Where the popup opens'],
      [
        'width',
        "'anchor' | 'content'",
        'content',
        'sl-entity-picker',
        'The popup at least as wide as the frame and as wide as its longest row (content), or pinned to the width of the frame (anchor)',
      ],
      [
        'strategy',
        "'absolute' | 'fixed'",
        'absolute',
        'sl-entity-picker',
        'fixed inside a clipped ancestor',
      ],
      ['clearable', 'boolean', 'true', 'sl-entity-picker', 'Draws the clear button'],
      ['loop', 'boolean', 'false', 'sl-entity-picker', 'The arrows wrap'],
      ['highlightMatch', 'boolean', 'true', 'sl-entity-picker', 'Marks the span the query found'],
      ['portal', 'boolean', 'true', 'sl-entity-picker', 'false keeps the layer in place'],
      ['fullWidth', 'boolean', 'true', 'sl-entity-picker', 'false sizes the root to its content'],
      ['disabled', 'boolean', 'false', 'sl-entity-picker', 'Also from a field or a form control'],
      ['readOnly', 'boolean', 'false', 'sl-entity-picker', 'Keeps the text, withholds the popup'],
      ['required', 'boolean', 'false', 'sl-entity-picker', 'Reported by the Validator'],
      ['invalid', 'boolean', 'false', 'sl-entity-picker', 'Also from a field'],
      ['locale', 'string', '—', 'sl-entity-picker', 'BCP 47. The language in force when absent'],
      [
        'messages',
        'Partial<EntityPickerMessages>',
        '—',
        'sl-entity-picker',
        'Words laid over the language in force, key by key; {count}, {query}, {label}, {id} and {max} are slots',
      ],
      ['aria-label', 'string', '—', 'sl-entity-picker', 'The name when no field labels it'],
      [
        'virtualize',
        'boolean',
        'above 100 options without headings',
        'sl-entity-picker',
        'Draws only the options in view and a few either side; the keyboard, aria-activedescendant and scrolling to the highlight reach every option. A list with section headings is drawn whole',
      ],
      [
        'estimatedRowHeight',
        'number',
        '48',
        'sl-entity-picker',
        'The height an option is counted at until it has been drawn and measured',
      ],
      [
        'slEntityPickerOption',
        'ng-template, context { $implicit, query, selected, current, disabled }',
        '—',
        'option content',
        'The content of an option, written with slEntityPickerOptionLabel, slEntityPickerOptionDescription, slEntityPickerOptionMeta and slEntityPickerOptionMedia, which place it in the row. With media="none" an option draws its own face in slEntityPickerOptionMedia',
      ],
      [
        'slEntityPickerChip',
        'ng-template, context { $implicit }',
        '—',
        'chip words',
        'The words of a chip',
      ],
      [
        'provideEntityPickerDefaults',
        '(defaults) => Provider',
        '—',
        'an injector',
        'The decisions an application takes once',
      ],
    ]),
    accessibility: [
      'The input is a combobox with a listbox popup, as the APG Combobox Pattern writes it: DOM focus never leaves the input, aria-activedescendant names the highlighted record, and aria-autocomplete is list.',
      'Each option and each chip is named by the name and the identifier, so two people called Ana Souza are two things to a screen reader; an id without a record is named Unavailable with the id.',
      'In multiple the chips are one row of a grid with one tab stop: the arrows move between chips, Delete removes, and focus after a removal goes to the chip that took the index, then the previous one, then the input.',
      'The Validator reports required and unresolved to a Reactive Form, so a value that holds a deleted record is invalid without the application checking it.',
      'The failure and every chip added or removed are said once through the shared polite announcer; the skeletons are hidden from assistive technology.',
    ],
    snippets: [
      defineSnippet({
        id: 'entity-picker-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<sl-entity-picker data-ui="entity-picker" data-part="root" data-selection-mode="single">
  <div data-part="control">
    <span data-part="selection" aria-hidden="true">…</span>
    <input data-part="input" role="combobox" aria-autocomplete="list" />
    <button data-part="clear" aria-label="Clear"></button>
    <button data-part="trigger" tabindex="-1" aria-label="Show results"></button>
  </div>
</sl-entity-picker>`,
      }),
      defineSnippet({
        id: 'entity-picker-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='entity-picker'] {
  --slotted-entity-picker-scope-inline-size: 9rem;
  --slotted-entity-picker-meta-measure: 6em;
}`,
      }),
    ],
  },
} as const;
