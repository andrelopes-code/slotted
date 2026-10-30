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

export const REACT_CHECKBOX_GROUP_TOKENS = checkboxGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Checkbox Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Checkbox, CheckboxGroup, CheckboxGroupDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The only part. It arranges the boxes, holds the selection, and carries data-ui="checkbox-group", data-size, data-variant and data-orientation, and data-disabled, data-invalid and data-readonly. Its role is group; inside a field group the role is withdrawn, because the fieldset and its legend already name the set. Inside a field, aria-labelledby points at the field’s label. The boxes inside are Checkbox components with their own stylesheet, which the checkbox group’s stylesheet never selects into.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every axis on it, driven by the controls below the canvas. Tick two options and watch the array in the actions panel: the order is the set’s, never the click order.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-playground',
      language: 'tsx',
      label: 'A set of choices and the array behind it',
      source: `<CheckboxGroup allValues={['mon', 'wed', 'fri']} defaultValue={['mon']} name="days">
  <Checkbox value="mon">Segunda</Checkbox>
  <Checkbox value="wed">Quarta</Checkbox>
  <Checkbox value="fri">Sexta</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'How the choices flow',
    note: 'A horizontal set wraps rather than scrolling or clipping, because a row whose last option nobody can see is worse than two rows — and the distance between two choices is twice the distance between a box and its own label.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-orientation',
      language: 'tsx',
      label: 'Stacked, and in a row that wraps',
      source: `<CheckboxGroup orientation="vertical">
  <Checkbox value="mon">Segunda</Checkbox>
</CheckboxGroup>;

