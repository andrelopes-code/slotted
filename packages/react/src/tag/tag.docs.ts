import tagTokens from '@slotted/styles/tag/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TAG_TOKENS = tagTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tag decision',
}));

const TONE = "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'";
const VARIANT = "'solid' | 'soft' | 'outline' | 'dashed'";
const SIZE = "'sm' | 'md' | 'lg'";
const SHAPE = "'pill' | 'square'";

const appearance = (member: string): ApiTuple[] => [
  ['tone', TONE, 'secondary', member, 'Which of the five semantic colours the tag speaks in'],
  [
    'variant',
    VARIANT,
    'soft',
    member,
    'How that colour is painted: filled, tinted, an edge alone, or that edge in dashes. A selected tag fills whatever its variant',
  ],
  [
    'size',
    SIZE,
    'md',
    member,
    'Type, glyph and gap come from the control scale, so a tag shrinks with density beside the controls it sits with',
  ],
  ['shape', SHAPE, 'pill', member, 'A rounded chip, or a rectangle with the small corner radius'],
];

const content = (member: string): ApiTuple[] => [
  [
    'start',
    'ReactNode',
    '—',
    member,
    'A glyph or an avatar before the words, wrapped in the start part, which sizes and centres it',
  ],
  ['end', 'ReactNode', '—', member, 'A glyph after the words, wrapped in the end part'],
];

const removable = (member: string): ApiTuple[] => [
  [
    'onRemove',
    '(request: TagRemoveRequest) => void',
    '—',
    member,
    'Asks to be removed. The remove control is rendered only when this is present. request.reason is remove for the control and keyboard for Backspace or Delete; request.cancel() refuses it, and the group then leaves focus where it is',
  ],
  [
    'messages',
    'Partial<TagMessages>',
    '—',
    member,
    'Words laid over the language in force, key by key: remove is the word the remove control announces before the tag’s own label, so it reads “Remove Design”',
  ],
  [
    'removeDisabled',
    'boolean',
    'false',
    member,
    'Refuses the removal while the rest of the tag stays operable',
  ],
];

const disabled = (member: string): ApiTuple => [
  'disabled',
  'boolean',
  'false',
  member,
  'Refuses every interaction the tag offers, including its removal',
];

const ACCESSIBILITY_SHARED = [
  'There is no tag or chip pattern in the WAI-ARIA Authoring Practices — the pattern index at w3.org/WAI/ARIA/apg/patterns/ carries thirty-two entries and neither word occurs. The applicable official guidance is the Toolbar pattern for the group, the Button pattern for a chip that acts and for the remove control, the Link pattern for one that navigates, and aria-pressed in WAI-ARIA 1.2 for one that holds a selection.',
  'The chip box is never the interactive element. A button cannot contain a button and an anchor cannot contain either, so a chip that both acts and removes puts its two controls side by side: the body is the primary target and the remove control is its sibling.',
  'The remove control’s name is composed, not repeated: aria-labelledby joins a hidden word to the tag’s own label, so it announces “Remove Design” rather than “Remove”. Text referenced by aria-labelledby counts even when the element holding it is hidden.',
  'Backspace and Delete on any control inside a removable tag ask for the same removal the X does, and the request says which of the two it was. MUI, Primer, React Aria and Angular Material all ship the shortcut; Primer announces it in a visually hidden sentence beside the value.',
  'The focus ring is drawn on the control, never on the chip: a chip can hold two controls, and a ring around the whole box could not say which one has focus. It is inset, because a ring outside the body would cover the remove control beside it and a ring outside the remove would touch the next tag in a wrapped run.',
  'The remove control is as tall as the chip and as wide as its glyph plus a step of air on each side, floored at the WCAG 2.2 2.5.8 minimum of 24 CSS pixels, which carries it past that minimum in both axes at every size and every density. The chip’s own height is floored at that minimum for the same reason.',
  'A tag is one line. A value too long for its container is clipped with an ellipsis rather than reflowed, and the clipping is visual only: text-overflow shortens nothing, so the whole value stays in the DOM, stays in the accessibility tree, and a page search still finds it.',
  'The label is a bidi isolate whose direction comes from its own first strong character, so an Arabic value inside an English page reads right to left and is clipped at its own end.',
  'Under forced colours every tone ground becomes one system colour, so the family draws its edge in currentColor there, and a selected chip takes the system’s own Highlight pair — its whole signal is a ground the system has replaced.',
];

