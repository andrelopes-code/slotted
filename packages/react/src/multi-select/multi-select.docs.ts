import multiSelectTokens from '@slotted/styles/multi-select/tokens.json';
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

export const REACT_MULTI_SELECT_TOKENS = multiSelectTokens.map((name) => ({
  name,
  purpose: 'A MultiSelect value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { MultiSelect, MultiSelectContent, MultiSelectControl, MultiSelectGroup, MultiSelectItem, MultiSelectSeparator } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, rendered by MultiSelectControl',
    required: true,
    purpose:
      'The frame, carrying data-ui="multi-select". It draws the border, the shadow, the focus ring and every state. Its height is not fixed: it grows by whole rows of tags up to three, then scrolls.',
  },
  {
    part: 'control',
    element: 'div with role="grid"',
    required: true,
    purpose:
      'The layout grid that holds the tags and the field, as the APG grid pattern describes for a list of message recipients. Its aria-label carries the number of chosen values, such as "2 chosen".',
  },
  {
    part: 'chips',
    element: 'div with role="row"',
    required: true,
    purpose:
      'One row in the DOM, however many lines it wraps to. The wrap is CSS, so the reading order stays linear and ArrowDown and ArrowUp stay with the list. Past three rows it scrolls, and it draws no scrollbar inside the frame.',
  },
  {
    part: 'field',
    element: 'span with role="gridcell"',
    required: true,
    purpose:
      'The last cell of the row, holding the input. It wraps with the tags instead of moving to a line of its own, and it takes the width of a word with a floor of two characters.',
  },
  {
    part: 'input',
    element: 'input with role="combobox"',
    required: true,
    purpose:
      'A native text input, so text editing, the caret, selection, IME and autofill work as in any input. It is the tab stop of the control and carries aria-expanded, aria-controls and aria-activedescendant.',
  },
  {
    part: 'counter',
    element: 'span',
    required: false,
    purpose:
      'The number of values against max, such as "2 of 3", or the number chosen while the frame is too narrow for a tag. It is drawn only in those two cases.',
  },
  {
    part: 'busy',
    element: 'span',
    required: false,
    purpose:
      'The spinner that stands in place of the chevron while loading is set, because the list has nothing to open onto yet.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Removes every value and the typed text at once, under the reason clear. It is drawn while clearable is set and the control holds a value or typed text.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Opens and closes the list with the pointer. It carries tabindex="-1", because the combobox pattern keeps the popup indicator out of the tab sequence.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: true,
    purpose:
      'The chevron inside the trigger, a Glyph inside an Icon box, turned over while the list is open.',
  },
  {
    part: 'positioner',
    element: 'div, rendered by MultiSelectContent',
    required: true,
    purpose:
      'The layer, portalled to the end of the document. It carries data-ui="multi-select" as well, so the stylesheet reaches the list outside the root.',
  },
  {
    part: 'content',
    element: 'div with role="listbox" and aria-multiselectable',
    required: true,
    purpose:
      'The list surface. Selection does not follow the highlight: moving through the options chooses nothing, which departs from the combobox pattern on purpose.',
  },
  {
    part: 'chosen',
    element: 'div',
    required: false,
    purpose:
      'Every chosen value as a tag, at the top of the list, whatever the row in the control shows. With overflow="collapse", the values the +N tag counts stay readable here.',
  },
  {
    part: 'group',
    element: 'div with role="group"',
    required: false,
    purpose:
      'A run of options under a name. A group whose options were all filtered away is hidden with its heading, so a heading never claims a match.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The name of a group, which the group references with aria-labelledby.',
  },
  {
    part: 'item',
    element: 'div with role="option"',
    required: true,
    purpose:
      'One option. It compares its own label with the query and is hidden when it does not match. Pressing an option already chosen removes its value.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose: 'The check on a chosen option, and the plus on the option that adds the typed text.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose: 'The first column of an option, for an icon that makes rows recognizable.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The text the reader chooses by, clamped to two lines. Its rules apply inside the option only, so the label of a tag keeps its own.',
  },
  {
    part: 'match',
    element: 'mark, the match part of the highlight component, inside label',
    required: false,
    purpose:
      'The span of the label the query matched, drawn by the highlight stylesheet, so every filtered list marks a match the same way.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line under the label of an option, for detail the label has no room for.',
  },
  {
    part: 'separator',
    element: 'div with role="separator"',
    required: false,
    purpose: 'A line between two runs of options.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'The message shown when no option matches. It keeps the width of the list, so nothing shifts when results arrive.',
  },
  {
    part: 'status',
    element: 'div with role="status"',
    required: true,
    purpose: 'The live region, and the loading row. It announces how many options match the query.',
  },
  {
    part: 'placeholder',
    element: 'div holding skeleton rows',
    required: false,
    purpose:
      'Rows the height of an option, standing in for the options while they load. Hidden from assistive technology, because the status row announces the wait.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls under the canvas. Add a service, take one back out, and watch the row grow by whole rows rather than by pixels.',
    snippet: defineSnippet({
      id: 'multi-select-react-playground',
      language: 'tsx',
      label: 'A frame of chosen values, and a field that adds more',
      source: `<MultiSelect defaultValue={['checkout-api']}>
  <MultiSelectControl aria-label="Affected services" placeholder="Add a service" />
  <MultiSelectContent aria-label="Affected services">
    <MultiSelectItem value="checkout-api">checkout-api</MultiSelectItem>
    <MultiSelectItem value="payments-worker">payments-worker</MultiSelectItem>
  </MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'chips',
    title: 'The chips, and where they live',
    note: 'Inside the frame, beside the caret, because this control holds a real input. Each chip is a tag: the same pill, the same remove control, the same geometry stated once in tag.css.',
    snippet: defineSnippet({
      id: 'multi-select-react-chips',
      language: 'tsx',
      label: 'The set is an array, and the order is the reader’s',
      source: `const [services, setServices] = useState(['checkout-api', 'payments-worker']);

<MultiSelect onValueChange={setServices} value={services}>
  <MultiSelectControl aria-label="Affected services" />
  <MultiSelectContent aria-label="Affected services">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'creation',
    title: 'Creating a value the list does not hold',
    note: 'With creatable, the offer stands as an option — ArrowDown reaches it, aria-activedescendant names it and Enter takes it — and its mark is the plus rather than the check, because nothing is in the set yet.',
    snippet: defineSnippet({
      id: 'multi-select-react-creation',
      language: 'tsx',
      label: 'Text becomes a value, under the reason submit',
      source: `<MultiSelect
  creatable
  onValueChange={(labels, request) => {
    if (request.reason === 'submit') report(labels);
  }}
>
  <MultiSelectControl aria-label="Labels" placeholder="Add a label" />
  <MultiSelectContent aria-label="Labels">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'limit',
    title: 'A limit that is a validity, not a silence',
    note: 'At the limit the counter takes the accent, the root carries data-complete, every unchosen option answers aria-disabled, and what was refused leaves through onValueRefuse instead of vanishing.',
    snippet: defineSnippet({
      id: 'multi-select-react-limit',
      language: 'tsx',
      label: 'What the control refuses, and how it says so',
      source: `<MultiSelect
  max={3}
  onValueRefuse={(values, { cause }) => {
    if (cause === 'limit') warn(\`Only three responders: \${values.join(', ')} were not added\`);
  }}
>
  <MultiSelectControl aria-label="Responders" />
  <MultiSelectContent aria-label="Responders">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'duplicates',
    title: 'Duplicates',
    note: 'The comparison is locale-sensitive, so P1 is already held when p1 is typed. The refusal moves focus to the chip that holds it: the reader is shown where their value is instead of being told nothing happened.',
    snippet: defineSnippet({
      id: 'multi-select-react-duplicates',
      language: 'tsx',
      label: 'Refused by default, allowed on request',
      source: `<MultiSelect creatable locale="pt-BR">
  …
</MultiSelect>;

<MultiSelect allowDuplicates creatable>
  …
</MultiSelect>;`,
    }),
  },
  {
    id: 'reorder',
    title: 'Reorder, by keyboard first',
    note: 'Alt with an arrow moves the focused chip one place, following the writing direction; Alt+Home and Alt+End take it to either end. The set is unchanged and the request carries keyboard, so a consumer persisting an order listens for exactly that.',
    snippet: defineSnippet({
      id: 'multi-select-react-reorder',
      language: 'tsx',
      label: 'The one reason reorder emits',
      source: `<MultiSelect
  onValueChange={(order, request) => {
    if (request.reason === 'keyboard') saveOrder(order);
  }}
  reorderable
>
  <MultiSelectControl aria-label="Runbook steps" />
  <MultiSelectContent aria-label="Runbook steps">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'paste',
    title: 'Pasting many values at once',
    note: 'One list of delimiters serves the key and the paste split, so a control cannot accept a comma-separated list from the clipboard and refuse it from the keyboard. Past the limit, the rest is reported rather than dropped.',
    snippet: defineSnippet({
      id: 'multi-select-react-paste',
      language: 'tsx',
      label: 'The separators, and what a long paste does',
      source: `<MultiSelect addOnPaste creatable delimiters={[',', ';']} max={5}>
  <MultiSelectControl aria-label="Notify" placeholder="Paste a list" />
  <MultiSelectContent aria-label="Notify">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'editing',
    title: 'Editing a chip in place',
    note: 'Enter on a focused chip turns its cell into a field, Enter commits and Escape reverts — which is the grid pattern’s own answer for a cell holding editable content. The commit is one transition, not a removal and an addition.',
    snippet: defineSnippet({
      id: 'multi-select-react-editing',
      language: 'tsx',
      label: 'A chip that can be corrected rather than retyped',
      source: `<MultiSelect creatable editable defaultValue={['payments-worker']}>
  <MultiSelectControl aria-label="Labels" />
  <MultiSelectContent aria-label="Labels">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering, and the mark',
    note: 'The default comparison is locale-sensitive and the mark shows the span the collator matched, rather than a naive substring that would disagree with it. chosenOptions decides whether a value already held stays in the list.',
    snippet: defineSnippet({
      id: 'multi-select-react-filtering',
      language: 'tsx',
      label: 'Three answers, and which one each asks for',
      source: `<MultiSelect locale="pt-BR">…</MultiSelect>;

<MultiSelect filter={(label, query) => label.startsWith(query)}>…</MultiSelect>;

<MultiSelect chosenOptions="hide" filter={null}>
  …
</MultiSelect>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'A set of options under a heading the group points at with aria-labelledby. A group whose every option was filtered away leaves the surface entirely, so a heading never claims a category matched when none did.',
    snippet: defineSnippet({
      id: 'multi-select-react-groups',
      language: 'tsx',
      label: 'Options under a name',
      source: `<MultiSelectContent aria-label="Affected services">
  <MultiSelectGroup label="Payments">
    <MultiSelectItem value="checkout-api">checkout-api</MultiSelectItem>
  </MultiSelectGroup>
  <MultiSelectSeparator />
  <MultiSelectGroup label="Platform">
    <MultiSelectItem value="auth-gateway">auth-gateway</MultiSelectItem>
  </MultiSelectGroup>
</MultiSelectContent>;`,
    }),
  },
  {
    id: 'overflow',
    title: 'Overflow, and access to the whole set',
    note: 'wrap grows by rows to three and then scrolls, keeping every chip in the DOM. collapse is one line high for a table row: what did not fit becomes a counting chip that opens the popup, whose band holds every value.',
    snippet: defineSnippet({
      id: 'multi-select-react-overflow',
      language: 'tsx',
      label: 'Two answers, and where each belongs',
      source: `<MultiSelect overflow="wrap">…</MultiSelect>;

<MultiSelect overflow="collapse">…</MultiSelect>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'The three control steps, from the geometry every control in the library reads. An empty control is exactly the height of a text field beside it on the same form; a chip is what changes that.',
    snippet: defineSnippet({
      id: 'multi-select-react-sizes',
      language: 'tsx',
      label: 'The three steps',
      source: `<MultiSelect size="sm">…</MultiSelect>;
<MultiSelect size="md">…</MultiSelect>;
<MultiSelect size="lg">…</MultiSelect>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline for a form, subtle for a panel that already has a ground, and plain for a table cell — where an edge and a resting shadow would draw a cell that is not there.',
    snippet: defineSnippet({
      id: 'multi-select-react-variants',
      language: 'tsx',
      label: 'Three frames, three contexts',
      source: `<MultiSelect variant="outline">…</MultiSelect>;
<MultiSelect variant="subtle">…</MultiSelect>;
<MultiSelect variant="plain">…</MultiSelect>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'disabled answers nothing and keeps its values legible; readOnly keeps the caret and the copy and withholds the popup and every remove control; invalid retints the border and the focus ring together.',
    snippet: defineSnippet({
      id: 'multi-select-react-states',
      language: 'tsx',
      label: 'What each state withholds',
      source: `<MultiSelect disabled>…</MultiSelect>;
<MultiSelect readOnly>…</MultiSelect>;
<MultiSelect invalid required>
  …
</MultiSelect>;`,
    }),
  },
  {
    id: 'loading-and-empty',
    title: 'Loading, and nothing found',
    note: 'While an answer travels the control shows the ring where the chevron stood and the popup shows rows the height of an option — the shape of the list that is coming. A query nothing answered keeps the surface’s measure rather than collapsing it.',
    snippet: defineSnippet({
      id: 'multi-select-react-loading',
      language: 'tsx',
      label: 'The wait, and the answer that was not there',
      source: `<MultiSelect loading>…</MultiSelect>;

<MultiSelectContent empty="No service by that name" />;`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A forty-character service name truncates inside its chip and stays whole in the accessibility tree; the row wraps rather than pushing the frame wider; and under 120 pixels there is no chip at all and the counter answers instead.',
    snippet: defineSnippet({
      id: 'multi-select-react-long-content',
      language: 'tsx',
      label: 'Truncation removes nothing from the DOM',
      source: `<MultiSelect defaultValue={['notification-relay-eu-west-1-canary']}>
  <MultiSelectControl aria-label="Affected services" />
  <MultiSelectContent aria-label="Affected services">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Backspace from an empty field moves to the last chip and removes nothing; a second press removes it. Delete takes the focused chip out, the arrows walk the row, and a printable character sends the reader back to the field.',
    snippet: defineSnippet({
      id: 'multi-select-react-keyboard',
      language: 'tsx',
      label: 'One tab stop, and the keys inside it',
      source: `<MultiSelect closeOnSelect={false} loop={false}>
  <MultiSelectControl aria-label="Affected services" />
  <MultiSelectContent aria-label="Affected services">…</MultiSelectContent>
</MultiSelect>;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'One hidden input per value, all under the same name, so a plain FormData receives several values under one key and a native reset() restores them. The field carries the label, the description and the error by ID.',
    snippet: defineSnippet({
      id: 'multi-select-react-form',
      language: 'tsx',
      label: 'Several values under one key',
      source: `<Field invalid>
  <FieldLabel>Affected services</FieldLabel>
  <MultiSelect name="services" required>
    <MultiSelectControl />
    <MultiSelectContent aria-label="Affected services">…</MultiSelectContent>
  </MultiSelect>
  <FieldError>Name at least one service</FieldError>
</Field>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition, and the defaults an application sets once',
    note: 'A provider carries the axes, the words come from the language in force, render replaces the frame while keeping the measurement, and the handle answers the actions a prop cannot express.',
    snippet: defineSnippet({
      id: 'multi-select-react-composition',
      language: 'tsx',
      label: 'Set once, replaced where it matters',
      source: `<MultiSelectDefaultsProvider size="sm" variant="subtle">
  <MultiSelect ref={handle}>
    <MultiSelectControl render={(props) => <fieldset {...props} />} />
    <MultiSelectContent aria-label="Affected services">…</MultiSelectContent>
  </MultiSelect>
</MultiSelectDefaultsProvider>;`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'readonly string[]',
    '\u2014',
    'MultiSelect',
    'The chosen values, in the order the reader chose them. Controlled.',
  ],
  [
    'defaultValue',
    'readonly string[]',
    '\u2014',
    'MultiSelect',
    'The values an uncontrolled multi-select starts with, read once. A reset of the form it belongs to returns to them.',
  ],
  [
    'inputValue',
    'string',
    '\u2014',
    'MultiSelect',
    'The text in the input. It is emptied whenever a value is committed. Controlled.',
  ],
  [
    'defaultInputValue',
    'string',
    '\u2014',
    'MultiSelect',
    'The text an uncontrolled input starts with, read once.',
  ],
  ['open', 'boolean', '\u2014', 'MultiSelect', 'Whether the list is open. Controlled.'],
  ['defaultOpen', 'boolean', '\u2014', 'MultiSelect', 'Whether an uncontrolled list starts open.'],
  [
    'highlightedValue',
    'string | null',
    '\u2014',
    'MultiSelect',
    'The option the highlight is on, which is not a chosen option. Controlled.',
  ],
  [
    'defaultHighlightedValue',
    'string | null',
    '\u2014',
    'MultiSelect',
    'Where an uncontrolled highlight starts.',
  ],
  [
    'items',
    'MultiSelectItems',
    '\u2014',
    'MultiSelect',
    'Values and labels declared up front, so a tag shows its label before the list has rendered its options.',
  ],
  [
    'filter',
    'MultiSelectFilter',
    '\u2014',
    'MultiSelect',
    'Compares an option label with the query. When absent, the comparison is a locale-sensitive "contains" that ignores case and accents; null turns filtering off for options a server has already filtered.',
  ],
  [
    'locale',
    'string',
    '\u2014',
    'MultiSelect',
    'The BCP 47 language of the filter and of the duplicate comparison. When absent, the language in force.',
  ],
  [
    'validateValue',
    '(text, values) => boolean',
    '\u2014',
    'MultiSelect',
    'Whether typed text may become a value. Text it turns down is reported through onValueRefuse with the cause invalid.',
  ],
  [
    'name',
    'string',
    '\u2014',
    'MultiSelect',
    'The submission name. One hidden input per value carries it.',
  ],
  [
    'form',
    'string',
    '\u2014',
    'MultiSelect',
    'The id of the form the hidden inputs belong to, for a multi-select rendered outside it.',
  ],
  [
    'total',
    'number',
    '\u2014',
    'MultiSelect',
    'The number of options in the whole collection, for aria-setsize on a windowed list.',
  ],
  [
    'max',
    'number | null',
    'null',
    'MultiSelect',
    'The most values the set may hold; null means no limit. At the limit, every option not yet chosen is announced as unavailable.',
  ],
  [
    'delimiters',
    'readonly string[]',
    ',',
    'MultiSelect',
    'The characters that commit the typed text and split a paste. One list serves both.',
  ],
  ['creatable', 'boolean', 'false', 'MultiSelect', 'Whether typed text may become a value.'],
  [
    'editable',
    'boolean',
    'false',
    'MultiSelect',
    'Whether Enter on a focused tag turns it into a text field.',
  ],
  [
    'reorderable',
    'boolean',
    'false',
    'MultiSelect',
    'Whether Alt with ArrowLeft, ArrowRight, Home or End moves the focused tag along the row.',
  ],
  [
    'allowDuplicates',
    'boolean',
    'false',
    'MultiSelect',
    'Whether the same value may be held twice.',
  ],
  [
    'addOnPaste',
    'boolean',
    'true',
    'MultiSelect',
    'Whether a paste that contains delimiters becomes several values.',
  ],
  [
    'commitOnBlur',
    'boolean',
    'true',
    'MultiSelect',
    'Whether typed text is committed when focus leaves the control.',
  ],
  [
    'overflow',
    "'wrap' | 'collapse'",
    'wrap',
    'MultiSelect',
    'What the control does with more tags than fit: wrap grows by rows up to three, then scrolls; collapse keeps one row and counts the rest in a +N tag.',
  ],
  [
    'chosenOptions',
    "'show' | 'hide'",
    'show',
    'MultiSelect',
    'Whether a chosen option stays in the list with a check, or leaves it.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the clear button is drawn while the control holds a value or typed text.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'false',
    'MultiSelect',
    'Whether choosing an option closes the list. Off by default, because a set is built with several choices.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'MultiSelect', 'Whether Escape closes the list.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'MultiSelect',
    'Whether a press outside the list closes it.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'MultiSelect',
    'Whether the highlight wraps from the last option to the first, and back.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the span the query matched is marked.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'MultiSelect',
    'The step of the control scale. Inside a field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'MultiSelect',
    'The frame: outline draws an edge, subtle a filled ground, plain neither until hover or focus.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'MultiSelect',
    'The side of the control the list opens on.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'MultiSelect',
    'How the list aligns along that side.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'MultiSelect',
    'content keeps the list at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'MultiSelect',
    'When the list exists in the DOM: only while open (active), from the first open on (lazy), or from the start (eager).',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'MultiSelect',
    'The CSS position the list uses.',
  ],
  [
    'openOn',
    "'input' | 'focus' | 'manual'",
    'input',
    'MultiSelect',
    'Which gestures open the list besides the trigger and the arrow keys: typing or a press on the input (input), also any focus on the input (focus), or none, so typing filters without opening (manual).',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'MultiSelect',
    'The distance in pixels between the control and the list.',
  ],
  ['alignOffset', 'number', '0', 'MultiSelect', 'The shift in pixels along the aligned edge.'],
  [
    'collisionPadding',
    'number',
    '8',
    'MultiSelect',
    'How close in pixels the list may come to the edge of the viewport before it moves.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the list moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the list slides along its side to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the list hides when the control scrolls out of its clipping container.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the list is portalled to the end of the document.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'MultiSelect',
    'Whether the control fills the width of its container.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'MultiSelect',
    'Whether the control is disabled: it takes no input, draws no remove buttons and leaves the tab order.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'MultiSelect',
    'Whether the values can be read and copied but not changed. The input stays focusable; the list, the remove buttons and the clear button are withheld.',
  ],
  ['required', 'boolean', 'false', 'MultiSelect', 'Whether an empty set is invalid.'],
  [
    'invalid',
    'boolean',
    'false',
    'MultiSelect',
    'Whether the control is drawn in the error state, with aria-invalid on the input.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'MultiSelect',
    'Whether options are on their way: the spinner replaces the chevron and the list shows placeholder rows.',
  ],
  [
    'messages',
    'Partial<MultiSelectMessages>',
    '\u2014',
    'MultiSelect',
    'Replaces any of the phrases the multi-select writes: clear, trigger, chosen ({count}), count ({count}), counter ({count}, {max}), create ({query}), empty, loading, remove ({label}) and reorder ({label}, {position}, {count}). Phrases left out come from the language in force.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '\u2014',
    'MultiSelectControl',
    'Replaces the frame element. The props it receives include the ref that measures the frame for the narrow layout, which the replacement has to keep.',
  ],
  [
    'chosen',
    'boolean',
    'true',
    'MultiSelectContent',
    'Whether the band of chosen values is drawn at the top of the list.',
  ],
  [
    'empty',
    'ReactNode',
    '\u2014',
    'MultiSelectContent',
    'What the list shows when no option matches, in place of the empty message.',
  ],
  [
    'status',
    'ReactNode',
    '\u2014',
    'MultiSelectContent',
    'What the live region says, in place of the number of matching options.',
  ],
  [
    'value',
    'string',
    '\u2014',
    'MultiSelectItem',
    'The key of the option, which is what enters the set.',
  ],
  ['disabled', 'boolean', 'false', 'MultiSelectItem', 'Whether the option can be chosen.'],
  ['description', 'ReactNode', '\u2014', 'MultiSelectItem', 'A second line under the label.'],
  [
    'icon',
    'ReactNode',
    '\u2014',
    'MultiSelectItem',
    'Any element, drawn in the first column of the option.',
  ],
  [
    'textValue',
    'string',
    '\u2014',
    'MultiSelectItem',
    'The text the filter compares, for an option whose children are not plain text.',
  ],
  [
    'position',
    'number',
    '\u2014',
    'MultiSelectItem',
    'The place of the option in a windowed collection, for aria-posinset.',
  ],
  ['label', 'ReactNode', '\u2014', 'MultiSelectGroup', 'The name of the group.'],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before the set changes. request.reason is select for an option, submit for typed text, remove for one value, clear for all of them, keyboard for a reorder, and programmatic for the handle and for a form reset. request.cancel() refuses the change.',
  },
  {
    name: 'onValueRefuse',
    payload: '(values: readonly string[], details: { cause: "duplicate" | "limit" | "invalid" })',
    when: 'Values were turned away, and details.cause says why. Nothing is held and nothing can be cancelled: the values never entered the set.',
  },
  {
    name: 'onInputValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the typed text changes. request.reason is keyboard while typing, select or submit when a commit empties it, clear for Escape or the clear button, blur when leaving the control commits it, and programmatic for a form reset.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the list opens or closes. request.reason is pointer, keyboard, escape, outsidePress, select, dismiss, blur or programmatic.',
  },
  {
    name: 'onHighlightedValueChange',
    payload: '(value: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the highlight moves. request.reason is pointer, keyboard or programmatic. Moving the highlight chooses nothing.',
  },
  {
    name: 'onLoadMore',
    payload: '()',
    when: 'The last option scrolled into view, so the next page can be fetched.',
  },
];

const composition = apiRows([
  [
    'MultiSelectDefaultsProvider',
    'component',
    '\u2014',
    'Application',
    'Sets any axis once for every multi-select below it. The words come from the language in force, set by SlottedProvider. A prop set on one multi-select still wins.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '\u2014',
    'MultiSelectControl, MultiSelectContent',
    'On MultiSelectControl, replaces the frame and receives the ref that measures it; a replacement that drops the ref loses the narrow layout. On MultiSelectContent, replaces the layer and receives its attributes and the options.',
  ],
  [
    'ref',
    'Ref<MultiSelectHandle>',
    '\u2014',
    'MultiSelect',
    'focus(), open(), close(), scrollToKey(value) and setValue(values, reason): the actions a prop cannot express.',
  ],
  [
    'native props',
    'ComponentPropsWithRef',
    '\u2014',
    'MultiSelectControl, MultiSelectContent',
    'Props written on MultiSelectControl reach the input, such as aria-label and placeholder; props written on MultiSelectContent reach the listbox. On the input, your onKeyDown, onChange, onClick, onFocus, onBlur and onPaste run first, and calling preventDefault stops the multi-select from handling that event.',
  ],
  [
    'data-*',
    'attributes',
    '\u2014',
    'every part',
    'Every state is an attribute to style: data-open, data-disabled, data-readonly, data-invalid, data-required, data-loading, data-selected, data-current and data-complete.',
  ],
]);

const accessibility = [
  'The input is the tab stop of the control. The tags, their remove buttons and the trigger carry tabindex="-1", as the combobox and grid patterns ask; the clear button, while it is drawn, is in the tab order.',
  'The tags are a layout grid with one row, which leaves ArrowDown and ArrowUp to the list. Focus lands on a tag rather than on its remove button, and Delete and Backspace do what the button does. The grid carries the number of chosen values as its name.',
  'The list sets aria-multiselectable, and selection does not follow the highlight: moving through the options chooses nothing until Enter or a press. This departs from the note in the combobox pattern, as every implementation surveyed does.',
  'Changes are announced as well as drawn: a value added with the count now held, a value removed with its label and the count left, a value moved with its new position, and the limit when it is reached. The status row announces how many options match the query.',
];

const code = defineSnippet({
  id: 'multi-select-react-anatomy',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="multi-select"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-overflow="wrap"
  data-full-width
>
  <div data-part="control" role="grid" aria-label="Affected services, 2 chosen">
    <div data-part="chips" role="row">
      <span data-ui="tag" data-part="root" data-size="sm" role="gridcell" tabindex="-1">
        <span data-part="body">
          <span data-part="label">checkout-api</span>
        </span>
        <button
          data-part="remove"
          type="button"
          tabindex="-1"
          aria-label="Remove checkout-api"
        ></button>
      </span>
      <span data-part="field" role="gridcell">
        <input
          data-part="input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="listbox-id"
        />
      </span>
    </div>
  </div>
  <button data-part="clear" type="button" aria-label="Clear"></button>
  <button data-part="trigger" type="button" tabindex="-1" aria-label="Show options">
    <span data-part="arrow"></span>
  </button>
</div>;

<div data-ui="multi-select" data-part="positioner" data-side="bottom" data-align="start" data-open>
  <div data-part="content" role="listbox" aria-multiselectable="true" id="listbox-id">
    <div data-part="chosen">
      <span data-ui="tag" data-part="root" data-size="sm">
        <span data-part="body">
          <span data-part="label">checkout-api</span>
        </span>
      </span>
    </div>
    <div
      data-part="item"
      role="option"
      aria-selected="true"
      data-selected
      data-value="checkout-api"
    >
      <span data-part="label">checkout-api</span>
      <span data-part="indicator"></span>
    </div>
    <div data-part="status" role="status" aria-live="polite">
      8 results
    </div>
  </div>
</div>;`,
});

const theming = defineSnippet({
  id: 'multi-select-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='multi-select'] {
  --slotted-multi-select-radius: var(--slotted-radius-md);
  --slotted-multi-select-highlight: var(--slotted-tone-accent-surface);
  --slotted-multi-select-counter-complete-color: var(--slotted-tone-warning-text);
  --slotted-multi-select-measure: 28rem;
}

/* The chips are tags, retuned under the identifier every tag shares, so a
   lighter tag label set here applies to every tag at once. */
[data-ui='tag'] {
  --slotted-tag-font-weight: var(--slotted-font-weight-regular);
}`,
});

export const REACT_MULTI_SELECT_DOCS = {
  'multi-select': {
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
