import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import checkboxGroupTokens from '@slotted/styles/checkbox-group/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_CHECKBOX_GROUP_TOKENS = checkboxGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Checkbox Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideCheckboxGroupDefaults,\n  SlCheckboxGroup,\n} from '@slotted/angular/checkbox-group';",
  selector: '[slCheckboxGroup]',
  exportAs: 'slCheckboxGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slCheckboxGroup',
    required: true,
    purpose:
      'The only part. It arranges the boxes, holds the selection, and carries data-ui="checkbox-group", data-size, data-variant and data-orientation, and data-disabled, data-invalid and data-readonly. Its role is group; inside a field group the role is withdrawn, because the fieldset and its legend already name the set. Inside a field, aria-labelledby points at the field’s label. The value accessor and the validator are on this element, so formControlName goes here too.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every axis on it, driven by the controls below the canvas. Tick two options and watch the array in the actions panel: the order is the set’s, never the click order.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-playground',
      language: 'angular',
      label: 'A set of choices and the array behind it',
      source: `<div slCheckboxGroup name="days" [allValues]="days" [defaultValue]="['mon']">
  <div slCheckbox value="mon">Segunda</div>
  <div slCheckbox value="wed">Quarta</div>
  <div slCheckbox value="fri">Sexta</div>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'How the choices flow',
    note: 'A horizontal set wraps rather than scrolling or clipping, because a row whose last option nobody can see is worse than two rows — and the distance between two choices is twice the distance between a box and its own label.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-orientation',
      language: 'angular',
      label: 'Stacked, and in a row that wraps',
      source: `<div slCheckboxGroup orientation="vertical">
  <div slCheckbox value="mon">Segunda</div>
</div>

<div slCheckboxGroup orientation="horizontal">
  <div slCheckbox value="mon">Monday</div>
  <div slCheckbox value="tue">Tuesday</div>
</div>`,
    }),
  },
  {
    id: 'tile',
    title: 'A set of framed choices',
    note: 'The variant belongs to the group, not to each box: a set with one plain choice among four tiles is a set nobody meant to write. Arrangement is not the group’s — Grid already owns columns, minItemWidth and a stretching alignment, so tiles in a row come out the same width and the same height.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-tile',
      language: 'angular',
      label: 'The group frames, Grid arranges',
      source: `<div slCheckboxGroup variant="tile" [defaultValue]="['pix']">
  <div slGrid minItemWidth="sm">
    <div slCheckbox value="pix">
      Zelle
      <p slCheckboxDescription>Instant settlement.</p>
    </div>
    <div slCheckbox value="card">
      Credit card
      <p slCheckboxDescription>Installments up to twelve times.</p>
    </div>
  </div>