<CheckboxGroup orientation="horizontal">
  <Checkbox value="mon">Monday</Checkbox>
  <Checkbox value="tue">Tuesday</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'tile',
    title: 'A set of framed choices',
    note: 'The variant belongs to the group, not to each box: a set with one plain choice among four tiles is a set nobody meant to write. Arrangement is not the group’s — Grid already owns columns, minItemWidth and a stretching alignment, so tiles in a row come out the same width and the same height.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-tile',
      language: 'tsx',
      label: 'The group frames, Grid arranges',
      source: `<CheckboxGroup defaultValue={['pix']} variant="tile">
  <Grid minItemWidth="sm">
    <Checkbox description="Instant settlement." value="pix">
      Zelle
    </Checkbox>
    <Checkbox description="Installments up to twelve times." value="card">
      Credit card
    </Checkbox>
  </Grid>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'parent',
    title: 'One box that commands the set',
    note: 'The parent is derived and never entered: ticked when every value is selected, mixed between the two, and its request replaces the whole selection rather than toggling a value of its own.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-parent',
      language: 'tsx',
      label: 'allValues is what makes a parent possible',
      source: `<CheckboxGroup allValues={['mon', 'tue', 'wed']} defaultValue={['mon']}>
  <Checkbox parent>All days</Checkbox>
  <Checkbox value="mon">Monday</Checkbox>
  <Checkbox value="tue">Tuesday</Checkbox>
  <Checkbox value="wed">Wednesday</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'states',
    title: 'What the group says to every box in it',
    note: 'Each of the four is unstated rather than false, so a group defers to the field around it and a box defers to the group; stated anywhere, it wins from there down and every box paints it.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-states',
      language: 'tsx',
      label: 'Four states, decided once for the set',
      source: `<CheckboxGroup invalid required>
  <Checkbox value="a">Choose at least one</Checkbox>
</CheckboxGroup>;

// Read-only keeps every tab stop and refuses every change; disabled is
// the native attribute and removes the boxes from the form.
<CheckboxGroup readOnly defaultValue={['a']} />;
<CheckboxGroup disabled />;`,
    }),
  },
  {
    id: 'count',
    title: 'How many of them are chosen',
    note: 'The number reaches the field’s label row through the channel a text field opened for characters, so a reader finds "2/5" where they already look for a count rather than in a sentence under the set.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-count',
      language: 'tsx',
      label: 'A count in the spare column of the label row',
      source: `<Field>
  <FieldLabel>Dias de coleta</FieldLabel>
  <CheckboxGroup allValues={['mon', 'wed', 'fri']} showCount>
    <Checkbox value="mon">Segunda</Checkbox>
    <Checkbox value="wed">Quarta</Checkbox>
    <Checkbox value="fri">Sexta</Checkbox>
  </CheckboxGroup>
</Field>;`,
    }),
  },
  {
    id: 'field',
    title: 'Inside a group of fields',
    note: 'The fieldset and its legend are what group and name the set, so this group withdraws its own role rather than announcing the same set twice — and a disabled fieldset disables every box with nothing passed down.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-field',
      language: 'tsx',
      label: 'The legend names the set; the group holds it',
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
    note: 'A set of long options keeps every box on the first line of its own label, a narrow column turns a horizontal set into a stack without a media query, and a right-to-left set mirrors whole rather than rearranging.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-content',
      language: 'tsx',
      label: 'Long options, and a narrow column',
      source: `<CheckboxGroup orientation="horizontal">
  <Checkbox value="a">
    I authorize the use of browsing data to personalize the recommendations
  </Checkbox>
  <Checkbox value="b">And also to measure the reach of campaigns</Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the three decisions an application takes once, render substitutes the root so a set can be a real list, and useCheckboxGroup reads the same state a box reads.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-composition',
      language: 'tsx',
      label: 'A provider, a substituted root, and the hook a box reads',
      source: `<CheckboxGroupDefaultsProvider orientation="horizontal" size="sm">
  <CheckboxGroup>
    <Checkbox value="a">Inherits all three</Checkbox>
  </CheckboxGroup>
</CheckboxGroupDefaultsProvider>;

// The root becomes a real list, and each box a list item.
<CheckboxGroup render={(props) => <ul {...props} />}>
  <Checkbox render={(props) => <li {...props} />} value="a">
    Um item
  </Checkbox>
</CheckboxGroup>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and who implements it',
    note: 'Every box is its own tab stop and Space toggles it, because a checkbox is one choice made on its own — which is exactly what tells this family apart from a radio group, where the whole set is one stop.',
    snippet: defineSnippet({
      id: 'checkbox-group-react-keyboard',
      language: 'tsx',
      label: 'One tab stop per box, and no key bound by the family',
      source: `// The group binds no key at all: each box is a native checkbox, so Tab
// reaches every one of them and Space toggles the one that has focus.
<CheckboxGroup allValues={['a', 'b']}>
  <Checkbox value="a">Tab to here</Checkbox>
  <Checkbox value="b">And again to here</Checkbox>
</CheckboxGroup>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before the selection moves. request.value is the new array and request.previous the array it replaces. request.reason is pointer or keyboard, recovered from the box’s click; request.source is the originating event; request.cancel() refuses the move before anything commits, including the platform’s own toggle.',
  },
  {
    name: 'onCheckedChange, on each Checkbox',
    payload: '(checked: boolean, request: ChangeRequest<boolean>)',
    when: 'Before that one box moves, and before the checkbox group builds its own request. Cancelling it also stops the group’s request, so one option can refuse to be chosen without the rest of the set taking part.',
  },
];

export const REACT_CHECKBOX_GROUP_DOCS = {
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
        'CheckboxGroup',
        'The controlled selection. When present, the consumer owns the selection for the life of the component. When absent, the checkbox group owns it and starts from defaultValue.',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '[]',
        'CheckboxGroup',
        'The selection an uncontrolled group starts from, read once.',
      ],
      [
        'allValues',
        'readonly string[]',
        '—',
        'CheckboxGroup',
        'Every value the checkbox group holds. A parent Checkbox needs it: the parent is checked when every value is selected and mixed when some are, which a selection alone cannot tell. It also keeps the selection in the order of this list rather than in the order the boxes were pressed.',
      ],
      [
        'variant',
        "'plain' | 'tile'",
        'plain',
        'CheckboxGroup, CheckboxGroupDefaultsProvider',
        'How every choice is drawn, passed to every box. tile frames each choice and makes its whole surface the target. Arranging the tiles is left to Grid.',
      ],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'CheckboxGroup, CheckboxGroupDefaultsProvider',
        'How the choices flow. A horizontal set wraps instead of scrolling.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'CheckboxGroup, CheckboxGroupDefaultsProvider',
        'The type step, passed to every box. A field or field group around the checkbox group decides it first, then the provider.',
      ],
      [
        'labelPlacement',
        "'end' | 'start'",
        'end',
        'CheckboxGroup, CheckboxGroupDefaultsProvider',
        'Which side of its label each box is on, set once for the set so the boxes line up.',
      ],
      [
        'name',
        'string',
        '—',
        'CheckboxGroup',
        'The submission name every box shares when it sets none of its own. No name is generated: the platform does not group checkboxes by name the way it groups radios.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'CheckboxGroup',
        'Unset rather than false. Reaches every box as the native attribute, which takes the boxes out of the tab order and out of form submission.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'CheckboxGroup',
        'Unset rather than false. Every box keeps its tab stop, its focus ring and its contrast, writes aria-readonly, and refuses every change.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'CheckboxGroup',
        'Unset rather than false. Writes aria-invalid on the group and on every box, and data-invalid on the group’s root and on every box’s root.',
      ],
      [
        'required',
        'boolean',
        'from the field, or false',
        'CheckboxGroup',
        'Unset rather than false. Writes aria-required on the group, never the native required, which on a checkbox would demand that one particular box be checked.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'CheckboxGroup',
        'Inside a field, draws how many of allValues are selected at the end of the field’s label row, as 2/4, and adds that count to the group’s accessible description.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: CheckboxGroupRootProps) => ReactNode',
        '—',
        'CheckboxGroup',
        'Replaces the root and hands it every attribute. The props are typed as HTMLAttributes<HTMLElement>, so a set of choices can render as a ul with each box as an li.',
      ],
      [
        'useCheckboxGroup()',
        '() => CheckboxGroupContextValue | undefined',
        '—',
        'inside a CheckboxGroup',
        'Returns what a box reads: whether it is selected, its size, and how to request a change. It returns undefined outside a checkbox group, so one Checkbox serves both a single consent box and a member of a set.',
      ],
      [
        'CheckboxGroupDefaultsProvider',
        '{ size, variant, orientation, labelPlacement }',
        '—',
        'a subtree',
        'The four decisions an application takes once for every checkbox group under it. A field or field group around a checkbox group decides size before the provider.',
      ],
      [
        'className / style',
        'string / CSSProperties',
        '—',
        'CheckboxGroup',
        'Reach the root. Every other native prop reaches it too, because the root is the only element the checkbox group renders.',
      ],
      [
        'role',
        'string',
        'group, or none inside a field group',
        'CheckboxGroup',
        'A role the consumer writes wins. Otherwise the role is group, withdrawn inside a field group, because a fieldset with a legend is already a named group and a second group named by the same legend announces the set twice.',
      ],
      [
        'aria-label / aria-labelledby',
        'string',
        'the field’s label, inside a field',
        'CheckboxGroup',
        'Names the group. Inside a field, aria-labelledby points at the field’s label unless the consumer writes either attribute. Outside a field and a field group, write one of them, because a group needs a name.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices have no pattern for a group of checkboxes: the Checkbox pattern covers one box, and grouping is a question of naming rather than of keyboard behaviour. The sources are the ARIA group role and the Providing Accessible Names and Descriptions practice (w3.org/WAI/ARIA/apg/practices/names-and-descriptions/).',
      'Every box is its own tab stop, and Space toggles the box that has focus. The platform provides this whole keyboard model. It is what sets a checkbox group apart from a radio group, where the set is a single tab stop and the arrow keys move the choice.',
      'The role depends on the container. A field group is a fieldset with a legend, which is already a named group to assistive technology; a role="group" inside it, named by the same legend, would announce the set twice. Inside a field group the checkbox group renders no role, and the legend names the set. Inside a field, the field’s label names the group through aria-labelledby.',
      'The group writes aria-required, never the native required on a box. The native attribute on a checkbox demands that one particular box be checked, which is not what "choose at least one" means, and it turns on browser constraint validation.',
      'A checkbox has no native read-only state, so the checkbox group enforces one: every box refuses the change on the click that a pointer and Space share, aria-readonly announces it, and every tab stop and focus ring stays.',
      'The parent box is derived from the set rather than kept as a state of its own, so it always agrees with the boxes it controls. It reports aria-checked="mixed" through the platform’s indeterminate property, and pressing it replaces the selection instead of adding a value of its own.',
    ],
    snippets: [
      defineSnippet({
        id: 'checkbox-group-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="checkbox-group"
  data-part="root"
  data-size="md"
  data-orientation="vertical"
  role="group"
>
  <div data-ui="checkbox" data-part="root" data-checked>
    …
  </div>
</div>;`,
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
