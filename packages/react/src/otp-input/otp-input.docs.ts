import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import otpInputTokens from '@slotted/styles/otp-input/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_OTP_INPUT_TOKENS = otpInputTokens.map((name) => ({
  name,
  purpose: 'Theme-owned OTP Input decision',
}));

const imports: ReferenceImport = {
  source: "import { OtpInput, OtpInputDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The frame around the boxes. Carries data-ui="otp-input", the axes, and data-disabled, data-invalid, data-readonly and data-complete. It has no role: the control inside is the only thing announced. className and style reach this element, and a press anywhere on it puts the cursor in the box under the pointer.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'The control. One real text input laid over the boxes, transparent: it holds the value, name, form, autocomplete="one-time-code", the identifier the field’s label points at, and it is the one tab stop. ref reaches it. With mask it becomes type="password".',
  },
  {
    part: 'group',
    element: 'div',
    required: true,
    purpose:
      'A row of boxes, one per entry of groups. Hidden from assistive technology. With attached, its boxes share one seam and keep a corner only at the ends.',
  },
  {
    part: 'separator',
    element: 'div',
    required: false,
    purpose:
      'A short rule between two groups, drawn in CSS and never a character — a dash in the DOM would be read by nothing and mirrored by nothing.',
  },
  {
    part: 'slot',
    element: 'div',
    required: true,
    purpose:
      'One box: the character at data-index, or a bullet under mask, or the placeholder while empty. data-current marks the box where the cursor or the selection is while the control has focus; the caret and the selection tint are drawn there.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The second step of a sign-in, driven by the controls below the canvas. Type into it: the value is one string, the boxes paint it, and the sixth digit completes it.',
    snippet: defineSnippet({
      id: 'otp-input-react-playground',
      language: 'tsx',
      label: 'A verification step, in a field',
      source: `<Field>
  <FieldLabel>Verification code</FieldLabel>
  <OtpInput name="code" groups={[3, 3]} onComplete={verify} />
  <FieldDescription>We sent an SMS to +1 206 •••-4821.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the boxes sit at',
    note: 'A box is a square on the control height of its step, so a code beside a text field in the same form sits on the same row. Inside a field the control takes the field’s step rather than its own.',
    snippet: defineSnippet({
      id: 'otp-input-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<OtpInput size="sm" length={4} />;
<OtpInput size="md" />;
<OtpInput size="lg" />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <OtpInput />
</Field>;`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame each box shows',
    note: 'outline takes the ground it is placed on; subtle sinks into the page. The same two steps text-field draws, with the same tokens, so a code under a text field in one form is one form.',
    snippet: defineSnippet({
      id: 'otp-input-react-variants',
      language: 'tsx',
      label: 'Two frames, one box',
      source: `<OtpInput variant="outline" />;
<OtpInput variant="subtle" />;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, separators and joined boxes',
    note: 'groups partitions the boxes the way the SMS is written — 482-915 — and attached joins the boxes of a group along one seam, which is how a PIN pad reads.',
    snippet: defineSnippet({
      id: 'otp-input-react-groups',
      language: 'tsx',
      label: 'A partition of length, and one seam per group',
      source: `// The sum has to be length; a partition that does not add up draws one group.
<OtpInput groups={[3, 3]} />;
<OtpInput groups={[4, 4]} length={8} type="alphanumeric" attached />;
<OtpInput length={4} attached />;`,
    }),
  },
  {
    id: 'types',
    title: 'What the code accepts',
    note: 'type decides the characters and the keyboard a phone offers; pattern outranks it per character; transform runs over every edit before the filter. What an edit loses is reported, so the page can say why nothing appeared.',
    snippet: defineSnippet({
      id: 'otp-input-react-types',
      language: 'tsx',
      label: 'Digits, letters, a pattern and a transform',
      source: `<OtpInput type="numeric" />;
<OtpInput type="alphanumeric" length={8} />;

// A backup code is printed in uppercase with a prefix nobody types.
<OtpInput
  type="alphanumeric"
  length={8}
  transform={(text) => text.replace(/^G-/i, '').toUpperCase()}
  onRejected={(text) => setHint(\`"\${text}" is not part of the code\`)}
/>;

// Only the characters a hexadecimal code has.
<OtpInput pattern={/[0-9a-f]/i} />;`,
    }),
  },
  {
    id: 'mask',
    title: 'A code nobody should read over your shoulder',
    note: 'mask makes the control type="password": the platform treats the value as a secret — the screen reader counts characters instead of reading them — and each filled box shows a bullet.',
    snippet: defineSnippet({
      id: 'otp-input-react-mask',
      language: 'tsx',
      label: 'A PIN, masked through the platform',
      source: `<Field>
  <FieldLabel>Authorization PIN</FieldLabel>
  <OtpInput length={4} mask attached autoComplete="off" />
</Field>;`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the frame paints',
    note: 'Invalid keeps its danger edge on every box while the ring says where the cursor is; read-only keeps full-strength ink and only its ground changes; disabled is muted to a measured color rather than faded, so a disabled form still says what it holds.',
    snippet: defineSnippet({
      id: 'otp-input-react-states',
      language: 'tsx',
      label: 'Every state unset by default, and native where the word means native',
      source: `// Unstated rather than false, so the control defers to its field.
<OtpInput invalid defaultValue="482910" />;
<OtpInput readOnly defaultValue="482915" />;
<OtpInput disabled defaultValue="48" />;

// A control inside a disabled fieldset is painted too, because the
// stylesheet matches :disabled beside the attribute.`,
    }),
  },
  {
    id: 'complete',
    title: 'The sixth digit',
    note: 'onComplete fires the moment the value reaches length, once per value; autoSubmit calls requestSubmit() on the owning form in the same moment. A code edited into another full code reports again.',
    snippet: defineSnippet({
      id: 'otp-input-react-complete',
      language: 'tsx',
      label: 'Verify on the last digit',
      source: `<form action={verify}>
  <OtpInput name="code" autoSubmit />
</form>;

// Or hold the value and react to it.
<OtpInput value={code} onValueChange={setCode} onComplete={verify} />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A value longer than the code is cut; a paste with hyphens and spaces keeps its digits; in a right-to-left page the boxes stay left-to-right, because a code is a number and a number does not mirror; and at 240 pixels the boxes give up width before the row overflows.',
    snippet: defineSnippet({
      id: 'otp-input-react-content',
      language: 'tsx',
      label: 'Long, pasted, mirrored and narrow',
      source: `// "12-3456789" becomes "123456".
<OtpInput defaultValue="12-3456789" />;

// Paste "482-915": the hyphen is dropped and reported, the digits land.
<OtpInput onRejected={(text) => console.log(text)} />;

// The row is left-to-right whatever the page does.
<div dir="rtl">
  <OtpInput groups={[3, 3]} />
</div>;`,
    }),
  },
  {
    id: 'form',
    title: 'One entry in FormData',
    note: 'The control is one native input, so name and form work as they do on any input, a native reset restores defaultValue, and where the WebOTP API exists the code arrives from the SMS with reason "programmatic".',
    snippet: defineSnippet({
      id: 'otp-input-react-form',
      language: 'tsx',
      label: 'Native forms, and the SMS that fills them',
      source: `<form onSubmit={submit}>
  <OtpInput name="code" webOtp />
  <Button type="submit">Confirmar</Button>
  <Button type="reset" variant="ghost">
    Limpar
  </Button>
</form>;

// new FormData(form).get('code') === '482915'`,
    }),
  },
  {
    id: 'composition',
    title: 'In a field, with a resend',
    note: 'The field names the control, describes it and carries its error; the resend is a button and a countdown the page owns, because the family has no clock. The provider sets the length once for an application whose codes are all four digits.',
    snippet: defineSnippet({
      id: 'otp-input-react-composition',
      language: 'tsx',
      label: 'The whole verification step',
      source: `<Field invalid={error !== null}>
  <FieldLabel>Verification code</FieldLabel>
  <OtpInput name="code" groups={[3, 3]} onComplete={verify} />
  <FieldDescription>We sent an SMS to +1 206 •••-4821.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>;
<Button variant="ghost" disabled={seconds > 0} onClick={resend}>
  {seconds > 0 ? \`Resend in 0:\${pad(seconds)}\` : 'Resend code'}
</Button>;

// Every code in this application is four digits.
<OtpInputDefaultsProvider length={4} attached>
  <App />
</OtpInputDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'One tab stop, every key the browser’s',
    note: 'Tab lands on one control. Arrows move the cursor across the boxes, Backspace and Delete edit, Shift+arrows select a range, Ctrl+A selects all, and typing on a full code replaces the selected character instead of being refused.',
    snippet: defineSnippet({
      id: 'otp-input-react-keyboard',
      language: 'tsx',
      label: 'Nothing is bound; the selection is normalized',
      source: `// Inside the value there is always one character selected: the one in
// front of a collapsed cursor, the last one at the end of a full code. The
// next key replaces it. A cursor after the last character inserts.
<OtpInput defaultValue="482915" />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the value moves. The request carries the new value, the value it replaces, the reason — "keyboard" for an edit made in the control, including a paste and the keyboard’s own autofill; "programmatic" for a code the WebOTP API delivered — the originating event, and cancel(), which refuses the move before anything commits.',
  },
  {
    name: 'onComplete',
    payload: '(value: string)',
    when: 'The moment the value reaches length characters, once per value. A full code edited into another full code reports again; a code emptied and retyped reports again.',
  },
  {
    name: 'onRejected',
    payload: '(text: string, event: SyntheticEvent<HTMLInputElement>)',
    when: 'Before the value moves, with every character an edit lost to type, pattern or length, in order. Nothing is emitted when an edit lost nothing.',
  },
  {
    name: 'onChange, onFocus, onBlur, onPaste',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, and always runs.',
  },
];

export const REACT_OTP_INPUT_DOCS = {
  otpInput: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'OtpInput',
        'Present means the consumer owns the value, for the life of the component. Absent, the element owns it and a native form reset restores it',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'OtpInput',
        'What an uncontrolled control starts from, read once, cut to what the code accepts, and written to the element as the native attribute',
      ],
      [
        'length',
        'number',
        '6',
        'OtpInput, OtpInputDefaultsProvider',
        'How many characters the code has. It is the element’s maxlength and the number of boxes',
      ],
      [
        'type',
        "'numeric' | 'alphanumeric'",
        'numeric',
        'OtpInput, OtpInputDefaultsProvider',
        'Which characters the code takes — digits, or ASCII letters and digits — and which keyboard a phone offers: inputMode numeric or text, unless the consumer states one',
      ],
      [
        'pattern',
        'RegExp',
        '—',
        'OtpInput',
        'Tested against each character; outranks type in what is accepted and leaves the keyboard to it. Never the element’s whole-value attribute',
      ],
      [
        'transform',
        '(text: string) => string',
        '—',
        'OtpInput',
        'Run over every edit before the filter — typing, paste, autofill — to strip a prefix or uppercase a code',
      ],
      [
        'groups',
        'number[]',
        '[length]',
        'OtpInput',
        'How the boxes are partitioned, with a separator between two groups. The sum has to be length; a partition that does not add up draws one group',
      ],
      [
        'attached',
        'boolean',
        'false',
        'OtpInput, OtpInputDefaultsProvider',
        'Joins the boxes of a group along one seam, with a corner only at the ends',
      ],
      [
        'placeholder',
        'string',
        '',
        'OtpInput, OtpInputDefaultsProvider',
        'What an empty box shows: one character repeats over every box, a string as long as the code distributes',
      ],
      [
        'mask',
        'boolean',
        'false',
        'OtpInput',
        'Makes the control type="password" and paints a bullet per character. The platform treats the value as a secret',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'OtpInput, OtpInputDefaultsProvider',
        'The step the boxes sit at, read from the field first when there is one, then from the provider. The box is the control height at that step; the type is the text scale’s step of the same name',
      ],
      [
        'variant',
        "'outline' | 'subtle'",
        'outline',
        'OtpInput, OtpInputDefaultsProvider',
        'How much frame each box shows. There is no plain: a code is never a cell',
      ],
      [
        'autoSubmit',
        'boolean',
        'false',
        'OtpInput',
        'Calls requestSubmit() on the owning form the moment the code is complete',
      ],
      [
        'webOtp',
        'boolean',
        'false',
        'OtpInput',
        'Asks the platform for the code from the SMS where the WebOTP API exists, and abandons the request when the form submits or the control unmounts. Opt-in, because the request opens a permission prompt',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'OtpInput',
        'Unstated rather than false, so the control defers to the field around it. Stated, it wins, and it is the native attribute',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'OtpInput',
        'Unstated rather than false. The native readonly, which stays focusable, selectable and submitted',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'OtpInput',
        'Unstated rather than false. Writes aria-invalid on the control and data-invalid on the frame',
      ],
      [
        'required',
        'boolean',
        '—',
        'OtpInput',
        'The element’s own attribute, passed straight through and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'autoComplete',
        'string',
        'one-time-code',
        'OtpInput',
        'The element’s own attribute, defaulting to the token that asks the keyboard for the code it just received',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: OtpInputRootProps) => ReactNode',
        '—',
        'OtpInput',
        'Substitutes the frame and hands it every attribute. The boxes are fixed: they are paint over one input, and their geometry is what a press is mapped to',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'OtpInput',
        'Reaches the input. focus(), select() and setSelectionRange() are the element’s own, so no imperative handle is invented for what the platform already ships',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'OtpInput',
        'Reach the frame, because the frame is what a consumer sees. Every other native prop — name, form, autoFocus, inputMode, aria-* — reaches the input',
      ],
      [
        'OtpInputDefaultsProvider',
        '{ size, variant, attached, length, type, placeholder }',
        '—',
        'a subtree',
        'The six decisions an application takes once. size is the one a field outranks, so a control inside a field takes the field’s step',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What the control reads to wire itself: the identifier, the description, and the four shared states',
      ],
    ]),
    accessibility: [
      'There is no WAI-ARIA APG pattern for a verification code: the APG lists no such entry, so the control is the platform’s own textbox and the sources are the HTML specification for the element, the autocomplete attribute’s one-time-code token, and the WebOTP API.',
      'One control, one tab stop, one accessible name, one value. Ark, Chakra and Mantine render one input per box and pay for it with N tab stops and no real label; here the boxes are aria-hidden paint over one input, so a screen reader hears "Verification code, edit text, 482" and nothing about boxes.',
      'The control takes its name from the field’s label, through for pointing at the identifier the field derived, and its description and error through aria-describedby merged after anything the consumer wrote.',
      'aria-required, never the native required: the native attribute engages browser constraint validation and changes submit behavior. disabled and readonly are native, because that is what those two words mean.',
      'Every key is the browser’s. The family binds nothing — no Escape, no arrow handling — and only normalizes the selection after the fact, so a reader who knows a text field knows this one; WCAG 2.1.4 exists for the class of defect single-key shortcuts produce.',
      'The focus ring sits on the box where the cursor is, in the theme’s ring color, and the invalid state retargets that color rather than repainting it. Invalid is never color alone: aria-invalid announces it and the field’s error says it in words.',
      'mask is a platform decision, not paint: the control becomes type="password", so the screen reader counts the characters instead of reading a PIN aloud and the keyboard keeps nothing. The cost is that a password manager may offer to save it; autoComplete on the control decides.',
    ],
    snippets: [
      defineSnippet({
        id: 'otp-input-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="otp-input" data-part="root" data-size="md" data-variant="outline">
  <input
    data-part="input"
    id="code-control"
    autocomplete="one-time-code"
    inputmode="numeric"
    maxlength="6"
  />
  <div data-part="group" aria-hidden="true">
    <div data-part="slot" data-index="0">
      4
    </div>
    <div data-part="slot" data-index="1">
      8
    </div>
    <div data-part="slot" data-index="2" data-current />
  </div>
  <div data-part="separator" aria-hidden="true" />
  <div data-part="group" aria-hidden="true">
    <div data-part="slot" data-index="3" />
    <div data-part="slot" data-index="4" />
    <div data-part="slot" data-index="5" />
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'otp-input-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='otp-input'] {
  --slotted-otp-input-radius: var(--slotted-radius-md);
  --slotted-otp-input-current-border-color: var(--slotted-tone-accent-solid);
  --slotted-otp-input-selection-background: var(--slotted-tone-accent-surface);
  --slotted-otp-input-mask-size: var(--slotted-font-size-3xl);
}`,
      }),
    ],
  },
} as const;
