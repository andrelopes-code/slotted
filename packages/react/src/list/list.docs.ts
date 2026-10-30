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

export const REACT_LIST_TOKENS = listTokens.map((name) => ({
  name,
  purpose: 'Theme-owned List decision',
}));

const imports: ReferenceImport = {
  source: "import { List, ListDefaultsProvider, ListEmpty, ListSection } from '@slotted/react';",
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
      'What stands at the end of the heading, on the line of the name: a day balance, a count. Set in tabular figures. It is rendered from the end prop.',
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
    note: 'One set with every axis on it, driven by the controls below the canvas. The rows are ListItem, a family of its own; what this page decides is how they are told apart.',
    snippet: defineSnippet({
      id: 'list-react-playground',
      language: 'tsx',
      label: 'A set, and the rows inside it',
      source: `<List aria-label="Folders" variant="ruled">
  <ListItem>
    <ListItemLink href="/photos">
      <ListItemBody>
        <ListItemLabel>Photos</ListItemLabel>
      </ListItemBody>
      <ListItemEnd>128</ListItemEnd>
    </ListItemLink>
  </ListItem>
</List>;`,
    }),
  },
  {
    id: 'variant',
    title: 'Telling the rows apart',
    note: 'Four words, and they are accordion\u2019s four so that two families cannot mean different things by one of them. Only separated spends a gap; the other three separate with a line or with nothing.',
    snippet: defineSnippet({
      id: 'list-react-variant',
      language: 'tsx',
      label: 'The four the set chooses between',
      source: `<List variant="plain" />;
<List variant="ruled" />;
<List variant="framed" />;
<List variant="separated" />;`,
    }),
  },
  {
    id: 'marker',
    title: 'The mark, and the order',
    note: 'The element carries the reading order and the axis carries the painted mark, which is why an ordered set can paint its own badges and still read in order. The bullet is drawn geometry rather than a character.',
    snippet: defineSnippet({
      id: 'list-react-marker-scene',
      language: 'tsx',
      label: 'Two questions, two props',
      source: `<List marker="bullet" />;
<List marker="number" ordered />;
<List ordered />;`,
    }),
  },
  {
    id: 'sections',
    title: 'Groups',
    note: 'A group is an li holding a heading and a nested list, and the nested list names itself by that heading. sticky keeps the name in place while its own rows scroll past it.',
    snippet: defineSnippet({
      id: 'list-react-sections-scene',
      language: 'tsx',
      label: 'A group, named by its own heading',
      source: `<List aria-label="Library" variant="ruled">
  <ListSection label="Folders" level="3" sticky>
    {folderRows}
  </ListSection>
</List>;`,
    }),
  },
  {
    id: 'inset',
    title: 'A set inside a padded box',
    note: 'inset takes the rows inline padding away so the titles line up with the box around them. The rule and the hover fill still run edge to edge, which is the half disableGutters leaves out elsewhere.',
    snippet: defineSnippet({
      id: 'list-react-inset-scene',
      language: 'tsx',
      label: 'Flush with the box it is in',
      source: `<List aria-label="Members" inset variant="ruled">
  {memberRows}
</List>;`,
    }),
  },
  {
    id: 'states',
    title: 'Loading, and empty',
    note: 'loading writes aria-busy and draws nothing: Skeleton stands in for the rows. The empty message is an li inside the set, so a reader hears it rather than hearing zero items and then silence.',
    snippet: defineSnippet({
      id: 'list-react-states-scene',
      language: 'tsx',
      label: 'The two things a set says about itself',
      source: `<List aria-label="Folders" loading variant="ruled">
  {placeholderRows}
</List>;

<List aria-label="Results" variant="framed">
  <ListEmpty>No matches</ListEmpty>
</List>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A page of a larger set says where the reader is with position and setSize, and only then. A set in another script mirrors its marker column, its inset and its metadata, because every rule is a logical property.',
    snippet: defineSnippet({
      id: 'list-react-content-scene',
      language: 'tsx',
      label: 'A page of a larger set',
      source: `<List aria-label="Results 41 to 43 of 128" variant="ruled">
  <ListItem position={41} setSize={128} />
</List>;`,
    }),
  },
  {
    id: 'composition',
    title: 'The families beside it',
    note: 'The set supplies the box and the rhythm. Checkbox announces the selection a row paints, Badge carries a count, and ListDefaultsProvider sets the four axes once for a whole application.',
    snippet: defineSnippet({
      id: 'list-react-composition-scene',
      language: 'tsx',
      label: 'One decision for every list under it',
      source: `<ListDefaultsProvider size="sm" variant="ruled">
  <Inbox />
</ListDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The role, and the landmark',
    note: 'The family writes role="list" because it draws its own marker, and never over a role the page wrote itself. A nav is the page decision, so the family writes none and the row says which one is current.',
    snippet: defineSnippet({
      id: 'list-react-accessibility-scene',
      language: 'tsx',
      label: 'A navigation list, in the landmark the page owns',
      source: `<nav aria-label="Sections">
  <List>
    <ListItem current="page">
      <ListItemLink href="/billing">Billing</ListItemLink>
    </ListItem>
  </List>
</nav>;`,
    }),
  },
];

export const REACT_LIST_DOCS = {
  list: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        'plain',
        'List',
        'How the rows are told apart: by rhythm, by a rule, by a box around them, or by a surface each',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'List',
        "The room a row gets. Density is the application's choice; this is this list's",
      ],
      [
        'marker',
        "'none' | 'bullet' | 'number'",
        'none',
        'List',
        'What is painted in the marker column. The family draws it, so it never disappears with the semantics',
      ],
      [
        'ordered',
        'boolean',
        'false',
        'List',
        'Renders an ol, so the reading order of the set is a fact rather than a look',
      ],
      [
        'inset',
        'boolean',
        'false',
        'List',
        'Takes the rows inline padding away, for a list inside a box that already pads its content',
      ],
      [
        'loading',
        'boolean',
        'false',
        'List',
        'Writes aria-busy on the set. What stands in for the rows is Skeleton, composed by the page',
      ],
      [
        'level',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        '3',
        'ListSection',
        'The heading a group name is set as. none renders a div and announces no heading',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'ListSection',
        'Keeps a group name in place while its own rows scroll past it',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'ListSection',
        'What stands at the end of the group heading, on the line of the name, in tabular figures',
      ],
      [
        'labelVariant',
        "'caption' | 'ruled'",
        'caption',
        'ListSection',
        'How the group heading is drawn: the small muted name, or the name over a rule with no ground',
      ],
      [
        'label',
        'ReactNode',
        '—',
        'ListSection',
        'The group name, which the nested list is named by',
      ],
      [
        'labelProps / listProps',
        'HTMLAttributes',
        '—',
        'ListSection',
        'Reach the heading and the nested list, for an id or a class the page owns',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'List, ListSection, ListEmpty',
        'Renders the wiring into another element — a nav, a router own list',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element props',
      ],
      [
        'aria-label / aria-labelledby',
        'string',
        '—',
        'List',
        'The set own name, passed through to the element. The family adds no label of its own',
      ],
      [
        'ListDefaultsProvider',
        '{ variant, size, marker, inset }',
        '—',
        'a subtree',
        'Sets the four once for every list under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'The Authoring Practices publish no pattern for a static list. They name Listbox and Grid for interactive collections and nothing between those and plain content, so what governs here is HTML and the ARIA roles model.',
      'role="list" is written on the root and on every nested group, and it is not redundant. The family draws its own marker — a row is a content box beside its independent targets, and CSS has no display that is both list-item and a grid — and Safari with VoiceOver drops list semantics the moment CSS removes the marker. A role the page wrote itself, a menu or a listbox it is wiring, survives untouched.',
      'A group is an li holding a heading and a nested list, which is the grouping HTML already has, and the nested list names itself by that heading. A reader who lands inside a group is told which group it is; the four surveyed libraries that ship groups each leave the heading loose among the rows instead.',
      'loading writes aria-busy on the set, which ARIA 1.2 §5.2.6 asks of a container whose rows have not arrived yet. It draws no spinner and no placeholder: Skeleton owns that geometry and goes inside the rows.',
      'The empty message is an li inside the list. Outside it, a reader hears "list, zero items" and then nothing, and the words fall outside the box a framed set paints.',
      'The set binds no key. Arrows, Home, End and typeahead belong to a collection, and a role="list" that answers them is the invented keyboard the feature guide refuses — that model is Listbox and Table in wave 6. The cost is that a hundred rows are a hundred Tab presses, which is the platform own behaviour for any page of links; a nav the page labels is what a screen reader jumps by instead.',
      'The set holds no state a consumer can own, so it emits no event and declares no state model. A selection is painted by the row and announced by the Checkbox the page composes into it.',
    ],
    snippets: [
      defineSnippet({
        id: 'list-react-rows',
        language: 'tsx',
        label: 'A set, and the rows inside it',
        source:
          '<List aria-label="Folders" variant="ruled">\n  {folders.map((folder) => (\n    <ListItem key={folder.id}>\n      <ListItemLink href={folder.href}>\n        <ListItemBody>\n          <ListItemLabel>{folder.name}</ListItemLabel>\n        </ListItemBody>\n        <ListItemEnd>{folder.count}</ListItemEnd>\n      </ListItemLink>\n    </ListItem>\n  ))}\n</List>;',
      }),
      defineSnippet({
        id: 'list-react-sections',
        language: 'tsx',
        label: 'A group, named by its own heading',
        source:
          '<List aria-label="Library" variant="ruled">\n  <ListSection label="Folders" level="3" sticky>\n    {folderRows}\n  </ListSection>\n  <ListSection label="Notes" level="3" sticky>\n    {noteRows}\n  </ListSection>\n</List>;',
      }),
      defineSnippet({
        id: 'list-react-marker',
        language: 'tsx',
        label: 'The reading order and the painted mark are two decisions',
        source:
          '<List aria-label="Setup" marker="number" ordered>\n  <ListItem>\n    <ListItemContent>\n      <ListItemLabel>Open the workspace</ListItemLabel>\n    </ListItemContent>\n  </ListItem>\n</List>;',
      }),
      defineSnippet({
        id: 'list-react-empty',
        language: 'tsx',
        label: 'What the set says when it holds nothing',
        source:
          '<List aria-label="Results" variant="framed">\n  {matches.length === 0 ? (\n    <ListEmpty>\n      <Heading level={3} size="md">\n        No matches\n      </Heading>\n      <Text tone="muted">Clear the filter to see every folder again.</Text>\n    </ListEmpty>\n  ) : (\n    matches.map(toRow)\n  )}\n</List>;',
      }),
      defineSnippet({
        id: 'list-react-inset',
        language: 'tsx',
        label: 'A set inside a box that already pads its content',
        source:
          '<Card>\n  <CardHeader>\n    <Heading level={3}>Members</Heading>\n  </CardHeader>\n  <CardBody>\n    <List aria-label="Members" inset variant="ruled">\n      {memberRows}\n    </List>\n  </CardBody>\n</Card>;',
      }),
      defineSnippet({
        id: 'list-react-nav',
        language: 'tsx',
        label: 'A navigation list, in the landmark the page owns',
        source:
          '<nav aria-label="Sections">\n  <List variant="plain">\n    {sections.map((section) => (\n      <ListItem current={section.href === here ? \'page\' : false} key={section.href}>\n        <ListItemLink href={section.href}>\n          <ListItemBody>\n            <ListItemLabel>{section.name}</ListItemLabel>\n          </ListItemBody>\n        </ListItemLink>\n      </ListItem>\n    ))}\n  </List>\n</nav>;',
      }),
      defineSnippet({
        id: 'list-react-defaults',
        language: 'tsx',
        label: 'One decision for every list in the application',
        source:
          '<ListDefaultsProvider size="sm" variant="ruled">\n  <Inbox />\n</ListDefaultsProvider>;',
      }),
    ],
  },
} as const;
