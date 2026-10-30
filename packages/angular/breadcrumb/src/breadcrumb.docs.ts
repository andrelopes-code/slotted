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

export const ANGULAR_BREADCRUMB_TOKENS = breadcrumbTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Breadcrumb decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlBreadcrumb,\n  SlBreadcrumbItem,\n  SlBreadcrumbLink,\n  SlBreadcrumbList,\n  SlBreadcrumbPage,\n  SlBreadcrumbTrigger,\n  provideBreadcrumbDefaults,\n} from '@slotted/angular/breadcrumb';",
  selector: 'nav[slBreadcrumb]',
  exportAs: 'slBreadcrumb',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav[slBreadcrumb], exportAs="slBreadcrumb"',
    required: true,
    purpose:
      'The consumer’s own nav, which is the navigation landmark and its name. Carries data-ui="breadcrumb", data-expanded, and data-collapsed with the count of folded crumbs, and owns the collapse.',
  },
  {
    part: 'list',
    element: 'ol[slBreadcrumbList], exportAs="slBreadcrumbList"',
    required: true,
    purpose:
      'The ordered list, which is what carries the hierarchy and the set size. It queries its items and tells each one whether it is last or hidden by the count, inserts the ellipsis’s item in front of the first crumb that can fold, and, with overflow="collapse", folds by its own width.',
  },
  {
    part: 'item',
    element: 'li[slBreadcrumbItem], exportAs="slBreadcrumbItem"',
    required: true,
    purpose:
      'One ancestor, or the current page. It renders the separator after itself, and carries hidden while the collapse hides it.',
  },
  {
    part: 'link',
    element: 'a[slBreadcrumbLink], exportAs="slBreadcrumbLink"',
    required: false,
    purpose:
      'An ancestor that can be reached. The directive sits on the consumer’s own anchor, so href and routerLink stay on the element they already belong to.',
  },
  {
    part: 'page',
    element: '[slBreadcrumbPage], exportAs="slBreadcrumbPage"',
    required: false,
    purpose:
      'The page the reader is on, carrying aria-current="page". Text rather than a link, because a link to this page goes nowhere.',
  },
  {
    part: 'trigger',
    element: 'button[slBreadcrumbTrigger], exportAs="slBreadcrumbTrigger"',
    required: false,
    purpose:
      'A crumb that opens a menu of its siblings, with a chevron after its label. slMenuTriggerFor composes on the same button; current keeps aria-current="page" on the switcher of this page.',
  },
  {
    part: 'separator',
    element: 'span',
    required: false,
    purpose:
      'Drawn between two crumbs, never after the last, never announced. Empty by default, when the stylesheet draws a rotated rule; a TemplateRef passed to the trail replaces it.',
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
      id: 'breadcrumb-angular-playground',
      language: 'angular',
      label: 'A trail above a page heading',
      source:
        '<nav slBreadcrumb>\n  <ol slBreadcrumbList>\n    <li slBreadcrumbItem><a slBreadcrumbLink href="/workspace">Workspace</a></li>\n    <li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>\n  </ol>\n</nav>',
    }),
  },
  {
    id: 'collapse',
    title: 'A trail that got too deep',
    note: 'Above maxItems the middle folds behind one button, and pressing it expands the trail in place — no overlay, and focus lands on the first crumb it revealed.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-collapse',
      language: 'angular',
      label: 'Folding a six-level trail',
      source:
        '<nav slBreadcrumb [maxItems]="4" [itemsBeforeCollapse]="1" [itemsAfterCollapse]="2">\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>\n\n<!-- Or hold the choice yourself, and persist it. -->\n<nav slBreadcrumb [expanded]="open()" (expandedChange)="open.set($event.value)">\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>',
    }),
  },
  {
    id: 'separator',
    title: 'The mark between two crumbs',
    note: 'Empty, the stylesheet draws a rotated rule that mirrors in a right-to-left document. A TemplateRef replaces the drawing without replacing the element.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-separator',
      language: 'angular',
      label: 'Replacing the drawn mark',
      source:
        '<ng-template #mark>›</ng-template>\n\n<nav slBreadcrumb [separator]="mark">\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>',
    }),
  },
  {
    id: 'current',
    title: 'The page you are on',
    note: 'The last crumb carries aria-current="page", which is the value the ARIA specification names for a link inside a set of pages. It gains weight rather than colour alone.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-current',
      language: 'angular',
      label: 'Ending the trail',
      source: '<li slBreadcrumbItem><span slBreadcrumbPage>INV-2026-08-0041</span></li>',
    }),
  },
  {
    id: 'context',
    title: 'Above the page it describes',
    note: 'Where a trail actually lives: over a heading, at the type size of the interface rather than of the page title. It is not a back button, and it never stands in for one.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-context',
      language: 'angular',
      label: 'A page header',
      source:
        '<header>\n  <nav slBreadcrumb>\n    <ol slBreadcrumbList>\n      ...\n    </ol>\n  </nav>\n  <h1>INV-2026-08-0041</h1>\n</header>',
    }),
  },
  {
    id: 'content',
    title: 'Content the trail did not choose',
    note: 'A German compound, a pasted identifier with no break opportunity, and a single-crumb trail. The row wraps before anything truncates, and a truncated string stays in the accessible name.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-content',
      language: 'angular',
      label: 'Long, translated and unbroken labels',
      source:
        '<li slBreadcrumbItem>\n  <a slBreadcrumbLink href="/settings">Zahlungsabwicklungseinstellungen</a>\n</li>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The directives sit on the consumer’s own elements, so routerLink composes on the same anchor, and provideBreadcrumbDefaults decides the separator and the collapse for a whole application.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-composition',
      language: 'ts',
      label: 'Defaults for the application',
      source:
        'bootstrapApplication(App, {\n  providers: [provideBreadcrumbDefaults({ maxItems: 5 })],\n});',
    }),
  },
  {
    id: 'switcher',
    title: 'Crumbs that switch between siblings',
    note: 'Organisation, ledger and period each open a menu of their siblings. The open one keeps its underline and turns its chevron, and the period the reader is on still says it is this page.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-switcher',
      language: 'angular',
      label: 'A crumb composed with sl-menu',
      source:
        '<li slBreadcrumbItem>\n  <button slBreadcrumbTrigger current [slMenuTriggerFor]="periods">August 2026</button>\n  <sl-menu #periods>\n    <button slMenuItem>July 2026</button>\n    <button slMenuItem>August 2026</button>\n  </sl-menu>\n</li>',
    }),
  },
  {
    id: 'overflow',
    title: 'A trail narrower than its crumbs',
    note: 'Drag the column narrower: the middle crumbs fold into the ellipsis from the one nearest the root, the first and the last two stay, and the ellipsis names how many it holds. overflow="wrap" breaks the row instead.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-overflow',
      language: 'angular',
      label: 'Folding for want of width',
      source:
        '<nav slBreadcrumb>\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>\n\n<!-- Keep every crumb and let the row wrap. -->\n<nav slBreadcrumb overflow="wrap">\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every crumb and the ellipsis; Enter follows a crumb; Enter or Space on the ellipsis expands the trail and moves focus to the first crumb it revealed. A switcher takes the keys of the menu composed on it.',
    snippet: defineSnippet({
      id: 'breadcrumb-angular-keyboard',
      language: 'angular',
      label: 'What each control announces',
      source:
        '<!-- The landmark is named, the ellipsis says how many it hides,\n     and the last crumb says it is this page. -->\n<nav slBreadcrumb aria-label="Breadcrumb" [maxItems]="4">\n  <ol slBreadcrumbList>\n    ...\n  </ol>\n</nav>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'expandedChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the trail expands. The request carries the value it replaces, the reason — pointer or keyboard — and the originating event, and cancelling it commits nothing. It is not the second half of [(expanded)]: one slot can carry none of those.',
  },
];

export const ANGULAR_BREADCRUMB_DOCS = {
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
        'slBreadcrumb',
        'Words laid over the language in force, key by key: the landmark’s name (label) and the ellipsis (showHidden)',
      ],
      [
        'maxItems',
        'number',
        '8',
        'slBreadcrumb',
        'The count above which the trail folds; 0 never folds',
      ],
      [
        'itemsBeforeCollapse',
        'number',
        '1',
        'slBreadcrumb',
        'How many crumbs survive at the start of a folded trail',
      ],
      ['itemsAfterCollapse', 'number', '2', 'slBreadcrumb', 'How many survive at its end'],
      [
        'expanded',
        'boolean | undefined',
        '—',
        'slBreadcrumb',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultExpanded',
        'boolean',
        'false',
        'slBreadcrumb',
        'What an uncontrolled trail starts from, read once',
      ],
      [
        'overflow',
        "'collapse' | 'wrap'",
        'collapse',
        'slBreadcrumb',
        'What the trail does with crumbs its width cannot hold: fold the middle into the ellipsis, or wrap',
      ],
      [
        'separator',
        'TemplateRef<unknown>',
        '—',
        'slBreadcrumb',
        'The mark between two crumbs, rendered once per item. Absent, the stylesheet draws a rotated rule',
      ],
      [
        'href, routerLink',
        'attribute or directive',
        '—',
        'slBreadcrumbLink',
        'The consumer’s own destination on the consumer’s own anchor; the directive claims none',
      ],
      [
        'current',
        'boolean',
        'false',
        'slBreadcrumbTrigger',
        'The switcher of the page the reader is on: writes aria-current="page" and takes the page weight',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs="slBreadcrumb"',
        'template reference',
        '—',
        'Template',
        'Reaches the trail, for a template that needs to read the collapse or expand it from a control of its own',
      ],
      [
        'routerLink, routerLinkActive',
        'directive',
        '—',
        'The same anchor',
        'The link directive claims no destination, so the router writes href on the anchor it already owns',
      ],
      [
        'ng-content',
        'projection',
        '—',
        'every part',
        'Each part projects the content the consumer wrote; only the separator, the ellipsis and a switcher’s chevron are rendered by the family',
      ],
      [
        'slMenuTriggerFor',
        'directive',
        '—',
        'button[slBreadcrumbTrigger]',
        'Composes a menu on the switcher’s own button; the part it would erase is written back after the first render',
      ],
      [
        'provideBreadcrumbDefaults',
        'maxItems | itemsBeforeCollapse | itemsAfterCollapse | overflow | separator',
        '—',
        'Application',
        'Sets those five once for the whole injector; an input on the trail still wins',
      ],
    ]),
    accessibility: [
      'The rendered elements are the consumer’s own nav and ol, which is the whole of the APG Breadcrumb pattern: it lists no keyboard interaction, and the two attributes it does list — a name on the landmark and aria-current="page" on the last crumb — are written here rather than reimplemented.',
      'A static aria-label the consumer wrote on the nav survives the host binding, read once through HostAttributeToken, so the family never overwrites a name an application already chose.',
      'The current page is a span rather than a link, because a link to the page the reader is already on goes nowhere. The APG makes aria-current optional there; this family writes it anyway, so the end of the trail is announced as this page.',
      'The separator is never announced. It is drawn as geometry in CSS — a rotated rule, not a character and not a glyph — which is the same reasoning the APG example gives, and it mirrors from :dir(rtl) so a trail inside a left-to-right island leans the way that island reads.',
      'A crumb the collapse hides carries the hidden attribute, so it leaves the accessibility tree with the page. That is the cost of expanding in place rather than into an overlay, and it is paid by the ellipsis: its accessible name says how many crumbs it hides, and it carries aria-expanded.',
      'A crumb the width folds is hidden the same way, and the ellipsis counts it with the others. Hiding only the label of a narrow crumb would leave the link named by nothing but an aria-hidden icon; a folded crumb is out of the tree whole, and the ellipsis says so.',
      'A switcher is a button with aria-haspopup from the menu composed on it, and the switcher of this page keeps aria-current="page", so the end of the trail is still announced as the current page when it opens a menu.',
      'Pressing the ellipsis removes it, so focus is given to the first crumb it revealed — after the next render rather than after a microtask, because that crumb is still hidden while the handler runs. Focus on a removed element falls to the body, which is the defect that rule exists to prevent.',
      'A crumb wider than the trail truncates with an ellipsis, and the full string stays in the DOM and in the accessible name — the repository rule for every truncation.',
    ],
    snippets: [
      defineSnippet({
        id: 'breadcrumb-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<nav aria-label="Breadcrumb" data-part="root" data-ui="breadcrumb">\n  <ol data-part="list">\n    <li data-part="item">\n      <a data-part="link" href="/workspace">Workspace</a>\n      <span aria-hidden="true" data-part="separator"></span>\n    </li>\n    <li data-part="item">\n      <span aria-current="page" data-part="page">INV-2026-08-0041</span>\n    </li>\n  </ol>\n</nav>',
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
