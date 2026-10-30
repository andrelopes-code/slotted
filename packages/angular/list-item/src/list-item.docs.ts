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

export const ANGULAR_LIST_ITEM_TOKENS = listItemTokens.map((name) => ({
  name,
  purpose: 'Theme-owned List Item decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlListItem, SlListItemActions, SlListItemBody, SlListItemContent, SlListItemDescription, SlListItemEnd, SlListItemLabel, SlListItemStart } from '@slotted/angular/list-item';",
  selector:
    'li[slListItem], [slListItemContent], [slListItemStart], [slListItemBody], [slListItemLabel], [slListItemDescription], [slListItemEnd], [slListItemActions]',
  exportAs:
    'slListItem, slListItemContent, slListItemStart, slListItemBody, slListItemLabel, slListItemDescription, slListItemEnd, slListItemActions',
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
    note: 'One row with every input on it, driven by the controls below the canvas. Tab lands on the box and then on the control beside it; the family binds no key of its own.',
    snippet: defineSnippet({
      id: 'list-item-angular-playground',
      language: 'angular',
      label: 'A row, and the box inside it',
      source: `<li slListItem>
  <a slListItemContent href="/photos">
    <span slListItemBody><span slListItemLabel>Photos</span></span>
    <span slListItemEnd>Yesterday</span>
  </a>
</li>`,
    }),
  },
  {
    id: 'content-elements',
    title: 'One directive, three trees',
    note: 'The directive goes on the element the page wrote, so the router link, the form ownership and the modified click a browser gives an anchor all stay the page own.',
    snippet: defineSnippet({
      id: 'list-item-angular-content-elements',
      language: 'angular',
      label: 'The three the row chooses between',
      source: `<div slListItemContent></div>
<button slListItemContent type="button"></button>
<a slListItemContent [routerLink]="['/photos']"></a>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, and a row with almost none',
    note: 'Every part but the box is optional, and an absent one leaves no column behind: each gap is a margin on the part rather than a track on the grid. slListItemEnd takes metadata, inside the box; slListItemActions takes controls, beside it.',
    snippet: defineSnippet({
      id: 'list-item-angular-anatomy-scene',
      language: 'angular',
      label: 'Leading visual, title, lines, metadata, targets',
      source: `<li slListItem>
  <div slListItemContent>
    <span slListItemStart></span>
    <span slListItemBody>
      <span slListItemLabel>Photos</span>
      <span slListItemDescription>128 files</span>
    </span>
    <span slListItemEnd>Yesterday</span>
  </div>
  <span slListItemActions>
    <button slButton size="sm" variant="ghost" (click)="rename()">Rename</button>
    <button slButton size="sm" variant="ghost" (click)="remove()">Remove</button>
  </span>
</li>`,
    }),
  },
  {
    id: 'alignment',
    title: 'Where the leading visual sits',
    note: 'center is right while the block is one line and wrong as soon as it is three. start returns the mark and the metadata to the title own line, so a row of three lines reads from one corner.',
    snippet: defineSnippet({
      id: 'list-item-angular-alignment',
      language: 'angular',
      label: 'Two answers for a row of more than one line',
      source: `<li slListItem align="center"></li>
<li slListItem align="start"></li>`,
    }),
  },
  {
    id: 'tone',
    title: 'The five the theme carries',
    note: 'A tone moves the ink, the wash under the pointer and the ground of a selected row, and never fills a resting row: forty rows each filled with a tone is a list nobody can read.',
    snippet: defineSnippet({
      id: 'list-item-angular-tone',
      language: 'angular',
      label: 'A destructive row',
      source: `<li slListItem tone="danger">
  <button slListItemContent type="button" (click)="destroy()">Delete the workspace</button>
</li>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the row paints',
    note: 'Selection is the accent ground, the accent ink and a one-pixel edge together, because every tone surface is white in the high-contrast scheme. Current is the neutral ground with its own edge, so a row can be both at once and the selection is what shows without either of them being lost.',
    snippet: defineSnippet({
      id: 'list-item-angular-states',
      language: 'angular',
      label: 'The four the page states',
      source: `<li slListItem selected></li>
<li slListItem current="page"></li>
<li slListItem loading></li>
<li slListItem disabled></li>`,
    }),
  },
  {
    id: 'actions',
    title: 'Independent targets',
    note: 'The two targets are siblings, so the row hit area stops before the button. A disabled row refuses its own box and nothing else: the control beside it is the page own to disable.',
    snippet: defineSnippet({
      id: 'list-item-angular-actions-scene',
      language: 'angular',
      label: 'A row that navigates and also deletes',
      source: `<li slListItem>
  <a slListItemContent [routerLink]="folder.route">{{ folder.name }}</a>
  <span slListItemActions>
    <button slButton variant="ghost" (click)="remove(folder)">Remove</button>
  </span>
</li>`,
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
      id: 'list-item-angular-content-scene',
      language: 'angular',
      label: 'A title the row cannot grow for',
      source: `<li slListItem truncate>
  <div slListItemContent>
    <span slListItemBody>
      <span slListItemLabel>{{ message.subject }}</span>
    </span>
  </div>
</li>`,
    }),
  },
  {
    id: 'composition',
    title: 'The families beside it',
    note: 'slCheckbox announces the selection the row paints, slBadge carries the count, slButton is the independent target. The row draws none of the three.',
    snippet: defineSnippet({
      id: 'list-item-angular-composition-scene',
      language: 'angular',
      label: 'A row of an inbox',
      source: `<li slListItem selected>
  <div slListItemContent>
    <span slListItemStart>
      <span slCheckbox [checked]="true" aria-label="Select"></span>
    </span>
    <span slListItemBody>
      <span slListItemLabel>Quarterly report</span>
    </span>
    <span slListItemEnd><span slBadge tone="accent">3</span></span>
  </div>
</li>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the platform already does',
    note: 'The family binds no key. A disabled button leaves the tab sequence, while a disabled link stays in it and refuses the activation — which is what keeps its description reachable to a reader.',
    snippet: defineSnippet({
      id: 'list-item-angular-keyboard',
      language: 'angular',
      label: 'A destination that is unavailable, and still reachable',
      source: `<li slListItem disabled>
  <a slListItemContent href="/exports">
    <span slListItemBody>
      <span slListItemLabel>Exports</span>
      <span slListItemDescription>Unavailable while the index rebuilds</span>
    </span>
  </a>
</li>`,
    }),
  },
];

export const ANGULAR_LIST_ITEM_DOCS = {
  listItem: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'tone',
        "'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slListItem',
        'The row ink, the wash under the pointer and the ground of a selected row. It never fills a resting row',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slListItem',
        'The room the row gets. Falls back to the list, then the injected default',
      ],
      [
        'align',
        "'center' | 'start'",
        'center',
        'slListItem',
        'Where the leading visual and the metadata sit against a row of more than one line',
      ],
      [
        'inset',
        'boolean',
        'false',
        'slListItem',
        'Takes the row inline padding away. Falls back to the list, then the injected default',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'slListItem',
        'Clips the title and the lines under it to one line each. The whole string stays in the document',
      ],
      [
        'selected',
        'boolean',
        'false',
        'slListItem',
        'Mirrors a selection the page owns. The slCheckbox in slListItemStart is what announces it',
      ],
      [
        'current',
        "boolean | 'page' | 'step' | 'location' | 'date' | 'time'",
        'false',
        'slListItem',
        'The row the reader is on, written as aria-current — the one state of this shape a listitem may announce',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slListItem',
        'The row dims and refuses the activation. The attribute goes on the box, never on the li',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slListItem',
        'aria-busy on the box and the activation withdrawn. The width and the accessible name are kept',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        '—',
        'slListItem',
        'How the rows are told apart. Falls back to the list, then to plain',
      ],
      [
        'marker',
        "'none' | 'bullet' | 'number'",
        '—',
        'slListItem',
        'What is painted in the marker column. Falls back to the list, then to none',
      ],
      [
        'position / setSize',
        'number',
        '—',
        'slListItem',
        'aria-posinset and aria-setsize, written only when the page knows them',
      ],
      [
        'href / routerLink',
        'string | unknown[]',
        '—',
        'the element',
        'Not an input: slListItemContent goes on the anchor the page wrote, so the router link stays the page own',
      ],
      [
        'exportAs',
        'slListItem | slListItemContent | slListItemStart | slListItemBody | slListItemLabel | slListItemDescription | slListItemEnd | slListItemActions',
        '—',
        'every directive',
        'Reaches the instance from a template',
      ],
      [
        'provideListItemDefaults',
        '{ tone, size, align, inset, truncate }',
        '—',
        'an injector',
        'Sets the five once for every row under it; an explicit input still wins',
      ],
    ]),
    accessibility: [
      'The row is an li, and ARIA 1.2 is unusually specific about what a listitem may carry: aria-level, aria-posinset and aria-setsize are supported, aria-current and aria-busy are inherited, and aria-disabled, aria-invalid, aria-errormessage and aria-haspopup are deprecated on the role.',
      'disabled is therefore painted from data-disabled on the row while the attribute that means it goes on the box, and slListItemContent reads the element it is on to choose which: the native disabled on a button, aria-disabled on an anchor. No surveyed implementation makes the distinction; MUI writes aria-disabled on the row, where it is deprecated.',
      'A disabled link keeps its destination. aria-disabled means perceivable but not operable and leaves the element focusable, so a reader can still reach the row and hear the description that says why it is unavailable.',
      'The refusal is a capture listener on the row rather than a host listener on the box. A directive host listener and a click the page wrote sit on the same target and run in registration order, and the page own was registered first — a refusal on the box arrived after the handler it was meant to stop. A capture listener on an ancestor always runs first, and it refuses only what is inside the box.',
      'selected is painted and never announced, because aria-selected is not valid on a listitem. The slCheckbox the page composes into slListItemStart is what carries the state for assistive technology.',
      'current is announced, with aria-current and the token the page states. An aria-current the page wrote itself is read with HostAttributeToken and kept.',
      'position and setSize are written only when the page states them. ARIA 1.2 says both are unnecessary while every row is in the document and necessary the moment only part of the set is.',
      'slListItemActions is a sibling of the box and never its child, because interactive content may not nest inside an a or a button. A control inside it is the page own to disable: a disabled row refuses its own box and nothing else.',
      'The row binds no key. Enter on a link, Enter and Space on a button, and the modified click a browser gives an anchor are the platform own behavior.',
      'The focus ring is drawn inside the row rather than around it, because a row runs the full width of its set: an outward ring on the first row of a framed list is drawn under the frame.',
      'Selection is said with a fill and an edge together, because every tone surface is the page own white in the high-contrast scheme.',
      'The title isolates its own direction and breaks a single unbroken token rather than pushing the metadata out of the row.',
    ],
    snippets: [
      defineSnippet({
        id: 'list-item-angular-anatomy',
        language: 'angular',
        label: 'The row, and the box inside it',
        source:
          '<li slListItem>\n  <div slListItemContent>\n    <span slListItemStart><span slIcon [icon]="folder"></span></span>\n    <span slListItemBody>\n      <span slListItemLabel>Photos</span>\n      <span slListItemDescription>128 files · 2.4 GB</span>\n    </span>\n    <span slListItemEnd>Yesterday</span>\n  </div>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-elements',
        language: 'angular',
        label: 'One directive, on the element the page means',
        source:
          '<li slListItem><div slListItemContent>A row that is read</div></li>\n<li slListItem>\n  <button slListItemContent type="button" (click)="publish()">A row that is one command</button>\n</li>\n<li slListItem>\n  <a slListItemContent [routerLink]="[\'/photos\']">A row that is one destination</a>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-actions',
        language: 'angular',
        label: 'A row that navigates and also deletes',
        source:
          '<li slListItem>\n  <a slListItemContent [routerLink]="folder.route">\n    <span slListItemBody\n      ><span slListItemLabel>{{ folder.name }}</span></span\n    >\n  </a>\n  <span slListItemActions>\n    <button slButton variant="ghost" size="sm" (click)="remove(folder)">Remove</button>\n  </span>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-selection',
        language: 'angular',
        label: 'The row paints the selection; slCheckbox announces it',
        source:
          '<li slListItem [selected]="picked().has(message.id)">\n  <div slListItemContent>\n    <span slListItemStart>\n      <span\n        slCheckbox\n        [checked]="picked().has(message.id)"\n        (checkedChange)="toggle(message.id)"\n      ></span>\n    </span>\n    <span slListItemBody\n      ><span slListItemLabel>{{ message.subject }}</span></span\n    >\n  </div>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-current',
        language: 'angular',
        label: 'The row the reader is on',
        source:
          '<li slListItem [current]="section.route === here() ? \'page\' : false">\n  <a slListItemContent [routerLink]="section.route">\n    <span slListItemBody\n      ><span slListItemLabel>{{ section.name }}</span></span\n    >\n  </a>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-loading',
        language: 'angular',
        label: 'A command that cannot be run twice',
        source:
          '<li slListItem [loading]="publishing()">\n  <button slListItemContent type="button" (click)="publish()">\n    <span slListItemBody><span slListItemLabel>Publish the changes</span></span>\n  </button>\n</li>',
      }),
      defineSnippet({
        id: 'list-item-angular-defaults',
        language: 'ts',
        label: 'One decision for every row in the application',
        source:
          "bootstrapApplication(App, {\n  providers: [provideListItemDefaults({ align: 'start', truncate: true })],\n});",
      }),
    ],
  },
} as const;
