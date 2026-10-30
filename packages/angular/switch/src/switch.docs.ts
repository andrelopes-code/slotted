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

export const ANGULAR_SWITCH_TOKENS = switchTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Switch decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideSwitchDefaults,\n  SlSwitch,\n  SlSwitchDescription,\n} from '@slotted/angular/switch';",
  selector: '[slSwitch]',
  exportAs: 'slSwitch',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slSwitch',
    required: true,
    purpose:
      'The box: the consumer’s own element. It carries data-ui="switch", the three axes, and data-checked, data-disabled, data-readonly, data-invalid and data-loading. It has no role: ARIA makes the children of a switch presentational, so a host carrying the role would fold the label and the description into the control’s accessible name.',
  },
  {
    part: 'control',
    element: 'input[type=checkbox][role=switch], from the component’s template',
    required: true,
    purpose:
      'The control. It holds the state, the identifier, the name and the value. id, aria-* and required written on the host reach it unchanged, and formControlName on the host reaches it through the value accessor. It is transparent and lies over the pill, so a press on the pill is a press on the control.',
  },
  {
    part: 'track',
    element: 'span, from the component’s template',
    required: true,
    purpose:
      'The pill. It paints the ground, the edge and the focus ring, and it is the box the thumb travels inside.',
  },
  {
    part: 'thumb',
    element: 'span, from the component’s template',
    required: true,
    purpose:
      'The part that moves, and the ground the check is drawn on. It travels on the inline axis, so a right-to-left document mirrors the movement.',
  },
  {
    part: 'label',
    element: 'label, holding the projected content',
    required: false,
    purpose:
      'The label, holding the projected content. It points at the control through for, so it names the switch and a press on it toggles the switch. A switch written without content takes its name from aria-label or from the field’s label.',
  },
  {
    part: 'description',
    element: 'the element carrying slSwitchDescription',
    required: false,
    purpose:
      'Help text under the label, projected outside it, so it does not join the accessible name and a press on it changes nothing. Its identifier reaches the control through aria-describedby.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One switch with every axis on it, driven by the controls below the canvas. Click the label as well as the pill: the label names the control and doubles its target.',
    snippet: defineSnippet({
      id: 'switch-angular-playground',
      language: 'angular',
      label: 'A switch, its label and its help',
      source: `<span slSwitch defaultChecked name="autopay">
  Automatic billing
  <p slSwitchDescription>The invoice is charged on the 5th of each month.</p>
</span>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the switch takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'switch-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<span slSwitch size="sm">Compact</span>
<span slSwitch size="lg">Comfortable</span>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <span slSwitch>Notifications</span>
</div>`,
    }),
  },
  {
    id: 'indicator',
    title: 'The mark inside the thumb',
    note: 'On draws a check and off draws nothing, so the state is readable without colour and without comparing the thumb’s position to a switch you cannot see.',
    snippet: defineSnippet({
      id: 'switch-angular-indicator',
      language: 'angular',
      label: 'A mark, or nothing at all',
      source: `<span slSwitch defaultChecked>Com marca</span>

<!-- Withdraw the mark only where something else carries the state. -->
<span slSwitch indicator="none" defaultChecked>Sem marca</span>`,
    }),
  },
  {
    id: 'placement',
    title: 'Which side the pill sits on',
    note: 'start is the settings row every product writes: the label takes the free width, the pill sits at the end, and a column of rows ends with every pill at the same distance from the edge.',
    snippet: defineSnippet({
      id: 'switch-angular-placement',
      language: 'angular',
      label: 'The label first, and the pill at the end',
      source: `<span slSwitch labelPlacement="start">Email alerts</span>
<span slSwitch labelPlacement="start">Weekly summary of overdue orders</span>`,
    }),
  },
  {
    id: 'description',
    title: 'Help text under the label',
    note: 'It is projected outside the label, so it describes the switch rather than naming it — and so a paragraph of help text does not change a setting when it is clicked.',
    snippet: defineSnippet({
      id: 'switch-angular-description',
      language: 'angular',
      label: 'A label, and the sentence under it',
      source: `<span slSwitch defaultChecked>
  Automatic billing
  <p slSwitchDescription>The invoice is charged on the 5th of each month.</p>
</span>`,
    }),
  },
  {
    id: 'states',
    title: 'The states the pill paints',
    note: 'Read-only goes hollow and keeps its colour, because the value is real and still submitted; disabled goes grey and its knob goes with it, so a locked setting still says which way it is set.',
    snippet: defineSnippet({
      id: 'switch-angular-states',
      language: 'angular',
      label: 'Every state unset by default, and native where the word means native',
      source: `<!-- Unstated rather than false, so the switch defers to its field. -->
<span slSwitch invalid>I accept the terms</span>
<span slSwitch defaultChecked readOnly>Production key</span>
<span slSwitch defaultChecked disabled>Included in the plan</span>

<!-- A switch inside a disabled fieldset is painted too, because the
     stylesheet matches :disabled beside the attribute. -->
<fieldset slFieldGroup disabled>
  <legend slFieldGroupLegend>Integration</legend>
  <span slSwitch defaultChecked>Sync orders</span>
</fieldset>`,
    }),
  },
  {
    id: 'loading',
    title: 'A setting that has not landed yet',
    note: 'The thumb draws an arc where its mark was, the pill keeps its size so the row does not move, and a second press is refused before the DOM can show a state the server does not have.',
    snippet: defineSnippet({
      id: 'switch-angular-loading',
      language: 'angular',
      label: 'The write, and the state that waits for it',
      source: `<span
  slSwitch
  [checked]="on()"
  [loading]="saving()"
  [messages]="{ loading: 'Saving the preference' }"
  (checkedChange)="save($event.value)"
>
  Automatic sync
</span>`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a field',
    note: 'The switch takes the description, the error and the four shared states without being asked, and it writes aria-required rather than the native attribute.',
    snippet: defineSnippet({
      id: 'switch-angular-field',
      language: 'angular',
      label: 'Nothing wires the control; the control wires itself',
      source: `<div slField invalid required>
  <label slFieldLabel>Billing preferences</label>
  <span slSwitch>Charge automatically</span>
  <p slFieldError>Choose a billing method.</p>
</div>`,
    }),
  },
  {
    id: 'settings',
    title: 'A row on a settings page',
    note: 'Where a switch actually lives: the label takes the free width, the pill sits at the end of the row, and the description sits under the label rather than under the pill.',
    snippet: defineSnippet({
      id: 'switch-angular-settings',
      language: 'angular',
      label: 'Three rows that line up',
      source: `<div slStack [gap]="7">
  <span slSwitch labelPlacement="start" defaultChecked>
    Email alerts
    <p slSwitchDescription>One notice for each overdue order.</p>
  </span>
  <span slSwitch labelPlacement="start">
    Staging environment
    <p slSwitchDescription>Orders created here are not billed.</p>
  </span>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'What a consumer can replace',
    note: 'The host element is the consumer’s own, an application sets the family’s defaults once, and a form reaches the value through the accessor rather than through an input.',
    snippet: defineSnippet({
      id: 'switch-angular-composition',
      language: 'ts',
      label: 'Defaults once, and the form the control belongs in',
      source: `bootstrapApplication(App, {
  providers: [provideSwitchDefaults({ size: 'sm', labelPlacement: 'start' })],
});

// A switch that must be on is the form's rule, not the control's.
new FormControl(false, Validators.requiredTrue);`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    note: 'Tab reaches the control and Space toggles it, both from the platform. Enter is deliberately not bound: inside a form it submits, and a switch that stole it would break the form.',
    snippet: defineSnippet({
      id: 'switch-angular-keyboard',
      language: 'angular',
      label: 'What the request says about how it was made',
      source: `<span slSwitch (checkedChange)="onRequest($event)">Receive the invoice</span>

<!-- $event.reason is "pointer", "keyboard" or "programmatic",
     and $event.cancel() refuses the move before it commits. -->`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'checkedChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the switch moves. $event.value is the new state and $event.previous the state it replaces. $event.reason is "pointer" for a press, "keyboard" for Space or "programmatic" for toggle(). $event.source is the originating event, and $event.cancel() refuses the move before anything commits. There is no [(checked)] two-way binding, because it could carry none of these fields.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'boolean',
    when: 'Whenever the switch moves inside a form. formControlName and ngModel sit on the host. Writing the form value moves the switch, disabling the form control disables the input natively, and blur marks the control touched. A form reset shows the form model’s reset value.',
  },
  {
    name: 'click, change, focus, blur',
    payload: 'the control’s own events',
    when: 'Whenever the control fires them. A consumer’s (click) on the host still runs, because the switch listens on the input it renders and not on the host.',
  },
];

export const ANGULAR_SWITCH_DOCS = {
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
        '[slSwitch]',
        'The state, owned by the consumer for the life of the component when it is bound. Unbound, the switch owns the state and a native form reset restores it.',
      ],
      [
        'defaultChecked',
        'boolean',
        'false',
        '[slSwitch]',
        'The state an uncontrolled switch starts from, read once in ngOnInit.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        '[slSwitch], provideSwitchDefaults',
        'The control step. A field around the switch decides it first, then provideSwitchDefaults. The pill, the thumb, the check and the label read the control scales, which the theme restates per density.',
      ],
      [
        'indicator',
        "'mark' | 'none'",
        'mark',
        '[slSwitch], provideSwitchDefaults',
        'What the thumb carries. mark draws a check when the switch is on and nothing when it is off. none draws nothing, and is correct only where text beside the switch states the value.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        '[slSwitch], provideSwitchDefaults',
        'Which side of the label the pill sits on. start is the settings row: the label takes the free width and the pill sits at the end of the row.',
      ],
      [
        'loading',
        'boolean',
        'false',
        '[slSwitch]',
        'The value is not settled yet. The switch refuses every press, keeps its size, sets aria-busy, and announces the pending label politely once the wait passes two seconds.',
      ],
      [
        'messages',
        'Partial<SwitchMessages>',
        '—',
        '[slSwitch]',
        'Words that replace the active language’s, key by key: loading is what a screen reader hears while the switch is pending. The words reach a live region, not the control’s name, so the name never changes with the state.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        '[slSwitch]',
        'Unset rather than false, so the switch follows the field around it. A stated value wins. It is the native attribute, as is a disabled form control, which takes the switch out of the tab order and out of form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        '[slSwitch]',
        'Unset rather than false. The native readonly attribute does nothing on a checkbox, so the switch sets aria-readonly and refuses every press. It stays focusable, announced and submitted.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        '[slSwitch]',
        'Unset rather than false, so the switch follows the field around it. Writes aria-invalid on the control and data-invalid on the host, which draws the edge and the focus ring in the danger tone.',
      ],
      [
        'required',
        'boolean',
        '—',
        '[slSwitch]',
        'The element’s own attribute, written on the host and passed through unchanged. A required field sets aria-required instead, and a switch that must be on takes Validators.requiredTrue in the form.',
      ],
      [
        'name / value',
        'string',
        '— / on',
        '[slSwitch]',
        'What the switch submits when it is on. Nothing is submitted when it is off, as for a checkbox.',
      ],
    ]),
    composition: apiRows([
      [
        'the host element',
        'any element',
        '—',
        '[slSwitch]',
        'The box is the consumer’s own element, such as a span, a label or a list item, and the switch renders the control, the pill and the label into it. formControlName, id and every aria-* attribute written on the host reach the control.',
      ],
      [
        'ng-content',
        'projected content',
        '—',
        '[slSwitch]',
        'The projected content is the label. slSwitchDescription is a directive on the consumer’s own element, so it can be a p, a span or an inline message.',
      ],
      [
        'exportAs',
        "'slSwitch'",
        '—',
        'a template',
        'Reaches the instance: inputElement for focus(), and toggle(), which clicks the control and emits checkedChange with the reason "programmatic".',
      ],
      [
        'provideSwitchDefaults()',
        '{ size, indicator, labelPlacement }',
        '—',
        'an injector',
        'Sets size, indicator and labelPlacement once for every switch under an injector. A field outranks the provided size, so a switch inside a field takes the field’s step.',
      ],
      [
        'SlField',
        'injected, optional',
        '—',
        'inside a field',
        'What the switch reads from a field around it: the identifier, the description, and the disabled, read-only, invalid and required states. The switch needs no wiring inside a field.',
      ],
    ]),
    accessibility: [
      'The pattern is the Switch of the WAI-ARIA Authoring Practices, built as the third of its reference implementations: an input[type=checkbox] with role="switch". The platform supplies the rest: Space toggles it, the label names it and toggles it, name and value are submitted, form.reset() restores it, and a disabled fieldset disables it.',
      'The switch writes no aria-checked. The Authoring Practices state that a switch built on a checkbox uses the HTML checked state instead, and writing both would state the value twice in two places that can disagree.',
      'Enter does not toggle the switch. The Authoring Practices list Enter as optional, and inside a form Enter submits the form, which a switch bound to Enter would prevent. A reader who expects Enter presses Space.',
      'The host carries no role, because ARIA makes the children of a switch presentational: the label and the description would otherwise join the control’s accessible name. The name of a switch does not change with its state, so the pending label is a live region and not part of the name.',
      'A required field sets aria-required, never the native required, which would turn on browser constraint validation and change how the form submits. disabled is the native attribute. Read-only is aria-readonly plus a refused press, because the native readonly attribute does nothing on a checkbox.',
      'The target is at least 24 CSS pixels in both axes at every size and every density, as WCAG 2.2 success criterion 2.5.8 requires. The label supplies the height when there is one, and a switch without a label sets the minimum on its own row.',
      'The description is projected outside the label, so it describes the switch and does not name it, and a press on it changes nothing.',
    ],
    snippets: [
      defineSnippet({
        id: 'switch-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<span data-ui="switch" data-part="root" data-size="md" data-indicator="mark" data-checked>
  <input data-part="control" type="checkbox" role="switch" id="slotted-switch-1" checked />
  <span data-part="track"
    ><span data-part="thumb"
      ><span data-ui="icon" data-part="root" aria-hidden="true"
        ><svg data-part="glyph" data-glyph="check" aria-hidden="true"></svg></span></span
  ></span>
  <label data-part="label" for="slotted-switch-1">Automatic billing</label>
  <p data-part="description" id="slotted-switch-2-description">Charged on the 5th.</p>
</span>`,
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
