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

export const ANGULAR_MULTI_SELECT_TOKENS = multiSelectTokens.map((name) => ({
  name,
  purpose: 'A MultiSelect value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlMultiSelect, SlMultiSelectGroup, SlMultiSelectItem, SlMultiSelectSeparator } from '@slotted/angular/multi-select';",
  selector:
    'sl-multi-select, sl-multi-select-group, sl-multi-select-item, sl-multi-select-separator',
  exportAs: 'slMultiSelect, slMultiSelectGroup, slMultiSelectItem, slMultiSelectSeparator',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-multi-select, the host element itself',
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
    element: 'div, rendered by the layer template',
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

const accessibility = [
  'The input is the tab stop of the control. The tags, their remove buttons and the trigger carry tabindex="-1", as the combobox and grid patterns ask; the clear button, while it is drawn, is in the tab order.',
  'The tags are a layout grid with one row, which leaves ArrowDown and ArrowUp to the list. Focus lands on a tag rather than on its remove button, and Delete and Backspace do what the button does. The grid carries the number of chosen values as its name.',
  'The list sets aria-multiselectable, and selection does not follow the highlight: moving through the options chooses nothing until Enter or a press. This departs from the note in the combobox pattern, as every implementation surveyed does.',
  'Changes are announced as well as drawn: a value added with the count now held, a value removed with its label and the count left, a value moved with its new position, and the limit when it is reached. The status row announces how many options match the query.',
];
const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls under the canvas. Add a service, take one back out, and watch the row grow by whole rows rather than by pixels.',
    snippet: defineSnippet({
      id: 'multi-select-angular-playground',
      language: 'angular',
      label: 'A frame of chosen values, and a field that adds more',
      source: `<sl-multi-select
  aria-label="Affected services"
  placeholder="Add a service"
  [defaultValue]="['checkout-api']"
>
  <sl-multi-select-item value="checkout-api" label="checkout-api" />
  <sl-multi-select-item value="payments-worker" label="payments-worker" />
</sl-multi-select>`,
    }),
  },
  {
    id: 'chips',
    title: 'The chips, and where they live',
    note: 'Inside the frame, beside the caret, because this control holds a real input. Each chip is a tag: the same pill, the same remove control, the same geometry stated once in tag.css.',
    snippet: defineSnippet({
      id: 'multi-select-angular-chips',
      language: 'angular',
      label: 'The set is an array, and the order is the reader’s',
      source: `<sl-multi-select aria-label="Affected services" [(value)]="services">
  <sl-multi-select-item value="checkout-api" label="checkout-api" />
</sl-multi-select>`,
    }),
  },
  {
    id: 'creation',
    title: 'Creating a value the list does not hold',
    note: 'With creatable, the offer stands as an option — ArrowDown reaches it, aria-activedescendant names it and Enter takes it — and its mark is the plus rather than the check, because nothing is in the set yet.',
    snippet: defineSnippet({
      id: 'multi-select-angular-creation',
      language: 'angular',
      label: 'Text becomes a value, under the reason submit',
      source: `<sl-multi-select aria-label="Labels" creatable (valueChangeRequest)="onLabels($event)">
  <sl-multi-select-item value="regression" label="regression" />
</sl-multi-select>`,
    }),
  },
  {
    id: 'limit',
    title: 'A limit that is a validity, not a silence',
    note: 'At the limit the counter takes the accent, the root carries data-complete, every unchosen option answers aria-disabled, and what was refused leaves through valueRefuse instead of vanishing.',
    snippet: defineSnippet({
      id: 'multi-select-angular-limit',
      language: 'angular',
      label: 'What the control refuses, and how it says so',
      source: `<sl-multi-select aria-label="Responders" [max]="3" (valueRefuse)="warn($event)">
  <sl-multi-select-item value="ana.pereira" label="Ana Pereira" />
</sl-multi-select>`,
    }),
  },
  {
    id: 'duplicates',
    title: 'Duplicates',
    note: 'The comparison is locale-sensitive, so P1 is already held when p1 is typed. The refusal moves focus to the chip that holds it: the reader is shown where their value is instead of being told nothing happened.',
    snippet: defineSnippet({
      id: 'multi-select-angular-duplicates',
      language: 'angular',
      label: 'Refused by default, allowed on request',
      source: `<sl-multi-select aria-label="Labels" creatable locale="pt-BR" />

<sl-multi-select aria-label="Labels" allowDuplicates creatable />`,
    }),
  },
  {
    id: 'reorder',
    title: 'Reorder, by keyboard first',
    note: 'Alt with an arrow moves the focused chip one place, following the writing direction; Alt+Home and Alt+End take it to either end. The set is unchanged and the request carries keyboard, so a consumer persisting an order listens for exactly that.',
    snippet: defineSnippet({
      id: 'multi-select-angular-reorder',
      language: 'angular',
      label: 'The one reason reorder emits',
      source: `<sl-multi-select aria-label="Rollback order" reorderable (valueChangeRequest)="onOrder($event)" />`,
    }),
  },
  {
    id: 'paste',
    title: 'Pasting many values at once',
    note: 'One list of delimiters serves the key and the paste split, so a control cannot accept a comma-separated list from the clipboard and refuse it from the keyboard. Past the limit, the rest is reported rather than dropped.',
    snippet: defineSnippet({
      id: 'multi-select-angular-paste',
      language: 'angular',
      label: 'The separators, and what a long paste does',
      source: `<sl-multi-select aria-label="Notify" addOnPaste creatable [delimiters]="[',', ';']" [max]="5" />`,
    }),
  },
  {
    id: 'editing',
    title: 'Editing a chip in place',
    note: 'Enter on a focused chip turns its cell into a field, Enter commits and Escape reverts — which is the grid pattern’s own answer for a cell holding editable content. The commit is one transition, not a removal and an addition.',
    snippet: defineSnippet({
      id: 'multi-select-angular-editing',
      language: 'angular',
      label: 'A chip that can be corrected rather than retyped',
      source: `<sl-multi-select aria-label="Labels" creatable editable [defaultValue]="['payments-worker']" />`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering, and the mark',
    note: 'The default comparison is locale-sensitive and the mark shows the span the collator matched, rather than a naive substring that would disagree with it. chosenOptions decides whether a value already held stays in the list.',
    snippet: defineSnippet({
      id: 'multi-select-angular-filtering',
      language: 'angular',
      label: 'Three answers, and which one each asks for',
      source: `<sl-multi-select aria-label="Services" locale="pt-BR" />

<sl-multi-select aria-label="Services" [filter]="startsWith" />

<sl-multi-select aria-label="Services" chosenOptions="hide" [filter]="null" />`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'A set of options under a heading the group points at with aria-labelledby. A group whose every option was filtered away leaves the surface entirely, so a heading never claims a category matched when none did.',
    snippet: defineSnippet({
      id: 'multi-select-angular-groups',
      language: 'angular',
      label: 'Options under a name',
      source: `<sl-multi-select aria-label="Affected services">
  <sl-multi-select-group label="Payments">
    <sl-multi-select-item value="checkout-api" label="checkout-api" />
  </sl-multi-select-group>
  <sl-multi-select-separator />
  <sl-multi-select-group label="Platform">
    <sl-multi-select-item value="auth-gateway" label="auth-gateway" />
  </sl-multi-select-group>
</sl-multi-select>`,
    }),
  },
  {
    id: 'overflow',
    title: 'Overflow, and access to the whole set',
    note: 'wrap grows by rows to three and then scrolls, keeping every chip in the DOM. collapse is one line high for a table row: what did not fit becomes a counting chip that opens the popup, whose band holds every value.',
    snippet: defineSnippet({
      id: 'multi-select-angular-overflow',
      language: 'angular',
      label: 'Two answers, and where each belongs',
      source: `<sl-multi-select aria-label="Services" overflow="wrap" />

<sl-multi-select aria-label="Services" overflow="collapse" />`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'The three control steps, from the geometry every control in the library reads. An empty control is exactly the height of a text field beside it on the same form; a chip is what changes that.',
    snippet: defineSnippet({
      id: 'multi-select-angular-sizes',
      language: 'angular',
      label: 'The three steps',
      source: `<sl-multi-select aria-label="Services" size="sm" />
<sl-multi-select aria-label="Services" size="md" />
<sl-multi-select aria-label="Services" size="lg" />`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline for a form, subtle for a panel that already has a ground, and plain for a table cell — where an edge and a resting shadow would draw a cell that is not there.',
    snippet: defineSnippet({
      id: 'multi-select-angular-variants',
      language: 'angular',
      label: 'Three frames, three contexts',
      source: `<sl-multi-select aria-label="Services" variant="outline" />
<sl-multi-select aria-label="Services" variant="subtle" />
<sl-multi-select aria-label="Services" variant="plain" />`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'disabled answers nothing and keeps its values legible; readOnly keeps the caret and the copy and withholds the popup and every remove control; invalid retints the border and the focus ring together.',
    snippet: defineSnippet({
      id: 'multi-select-angular-states',
      language: 'angular',
      label: 'What each state withholds',
      source: `<sl-multi-select aria-label="Services" disabled />
<sl-multi-select aria-label="Services" readOnly />
<sl-multi-select aria-label="Services" invalid required />`,
    }),
  },
  {
    id: 'loading-and-empty',
    title: 'Loading, and nothing found',
    note: 'While an answer travels the control shows the ring where the chevron stood and the popup shows rows the height of an option — the shape of the list that is coming. A query nothing answered keeps the surface’s measure rather than collapsing it.',
    snippet: defineSnippet({
      id: 'multi-select-angular-loading',
      language: 'angular',
      label: 'The wait, and the answer that was not there',
      source: `<sl-multi-select aria-label="Services" loading />

<sl-multi-select aria-label="Services" [messages]="{ empty: 'No service by that name' }" />`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A forty-character service name truncates inside its chip and stays whole in the accessibility tree; the row wraps rather than pushing the frame wider; and under 120 pixels there is no chip at all and the counter answers instead.',
    snippet: defineSnippet({
      id: 'multi-select-angular-long-content',
      language: 'angular',
      label: 'Truncation removes nothing from the DOM',
      source: `<sl-multi-select
  aria-label="Affected services"
  [defaultValue]="['notification-relay-eu-west-1-canary']"
/>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Backspace from an empty field moves to the last chip and removes nothing; a second press removes it. Delete takes the focused chip out, the arrows walk the row, and a printable character sends the reader back to the field.',
    snippet: defineSnippet({
      id: 'multi-select-angular-keyboard',
      language: 'angular',
      label: 'One tab stop, and the keys inside it',
      source: `<sl-multi-select aria-label="Affected services" [closeOnSelect]="false" [loop]="false" />`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'One hidden input per value, all under the same name, and a ControlValueAccessor with a Validator beside it — so a Reactive Form sees required, tooMany and duplicate without the consumer writing one.',
    snippet: defineSnippet({
      id: 'multi-select-angular-form',
      language: 'angular',
      label: 'Several values under one key, and a validator',
      source: `<div slField [invalid]="services.invalid">
  <label slFieldLabel>Affected services</label>
  <sl-multi-select name="services" required [formControl]="services" [max]="3" />
  <span slFieldError>Name at least one service</span>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition, and the defaults an application sets once',
    note: 'An injection token carries the axes, provideSlotted the language, exportAs reaches the instance from the template, and projected options keep their own content.',
    snippet: defineSnippet({
      id: 'multi-select-angular-composition',
      language: 'angular',
      label: 'Set once, reached from the template',
      source: `<sl-multi-select #services="slMultiSelect" aria-label="Affected services" />

<button type="button" (click)="services.focus()">Add a service</button>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'readonly string[]',
    '\u2014',
    'sl-multi-select',
    'The chosen values, in the order the reader chose them. A model, so [(value)] binds both ways.',
  ],
  [
    'defaultValue',
    'readonly string[]',
    '\u2014',
    'sl-multi-select',
    'The values an unbound multi-select starts with, read once in ngOnInit.',
  ],
  [
    'inputValue',
    'string',
    '\u2014',
    'sl-multi-select',
    'The text in the input. It is emptied whenever a value is committed. A model.',
  ],
  ['open', 'boolean', '\u2014', 'sl-multi-select', 'Whether the list is open. A model.'],
  [
    'highlightedValue',
    'string | null',
    '\u2014',
    'sl-multi-select',
    'The option the highlight is on, which is not a chosen option. A model.',
  ],
  [
    'aria-label',
    'string',
    '\u2014',
    'sl-multi-select',
    'Names the input and the list, for a multi-select outside a field.',
  ],
  [
    'placeholder',
    'string',
    '\u2014',
    'sl-multi-select',
    'The text the input shows while no value is chosen.',
  ],
  [
    'items',
    'MultiSelectItems',
    '\u2014',
    'sl-multi-select',
    'Values and labels declared up front, so a tag shows its label before the list has rendered its options.',
  ],
  [
    'filter',
    'MultiSelectFilter',
    '\u2014',
    'sl-multi-select',
    'Compares an option label with the query. When absent, the comparison is a locale-sensitive "contains" that ignores case and accents; null turns filtering off for options a server has already filtered.',
  ],
  [
    'locale',
    'string',
    '\u2014',
    'sl-multi-select',
    'The BCP 47 language of the filter and of the duplicate comparison. When absent, the language in force.',
  ],
  [
    'validateValue',
    '(text, values) => boolean',
    '\u2014',
    'sl-multi-select',
    'Whether typed text may become a value. Text it turns down is reported through (valueRefuse) with the cause invalid.',
  ],
  [
    'name',
    'string',
    '\u2014',
    'sl-multi-select',
    'The submission name. One hidden input per value carries it.',
  ],
  [
    'form',
    'string',
    '\u2014',
    'sl-multi-select',
    'The id of the form the hidden inputs belong to, for a multi-select rendered outside it.',
  ],
  [
    'total',
    'number',
    '\u2014',
    'sl-multi-select',
    'The number of options in the whole collection, for aria-setsize on a windowed list.',
  ],
  [
    'max',
    'number | null',
    'null',
    'sl-multi-select',
    'The most values the set may hold; null means no limit. At the limit, every option not yet chosen is announced as unavailable. Past it, the validator reports tooMany.',
  ],
  [
    'delimiters',
    'readonly string[]',
    ',',
    'sl-multi-select',
    'The characters that commit the typed text and split a paste. One list serves both.',
  ],
  ['creatable', 'boolean', 'false', 'sl-multi-select', 'Whether typed text may become a value.'],
  [
    'editable',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether Enter on a focused tag turns it into a text field.',
  ],
  [
    'reorderable',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether Alt with ArrowLeft, ArrowRight, Home or End moves the focused tag along the row.',
  ],
  [
    'allowDuplicates',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether the same value may be held twice.',
  ],
  [
    'addOnPaste',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether a paste that contains delimiters becomes several values.',
  ],
  [
    'commitOnBlur',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether typed text is committed when focus leaves the control.',
  ],
  [
    'overflow',
    "'wrap' | 'collapse'",
    'wrap',
    'sl-multi-select',
    'What the control does with more tags than fit: wrap grows by rows up to three, then scrolls; collapse keeps one row and counts the rest in a +N tag.',
  ],
  [
    'chosenOptions',
    "'show' | 'hide'",
    'show',
    'sl-multi-select',
    'Whether a chosen option stays in the list with a check, or leaves it.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the clear button is drawn while the control holds a value or typed text.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether choosing an option closes the list. Off by default, because a set is built with several choices.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'sl-multi-select', 'Whether Escape closes the list.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether a press outside the list closes it.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether the highlight wraps from the last option to the first, and back.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the span the query matched is marked.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-multi-select',
    'The step of the control scale. Inside a field, an unset size follows the field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'sl-multi-select',
    'The frame: outline draws an edge, subtle a filled ground, plain neither until hover or focus.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'sl-multi-select',
    'The side of the control the list opens on.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'sl-multi-select',
    'How the list aligns along that side.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'sl-multi-select',
    'content keeps the list at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'sl-multi-select',
    'When the list exists in the DOM: only while open (active), from the first open on (lazy), or from the start (eager).',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'sl-multi-select',
    'The CSS position the list uses.',
  ],
  [
    'openOn',
    "'input' | 'focus' | 'manual'",
    'input',
    'sl-multi-select',
    'Which gestures open the list besides the trigger and the arrow keys: typing or a press on the input (input), also any focus on the input (focus), or none, so typing filters without opening (manual).',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'sl-multi-select',
    'The distance in pixels between the control and the list.',
  ],
  ['alignOffset', 'number', '0', 'sl-multi-select', 'The shift in pixels along the aligned edge.'],
  [
    'collisionPadding',
    'number',
    '8',
    'sl-multi-select',
    'How close in pixels the list may come to the edge of the viewport before it moves.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the list moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the list slides along its side to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the list hides when the control scrolls out of its clipping container.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the list is portalled to the end of the document.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'sl-multi-select',
    'Whether the control fills the width of its container.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether the control is disabled: it takes no input, draws no remove buttons and leaves the tab order.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether the values can be read and copied but not changed. The input stays focusable; the list, the remove buttons and the clear button are withheld.',
  ],
  ['required', 'boolean', 'false', 'sl-multi-select', 'Whether an empty set is invalid.'],
  [
    'invalid',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether the control is drawn in the error state, with aria-invalid on the input.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'sl-multi-select',
    'Whether options are on their way: the spinner replaces the chevron and the list shows placeholder rows.',
  ],
  [
    'messages',
    'Partial<MultiSelectMessages>',
    '\u2014',
    'sl-multi-select',
    'Replaces any of the phrases the multi-select writes: clear, trigger, chosen ({count}), count ({count}), counter ({count}, {max}), create ({query}), empty, loading, remove ({label}) and reorder ({label}, {position}, {count}). Phrases left out come from the language in force.',
  ],
  [
    'value',
    'string',
    '\u2014',
    'sl-multi-select-item',
    'The key of the option, which is what enters the set.',
  ],
  [
    'label',
    'string',
    '\u2014',
    'sl-multi-select-item',
    'What the reader sees, what the filter compares and what the mark splits. It is an input rather than projected content, because the filter needs the text before the option renders.',
  ],
  ['disabled', 'boolean', 'false', 'sl-multi-select-item', 'Whether the option can be chosen.'],
  ['description', 'string', '\u2014', 'sl-multi-select-item', 'A second line under the label.'],
  [
    'icon',
    'GlyphName',
    '\u2014',
    'sl-multi-select-item',
    'The name of the glyph drawn in the first column of the option, as a Glyph inside an Icon box.',
  ],
  [
    'position',
    'number',
    '\u2014',
    'sl-multi-select-item',
    'The place of the option in a windowed collection, for aria-posinset.',
  ],
  ['label', 'string', '\u2014', 'sl-multi-select-group', 'The name of the group.'],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'readonly string[]',
    when: 'The set changed. It is the two-way half of [(value)].',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'The same change, with its reason: select for an option, submit for typed text, remove for one value, clear for all of them, keyboard for a reorder, and programmatic for a method.',
  },
  {
    name: 'valueRefuse',
    payload: '{ values: readonly string[]; cause: "duplicate" | "limit" | "invalid" }',
    when: 'Values were turned away, and cause says why. Nothing is held and nothing can be cancelled: the values never entered the set.',
  },
  {
    name: 'inputValueChange',
    payload: 'string',
    when: 'The typed text changed. It is the two-way half of [(inputValue)], and inputValueChangeRequest carries the reason.',
  },
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'The list opened or closed. openChangeRequest carries the reason: pointer, keyboard, escape, outsidePress, select, dismiss, blur or programmatic.',
  },
  {
    name: 'highlightedValueChange',
    payload: 'string | null',
    when: 'The highlight moved. Moving it chooses nothing, and highlightedValueChangeRequest carries the reason.',
  },
  {
    name: 'loadMore',
    payload: 'void',
    when: 'The last option scrolled into view, so the next page can be fetched.',
  },
];

const composition = apiRows([
  [
    'provideMultiSelectDefaults()',
    'Provider',
    '\u2014',
    'Application',
    'Sets any axis once for every multi-select below it, in a bootstrap, a route or a component. The words come from the language in force, set by provideSlotted. A binding written on one multi-select still wins.',
  ],
  [
    'exportAs',
    'slMultiSelect',
    '\u2014',
    'sl-multi-select',
    'The instance, for a template that calls focus(), setOpen(), admit(), remove(), move(), clear() or scrollToKey().',
  ],
  [
    'ControlValueAccessor',
    'NG_VALUE_ACCESSOR',
    '\u2014',
    'sl-multi-select',
    'formControl, formControlName and ngModel bind the whole set, and the disabled state of the form reaches the control.',
  ],
  [
    'Validator',
    'NG_VALIDATORS',
    '\u2014',
    'sl-multi-select',
    'Reports required, tooMany and duplicate to a reactive form, with no validator to write. The React binding has no equivalent.',
  ],
  [
    'ng-content',
    'projection',
    '\u2014',
    'sl-multi-select',
    'Options, groups and separators are your content, so your own control flow decides what the list holds.',
  ],
]);

const code = defineSnippet({
  id: 'multi-select-angular-anatomy',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<sl-multi-select
  data-ui="multi-select"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-overflow="wrap"
  data-full-width
>
  <div data-part="control" role="grid" aria-label="Affected services, 1 chosen">
    <div data-part="chips" role="row">
      <span data-ui="tag" data-part="root" data-size="sm" role="gridcell" tabindex="-1">
        <span data-part="body"><span data-part="label">checkout-api</span></span>
        <button data-part="remove" type="button" tabindex="-1"></button>
      </span>
      <span data-part="field" role="gridcell">
        <input data-part="input" type="text" role="combobox" aria-autocomplete="list" />
      </span>
    </div>
  </div>
  <button data-part="trigger" type="button" tabindex="-1">
    <span data-part="arrow"></span>
  </button>
</sl-multi-select>`,
});

const theming = defineSnippet({
  id: 'multi-select-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='multi-select'] {
  --slotted-multi-select-radius: var(--slotted-radius-md);
  --slotted-multi-select-highlight: var(--slotted-tone-accent-surface);
  --slotted-multi-select-counter-complete-color: var(--slotted-tone-warning-text);
}

/* The chips are tags, retuned under the identifier every tag shares, so a
   lighter tag label set here applies to every tag at once. */
[data-ui='tag'] {
  --slotted-tag-font-weight: var(--slotted-font-weight-regular);
}`,
});

export const ANGULAR_MULTI_SELECT_DOCS = {
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
