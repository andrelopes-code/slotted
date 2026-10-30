import resultStateTokens from '@slotted/styles/result-state/tokens.json';
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

export const ANGULAR_RESULT_STATE_TOKENS = resultStateTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Result State decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideResultStateDefaults,\n  SlResultState,\n  SlResultStateActions,\n  SlResultStateContent,\n  SlResultStateDescription,\n  SlResultStateFooter,\n  SlResultStateMedia,\n  SlResultStateTitle,\n} from '@slotted/angular/result-state';",
  selector: '[slResultState]',
  exportAs: 'slResultState',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section, the element the directive is written on',
    required: true,
    purpose:
      'The region. Carries data-ui="result-state", the four axes and tabindex="-1". A section named by its own title is a region landmark a reader can jump to; unnamed it is a plain grouping element that costs nothing.',
  },
  {
    part: 'media',
    element: 'div, rendered by the directive',
    required: false,
    purpose:
      'The page’s glyph or its own artwork, hidden from assistive technology. An element carrying slResultStateMedia is projected into it and keeps the height the reach gives it, so artwork that has not loaded moves nothing when it arrives. With illustration set, the family draws a tile, a stack or a stack of cards around the glyph. Empty, the stylesheet withdraws it, except under cards, which draws its lines without a glyph.',
  },
  {
    part: 'content',
    element: 'the element slResultStateContent is written on',
    required: true,
    purpose:
      'The title and the description, and nothing else. This is the live region: role="status" or role="alert" is written here, so the buttons beside it are outside what a reader hears.',
  },
  {
    part: 'title',
    element: 'the element slResultStateTitle is written on — a div, or an h2',
    required: false,
    purpose:
      'The message’s name, and the region’s: the root points aria-labelledby at it. The element is the page’s, because a heading belongs in the document outline and only the page knows whether this message does. An id the page writes is kept, and the root points at that one instead.',
  },
  {
    part: 'description',
    element: 'the element slResultStateDescription is written on — a p',
    required: false,
    purpose:
      'What to do next. It breaks a string no language can break — a resource id, a host name without a hyphen — rather than overflowing, and removes nothing from the DOM to do it.',
  },
  {
    part: 'actions',
    element: 'the element slResultStateActions is written on',
    required: false,
    purpose:
      'The controls that get the reader out of the situation, outside the live region. They stack below a container width of 20rem, and at inline reach they sit on the message’s own first line.',
  },
  {
    part: 'footer',
    element: 'the element slResultStateFooter is written on',
    required: false,
    purpose:
      'The line under the actions: the documentation link that is not a call to action. Set one step down and in the muted role, because it is neither of the buttons above it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One region with every axis on it, driven by the controls below the canvas. Change the status and the mark changes with it, which is what makes the seven distinguishable in greyscale.',
    snippet: defineSnippet({
      id: 'result-state-angular-playground',
      language: 'angular',
      label: 'A region that stands in for content',
      source:
        '<section slResultState status="empty">\n  <div slResultStateContent>\n    <div slResultStateTitle>No projects yet</div>\n    <p slResultStateDescription>Create a project to start collecting runs.</p>\n  </div>\n  <div slResultStateActions>\n    <button slButton type="button">Create project</button>\n  </div>\n</section>',
    }),
  },
  {
    id: 'statuses',
    title: 'What the region is reporting',
    note: 'Seven semantics, seven silhouettes. Read in greyscale, or under forced colours where every ground becomes one system colour, the shape is the only thing left telling an absent collection from a failed request.',
    snippet: defineSnippet({
      id: 'result-state-angular-statuses',
      language: 'angular',
      label: 'The seven, and what each one says',
      source:
        '<!-- empty: the collection exists and holds nothing. -->\n<!-- no-results: a query or a filter matched nothing. -->\n<!-- not-found: the thing that was asked for is not here. -->\n<!-- error: a failure the reader can act on. -->\n<!-- forbidden: the reader is not allowed to see it. -->\n<!-- offline: the connection is gone. -->\n<!-- success: the flow finished and there is nothing left to do. -->\n<section slResultState status="no-results"></section>',
    }),
  },
  {
    id: 'reach',
    title: 'How far the region reaches',
    note: 'A row inside a table cell, a panel inside a card, the whole route — the same three words alert uses. The mark is the title’s own size at every reach and stands over the title at section and page; at inline it sits on the message’s first line and the actions join it, and at page the title takes the top step of the type scale.',
    snippet: defineSnippet({
      id: 'result-state-angular-reach',
      language: 'angular',
      label: 'The same region at three scopes',
      source:
        '<section slResultState reach="inline" status="no-results">\n  <div slResultStateContent>\n    <div slResultStateTitle>No rows match the filter</div>\n  </div>\n  <div slResultStateActions>\n    <button slButton size="sm" variant="ghost" type="button">Clear filters</button>\n  </div>\n</section>\n\n<section slResultState reach="page" status="not-found"></section>',
    }),
  },
  {
    id: 'align',
    title: 'Centred, or from the inline edge',
    note: 'Carbon left-aligns its empty states inside data-dense views and the other six surveyed implementations centre unconditionally. Both readings are real, and align is one axis rather than a second family.',
    snippet: defineSnippet({
      id: 'result-state-angular-align',
      language: 'angular',
      label: 'The two readings',
      source:
        '<!-- The default, for a panel or a route. -->\n<section slResultState align="center"></section>\n\n<!-- For a data-dense screen, where a centred column reads as an interruption. -->\n<section slResultState align="start" reach="inline"></section>',
    }),
  },
  {
    id: 'media',
    title: 'The page’s own illustration',
    note: 'The box is sized before anything is in it, so an illustration that has not loaded reserves the space it will occupy and the title below it never moves. Atlassian spends four props on that and Polaris a skeleton with an effect.',
    snippet: defineSnippet({
      id: 'result-state-angular-media',
      language: 'angular',
      label: 'A region with an illustration, and one without',
      source:
        '<!-- A title, a description and an action: the family draws no picture. -->\n<section slResultState status="offline"></section>\n\n<!-- The page draws its own, in the box the family keeps. -->\n<section slResultState>\n  <img slResultStateMedia alt="" src="/illustrations/boards.svg" />\n</section>\n\n<!-- Or named in CSS, for a page that skins its states in the theme:\n     [data-ui="result-state"][data-status="offline"] > [data-part="media"] {\n       display: block;\n       --slotted-result-state-media: url("/illustrations/offline.svg");\n     } -->',
    }),
  },
  {
    id: 'illustration',
    title: 'A drawing around the page’s glyph',
    note: 'Three drawings in the neutral surface and border roles — a framed tile, three layers leaning back, a stack of cards — made around the projected glyph. None takes a tone, and inline reach draws none. A region that announces assembles its drawing as it arrives; under reduced motion it arrives assembled.',
    snippet: defineSnippet({
      id: 'result-state-angular-illustration',
      language: 'angular',
      label: 'The three drawings, and the stack of cards without a glyph',
      source:
        '<section slResultState illustration="stack">\n  <span slIcon slResultStateMedia><svg slGlyph name="bell"></svg></span>\n  <div slResultStateContent>\n    <div slResultStateTitle>No alerts configured</div>\n  </div>\n</section>\n\n<!-- A framed tile, and a stack of cards standing in for rows. -->\n<section slResultState illustration="tile">\n  <span slIcon slResultStateMedia><svg slGlyph name="inbox"></svg></span>\n</section>\n<section slResultState illustration="cards">\n  <span slIcon slResultStateMedia><svg slGlyph name="file-text"></svg></span>\n</section>\n\n<!-- The cards draw their two lines with no glyph at all. -->\n<section slResultState illustration="cards"></section>',
    }),
  },
  {
    id: 'actions',
    title: 'The way out of the situation',
    note: 'The controls are the consumer’s own buttons in a part outside the live region — a reader hearing the message is not read two button labels in the middle of it. Narrow the window past 20rem and watch them stack.',
    snippet: defineSnippet({
      id: 'result-state-angular-actions',
      language: 'angular',
      label: 'Two controls, a link that is not one, and a retry in flight',
      source:
        '<section slResultState status="error">\n  <div slResultStateContent>\n    <div slResultStateTitle>The run failed</div>\n  </div>\n  <div slResultStateActions>\n    <button slButton tone="danger" [loading]="retrying()" type="button">Try again</button>\n    <button slButton variant="outline" type="button">Open log</button>\n  </div>\n  <div slResultStateFooter>\n    <a slLink href="/docs/retries">How retries are counted</a>\n  </div>\n</section>',
    }),
  },
  {
    id: 'live',
    title: 'What a reader hears, and when',
    note: 'polite by default, which is where this family and alert disagree: WCAG 2.2 SC 4.1.3 names “No results returned” as its own example of a status message. Press the button and the region arrives while the reader is elsewhere.',
    snippet: defineSnippet({
      id: 'result-state-angular-live',
      language: 'angular',
      label: 'The default, the loud one, and the opt-out',
      source:
        '<!-- The default. role="status" on the text, which implies aria-live and\n     aria-atomic; the buttons beside it are outside the region. -->\n<section slResultState live="polite" status="no-results"></section>\n\n<!-- role="alert", for a failure the reader has to hear now. -->\n<section slResultState live="assertive" status="error"></section>\n\n<!-- Off, when the page already owns a live region around this one. -->\n<section slResultState live="off"></section>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German compound with no break opportunity, a digest no language can break, a title standing alone and a region with no mark — all in a column narrow enough to make each of them a problem.',
    snippet: defineSnippet({
      id: 'result-state-angular-content',
      language: 'angular',
      label: 'Long, unbreakable, and bare',
      source:
        '<section slResultState status="error">\n  <div slResultStateContent>\n    <div slResultStateTitle>{{ longTranslatedTitle }}</div>\n    <p slResultStateDescription>Run {{ digest }} failed.</p>\n  </div>\n</section>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'Measure belongs to container and the frame to card, so the region caps nothing and draws no box: these two elements are what a consumer writes instead. provideResultStateDefaults sets the axes once for a whole application.',
    snippet: defineSnippet({
      id: 'result-state-angular-composition',
      language: 'ts',
      label: 'The defaults an application sets once, and the element a page picks',
      source:
        'bootstrapApplication(App, {\n  providers: [provideResultStateDefaults({ align: \'start\', reach: \'inline\' })],\n});\n\n// In a template: the measure, the frame, and a title that is a heading.\n// <div slContainer size="measure">\n//   <section slResultState reach="page">\n//     <div slResultStateContent><h2 slResultStateTitle>…</h2></div>\n//   </section>\n// </div>',
    }),
  },
  {
    id: 'accessibility',
    title: 'The landmark, the region and the keyboard',
    note: 'Tab past the region and then send the keyboard into it: the box is a landmark a reader can jump to, the text is the only thing that announces, and nothing moves focus unless the application asks.',
    snippet: defineSnippet({
      id: 'result-state-angular-accessibility',
      language: 'angular',
      label: 'What each of these produces in the tree',
      source:
        '<!-- A region landmark named "Nada corresponde ao filtro", holding a polite\n     status region. The button is outside it. -->\n<section slResultState #region="slResultState" live="polite">\n  <div slResultStateContent>\n    <div slResultStateTitle>Nada corresponde ao filtro</div>\n  </div>\n  <div slResultStateActions>\n    <button slButton type="button">Limpar filtros</button>\n  </div>\n</section>\n\n<!-- The application decides when the keyboard goes there. The family never does. -->\n<button (click)="region.focus()" type="button">Ir para a mensagem</button>',
    }),
  },
];

export const ANGULAR_RESULT_STATE_DOCS = {
  resultState: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'status',
        "'empty' | 'no-results' | 'not-found' | 'error' | 'forbidden' | 'offline' | 'success'",
        'empty',
        'slResultState',
        'What the region is reporting, written on the root as data-status for a page to key its own artwork on. The family paints nothing for it (RS1): what happened is in the title',
      ],
      [
        'reach',
        "'inline' | 'section' | 'page'",
        'section',
        'slResultState',
        'The scope the message applies to. inline is a row for a table cell and draws no illustration; page takes the top step of the type scale and draws the illustration half again as large',
      ],
      [
        'align',
        "'center' | 'start'",
        'center',
        'slResultState',
        'Whether the region reads centred or from the inline edge. start is for a data-dense screen, where a centred column reads as an interruption',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'polite',
        'slResultState',
        'Whether the text announces itself. polite writes role="status" on the content part and assertive writes role="alert"; both imply aria-live and aria-atomic, and neither is written on the box',
      ],
      [
        'illustration',
        "'none' | 'tile' | 'stack' | 'cards'",
        'none',
        'slResultState',
        'The drawing the family makes around the projected slResultStateMedia, in the neutral surface and border roles and never in a tone. tile and stack frame a glyph and draw nothing without one; cards draws its lines with or without it; none draws nothing of the family’s own',
      ],
      [
        'slResultStateMedia',
        'directive',
        '—',
        'a projected element',
        'The glyph an illustration is drawn around, or artwork the page supplies under illustration="none". It is projected into the box the family draws, so it keeps the height the reach gives it. React passes a media node instead',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        'slResultState',
        '—',
        'slResultState',
        'Reaches the instance from the template, which is what focus() is called on. It is the reach a template has and React does not: JSX re-renders an input, and a template calls a method',
      ],
      [
        'focus()',
        '() => void',
        '—',
        'slResultState',
        'Sends the keyboard to the region, which carries tabindex="-1". It is the whole imperative surface: the family never moves focus by itself, because moving it unprompted is a change of context nobody asked for',
      ],
      [
        'id',
        'string',
        '—',
        'slResultStateTitle',
        'An identifier the page writes is read with HostAttributeToken before the host binding, kept, and pointed at by the root’s aria-labelledby',
      ],
      [
        'provideResultStateDefaults',
        '(defaults: Partial<ResultStateDefaults>) => Provider',
        '—',
        'an application or a route',
        'Sets status, reach, align, live and illustration once for every region under it; an explicit input on one region still wins',
      ],
      [
        'ng-content',
        'projection',
        '—',
        'slResultState',
        'The parts are directives on the consumer’s own elements, so every one of them is the page’s to choose. Anything placed inside slResultStateContent joins the live region, which is why the actions and the footer are parts of their own',
      ],
      [
        'slContainer, slCard',
        'composition',
        '—',
        'around slResultState',
        'The measure belongs to container and the frame to card. This family caps no width and draws no box, because two families answering one question is two answers',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for this family: the Authoring Practices list holds no empty, error or result state, and the nearest official guidance is the Region landmark practice, which states that “a region landmark must have a label”. The root is a section and the attribute is written only once a title exists, so an unlabelled region is a plain grouping element rather than a landmark with no name.',
      'The box is a landmark, not a live region. MDN’s alert role reference states that the role “should only be used for text content, not interactive elements such as links or buttons”, and this family has a row of buttons in it. The region that announces is slResultStateContent, which holds the title and the description alone; the mark, the actions and the footer are its siblings.',
      'live defaults to polite, which is the one place this family and alert disagree. WCAG 2.2’s Understanding document for SC 4.1.3 names this family’s own text as its example: “brief text messages displayed about the completion or status of the search, such as ‘Searching…’, ‘18 results returned’ or ‘No results returned’ would be status updates”. An alert may be a standing notice that was on the page before it loaded; a result is always the outcome of an operation. None of the seven surveyed implementations writes a live role of any kind.',
      'Status is never carried by colour alone, because the family paints no colour for it: what happened is in the title and the description, which forced colours leave legible. The illustrations keep the theme’s system-colour mapping under forced colours, so a stack is still three layers and not three outlines laid over one another.',
      'The media box is hidden from assistive technology, with the projected glyph, the drawing made around it and any artwork the page supplies. The title and the description already say what the picture says; an illustration that adds information is not decorative, and what it adds belongs in the description.',
      'The root carries tabindex="-1" and is not in the tab sequence. A template that has just emptied a table calls focus() on the instance exportAs gives it; the family never does it, because moving focus unprompted is a change of context nobody asked for. A tabindex the page wrote is read with HostAttributeToken and kept.',
      'The family holds no mutable value, so it has no model(), no output() and no ControlValueAccessor. Which status a region is in is a fact about the consumer’s own data — a region that decided it would be deciding whether the fetch failed.',
      'A region that announces arrives: its words fade in and its drawing assembles, on the entering curve, and a hidden region fades out on the leaving curve. Under reduced motion the drawing arrives assembled. The focus indicator is not animated, because a focus indicator that fades in is one that is not there yet.',
    ],
    snippets: [
      defineSnippet({
        id: 'result-state-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<section\n  data-ui="result-state"\n  data-part="root"\n  data-status="empty"\n  data-reach="section"\n  data-align="center"\n  data-live="polite"\n  data-illustration="none"\n  aria-labelledby="slotted-result-state-1-title"\n  tabindex="-1"\n>\n  <div aria-hidden="true" data-part="media"></div>\n  <div data-part="content" role="status">\n    <div data-part="title" id="slotted-result-state-1-title">No projects yet</div>\n    <p data-part="description">Create a project to get started.</p>\n  </div>\n  <div data-part="actions">…</div>\n  <div data-part="footer">…</div>\n</section>',
      }),
      defineSnippet({
        id: 'result-state-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='result-state'] {\n  --slotted-result-state-padding-block: var(--slotted-space-8);\n  --slotted-result-state-row-gap: var(--slotted-space-7);\n  --slotted-result-state-media-size: 48px;\n  --slotted-result-state-media: url('/illustrations/empty.svg');\n}",
      }),
    ],
  },
} as const;
