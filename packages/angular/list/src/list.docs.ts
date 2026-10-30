import listTokens from '@slotted/styles/list/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_LIST_TOKENS = listTokens.map((name) => ({
  name,
  purpose: 'Theme-owned List decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlList, SlListEmpty, SlListSection, SlListSectionLabel, SlListSectionList } from '@slotted/angular/list';",
  selector:
    'ul[slList], ol[slList], li[slListSection], [slListSectionLabel], ul[slListSectionList], ol[slListSectionList], li[slListEmpty]',
  exportAs: 'slList, slListSection, slListSectionLabel, slListSectionList, slListEmpty',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'ul or ol, or the element render returns',
    required: true,
    purpose:
      'The set. Carries data-ui="list", the three axes, data-inset, data-loading and role="list" — which is not redundant, because the family draws its own marker and Safari drops list semantics when CSS removes one.',
  },
  {
    part: 'section',
    element: 'li',
    required: false,
    purpose:
      'One group: the li that holds a heading and the rows under it, which is the grouping HTML already has.',
  },
  {
    part: 'section-label',
    element: 'h1 to h6, or a div',
    required: false,
    purpose:
      'The group name. It carries the id the nested list names itself by, data-sticky when it has to hold still while its own rows scroll past, and data-variant: caption, the small muted name, or ruled, the name in the text colour over a rule with no ground behind it.',
  },
  {
    part: 'section-end',
    element: 'span',
    required: false,
    purpose:
      'What stands at the end of the heading, on the line of the name: a day balance, a count. Set in tabular figures. It is the element inside the heading marked slListSectionEnd.',
  },
  {
    part: 'section-list',
    element: 'ul or ol',
    required: false,
    purpose:
      'The rows of one group. It takes the element of the set around it, carries role="list" for the same reason the root does, and names itself by the heading above it.',
  },
  {
    part: 'empty',
    element: 'li',
    required: false,
    purpose:
      'What the set says when it holds nothing. Inside the list, so a reader hears the message rather than "zero items" and then silence.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every input on it, driven by the controls below the canvas. The rows are slListItem, a family of its own; what this page decides is how they are told apart.',
    snippet: defineSnippet({
      id: 'list-angular-playground',
      language: 'angular',
      label: 'A set, and the rows inside it',
      source: `<ul slList variant="ruled" aria-label="Folders">
  <li slListItem>
    <a slListItemContent href="/photos">
      <span slListItemBody><span slListItemLabel>Photos</span></span>
      <span slListItemEnd>128</span>
    </a>
  </li>
</ul>`,
    }),
  },
  {
    id: 'variant',
    title: 'Telling the rows apart',
    note: 'Four words, and they are accordion\u2019s four so that two families cannot mean different things by one of them. Only separated spends a gap; the other three separate with a line or with nothing.',
    snippet: defineSnippet({
      id: 'list-angular-variant',
      language: 'angular',
      label: 'The four the set chooses between',
      source: `<ul slList variant="plain"></ul>
<ul slList variant="ruled"></ul>
<ul slList variant="framed"></ul>
<ul slList variant="separated"></ul>`,
    }),
  },
  {
    id: 'marker',
    title: 'The mark, and the order',
    note: 'The element carries the reading order and the input carries the painted mark, which is why an ordered set can paint its own badges and still read in order. The bullet is drawn geometry rather than a character.',
    snippet: defineSnippet({
      id: 'list-angular-marker-scene',
      language: 'angular',
      label: 'Two questions, two decisions',
      source: `<ul slList marker="bullet"></ul>
<ol slList marker="number"></ol>
<ol slList></ol>`,
    }),
  },
  {
    id: 'sections',
    title: 'Groups',
    note: 'A group is an li holding a heading and a nested list, and the nested list names itself by that heading. The heading keeps whatever level the document needs, because the directive goes on the page own element.',
    snippet: defineSnippet({
      id: 'list-angular-sections-scene',
      language: 'angular',
      label: 'A group, on the heading the document needs',
      source: `<li slListSection>
  <h3 slListSectionLabel sticky>Folders</h3>
  <ul slListSectionList>
    <ng-container [ngTemplateOutlet]="folderRows" />
  </ul>
</li>`,
    }),
  },
  {
    id: 'inset',
    title: 'A set inside a padded box',
    note: 'inset takes the rows inline padding away so the titles line up with the box around them. The rule and the hover fill still run edge to edge, which is the half disableGutters leaves out elsewhere.',
    snippet: defineSnippet({
      id: 'list-angular-inset-scene',
      language: 'angular',
      label: 'Flush with the box it is in',
      source: `<ul slList inset variant="ruled" aria-label="Members">
  <ng-container [ngTemplateOutlet]="memberRows" />
</ul>`,
    }),
  },
  {
    id: 'states',
    title: 'Loading, and empty',
    note: 'loading writes aria-busy and draws nothing: slSkeleton stands in for the rows. The empty message is an li inside the set, so a reader hears it rather than hearing zero items and then silence.',
    snippet: defineSnippet({
      id: 'list-angular-states-scene',
      language: 'angular',
      label: 'The two things a set says about itself',
      source: `<ul slList loading variant="ruled" aria-label="Folders"></ul>
<ul slList variant="framed" aria-label="Results">
  <li slListEmpty>No matches</li>
</ul>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A page of a larger set says where the reader is with position and setSize, and only then. A set in another script mirrors its marker column, its inset and its metadata, because every rule is a logical property.',
    snippet: defineSnippet({
      id: 'list-angular-content-scene',
      language: 'angular',
      label: 'A page of a larger set',
      source: `<ul slList variant="ruled" aria-label="Results 41 to 43 of 128">
  <li slListItem [position]="41" [setSize]="128"></li>
</ul>`,
    }),
  },
  {
    id: 'composition',
    title: 'The families beside it',
    note: 'The set supplies the box and the rhythm. slCheckbox announces the selection a row paints, slBadge carries a count, and the rows answer their own width while the set does not.',
    snippet: defineSnippet({
      id: 'list-angular-composition-scene',
      language: 'ts',
      label: 'One decision for every list under it',
      source: `bootstrapApplication(App, {
  providers: [provideListDefaults({ size: 'sm', variant: 'ruled' })],
});`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The role, and the landmark',
    note: 'The family writes role="list" because it draws its own marker, and reads a role the page wrote with HostAttributeToken before the binding runs. A nav is the page decision, so the family writes none.',
    snippet: defineSnippet({
      id: 'list-angular-accessibility-scene',
      language: 'angular',
      label: 'A navigation list, in the landmark the page owns',
      source: `<nav aria-label="Sections">
  <ul slList>
    <li slListItem current="page">
      <a slListItemContent href="/billing">Billing</a>
    </li>
  </ul>
</nav>`,
    }),
  },
];

export const ANGULAR_LIST_DOCS = {
  list: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        'plain',
        'slList',
        'How the rows are told apart: by rhythm, by a rule, by a box around them, or by a surface each',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slList',
        "The room a row gets. Density is the application's choice; this is this list's",
      ],
      [
        'marker',
        "'none' | 'bullet' | 'number'",
        'none',
        'slList',
        'What is painted in the marker column. The family draws it, so it never disappears with the semantics',
      ],
      [
        'ordered',
        'boolean',
        'false',
        'the element',
        'Not an input: the page writes ul or ol itself, because the element is what carries the reading order',
      ],
      [
        'inset',
        'boolean',
        'false',
        'slList',
        'Takes the rows inline padding away, for a list inside a box that already pads its content',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slList',
        'Writes aria-busy on the set. What stands in for the rows is slSkeleton, composed by the page',
      ],
      [
        'level',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        '3',
        'the element',
        'Not an input: slListSectionLabel goes on the heading the page wrote, at whatever level the document needs',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'slListSectionLabel',
        'Keeps a group name in place while its own rows scroll past it',
      ],
      [
        'variant',
        "'caption' | 'ruled'",
        'caption',
        'slListSectionLabel',
        'How the group heading is drawn: the small muted name, or the name over a rule with no ground; an element inside it marked slListSectionEnd stands at the end, in tabular figures',
      ],
      [
        'id',
        'string',
        '—',
        'slListSectionLabel',
        'The heading own id, which the nested list is named by. Generated when the page wrote none',
      ],
      [
        'exportAs',
        'slList | slListSection | slListSectionLabel | slListSectionList | slListEmpty',
        '—',
        'every directive',
        'Reaches the instance from a template',
      ],
      [
        'aria-label / aria-labelledby',
        'string',
        '—',
        'slList',
        'The set own name, written on the element. The family adds no label of its own',
      ],
      [
        'role',
        'string',
        'list',
        'slList, slListSectionList',
        'Written by the family, and never over a role the page wrote itself',
      ],
      [
        'provideListDefaults',
        '{ variant, size, marker, inset }',
        '—',
        'an injector',
        'Sets the four once for every list under it; an explicit input still wins',
      ],
    ]),
    accessibility: [
      'The Authoring Practices publish no pattern for a static list. They name Listbox and Grid for interactive collections and nothing between those and plain content, so what governs here is HTML and the ARIA roles model.',
      'role="list" is written on the root and on every nested group, and it is not redundant. The family draws its own marker — a row is a content box beside its independent targets, and CSS has no display that is both list-item and a grid — and Safari with VoiceOver drops list semantics the moment CSS removes the marker. A role the page wrote itself is read with HostAttributeToken before the host binding runs, so a menu or a listbox the page is wiring keeps its own.',
      'The directive goes on the element the page wrote, ul or ol, because the element carries the reading order and that is the page decision rather than the family one. React reads the element off an ordered prop instead, because there the component owns the tag.',
      'A group is an li holding a heading and a nested list, which is the grouping HTML already has, and the nested list names itself by that heading. The heading keeps whatever level the document needs, because slListSectionLabel is a directive on the page own element.',
      'loading writes aria-busy on the set, which ARIA 1.2 §5.2.6 asks of a container whose rows have not arrived yet. It draws no spinner and no placeholder: slSkeleton owns that geometry and goes inside the rows.',
      'The empty message is an li inside the list. Outside it, a reader hears "list, zero items" and then nothing, and the words fall outside the box a framed set paints.',
      'The set binds no key. Arrows, Home, End and typeahead belong to a collection, and a role="list" that answers them is the invented keyboard the feature guide refuses — that model is Listbox and Table in wave 6.',
      'The set holds no value a consumer can own, so it declares no model, emits no output and needs no ControlValueAccessor. A selection is painted by the row and announced by the slCheckbox the page composes into it.',
    ],
    snippets: [
      defineSnippet({
        id: 'list-angular-rows',
        language: 'angular',
        label: 'A set, and the rows inside it',
        source:
          '<ul slList variant="ruled" aria-label="Folders">\n  @for (folder of folders(); track folder.id) {\n    <li slListItem>\n      <a slListItemContent [routerLink]="folder.route">\n        <span slListItemBody>\n          <span slListItemLabel>{{ folder.name }}</span>\n        </span>\n        <span slListItemEnd>{{ folder.count }}</span>\n      </a>\n    </li>\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'list-angular-sections',
        language: 'angular',
        label: 'A group, on the heading the document needs',
        source:
          '<ul slList variant="ruled" aria-label="Library">\n  <li slListSection>\n    <h3 slListSectionLabel sticky>Folders</h3>\n    <ul slListSectionList>\n      <ng-container [ngTemplateOutlet]="folderRows" />\n    </ul>\n  </li>\n</ul>',
      }),
      defineSnippet({
        id: 'list-angular-marker',
        language: 'angular',
        label: 'The reading order and the painted mark are two decisions',
        source:
          '<ol slList marker="number" aria-label="Setup">\n  <li slListItem>\n    <div slListItemContent>\n      <span slListItemLabel>Open the workspace</span>\n    </div>\n  </li>\n</ol>',
      }),
      defineSnippet({
        id: 'list-angular-empty',
        language: 'angular',
        label: 'What the set says when it holds nothing',
        source:
          '<ul slList variant="framed" aria-label="Results">\n  @if (matches().length === 0) {\n    <li slListEmpty>\n      <h3 slHeading [level]="3" size="md">No matches</h3>\n      <span slText tone="muted">Clear the filter to see every folder again.</span>\n    </li>\n  } @else {\n    <ng-container [ngTemplateOutlet]="matchRows" />\n  }\n</ul>',
      }),
      defineSnippet({
        id: 'list-angular-inset',
        language: 'angular',
        label: 'A set inside a box that already pads its content',
        source:
          '<div slCard>\n  <div slCardHeader><h3 slHeading [level]="3">Members</h3></div>\n  <div slCardBody>\n    <ul slList inset variant="ruled" aria-label="Members">\n      <ng-container [ngTemplateOutlet]="memberRows" />\n    </ul>\n  </div>\n</div>',
      }),
      defineSnippet({
        id: 'list-angular-nav',
        language: 'angular',
        label: 'A navigation list, in the landmark the page owns',
        source:
          '<nav aria-label="Sections">\n  <ul slList>\n    @for (section of sections(); track section.route) {\n      <li slListItem [current]="section.route === here() ? \'page\' : false">\n        <a slListItemContent [routerLink]="section.route">\n          <span slListItemBody>\n            <span slListItemLabel>{{ section.name }}</span>\n          </span>\n        </a>\n      </li>\n    }\n  </ul>\n</nav>',
      }),
      defineSnippet({
        id: 'list-angular-defaults',
        language: 'ts',
        label: 'One decision for every list in the application',
        source:
          "bootstrapApplication(App, {\n  providers: [provideListDefaults({ size: 'sm', variant: 'ruled' })],\n});",
      }),
    ],
  },
} as const;