</div>`,
    }),
  },
  {
    id: 'parent',
    title: 'One box that commands the set',
    note: 'The parent is derived and never entered: ticked when every value is selected, mixed between the two, and its request replaces the whole selection rather than toggling a value of its own.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-parent',
      language: 'angular',
      label: 'allValues is what makes a parent possible',
      source: `<div slCheckboxGroup [allValues]="days" [defaultValue]="['mon']">
  <div slCheckbox parent>Every day</div>
  <div slCheckbox value="mon">Monday</div>
  <div slCheckbox value="tue">Tuesday</div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'What the group says to every box in it',
    note: 'Each of the four is unstated rather than false, so a group defers to the field around it and a box defers to the group; stated anywhere, it wins from there down and every box paints it.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-states',
      language: 'angular',
      label: 'Four states, decided once for the set',
      source: `<div slCheckboxGroup invalid required>
  <div slCheckbox value="a">Choose at least one</div>
</div>

<div slCheckboxGroup readOnly [defaultValue]="['a']">
  <div slCheckbox value="a">Contratado</div>
</div>

<div slCheckboxGroup disabled>
  <div slCheckbox value="a">Unavailable</div>
</div>`,
    }),
  },
  {
    id: 'count',
    title: 'How many of them are chosen',
    note: 'The number reaches the field’s label row through the channel a text field opened for characters, so a reader finds "2/5" where they already look for a count rather than in a sentence under the set.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-count',
      language: 'angular',
      label: 'A count in the spare column of the label row',
      source: `<div slField>
  <label slFieldLabel>Dias de coleta</label>
  <div slCheckboxGroup showCount [allValues]="days">
    <div slCheckbox value="mon">Segunda</div>
    <div slCheckbox value="wed">Quarta</div>
  </div>
</div>`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a group of fields, and in a reactive form',
    note: 'The fieldset and its legend are what group and name the set, so this group withdraws its own role — and the same element takes formControlName, because the accessor and the validator both live on the root.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-field',
      language: 'angular',
      label: 'The legend names the set; the form owns the value',
      source: `<fieldset slFieldGroup required>
  <legend slFieldGroupLegend>Notifications</legend>
  <div slCheckboxGroup required formControlName="alerts">
    <div slCheckbox value="approved">Order approved</div>
    <div slCheckbox value="refused">Order refused</div>
  </div>
</fieldset>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A set of long options keeps every box on the first line of its own label, a narrow column turns a horizontal set into a stack without a media query, and a right-to-left set mirrors whole rather than rearranging.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-content',
      language: 'angular',
      label: 'Long options, and a narrow column',
      source: `<div slCheckboxGroup orientation="horizontal">
  <div slCheckbox value="a">
    I authorize the use of browsing data to personalize recommendations
  </div>
  <div slCheckbox value="b">And also to measure campaign reach</div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The token carries the three decisions an application takes once, exportAs reaches the instance, and the root is the consumer’s own element — so a set of choices can be a real list.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-composition',
      language: 'angular',
      label: 'A set of choices that is a real list',
      source: `<ul slCheckboxGroup class="slotted-demo-list" [defaultValue]="['a']">
  <li slCheckbox value="a">One item</li>
  <li slCheckbox value="b">And another below it</li>
</ul>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and who implements it',
    note: 'Every box is its own tab stop and Space toggles it, because a checkbox is one choice made on its own — which is exactly what tells this family apart from a radio group, where the whole set is one stop.',
    snippet: defineSnippet({
      id: 'checkbox-group-angular-keyboard',
      language: 'angular',
      label: 'One tab stop per box, and no key bound by the family',
      source: `<!-- The group binds no key at all: each box is a native checkbox, so Tab
     reaches every one of them and Space toggles the one that has focus. -->
<div slCheckboxGroup>
  <div slCheckbox value="a">Tab to here</div>
  <div slCheckbox value="b">And again to here</div>
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'Before the selection moves. $event.value is the new array and $event.previous the array it replaces. $event.reason is pointer or keyboard, recovered from the box’s click; $event.source is the originating event; $event.cancel() refuses the move before anything commits. There is no [(value)], because a two-way binding carries only the value and none of the rest.',
  },
  {
    name: 'ControlValueAccessor and Validator',
    payload: 'readonly string[]',
    when: 'Whenever the selection moves under a formControl, formControlName or ngModel bound on the root. The checkbox group also validates the selection: when required, an empty selection fails with { required: true }, a rule about the whole set that no single box can check.',
  },
];

