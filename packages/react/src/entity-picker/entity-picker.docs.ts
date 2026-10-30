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

export const REACT_ENTITY_PICKER_TOKENS = entityPickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Entity picker decision',
}));

const imports: ReferenceImport = {
  source:
    "import { EntityPicker, EntityPickerDefaultsProvider, EntityPickerOptionDescription, EntityPickerOptionLabel, EntityPickerOptionMedia, EntityPickerOptionMeta, localEntitySource, rememberRecent } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'data-ui="entity-picker", data-size, data-variant, data-selection-mode, data-overflow and the states; role="group" named by the field when scopes are shown. The scope and the frame share one line at every width.',
  },
  {
    part: 'scope',
    element: 'div around a Select',
    required: false,
    purpose:
      'The scope a search runs in, joined to the front of the frame, min(11rem, 45%) wide. Only with scopes.',
  },
  {
    part: 'control',
    element: 'div',
    required: true,
    purpose:
      'The frame: edge, ground, shadow, focus ring and invalid edge. The anchor the popup hangs from.',
  },
  {
    part: 'selection',
    element: 'span around an Avatar',
    required: false,
    purpose:
      'single: the chosen record’s face before its name, aria-hidden. Absent while the reader types, with media="none", and for a record with avatar: null.',
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
      'multiple: role="row". Each chip is a Tag (data-ui="tag", role="gridcell") with the face in its start slot, the name, and a remove button at tabindex="-1"; data-loading while its id resolves, data-unresolved when the source did not return it. Under overflow="collapse" a "+N" chip with data-count counts what did not fit.',
  },
  {
    part: 'field',
    element: 'span',
    required: false,
    purpose: 'multiple: the gridcell that holds the input, at least 2.5rem wide.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'role="combobox", aria-autocomplete="list", aria-activedescendant naming the highlighted record. Every native attribute and handler reaches it.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose: 'Empties the choice and the text, with reason clear. Present while there is either.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose: 'Opens and closes the popup; tabindex="-1", as the combobox pattern asks.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: false,
    purpose: 'The chevron in the trigger, turned while open.',
  },
  {
    part: 'busy',
    element: 'span, a Spinner',
    required: false,
    purpose:
      'Replaces the chevron while a search has been travelling for 200ms, or while the chosen id of a single field resolves.',
  },
  {
    part: 'positioner',
    element: 'div, portalled',
    required: true,
    purpose: 'The layer, carrying data-ui="entity-picker" so the stylesheet reaches it.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'role="listbox", aria-multiselectable in multiple, aria-busy while a search travels; data-loading while a new query recedes the rows already shown.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose:
      'A section — Chosen, Favorites, Recent, Results — or a group of results by entity.group; role="group" named by its label. Drawn only when more than one shows.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The heading of a group.',
  },
  {
    part: 'item',
    element: 'div',
    required: false,
    purpose:
      'One record, role="option", data-selected, data-current, data-disabled. data-create marks the offer to create, data-retry the offer to search again.',
  },
  {
    part: 'media',
    element: 'span around an Avatar',
    required: false,
    purpose:
      'The face, spanning the name and the identifier. A glyph instead on the two offers. Absent with media="none".',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose: 'The name, two lines at most, ordered by its own first strong character.',
  },
  {
    part: 'match',
    element: 'mark, from Highlight',
    required: false,
    purpose: 'The span of the name the query found.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'The identifier that tells two records of one name apart; one line.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose: 'A short fact on the name’s line — a type, a status — at most a quarter of the row.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose: 'The check on a chosen record, on the name’s first line.',
  },
  {
    part: 'error',
    element: 'div',
    required: false,
    purpose: 'labels.error with the alert mark, above the retry option.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'labels.empty, when the source answered with nothing and nothing can be created.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose:
      'Three skeleton records — a circle and two lines — while the first page travels, after 200ms. aria-hidden.',
  },
  {
    part: 'more',
    element: 'div',
    required: false,
    purpose: 'One skeleton record at the end while the next page travels. aria-hidden.',
  },
  {
    part: 'status',
    element: 'div',
    required: true,
    purpose:
      'role="status": the count once the source answered a typed query, the minimum length, the wait.',
  },
];

