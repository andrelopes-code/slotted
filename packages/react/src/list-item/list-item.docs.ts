import listItemTokens from '@slotted/styles/list-item/tokens.json';
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

export const REACT_LIST_ITEM_TOKENS = listItemTokens.map((name) => ({
  name,
  purpose: 'Theme-owned List Item decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ListItem, ListItemActions, ListItemBody, ListItemButton, ListItemContent, ListItemDefaultsProvider, ListItemDescription, ListItemEnd, ListItemLabel, ListItemLink, ListItemStart } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'li, or the element render returns',
    required: true,
    purpose:
      'The row. Carries data-ui="list-item", every axis, data-selected, data-current, data-disabled, data-loading and aria-current. It is its own container, so the row reflows on its own inline size rather than the viewport.',
  },
  {
    part: 'marker',
    parent: 'root',
    element: 'span',
    required: false,
    purpose:
      'The bullet, rendered only when marker is bullet: the dot Glyph in the marker column, before content and hidden from assistive technology. A numbered marker is a counter the stylesheet writes, because it is text.',
  },
  {
    part: 'content',
    parent: 'root',
    element: 'div, button or a',
    required: true,
    purpose:
      'The box that is read, hovered, focused and — for two of the three — activated. Three elements rather than one as prop, because the three are three different accessibility trees.',
  },
  {
    part: 'start',
    parent: 'content',
    element: 'div',
    required: false,
    purpose:
      'The leading column: an icon, an avatar, a Checkbox. It is the slot and not the control, and the chooser here is also what announces a selection the row only paints.',
  },
  {
    part: 'body',
    parent: 'content',
    element: 'div',
    required: false,
    purpose:
      'The text column, and the one box in the row that may shrink — which is what lets an unbroken token break instead of pushing the metadata out of the row.',
  },
  {
    part: 'label',
    parent: 'body',
    element: 'div',
    required: false,
    purpose:
      'The title. It clips under truncate, isolates its own direction so another script does not reorder the row, and breaks a single unbroken token.',
  },
  {
    part: 'description',
    parent: 'body',
    element: 'div',
    required: false,
    purpose: 'The lines under the title. They clip with it, never instead of it.',
  },
  {
    part: 'end',
    parent: 'content',
    element: 'div',
    required: false,
    purpose:
      'Trailing metadata that is part of what the row says — a timestamp, a count, a Badge. Below 22rem it leaves the inline axis and sits under the title.',
  },
  {
    part: 'actions',
    parent: 'root',
    element: 'div',
    required: false,
    purpose:
      'Independent targets, and a sibling of the box rather than its child: interactive content may not nest inside an a or a button.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One row with every axis on it, driven by the controls below the canvas. Tab lands on the box and then on the control beside it; the family binds no key of its own.',
    snippet: defineSnippet({
      id: 'list-item-react-playground',
      language: 'tsx',
      label: 'A row, and the box inside it',
      source: `<ListItem>
  <ListItemLink href="/photos">
    <ListItemBody>
      <ListItemLabel>Photos</ListItemLabel>
    </ListItemBody>
    <ListItemEnd>Yesterday</ListItemEnd>
  </ListItemLink>
</ListItem>;`,
    }),
  },
  {
    id: 'content-elements',
    title: 'Three boxes, three trees',
    note: 'A static row answers no pointer state because it promises no interaction. The other two are a real button and a real anchor, so Enter, Space and a modified click are the platform\u2019s.',
    snippet: defineSnippet({
      id: 'list-item-react-content-elements',
      language: 'tsx',
      label: 'The three the row chooses between',
      source: `<ListItemContent />;
<ListItemButton onClick={publish} />;
<ListItemLink href="/photos" />;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, and a row with almost none',
    note: 'Every part but the box is optional, and an absent one leaves no column behind: each gap is a margin on the part rather than a track on the grid. ListItemEnd takes metadata, inside the box; ListItemActions takes controls, beside it.',
    snippet: defineSnippet({
      id: 'list-item-react-anatomy-scene',
      language: 'tsx',
      label: 'Leading visual, title, lines, metadata, targets',
      source: `<ListItem>
  <ListItemContent>
    <ListItemStart>{icon}</ListItemStart>
    <ListItemBody>
      <ListItemLabel>Photos</ListItemLabel>
      <ListItemDescription>128 files</ListItemDescription>
    </ListItemBody>
    <ListItemEnd>Yesterday</ListItemEnd>
  </ListItemContent>
  <ListItemActions>
    <Button size="sm" variant="ghost" onClick={rename}>
      Rename
    </Button>
    <Button size="sm" variant="ghost" onClick={remove}>
      Remove
    </Button>
  </ListItemActions>
</ListItem>;`,
    }),
  },
  {
    id: 'alignment',
    title: 'Where the leading visual sits',
    note: 'center is right while the block is one line and wrong as soon as it is three. start returns the mark and the metadata to the title own line, so a row of three lines reads from one corner.',
    snippet: defineSnippet({
      id: 'list-item-react-alignment',
      language: 'tsx',
      label: 'Two answers for a row of more than one line',
      source: `<ListItem align="center" />;
<ListItem align="start" />;`,
    }),
  },
  {
    id: 'tone',
    title: 'The five the theme carries',
    note: 'A tone moves the ink, the wash under the pointer and the ground of a selected row, and never fills a resting row: forty rows each filled with a tone is a list nobody can read.',
    snippet: defineSnippet({
      id: 'list-item-react-tone',
      language: 'tsx',
      label: 'A destructive row',
      source: `<ListItem tone="danger">
  <ListItemButton onClick={destroy}>Delete the workspace</ListItemButton>
</ListItem>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the row paints',
    note: 'Selection is the accent ground, the accent ink and a one-pixel edge together, because every tone surface is white in the high-contrast scheme. Current is the neutral ground with its own edge, so a row can be both at once and the selection is what shows without either of them being lost.',
    snippet: defineSnippet({
      id: 'list-item-react-states',
      language: 'tsx',
      label: 'The four the page states',
      source: `<ListItem selected />;
<ListItem current="page" />;
<ListItem loading />;
<ListItem disabled />;`,
    }),
  },
  {
    id: 'actions',
    title: 'Independent targets',
    note: 'The two targets are siblings, so the row hit area stops before the button. A disabled row refuses its own box and nothing else: the control beside it is the page own to disable.',
    snippet: defineSnippet({
      id: 'list-item-react-actions-scene',
      language: 'tsx',
      label: 'A row that navigates and also deletes',
      source: `<ListItem>
  <ListItemLink href={folder.href}>{folder.name}</ListItemLink>
  <ListItemActions>
    <Button aria-label="Remove" onClick={remove} variant="ghost" />
  </ListItemActions>
</ListItem>;`,
    }),
  },
  {
    id: 'reflow',
    title: 'The row answers its own width',
    note: 'Below 22rem the metadata sits under the title and the independent targets take a line of their own, because a target never shrinks and the box beside it would shrink instead. The container is the row and not the set.',
    snippet: defineSnippet({
      id: 'list-item-reflow-container',
      language: 'css',
      label: 'The one literal the syntax forces',
      source: `@container slotted-list-item (max-inline-size: 22rem) {
  /* the metadata moves under the title */
}`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An unbroken token breaks inside the row; a translated title gives way and the timestamp does not; a title in another script keeps its own direction and leaves the row around it alone.',
    snippet: defineSnippet({
      id: 'list-item-react-content-scene',
      language: 'tsx',
      label: 'A title the row cannot grow for',
      source: `<ListItem truncate>
  <ListItemContent>
    <ListItemBody>
      <ListItemLabel>{message.subject}</ListItemLabel>
    </ListItemBody>
  </ListItemContent>
</ListItem>;`,
    }),
  },
  {
    id: 'composition',
    title: 'The families beside it',
    note: 'Checkbox announces the selection the row paints, Badge carries the count, Button is the independent target, Icon is the leading visual. The row draws none of the four.',
    snippet: defineSnippet({
      id: 'list-item-react-composition-scene',
      language: 'tsx',
      label: 'A row of an inbox',
      source: `<ListItem selected>
  <ListItemContent>
    <ListItemStart>
      <Checkbox aria-label="Select" checked />
    </ListItemStart>
    <ListItemBody>
      <ListItemLabel>Quarterly report</ListItemLabel>
    </ListItemBody>
    <ListItemEnd>
      <Badge tone="accent">3</Badge>
    </ListItemEnd>
  </ListItemContent>
</ListItem>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the platform already does',
    note: 'The family binds no key. A disabled button leaves the tab sequence, while a disabled link stays in it and refuses the activation — which is what keeps its description reachable to a reader.',
    snippet: defineSnippet({
      id: 'list-item-react-keyboard',
      language: 'tsx',
      label: 'A destination that is unavailable, and still reachable',
      source: `<ListItem disabled>
  <ListItemLink href="/exports">
    <ListItemBody>
      <ListItemLabel>Exports</ListItemLabel>
      <ListItemDescription>Unavailable while the index rebuilds</ListItemDescription>
    </ListItemBody>
  </ListItemLink>
</ListItem>;`,
    }),
  },
];

export const REACT_LIST_ITEM_DOCS = {
  listItem: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'tone',
        "'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'ListItem',
        'The row ink, the wash under the pointer and the ground of a selected row. It never fills a resting row',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'ListItem',
        'The room the row gets. Falls back to the list, then the provider',
      ],
      [
        'align',
        "'center' | 'start'",
        'center',
        'ListItem',
        'Where the leading visual and the metadata sit against a row of more than one line',
      ],
      [
        'inset',
        'boolean',
        'false',
        'ListItem',
        'Takes the row inline padding away. Falls back to the list, then the provider',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'ListItem',
        'Clips the title and the lines under it to one line each. The whole string stays in the document',
      ],
      [
        'selected',
        'boolean',
        'false',
        'ListItem',
        'Mirrors a selection the page owns. The Checkbox in ListItemStart is what announces it',
      ],
      [
        'current',
        "boolean | 'page' | 'step' | 'location' | 'date' | 'time'",
        'false',
        'ListItem',
        'The row the reader is on, written as aria-current — the one state of this shape a listitem may announce',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'ListItem',
        'The row dims and refuses the activation. The attribute goes on the box, never on the li',
      ],
      [
        'loading',
        'boolean',
        'false',
        'ListItem',
        'aria-busy on the box and the activation withdrawn. The width and the accessible name are kept',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        '—',
        'ListItem',
        'How the rows are told apart. Falls back to the list, then to plain',
      ],
      [
        'marker',
        "'none' | 'bullet' | 'number'",
        '—',
        'ListItem',
        'What is painted in the marker column. Falls back to the list, then to none',
      ],
      [
        'position / setSize',
        'number',
        '—',
        'ListItem',
        'aria-posinset and aria-setsize, written only when the page knows them',
      ],
      [
        'href',
        'string',
        '—',
        'ListItemLink',
        'The destination of a row that is one destination, on the anchor that is the row box',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button',
        'ListItemButton',
        'The button own type, so a row inside a form can submit it',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Renders the wiring into another element — a router link, a heading, a label',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element props',
      ],
      [
        'ListItemDefaultsProvider',
        '{ tone, size, align, inset, truncate }',
        '—',
        'a subtree',
        'Sets the five once for every row under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'The row is an li, and ARIA 1.2 is unusually specific about what a listitem may carry: aria-level, aria-posinset and aria-setsize are supported, aria-current and aria-busy are inherited, and aria-disabled, aria-invalid, aria-errormessage and aria-haspopup are deprecated on the role.',
      'disabled is therefore painted from data-disabled on the row while the attribute that means it goes on the box — the native disabled on a button, aria-disabled on a link. No surveyed implementation makes the distinction; MUI writes aria-disabled on the row, where it is deprecated.',
      'A disabled link keeps its destination in the document. aria-disabled means perceivable but not operable and leaves the element focusable, so a reader can still reach the row and hear the description that says why it is unavailable; the activation is refused instead, which covers both a pointer and Enter.',
      'selected is painted and never announced, because aria-selected is not valid on a listitem. The control the page composes into ListItemStart — a Checkbox — is what carries the state for assistive technology, and a collection that moves a selection with the keyboard is Listbox or Table rather than this family.',
      'current is announced, with aria-current and the token the page states. It is the one selection-shaped state the roles model lets a listitem say for itself, and page is what a navigation list wants.',
      'position and setSize are written only when the page states them. ARIA 1.2 says both are unnecessary while every row is in the document and necessary the moment only part of the set is, so writing them always would make a filtered list disagree with itself.',
      'ListItemActions is a sibling of the box and never its child, because interactive content may not nest inside an a or a button. A row that navigates and also deletes has to place its two targets side by side, and this is the arrangement the parts express.',
      'A control inside ListItemActions is the page own to disable. A disabled row refuses its own box and nothing else: only the control can refuse its own interaction.',
      'The row binds no key. Enter on a link, Enter and Space on a button, and the modified click a browser gives an anchor are the platform own behaviour, and Tab reaches the box and every control beside it.',
      'The focus ring is drawn inside the row rather than around it, because a row runs the full width of its set: an outward ring on the first row of a framed list is drawn under the frame, and on the last row it is drawn outside the page.',
      'Selection is said with a fill and an edge together. Every tone surface is the page own white in the high-contrast scheme, so a selection said with a fill alone is a selection that scheme cannot show.',
      'The title isolates its own direction, so a title in another script does not reorder the row around it, and breaks a single unbroken token rather than pushing the metadata out of the row.',
    ],
    snippets: [
      defineSnippet({
        id: 'list-item-react-anatomy',
        language: 'tsx',
        label: 'The row, and the box inside it',
        source:
          '<ListItem>\n  <ListItemContent>\n    <ListItemStart>\n      <Icon>\n        <FolderIcon />\n      </Icon>\n    </ListItemStart>\n    <ListItemBody>\n      <ListItemLabel>Photos</ListItemLabel>\n      <ListItemDescription>128 files · 2.4 GB</ListItemDescription>\n    </ListItemBody>\n    <ListItemEnd>Yesterday</ListItemEnd>\n  </ListItemContent>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-elements',
        language: 'tsx',
        label: 'Three boxes, three accessibility trees',
        source:
          '<ListItem>\n  <ListItemContent>A row that is read</ListItemContent>\n</ListItem>;\n\n<ListItem>\n  <ListItemButton onClick={publish}>A row that is one command</ListItemButton>\n</ListItem>;\n\n<ListItem>\n  <ListItemLink href="/photos">A row that is one destination</ListItemLink>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-actions',
        language: 'tsx',
        label: 'A row that navigates and also deletes',
        source:
          '<ListItem>\n  <ListItemLink href={folder.href}>\n    <ListItemBody>\n      <ListItemLabel>{folder.name}</ListItemLabel>\n    </ListItemBody>\n  </ListItemLink>\n  <ListItemActions>\n    <Button aria-label={`Remove ${folder.name}`} onClick={() => remove(folder)} variant="ghost">\n      <Icon>\n        <TrashIcon />\n      </Icon>\n    </Button>\n  </ListItemActions>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-selection',
        language: 'tsx',
        label: 'The row paints the selection; the Checkbox announces it',
        source:
          '<ListItem selected={picked.has(message.id)}>\n  <ListItemContent>\n    <ListItemStart>\n      <Checkbox\n        aria-label={`Select ${message.subject}`}\n        checked={picked.has(message.id)}\n        onCheckedChange={() => toggle(message.id)}\n      />\n    </ListItemStart>\n    <ListItemBody>\n      <ListItemLabel>{message.subject}</ListItemLabel>\n    </ListItemBody>\n  </ListItemContent>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-current',
        language: 'tsx',
        label: 'The row the reader is on',
        source:
          "<ListItem current={section.href === here ? 'page' : false}>\n  <ListItemLink href={section.href}>\n    <ListItemBody>\n      <ListItemLabel>{section.name}</ListItemLabel>\n    </ListItemBody>\n  </ListItemLink>\n</ListItem>;",
      }),
      defineSnippet({
        id: 'list-item-react-loading',
        language: 'tsx',
        label: 'A command that cannot be run twice',
        source:
          '<ListItem loading={publishing}>\n  <ListItemButton onClick={publish}>\n    <ListItemBody>\n      <ListItemLabel>Publish the changes</ListItemLabel>\n    </ListItemBody>\n  </ListItemButton>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-router',
        language: 'tsx',
        label: 'The destination, in the router own link',
        source:
          '<ListItem>\n  <ListItemLink href={to} render={(props) => <Link {...props} to={to} />}>\n    <ListItemBody>\n      <ListItemLabel>Billing</ListItemLabel>\n    </ListItemBody>\n  </ListItemLink>\n</ListItem>;',
      }),
      defineSnippet({
        id: 'list-item-react-defaults',
        language: 'tsx',
        label: 'One decision for every row in the application',
        source:
          '<ListItemDefaultsProvider align="start" truncate>\n  <Inbox />\n</ListItemDefaultsProvider>;',
      }),
    ],
  },
} as const;
