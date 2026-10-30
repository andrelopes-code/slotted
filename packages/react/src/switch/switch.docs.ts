import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import switchTokens from '@slotted/styles/switch/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SWITCH_TOKENS = switchTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Switch decision',
}));

const imports: ReferenceImport = {
  source: "import { Switch, SwitchDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span, or the element render returns',
    required: true,
    purpose:
      'The box. It carries data-ui="switch", the three axes, and data-checked, data-disabled, data-readonly, data-invalid and data-loading. It has no role: ARIA makes the children of a switch presentational, so a root carrying the role would fold the label and the description into the control’s accessible name. className and style reach this element.',
  },
  {
    part: 'control',
    element: 'input[type=checkbox][role=switch]',
    required: true,
    purpose:
      'The control. It holds the state, the identifier and every native attribute a consumer writes, such as name, value, form, required, autoFocus and tabIndex. It is transparent and lies over the pill, so a press on the pill is a press on the control. ref reaches this element.',
  },
  {
    part: 'track',
    element: 'span',
    required: true,
    purpose:
      'The pill. It paints the ground, the edge and the focus ring, and it is the box the thumb travels inside.',
  },
  {
    part: 'thumb',
    element: 'span',
    required: true,
    purpose:
      'The part that moves, and the ground the check is drawn on. It travels on the inline axis, so a right-to-left document mirrors the movement.',
  },
  {
    part: 'label',
    element: 'label',
    required: false,
    purpose:
      'The label, from children. It points at the control through for, so it names the switch and a press on it toggles the switch. A switch written without children takes its name from aria-label or from the field’s label.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose:
      'Help text under the label, from description. It sits outside the label, so it does not join the accessible name and a press on it changes nothing. Its identifier reaches the control through aria-describedby.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One switch with every axis on it, driven by the controls below the canvas. Click the label as well as the pill: the label names the control and doubles its target.',
    snippet: defineSnippet({
      id: 'switch-react-playground',
      language: 'tsx',
      label: 'A switch, its label and its help',
      source: `<Switch
  defaultChecked
  description="The invoice is charged on the 5th of each month."
  name="autopay"
>
  Autopay
</Switch>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the switch takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'switch-react-sizes',
      language: 'tsx',
      label: 'Three steps, all answering density',
      source: `<Switch size="sm">Compact</Switch>;
<Switch size="lg">Comfortable</Switch>;

// Inside a field the field decides, and the control follows.
<Field size="sm">
  <Switch>Notifications</Switch>
</Field>;`,
    }),
  },
  {
    id: 'indicator',
    title: 'The mark inside the thumb',
    note: 'On draws a check and off draws nothing, so the state is readable without color and without comparing the thumb’s position to a switch you cannot see.',
    snippet: defineSnippet({
      id: 'switch-react-indicator',
      language: 'tsx',
      label: 'A mark, or nothing at all',
      source: `<Switch defaultChecked>Com marca</Switch>;

// Withdraw the mark only where something else carries the state.
<Switch defaultChecked indicator="none">
  Sem marca
</Switch>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side the pill sits on',
    note: 'start is the settings row every product writes: the label takes the free width, the pill sits at the end, and a column of rows ends with every pill at the same distance from the edge.',
    snippet: defineSnippet({
      id: 'switch-react-placement',
      language: 'tsx',
      label: 'The label first, and the pill at the end',
      source: `<Switch labelPlacement="start">Email alerts</Switch>;
<Switch labelPlacement="start">Weekly summary of overdue orders</Switch>;`,
    }),
  },
  {
    id: 'description',
    title: 'Help text under the label',
    note: 'It sits outside the label, so it describes the switch rather than naming it — and so a paragraph of help text does not change a setting when it is clicked.',
    snippet: defineSnippet({
      id: 'switch-react-description',
      language: 'tsx',
      label: 'A label, and the sentence under it',
      source: `<Switch defaultChecked description="The invoice is charged on the 5th of each month.">
  Autopay
</Switch>;`,
    }),
  },
  {
    id: 'states',
    title: 'The states the pill paints',
    note: 'Read-only goes hollow and keeps its color, because the value is real and still submitted; disabled goes grey and its knob goes with it, so a locked setting still says which way it is set.',
    snippet: defineSnippet({
      id: 'switch-react-states',
      language: 'tsx',
      label: 'Every state unset by default, and native where the word means native',
      source: `// Unstated rather than false, so the switch defers to its field.
<Switch invalid>I accept the terms</Switch>;
<Switch defaultChecked readOnly>
  Production key
</Switch>;
<Switch defaultChecked disabled>
  Included in the plan
</Switch>;

// A switch inside a disabled FieldGroup — a native fieldset — is painted
// too, because the stylesheet matches :disabled beside the attribute.
<FieldGroup disabled>
  <FieldGroupLegend>Integration</FieldGroupLegend>
  <Switch defaultChecked>Sync orders</Switch>
</FieldGroup>;`,
    }),
  },
  {
    id: 'loading',
    title: 'A setting that has not landed yet',
    note: 'The thumb draws an arc where its mark was, the pill keeps its size so the row does not move, and a second press is refused before the DOM can show a state the server does not have.',
    snippet: defineSnippet({
      id: 'switch-react-loading',
      language: 'tsx',
      label: 'The write, and the state that waits for it',
      source: `const [on, setOn] = useState(false);
const [saving, setSaving] = useState(false);

// The switch moves when the server says it did, and refuses a second
// press until then.
<Switch
  checked={on}
  loading={saving}
  messages={{ loading: 'Saving preference' }}
  onCheckedChange={async (next) => {
    setSaving(true);
    await save(next).then(() => setOn(next));
    setSaving(false);
  }}
>
  Automatic sync
</Switch>;`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field',
    note: 'The switch takes the identifier, the description, the error and the four shared states without being asked, and it writes aria-required rather than the native attribute.',
    snippet: defineSnippet({
      id: 'switch-react-field',
      language: 'tsx',
      label: 'Nothing wires the control; the control wires itself',
      source: `<Field invalid required>
  <FieldLabel>Terms of use</FieldLabel>
  <Switch>I accept the terms</Switch>
  <FieldError>You must accept to continue.</FieldError>
</Field>;`,
    }),
  },
  {
    id: 'settings',
    title: 'A row on a settings page',
    note: 'Where a switch actually lives: the label takes the free width, the pill sits at the end of the row, and the description sits under the label rather than under the pill.',
    snippet: defineSnippet({
      id: 'switch-react-settings',
      language: 'tsx',
      label: 'Three rows that line up',
      source: `<Stack gap={7}>
  <Switch defaultChecked description="One notice for each overdue order." labelPlacement="start">
    Email alerts
  </Switch>
  <Switch description="Orders created here are not charged." labelPlacement="start">
    Staging environment
  </Switch>
</Stack>;`,
    }),
  },
  {
    id: 'composition',
    title: 'What a consumer can replace',
    note: 'The root becomes any element render returns, an application sets the family’s defaults once, and every native attribute a consumer writes lands on the control rather than on the box.',
    snippet: defineSnippet({
      id: 'switch-react-composition',
      language: 'tsx',
      label: 'The root, the defaults, and the element underneath',
      source: `<SwitchDefaultsProvider labelPlacement="start" size="sm">
  <Switch>Alertas por e-mail</Switch>
</SwitchDefaultsProvider>;

// The root becomes a list item, so a settings list is a list.
<Switch render={(props) => <li {...props} />}>Resumo semanal</Switch>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches the control and Space toggles it, both from the platform. Enter is deliberately not bound: inside a form it submits, and a switch that stole it would break the form.',
    snippet: defineSnippet({
      id: 'switch-react-keyboard',
      language: 'tsx',
      label: 'What the request says about how it was made',
      source: `<Switch
  onCheckedChange={(next, request) => {
    // "pointer", "keyboard" or "programmatic".
    if (request.reason === 'pointer' && next) request.cancel();
  }}
>
  Receive the invoice
</Switch>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onCheckedChange',
    payload: '(checked: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the switch moves. request.value is the new state and request.previous the state it replaces. request.reason is "pointer" for a press, "keyboard" for Space or "programmatic" for element.click(). request.source is the originating event, and request.cancel() refuses the move before anything commits.',
  },
  {
    name: 'onClick, onChange, onFocus, onBlur',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The switch runs a consumer’s handler before its own, and a click handler that calls preventDefault() refuses the move before onCheckedChange is called.',
  },
];

export const REACT_SWITCH_DOCS = {
  switch: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'checked',
        'boolean',
        '—',
        'Switch',
        'The state, owned by the consumer for the life of the component when it is set. Unset, the element owns the state and a native form reset restores it.',
      ],
      [
        'defaultChecked',
        'boolean',
        'false',
        'Switch',
        'The state an uncontrolled switch starts from, read once and written to the element as the native attribute.',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'Switch',
        'The label, beside the pill. It renders a label element pointing at the control through for, so it names the switch and a press on it toggles the switch.',
      ],
      [
        'description',
        'ReactNode',
        '—',
        'Switch',
        'Help text under the label and outside it. It reaches the control through aria-describedby, so it describes the switch and does not name it.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Switch, SwitchDefaultsProvider',
        'The control step. A field around the switch decides it first, then the defaults provider. The pill, the thumb, the check and the label read the control scales, which the theme restates per density.',
      ],
      [
        'indicator',
        "'mark' | 'none'",
        'mark',
        'Switch, SwitchDefaultsProvider',
        'What the thumb carries. mark draws a check when the switch is on and nothing when it is off. none draws nothing, and is correct only where text beside the switch states the value.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'Switch, SwitchDefaultsProvider',
        'Which side of the label the pill sits on. start is the settings row: the label takes the free width and the pill sits at the end of the row.',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Switch',
        'The value is not settled yet. The switch refuses every press, keeps its size, sets aria-busy, and announces the pending label politely once the wait passes two seconds.',
      ],
      [
        'messages',
        'Partial<SwitchMessages>',
        '—',
        'Switch',
        'Words that replace the active language’s, key by key: loading is what a screen reader hears while the switch is pending. The words reach a live region, not the control’s name, so the name never changes with the state.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'Switch',
        'Unset rather than false, so the switch follows the field around it. A stated value wins. It is the native attribute, which takes the switch out of the tab order and out of form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'Switch',
        'Unset rather than false. The native readonly attribute does nothing on a checkbox, so the switch sets aria-readonly and refuses every press. It stays focusable, announced and submitted.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'Switch',
        'Unset rather than false, so the switch follows the field around it. Writes aria-invalid on the control and data-invalid on the root, which draws the edge and the focus ring in the danger tone.',
      ],
      [
        'required',
        'boolean',
        '—',
        'Switch',
        'The element’s own attribute, passed through unchanged; the switch never writes it. A required field sets aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
      [
        'name / value / form',
        'string',
        '— / on / —',
        'Switch',
        'The element’s own attributes. The form submits name with value when the switch is on, and nothing when it is off, as it does for a checkbox.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: SwitchRootProps) => ReactNode',
        '—',
        'Switch',
        'Replaces the root element and hands it every attribute. The props are typed against HTMLAttributes<HTMLElement>, so they can be spread onto a list item or a table cell. The control, the pill and the label are fixed: the control holds the state and the identifier, and the other parts are the switch’s own drawing.',
      ],
      [
        'ref',
        'Ref<HTMLInputElement>',
        '—',
        'Switch',
        'Reaches the control. focus() and click() are the element’s own, and a click() reaches onCheckedChange with the reason "programmatic".',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'Switch',
        'Reach the root, the element a consumer styles. Every other native prop reaches the control.',
      ],
      [
        'SwitchDefaultsProvider',
        '{ size, indicator, labelPlacement }',
        '—',
        'a subtree',
        'Sets size, indicator and labelPlacement once for every switch under it. A field outranks the provider’s size, so a switch inside a field takes the field’s step.',
      ],
      [
        'useField()',
        '() => FieldContextValue | undefined',
        '—',
        'inside a Field',
        'What the switch reads from a field around it: the identifier, the description, and the disabled, read-only, invalid and required states. The switch needs no wiring inside a field.',
      ],
    ]),
    accessibility: [
      'The pattern is the Switch of the WAI-ARIA Authoring Practices, built as the third of its reference implementations: an input[type=checkbox] with role="switch". The platform supplies the rest: Space toggles it, the label names it and toggles it, name and value are submitted, form.reset() restores it, and a disabled fieldset disables it.',
      'The switch writes no aria-checked. The Authoring Practices state that a switch built on a checkbox uses the HTML checked state instead, and writing both would state the value twice in two places that can disagree.',
      'Enter does not toggle the switch. The Authoring Practices list Enter as optional, and inside a form Enter submits the form, which a switch bound to Enter would prevent. A reader who expects Enter presses Space.',
      'The root carries no role, because ARIA makes the children of a switch presentational: the label and the description would otherwise join the control’s accessible name. The name of a switch does not change with its state, so the pending label is a live region and not part of the name.',
      'A required field sets aria-required, never the native required, which would turn on browser constraint validation and change how the form submits; a consumer who wants the native attribute writes required and it reaches the control. disabled is the native attribute. Read-only is aria-readonly plus a refused press, because the native readonly attribute does nothing on a checkbox.',
      'The target is at least 24 CSS pixels in both axes at every size and every density, as WCAG 2.2 success criterion 2.5.8 requires. The label supplies the height when there is one, and a switch without a label sets the minimum on its own row.',
      'The description sits outside the label, so it describes the switch and does not name it, and a press on it changes nothing.',
    ],
    snippets: [
      defineSnippet({
        id: 'switch-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<span data-ui="switch" data-part="root" data-size="md" data-indicator="mark" data-checked>
  <input data-part="control" type="checkbox" role="switch" id="autopay" checked />
  <span data-part="track">
    <span data-part="thumb">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="check" aria-hidden="true"></svg>
      </span>
    </span>
  </span>
  <label data-part="label" htmlFor="autopay">
    Autopay
  </label>
  <p data-part="description" id="autopay-description">
    Debitada no dia 5.
  </p>
</span>;`,
      }),
      defineSnippet({
        id: 'switch-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='switch'] {
  --slotted-switch-checked-background: var(--slotted-tone-success-solid);
  --slotted-switch-checked-border-color: var(--slotted-tone-success-solid);
  --slotted-switch-mark-color: var(--slotted-tone-success-solid);
  --slotted-switch-radius: var(--slotted-radius-sm);
}`,
      }),
    ],
  },
} as const;
