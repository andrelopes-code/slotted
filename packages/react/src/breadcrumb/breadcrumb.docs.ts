import breadcrumbTokens from '@slotted/styles/breadcrumb/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
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

export const REACT_BREADCRUMB_TOKENS = breadcrumbTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Breadcrumb decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Breadcrumb,\n  BreadcrumbDefaultsProvider,\n  BreadcrumbItem,\n  BreadcrumbLink,\n  BreadcrumbList,\n  BreadcrumbPage,\n  BreadcrumbTrigger,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav',
    required: true,
    purpose:
      'The navigation landmark and its name. Carries data-ui="breadcrumb", data-expanded, and data-collapsed with the count of folded crumbs, and owns the collapse.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose:
      'The ordered list, which is what carries the hierarchy and the set size. It decides which crumbs the collapse hides, by count and, with overflow="collapse", by its own width.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One ancestor, or the current page. It renders the separator after itself, and carries hidden while the collapse hides it.',
  },
  {
    part: 'link',
    element: 'a',
    required: false,
    purpose: 'An ancestor that can be reached. A plain anchor, substitutable through render.',
  },
  {
    part: 'page',
    element: 'span',
    required: false,
    purpose:
      'The page the reader is on, carrying aria-current="page". Text rather than a link, because a link to this page goes nowhere.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'A crumb that opens a menu of its siblings, with a chevron after its label. The menu is composed around it; current keeps aria-current="page" on the switcher of this page.',
  },
  {
    part: 'separator',
    element: 'span',
    required: false,
    purpose:
      'Drawn between two crumbs, never after the last, never announced. Empty by default, when the stylesheet draws a rotated rule; anything inside replaces it.',
  },
  {
    part: 'ellipsis',
    element: 'button',
    required: false,
    purpose:
      'What the collapse hides, in an item of its own in front of the first crumb that can fold, and the control that reveals it. Its accessible name carries the count.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every input on one trail, driven by the controls below the canvas. Lower maxItems and watch which crumbs survive the fold.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-playground',
      language: 'tsx',
      label: 'A trail above a page heading',
      source:
        '<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem>\n      <BreadcrumbLink href="/workspace">Workspace</BreadcrumbLink>\n    </BreadcrumbItem>\n    <BreadcrumbItem>\n      <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>\n    </BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>;',
    }),
  },
  {
    id: 'collapse',
    title: 'A trail that got too deep',
    note: 'Above maxItems the middle folds behind one button, and pressing it expands the trail in place — no overlay, and focus lands on the first crumb it revealed.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-collapse',
      language: 'tsx',
      label: 'Folding a seven-level trail',
      source:
        '<Breadcrumb maxItems={4} itemsBeforeCollapse={1} itemsAfterCollapse={2}>\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;\n\n// Or hold the choice yourself, and persist it.\n<Breadcrumb expanded={expanded} onExpandedChange={setExpanded}>\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;',
    }),
  },
  {
    id: 'separator',
    title: 'The mark between two crumbs',
    note: 'Empty, the stylesheet draws a rotated rule that mirrors in a right-to-left document. Anything you put in the separator replaces the drawing without replacing the element.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-separator',
      language: 'tsx',
      label: 'Replacing the drawn mark',
      source:
        '<Breadcrumb separator="›">\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;',
    }),
  },
  {
    id: 'current',
    title: 'The page you are on',
    note: 'The last crumb is a span carrying aria-current="page", which is the value the ARIA specification names for a link inside a set of pages. It gains weight rather than color alone.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-current',
      language: 'tsx',
      label: 'Ending the trail',
      source:
        '<BreadcrumbItem>\n  <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>\n</BreadcrumbItem>;',
    }),
  },
  {
    id: 'context',
    title: 'Above the page it describes',
    note: 'Where a trail actually lives: over a heading, at the type size of the interface rather than of the page title. It is not a back button, and it never stands in for one.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-context',
      language: 'tsx',
      label: 'A page header',
      source:
        '<header>\n  <Breadcrumb>\n    <BreadcrumbList>{levels}</BreadcrumbList>\n  </Breadcrumb>\n  <h1>INV-2026-08-0041</h1>\n</header>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the trail did not choose',
    note: 'A German compound, a pasted identifier with no break opportunity, and a single-crumb trail. The row wraps before anything truncates, and a truncated string stays in the accessible name.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-content',
      language: 'tsx',
      label: 'Long, translated and unbroken labels',
      source: '<BreadcrumbLink href="/settings">Zahlungsabwicklungseinstellungen</BreadcrumbLink>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'render substitutes any part for a router link or another element, and BreadcrumbDefaultsProvider decides the separator and the collapse for a whole application.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-composition',
      language: 'tsx',
      label: 'A router link, and defaults for the application',
      source:
        '<BreadcrumbLink href="/invoices" render={(props) => <RouterLink {...props} to={props.href} />}>\n  Invoices\n</BreadcrumbLink>;\n\n<BreadcrumbDefaultsProvider maxItems={5}>\n  <App />\n</BreadcrumbDefaultsProvider>;',
    }),
  },
  {
    id: 'switcher',
    title: 'Crumbs that switch between siblings',
    note: 'Organization, project and environment each open a menu of their siblings. The open one keeps its underline and turns its chevron, and the environment the reader is on still says it is this page.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-switcher',
      language: 'tsx',
      label: 'A crumb composed with Menu',
      source:
        '<BreadcrumbItem>\n  <Menu>\n    <MenuTrigger\n      render={(props) => (\n        <BreadcrumbTrigger {...props} current>\n          Production\n        </BreadcrumbTrigger>\n      )}\n    />\n    <MenuContent>\n      <MenuItem>Preview</MenuItem>\n      <MenuItem>Development</MenuItem>\n    </MenuContent>\n  </Menu>\n</BreadcrumbItem>;',
    }),
  },
  {
    id: 'overflow',
    title: 'A trail narrower than its crumbs',
    note: 'Drag the column narrower: the middle crumbs fold into the ellipsis from the one nearest the root, the first and the last two stay, and the ellipsis names how many it holds. overflow="wrap" breaks the row instead.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-overflow',
      language: 'tsx',
      label: 'Folding for want of width',
      source:
        '<Breadcrumb>\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;\n\n// Keep every crumb and let the row wrap.\n<Breadcrumb overflow="wrap">\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every crumb and the ellipsis; Enter follows a crumb; Enter or Space on the ellipsis expands the trail and moves focus to the first crumb it revealed. A switcher takes the keys of the menu composed on it.',
    snippet: defineSnippet({
      id: 'breadcrumb-react-keyboard',
      language: 'tsx',
      label: 'What each control announces',
      source:
        '// The landmark is named, the ellipsis says how many it hides,\n// and the last crumb says it is this page.\n<Breadcrumb aria-label="Breadcrumb" maxItems={4}>\n  <BreadcrumbList>{levels}</BreadcrumbList>\n</Breadcrumb>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onExpandedChange',
    payload: '(expanded: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the trail expands. The request carries the value it replaces, the reason — pointer or keyboard — and the originating event, and cancelling it commits nothing.',
  },
];

export const REACT_BREADCRUMB_DOCS = {
  breadcrumb: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'messages',
        'Partial<BreadcrumbMessages>',
        '—',
        'Breadcrumb',
        "Words laid over the language in force, key by key: the landmark's name (label) and the ellipsis (showHidden)",
      ],
      [
        'maxItems',
        'number',
        '8',
        'Breadcrumb',
        'The count above which the trail folds; 0 never folds',
      ],
      [
        'itemsBeforeCollapse',
        'number',
        '1',
        'Breadcrumb',
        'How many crumbs survive at the start of a folded trail',
      ],
      ['itemsAfterCollapse', 'number', '2', 'Breadcrumb', 'How many survive at its end'],
      [
        'expanded',
        'boolean',
        '—',
        'Breadcrumb',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultExpanded',
        'boolean',
        'false',
        'Breadcrumb',
        'What an uncontrolled trail starts from, read once',
      ],
      [
        'overflow',
        "'collapse' | 'wrap'",
        'collapse',
        'Breadcrumb',
        'What the trail does with crumbs its width cannot hold: fold the middle into the ellipsis, or wrap',
      ],
      [
        'separator',
        'ReactNode',
        '—',
        'Breadcrumb',
        'The mark between two crumbs. Absent, the stylesheet draws a rotated rule',
      ],
      [
        'href',
        'string',
        '—',
        'BreadcrumbLink',
        'The destination, and every other anchor attribute reaches the element unchanged',
      ],
      [
        'current',
        'boolean',
        'false',
        'BreadcrumbTrigger',
        'The switcher of the page the reader is on: writes aria-current="page" and takes the page weight',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the rendered element. Every data attribute is handed to it, so a router link keeps them.',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'every part', 'Reaches the element, and focus() with it'],
      [
        'useBreadcrumb()',
        '() => BreadcrumbContextValue',
        '—',
        'inside a Breadcrumb',
        'The collapse state and the request that moves it, for a control of your own',
      ],
      [
        'BreadcrumbDefaultsProvider',
        'maxItems | itemsBeforeCollapse | itemsAfterCollapse | overflow | separator',
        '—',
        'Application',
        'Sets those five once for everything below it; a prop on the trail still wins',
      ],
    ]),
    accessibility: [
      'The rendered elements are a nav and an ol, which is the whole of the APG Breadcrumb pattern: it lists no keyboard interaction, and the two attributes it does list — a name on the landmark and aria-current="page" on the last crumb — are written here rather than reimplemented.',
      'The current page is a span rather than a link, because a link to the page the reader is already on goes nowhere. The APG makes aria-current optional there; this family writes it anyway, so the end of the trail is announced as this page.',
      'The separator is never announced. It is drawn as geometry in CSS — a rotated rule, not a character and not a glyph — which is the same reasoning the APG example gives, and it mirrors from :dir(rtl) so a trail inside a left-to-right island leans the way that island reads.',
      'A crumb the collapse hides carries the hidden attribute, so it leaves the accessibility tree with the page. That is the cost of expanding in place rather than into an overlay, and it is paid by the ellipsis: its accessible name says how many crumbs it hides, and it carries aria-expanded.',
      'A crumb the width folds is hidden the same way, and the ellipsis counts it with the others. Hiding only the label of a narrow crumb would leave the link named by nothing but an aria-hidden icon; a folded crumb is out of the tree whole, and the ellipsis says so.',
      'A switcher is a button with aria-haspopup from the menu composed on it, and the switcher of this page keeps aria-current="page", so the end of the trail is still announced as the current page when it opens a menu.',
      'Pressing the ellipsis removes it, so focus is given to the first crumb it revealed. Focus on a removed element falls to the body, which is the defect that rule exists to prevent.',
      'A crumb wider than the trail truncates with an ellipsis, and the full string stays in the DOM and in the accessible name — the repository rule for every truncation.',
    ],
    snippets: [
      defineSnippet({
        id: 'breadcrumb-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<nav aria-label="Breadcrumb" data-part="root" data-ui="breadcrumb">\n  <ol data-part="list">\n    <li data-part="item">\n      <a data-part="link" href="/workspace">\n        Workspace\n      </a>\n      <span aria-hidden="true" data-part="separator" />\n    </li>\n    <li data-part="item">\n      <span aria-current="page" data-part="page">\n        INV-2026-08-0041\n      </span>\n    </li>\n  </ol>\n</nav>;',
      }),
      defineSnippet({
        id: 'breadcrumb-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='breadcrumb'] {\n  --slotted-breadcrumb-gap: 0.5rem;\n  --slotted-breadcrumb-separator-skew: 0deg;\n  --slotted-breadcrumb-item-measure: 18ch;\n}",
      }),
    ],
  },
} as const;
