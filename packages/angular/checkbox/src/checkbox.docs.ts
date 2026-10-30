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

export const ANGULAR_CHECKBOX_TOKENS = checkboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Checkbox decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideCheckboxDefaults,\n  SlCheckbox,\n  SlCheckboxDescription,\n} from '@slotted/angular/checkbox';",
  selector: '[slCheckbox]',
  exportAs: 'slCheckbox',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slCheckbox',
    required: true,
    purpose:
      'The two-column grid: the box in one column, the label and the description in the other. It carries data-ui="checkbox", data-size, data-variant and data-label-placement, and data-checked, data-indeterminate, data-disabled, data-invalid and data-readonly. It has no role, so the native control is the only element announced. Write formControlName, formControl or ngModel on this element.',
  },
  {
    part: 'control',
    element: 'input type="checkbox", in the component’s template',
    required: true,
    purpose:
      'The native checkbox. It holds the value, the name and the identifier, and draws the box itself with appearance: none. The element belongs to the component’s template, so reach it through exportAs: box.inputElement gives focus() and click().',
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
    element: 'label, in the component’s template',
    required: false,
    purpose:
      'Names the control through for. Its content is the default ng-content slot, so everything you project becomes the accessible name. It carries the target and the hover wash: a 24-pixel square around the box, and a wash behind the box and the text that extends half the control gap past the box and half as far again past the text. It is as wide as its text, so the empty space beside it does not toggle the box. It renders when nothing is projected too, and the wash then closes around the box. When the projected content is only an element with slVisuallyHidden, as for a box in a table row, the root carries data-label-hidden and the wash closes the same way.',
  },
  {
    part: 'description',
    element: 'the element carrying slCheckboxDescription',
    required: false,
    purpose:
      'Help text under the label, projected into a slot outside the label and referenced by aria-describedby. It sits outside the label: inside, it would join the accessible name, and a press on it would toggle the value.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One box with every axis on it, driven by the controls below the canvas. Click the label, not only the box: the target runs from the square to the end of the text.',
    snippet: defineSnippet({
      id: 'checkbox-angular-playground',
      language: 'angular',
      label: 'A box, its label and its help',
      source: `<div slCheckbox defaultChecked>
  Send receipt
  <p slCheckboxDescription>We will send the receipt by email.</p>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the box sits at',
    note: 'The square is the control glyph scale, so the three steps shrink together with the type and the gap when the toolbar switches to dense — and the label keeps its 24-pixel target at every one of them.',
    snippet: defineSnippet({
      id: 'checkbox-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slCheckbox size="sm">Compact</div>
<div slCheckbox size="md">Default</div>
<div slCheckbox size="lg">Comfortable</div>

<!-- Inside a group or a field, that decides and the box follows. -->
<div slCheckboxGroup size="sm">
  <div slCheckbox value="a">Compact because the group is</div>
</div>`,
    }),
  },
  {
    id: 'tile',
    title: 'The choice as a framed surface',
    note: 'Click anywhere inside a tile, not only the box: the label’s hit area stretches over the whole surface, so the target is the frame. Chosen says it with a two-pixel accent edge as well as a tint, because the high-contrast scheme flattens every tint to white and only the width survives.',
    snippet: defineSnippet({
      id: 'checkbox-angular-tile',
      language: 'angular',
      label: 'A row of framed choices, laid out by Grid',
      source: `<!-- The tile frames one choice. Grid arranges them, because it already
     owns columns, minItemWidth and a stretching alignment. -->
<div slGrid minItemWidth="sm">
  <div slCheckbox variant="tile" value="backup">
    Daily backup
    <p slCheckboxDescription>One copy per day, kept for thirty days.</p>
  </div>
  <div slCheckbox variant="tile" value="audit">
    Audit log
    <p slCheckboxDescription>Who changed what, and when.</p>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the box paints',
    note: 'Read-only keeps full-strength ink, its ring and its tab stop, because the value is real and still submitted; disabled loses all three. Invalid thickens the border as well as reddening it, because the high-contrast scheme paints every border the same black.',
    snippet: defineSnippet({
      id: 'checkbox-angular-states',
      language: 'angular',
      label: 'Every shared state unset by default',
      source: `<!-- Unstated rather than false, so the box defers to its group or field. -->
<div slCheckbox invalid>Choose at least one</div>
<div slCheckbox readOnly defaultChecked>Subscribed</div>
<div slCheckbox disabled>Unavailable</div>`,
    }),
  },
  {
    id: 'indeterminate',
    title: 'The mixed state, and the box that commands a set',
    note: 'Mixed is a state and never a third value: the form still submits a boolean. Tick the parent and the whole set follows; untick one child and the parent goes back to the dash on its own.',
    snippet: defineSnippet({
      id: 'checkbox-angular-indeterminate',
      language: 'angular',
      label: 'A state a consumer owns, and one a group derives',
      source: `<!-- Owned by the consumer: the box draws the dash and submits nothing new. -->
<div slCheckbox indeterminate>Parcialmente marcado</div>

<!-- Derived by the group: checked when every value is selected, mixed
     between, and its request replaces the whole selection. -->
<div slCheckboxGroup [allValues]="days">
  <div slCheckbox parent>Every day</div>
  <div slCheckbox value="mon">Monday</div>
</div>`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side of its label the box is on',
    note: 'start pushes the box to the end of the row, which is where a settings list puts a control — and it is why the column is a fraction rather than the label’s own width: five boxes have to line up with each other.',
    snippet: defineSnippet({
      id: 'checkbox-angular-placement',
      language: 'angular',
      label: 'The box first, or the label first',
      source: `<div slCheckbox labelPlacement="end">The box before the label</div>
<div slCheckbox labelPlacement="start">The box after the label</div>`,
    }),
  },
  {
    id: 'description',
    title: 'Saying more than the label does',
    note: 'The description aligns under the label rather than under the box, in both placements and both writing directions, and it is announced as the control’s description rather than as part of its name.',
    snippet: defineSnippet({
      id: 'checkbox-angular-description',
      language: 'angular',
      label: 'Help that is described, not named',
      source: `<div slCheckbox>
  Receive email notices
  <p slCheckboxDescription>One summary per day, never more than one.</p>
</div>`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field, and in a reactive form',
    note: 'The box reads the field for its step and its four shared states and never for its identifier, and the same element is where formControlName goes — the value accessor is on the root.',
    snippet: defineSnippet({
      id: 'checkbox-angular-field',
      language: 'angular',
      label: 'A set of boxes under one legend, bound to a form',
      source: `<fieldset slFieldGroup required>
  <legend slFieldGroupLegend>Notifications</legend>
  <div slCheckboxGroup name="alerts" formControlName="alerts">
    <div slCheckbox value="approved">Order approved</div>
    <div slCheckbox value="refused">Order refused</div>
  </div>
</fieldset>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label that wraps to three lines keeps the box on the first of them rather than in the middle of the block, an unbroken token breaks instead of taking the page with it, and a right-to-left label mirrors the whole row.',
    snippet: defineSnippet({
      id: 'checkbox-angular-content',
      language: 'angular',
      label: 'Long, unbroken and right-to-left',
      source: `<div slCheckbox>
  I agree to receive communications about contract changes and delivery deadlines.
  <p slCheckboxDescription>The box stays on the first line of the label.</p>
</div>

<div slCheckbox dir="rtl">أوافق على تلقي رسائل حول التغييرات في العقد.</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The token carries the two decisions an application takes once, exportAs reaches the instance and the native element behind it, and the root is the consumer’s own element rather than one the family renders.',
    snippet: defineSnippet({
      id: 'checkbox-angular-composition',
      language: 'angular',
      label: 'A provider, and the element behind the instance',
      source: `<!-- exportAs reaches the instance; inputElement reaches the input,
     which already has focus() and click(). -->
<div slCheckbox #box="slCheckbox">Uma caixa</div>
<button type="button" (click)="box.inputElement.focus()">Focar</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and who implements it',
    note: 'Space toggles and Enter submits the form, and neither is a listener this family writes: the control is a native checkbox, so the whole table is the platform’s and arrives translated and mirrored for free.',
    snippet: defineSnippet({
      id: 'checkbox-angular-keyboard',
      language: 'angular',
      label: 'No key is bound, and the reason is recovered from the click',
      source: `<!-- Space and a pointer arrive as one click. A click synthesised by the
     keyboard reports no detail, which is how the reason is told apart
     without a key listener existing anywhere in the family. -->
<div slCheckbox (checkedChange)="log($event.reason)">Marque com o teclado</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(checkedChange)',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the box moves. value is the new state and previous the state it replaces. reason is pointer or keyboard, read from the click’s detail, and source is the originating event. cancel() refuses the change before anything commits, including the platform’s own toggle. There is no [(checked)], because a two-way binding carries only the value.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'boolean',
    when: 'Whenever the box moves under a formControl, formControlName or ngModel written on the root. The form receives the new state without listening to (checkedChange).',
  },
];

export const ANGULAR_CHECKBOX_DOCS = {
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
        'SlCheckbox',
        'Makes the state controlled. Without it the box keeps its own state, starting from defaultChecked, and a native form reset restores defaultChecked. Inside a checkbox group, the group’s selection decides instead.',
      ],
      [
        'defaultChecked',
        'boolean',
        'false',
        'SlCheckbox',
        'The state an uncontrolled box starts from. It is read once, when the component initialises, and written to the input as the native attribute, which is what a form reset returns to.',
      ],
      [
        'indeterminate',
        'boolean',
        'false',
        'SlCheckbox',
        'The mixed state, drawn as a dash and announced as mixed. It is a state, not a third value of checked: the submitted value stays boolean, because indeterminate is a DOM property that leaves checked unchanged.',
      ],
      [
        'parent',
        'boolean',
        'false',
        'SlCheckbox',
        'Makes the box command the set its checkbox group lists in allValues. It is checked when every value is selected and mixed when some are, and a press selects or clears the whole set. Outside a group with allValues it has no effect.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SlCheckbox, provideCheckboxDefaults',
        'The step of the control scale. When unset, the box takes the size of its checkbox group, then of its field or field group, then of the provided defaults. The theme restates the scale per density.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'SlCheckbox, provideCheckboxDefaults',
        'How the choice is drawn. tile frames it and makes the whole surface the target; the label still names the control, so the keyboard and the accessible name are unchanged. When unset, the box takes the variant of its checkbox group, then of the provided defaults.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'SlCheckbox, provideCheckboxDefaults',
        'Which side of its label the box sits on. When unset, the box takes the placement of its checkbox group, then of the provided defaults. It is never read from a field, whose labelPlacement places the field’s own label.',
      ],
      [
        'disabled',
        'boolean',
        'from the form control, group or field, or false',
        'SlCheckbox',
        'Unset rather than false, so the box follows a disabled form control, then its checkbox group or field. Written to the input as the native attribute, which removes the box from the tab order and from form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the group or field, or false',
        'SlCheckbox',
        'Unset rather than false. A native checkbox has no readonly, so SlCheckbox refuses every change and writes aria-readonly. The box keeps its tab stop, its focus ring and its contrast, and its value is still submitted.',
      ],
      [
        'invalid',
        'boolean',
        'from the group or field, or false',
        'SlCheckbox',
        'Unset rather than false. Writes aria-invalid on the input and data-invalid on the root, which draws a thicker border in the danger tone.',
      ],
      [
        'tabIndex',
        'number',
        '—',
        'SlCheckbox',
        'Written to the input as tabindex. A composite widget that owns the tab sequence, such as a data grid, passes -1 until the box’s cell is current. Unset leaves the native order.',
      ],
      [
        'required',
        'boolean',
        '—',
        'the host element',
        'The native attribute, read once as a static attribute and passed to the input unchanged; SlCheckbox never writes it. A field marks necessity with aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
      [
        'name / value',
        'string',
        '— / on',
        'SlCheckbox',
        'The native submission pair: a checked box submits value under name. Inside a checkbox group, a box without a name takes the group’s, and value is the entry the group’s selection holds.',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs="slCheckbox"',
        'SlCheckbox',
        '—',
        'a template',
        'Reaches the component instance. Its inputElement is the input, whose own focus() and click() methods move focus and toggle the box.',
      ],
      [
        'slCheckboxDescription',
        'directive',
        '—',
        'a projected element',
        'Marks the description, projected outside the label. It goes on your own element, so a p, a span or an inline message keeps its semantics.',
      ],
      [
        'provideCheckboxDefaults()',
        '{ size, variant, labelPlacement }',
        '—',
        'an injector',
        'Sets size, variant and labelPlacement once for every box the injector reaches; the nearest provider wins. A box that states a value keeps it. A checkbox group around the box outranks the defaults for all three, and a field or field group outranks them for size.',
      ],
      [
        'ControlValueAccessor',
        'formControl, formControlName, ngModel',
        '—',
        'the host element',
        'Write the form binding on the root, beside slCheckbox. A disabled form control disables the box, and blur marks the control touched.',
      ],
      [
        'the host element',
        'any element',
        '—',
        'SlCheckbox',
        'The element you write slCheckbox on is the root, so you choose its tag: a div, a li or a label of your own.',
      ],
    ]),
    accessibility: [
      'SlCheckbox follows the WAI-ARIA Authoring Practices checkbox pattern (w3.org/WAI/ARIA/apg/patterns/checkbox/), and the native input supplies every part of it: the role, the checked and mixed states, Space to toggle, Enter left to the form, and disabled behaviour. SlCheckbox adds no key listener, so the keyboard behaviour is the platform’s in every language and in right-to-left documents.',
      'The label names the control through for, which points at an identifier SlCheckbox generates unless you write a static id on the host. The description is projected outside the label and reaches the control through aria-describedby, so it is read as a description, and a press on it toggles nothing.',
      'Inside a required field the control carries aria-required, never the native required, because the native attribute turns on browser constraint validation and changes how the form submits. Write required on the host to opt into the platform’s validation; it is read as a static attribute and passed through unchanged. disabled is the native attribute.',
      'A native checkbox has no read-only state, so SlCheckbox enforces one: it refuses the click that a pointer and Space both produce, and aria-readonly announces the state. The box keeps its tab stop, its focus ring and its full contrast, because a read-only value is real and must not look disabled.',
      'A refused change is undone by the platform, not by SlCheckbox. The HTML standard undoes a cancelled checkbox click by inverting checked again, so SlCheckbox cancels the click’s default action instead of writing the element; a controlled box therefore shows the value its consumer holds.',
      'The invalid state does not rely on colour alone. In the high-contrast scheme the theme paints every border the same colour, so an invalid box also draws a thicker border. The message that says what is wrong belongs to the field or field group.',
      'The target is larger than the box. A 24-pixel square around the box meets WCAG 2.2 success criterion 2.5.8 at every size and density, including size="sm", where the box is 14 pixels. The label extends the target to the end of its text, and the hover wash covers exactly that area. The target is drawn around the box, so the row keeps its line height.',
    ],
    snippets: [
      defineSnippet({
        id: 'checkbox-angular-defaults',
        language: 'ts',
        label: 'The two decisions an application takes once',
        source: `import { provideCheckboxDefaults } from '@slotted/angular/checkbox';

bootstrapApplication(App, {
  providers: [provideCheckboxDefaults({ labelPlacement: 'start', size: 'sm' })],
});`,
      }),
      defineSnippet({
        id: 'checkbox-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="checkbox" data-part="root" data-size="md" data-label-placement="end" data-checked>
  <input data-part="control" type="checkbox" id="terms" checked />
  <span data-part="indicator"
    ><span data-ui="icon" data-part="root" aria-hidden="true"
      ><svg data-part="glyph" data-glyph="check" aria-hidden="true"></svg></span
  ></span>
  <label data-part="label" for="terms">Aceito os termos</label>
  <p data-part="description" id="terms-description">Enviaremos o recibo.</p>
</div>`,
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