const PERSON = `{
  id: 'usr_ana',
  label: 'Ana Souza',
  description: 'ana.souza@northwind.io',
  meta: 'Admin',
}`;

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'An owner for a deal, from a directory that answers after 400ms. Change the mode, size, variant, media and overflow below; every request is written under the field with its reason.',
    snippet: defineSnippet({
      id: 'entity-picker-react-playground',
      language: 'tsx',
      label: 'An owner from a remote directory',
      source: `const directory: EntitySource = {
  search: async ({ query, page, scope }, { signal }) => api.people({ query, page, scope, signal }),
  resolve: async (ids, { signal }) => api.peopleById(ids, { signal }),
};

<EntityPicker
  aria-label="Owner"
  onValueChange={(id, request) => setOwner(id)}
  source={directory}
  value={owner}
/>;`,
    }),
  },
  {
    id: 'single',
    title: 'One record',
    note: 'The chosen name is the text of the field and the face stands before it. Typing searches; leaving text that chose nothing puts the name back.',
    snippet: defineSnippet({
      id: 'entity-picker-react-single',
      language: 'tsx',
      label: 'Single',
      source: `<Field>
  <FieldLabel>Account owner</FieldLabel>
  <EntityPicker defaultValue="usr_ana" source={directory} />
</Field>;`,
    }),
  },
  {
    id: 'multiple',
    title: 'Several records',
    note: 'Reviewers as chips with faces. Choosing keeps the popup open and empties the query; the field stays one line, and what does not fit is counted by +N.',
    snippet: defineSnippet({
      id: 'entity-picker-react-multiple',
      language: 'tsx',
      label: 'Multiple',
      source: `<EntityPicker
  aria-label="Reviewers"
  defaultValue={['usr_ana', 'usr_bruno', 'usr_carla']}
  selectionMode="multiple"
  source={directory}
/>;`,
    }),
  },
  {
    id: 'rich-results',
    title: 'A record, not a string',
    note: 'The face, the name, the identifier under it and a short fact on its line. Two people called Ana Souza are told apart by their address, in the list and in what a screen reader hears.',
    snippet: defineSnippet({
      id: 'entity-picker-react-rich',
      language: 'ts',
      label: 'The shape a source returns',
      source: `const record: Entity = ${PERSON};`,
    }),
  },
  {
    id: 'sections',
    title: 'Favorites and recent',
    note: 'Press the empty field: favorites, then recent, then what the empty query returned, with no id twice. rememberRecent keeps the application’s list.',
    snippet: defineSnippet({
      id: 'entity-picker-react-sections',
      language: 'tsx',
      label: 'Sections on an empty query',
      source: `<EntityPicker
  aria-label="Assignee"
  favorites={pinned}
  onValueChange={(id, request) => setRecent((list) => rememberRecent(list, request.entities[0]!))}
  recent={recent}
  source={directory}
/>;`,
    }),
  },
  {
    id: 'scopes',
    title: 'Searching in a scope',
    note: 'A Select joined to the front of the field chooses what the search runs over; the scope rides on every request and favorites keep only records of it.',
    snippet: defineSnippet({
      id: 'entity-picker-react-scopes',
      language: 'tsx',
      label: 'Scopes',
      source: `<EntityPicker
  aria-label="Related record"
  defaultScope="accounts"
  scopes={[
    { id: 'accounts', label: 'Accounts' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'deals', label: 'Deals' },
  ]}
  source={crm}
/>;`,
    }),
  },
  {
    id: 'async',
    title: 'Waiting for the source',
    note: 'The first page waits as three skeleton records; a new query dims the rows already shown; the next page arrives under a skeleton row at the end. Nothing is drawn for an answer faster than 200ms.',
    snippet: defineSnippet({
      id: 'entity-picker-react-async',
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
    note: 'Type a company the source does not hold: the last option offers to create it. The record onCreate returns is chosen with reason submit.',
    snippet: defineSnippet({
      id: 'entity-picker-react-creation',
      language: 'tsx',
      label: 'onCreate',
      source: `<EntityPicker
  aria-label="Account"
  onCreate={async (name) => api.createAccount({ name })}
  source={accounts}
/>;`,
    }),
  },
  {
    id: 'error',
    title: 'When the source fails',
    note: 'The sentence names what failed and the option under it searches again — ArrowDown reaches it and Enter takes it. Chips already chosen stay.',
    snippet: defineSnippet({
      id: 'entity-picker-react-error',
      language: 'tsx',
      label: 'A failing source',
      source: `<EntityPicker aria-label="Owner" source={offline} />;`,
    }),
  },
  {
    id: 'unresolved',
    title: 'Ids without records',
    note: 'A value that arrives as ids: each chip waits as a skeleton while resolve runs, and an id the source never returns reads Unavailable and stays removable.',
    snippet: defineSnippet({
      id: 'entity-picker-react-unresolved',
      language: 'tsx',
      label: 'Resolving ids',
      source: `<EntityPicker
  aria-label="Watchers"
  defaultValue={['usr_ana', 'usr_deleted']}
  selectionMode="multiple"
  source={directory}
/>;`,
    }),
  },
  {
    id: 'limit',
    title: 'A limit',
    note: 'At three approvers every other record goes aria-disabled and the field says it is complete; removing one opens the list again.',
    snippet: defineSnippet({
      id: 'entity-picker-react-limit',
      language: 'tsx',
      label: 'max',
      source: `<EntityPicker aria-label="Approvers" max={3} selectionMode="multiple" source={directory} />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'sm, md and lg beside a text field of the same step: the frame, the face and the chips follow the control scale, and density moves all three.',
    snippet: defineSnippet({
      id: 'entity-picker-react-sizes',
      language: 'tsx',
      label: 'size',
      source: `<EntityPicker aria-label="Owner" size="sm" source={directory} />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline in a form, subtle on a sunken panel, plain inside a table cell whose row is the box — square, no lift, the ring drawn inward.',
    snippet: defineSnippet({
      id: 'entity-picker-react-variants',
      language: 'tsx',
      label: 'variant',
      source: `<EntityPicker aria-label="Owner" source={directory} variant="plain" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled drops the remove buttons and fades the faces; read-only keeps the name copyable and withholds the popup; invalid retargets the edge and the ring; required is on the input.',
    snippet: defineSnippet({
      id: 'entity-picker-react-states',
      language: 'tsx',
      label: 'States',
      source: `<EntityPicker aria-label="Owner" disabled source={directory} />;
<EntityPicker aria-label="Owner" readOnly source={directory} />;
<EntityPicker aria-label="Owner" invalid required source={directory} />;`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A nine-word name clamps to two lines, a long address to one with an ellipsis, an Arabic name reads right to left in a left-to-right list, and a token with no spaces breaks.',
    snippet: defineSnippet({
      id: 'entity-picker-react-long',
      language: 'tsx',
      label: 'Long content',
      source: `<EntityPicker aria-label="Watchers" items={international} selectionMode="multiple" />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key',
    note: 'ArrowDown opens and moves, PageDown jumps ten, Enter chooses, Escape closes then reverts; in multiple, Backspace from an empty field goes to the last chip and a second press removes it.',
    snippet: defineSnippet({
      id: 'entity-picker-react-keyboard',
      language: 'tsx',
      label: 'Keyboard',
      source: `<EntityPicker aria-label="Reviewers" selectionMode="multiple" source={directory} />;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'A deal form: the owner and the reviewers submit one hidden input per id under their names, beside a text field and a select of the same height.',
    snippet: defineSnippet({
      id: 'entity-picker-react-form',
      language: 'tsx',
      label: 'Submitting ids',
      source: `<form action="/deals" method="post">
  <Field>
    <FieldLabel>Reviewers</FieldLabel>
    <EntityPicker name="reviewers" selectionMode="multiple" source={directory} />
  </Field>
</form>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'renderOption adds the team after the address; renderChip adds the role to a chip; SlottedProvider says every sentence in Portuguese once.',
    snippet: defineSnippet({
      id: 'entity-picker-react-composition',
      language: 'tsx',
      label: 'renderOption and a provider',
      source: `<SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
  <EntityPicker
    aria-label="Owner"
    messages={{ retry: 'Search again' }}
    renderOption={(person) => (
      <>
        <EntityPickerOptionLabel>{person.label}</EntityPickerOptionLabel>
        <EntityPickerOptionDescription>{person.team}</EntityPickerOptionDescription>
      </>
    )}
    source={directory}
  />
</SlottedProvider>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload:
      '(value: string | null | readonly string[], request: ChangeRequest & { entities: readonly Entity[] })',
    when: 'Before the choice moves: a press (pointer), Enter (keyboard), a removal (remove), the clear button or Escape twice (clear), a record onCreate returned (submit). request.entities holds the records known for the new value; cancel() refuses it.',
  },
  {
    name: 'onInputValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the text moves: typing (keyboard), a choice (select), clear (clear), leaving text that chose nothing (blur).',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the popup opens or closes: focus, typing, arrows (keyboard), a press on the input or the trigger (pointer), Escape (escape), a press outside (outsidePress), a choice (select), leaving (blur).',
  },
  {
    name: 'onHighlightedValueChange',
    payload: '(key: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the highlight moves: arrows and the opening (keyboard), hovering an option (pointer).',
  },
  {
    name: 'onScopeChange',
    payload: '(scope: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the scope moves in the Select in front of the field (pointer, keyboard).',
  },
  {
    name: 'onCreate',
    payload: '(query: string) => void | Entity | Promise<Entity | null | void>',
    when: 'When the offer to create is taken. A record returned is remembered and chosen with reason submit.',
  },
  {
    name: 'source.search / source.resolve',
    payload: '(request, { signal }) => Promise<…>',
    when: 'search after searchDelay once the reader stops typing, at once for an empty query or a new scope, and again for the next page; resolve for ids the family has not seen. A superseded request is aborted.',
  },
  {
    name: 'onKeyDown, onFocus, onBlur and the other native handlers',
    payload: 'the input’s own event',
    when: 'Run first on the input; the family’s own handling is skipped when a handler calls preventDefault().',
  },
];

export const REACT_ENTITY_PICKER_DOCS = {
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
        'EntityPicker',
        'One id or an array of ids',
      ],
      [
        'source',
        'EntitySource',
        '—',
        'EntityPicker',
        'search(request, { signal }) and resolve(ids, { signal }); the family calls them',
      ],
      [
        'items',
        'readonly Entity[]',
        '—',
        'EntityPicker',
        'A list the application holds, filtered by name and identifier with the locale’s collator',
      ],
      [
        'entities',
        'readonly Entity[]',
        '[]',
        'EntityPicker',
        'Records the application already knows, so their ids need no resolution',
      ],
      [
        'favorites',
        'readonly Entity[]',
        '[]',
        'EntityPicker',
        'The first section on an empty query',
      ],
      ['recent', 'readonly Entity[]', '[]', 'EntityPicker', 'The section after favorites'],
      [
        'scopes',
        'readonly { id: string; label: string }[]',
        '—',
        'EntityPicker',
        'Draws a Select in front of the field; the scope rides on every request',
      ],
      [
        'value',
        'string | null | readonly string[]',
        '—',
        'EntityPicker',
        'Present means controlled',
      ],
      [
        'defaultValue',
        'string | null | readonly string[]',
        'null or []',
        'EntityPicker',
        'The uncontrolled start, read once',
      ],
      ['inputValue', 'string', '—', 'EntityPicker', 'The text, controlled'],
      ['defaultInputValue', 'string', 'the chosen name', 'EntityPicker', 'The uncontrolled text'],
      ['open', 'boolean', '—', 'EntityPicker', 'The popup, controlled'],
      ['defaultOpen', 'boolean', 'false', 'EntityPicker', 'The uncontrolled popup'],
      [
        'highlightedValue',
        'string | null',
        '—',
        'EntityPicker',
        'The highlighted option’s key, controlled',
      ],
      [
        'defaultHighlightedValue',
        'string | null',
        'null',
        'EntityPicker',
        'The uncontrolled highlight',
      ],
      ['scope', 'string | null', '—', 'EntityPicker', 'The scope, controlled'],
      ['defaultScope', 'string | null', 'null', 'EntityPicker', 'The uncontrolled scope'],
      [
        'onCreate',
        '(query) => void | Entity | Promise<Entity | null | void>',
        '—',
        'EntityPicker',
        'Draws the offer to create',
      ],
      [
        'virtualize',
        'boolean',
        'above 100 options without headings',
        'EntityPicker',
        'Draws only the options in view and a few either side; the keyboard, aria-activedescendant and scrolling to the highlight reach every option. A list with section headings is drawn whole',
      ],
      [
        'estimatedRowHeight',
        'number',
        '48',
        'EntityPicker',
        'The height an option is counted at until it has been drawn and measured',
      ],
      [
        'renderOption',
        '(entity, state) => ReactNode',
        'name, identifier, fact',
        'EntityPicker',
        'The content of an option, written with EntityPickerOptionLabel, EntityPickerOptionDescription, EntityPickerOptionMeta and EntityPickerOptionMedia, which place it in the row; the face, the check and the row stay the family’s. With media="none" an option draws its own face in EntityPickerOptionMedia',
      ],
      ['renderChip', '(entity) => ReactNode', 'the name', 'EntityPicker', 'The words of a chip'],
      ['render', '(props) => ReactNode', 'a div', 'EntityPicker', 'Replaces the root element'],
      [
        'handleRef',
        'Ref<{ focus, open, close, refresh }>',
        '—',
        'EntityPicker',
        'refresh() asks the source again',
      ],
      ['ref', 'Ref<HTMLInputElement>', '—', 'EntityPicker', 'The input'],
      ['max', 'number | null', 'null', 'EntityPicker', 'multiple: the most records chosen'],
      ['searchDelay', 'number', '250', 'EntityPicker', 'Milliseconds after the last keystroke'],
      [
        'minQueryLength',
        'number',
        '0',
        'EntityPicker',
        'Below it nothing is asked; at 0 the empty query is searched',
      ],
      [
        'media',
        "'avatar' | 'none'",
        'avatar',
        'EntityPicker',
        'Faces in the rows, the chips and the field',
      ],
      [
        'overflow',
        "'collapse' | 'wrap'",
        'collapse',
        'EntityPicker',
        'multiple: one line with +N, or three lines',
      ],
      [
        'openOn',
        "'input' | 'focus' | 'manual'",
        'input',
        'EntityPicker',
        'input: typing or a press opens; focus: every focus too; manual: only the trigger and the arrows',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'EntityPicker',
        'The control step; a Field around it sets it',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'EntityPicker',
        'plain gives the box to a cell',
      ],
      [
        'side',
        "'bottom' | 'top'",
        'bottom',
        'EntityPicker',
        'Where the popup opens; it flips when there is no room',
      ],
      [
        'width',
        "'anchor' | 'content'",
        'content',
        'EntityPicker',
        'The popup at least as wide as the frame and as wide as its longest row (content), or pinned to the width of the frame (anchor)',
      ],
      [
        'strategy',
        "'absolute' | 'fixed'",
        'absolute',
        'EntityPicker',
        'fixed inside a transformed or clipped ancestor',
      ],
      [
        'clearable',
        'boolean',
        'true',
        'EntityPicker',
        'Draws the clear button while there is something to clear',
      ],
      ['loop', 'boolean', 'false', 'EntityPicker', 'The arrows wrap past the ends'],
      ['highlightMatch', 'boolean', 'true', 'EntityPicker', 'Marks the span the query found'],
      ['portal', 'boolean', 'true', 'EntityPicker', 'false keeps the layer in place'],
      ['fullWidth', 'boolean', 'true', 'EntityPicker', 'false sizes the root to its content'],
      [
        'disabled',
        'boolean',
        'false',
        'EntityPicker',
        'Also read from a Field or a disabled fieldset',
      ],
      [
        'readOnly',
        'boolean',
        'false',
        'EntityPicker',
        'Keeps the text, withholds the popup and the removals',
      ],
      ['required', 'boolean', 'false', 'EntityPicker', 'On the input while nothing is chosen'],
      ['invalid', 'boolean', 'false', 'EntityPicker', 'Also read from a Field'],
      [
        'locale',
        'string',
        '—',
        'EntityPicker',
        'BCP 47, for the local filter and the mark. The language in force when absent',
      ],
      [
        'messages',
        'Partial<EntityPickerMessages>',
        '—',
        'EntityPicker',
        'Words laid over the language in force, key by key; {count}, {query}, {label}, {id} and {max} are slots',
      ],
      ['name', 'string', '—', 'EntityPicker', 'One hidden input per id under this name'],
      [
        'EntityPickerDefaultsProvider',
        '{ size, variant, media, overflow, openOn, searchDelay, minQueryLength, … }',
        '—',
        'a subtree',
        'The decisions an application takes once; an instance that states any of them wins',
      ],
    ]),
    accessibility: [
      'The input is a combobox with a listbox popup, as the APG Combobox Pattern writes it: DOM focus never leaves the input, the highlighted record is named by aria-activedescendant, aria-autocomplete is list, and aria-expanded is always written.',
      'Each option is named by its name, its identifier and its short fact, so two people called Ana Souza are two different options to a screen reader; a chip is named the same way, and an id without a record is named “Unavailable” with the id.',
      'In multiple the chips are one row of a grid with one tab stop: the arrows move between chips, Delete and Backspace remove, and focus after a removal goes to the chip that took the index, then the previous one, then the input.',
      'The status region says the count once the source answers a typed query, the minimum length and the wait; the failure and every chip added or removed are said once through the shared polite announcer. The skeletons are hidden from assistive technology.',
      'The offer to create and the offer to search again are options, so the keyboard reaches them through the same arrows and Enter as any record; a button inside the popup would be out of reach while focus stays on the input.',
    ],
    snippets: [
      defineSnippet({
        id: 'entity-picker-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="entity-picker"
  data-part="root"
  data-selection-mode="multiple"
  data-overflow="collapse"
>
  <div data-part="control">
    <div data-part="values" role="grid" aria-label="Reviewers, 3 chosen">
      <div data-part="chips" role="row">
        <span
          data-ui="tag"
          data-part="root"
          role="gridcell"
          aria-label="Ana Souza, ana.souza@northwind.io"
        >
          …
        </span>
        <span data-ui="tag" data-part="root" data-count="" role="gridcell">
          +2
        </span>
        <span data-part="field" role="gridcell">
          <input data-part="input" role="combobox" aria-autocomplete="list" />
        </span>
      </div>
    </div>
    <button data-part="clear" aria-label="Clear" />
    <button data-part="trigger" tabIndex={-1} aria-label="Show results" />
  </div>
</div>;`,
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