export const ANGULAR_CHECKBOX_GROUP_DOCS = {
  checkboxGroup: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'readonly string[]',
        '—',
        'SlCheckboxGroup',
        'The controlled selection. When present, the consumer owns the selection. When absent, the checkbox group owns it and starts from defaultValue, or from the form control bound to the root.',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '[]',
        'SlCheckboxGroup',
        'The selection an uncontrolled group starts from, read once when the directive initializes.',
      ],
      [
        'allValues',
        'readonly string[]',
        '—',
        'SlCheckboxGroup',
        'Every value the checkbox group holds. A parent slCheckbox needs it: the parent is checked when every value is selected and mixed when some are, which a selection alone cannot tell. It also keeps the selection in the order of this list rather than in the order the boxes were pressed.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'SlCheckboxGroup, provideCheckboxGroupDefaults',
        'How every choice is drawn, passed to every box. tile frames each choice and makes its whole surface the target. Arranging the tiles is left to slGrid.',
      ],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'SlCheckboxGroup, provideCheckboxGroupDefaults',
        'How the choices flow. A horizontal set wraps instead of scrolling.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SlCheckboxGroup, provideCheckboxGroupDefaults',
        'The type step, passed to every box. A field or field group around the checkbox group decides it first, then the provider.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'SlCheckboxGroup, provideCheckboxGroupDefaults',
        'Which side of its label each box is on, set once for the set so the boxes line up.',
      ],
      [
        'name',
        'string',
        '—',
        'SlCheckboxGroup',
        'The submission name every box shares when it sets none of its own. No name is generated: the platform does not group checkboxes by name the way it groups radios.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'SlCheckboxGroup',
        'Unset rather than false. Reaches every box as the native attribute. A disabled form control sets it too, through setDisabledState.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'SlCheckboxGroup',
        'Unset rather than false. Every box keeps its tab stop, its focus ring and its contrast, writes aria-readonly, and refuses every change.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'SlCheckboxGroup',
        'Unset rather than false. Writes aria-invalid on the group and on every box, and data-invalid on the group’s root and on every box’s root.',
      ],
      [
        'required',
        'boolean',
        'from the field, or false',
        'SlCheckboxGroup',
        'Unset rather than false. Writes aria-required on the group, and makes the group’s validator fail while the selection is empty. It is never the native required, which on a checkbox would demand that one particular box be checked.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'SlCheckboxGroup',
        'Inside a field, draws how many of allValues are selected at the end of the field’s label row, as 2/4, and adds that count to the group’s accessible description.',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs="slCheckboxGroup"',
        'SlCheckboxGroup',
        '—',
        'a template',
        'Reaches the instance, with the resolved axes and the selection for a template to read.',
      ],
      [
        'ControlValueAccessor and Validator',
        'formControl, formControlName, ngModel',
        '—',
        'the host element',
        'Both are on the root, so a form binding goes on the element that carries slCheckboxGroup. required becomes a validator over the whole selection.',
      ],
      [
        'provideCheckboxGroupDefaults()',
        '{ size, variant, orientation, labelPlacement }',
        '—',
        'an injector',
        'The four decisions an application takes once for every checkbox group under it. A field or field group around a checkbox group decides size before the provider.',
      ],
      [
        'the host element',
        'any element',
        '—',
        'SlCheckboxGroup',
        'The host element is the root, so a set of choices can be a ul with each box written as an li.',
      ],
      [
        'role',
        'string',
        'group, or none inside a field group',
        'the host element',
        'A role written as a static attribute on the host wins. Otherwise the role is group, withdrawn inside a field group, because a fieldset with a legend is already a named group and a second group named by the same legend announces the set twice.',
      ],
      [
        'aria-label / aria-labelledby',
        'string',
        'the field’s label, inside a field',
        'the host element',
        'Names the group. Inside a field, aria-labelledby points at the field’s label unless either attribute is written as a static attribute on the host. Outside a field and a field group, write one of them, because a group needs a name.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices have no pattern for a group of checkboxes: the Checkbox pattern covers one box, and grouping is a question of naming rather than of keyboard behavior. The sources are the ARIA group role and the Providing Accessible Names and Descriptions practice (w3.org/WAI/ARIA/apg/practices/names-and-descriptions/).',
      'Every box is its own tab stop, and Space toggles the box that has focus. The platform provides this whole keyboard model. It is what sets a checkbox group apart from a radio group, where the set is a single tab stop and the arrow keys move the choice.',
      'The role depends on the container. A field group is a fieldset with a legend, which is already a named group; a role="group" inside it, named by the same legend, would announce the set twice. Inside a field group the checkbox group renders no role, and the legend names the set. Inside a field, the field’s label names the group through aria-labelledby.',
      'The group writes aria-required, never the native required on a box. The native attribute on a checkbox demands that one particular box be checked, which is not what "choose at least one" means. That rule is about the whole selection, so the checkbox group, not the box, is the validator.',
      'A checkbox has no native read-only state, so the checkbox group enforces one: every box refuses the activation, aria-readonly announces it, and every tab stop and focus ring stays.',
      'The parent box is derived from the set rather than kept as a state of its own, so it always agrees with the boxes it controls. It reports aria-checked="mixed" through the platform’s indeterminate property, and pressing it replaces the selection instead of adding a value of its own.',
    ],
    snippets: [
      defineSnippet({
        id: 'checkbox-group-angular-defaults',
        language: 'ts',
        label: 'The three decisions an application takes once',
        source: `import { provideCheckboxGroupDefaults } from '@slotted/angular/checkbox-group';

bootstrapApplication(App, {
  providers: [provideCheckboxGroupDefaults({ orientation: 'horizontal', size: 'sm' })],
});`,
      }),
      defineSnippet({
        id: 'checkbox-group-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="checkbox-group"
  data-part="root"
  data-size="md"
  data-orientation="vertical"
  role="group"
>
  <div data-ui="checkbox" data-part="root" data-checked>…</div>
</div>`,
      }),
      defineSnippet({
        id: 'checkbox-group-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='checkbox-group'] {
  --slotted-checkbox-group-gap: var(--slotted-space-5);
}`,
      }),
    ],
  },
} as const;
