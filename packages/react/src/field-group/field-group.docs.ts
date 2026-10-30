import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import fieldGroupTokens from '@slotted/styles/field-group/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_FIELD_GROUP_TOKENS = fieldGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Field Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  FieldGroup,\n  FieldGroupContent,\n  FieldGroupDescription,\n  FieldGroupError,\n  FieldGroupLegend,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'fieldset, or the element render returns',
    required: true,
    purpose:
      'The group. A native fieldset, so the group role arrives from the platform and disabled disables every control inside it with nothing passed down. Carries data-ui="field-group", the axes, and the four state attributes.',
  },
  {
    part: 'legend',
    element: 'legend',
    required: false,
    purpose:
      'The name of the set, and the platform’s own naming element — the technique the APG’s naming practice calls for under its Rule 3. It holds whatever the page puts in it, including the page’s own heading.',
  },
  {
    part: 'mark',
    element: 'span, inside the legend',
    required: false,
    purpose:
      'The necessity marker the legend draws itself, in the same three forms a field label draws: an asterisk, the words, or nothing.',
  },
  {
    part: 'content',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The box that lays the fields out, and the element orientation arranges. It exists because a legend inside a grid or flex container is laid out by rules of its own in every engine, so the fieldset stays a block.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A group with its legend, its help and two fields, driven by the controls below the canvas. Switch orientation to horizontal and narrow the window to see the row wrap rather than squeeze.',
    snippet: defineSnippet({
      id: 'field-group-react-playground',
      language: 'tsx',
      label: 'A named set of fields',
      source:
        '<FieldGroup>\n  <FieldGroupLegend>Billing address</FieldGroupLegend>\n  <FieldGroupDescription>We need it to issue the invoice.</FieldGroupDescription>\n  <FieldGroupContent>\n    <Field>\n      <FieldLabel>Street</FieldLabel>\n      <FieldControl />\n    </Field>\n  </FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'orientation',
    title: 'A column of fields, or a row',
    note: 'A row wraps rather than squeezing: each field keeps enough width to hold a date or a document number, and drops to the next line instead of clipping what is being typed into it.',
    snippet: defineSnippet({
      id: 'field-group-react-orientation',
      language: 'tsx',
      label: 'Two dates that belong on one line',
      source:
        '<FieldGroup orientation="horizontal">\n  <FieldGroupLegend>Contract term</FieldGroupLegend>\n  <FieldGroupContent>\n    <Field>…</Field>\n    <Field>…</Field>\n  </FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'states',
    title: 'Disabled by the platform, invalid by the group',
    note: 'Nothing is passed down for disabled: the browser disables every control inside a disabled fieldset. What the family adds is the muting of the words — a legend is not a control, and a section that turned off while keeping its name at full strength reads as available.',
    snippet: defineSnippet({
      id: 'field-group-react-states',
      language: 'tsx',
      label: 'One attribute for a whole section',
      source:
        '// The native attribute. Every control inside is disabled by the browser.\n<FieldGroup disabled>\n  <FieldGroupLegend>Automatic payout</FieldGroupLegend>\n  <FieldGroupContent>…</FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'messages',
    title: 'What is said about the set, before the set',
    note: 'The description and the error come between the legend and the fields — where GOV.UK’s fieldset example puts them, and the opposite of where a single field puts its own. Both ids go on the fieldset, so a reader entering any control hears them once.',
    snippet: defineSnippet({
      id: 'field-group-react-messages',
      language: 'tsx',
      label: 'An error about the set rather than about a control',
      source:
        '<FieldGroup invalid required>\n  <FieldGroupLegend>Nationality</FieldGroupLegend>\n  <FieldGroupDescription>Select all that apply.</FieldGroupDescription>\n  <FieldGroupError>Choose at least one nationality.</FieldGroupError>\n  <FieldGroupContent>…</FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'provision',
    title: 'One attribute instead of one per field',
    note: 'The group answers for every field inside it — the step, the placement, the necessity style, both words, disabled and read-only. A field that states its own still wins, which is the same rule a control follows against its field.',
    snippet: defineSnippet({
      id: 'field-group-react-provision',
      language: 'tsx',
      label: 'A compact section, and the one field that is not',
      source:
        '<FieldGroup labelPlacement="side" size="sm">\n  <FieldGroupContent>\n    <Field>…</Field>\n    <Field size="lg">…</Field>\n  </FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'content',
    title: 'A legend that is also the page heading',
    note: 'GOV.UK recommends it on a page asking one question, so a reader hears the question once rather than twice. The heading keeps its own type and loses only the block break that would drop the necessity words onto a line of their own.',
    snippet: defineSnippet({
      id: 'field-group-react-content',
      language: 'tsx',
      label: 'The page’s h1, inside the legend',
      source:
        '<FieldGroup required necessity="words">\n  <FieldGroupLegend>\n    <h1>What is your nationality?</h1>\n  </FieldGroupLegend>\n  <FieldGroupContent>…</FieldGroupContent>\n</FieldGroup>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'A group inside a group inherits what the outer one decided and restates the rest; render substitutes any part’s element, and the group holds anything — checkboxes written directly, not one field each.',
    snippet: defineSnippet({
      id: 'field-group-react-composition',
      language: 'tsx',
      label: 'A section inside a section, and a list for its content',
      source:
        '<FieldGroup size="sm">\n  <FieldGroup necessity="none">\n    <FieldGroupContent render={(props) => <ul {...props} />}>…</FieldGroupContent>\n  </FieldGroup>\n</FieldGroup>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears on entering the set',
    note: 'Tab into any control: the group’s name and its description are read before the control’s own, because both live on the fieldset rather than on each control. No ARIA is written for either.',
    snippet: defineSnippet({
      id: 'field-group-react-accessibility',
      language: 'tsx',
      label: 'The platform’s role, the platform’s name',
      source:
        '<fieldset data-ui="field-group" data-part="root" aria-describedby="nat-description nat-error">\n  <legend data-part="legend">Nacionalidade</legend>\n</fieldset>;',
    }),
  },
];

export const REACT_FIELD_GROUP_DOCS = {
  fieldGroup: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'FieldGroup',
        'The type step of the legend, and the step provided to every field inside. The legend reads the control type scale one step above the labels under it, so a group in a dense table shrinks with them',
      ],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'FieldGroup',
        'How the fields inside flow. A row wraps rather than squeezing, so a field keeps enough width to hold what is being typed into it',
      ],
      [
        'necessity',
        "'mark' | 'optional' | 'words' | 'none'",
        'mark',
        'FieldGroup',
        'How the set’s necessity is said on its legend — an asterisk, (optional) on an optional set only, both words, or nothing — and the style provided to every field inside',
      ],
      [
        'kind',
        "'question' | 'section'",
        'question',
        'FieldGroup',
        "A section names a topic rather than asking something, so its legend draws no necessity, its fields keep the style the application set, and its first field stands --slotted-field-group-section-content-gap (1.25rem) below the legend; a question's choices stand --slotted-field-group-content-gap (the field row gap) below it",
      ],
      [
        'messages',
        'Partial<FieldMessages>',
        '—',
        'FieldGroup',
        'Words laid over the language in force for the legend’s necessity word (optional, required); a field inside states its own',
      ],
      [
        'labelPlacement',
        "'top' | 'side'",
        'from the field provider',
        'FieldGroup',
        'Provided to every field inside. The group has no label of its own, so this is the one axis it carries only to pass on',
      ],
      [
        'required',
        'boolean',
        '—',
        'FieldGroup',
        'Draws the necessity marker on the legend. It is deliberately not provided to the fields: required is a fact about one value, and a section cannot know it',
      ],
      [
        'invalid',
        'boolean',
        '—',
        'FieldGroup',
        'Unstated rather than false. Writes data-invalid on the fieldset, for the case a single field cannot state — “choose at least one” is a fact about the set',
      ],
      [
        'disabled',
        'boolean',
        '—',
        'FieldGroup',
        'The native attribute on the fieldset, which disables every control inside with nothing passed down, and is also provided to the fields so their labels are muted',
      ],
      [
        'readOnly',
        'boolean',
        '—',
        'FieldGroup',
        'Provided to every field inside. There is no native readonly on a fieldset, so this one is passed on rather than applied',
      ],
      [
        'id',
        'string',
        'generated',
        'FieldGroup',
        'The base for <id>-legend, <id>-description and <id>-error. Generated with useId when unstated',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'secondary on FieldGroupDescription, danger on FieldGroupError',
        'FieldGroupDescription, FieldGroupError',
        'Both messages are inline-message roots and take its five tones, so a warning about a whole section is the same part in another tone',
      ],
      [
        'mark',
        "'glyph' | 'dot' | 'none'",
        'none',
        'FieldGroupDescription, FieldGroupError',
        'Which mark the message draws. A group’s messages draw none, the same as the fields inside it: the tone is said by the ink and the weight of the sentence. glyph asks for the tone’s own silhouette and dot for one neutral bullet',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'FieldGroupDescription, FieldGroupError',
        'Whether the message announces itself when it arrives. off by default, because a message already on the page when it loads is announced by nothing',
      ],
      [
        'reserve',
        'boolean',
        'false',
        'FieldGroupDescription, FieldGroupError',
        'Holds one line box open whether or not there is a message, so the fields below do not move when the error arrives',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'FieldGroup, FieldGroupLegend, FieldGroupContent',
        'Substitutes the rendered element and hands it every attribute. A ul for the content, a div for the group when a fieldset is not wanted. The props are typed against HTMLAttributes<HTMLElement> so they can be spread onto any element, and a substituted element takes the consumer’s own ref',
      ],
      [
        'FieldGroupContent',
        'ReactNode',
        '—',
        'FieldGroup',
        'The box that lays the fields out. It is a part rather than an implicit wrapper because a legend inside a grid or flex container is laid out by rules of its own in every engine',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'FieldGroupContent',
        'Anything the set holds: fields, or checkboxes written directly. A checkbox has its own label beside its box, so wrapping each one in a field would give it two',
      ],
      [
        'useFieldGroup()',
        '() => FieldGroupContextValue | undefined',
        '—',
        'any component inside a FieldGroup',
        'The three identifiers, the step and the necessity style, for a part of your own. undefined outside a group',
      ],
    ]),
    accessibility: [
      'The role and the name both come from the platform. A native fieldset carries the group role and a native legend names it, which is the technique the APG’s Providing Accessible Names and Descriptions practice calls for under its Rule 3, prefer native techniques — so the family writes no role and no aria-label.',
      'aria-describedby goes on the fieldset rather than on each control. GOV.UK’s error-message-with-legend example is the same arrangement: a reader entering any control in the group hears the group’s hint and its error once, from the element that names them both.',
      'disabled is the native attribute, and the platform propagates it. Every control inside a disabled fieldset is removed from the tab order and from submission by the browser, with nothing passed down. What the family adds is the muting of the legend and of the fields’ labels, because a label is not a control and nothing in the attribute reaches it.',
      'The legend holds a heading when the page has one. On a page asking a single question GOV.UK recommends the legend contain the page’s h1, so a reader hears the question once rather than twice; the family removes the heading’s block break and its margins and leaves its type alone, because a page heading is a page’s decision rather than a control’s.',
      'required marks the legend and stops there. It is a fact about one value, and a section cannot know which of its fields carry it — so the group draws the marker on its own name and provides nothing to the fields.',
      'A checkbox or a radio belongs directly in the content. Each already has its own label beside its box, and wrapping it in a field would give it two names — which is why the demonstrations here write them directly and the group is the thing that names the set.',
    ],
    snippets: [
      defineSnippet({
        id: 'field-group-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<fieldset\n  data-ui="field-group"\n  data-part="root"\n  data-size="md"\n  data-orientation="vertical"\n  data-necessity="mark"\n  data-required\n  aria-describedby="nat-description"\n  disabled\n>\n  <legend data-part="legend">\n    Nacionalidade\n    <span aria-hidden="true" data-part="mark">\n      *\n    </span>\n  </legend>\n  <p data-ui="inline-message" data-part="root" data-tone="secondary" id="nat-description">\n    <span data-part="text">Marque todas as que se aplicam.</span>\n  </p>\n  <div data-part="content">…</div>\n</fieldset>;',
      }),
      defineSnippet({
        id: 'field-group-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='field-group'] {\n  --slotted-field-group-message-gap: var(--slotted-space-1);\n  --slotted-field-group-content-gap: var(--slotted-space-8);\n  --slotted-field-group-field-gap: var(--slotted-space-5);\n  --slotted-field-group-track-min: 18rem;\n}",
      }),
    ],
  },
} as const;
