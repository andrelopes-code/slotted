import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import checkboxTokens from '@slotted/styles/checkbox/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_CHECKBOX_TOKENS = checkboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Checkbox decision',
}));

const imports: ReferenceImport = {
  source: "import { Checkbox, CheckboxDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The two-column grid: the box in one column, the label and the description in the other. It carries data-ui="checkbox", data-size, data-variant and data-label-placement, and data-checked, data-indeterminate, data-disabled, data-invalid and data-readonly. It has no role, so the native control is the only element announced. className and style reach this element.',
  },
  {
    part: 'control',
    element: 'input type="checkbox"',
    required: true,
    purpose:
      'The native checkbox. It holds the value, the name and the identifier, and receives every native attribute you write: form, required, autoFocus, every aria-* attribute and every handler. It draws the box itself with appearance: none. ref reaches it, so focus() and click() are the element’s own.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose:
      'The mark, drawn over the control as a mask from the glyph scale: a check when checked, a dash when mixed. It is a sibling element rather than a pseudo-element, because Firefox renders neither ::before nor ::after on an input. It takes no pointer events, so every press reaches the control underneath.',
  },
  {
    part: 'label',
    element: 'label',
    required: false,
    purpose:
      'Names the control through for. It carries the target and the hover wash: a 24-pixel square around the box, and a wash behind the box and the text that extends half the control gap past the box and half as far again past the text. It is as wide as its text, so the empty space beside it does not toggle the box. It renders without children too, for a box named by aria-label, and the wash then closes around the box. When its only content is visually hidden text, the root carries data-label-hidden and the wash closes the same way.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose:
      'Help text under the label, aligned to the label rather than to the box, and referenced by aria-describedby. It sits outside the label: inside, it would join the accessible name, and a press on it would toggle the value.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One box with every axis on it, driven by the controls below the canvas. Click the label, not only the box: the target runs from the square to the end of the text.',
    snippet: defineSnippet({
      id: 'checkbox-react-playground',
      language: 'tsx',
      label: 'A box, its label and its help',
      source: `<Checkbox description="We will send the receipt by email." defaultChecked>
  Send receipt
</Checkbox>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the box sits at',
    note: 'The square is the control glyph scale, so the three steps shrink together with the type and the gap when the toolbar switches to dense — and the label keeps its 24-pixel target at every one of them.',
    snippet: defineSnippet({
      id: 'checkbox-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<Checkbox size="sm">Compact</Checkbox>;
<Checkbox size="md">Default</Checkbox>;
<Checkbox size="lg">Comfortable</Checkbox>;

// Inside a field or a group, that decides and the box follows.
<CheckboxGroup size="sm">
  <Checkbox value="a">Compact because the group is</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'tile',
    title: 'The choice as a framed surface',
    note: 'Click anywhere inside a tile, not only the box: the label’s hit area stretches over the whole surface, so the target is the frame. Chosen says it with a two-pixel accent edge as well as a tint, because the high-contrast scheme flattens every tint to white and only the width survives.',
    snippet: defineSnippet({
      id: 'checkbox-react-tile',
      language: 'tsx',
      label: 'A row of framed choices, laid out by Grid',
      source: `// The tile frames one choice. Grid arranges them, because it already
// owns columns, minItemWidth and a stretching alignment.
<Grid minItemWidth="sm">
  <Checkbox description="One copy per day, kept for thirty days." variant="tile" value="backup">
    Daily backup
  </Checkbox>
  <Checkbox description="Who changed what, and when." variant="tile" value="audit">
    Audit log
  </Checkbox>
</Grid>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the box paints',
    note: 'Read-only keeps full-strength ink, its ring and its tab stop, because the value is real and still submitted; disabled loses all three. Invalid thickens the border as well as reddening it, because the high-contrast scheme paints every border the same black.',
    snippet: defineSnippet({
      id: 'checkbox-react-states',
      language: 'tsx',
      label: 'Every shared state unset by default',
      source: `// Unstated rather than false, so the box defers to its group or field.
<Checkbox invalid>Choose at least one</Checkbox>;
<Checkbox readOnly defaultChecked>
  Subscribed
</Checkbox>;
<Checkbox disabled>Unavailable</Checkbox>;

// A box inside a disabled fieldset is painted too: the stylesheet
// matches :disabled beside the mirrored attribute.`,
    }),
  },
  {
    id: 'indeterminate',
    title: 'The mixed state, and the box that commands a set',
    note: 'Mixed is a state and never a third value: the form still submits a boolean. Tick the parent and the whole set follows; untick one child and the parent goes back to the dash on its own.',
    snippet: defineSnippet({
      id: 'checkbox-react-indeterminate',
      language: 'tsx',
      label: 'A state a consumer owns, and one a group derives',
      source: `// Owned by the consumer: the box draws the dash and submits nothing new.
<Checkbox indeterminate>Parcialmente marcado</Checkbox>;

// Derived by the group: checked when every value is selected, mixed
// between, and its request replaces the whole selection.
<CheckboxGroup allValues={['mon', 'tue', 'wed']}>
  <Checkbox parent>Every day</Checkbox>
  <Checkbox value="mon">Monday</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side of its label the box is on',
    note: 'start pushes the box to the end of the row, which is where a settings list puts a control — and it is why the column is a fraction rather than the label’s own width: five boxes have to line up with each other.',
    snippet: defineSnippet({
      id: 'checkbox-react-placement',
      language: 'tsx',
      label: 'The box first, or the label first',
      source: `<Checkbox labelPlacement="end">The box before the label</Checkbox>;
<Checkbox labelPlacement="start">The box after the label</Checkbox>;

// Never inherited from a field: that family's labelPlacement answers
// where a field's label sits relative to its control.`,
    }),
  },
  {
    id: 'description',
    title: 'Saying more than the label does',
    note: 'The description aligns under the label rather than under the box, in both placements and both writing directions, and it is announced as the control’s description rather than as part of its name.',
    snippet: defineSnippet({
      id: 'checkbox-react-description',
      language: 'tsx',
      label: 'Help that is described, not named',
      source: `<Checkbox description="One summary per day, never more than one.">Receive email notices</Checkbox>;`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field, and inside a group of fields',
    note: 'The box reads the field for its step and its four shared states and never for its identifier: it owns its own label, and a field’s label would name the same control twice.',
    snippet: defineSnippet({
      id: 'checkbox-react-field',
      language: 'tsx',
      label: 'A set of boxes under one legend',
      source: `<FieldGroup required>
  <FieldGroupLegend>Notifications</FieldGroupLegend>
  <CheckboxGroup name="alerts">
    <Checkbox value="approved">Order approved</Checkbox>
    <Checkbox value="refused">Order refused</Checkbox>
  </CheckboxGroup>
</FieldGroup>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label that wraps to three lines keeps the box on the first of them rather than in the middle of the block, an unbroken token breaks instead of taking the page with it, and a right-to-left label mirrors the whole row.',
    snippet: defineSnippet({
      id: 'checkbox-react-content',
      language: 'tsx',
      label: 'Long, unbroken and right-to-left',
      source: `<Checkbox description="The box stays on the first line of the label.">
  I agree to receive communications about contract changes, delivery deadlines and changes to the
  returns policy.
</Checkbox>;

<Checkbox dir="rtl">أوافق على تلقي رسائل حول التغييرات في العقد.</Checkbox>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the two decisions an application takes once; render substitutes the root so a box can be a list item; ref reaches the element, which already has focus and click.',
    snippet: defineSnippet({
      id: 'checkbox-react-composition',
      language: 'tsx',
      label: 'A provider, a ref, and a substituted root',
      source: `<CheckboxDefaultsProvider labelPlacement="start" size="sm">
  <Checkbox>Herda os dois</Checkbox>
</CheckboxDefaultsProvider>;

const ref = useRef<HTMLInputElement>(null);
<Checkbox ref={ref} onCheckedChange={() => ref.current?.focus()} />;

// The root becomes the consumer's own element, with every attribute.
<Checkbox render={(props) => <li {...props} />}>Um item</Checkbox>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and who implements it',
    note: 'Space toggles and Enter submits the form, and neither is a listener this family writes: the control is a native checkbox, so the whole table is the platform’s and arrives translated and mirrored for free.',
    snippet: defineSnippet({
      id: 'checkbox-react-keyboard',
      language: 'tsx',
      label: 'No key is bound, and the reason is recovered from the click',
      source: `// Space and a pointer arrive as one click. A click synthesised by the
// keyboard reports no detail, which is how the reason is told apart
// without a key listener existing anywhere in the family.
<Checkbox
  onCheckedChange={(checked, request) => {
    console.log(request.reason); // "keyboard" | "pointer"
  }}
/>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onCheckedChange',
    payload: '(checked: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the box moves. request.value is the new state and request.previous the state it replaces. request.reason is pointer or keyboard, read from the click’s detail, and request.source is the originating event. request.cancel() refuses the change before anything commits, including the platform’s own toggle.',
  },
  {
    name: 'onChange, onClick, onFocus, onBlur',
    payload: 'the element’s own events',
    when: 'Whenever the input fires them. Checkbox composes your handler with its own instead of replacing it: yours runs first, and always runs. Calling preventDefault() in onClick stops the change as well.',
  },
];

export const REACT_CHECKBOX_DOCS = {
  checkbox: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'checked',
        'boolean',
        '—',
        'Checkbox',
        'Makes the state controlled for the life of the component. Without it the input keeps its own state, and a native form reset restores defaultChecked. Inside a checkbox group, the group’s selection decides instead.',
      ],
      [
        'defaultChecked',
        'boolean',
        'false',
        'Checkbox',
        'The state an uncontrolled box starts from. It is read once and written to the input as the native attribute, which is what a form reset returns to.',
      ],
      [
        'indeterminate',
        'boolean',
        'false',
        'Checkbox',
        'The mixed state, drawn as a dash and announced as mixed. It is a state, not a third value of checked: the submitted value stays boolean, because indeterminate is a DOM property that leaves checked unchanged.',
      ],
      [
        'parent',
        'boolean',
        'false',
        'Checkbox',
        'Makes the box command the set its checkbox group lists in allValues. It is checked when every value is selected and mixed when some are, and a press selects or clears the whole set. Outside a group with allValues it has no effect.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Checkbox, CheckboxDefaultsProvider',
        'The step of the control scale. When unset, the box takes the size of its checkbox group, then of its field or field group, then of the provider. The theme restates the scale per density.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'Checkbox, CheckboxDefaultsProvider',
        'How the choice is drawn. tile frames it and makes the whole surface the target; the label still names the control, so the keyboard and the accessible name are unchanged. When unset, the box takes the variant of its checkbox group, then of the provider.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'Checkbox, CheckboxDefaultsProvider',
        'Which side of its label the box sits on. When unset, the box takes the placement of its checkbox group, then of the provider. It is never read from a field, whose labelPlacement places the field’s own label.',
      ],
      [
        'disabled',
        'boolean',
        'from the group or field, or false',
        'Checkbox',
        'Unset rather than false, so the box follows its checkbox group or field. Written as the native attribute, which removes the box from the tab order and from form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the group or field, or false',
        'Checkbox',
        'Unset rather than false. A native checkbox has no readonly, so Checkbox refuses every change and writes aria-readonly. The box keeps its tab stop, its focus ring and its contrast, and its value is still submitted.',
      ],
      [
        'invalid',
        'boolean',
        'from the group or field, or false',
        'Checkbox',
        'Unset rather than false. Writes aria-invalid on the input and data-invalid on the root, which draws a thicker border in the danger tone.',
      ],
      [
        'required',
        'boolean',
        '—',
        'Checkbox',
        'The native attribute, passed through unchanged; Checkbox never writes it. A field marks necessity with aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
      [
        'description',
        'ReactNode',
        '—',
        'Checkbox',
        'Help text under the label, referenced by aria-describedby. It sits outside the label, so it describes the control instead of naming it.',
      ],
      [
        'name / value',
        'string',
        '— / on',
        'Checkbox',
        'The native submission pair: a checked box submits value under name. Inside a checkbox group, a box without a name takes the group’s, and value is the entry the group’s selection holds.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: CheckboxRootProps) => ReactNode',
        '—',
        'Checkbox',
        'Replaces the root element and receives every attribute it would carry. The props are typed against HTMLAttributes<HTMLElement>, so they can be spread onto a li or a label. The input cannot be replaced, because it holds the value and the platform’s keyboard behavior.',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'Checkbox',
        'Reaches the input. focus() and click() are the element’s own methods.',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'Checkbox',
        'Reach the root. Every other native prop reaches the input.',
      ],
      [
        'CheckboxDefaultsProvider',
        '{ size, variant, labelPlacement }',
        '—',
        'a subtree',
        'Sets size, variant and labelPlacement once for every box under it, merged over an outer provider. A box that states a value keeps it. A checkbox group around the box outranks the provider for all three, and a field or field group outranks it for size.',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What the box reads from a field: its disabled, readOnly, invalid and required states, its description and error, and its size. The box never takes the field’s identifier: it has its own label, and the field’s label would name the same control twice.',
      ],
    ]),
    accessibility: [
      'Checkbox follows the WAI-ARIA Authoring Practices checkbox pattern (w3.org/WAI/ARIA/apg/patterns/checkbox/), and the native input supplies every part of it: the role, the checked and mixed states, Space to toggle, Enter left to the form, and disabled behavior. Checkbox adds no key listener, so the keyboard behavior is the platform’s in every language and in right-to-left documents.',
      'The label names the control through for, which points at an identifier Checkbox generates when you pass no id. The description sits outside the label and reaches the control through aria-describedby, so it is read as a description, and a press on it toggles nothing.',
      'Inside a required field the control carries aria-required, never the native required, because the native attribute turns on browser constraint validation and changes how the form submits. Pass required on the box to opt into the platform’s validation; Checkbox leaves it unchanged. disabled is the native attribute.',
      'A native checkbox has no read-only state, so Checkbox enforces one: it refuses the click that a pointer and Space both produce, and aria-readonly announces the state. The box keeps its tab stop, its focus ring and its full contrast, because a read-only value is real and must not look disabled.',
      'The invalid state does not rely on color alone. In the high-contrast scheme the theme paints every border the same color, so an invalid box also draws a thicker border. The message that says what is wrong belongs to the field or field group.',
      'The target is larger than the box. A 24-pixel square around the box meets WCAG 2.2 success criterion 2.5.8 at every size and density, including size="sm", where the box is 14 pixels. The label extends the target to the end of its text, and the hover wash covers exactly that area. The target is drawn around the box, so the row keeps its line height.',
      'The mark stays visible under forced colors. It is a mask over a background color, and forced colors replace both, so Checkbox restates the pair in system colors.',
    ],
    snippets: [
      defineSnippet({
        id: 'checkbox-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="checkbox" data-part="root" data-size="md" data-label-placement="end" data-checked>
  <input
    data-part="control"
    type="checkbox"
    id="terms"
    aria-describedby="terms-description"
    checked
  />
  <span data-part="indicator">
    <span data-ui="icon" data-part="root" aria-hidden="true">
      <svg data-part="glyph" data-glyph="check" aria-hidden="true"></svg>
    </span>
  </span>
  <label data-part="label" for="terms">
    Aceito os termos
  </label>
  <p data-part="description" id="terms-description">
    Enviaremos o recibo por e-mail.
  </p>
</div>;`,
      }),
      defineSnippet({
        id: 'checkbox-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='checkbox'] {
  --slotted-checkbox-size: 18px;
  --slotted-checkbox-radius: var(--slotted-radius-xs);
  --slotted-checkbox-checked-background: var(--slotted-tone-success-solid);
  --slotted-checkbox-mark-inset: 3px;
}`,
      }),
    ],
  },
} as const;
