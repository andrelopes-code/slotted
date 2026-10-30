import tagsInputTokens from '@slotted/styles/tags-input/tokens.json';
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

export const REACT_TAGS_INPUT_TOKENS = tagsInputTokens.map((name) => ({
  name,
  purpose: 'Theme-owned TagsInput decision',
}));

const imports: ReferenceImport = {
  source: "import { TagsInput, TagsInputDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame, carrying data-ui="tags-input". It draws the border, the shadow, the focus ring and every state, and it grows by whole rows of chips to three, then scrolls. Under overflow="collapse" it carries data-expanded while focus is inside it.',
  },
  {
    part: 'control',
    element: 'div with role="grid"',
    required: true,
    purpose:
      'The layout grid the chips and the field live in. The APG names this exact control — "a list of recipients for a message may be a grid where each cell contains a link that represents a recipient" — and one element of a layout grid is in the page tab sequence.',
  },
  {
    part: 'chips',
    element: 'div with role="row"',
    required: true,
    purpose:
      'One DOM row, however many lines it draws. The wrap is CSS, so the reading order stays linear. Each value in it is a tag worn as a gridcell; an invalid one wears the danger tone and the alert mark. The row names the hint as its description.',
  },
  {
    part: 'field',
    element: 'span with role="gridcell"',
    required: true,
    purpose:
      'The last cell of the row, holding the caret. It wraps with the chips rather than being pushed to a line of its own, and it asks for a word of width while keeping a floor of two characters.',
  },
  {
    part: 'input',
    element: 'input, with no role',
    required: true,
    purpose:
      "A real text box that opens nothing, so every text-editing key, the caret, IME, autofill, a datalist named by list, and constraint validation stay the browser's. It is the control's one tab stop, and it carries the list's verdict as its custom validity.",
  },
  {
    part: 'message',
    element: 'span, visually hidden',
    required: false,
    purpose:
      "Why a value is wrong, inside its chip: the consumer's reason, the browser's own validationMessage, or the generic invalidLabel. The chip names it as its description and repeats it as its title.",
  },
  {
    part: 'counter',
    element: 'span',
    required: false,
    purpose:
      'How many values are held against the limit that holds them. Drawn only where it answers something — while max is set, or while the frame is too narrow for a chip.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Takes every value the reader may remove out at once, under the reason clear. Present only while clearable is set and the control holds something removable.',
  },
  {
    part: 'hint',
    element: 'span, visually hidden',
    required: true,
    purpose:
      'What the row answers to, for a reader who cannot see the remove buttons: Delete removes a value, and — while editable — Enter edits it. The row names it as its description.',
  },
  {
    part: 'suggestions',
    element: 'div[role="listbox"]',
    required: false,
    purpose:
      'With suggestions, the list under the frame of the ones the typed text matches, minus the values already chosen. Rendered only while open; the input controls it and names its highlighted option by aria-activedescendant.',
  },
  {
    part: 'suggestion',
    element: 'div[role="option"]',
    required: false,
    purpose:
      'One suggestion. data-highlighted and aria-selected on the one Enter adds; a press adds it and keeps focus in the input.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls under the canvas. Type an address and press Enter or a comma; type one without an @ and watch it stay, marked, instead of vanishing.',
    snippet: defineSnippet({
      id: 'tags-input-react-playground',
      language: 'tsx',
      label: 'A frame of typed values, and a field that adds more',
      source: `<TagsInput
  aria-label="To"
  defaultValue={['ana.pereira@example.com']}
  placeholder="Add a recipient"
  type="email"
/>;`,
    }),
  },
  {
    id: 'recipients',
    title: 'The recipients of a message',
    note: 'The value is a list of texts and the text is the label. formatLabel draws the chip from the address — a name where the value is an address — and the value a form receives stays the address.',
    snippet: defineSnippet({
      id: 'tags-input-react-recipients',
      language: 'tsx',
      label: 'The value is an ordered list of texts',
      source: `const [to, setTo] = useState<readonly string[]>(['ana.pereira@example.com']);

<TagsInput
  aria-label="To"
  formatLabel={(address) => contacts.get(address) ?? address}
  onValueChange={setTo}
  type="email"
  value={to}
/>;`,
    }),
  },
  {
    id: 'validity',
    title: 'A value that fails is held, not dropped',
    note: 'jhon.company stays where the reader can see it: the chip takes the danger tone and the alert mark, its reason is its description and its title, the frame is invalid, and a native submit is refused with the browser’s bubble on the control. Under invalidValues="refuse" the same value is reported instead.',
    snippet: defineSnippet({
      id: 'tags-input-react-validity',
      language: 'tsx',
      label: 'validate says why; keep or refuse says what happens next',
      source: `<TagsInput
  aria-label="To"
  validate={(text) => (text.includes('@') ? true : 'Needs an @ and a domain')}
/>;

<TagsInput
  aria-label="SKUs"
  invalidValues="refuse"
  onValueRefuse={(values, { cause }) => report(cause, values)}
  validate={(text) => /^[A-Z]{3}-\\d{4}$/.test(text)}
/>;`,
    }),
  },
  {
    id: 'platform-validation',
    title: 'The browser validates, in the reader’s language',
    note: 'With no validate given, type="email" and pattern judge each value the way the platform judges a single one, and the chip’s reason is the browser’s own validationMessage — already translated, and already the sentence the reader has seen on every other form.',
    snippet: defineSnippet({
      id: 'tags-input-react-platform-validation',
      language: 'tsx',
      label: 'No validator, and no regex of the family’s own',
      source: `<TagsInput aria-label="To" type="email" />;

<TagsInput aria-label="Order numbers" pattern="ORD-\\d{6}" />;`,
    }),
  },
  {
    id: 'limit',
    title: 'A limit that is counted, and refused past it',
    note: 'The counter is drawn only because max is set, takes the accent once the list is full, and the root carries data-complete. What arrives past the limit is reported with the values rather than dropped — a paste of six into a list of three says which three did not fit.',
    snippet: defineSnippet({
      id: 'tags-input-react-limit',
      language: 'tsx',
      label: 'Counted, and reported past the count',
      source: `<TagsInput
  aria-label="Reviewers"
  max={3}
  onValueRefuse={(values, { cause }) => cause === 'limit' && show(values)}
/>;`,
    }),
  },
  {
    id: 'duplicates',
    title: 'Duplicates',
    note: 'The comparison is locale-sensitive, so typing ANA.PEREIRA@EXAMPLE.COM finds the address already held; focus goes to that chip and its edge takes the accent for one long step, rather than nothing happening. allowDuplicates lets the same value stand twice.',
    snippet: defineSnippet({
      id: 'tags-input-react-duplicates',
      language: 'tsx',
      label: 'Refused and shown where, or allowed',
      source: `<TagsInput aria-label="To" locale="pt-BR" />;

<TagsInput aria-label="Line items" allowDuplicates />;`,
    }),
  },
  {
    id: 'paste',
    title: 'Pasting many values at once',
    note: 'A paste splits on the delimiters and on every line break — a column copied out of a spreadsheet arrives one value per line. split replaces the rule for a clipboard the family cannot guess, such as addresses with quoted names in them.',
    snippet: defineSnippet({
      id: 'tags-input-react-paste',
      language: 'tsx',
      label: 'The same rule the key reads, or the consumer’s own',
      source: `<TagsInput aria-label="Cc" delimiters={[',', ';']} type="email" />;

<TagsInput
  aria-label="To"
  split={(text) => text.match(/[^\\s@,"]+@[^\\s,>"]+/g) ?? []}
  type="email"
/>;`,
    }),
  },
  {
    id: 'blur',
    title: 'What leaving does with the pending text',
    note: 'Three answers, one word each: commit turns the text into a value, keep leaves it in the box, discard empties it. A recipients field commits; a filter operand keeps; a chat box discards.',
    snippet: defineSnippet({
      id: 'tags-input-react-blur',
      language: 'tsx',
      label: 'commit, keep, discard',
      source: `<TagsInput aria-label="To" pendingOnBlur="commit" />;
<TagsInput aria-label="Filter" pendingOnBlur="keep" />;
<TagsInput aria-label="Tags" pendingOnBlur="discard" />;`,
    }),
  },
  {
    id: 'editing',
    title: 'Editing a chip in place',
    note: 'Enter on a chip — or a double click — turns its cell into a text field holding the value. Enter commits, Escape reverts, and the edit is judged like any other value: an edit into an address already held is refused and the chip that holds it takes focus.',
    snippet: defineSnippet({
      id: 'tags-input-react-editing',
      language: 'tsx',
      label: 'Enter opens, Enter commits, Escape reverts',
      source: `<TagsInput aria-label="To" editable type="email" />;`,
    }),
  },
  {
    id: 'reorder',
    title: 'Reorder, by keyboard first',
    note: 'Alt with an arrow moves the focused chip one place along the row, following the writing direction; Alt+Home and Alt+End move it to either end. The request carries keyboard and nothing else, so a consumer persisting an order listens for exactly that.',
    snippet: defineSnippet({
      id: 'tags-input-react-reorder',
      language: 'tsx',
      label: 'The order is the reader’s, and a contract',
      source: `<TagsInput
  aria-label="Approvers, in order"
  onValueChange={(next, { reason }) => reason === 'keyboard' && saveOrder(next)}
  reorderable
/>;`,
    }),
  },
  {
    id: 'locked',
    title: 'A value the reader may not remove',
    note: 'lockedValues keeps a mandatory recipient in the list: its chip carries data-disabled, draws no remove control, is skipped by Backspace and by the clear button, and is still reachable by arrow — because the reader still has to be able to read it.',
    snippet: defineSnippet({
      id: 'tags-input-react-locked',
      language: 'tsx',
      label: 'Locked, and still readable',
      source: `<TagsInput
  aria-label="Cc"
  defaultValue={['support@example.com', 'ana.pereira@example.com']}
  lockedValues={['support@example.com']}
/>;`,
    }),
  },
  {
    id: 'copy',
    title: 'The list on the clipboard',
    note: 'Ctrl+C on a chip copies its value; Ctrl+X copies it and removes it. Ctrl+C on the empty field copies the whole list, joined by the first delimiter and a space — the shape a paste into another instance of this family reads back.',
    snippet: defineSnippet({
      id: 'tags-input-react-copy',
      language: 'tsx',
      label: 'What was copied, and whether it got there',
      source: `<TagsInput
  aria-label="Cc"
  onValueCopy={(values, outcome) => outcome === 'refused' && warn(values)}
/>;`,
    }),
  },
  {
    id: 'overflow',
    title: 'Overflow, and access to the whole list',
    note: 'wrap grows the frame by whole rows to three and scrolls past them, and nothing leaves the DOM. collapse keeps one line and a +N at rest — for a filter bar or a table cell — and shows every chip while focus is inside the control, because there is no popup to hold them and no need for one.',
    snippet: defineSnippet({
      id: 'tags-input-react-overflow',
      language: 'tsx',
      label: 'Rows, or one line that opens where the reader is',
      source: `<TagsInput aria-label="Cc" overflow="wrap" />;
<TagsInput aria-label="Cc" overflow="collapse" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'The frame takes the control height of its step, so an empty control is exactly the height of a text field beside it; the chips keep the small step at every size, because a chip is a chip and not a control.',
    snippet: defineSnippet({
      id: 'tags-input-react-sizes',
      language: 'tsx',
      label: 'Three frames, one chip',
      source: `<TagsInput aria-label="To" size="sm" />;
<TagsInput aria-label="To" size="md" />;
<TagsInput aria-label="To" size="lg" />;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline for a form, subtle for a panel that already has a ground, and plain for a table cell — where an edge and a resting shadow would draw a cell that is not there.',
    snippet: defineSnippet({
      id: 'tags-input-react-variants',
      language: 'tsx',
      label: 'Three frames, three contexts',
      source: `<TagsInput aria-label="To" variant="outline" />;
<TagsInput aria-label="To" variant="subtle" />;
<TagsInput aria-label="To" variant="plain" />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'disabled answers nothing and keeps its values legible; readOnly keeps the caret, the copy and the chips at full ink, and withholds every remove control; invalid retints the border and the focus ring together; required is the platform’s own, written on the input only while the list is empty.',
    snippet: defineSnippet({
      id: 'tags-input-react-states',
      language: 'tsx',
      label: 'What each state withholds',
      source: `<TagsInput aria-label="To" disabled />;
<TagsInput aria-label="To" readOnly />;
<TagsInput aria-label="To" invalid required />;`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A sixty-character address truncates inside its chip and stays whole in the accessibility tree; the row wraps rather than pushing the frame wider; and under 120 pixels there is no chip at all and the counter answers instead.',
    snippet: defineSnippet({
      id: 'tags-input-react-long-content',
      language: 'tsx',
      label: 'Truncation removes nothing from the DOM',
      source: `<TagsInput
  aria-label="To"
  defaultValue={['quality-assurance-and-release-management@subsidiary.example.com']}
/>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches the field once. Backspace from an empty field moves to the last chip and removes nothing; a second press removes it. Delete takes the focused chip out, the arrows walk the row and mirror under rtl, Escape clears the text and never the list, and a printable character sends the reader back to the field.',
    snippet: defineSnippet({
      id: 'tags-input-react-keyboard',
      language: 'tsx',
      label: 'One tab stop, and the keys inside it',
      source: `<TagsInput aria-label="To" defaultValue={['ana.pereira@example.com']} editable reorderable />;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'One hidden input per value under the name to, so a plain FormData receives all of them under one key; required is written on the visible input only while the list is empty; and an invalid value blocks the native submit through setCustomValidity. The field carries the label, the description and the error by ID.',
    snippet: defineSnippet({
      id: 'tags-input-react-form',
      language: 'tsx',
      label: 'Several values under one key, and the platform’s own gate',
      source: `<Field required>
  <FieldLabel>To</FieldLabel>
  <FieldDescription>Everyone who should see this message.</FieldDescription>
  <TagsInput name="to" type="email" />
  <FieldError>Name at least one recipient</FieldError>
</Field>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider carries every axis, the words come from the language in force, and a prop on one control still wins over it. render replaces the frame, ref reaches the input, handleRef reaches focus, clear and setValue, and list passes through to a datalist for the browser’s own completion.',
    snippet: defineSnippet({
      id: 'tags-input-react-composition',
      language: 'tsx',
      label: 'Defaults once, and the handle',
      source: `<TagsInputDefaultsProvider delimiters={[',', ';']}>
  <TagsInput aria-label="To" handleRef={handle} list="contacts" type="email" />
  <datalist id="contacts">
    <option value="ana.pereira@example.com" />
  </datalist>
</TagsInputDefaultsProvider>;`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'readonly string[]',
    '—',
    'TagsInput',
    'The values, in the order the reader gave them. Controlled.',
  ],
  [
    'defaultValue',
    'readonly string[]',
    '—',
    'TagsInput',
    'The list an unbound control starts from, read once.',
  ],
  [
    'inputValue',
    'string',
    '—',
    'TagsInput',
    'The characters in the field. Controlled; it is emptied whenever a value is committed.',
  ],
  [
    'defaultInputValue',
    'string',
    '—',
    'TagsInput',
    'The text an unbound field starts from, read once.',
  ],
  [
    'type',
    "'text' | 'email' | 'url' | 'tel' | 'search'",
    'text',
    'TagsInput',
    'The input’s own type, and — with no validate — the grammar each value is judged against.',
  ],
  [
    'validate',
    '(text: string) => boolean | string',
    '—',
    'TagsInput',
    'Whether a text may be a value: true, false with the generic label, or a string saying why not. Absent, the input’s type, pattern, minLength and maxLength judge.',
  ],
  [
    'invalidValues',
    "'keep' | 'refuse'",
    'keep',
    'TagsInput',
    'What becomes of a value that fails: a chip in the danger tone with its reason, or a report through onValueRefuse.',
  ],
  [
    'normalize',
    '(text: string) => string',
    '—',
    'TagsInput',
    'Runs before a value is judged. Trim by default; an email field lowercases here.',
  ],
  [
    'split',
    '(text: string) => readonly string[]',
    '—',
    'TagsInput',
    'How a paste is split. The default splits on the delimiters and on every line break.',
  ],
  [
    'suggestions',
    'readonly string[]',
    '—',
    'TagsInput',
    'Values the reader may choose instead of typing them whole. The input becomes a combobox: the typed text filters them by the locale’s collator, ArrowDown and ArrowUp move through them, Enter adds the highlighted one. A chosen suggestion is normalized, judged, deduplicated and capped like typed text, and typed text still commits.',
  ],
  [
    'formatLabel',
    '(value: string) => string',
    '—',
    'TagsInput',
    'The chip’s text for a value, for a value that is an address and a label that is a name.',
  ],
  [
    'lockedValues',
    'readonly string[]',
    '—',
    'TagsInput',
    'The values the reader may not remove. Their chips carry data-disabled and draw no remove control.',
  ],
  [
    'locale',
    'string',
    '—',
    'TagsInput',
    'BCP 47, for the comparison the duplicate rule makes. The language in force when absent.',
  ],
  ['max', 'number | null', 'null', 'TagsInput', 'The most values the list may hold.'],
  [
    'delimiters',
    'readonly string[]',
    ',',
    'TagsInput',
    'The characters that commit the typed text and split a paste. Line breaks split a paste whatever this says.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'TagsInput',
    'The type step, and the frame’s height when empty.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'TagsInput',
    'An edge, a ground, or neither.',
  ],
  [
    'overflow',
    "'wrap' | 'collapse'",
    'wrap',
    'TagsInput',
    'Whether the row wraps to three lines and scrolls, or stays one line and opens while focus is inside.',
  ],
  [
    'pendingOnBlur',
    "'commit' | 'keep' | 'discard'",
    'commit',
    'TagsInput',
    'What leaving the control does with the text in the field.',
  ],
  [
    'editable',
    'boolean',
    'false',
    'TagsInput',
    'Whether Enter or a double click on a chip opens it for editing.',
  ],
  [
    'reorderable',
    'boolean',
    'false',
    'TagsInput',
    'Whether Alt with an arrow moves the focused chip.',
  ],
  ['allowDuplicates', 'boolean', 'false', 'TagsInput', 'Whether the same value may stand twice.'],
  [
    'addOnPaste',
    'boolean',
    'true',
    'TagsInput',
    'Whether a paste with several values becomes several chips.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'TagsInput',
    'Whether the clear button is drawn while the control holds something.',
  ],
  ['fullWidth', 'boolean', 'true', 'TagsInput', 'Whether the frame fills its container.'],
  ['disabled', 'boolean', 'false', 'TagsInput', 'Unstated, the control asks the field around it.'],
  [
    'readOnly',
    'boolean',
    'false',
    'TagsInput',
    'Whether the values may be read and copied but not changed.',
  ],
  [
    'required',
    'boolean',
    'false',
    'TagsInput',
    'Whether an empty list is a validity error. Written on the input only while the list is empty.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'TagsInput',
    'Whether the control is drawn in error, in addition to any value that failed.',
  ],
  [
    'messages',
    'Partial<TagsInputMessages>',
    '—',
    'TagsInput',
    'Words laid over the language in force, key by key: added, addedInvalid, clear, copied, count, countNamed, counter, duplicate, editHint, hint, invalid, remove, removed, reorder',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'TagsInput',
    'Replaces the frame around the control, keeping the ref the width gate measures.',
  ],
  [
    'handleRef',
    'Ref<TagsInputHandle>',
    '—',
    'TagsInput',
    'The imperative handle: focus(), clear() and setValue(values, reason). ref is the input.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'The list moved. The request carries the reason: submit from typed text, a paste, a blur or an edit; remove from one value leaving; clear from all of them; keyboard from a reorder; programmatic from the handle.',
  },
  {
    name: 'onInputValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'The text in the field moved: keyboard while typing, submit when a commit empties it, clear from Escape or the clear button, blur when leaving discards it.',
  },
  {
    name: 'onValueRefuse',
    payload: '(values: readonly string[], details: { cause: "duplicate" | "limit" | "invalid" })',
    when: 'One or more values did not get in. It holds no state and cancels nothing — the values never entered the list. invalid arrives only under invalidValues="refuse".',
  },
  {
    name: 'onValueCopy',
    payload: "(values: readonly string[], outcome: 'api' | 'command' | 'refused')",
    when: 'The reader copied a chip or the whole list with the keyboard, and the text either reached the clipboard by one of the two ways or was refused.',
  },
];

const composition = apiRows([
  [
    'TagsInputDefaultsProvider',
    'component',
    '—',
    'Provider',
    'Sets every axis once for a subtree; the words come from the language in force (SlottedProvider). A prop on a control wins over it.',
  ],
  [
    'render',
    '(props: TagsInputRootProps) => ReactNode',
    '—',
    'TagsInput',
    'Replaces the frame. Spread the props: they carry the ref the width gate and Backspace read.',
  ],
  ['ref', 'Ref<HTMLInputElement>', '—', 'TagsInput', 'The input itself, as text-field exposes it.'],
  [
    'native props',
    'ComponentPropsWithRef<"input">',
    '—',
    'TagsInput',
    'placeholder, pattern, minLength, maxLength, list, inputMode, enterKeyHint, autoComplete, name, form, every aria-* and every handler reach the input; className and style reach the frame.',
  ],
  [
    'onKeyDown, onPaste, onBlur, onChange',
    'handler',
    '—',
    'TagsInput',
    'Composed, never replaced: the family’s handler runs after the consumer’s and does nothing when the event was defaultPrevented.',
  ],
  [
    'Field',
    'component',
    '—',
    'Field',
    'A control inside a field takes its id, its description, its error and its states from the field without being wrapped.',
  ],
]);

const accessibility = [
  'The control is a layout grid with one row: the chips are cells and the field is the last cell, so one Tab reaches the input and the arrows walk the row. The input carries no role, because it opens nothing.',
  'Focus is set on a chip cell rather than on the remove button inside it, which is tabindex="-1"; Delete and Backspace do what the button does, and the row’s hint says so. React Aria and Angular Material resolve the grid pattern’s text-plus-widget cell the same way.',
  'An invalid value is said three ways — the danger tone, the alert mark, and a description carrying the reason — because color alone is not a message. The same reason is the input’s custom validity, so a native submit is refused with the browser’s bubble.',
  'Every change is announced once, politely: a value added with the count now held and its reason if it failed, a value removed with the count that is left, a move with its new position, a duplicate with the chip that holds it, and a copy with the count copied.',
  'After a removal focus goes to the chip that took the removed one’s index, then the previous one, then the input — it is never lost to the document body.',
];

const code = defineSnippet({
  id: 'tags-input-react-anatomy',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="tags-input"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-full-width
  data-invalid
>
  <div data-part="control" role="grid" aria-label="To, 2 values">
    <div data-part="chips" role="row" aria-describedby="hint-id">
      <span data-ui="tag" data-part="root" data-size="sm" role="gridcell" tabindex="-1">
        <span data-part="body">
          <span data-part="label">ana.pereira@example.com</span>
        </span>
        <button
          data-part="remove"
          type="button"
          tabindex="-1"
          aria-label="Remove ana.pereira@example.com"
        >
          <span data-ui="icon" data-part="root" aria-hidden="true">
            <svg data-part="glyph" data-glyph="x" aria-hidden="true"></svg>
          </span>
        </button>
      </span>
      <span
        data-ui="tag"
        data-part="root"
        data-size="sm"
        data-tone="danger"
        data-invalid
        role="gridcell"
        tabindex="-1"
        aria-invalid="true"
        aria-describedby="message-id"
      >
        <span data-part="body">
          <span data-part="start">
            <span data-ui="icon" data-part="root" aria-hidden="true">
              <svg data-part="glyph" data-glyph="circle-alert" aria-hidden="true"></svg>
            </span>
          </span>
          <span data-part="label">jhon.company</span>
        </span>
        <span data-part="message" id="message-id">
          Please include an '@' in the email address.
        </span>
        <button data-part="remove" type="button" tabindex="-1" aria-label="Remove jhon.company">
          <span data-ui="icon" data-part="root" aria-hidden="true">
            <svg data-part="glyph" data-glyph="x" aria-hidden="true"></svg>
          </span>
        </button>
      </span>
      <span data-part="field" role="gridcell">
        <input data-part="input" type="email" aria-invalid="true" />
      </span>
    </div>
  </div>
  <button data-part="clear" type="button" aria-label="Clear">
    <span data-ui="icon" data-part="root" aria-hidden="true">
      <svg data-part="glyph" data-glyph="x" aria-hidden="true"></svg>
    </span>
  </button>
  <span data-part="hint" id="hint-id">
    Press Delete to remove a value.
  </span>
</div>;`,
});

const theming = defineSnippet({
  id: 'tags-input-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='tags-input'] {
  --slotted-tags-input-radius: var(--slotted-radius-md);
  --slotted-tags-input-counter-complete-color: var(--slotted-tone-warning-text);
  --slotted-tags-input-current-border-color: var(--slotted-tone-accent-text);
}

/* The chips are tags, and they are retuned under the identifier every chip in
   the library shares rather than under this family's. */
[data-ui='tag'] {
  --slotted-tag-font-weight: var(--slotted-font-weight-regular);
}`,
});

export const REACT_TAGS_INPUT_DOCS = {
  'tags-input': {
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
