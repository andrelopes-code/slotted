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
      'The list. It carries data-ui="list", the three axes, data-inset, data-loading and role="list". The role is not redundant: List draws its own marker, and Safari drops list semantics when CSS removes the native one.',
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
      'The group name. It carries the id the nested list is named by, data-sticky when it holds still while its own rows scroll past, and data-variant: caption, the small muted name, or ruled, the name in the text color over a rule with no background.',
  },
  {
    part: 'section-end',
    element: 'span',
    required: false,
    purpose:
      "What stands at the end of the heading, on the line of the name: a day's total, a count. It is set in tabular figures, on the element inside the heading marked slListSectionEnd.",
  },
  {
    part: 'section-list',
    element: 'ul or ol',
    required: false,
    purpose:
      'The rows of one group. It takes the element of the list around it, carries role="list" for the same reason the root does, and is named by the heading above it.',
  },
  {
    part: 'empty',
    element: 'li',
    required: false,
    purpose:
      'The message the list shows when it holds no rows. It sits inside the list, so a screen reader reads the message rather than announcing zero items and stopping.',
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
        'How the rows are told apart: by spacing, by a rule between them, by a box around the list, or by a surface for each row.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slList',
        'The room a row gets: its minimum height, padding, gap and type size. Density is set by the application; size is set per list.',
      ],
      [
        'marker',
        "'none' | 'bullet' | 'number'",
        'none',
        'slList',
        'What is painted in the marker column. List draws the marker itself, so removing it never removes the list semantics.',
      ],
      [
        'ordered',
        'boolean',
        'false',
        'the element',
        'Not an input. Write slList on an ol instead of a ul: the element carries the reading order.',
      ],
      [
        'inset',
        'boolean',
        'false',
        'slList',
        "Removes the rows' inline padding, for a list inside a box that already pads its content. Rules and hover fills still run edge to edge.",
      ],
      [
        'loading',
        'boolean',
        'false',
        'slList',
        'Writes aria-busy on the list and draws nothing. slSkeleton, composed inside the rows, stands in for their content.',
      ],
      [
        'level',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        '3',
        'the element',
        'Not an input. slListSectionLabel goes on the heading element you write, at the level the document needs.',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'slListSectionLabel',
        'Keeps a group name in place while its own rows scroll past it, above the rows and on the list surface.',
      ],
      [
        'variant',
        "'caption' | 'ruled'",
        'caption',
        'slListSectionLabel',
        'How the group heading is drawn: caption is the small muted name, ruled is the name over a rule with no background. An element inside it marked slListSectionEnd stands at the end of the line, in tabular figures.',
      ],
      [
        'id',
        'string',
        '—',
        'slListSectionLabel',
        "The heading's id, which the nested list is named by. Generated when none is written.",
      ],
      [
        'exportAs',
        'slList | slListSection | slListSectionLabel | slListSectionList | slListEmpty',
        '—',
        'every directive',
        'Reaches the directive instance from a template.',
      ],
      [
        'aria-label / aria-labelledby',
        'string',
        '—',
        'slList',
        "The list's accessible name, written on the element. slList adds no name of its own.",
      ],
      [
        'role',
        'string',
        'list',
        'slList, slListSectionList',
        'Written by slList and slListSectionList, never over a role written on the element.',
      ],
      [
        'provideListDefaults',
        '{ variant, size, marker, inset }',
        '—',
        'an injector',
        'Sets variant, size, marker and inset once for every list under the injector. An input set on a list still wins.',
      ],
    ]),
    accessibility: [
      'A static list has no pattern in the ARIA Authoring Practices, which cover interactive collections such as Listbox and Grid. slList follows HTML and the ARIA roles model.',
      'role="list" is written on the root and on every nested group. It is not redundant: slList draws its own marker, and Safari with VoiceOver drops list semantics when CSS removes the native one. A role written on the element, such as menu or listbox, is kept.',
      'The directive goes on the ul or ol you write, because the element carries the reading order. React renders the element from an ordered prop instead.',
      'A group is an li that holds a heading and a nested list, and the nested list is named by that heading through aria-labelledby. The heading keeps the level the document needs, because slListSectionLabel goes on the element you write.',
      'loading writes aria-busy on the list, which ARIA 1.2 asks of a container whose content has not arrived. slList draws no spinner and no placeholder; slSkeleton goes inside the rows.',
      'The empty message is an li inside the list. Outside the list, a screen reader announces a list of zero items and reads nothing more, and the words fall outside the frame of a framed list.',
      'slList binds no key. Every control a row holds is in the page tab sequence, so Tab and Shift+Tab move between them. Arrow keys, Home, End and typeahead belong to Listbox and Table.',
      'slList holds no value a consumer can own, so it declares no model and emits no output. A row paints a selection with selected, and the slCheckbox composed into the row announces it.',
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
