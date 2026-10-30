import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import textareaTokens from '@slotted/styles/textarea/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TEXTAREA_TOKENS = textareaTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Textarea decision',
}));

const imports: ReferenceImport = {
  source: "import { Textarea, TextareaDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'textarea, or the element render returns',
    required: true,
    purpose:
      'The textarea element, which is both the control and its frame. It carries data-ui="textarea", data-size, data-variant and data-resize, data-mono and data-auto-size when they are on, and data-disabled, data-invalid and data-readonly. It has no wrapper: the text field wraps its input so that buttons can sit inside one border, but no adornment sits inside a textarea, and its corner holds the resize handle.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Turn autoSize on and type: the box grows to the ceiling and then scrolls.',
    snippet: defineSnippet({
      id: 'textarea-react-playground',
      language: 'tsx',
      label: 'A control, its label and its help',
      source: `<Field>
  <FieldLabel>Notes</FieldLabel>
  <Textarea rows={3} placeholder="Describe what happened" />
  <FieldDescription>Appears in the ticket history.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'The block padding is derived rather than chosen — half of what is left when one line box comes out of the control height — so a one-row textarea is exactly as tall as an input of the same step, at every density.',
    snippet: defineSnippet({
      id: 'textarea-react-sizes',
      language: 'tsx',
      label: 'Three steps, and the field that outranks them',
      source: `<Textarea size="sm" rows={2} />;
<Textarea size="md" rows={2} />;
<Textarea size="lg" rows={2} />;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <Textarea />
</Field>;`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'The same three frames the single-line control paints, against the same tokens: one that takes the ground it is placed on, one that sinks into the page, and one that shows nothing until it is used.',
    snippet: defineSnippet({
      id: 'textarea-react-variants',
      language: 'tsx',
      label: 'Three frames, and a payload in monospace',
      source: `<Textarea variant="outline" />;
<Textarea variant="subtle" />;
<Textarea variant="plain" />;

// Tabular figures and the monospaced family, for a payload or a template.
<Textarea mono variant="subtle" defaultValue='{ "order": 20260442 }' />;`,
    }),
  },
  {
    id: 'auto-size',
    title: 'Growing with the content',
    note: 'Nothing is measured on the main thread: CSS field-sizing grows the box, rows is the floor and maxRows the ceiling. Type past four lines in the first example and the control scrolls rather than pushing the page.',
    snippet: defineSnippet({
      id: 'textarea-react-auto-size',
      language: 'tsx',
      label: 'A floor, a ceiling, and no measurement',
      source: `<Textarea autoSize rows={1} maxRows={4} />;

// The ceiling has a default and cannot be removed: a control that grows
// forever pushes the page out from under the caret.
<Textarea autoSize />;`,
    }),
  },
  {
    id: 'resize',
    title: 'The handle in the corner',
    note: 'block is the default rather than the platform’s both, because a control wider than its field breaks the field’s own grid. The handle is withdrawn entirely while autoSize is on, since the two would disagree on the next keystroke.',
    snippet: defineSnippet({
      id: 'textarea-react-resize',
      language: 'tsx',
      label: 'Three axes, and the one that withdraws it',
      source: `<Textarea resize="block" />;
<Textarea resize="none" />;
<Textarea resize="both" />;

// autoSize wins: the handle is withdrawn rather than left to fight.
<Textarea autoSize resize="both" />;`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the control paints',
    note: 'Read-only keeps full-strength ink and its handle, because the commonest thing a read-only textarea holds is a value someone has to copy; disabled loses the handle as well, since a handle on a control nobody can type in is a handle that lies.',
    snippet: defineSnippet({
      id: 'textarea-react-states',
      language: 'tsx',
      label: 'Every state unset by default',
      source: `// Unstated rather than false, so the control defers to its field.
<Textarea invalid />;
<Textarea readOnly defaultValue="Somente leitura" />;
<Textarea disabled defaultValue="Desativado" />;`,
    }),
  },
  {
    id: 'count',
    title: 'Counting what has been typed',
    note: 'The control counts and the field draws it in the spare column of the label row, so a count that appears on the first keystroke never shares a row with the error and pushes it — which is where Angular Material puts it.',
    snippet: defineSnippet({
      id: 'textarea-react-count',
      language: 'tsx',
      label: 'A count bound to the value',
      source: `<Field>
  <FieldLabel>Notes</FieldLabel>
  <Textarea showCount maxLength={280} autoSize rows={2} />
</Field>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A pasted token with no break in it — a signed URL, a certificate, a container digest — wraps instead of taking the page’s horizontal scrollbar with it, and nothing is removed from the value.',
    snippet: defineSnippet({
      id: 'textarea-react-content',
      language: 'tsx',
      label: 'Unbreakable, translated and right-to-left',
      source: `<Textarea defaultValue={jwt} rows={3} />;

// overflow-wrap: anywhere in the stylesheet, so the whole string stays
// selectable, copyable and reachable with the caret.
<Textarea dir="rtl" defaultValue="مرحبا بالعالم" rows={3} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the four decisions an application takes once; render substitutes the element; ref reaches the textarea, which already has focus, select and setSelectionRange.',
    snippet: defineSnippet({
      id: 'textarea-react-composition',
      language: 'tsx',
      label: 'A provider, a ref, and a form',
      source: `<TextareaDefaultsProvider resize="none" variant="subtle">
  <Textarea autoSize />
</TextareaDefaultsProvider>;

const ref = useRef<HTMLTextAreaElement>(null);
<Textarea ref={ref} name="notes" form="ticket" />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Enter makes a line and never submits — the difference WAI-ARIA notes between a single-line and a multi-line control — and Tab leaves the control rather than inserting a tab, so a keyboard user is never trapped in a comment box.',
    snippet: defineSnippet({
      id: 'textarea-react-keyboard',
      language: 'tsx',
      label: 'Enter makes a line; the form is submitted elsewhere',
      source: `<form onSubmit={onSubmit}>
  <Textarea name="notes" rows={3} />
  <Button type="submit">Send</Button>
</form>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the value moves. request.value is the new value and request.previous the value it replaces. request.reason is always keyboard, because only an edit in the textarea moves the value, and request.source is the originating event. request.cancel() refuses the change: the count does not move, and an uncontrolled element keeps what was typed.',
  },
  {
    name: 'onChange, onInput, onFocus, onBlur',
    payload: 'the element’s own events',
    when: 'Whenever the textarea fires them. Textarea composes your handler with its own instead of replacing it: yours runs first, and always runs.',
  },
];

export const REACT_TEXTAREA_DOCS = {
  textarea: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'Textarea',
        'Makes the value controlled for the life of the component. Without it the element keeps its own value, and a native form reset restores defaultValue.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'Textarea',
        'The value an uncontrolled textarea starts from. It is read once and written to the element, which is what a form reset returns to.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Textarea, TextareaDefaultsProvider',
        'The step of the control scale. When unset, the textarea takes the size of its field, then of the provider. The vertical padding is derived from the step, so a textarea of one row is as tall as a text field of the same step at every density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'Textarea, TextareaDefaultsProvider',
        'How much frame the textarea draws: the three frames of the text field, read from the same tokens. When unset, the textarea takes the variant of the provider.',
      ],
      [
        'mono',
        'boolean',
        'false',
        'Textarea, TextareaDefaultsProvider',
        'Sets the value in the monospaced font with tabular figures, for a payload, a template or a diff.',
      ],
      [
        'resize',
        "'block' | 'none' | 'both'",
        'block',
        'Textarea, TextareaDefaultsProvider',
        'Which way the resize handle drags. The default is block rather than the platform’s both, because a textarea wider than its field breaks the field’s grid. While autoSize is on, the handle is removed.',
      ],
      [
        'autoSize',
        'boolean',
        'false',
        'Textarea',
        'Grows the textarea with its content through CSS field-sizing, with no measurement in script. rows becomes the floor and maxRows the ceiling.',
      ],
      [
        'rows',
        'number',
        '3',
        'Textarea',
        'The starting height in lines, and the floor while autoSize is on. The default is 3 rather than the platform’s 2, because a box of two rows reads as a mistyped input.',
      ],
      [
        'maxRows',
        'number',
        '12',
        'Textarea',
        'The ceiling autoSize grows to, in lines; past it the textarea scrolls. It cannot be removed, because a textarea that grows without limit pushes the page out from under the caret.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'Textarea',
        'Publishes the length of the value to the field around it, which draws the count at the end of its label row.',
      ],
      [
        'countMax',
        'number',
        'maxLength',
        'Textarea',
        'The limit the count is measured against; it defaults to maxLength. Without maxLength it is a soft limit: the value may pass it, and the count is then drawn as invalid.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'Textarea',
        'Unset rather than false, so the textarea follows the field around it. When set, it wins over the field and writes the native disabled.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'Textarea',
        'Unset rather than false, so the textarea follows the field around it. Writes the native readonly: the textarea stays focusable, selectable and submitted, and keeps its resize handle.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'Textarea',
        'Unset rather than false, so the textarea follows the field around it. Writes aria-invalid and data-invalid.',
      ],
      [
        'required',
        'boolean',
        '—',
        'Textarea',
        'The element’s own attribute, passed through unchanged; Textarea never writes it. Inside a required field, the textarea receives aria-required instead.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: TextareaRootProps) => ReactNode',
        '—',
        'Textarea',
        'Renders another element in place of the textarea and passes it every attribute, including the two custom properties that carry rows and maxRows. The props are typed as HTMLAttributes<HTMLElement>, so they spread onto any element.',
      ],
      [
        'ref',
        'Ref<HTMLTextAreaElement>',
        '—',
        'Textarea',
        'Reaches the textarea element. focus(), select() and setSelectionRange() are the element’s own, so Textarea adds no imperative handle.',
      ],
      [
        'TextareaDefaultsProvider',
        '{ size, variant, mono, resize }',
        '—',
        'a subtree',
        'Sets size, variant, mono and resize once for every textarea under it. A textarea that states a value keeps it, and a textarea inside a field takes the field’s size over the provider’s.',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What Textarea reads inside a Field to wire itself: the identifier, the description, the disabled, read-only, invalid and required states, and the channel it publishes its count on.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices define no pattern for a multi-line text control. Textarea follows the HTML specification for the element and the ARIA textbox role, whose aria-multiline the native element supplies.',
      'Inside a field, the textarea takes its accessible name from the field’s label, whose for attribute points at the identifier the field generates. aria-describedby lists any value you write first, then the ones the field adds: help, description, count and error.',
      'A required field sets aria-required, not the native required. The native attribute turns on browser constraint validation and changes how the form submits; write required on the textarea to opt in, and it is kept. disabled and readonly are the native attributes.',
      'Enter adds a line and never submits the form. WAI-ARIA describes this as the difference between a single-line and a multi-line text control, and a comment box that submitted on Enter would lose what was being written.',
      'Tab moves focus out of the textarea. No key is bound, so no shortcut holds keyboard focus inside it.',
      'Growth with the content is CSS, not script: the textarea takes its new height with no animation, so a screen reader announces nothing and a reader who asked for reduced motion sees no movement.',
    ],
    snippets: [
      defineSnippet({
        id: 'textarea-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<textarea
  data-ui="textarea"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-resize="none"
  data-auto-size=""
  rows={2}
  style={{ '--slotted-textarea-rows': 2, '--slotted-textarea-max-rows': 6 }}
/>;`,
      }),
      defineSnippet({
        id: 'textarea-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='textarea'] {
  --slotted-textarea-border-color: var(--slotted-tone-secondary-border);
  --slotted-textarea-line-height: var(--slotted-line-height-lg);
  --slotted-textarea-rows: 4;
  --slotted-textarea-max-rows: 16;
}`,
      }),
    ],
  },
} as const;
