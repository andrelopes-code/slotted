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

export const REACT_RESULT_STATE_TOKENS = resultStateTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Result State decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  ResultState,\n  ResultStateActions,\n  ResultStateContent,\n  ResultStateDefaultsProvider,\n  ResultStateDescription,\n  ResultStateFooter,\n  ResultStateTitle,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section',
    required: true,
    purpose:
      'The region. Carries data-ui="result-state", the data-status, data-reach, data-align, data-illustration and data-live attributes, and tabindex="-1". A section named by its own title is a region landmark a reader can jump to; unnamed it is a plain grouping element that costs nothing.',
  },
  {
    part: 'media',
    element: 'div',
    required: false,
    purpose:
      'The page’s glyph or its own artwork, hidden from assistive technology. With illustration set, result state draws a tile, a stack or a stack of cards around the glyph here. It keeps the height the reach gives it, so artwork that has not loaded moves nothing when it arrives. Empty it is withdrawn by the stylesheet, except under cards, which draws its lines without a glyph.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The title and the description, and nothing else. This is the live region: role="status" or role="alert" is written here, so the buttons beside it are outside what a reader hears.',
  },
  {
    part: 'title',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The message’s name, and the region’s: the root points aria-labelledby at it. A div by default, because a heading belongs in the document outline and only the page knows whether this message does. An id the page writes is kept, and the root points at that one instead.',
  },
  {
    part: 'description',
    element: 'p, or the element render returns',
    required: false,
    purpose:
      'What to do next. It breaks a string no language can break — a resource id, a host name without a hyphen — rather than overflowing, and removes nothing from the DOM to do it.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The controls that get the reader out of the situation, outside the live region. They stack below a container width of 20rem, and at inline reach they sit on the message’s own first line.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The line under the actions: the documentation link that is not a call to action. Set one step down and in the muted role, because it is neither of the buttons above it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One region with every axis on it, driven by the controls below the canvas. Change the status and read what the title and the description say: the status is written as data-status and paints nothing.',
    snippet: defineSnippet({
      id: 'result-state-react-playground',
      language: 'tsx',
      label: 'A region that stands in for content',
      source:
        '<ResultState status="empty">\n  <ResultStateContent>\n    <ResultStateTitle>No projects yet</ResultStateTitle>\n    <ResultStateDescription>Create a project to start collecting runs.</ResultStateDescription>\n  </ResultStateContent>\n  <ResultStateActions>\n    <Button>Create project</Button>\n  </ResultStateActions>\n</ResultState>;',
    }),
  },
  {
    id: 'statuses',
    title: 'What the region is reporting',
    note: 'Seven statuses name seven situations: an empty collection, a search with no matches, a missing resource, a failed request, a refused access, a lost connection and a finished task. The status paints nothing, so the title and the description tell the reader which one it is.',
    snippet: defineSnippet({
      id: 'result-state-react-statuses',
      language: 'tsx',
      label: 'The seven, and what each one says',
      source:
        '// empty: the collection exists and holds nothing.\n// no-results: a query or a filter matched nothing.\n// not-found: the thing that was asked for is not here.\n// error: a failure the reader can act on.\n// forbidden: the reader is not allowed to see it.\n// offline: the connection is gone.\n// success: the flow finished and there is nothing left to do.\n<ResultState status="no-results" />;',
    }),
  },
  {
    id: 'reach',
    title: 'How far the region reaches',
    note: 'A row inside a table cell, a panel inside a card, the whole route: the same three words Alert uses. At inline the actions join the message on its first line and no illustration is drawn. At page the title takes the top step of the type scale.',
    snippet: defineSnippet({
      id: 'result-state-react-reach',
      language: 'tsx',
      label: 'The same region at three scopes',
      source:
        '<ResultState reach="inline" status="no-results">\n  <ResultStateContent>\n    <ResultStateTitle>No rows match the filter</ResultStateTitle>\n  </ResultStateContent>\n  <ResultStateActions>\n    <Button size="sm" variant="ghost">\n      Clear filters\n    </Button>\n  </ResultStateActions>\n</ResultState>;\n\n<ResultState reach="page" status="not-found" />;',
    }),
  },
  {
    id: 'align',
    title: 'Centered, or from the inline edge',
    note: 'center suits a panel or a route. start reads from the inline edge and suits a data-dense screen, where a centered column reads as an interruption.',
    snippet: defineSnippet({
      id: 'result-state-react-align',
      language: 'tsx',
      label: 'The two readings',
      source:
        '// The default, for a panel or a route.\n<ResultState align="center" />;\n\n// For a data-dense screen, where a centered column reads as an interruption.\n<ResultState align="start" reach="inline" />;',
    }),
  },
  {
    id: 'media',
    title: 'The page’s own illustration',
    note: 'The media box is sized before anything is in it, so an illustration that has not loaded reserves the space it will occupy and the title below it never moves.',
    snippet: defineSnippet({
      id: 'result-state-react-media',
      language: 'tsx',
      label: 'A region with an illustration, and one without',
      source:
        '// A title, a description and an action: result state draws no picture.\n<ResultState status="offline" />;\n\n// The page draws its own, in the box result state keeps.\n<ResultState media={<BoardIllustration />} />;\n\n// Or named in CSS, for a page that skins its states in the theme:\n// [data-ui="result-state"][data-status="offline"] > [data-part="media"] {\n//   display: block;\n//   --slotted-result-state-media: url("/illustrations/offline.svg");\n// }',
    }),
  },
  {
    id: 'illustration',
    title: 'A drawing around the page’s glyph',
    note: 'Three drawings in the neutral surface and border roles: a framed tile, three layers leaning back and a stack of cards, made around the glyph in media. None takes a tone, and inline reach draws none. A region that announces assembles its drawing as it arrives; under reduced motion it arrives assembled.',
    snippet: defineSnippet({
      id: 'result-state-react-illustration',
      language: 'tsx',
      label: 'The three drawings, and the stack of cards without a glyph',
      source:
        'const glyph = (\n  <Icon>\n    <Glyph name="bell" />\n  </Icon>\n);\n\n<ResultState illustration="stack" media={glyph}>\n  <ResultStateContent>\n    <ResultStateTitle>No alerts configured</ResultStateTitle>\n  </ResultStateContent>\n</ResultState>;\n\n// A framed tile, and a stack of cards standing in for rows.\n<ResultState illustration="tile" media={glyph} />;\n<ResultState illustration="cards" media={glyph} />;\n\n// The cards draw their two lines with no glyph at all.\n<ResultState illustration="cards" />;',
    }),
  },
  {
    id: 'actions',
    title: 'The way out of the situation',
    note: 'The controls are your own Buttons, in a part outside the live region, so a reader hearing the message is not read two button labels in the middle of it. Narrow the window past 20rem and the buttons stack.',
    snippet: defineSnippet({
      id: 'result-state-react-actions',
      language: 'tsx',
      label: 'Two controls, a link that is not one, and a retry in flight',
      source:
        '<ResultState status="error">\n  <ResultStateContent>\n    <ResultStateTitle>The run failed</ResultStateTitle>\n  </ResultStateContent>\n  <ResultStateActions>\n    <Button loading={retrying} tone="danger">\n      Try again\n    </Button>\n    <Button variant="outline">Open log</Button>\n  </ResultStateActions>\n  <ResultStateFooter>\n    <Link href="/docs/retries">How retries are counted</Link>\n  </ResultStateFooter>\n</ResultState>;',
    }),
  },
  {
    id: 'live',
    title: 'What a reader hears, and when',
    note: 'polite is the default, where Alert defaults to off: WCAG 2.2 SC 4.1.3 gives “No results returned” as an example of a status message. Press the button and the region arrives while the reader is elsewhere.',
    snippet: defineSnippet({
      id: 'result-state-react-live',
      language: 'tsx',
      label: 'The default, the loud one, and the opt-out',
      source:
        '// The default. role="status" on the text, which implies aria-live and\n// aria-atomic; the buttons beside it are outside the region.\n<ResultState live="polite" status="no-results" />;\n\n// role="alert", for a failure the reader has to hear now.\n<ResultState live="assertive" status="error" />;\n\n// Off, when the page already owns a live region around this one.\n<ResultState live="off" />;',
    }),
  },
  {
    id: 'content',
    title: 'Content of any length',
    note: 'A German compound with no break opportunity, a digest no language can break, a title standing alone and a region with no media, all in a column narrow enough to make each of them a problem.',
    snippet: defineSnippet({
      id: 'result-state-react-content',
      language: 'tsx',
      label: 'Long, unbreakable, and bare',
      source:
        '<ResultState status="error">\n  <ResultStateContent>\n    <ResultStateTitle>{longTranslatedTitle}</ResultStateTitle>\n    <ResultStateDescription>The run {digest} failed.</ResultStateDescription>\n  </ResultStateContent>\n</ResultState>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'Measure belongs to Container and the frame to Card, so result state caps no width and draws no box: these two lines are what you write instead. The defaults provider sets the axes once, and render substitutes the element of any part.',
    snippet: defineSnippet({
      id: 'result-state-react-composition',
      language: 'tsx',
      label: 'The measure, the frame, the defaults and the element',
      source:
        '<Container size="measure">\n  <ResultState reach="page" status="no-results" />\n</Container>;\n\n<Card>\n  <ResultState status="empty" />\n</Card>;\n\n<ResultStateDefaultsProvider align="start" reach="inline">\n  <App />\n</ResultStateDefaultsProvider>;\n\n<ResultStateTitle render={(props) => <h2 {...props} />}>This page does not exist</ResultStateTitle>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'The landmark, the region and the keyboard',
    note: 'Tab past the region and then send the keyboard into it: the box is a landmark a reader can jump to, the text is the only part that announces, and nothing moves focus unless the application asks.',
    snippet: defineSnippet({
      id: 'result-state-react-accessibility',
      language: 'tsx',
      label: 'What each of these produces in the tree',
      source:
        '// A region landmark named "No rows match the filter", holding a polite\n// status region. The button is outside it.\n<ResultState live="polite">\n  <ResultStateContent>\n    <ResultStateTitle>No rows match the filter</ResultStateTitle>\n  </ResultStateContent>\n  <ResultStateActions>\n    <Button>Clear filters</Button>\n  </ResultStateActions>\n</ResultState>;\n\n// The application decides when the keyboard goes there. Result state never does.\nconst region = useRef<HTMLElement>(null);\nregion.current?.focus();',
    }),
  },
];

export const REACT_RESULT_STATE_DOCS = {
  resultState: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'status',
        "'empty' | 'no-results' | 'not-found' | 'error' | 'forbidden' | 'offline' | 'success'",
        'empty',
        'ResultState',
        'What the region is reporting, written on the root as data-status for a page to key its own artwork on. Result state paints nothing for it: what happened is in the title and the description.',
      ],
      [
        'reach',
        "'inline' | 'section' | 'page'",
        'section',
        'ResultState',
        'The scope the message applies to. inline is a row for a table cell and draws no illustration; page takes the 3xl step of the type scale and draws the illustration half again as large.',
      ],
      [
        'align',
        "'center' | 'start'",
        'center',
        'ResultState',
        'Whether the region reads centered or from the inline edge. start is for a data-dense screen, where a centered column reads as an interruption.',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'polite',
        'ResultState',
        'Whether the text announces itself. polite writes role="status" on the content part and assertive writes role="alert"; both imply aria-live and aria-atomic, and neither is written on the box.',
      ],
      [
        'illustration',
        "'none' | 'tile' | 'stack' | 'cards'",
        'none',
        'ResultState',
        'The drawing result state makes around the glyph in media, in the neutral surface and border roles and never in a tone. tile and stack frame a glyph and draw nothing without one; cards draws its lines with or without it; none draws nothing of its own.',
      ],
      [
        'media',
        'ReactNode',
        '—',
        'ResultState',
        'The glyph an illustration is drawn around, or artwork the page supplies under illustration="none", projected into the box result state draws so it keeps the height the reach gives it. Angular projects an element carrying slResultStateMedia instead.',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the rendered element of ResultState, ResultStateContent, ResultStateTitle, ResultStateDescription, ResultStateActions or ResultStateFooter, and hands it every data attribute. A title rendered as a heading is how a page puts the region in its outline.',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'ResultState',
        'Reaches the section, which carries tabindex="-1" so focus() works. It is the whole imperative surface: result state never moves focus by itself, because moving it unprompted is a change of context nobody asked for.',
      ],
      [
        'id',
        'string',
        '—',
        'ResultStateTitle',
        'An identifier you write is kept, and the root points aria-labelledby at that one rather than at its own.',
      ],
      [
        'ResultStateDefaultsProvider',
        '{ status, reach, align, live, illustration }',
        '—',
        'a subtree',
        'Sets all five once for every region under it; an explicit prop on one region still wins.',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'ResultStateContent',
        'The title and the description. Anything else placed here joins the live region, which is why the actions and the footer are parts of their own.',
      ],
      [
        'Container, Card',
        'composition',
        '—',
        'around ResultState',
        'The measure belongs to Container and the frame to Card. Result state caps no width and draws no box.',
      ],
    ]),
    accessibility: [
      'The Authoring Practices Guide has no pattern for empty, error or result states. The nearest guidance is the region landmark practice, which states that “a region landmark must have a label”. The root is a section and aria-labelledby is written only once a title exists, so a region without a title is a plain grouping element rather than a landmark with no name.',
      'The box is a landmark, not a live region. The MDN reference for the alert role states that the role “should only be used for text content, not interactive elements such as links or buttons”, and a result state holds buttons. The content part is the live region and holds the title and the description alone; the media, the actions and the footer are its siblings.',
      'live defaults to polite, where Alert defaults to off. The Understanding document for WCAG 2.2 SC 4.1.3 gives “No results returned” as an example of a status message. An alert may be a standing notice that was on the page before it loaded; a result is always the outcome of an operation.',
      'Status is never carried by color, because result state paints no color for it: what happened is in the title and the description, which forced colors leave legible. The illustrations keep the theme’s system-color mapping under forced colors, so a stack is still three layers and not three outlines laid over one another.',
      'The media box is hidden from assistive technology, with the glyph, the drawing made around it and any artwork you supply. The title and the description must say what the picture says. An illustration that adds information is not decorative, and what it adds belongs in the description.',
      'The root carries tabindex="-1" and is not in the tab sequence. After your code empties a table, it can send the reader to the message through the ref. Result state never moves focus by itself, because moving focus unprompted is a change of context nobody asked for.',
      'Result state holds no mutable value, so it emits no events and has no event table. Which status a region is in is a fact about your own data: a region that decided it would be deciding whether the request failed.',
      'A region that announces arrives: its words fade in and its drawing assembles, on the entering curve, and a hidden region fades out on the leaving curve. Under reduced motion the drawing arrives assembled. The focus indicator is not animated, because a focus indicator that fades in is one that is not there yet.',
    ],
    snippets: [
      defineSnippet({
        id: 'result-state-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<section\n  aria-labelledby="r1title"\n  data-ui="result-state"\n  data-part="root"\n  data-status="empty"\n  data-reach="section"\n  data-align="center"\n  data-live="polite"\n  data-illustration="none"\n  tabIndex={-1}\n>\n  <div aria-hidden="true" data-part="media" />\n  <div data-part="content" role="status">\n    <div data-part="title" id="r1title">\n      No projects yet\n    </div>\n    <p data-part="description">Create a project to get started.</p>\n  </div>\n  <div data-part="actions">…</div>\n  <div data-part="footer">…</div>\n</section>;',
      }),
      defineSnippet({
        id: 'result-state-theming',
        language: 'css',
        label: 'Retuning result state for an application',
        source:
          "[data-ui='result-state'] {\n  --slotted-result-state-padding-block: var(--slotted-space-8);\n  --slotted-result-state-row-gap: var(--slotted-space-7);\n  --slotted-result-state-media-size: 48px;\n  --slotted-result-state-media: url('/illustrations/empty.svg');\n}",
      }),
    ],
  },
} as const;
