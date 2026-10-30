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

export const ANGULAR_TAG_TOKENS = tagTokens.map((name) => ({
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
    'slTagStart',
    '—',
    member,
    'A glyph or an avatar before the words: the directive on the consumer’s own element, projected into the content box',
  ],
  ['end', 'slTagEnd', '—', member, 'A glyph after the words, projected the same way'],
];

const removable = (member: string): ApiTuple[] => [
  [
    'removable',
    'boolean',
    'false',
    member,
    'Whether the chip can be removed. Stated rather than inferred: Angular cannot see whether an output was subscribed',
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
  [
    '(remove)',
    'TagRemoveRequest',
    '—',
    member,
    'Asks to be removed. reason is remove for the control and keyboard for Backspace or Delete; cancel() refuses it, and the group then leaves focus where it is',
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
  'The chip box is never the interactive element. A button cannot contain a button and an anchor cannot contain either, so a chip that both acts and removes puts its two controls side by side: slTagBody is the primary target and slTagRemove is its sibling.',
  'What the chip is, is which element carries slTagBody: a span does nothing, a button runs a command, an anchor navigates. The element is the member, which keeps routerLink, type, download and every native listener on the element that owns them.',
  'The remove control’s name is composed, not repeated: aria-labelledby joins a hidden word to the tag’s own label, so it announces “Remove Design” rather than “Remove”. Text referenced by aria-labelledby counts even when the element holding it is hidden.',
  'Backspace and Delete on any control inside a removable tag ask for the same removal the X does, and the request says which of the two it was.',
  'The focus ring is drawn on the control, never on the chip: a chip can hold two controls, and a ring around the whole box could not say which one has focus.',
  'The remove control is as tall as the chip and as wide as its glyph plus a step of air on each side, floored at the WCAG 2.2 2.5.8 minimum of 24 CSS pixels, which carries it past that minimum in both axes at every size and every density. The chip’s own height is floored at that minimum for the same reason.',
  'A tag is one line. A value too long for its container is clipped with an ellipsis rather than reflowed, and the clipping is visual only: the whole value stays in the DOM, in the accessibility tree, and findable by page search.',
  'The label is a bidi isolate whose direction comes from its own first strong character, so an Arabic value inside an English page reads right to left and is clipped at its own end.',
  'Under forced colours every tone ground becomes one system colour, so the family draws its edge in currentColor there, and a selected chip takes the system’s own Highlight pair.',
];

export const ANGULAR_TAG_DOCS = {
  tag: {
    api: apiRows([
      ...appearance('slTag'),
      ...content('slTag'),
      disabled('slTag'),
      ...removable('slTag'),
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slTagGroup',
        'Which way the run reads. vertical also writes aria-orientation',
      ],
      ['loop', 'boolean', 'true', 'slTagGroup', 'Whether the arrow keys wrap past the ends'],
      [
        'role',
        'string',
        'toolbar',
        'slTagGroup',
        'toolbar makes the run one tab stop with arrow navigation inside it. Writing role="list" on the element turns that off and gives every chip role="listitem"',
      ],
      [
        'exportAs',
        'slTag | slTagBody | slTagToggle | slTagRemove | slTagGroup',
        '—',
        'every part',
        'A template reference to the instance, for a page that has to reach one',
      ],
      [
        'provideTagDefaults',
        '{ tone, variant, size, shape }',
        '—',
        'an injector',
        'Sets the defaults once for every tag under it; an explicit input still wins',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'A static tag carries no role of its own. What a value means comes from where it sits, and a role invented here would be wrong more often than right.',
      'A run of static tags is written role="list" on the group, which announces its length and turns the arrow keys off.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-angular-static',
        language: 'angular',
        label: 'A value beside the thing it belongs to',
        source: '<span slTag tone="success"><span slTagBody>Delivered</span></span>',
      }),
      defineSnippet({
        id: 'tag-angular-removable',
        language: 'angular',
        label: 'A run of values a person can take away',
        source:
          '<div slTagGroup aria-label="Labels">\n  @for (label of labels(); track label) {\n    <span slTag removable (remove)="drop(label)">\n      <span slTagBody>{{ label }}</span>\n      <button slTagRemove></button>\n    </span>\n  }\n</div>',
      }),
      defineSnippet({
        id: 'tag-angular-confirm',
        language: 'angular',
        label: 'A removal the application refuses until it is confirmed',
        source:
          '<span slTag removable (remove)="confirm($event)">\n  <span slTagBody>Production</span>\n  <button slTagRemove></button>\n</span>',
      }),
      defineSnippet({
        id: 'tag-angular-defaults',
        language: 'ts',
        label: 'One decision for every tag in the application',
        source:
          "bootstrapApplication(App, {\n  providers: [provideTagDefaults({ size: 'sm' })],\n});",
      }),
    ],
  },
  tagButton: {
    api: apiRows([
      ...appearance('slTag'),
      ...content('slTagBody'),
      disabled('slTag'),
      ...removable('slTag'),
      [
        '(click)',
        'MouseEvent',
        '—',
        'button[slTagBody]',
        'The command. It stays on the consumer’s own button, so type, form and every native listener reach the element that owns them',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'The command is a real button, so Enter and Space both activate it and the platform supplies the rest.',
      'A disabled chip writes the native disabled attribute on a button body, which is the form the platform offers for that element.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-button-angular-command',
        language: 'angular',
        label: 'A chip that runs a command',
        source:
          '<span slTag>\n  <button slTagBody (click)="assign()">Assign owner</button>\n</span>',
      }),
      defineSnippet({
        id: 'tag-button-angular-overflow',
        language: 'angular',
        label: 'The remaining values, behind one more chip',
        source:
          '<div slTagGroup aria-label="Participantes">\n  @for (person of shown(); track person.id) {\n    <span slTag>\n      <span slTagBody>{{ person.name }}</span>\n    </span>\n  }\n  @if (hidden() > 0) {\n    <span slTag variant="outline">\n      <button slTagBody (click)="showAll()">+{{ hidden() }}</button>\n    </span>\n  }\n</div>',
      }),
    ],
  },
  tagLink: {
    api: apiRows([
      ...appearance('slTag'),
      ...content('slTagBody'),
      disabled('slTag'),
      ...removable('slTag'),
      [
        'href',
        'string',
        '—',
        'a[slTagBody]',
        'The destination, and routerLink composes on the same element. A disabled chip withholds it and gives it back the moment the chip becomes available again',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'The destination is a real anchor, so middle click, the context menu, download and “open in new tab” all keep working.',
      'A disabled chip link keeps its place in the tab sequence and loses its href, which is the line the link family draws: an anchor without a destination would drop out of the tab sequence and take its own explanation with it.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-link-angular-destination',
        language: 'angular',
        label: 'A chip that navigates',
        source: '<span slTag>\n  <a slTagBody href="/equipes/plataforma">#plataforma</a>\n</span>',
      }),
      defineSnippet({
        id: 'tag-link-angular-router',
        language: 'angular',
        label: 'A destination the router owns',
        source:
          '<span slTag>\n  <a slTagBody routerLink="/equipes/plataforma">#plataforma</a>\n</span>',
      }),
    ],
  },
  tagToggle: {
    api: apiRows([
      ...appearance('slTag'),
      ...content('slTagToggle'),
      disabled('slTag'),
      ...removable('slTag'),
      [
        'selected',
        'boolean',
        'false',
        'button[slTagToggle]',
        'The selection the consumer owns. Passing it puts the chip in controlled mode for good',
      ],
      [
        'defaultSelected',
        'boolean',
        'false',
        'button[slTagToggle]',
        'The selection an uncontrolled chip starts from, read once',
      ],
      [
        '(selectedChange)',
        'ChangeRequest<boolean>',
        '—',
        'button[slTagToggle]',
        'One output for one transition, carrying the value, the value it replaces, the reason, the event and cancel()',
      ],
    ]),
    accessibility: [
      ...ACCESSIBILITY_SHARED,
      'A selected tag announces aria-pressed, not aria-selected. aria-selected is only valid inside a listbox, a grid or a tree, and an option may not contain the remove control this family puts beside the label.',
      'The label never changes with the state, which is the APG’s rule for a toggle.',
      'Selection is not colour alone. The chip fills, and a check grows into the label beside the words — WCAG 2.2 1.4.1.',
    ],
    snippets: [
      defineSnippet({
        id: 'tag-toggle-angular-uncontrolled',
        language: 'angular',
        label: 'A filter that remembers its own state',
        source:
          '<span slTag>\n  <button slTagToggle defaultSelected>Somente abertos</button>\n</span>',
      }),
      defineSnippet({
        id: 'tag-toggle-angular-set',
        language: 'angular',
        label: 'A set of filters the application owns',
        source:
          '<div slTagGroup aria-label="Filtros">\n  @for (facet of facets; track facet) {\n    <span slTag tone="accent">\n      <button\n        slTagToggle\n        [selected]="chosen().has(facet)"\n        (selectedChange)="choose(facet, $event.value)"\n      >\n        {{ facet }}\n      </button>\n    </span>\n  }\n</div>',
      }),
    ],
  },
} as const;
