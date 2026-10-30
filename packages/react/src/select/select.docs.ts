import selectTokens from '@slotted/styles/select/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SELECT_TOKENS = selectTokens.map((name) => ({
  name,
  purpose: 'A Select value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, rendered by SelectTrigger',
    required: true,
    purpose:
      'The frame, carrying data-ui="select". It draws the border, the shadow, the focus ring and every state, as the text field frame does: a focus ring can only be drawn by an ancestor of the focused element.',
  },
  {
    part: 'trigger',
    element: 'button with role="combobox"',
    required: true,
    purpose:
      'The button with role="combobox". It fills the frame, keeps DOM focus for the whole interaction, and carries aria-expanded, aria-controls and aria-activedescendant. Inside a field it carries the field’s control id, so a press on the label focuses it.',
  },
  {
    part: 'value',
    element: 'span, rendered by SelectValue',
    required: true,
    purpose:
      'What the control shows: the chosen label, a summary of several, or the placeholder. It carries data-placeholder while nothing is chosen, and data-unmatched when a value has no known label.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: true,
    purpose:
      'The chevron, a Glyph inside an Icon box, turned over while the list is open. It sits against the end of the frame and takes no pointer events, so a press on it reaches the trigger.',
  },
  {
    part: 'busy',
    element: 'span',
    required: false,
    purpose:
      'The spinner, drawn in place of the chevron while loading is set. It carries data-ui="spinner", so its ring comes from the spinner stylesheet.',
  },
  {
    part: 'tags',
    element: 'span',
    required: false,
    purpose:
      'The chosen values of a multiple select, one tag each, laid over the trigger rather than inside it: a remove button inside a button would be a control inside a control. Tags that do not fit collapse into one +N tag.',
  },
  {
    part: 'summary',
    element: 'span',
    required: false,
    purpose:
      'The text a multiple select shows under 120 pixels instead of tags, such as ‘3 selected’. It sits inside the value, so it names the trigger whichever of the two is drawn, and it is visually hidden rather than removed while the tags are shown.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'The clear button. It is drawn while clearable is set and something is chosen, as a sibling of the trigger rather than a child: a focusable element inside a combobox would be a widget inside a widget.',
  },
  {
    part: 'positioner',
    element: 'div, rendered by SelectContent',
    required: true,
    purpose:
      'The layer, portalled to the end of the document. It carries data-ui="select" again, because a stylesheet cannot reach the portalled list through the root. The positioner writes its position on this element, and this element scales and fades.',
  },
  {
    part: 'content',
    element: 'div with role="listbox", or role="dialog" under search',
    required: true,
    purpose:
      'The list surface. It defines the three columns every option uses, is bounded by the height the positioner reports, and scrolls inside it. With search it becomes a dialog that holds the search field and the list, because a listbox may hold only options and groups.',
  },
  {
    part: 'search',
    element: 'div, drawn only under search',
    required: false,
    purpose:
      'The search row, fixed at the top of the list so it stays in view while the results scroll. The control itself never takes typed text; a value the reader types belongs in a combobox.',
  },
  {
    part: 'search-icon',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'The magnifier, a Glyph inside an Icon box. searchProps.icon replaces it, and null removes it.',
  },
  {
    part: 'search-input',
    element: 'input with role="combobox"',
    required: false,
    purpose:
      'The search field. It carries aria-controls naming the list, aria-autocomplete="list" and aria-activedescendant, and holds DOM focus while the list is open, because a dialog popup does not support aria-activedescendant on the trigger.',
  },
  {
    part: 'list',
    element: 'div with role="listbox", drawn only under search',
    required: false,
    purpose:
      'The listbox inside the dialog when search is set. It scrolls under the fixed search row and defines the option columns in place of the surface.',
  },
  {
    part: 'chosen',
    element: 'div, aria-hidden, drawn while several values are chosen',
    required: false,
    purpose:
      'Every chosen value of a multiple select, as tags at the top of the list. The control holds one line, so it may show three tags and a count; this band shows them all, wraps, and scrolls after two rows. It is aria-hidden and holds no buttons: without search focus never reaches the list, and with search Tab leaves the control, so a remove button here would answer only the pointer. A value is removed from its option or from its tag in the control.',
  },
  {
    part: 'match',
    element: 'mark, the match part of the highlight family, whose root sits inside label',
    required: false,
    purpose:
      'The span of a label that the query matched, found with the same comparison the filter used. The mark comes from the highlight stylesheet and changes no metric of the surrounding text.',
  },
  {
    part: 'group',
    element: 'div with role="group"',
    required: false,
    purpose:
      'A run of options under a heading. It spans every column and inherits them, so its options align with the options outside it.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose:
      'The group’s heading. The group references it with aria-labelledby, as the listbox pattern requires of every option group.',
  },
  {
    part: 'item',
    element: 'div with role="option"',
    required: true,
    purpose:
      'One option, not a button: an option is not separately focusable, and a button would add a tab stop. data-current marks the highlight and data-selected the chosen option.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose:
      'The check mark in the last column. Its box is reserved whether or not the mark is drawn, so rows do not shift as the highlight moves.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The artwork in the first column: an Icon holding a Glyph, or any element. It is separate from the check mark, which says whether the option is chosen.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The option’s text, and the only column that shrinks. It wraps to two lines and then truncates, with the whole text still in the DOM.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line under the label, for detail the label has no room for.',
  },
  {
    part: 'separator',
    element: 'div with role="separator"',
    required: false,
    purpose: 'A line between two runs of options. It is not focusable and not interactive.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'The text the list shows when it holds no options: the empty message, or the empty prop of SelectContent.',
  },
  {
    part: 'status',
    element: 'div with role="status"',
    required: false,
    purpose:
      'The live region that announces the loading message, and the number of results while searching. It keeps the width of the list, so nothing shifts when the options arrive.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose:
      'Three rows the height of an option, drawn with the skeleton stylesheet while loading is set. They are hidden from assistive technology, because the status row announces the wait.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One select with every axis on it, driven by the controls under the canvas. Change size, variant and width and watch the control and its popup answer together.',
    snippet: defineSnippet({
      id: 'select-react-playground',
      language: 'tsx',
      label: 'A control, and the options it opens',
      source: `<Select>
  <SelectTrigger aria-label="Fruit">
    <SelectValue placeholder="Choose a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="blueberry">Blueberry</SelectItem>
  </SelectContent>
</Select>;`,
    }),
  },
  {
    id: 'selection',
    title: 'Controlled and uncontrolled',
    note: 'The left one owns its own value; the right one hands it to the page, and the request carries the reason so a consumer can tell a press from a key.',
    snippet: defineSnippet({
      id: 'select-react-selection',
      language: 'tsx',
      label: 'Who owns the value',
      source: `<Select defaultValue="blueberry">…</Select>;

<Select value={fruit} onValueChange={(next, request) => setFruit(next, request.reason)}>
  …
</Select>;`,
    }),
  },
  {
    id: 'placeholder',
    title: 'Placeholder and unresolved values',
    note: 'Nothing chosen shows the placeholder in the muted step. A value the collection cannot name shows the value itself, which is what an async list holds for one render.',
    snippet: defineSnippet({
      id: 'select-react-placeholder',
      language: 'tsx',
      label: 'Empty, and holding a value it cannot name',
      source: `<SelectValue placeholder="Choose a fruit" />;

<Select defaultValue="usr_8f21c0" items={known}>
  …
</Select>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, icons and descriptions',
    note: 'Two named groups with a line between them. Every label starts on the same line whether or not its option carries artwork, because the column belongs to the list.',
    snippet: defineSnippet({
      id: 'select-react-groups',
      language: 'tsx',
      label: 'A list with sections',
      source: `<SelectContent>
  <SelectGroup label="Berries">
    <SelectItem description="In season until September" value="raspberry">
      Raspberry
    </SelectItem>
  </SelectGroup>
  <SelectSeparator />
  <SelectGroup label="Citrus">
    <SelectItem
      icon={
        <Icon>
          <Glyph name="dot" />
        </Icon>
      }
      value="pomelo"
    >
      Pomelo
    </SelectItem>
  </SelectGroup>
</SelectContent>;`,
    }),
  },
  {
    id: 'multiple',
    title: 'Multiple selection',
    note: 'The popup stays open as options are taken, and the control shows the first label and how many more. Space toggles without closing, which is the listbox pattern’s own model.',
    snippet: defineSnippet({
      id: 'select-react-multiple',
      language: 'tsx',
      label: 'Several values, summarised',
      source: `<Select multiple defaultValue={['apple', 'cherry']}>
  <SelectTrigger aria-label="Fruit">
    <SelectValue>{(values) => \`\${values.length} chosen\`}</SelectValue>
  </SelectTrigger>
  …
</Select>;`,
    }),
  },
  {
    id: 'clearable',
    title: 'Clearable',
    note: 'The clear button appears only once something is chosen, and focus goes back to the control it belonged to rather than to the document.',
    snippet: defineSnippet({
      id: 'select-react-clearable',
      language: 'tsx',
      label: 'Taking the choice back',
      source: `<Select clearable defaultValue="apple" onValueChange={(next, request) => log(request.reason)}>
  …
</Select>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'Three steps, and every one of them reads control geometry — so a select beside a text field of the same size is the same height to the pixel.',
    snippet: defineSnippet({
      id: 'select-react-sizes',
      language: 'tsx',
      label: 'The three control steps',
      source: `<Select size="sm">…</Select>;
<Select size="md">…</Select>;
<Select size="lg">…</Select>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline on the page, subtle where a form sinks into its card, and plain for a table cell that is only a control while it is being used.',
    snippet: defineSnippet({
      id: 'select-react-variants',
      language: 'tsx',
      label: 'How much frame the control shows',
      source: `<Select variant="outline">…</Select>;
<Select variant="subtle">…</Select>;
<Select variant="plain">…</Select>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Required, invalid, read-only and disabled side by side. Read-only keeps its value legible and refuses to open; disabled answers nothing at all.',
    snippet: defineSnippet({
      id: 'select-react-states',
      language: 'tsx',
      label: 'What the control refuses, and how it says so',
      source: `<Select invalid>…</Select>;
<Select readOnly defaultValue="apple">
  …
</Select>;
<Select disabled defaultValue="apple">
  …
</Select>;`,
    }),
  },
  {
    id: 'loading-and-empty',
    title: 'Loading and empty',
    note: 'A popup with nothing in it opens onto a sentence rather than onto a two-pixel box, and a loading one keeps that measure so nothing jumps when the options land.',
    snippet: defineSnippet({
      id: 'select-react-loading-and-empty',
      language: 'tsx',
      label: 'Two states no surveyed implementation draws',
      source: `<Select loading>
  <SelectContent status="Fetching teams…">{options}</SelectContent>
</Select>;

<SelectContent empty="No teams yet">{[]}</SelectContent>;`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A translated label, an unbroken identifier and a hundred options. The label clamps at two lines with the whole string still in the DOM, and the token breaks inside the option.',
    snippet: defineSnippet({
      id: 'select-react-long-content',
      language: 'tsx',
      label: 'Long, translated and unbroken',
      source: `<SelectItem value="urn">urn:acme:catalogue:9f2c41ab8de07c5511903fbe</SelectItem>;`,
    }),
  },
  {
    id: 'search',
    title: 'Searching a long list',
    note: 'search opens the popup onto a field. The query filters the options, the span it matched is marked, and the count is announced. It is transient: it never becomes a value, it is emptied when an option is taken, and the control goes on showing the chosen label. Escape clears the query before it closes the popup, and Tab commits and leaves the control.',
    snippet: defineSnippet({
      id: 'select-react-search',
      language: 'tsx',
      label: 'A field above the options, and what it filters',
      source: `<Select search>
  <SelectTrigger aria-label="Country">
    <SelectValue placeholder="Choose a country" />
  </SelectTrigger>
  <SelectContent searchProps={{ placeholder: 'Filter countries' }}>
    <SelectItem value="nl">Netherlands</SelectItem>
    <SelectItem value="nz">New Zealand</SelectItem>
  </SelectContent>
</Select>;

// The query is a value like any other, and it is not the selection.
<Select
  search
  searchValue={query}
  onSearchValueChange={(next, request) => setQuery(next, request.reason)}
/>;

// A list a server has already filtered decides nothing here.
<Select search filter={null} loading={pending} />;`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement and width',
    note: 'The popup hangs from the start edge of its control. It is never narrower than the control and grows when an option needs more room, so a narrow control does not wrap its labels. width="anchor" pins it to the width of the control.',
    snippet: defineSnippet({
      id: 'select-react-placement',
      language: 'tsx',
      label: 'Where the popup goes, and how wide it is',
      source: `<Select align="end" side="top" width="anchor">
  …
</Select>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Focus never leaves the button: the arrows, Home, End and the page keys move aria-activedescendant, and typing jumps to the first option that begins with it.',
    snippet: defineSnippet({
      id: 'select-react-keyboard',
      language: 'tsx',
      label: 'What the reader can reach without a pointer',
      source: `<Select loop={false} typeahead typeaheadTimeout={500}>
  …
</Select>;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'Inside a field, with a label, a description and an error. name renders a hidden native select, so a plain form submits and reset() restores.',
    snippet: defineSnippet({
      id: 'select-react-form',
      language: 'tsx',
      label: 'A control a form can submit',
      source: `<Field invalid required>
  <FieldLabel>Fruit</FieldLabel>
  <Select name="fruit">
    <SelectTrigger>
      <SelectValue placeholder="Choose a fruit" />
    </SelectTrigger>
    <SelectContent>{options}</SelectContent>
  </Select>
  <FieldError>Choose one.</FieldError>
</Field>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'Defaults set once for a whole application, a summary the consumer writes, and the frame replaced with an element of their own through render.',
    snippet: defineSnippet({
      id: 'select-react-composition',
      language: 'tsx',
      label: 'What a consumer can replace',
      source: `<SelectDefaultsProvider size="sm" variant="subtle" width="anchor">
  <Select ref={handle}>
    <SelectTrigger render={(props) => <label {...props} />}>
      <SelectValue>{(values, labels) => labels.join(', ')}</SelectValue>
    </SelectTrigger>
    …
  </Select>
</SelectDefaultsProvider>;`,
    }),
  },
];

const api = apiRows([
  [
    'search',
    'boolean',
    'false',
    'Select',
    'Puts a search field at the top of the list. The list becomes a dialog, DOM focus moves into the search field, and typeahead turns off.',
  ],
  [
    'searchValue',
    'string',
    '—',
    'Select',
    'The search query. Passing it makes the query controlled. It is never the selection.',
  ],
  [
    'defaultSearchValue',
    'string',
    "''",
    'Select',
    'The query an uncontrolled search field starts with. Read once.',
  ],
  [
    'filter',
    '((label: string, query: string) => boolean) | null',
    'createFilter',
    'Select',
    'Decides whether an option matches the query. Unset uses a locale-sensitive contains that ignores case and accents. null turns filtering off, for a list a server has already filtered. A function replaces the comparison.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'Select',
    'Whether the span of a label that matched the query is marked.',
  ],
  [
    'locale',
    'string',
    '—',
    'Select',
    'The BCP 47 language the default filter compares in. Defaults to the language in force.',
  ],
  [
    'searchProps',
    'SelectSearchProps',
    '—',
    'SelectContent',
    'Props for the search field: every native input attribute, icon, and render to replace the row around the field.',
  ],
  [
    'value',
    'string | string[] | null',
    '—',
    'Select',
    'The chosen value, or values when multiple is set. Passing it makes the selection controlled.',
  ],
  [
    'defaultValue',
    'string | string[] | null',
    '—',
    'Select',
    'The value an uncontrolled select starts with, and the value a form reset restores. Read once.',
  ],
  [
    'open',
    'boolean',
    '—',
    'Select',
    'Whether the list is open. Passing it makes the open state controlled.',
  ],
  ['defaultOpen', 'boolean', 'false', 'Select', 'Whether an uncontrolled select starts open.'],
  [
    'highlightedValue',
    'string | null',
    '—',
    'Select',
    'The highlighted option. Passing it makes the highlight controlled. The highlight is where the keyboard is, not what is chosen.',
  ],
  [
    'defaultHighlightedValue',
    'string | null',
    '—',
    'Select',
    'The option an uncontrolled highlight starts on.',
  ],
  [
    'items',
    'SelectItems',
    '—',
    'Select',
    'Values with their labels, read before any option renders. Without it, a held value takes its label from its SelectItem: while the list is closed and a held value has no label, the options render once outside the document and register theirs. Pass items when the options are not rendered until the list opens, such as options fetched on open.',
  ],
  [
    'name',
    'string',
    '—',
    'Select',
    'The name the value is submitted under. It renders a hidden native select, which FormData reads and a form reset restores.',
  ],
  [
    'form',
    'string',
    '—',
    'Select',
    'The id of the form the control belongs to, when it is not the enclosing form.',
  ],
  [
    'total',
    'number',
    '—',
    'Select',
    'The size of the whole collection when only part of it is rendered. Options with position then carry aria-setsize and aria-posinset.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Select',
    'The step of the control scale. When unset, the select takes the size of its field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'Select',
    'How much frame the control draws: an outline, a filled subtle frame, or plain, with no frame at rest.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'Select',
    'The edge of the control the list opens from.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'Select',
    'Where the list aligns along that edge.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'Select',
    'content keeps the list at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Select',
    'When the list exists in the DOM: active while it is open, lazy from the first open on, eager from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'Select',
    'The CSS position the positioner gives the list.',
  ],
  [
    'multiple',
    'boolean',
    'false',
    'Select',
    'Allows several values. The value becomes an array, and the list stays open as options are chosen.',
  ],
  ['clearable', 'boolean', 'false', 'Select', 'Draws a clear button once something is chosen.'],
  [
    'loop',
    'boolean',
    'false',
    'Select',
    'Whether the arrow keys wrap from the last option to the first.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'Select',
    'Whether typing the first letters of a label highlights the matching option. Off while search is set.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'Select',
    'How long typed letters keep building one search, in milliseconds.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'true',
    'Select',
    'Whether choosing an option closes the list. A multiple select stays open regardless.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'Select', 'Whether Escape closes the list.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'Select',
    'Whether a press outside the list closes it.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'Select',
    'Whether the list may open on the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'Select',
    'Whether the list may slide along its edge to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'Select',
    'Whether the list hides while its control is scrolled out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'Select',
    'Whether the list renders at the end of the document instead of inside the control.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'Select',
    'Whether the control fills its container. false sizes it to its widest value.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'Select',
    'Disables the control and takes it out of the tab order. When unset, the select takes the state of its field.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'Select',
    'Keeps the value visible and focusable and never opens the list. When unset, the select takes the state of its field.',
  ],
  [
    'required',
    'boolean',
    'false',
    'Select',
    'Sets aria-required, and the required attribute of the hidden native select. When unset, the select takes the state of its field.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'Select',
    'Sets aria-invalid and draws the border and the focus ring in the danger tone. When unset, the select takes the state of its field.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'Select',
    'Shows the spinner, three placeholder rows and the loading message, and sets aria-busy on the listbox.',
  ],
  ['sideOffset', 'number', '4', 'Select', 'The gap between the control and the list, in pixels.'],
  ['alignOffset', 'number', '0', 'Select', 'How far the list shifts along its edge, in pixels.'],
  [
    'collisionPadding',
    'number',
    '8',
    'Select',
    'The distance the list keeps from the edges of the viewport, in pixels.',
  ],
  [
    'messages',
    'Partial<SelectMessages>',
    '—',
    'Select',
    'Replaces any of the phrases the select writes: clear, remove ({label}), summary ({count}), search, searchPlaceholder, count ({count}), empty and loading. Phrases left out come from the language in force.',
  ],
  [
    'placeholder',
    'ReactNode',
    '—',
    'SelectValue',
    'What the control shows while nothing is chosen.',
  ],
  [
    'children',
    '(values, labels) => ReactNode',
    '—',
    'SelectValue',
    'A function of the chosen values and their labels that returns what the control shows, in place of the built-in summary.',
  ],
  ['empty', 'ReactNode', '—', 'SelectContent', 'Replaces the empty message for this list.'],
  ['status', 'ReactNode', '—', 'SelectContent', 'Replaces the loading message for this list.'],
  [
    'value',
    'string',
    '—',
    'SelectItem',
    'The option’s value: what is submitted and what a change request carries.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'SelectItem',
    'Announces the option as unavailable, keeps it in the list, and skips it with every movement key.',
  ],
  ['description', 'ReactNode', '—', 'SelectItem', 'A second line under the label.'],
  [
    'icon',
    'ReactNode',
    '—',
    'SelectItem',
    'An element for the first column, such as an Icon holding a Glyph.',
  ],
  [
    'textValue',
    'string',
    '—',
    'SelectItem',
    'The text typeahead and the filter match on, when the label is not plain text.',
  ],
  [
    'position',
    'number',
    '—',
    'SelectItem',
    'The option’s one-based place in the whole collection, written as aria-posinset.',
  ],
  [
    'label',
    'ReactNode',
    '—',
    'SelectGroup',
    'The group’s heading, which names the group through aria-labelledby.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string | string[] | null, request: ChangeRequest)',
    when: 'Before the selection changes. request.reason is pointer, keyboard, clear, select or programmatic, and request.cancel() refuses the change. A form reset reports programmatic.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest)',
    when: 'Before the list opens or closes. request.reason tells a choice from a dismissal: select, escape, outsidePress, pointer, keyboard, dismiss, blur or programmatic.',
  },
  {
    name: 'onHighlightedValueChange',
    payload: '(value: string | null, request: ChangeRequest)',
    when: 'Before the highlight moves. request.reason is pointer, keyboard or programmatic.',
  },
  {
    name: 'onSearchValueChange',
    payload: '(value: string, request: ChangeRequest)',
    when: 'Before the query changes. request.reason is keyboard for typing, select when an option is chosen while the list stays open, and clear when Escape empties the field or the list empties it as it opens and closes.',
  },
];

const composition = apiRows([
  [
    'SelectDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets any axis once for every select below it. The words come from the language in force, set by SlottedProvider. A prop set on one select still wins.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'SelectTrigger, SelectContent',
    'Replaces the frame of SelectTrigger or the layer of SelectContent. The button and the listbox carry the role and the wiring, so they cannot be replaced.',
  ],
  [
    'ref',
    'Ref<SelectHandle>',
    '—',
    'Select',
    'A handle with focus(), open(), close(), focusSearch() and scrollToKey(value).',
  ],
  ['ref', 'Ref<HTMLButtonElement>', '—', 'SelectTrigger', 'The button element.'],
  [
    'native props',
    'ComponentPropsWithRef<…>',
    '—',
    'every part',
    'Each part accepts the props of its own element. Your onClick, onKeyDown or aria-label reaches that element, and the select’s own handler runs alongside yours instead of replacing it.',
  ],
]);

const accessibility = [
  'The trigger is a button with role="combobox", aria-haspopup="listbox" and aria-expanded. The list is a listbox with an option for each row.',
  'DOM focus stays on the trigger. aria-activedescendant names the highlighted option, which also carries data-current; chosen options carry aria-selected and data-selected. The highlight is where the keyboard is; the selection is what was chosen.',
  'A disabled option carries aria-disabled, keeps its place in the list, and is skipped by every movement key, typeahead included.',
  'Inside a field, the trigger carries the field’s control id, so a press on the label focuses it without opening the list. The trigger also takes the label through aria-labelledby, because the name a label gives a button does not reliably reach a button with role="combobox". Outside a field, give SelectTrigger an aria-label.',
  'With search, the list is a dialog that holds a search field and a listbox, the trigger sets aria-haspopup="dialog", and focus moves into the search field while the list is open.',
  'Tab chooses the highlighted option and moves focus on, as the APG select-only example specifies; a native select only closes. Escape closes without choosing.',
];

const code = defineSnippet({
  id: 'select-react-anatomy',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="select"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-full-width
  data-open
>
  <button
    data-part="trigger"
    type="button"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="true"
    aria-controls="listbox-id"
    aria-activedescendant="option-blueberry"
  >
    <span data-part="value">Blueberry</span>
  </button>
  <button data-part="clear" type="button" aria-label="Clear selection"></button>
  <span data-part="arrow"></span>
</div>;

<div
  data-ui="select"
  data-part="positioner"
  data-side="bottom"
  data-align="start"
  data-width="content"
  data-open
>
  <div data-part="content" role="listbox" id="listbox-id">
    <div data-part="group" role="group" aria-labelledby="group-id">
      <div data-part="group-label" id="group-id">
        Berries
      </div>
      <div
        data-part="item"
        role="option"
        id="option-blueberry"
        data-value="blueberry"
        aria-selected="true"
        data-selected
        data-current
      >
        <span data-part="label">Blueberry</span>
        <span data-part="indicator"></span>
      </div>
    </div>
  </div>
</div>;`,
});

const theming = defineSnippet({
  id: 'select-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='select'] {
  --slotted-select-radius: var(--slotted-radius-md);
  --slotted-select-highlight: var(--slotted-tone-accent-surface);
  --slotted-select-highlight-ring: var(--slotted-tone-accent-border);
  --slotted-select-selected-color: var(--slotted-tone-accent-text);
  --slotted-select-measure: 20rem;
}`,
});

export const REACT_SELECT_DOCS = {
  select: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [code, theming],
  },
};
