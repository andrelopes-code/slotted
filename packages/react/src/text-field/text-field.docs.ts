import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import textFieldTokens from '@slotted/styles/text-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TEXT_FIELD_TOKENS = textFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Text Field decision',
}));

const imports: ReferenceImport = {
  source: "import { TextField, TextFieldAction, TextFieldDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame. It carries data-ui="text-field", data-size, data-variant and data-mono, and data-disabled, data-invalid, data-readonly and data-loading. It has no role: WAI-ARIA allows a textbox only non-interactive children, so the buttons sit beside the input inside a box that announces nothing. className and style reach this element.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'The control. It holds the value and the identifier, and receives every native attribute you write: type, autoComplete, inputMode, enterKeyHint, pattern, maxLength, name, form and required. ref reaches it, so focus(), select() and setSelectionRange() are the element’s own.',
  },
  {
    part: 'start',
    element: 'span',
    required: false,
    purpose:
      'Content before the value in the reading direction, such as a currency, an icon or an @. It is its own bidirectional run, so R$ keeps its order in a right-to-left document, and an icon inside it takes the control’s icon size.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose:
      'Content after the value in the reading direction, such as a unit, a domain or a suffix.',
  },
  {
    part: 'action',
    element: 'button (TextFieldAction), inside start or end',
    required: false,
    purpose:
      'A button you place inside the frame: a submit, a menu trigger or a tooltip trigger. It is square when named by aria-label and padded when named by its text. aria-expanded="true" keeps it pressed while the menu it opened is open.',
  },
  {
    part: 'busy',
    element: 'span[data-ui="spinner"]',
    required: false,
    purpose:
      'The shared spinner, before the buttons, while loading is true. It is rendered whenever loading is set and hidden while loading is false, so it can leave with a transition. It is hidden from assistive technology; aria-busy on the input carries the state.',
  },
  {
    part: 'caps-lock',
    element: 'span',
    required: false,
    purpose:
      'A mark in a password field while Caps Lock is on and the input has focus. It is hidden from assistive technology; the capsLock message is announced once when Caps Lock turns on.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Empties the value with reason "clear" and returns focus to the input. It is rendered while clearable is set, hidden while the value is empty or cannot be changed, and never smaller than 24 CSS pixels.',
  },
  {
    part: 'copy',
    element: 'button',
    required: false,
    purpose:
      'Writes the value to the clipboard, shows a check with data-complete for two seconds and announces the outcome. It stays on a read-only value and is hidden while the value is empty or the input is disabled.',
  },
  {
    part: 'reveal',
    element: 'button',
    required: false,
    purpose:
      'Shows the password as characters and hides it again, keeping the caret where it was. Its name does not change with its state, which is the APG rule for a toggle button; aria-pressed carries the state.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: the clear button appears only once there is something to clear.',
    snippet: defineSnippet({
      id: 'text-field-react-playground',
      language: 'tsx',
      label: 'A control, its label and its help',
      source: `<Field>
  <FieldLabel>E-mail</FieldLabel>
  <TextField type="email" placeholder="you@company.com" clearable />
  <FieldDescription>We will use this address for billing.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'text-field-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<TextField size="sm" />;
<TextField size="md" />;
<TextField size="lg" />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <TextField />
</Field>;`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing until the pointer or the caret arrives — which is what a dense table cell needs.',
    snippet: defineSnippet({
      id: 'text-field-react-variants',
      language: 'tsx',
      label: 'Three frames, one box',
      source: `<TextField variant="outline" />;
<TextField variant="subtle" />;

// A cell that is only a control while it is being used. The box never
// changes, so the row does not reflow when the pointer crosses it.
<TextField variant="plain" mono />;`,
    }),
  },
  {
    id: 'adornments',
    title: 'What sits inside the border',
    note: 'start and end name the reading direction rather than a side, so the currency mark stays before the amount in Arabic as well. Neither of them is ever squeezed: the value gives up width first.',
    snippet: defineSnippet({
      id: 'text-field-react-adornments',
      language: 'tsx',
      label: 'A mark before the value and a unit after it',
      source: `<TextField start="R$" end="BRL" inputMode="decimal" />;

// Anything renders: an icon, a kbd, a button, a select.
<TextField
  start={
    <Icon>
      <Search />
    </Icon>
  }
  type="search"
/>;`,
    }),
  },
  {
    id: 'actions',
    title: 'The two buttons the family draws',
    note: 'Both are real buttons inside the frame, both keep the caret, and both are held to the 24-pixel minimum. Tab into the field and press Tab again: the ring moves to the button rather than staying around the box.',
    snippet: defineSnippet({
      id: 'text-field-react-actions',
      language: 'tsx',
      label: 'Clear, and reveal',
      source: `// Emits onValueChange with reason "clear", then focuses the control.
<TextField clearable defaultValue="invoice 2026" type="search" />;

// aria-pressed carries the state; the label never changes with it.
<TextField revealable type="password" autoComplete="current-password" />;`,
    }),
  },
  {
    id: 'menu',
    title: 'A button of your own inside the frame',
    note: 'A country code that opens a menu, a category beside a search, a submit named in words, an overflow mark: each is a real button in start or end. Open one — it stays pressed while its menu is open, and the value keeps its place beside it.',
    snippet: defineSnippet({
      id: 'text-field-react-menu',
      language: 'tsx',
      label: 'A menu trigger composed onto an action',
      source: `<Menu>
  <TextField
    type="tel"
    start={
      <MenuTrigger
        render={(props) => (
          <TextFieldAction {...props}>
            {country}{' '}
            <Icon>
              <ChevronDown />
            </Icon>
          </TextFieldAction>
        )}
      />
    }
  />
  <MenuContent>
    <MenuRadioGroup value={country} onValueChange={setCountry}>
      <MenuRadioItem value="+55">Brasil +55</MenuRadioItem>
      <MenuRadioItem value="+351">Portugal +351</MenuRadioItem>
    </MenuRadioGroup>
  </MenuContent>
</Menu>;

// Named by its text: padded. Named by aria-label: square.
<TextField end={<TextFieldAction type="submit">Search</TextFieldAction>} />;`,
    }),
  },
  {
    id: 'copy',
    title: 'Copying a value somebody has to paste elsewhere',
    note: 'Press the copy button: the mark turns to a check in the success ink for two seconds and the outcome is announced. A clipboard that refuses — an insecure page, a denied permission — is announced as a failure and shows no check.',
    snippet: defineSnippet({
      id: 'text-field-react-copy',
      language: 'tsx',
      label: 'A read-only link and a key',
      source: `<TextField
  readOnly
  copyable
  defaultValue="https://nexora.app/convite/8f3a"
  onValueCopy={({ copied }) => copied && track('invite-copied')}
/>;`,
    }),
  },
  {
    id: 'password',
    title: 'A password: showing it, and warning about Caps Lock',
    note: 'Focus the password and turn Caps Lock on: the warning mark appears before the eye and is announced once. The eye swaps to a crossed eye and back, and the caret stays where it was.',
    snippet: defineSnippet({
      id: 'text-field-react-password',
      language: 'tsx',
      label: 'Reveal, and the Caps Lock mark every password gets',
      source: `<TextField
  type="password"
  autoComplete="current-password"
  revealable
  start={
    <Icon>
      <Lock />
    </Icon>
  }
/>;`,
    }),
  },
  {
    id: 'loading',
    title: 'Checking the value while the reader keeps typing',
    note: 'A user name checked against the server: the ring stands before the buttons and the input is aria-busy, but it stays editable. Toggle loading off and the ring shrinks out rather than vanishing.',
    snippet: defineSnippet({
      id: 'text-field-react-loading',
      language: 'tsx',
      label: 'An asynchronous check',
      source: `const { isFetching } = useQuery(['handle', handle], checkHandle);

<TextField start="@" value={handle} onValueChange={setHandle} loading={isFetching} clearable />;`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the frame paints',
    note: 'Read-only keeps full-strength ink and only its ground changes, because the value is real and still submitted; disabled is muted to a measured color rather than faded, so a disabled form still says what it holds.',
    snippet: defineSnippet({
      id: 'text-field-react-states',
      language: 'tsx',
      label: 'Every state unset by default, and native where the word means native',
      source: `// Unstated rather than false, so the control defers to its field.
<TextField invalid />;
<TextField readOnly defaultValue="Somente leitura" />;
<TextField disabled defaultValue="Desativado" />;

// A control inside a disabled fieldset is painted too, because the
// stylesheet matches :disabled beside the attribute.`,
    }),
  },
  {
    id: 'count',
    title: 'Counting what has been typed',
    note: 'The control counts and the field places it, in the spare column of the label row. Pass countMax without maxLength and the limit becomes a soft one: the value may pass it, and the counter turns before validation runs.',
    snippet: defineSnippet({
      id: 'text-field-react-count',
      language: 'tsx',
      label: 'A hard limit, and a soft one',
      source: `<Field>
  <FieldLabel>Assunto</FieldLabel>
  <TextField showCount maxLength={60} />
</Field>;

// A limit the browser does not enforce: the value may pass it.
<Field>
  <TextField showCount countMax={16} />
</Field>;`,
    }),
  },
  {
    id: 'types',
    title: 'What kind of text this is',
    note: 'type is the element’s own, and so is everything that travels with it. A phone field that offers the wrong keyboard on a phone is a field nobody fills in twice.',
    snippet: defineSnippet({
      id: 'text-field-react-types',
      language: 'tsx',
      label: 'The six types, and the attributes that go with them',
      source: `<TextField type="email" autoComplete="email" inputMode="email" />;
<TextField type="tel" autoComplete="tel" inputMode="tel" />;
<TextField type="url" inputMode="url" enterKeyHint="go" />;
<TextField type="search" clearable enterKeyHint="search" />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A value longer than the control ellipsises rather than clipping mid-glyph; an unbroken token scrolls, which is the platform’s answer; and at 240 pixels the value surrenders width while the adornments keep their target size.',
    snippet: defineSnippet({
      id: 'text-field-react-content',
      language: 'tsx',
      label: 'Long, translated and right-to-left',
      source: `<TextField defaultValue="Kraftfahrzeug-Haftpflichtversicherungsnummer-2026" />;

// Nothing is removed from the DOM: the whole value stays selectable,
// copyable and reachable with the caret.
<TextField dir="rtl" defaultValue="مرحبا بالعالم" clearable />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the decisions an application takes once; render substitutes the frame; ref reaches the element, which already has focus, select and setSelectionRange.',
    snippet: defineSnippet({
      id: 'text-field-react-composition',
      language: 'tsx',
      label: 'A provider, a ref, and a substituted frame',
      source: `<TextFieldDefaultsProvider variant="subtle">
  <TextField clearable messages={{ clear: 'Limpar' }} />
</TextFieldDefaultsProvider>;

const ref = useRef<HTMLInputElement>(null);
<TextField ref={ref} onFocus={() => ref.current?.select()} />;

// The frame becomes the consumer's own element, with every attribute.
<TextField render={(props) => <label {...props} />} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Tab reaches the value, then each button in turn. Nothing is bound to Escape: some user agents clear a search input on it, and a control that swallowed the key inside a dialog would be one a keyboard user cannot leave.',
    snippet: defineSnippet({
      id: 'text-field-react-keyboard',
      language: 'tsx',
      label: 'No key is bound, and the buttons are real buttons',
      source: `// Enter submits the form the element belongs to — the platform's
// behavior for a single-line control, left alone.
<form onSubmit={onSubmit}>
  <TextField name="q" type="search" clearable />
</form>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the value changes. The request carries the new value, the value it replaces, the reason ("keyboard" for an edit in the input, "clear" for the clear button), the originating event, and cancel(), which refuses the change before it commits.',
  },
  {
    name: 'onRevealedChange',
    payload: '(revealed: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the password toggle changes, with reason "pointer" or "keyboard" read from the click. A form that hides the password again on blur controls revealed and listens here.',
  },
  {
    name: 'onValueCopy',
    payload: '({ copied, reason, source, value }: TextFieldCopyDetail)',
    when: 'After the copy button has asked the clipboard. copied is false when the clipboard refused the value, and reason is "pointer" or "keyboard". onCopy remains the input’s native clipboard event.',
  },
  {
    name: 'onChange, onInput, onFocus, onBlur, onKeyDown, onKeyUp',
    payload: 'the element’s own events',
    when: 'Whenever the input fires them. TextField composes your handler with its own instead of replacing it: yours runs first, and always runs.',
  },
];

export const REACT_TEXT_FIELD_DOCS = {
  textField: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'TextField',
        'Makes the value controlled for the life of the component. Without it the input keeps its own value, and a native form reset restores defaultValue.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'TextField',
        'The value an uncontrolled text field starts from. It is read once and written to the input as the native attribute.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'TextField, TextFieldDefaultsProvider',
        'The step of the control scale. Without it the text field takes the size of the field around it, then the provider’s. Height, padding, type and icon size come from the control scales, which the theme restates for each density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'TextField, TextFieldDefaultsProvider',
        'How much frame the control draws. plain draws no border at rest and keeps the same box, for a dense table cell.',
      ],
      [
        'mono',
        'boolean',
        'false',
        'TextField, TextFieldDefaultsProvider',
        'Sets the value in the monospaced font with tabular figures, for identifiers, hashes and keys.',
      ],
      [
        'clearable',
        'boolean',
        'false',
        'TextField',
        'Draws a button that empties the value with reason "clear" and returns focus to the input. The button is withdrawn while the value is empty, disabled or read-only.',
      ],
      [
        'revealable',
        'boolean',
        'false',
        'TextField',
        'Draws a toggle that shows a password as characters. It appears only on type="password" and is withdrawn while the input is disabled.',
      ],
      [
        'copyable',
        'boolean',
        'false',
        'TextField',
        'Draws a button that writes the value to the clipboard, shows a check for two seconds and announces the outcome. It is hidden while the value is empty or the input is disabled.',
      ],
      [
        'loading',
        'boolean',
        'false',
        'TextField',
        'Draws the shared spinner before the buttons and sets aria-busy on the input; the value stays editable. Once loading is set, false included, the spinner keeps its place so it can leave with a transition.',
      ],
      [
        'revealed',
        'boolean',
        '—',
        'TextField',
        'Makes the password toggle controlled. defaultRevealed sets the uncontrolled starting state.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'TextField',
        'Publishes the length of the value to the field around it, which draws the count at the end of its label row.',
      ],
      [
        'countMax',
        'number',
        'maxLength',
        'TextField',
        'The limit the count is measured against. Without maxLength it is a soft limit: the value can pass it, and the count turns to the danger tone before validation runs.',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'TextField',
        'Content before the value in the reading direction. It is its own bidirectional run, and an icon inside it takes the control’s icon size.',
      ],
      ['end', 'ReactNode', '—', 'TextField', 'Content after the value in the reading direction.'],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'TextField',
        'Unset by default, so the text field takes the state of the field around it. When set, it wins, and it is the native attribute: the input leaves the tab order and form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'TextField',
        'Unset by default, so the text field takes the state of the field around it. It is the native readonly: the input stays focusable and selectable, and its value is submitted.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'TextField',
        'Unset by default, so the text field takes the state of the field around it. It sets aria-invalid on the input and data-invalid on the frame.',
      ],
      [
        'required',
        'boolean',
        '—',
        'TextField',
        'The input’s own attribute, passed through unchanged; TextField never writes it. A field marks a required value with aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
      [
        'type',
        "'text' | 'search' | 'email' | 'url' | 'tel' | 'password'",
        'text',
        'TextField',
        'The input’s own type, one of the six listed. A date, a time, a month or a number is not a TextField: use date-picker (forms.md FM-16), time-picker or number-field. Other strings still reach the element for compatibility and are not supported.',
      ],
      [
        'messages',
        'Partial<TextFieldMessages>',
        '—',
        'TextField',
        'Replaces words of the active language, key by key. clear, reveal and copy name the buttons; reveal does not change with the state, because aria-pressed carries it. copied and copyFailed announce the outcome of a copy. capsLock is announced once when Caps Lock turns on in a focused password field.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: TextFieldRootProps) => ReactNode',
        '—',
        'TextField',
        'Renders the frame into another element and passes it every attribute. The props are typed against HTMLAttributes<HTMLElement>, so they can be spread onto a label or a fieldset. The input cannot be replaced, because it holds the value, the identifier and the wiring.',
      ],
      [
        'TextFieldAction',
        'ComponentPropsWithRef<"button"> & { render? }',
        'type="button"',
        'start, end',
        'A button you place inside the frame. Every native prop reaches the button, and render replaces it. MenuTrigger, PopoverTrigger and TooltipTrigger pass their wiring to it through their own render.',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'TextField',
        'Reaches the input. focus(), select() and setSelectionRange() are the element’s own, so TextField adds no imperative handle.',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'TextField',
        'Reach the frame, because the frame is what a reader sees. Every other native prop reaches the input.',
      ],
      [
        'TextFieldDefaultsProvider',
        '{ size, variant, mono }',
        '—',
        'a subtree',
        'Sets size, variant and mono once for every text field under it. A field outranks it for size, so a text field inside a field takes the field’s size.',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What TextField reads from the field around it: the identifier, the description, the disabled, read-only, invalid and required states, and the channel it publishes its count on. A text field inside a field needs no wiring of its own.',
      ],
    ]),
    accessibility: [
      'There is no WAI-ARIA Authoring Practices pattern for a text field: the APG lists thirty patterns, and none of them is a single-line text input. The sources are the HTML specification for the input element, the APG practice Providing Accessible Names and Descriptions (w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) for its name, and the ARIA textbox role for what may sit inside it.',
      'The frame has no role. WAI-ARIA requires the children of a textbox to be non-interactive and presentational, so the clear and reveal buttons are siblings of the input inside a box that announces nothing.',
      'The input takes its name from the field’s label, whose for attribute points at the identifier the field generates. The APG naming practice records that some combinations of browser and assistive technology compute no name from a label that wraps its control.',
      'Inside a required field the input carries aria-required, never the native required, because the native attribute turns on browser constraint validation and changes how the form submits. Write required on the input to opt into the platform’s validation; TextField leaves it unchanged. disabled and readonly are the native attributes.',
      'The clear and reveal buttons are native buttons with names you translate once through messages. Each is at least 24 CSS pixels wide at every size and density, which meets WCAG 2.2 success criterion 2.5.8. The reveal button keeps one name and carries its state in aria-pressed, which is the APG rule for a toggle button.',
      'The copy button announces its outcome through the shared live announcer, Copied or Copy failed, because the check that replaces the copy mark is only visible. The Caps Lock mark is hidden from assistive technology; its message is announced once when Caps Lock turns on while the password field has focus.',
      'loading sets aria-busy on the input and leaves it enabled, so the keyboard stays on the input while an asynchronous check runs. The spinner is hidden from assistive technology.',
      'A menu inside the frame follows the APG menu button pattern (w3.org/WAI/ARIA/apg/patterns/menu-button/). The menu trigger on the action supplies aria-haspopup, aria-expanded, and Enter, Space and ArrowDown to open.',
      'No key is bound to Escape. Some browsers clear a search input on Escape, and a text field that consumed the key inside a dialog would leave a keyboard user unable to close the dialog. WCAG success criterion 2.1.4 addresses the defects that single-key shortcuts cause.',
      'The invalid state does not rely on color alone: aria-invalid announces it, the field’s error states it in words, and the inline message writes a visually hidden “Error:” before the sentence. In the high-contrast scheme the border cannot carry the state, so nothing depends on it.',
    ],
    snippets: [
      defineSnippet({
        id: 'text-field-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="text-field" data-part="root" data-size="md" data-variant="outline">
  <span data-part="start">R$</span>
  <input data-part="input" id="valor-control" aria-describedby="valor-description" />
  <button data-part="clear" type="button" aria-label="Clear">
    <span data-ui="icon" data-part="root" aria-hidden="true">
      <svg data-part="glyph" data-glyph="x" aria-hidden="true"></svg>
    </span>
  </button>
  <span data-part="end">BRL</span>
</div>;`,
      }),
      defineSnippet({
        id: 'text-field-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='text-field'] {
  --slotted-text-field-border-color: var(--slotted-tone-secondary-border);
  --slotted-text-field-hover-border-color: var(--slotted-tone-accent-solid);
  --slotted-text-field-radius: var(--slotted-radius-md);
  --slotted-text-field-autofill-background: var(--slotted-tone-success-surface);
}`,
      }),
    ],
  },
} as const;