export const REACT_TAG_DOCS = {
  tag: {
    api: apiRows([
      ...appearance('Tag'),
      ...content('Tag'),
      disabled('Tag'),
      ...removable('Tag'),
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'TagGroup',
        'Which way the run reads. vertical also writes aria-orientation',
      ],
      [
        'loop',
        'boolean',
        'true',
        'TagGroup',
        'Whether the arrow keys wrap past the ends of the run',
      ],
      [
        'role',
        'string',
        'toolbar',
        'TagGroup',
        'toolbar makes the run one tab stop with arrow navigation inside it. Writing list turns that off and gives every chip role="listitem"',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every member',
        'Renders the member’s own element into another one — an li for a tag in a list, a router’s link component for a destination',
      ],
      [
        'rootProps',
        "ComponentProps<'span'>",
        '—',
        'TagButton, TagLink, TagToggle',
        'Reaches the chip box, which an interactive member’s own props do not land on',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every member',
        'Reaches the element the member is: the chip box for Tag, the control for the other three',
      ],
      [
        'TagDefaultsProvider',
        '{ tone, variant, size, shape }',
        '—',
        'a subtree',
        'Sets the defaults once for every tag under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'A static tag carries no role of its own. What a value means comes from where it sits, and a role invented here would be wrong more often than right.',
      'A group of static tags is written role="list", which announces its length and turns the arrow keys off — a list is a structure rather than a widget.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-react-static',
        language: 'tsx',
        label: 'A value beside the thing it belongs to',
        source: '<Tag tone="success">Delivered</Tag>;',
      }),
      defineSnippet({
        id: 'tag-react-removable',
        language: 'tsx',
        label: 'A run of values a person can take away',
        source:
          '<TagGroup aria-label="Labels">\n  {labels.map((label) => (\n    <Tag key={label} onRemove={() => setLabels(labels.filter((it) => it !== label))}>\n      {label}\n    </Tag>\n  ))}\n</TagGroup>;',
      }),
      defineSnippet({
        id: 'tag-react-confirm',
        language: 'tsx',
        label: 'A removal the application refuses until it is confirmed',
        source:
          '<Tag\n  onRemove={(request) => {\n    if (!confirmed) {\n      request.cancel();\n      askForConfirmation(request.reason);\n      return;\n    }\n    remove();\n  }}\n>\n  Production\n</Tag>;',
      }),
      defineSnippet({
        id: 'tag-react-list',
        language: 'tsx',
        label: 'A run of values that are not controls',
        source:
          '<TagGroup aria-label="Tecnologias" role="list">\n  <Tag>TypeScript</Tag>\n  <Tag>Angular</Tag>\n  <Tag>React</Tag>\n</TagGroup>;',
      }),
      defineSnippet({
        id: 'tag-react-defaults',
        language: 'tsx',
        label: 'One decision for every tag in the application',
        source: '<TagDefaultsProvider size="sm">\n  <App />\n</TagDefaultsProvider>;',
      }),
    ],
  },
  tagButton: {
    api: apiRows([
      ...appearance('TagButton'),
      ...content('TagButton'),
      disabled('TagButton'),
      ...removable('TagButton'),
      [
        'onClick',
        '(event) => void',
        '—',
        'TagButton',
        'The command. It lands on the button the chip’s body is, so type, form and every native button prop reach the element that owns them',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'The command is a real button, so Enter and Space both activate it and the platform supplies the rest.',
      'A disabled TagButton is natively disabled. Reach for aria-disabled through rootProps only when the chip has to stay in the tab sequence to explain itself.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-button-react-command',
        language: 'tsx',
        label: 'A chip that runs a command',
        source: '<TagButton onClick={() => openAssignee()}>Assign owner</TagButton>;',
      }),
      defineSnippet({
        id: 'tag-button-react-overflow',
        language: 'tsx',
        label: 'The remaining values, behind one more chip',
        source:
          '<TagGroup aria-label="Participantes">\n  {people.slice(0, 5).map((person) => (\n    <Tag key={person.id}>{person.name}</Tag>\n  ))}\n  {people.length > 5 ? (\n    <TagButton onClick={showAll} variant="outline">\n      +{people.length - 5}\n    </TagButton>\n  ) : null}\n</TagGroup>;',
      }),
    ],
  },
  tagLink: {
    api: apiRows([
      ...appearance('TagLink'),
      ...content('TagLink'),
      disabled('TagLink'),
      ...removable('TagLink'),
      [
        'href',
        'string',
        '—',
        'TagLink',
        'The destination. A disabled TagLink loses it and announces aria-disabled, because an anchor without a destination is not a link',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'The destination is a real anchor, so middle click, the context menu, download and “open in new tab” all keep working.',
      'A chip that navigates to another origin says so in its own words or in a visually hidden sentence. The external marker belongs to the link family, on a link.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-link-react-destination',
        language: 'tsx',
        label: 'A chip that navigates',
        source: '<TagLink href="/equipes/plataforma">#plataforma</TagLink>;',
      }),
      defineSnippet({
        id: 'tag-link-react-router',
        language: 'tsx',
        label: 'A destination the router owns',
        source:
          '<TagLink render={(props) => <Link {...props} to="/equipes/plataforma" />}>#plataforma</TagLink>;',
      }),
    ],
  },
  tagToggle: {
    api: apiRows([
      ...appearance('TagToggle'),
      ...content('TagToggle'),
      disabled('TagToggle'),
      ...removable('TagToggle'),
      [
        'selected',
        'boolean',
        'false',
        'TagToggle',
        'The selection the consumer owns. Passing it puts the tag in controlled mode for good',
      ],
      [
        'defaultSelected',
        'boolean',
        '—',
        'TagToggle',
        'The selection an uncontrolled tag starts from, read once. A later change to it is not silently adopted',
      ],
      [
        'onSelectedChange',
        '(selected, request) => void',
        '—',
        'TagToggle',
        'Asks for the opposite selection. request.reason is pointer or keyboard, and request.cancel() refuses it',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'A selected tag announces aria-pressed, not aria-selected. aria-selected is only valid inside a listbox, a grid or a tree, and an option may not contain the remove control this family puts beside the label. Carbon’s SelectableTag reaches the same conclusion; Angular Material reaches the other one and gives up the remove button.',
      'The label never changes with the state, which is the APG’s rule for a toggle: “Aberto” stays “Aberto” and the state is announced beside it.',
      'Selection is not colour alone. The chip fills, and a check grows into the label beside the words — WCAG 2.2 1.4.1.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-toggle-react-uncontrolled',
        language: 'tsx',
        label: 'A filter that remembers its own state',
        source: '<TagToggle defaultSelected>Somente abertos</TagToggle>;',
      }),
      defineSnippet({
        id: 'tag-toggle-react-set',
        language: 'tsx',
        label: 'A set of filters the application owns',
        source:
          '<TagGroup aria-label="Filtros">\n  {facets.map((facet) => (\n    <TagToggle\n      key={facet}\n      onSelectedChange={(next) => setChosen(toggle(chosen, facet, next))}\n      selected={chosen.has(facet)}\n      tone="accent"\n    >\n      {facet}\n    </TagToggle>\n  ))}\n</TagGroup>;',
      }),
    ],
  },
} as const;
