import mediaViewerTokens from '@slotted/styles/media-viewer/tokens.json';
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

export const REACT_MEDIA_VIEWER_TOKENS = mediaViewerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned MediaViewer decision',
}));

const imports: ReferenceImport = {
  source:
    "import { MediaViewer, MediaViewerActions, MediaViewerBar, MediaViewerCaption, MediaViewerClose, MediaViewerDefaultsProvider, MediaViewerDownload, MediaViewerNext, MediaViewerPosition, MediaViewerPrevious, MediaViewerStage, MediaViewerThumbnails, MediaViewerTitle, MediaViewerZoom } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The viewer inside the dialog’s full-screen content. Carries data-ui="media-viewer", data-kind, data-zoomed, data-loading, and data-slotted-scheme="dark" — or high-contrast when that is the page’s scheme.',
  },
  {
    part: 'bar',
    element: 'div',
    required: true,
    purpose: 'The row above the stage: close, the file’s name and position, the actions.',
  },
  { part: 'close', element: 'button', required: true, purpose: 'Closes the viewer.' },
  {
    part: 'heading',
    element: 'div',
    required: true,
    purpose: 'The column that holds the title and the position.',
  },
  {
    part: 'title',
    element: 'h2',
    required: true,
    purpose:
      'The file’s name, cut in the middle so the extension stays, and the dialog’s accessible name.',
  },
  {
    part: 'position',
    element: 'p',
    required: false,
    purpose: 'Which of how many, and the dialog’s description. Absent for a set of one.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose: 'The consumer’s own controls; absent children, the download.',
  },
  {
    part: 'download',
    element: 'a download',
    required: false,
    purpose: 'The platform’s download of the item’s downloadHref.',
  },
  {
    part: 'stage',
    element: 'div',
    required: true,
    purpose:
      'Where the file is drawn and the scrollport of a zoomed picture; focus lands here when the viewer opens.',
  },
  {
    part: 'frame',
    element: 'div',
    required: false,
    purpose:
      'The box a zoomed or turned picture takes, axes swapped at a quarter turn. At the fit it steps out of the layout.',
  },
  {
    part: 'media',
    element: 'img, iframe, video or audio',
    required: false,
    purpose:
      'The file itself, drawn by the platform: a picture, the browser’s PDF or text reader, a film or a sound with native controls.',
  },
  {
    part: 'unsupported',
    element: 'div',
    required: false,
    purpose:
      'For a kind the browser cannot draw: the tile, a heading, one sentence and the download.',
  },
  {
    part: 'tile',
    element: 'span',
    required: false,
    purpose: 'The mark of the file’s kind, with its extension across its foot.',
  },
  {
    part: 'text',
    element: 'div',
    required: false,
    purpose:
      'The page a text file is set on: JSON indented, the rest as written, cut at 1 MiB with a note.',
  },
  {
    part: 'retry',
    element: 'button',
    required: false,
    purpose: 'Loads the file again after it did not load.',
  },
  {
    part: 'status',
    element: 'div role="status"',
    required: false,
    purpose:
      'Announces a file that is loading; when it did not load, the tile, a heading, a sentence, retry and the download.',
  },
  {
    part: 'previous',
    element: 'button',
    required: false,
    purpose:
      'The previous file, over the stage’s start. Disabled at the first without loop; hidden below 600 pixels, where the swipe steps.',
  },
  {
    part: 'next',
    element: 'button',
    required: false,
    purpose: 'The next file, over the stage’s end, under the same rules.',
  },
  {
    part: 'zoom',
    element: 'div role="group"',
    required: false,
    purpose: 'The floating pill under the stage. Present only for a picture that loaded.',
  },
  { part: 'zoom-out', element: 'button', required: false, purpose: 'One zoomStep down.' },
  {
    part: 'zoom-level',
    element: 'output',
    required: false,
    purpose: 'The level as a percentage of the fit, in tabular figures.',
  },
  { part: 'zoom-in', element: 'button', required: false, purpose: 'One zoomStep up.' },
  { part: 'fit', element: 'button', required: false, purpose: 'Back to the whole picture.' },
  {
    part: 'rotate',
    element: 'button',
    required: false,
    purpose: 'A quarter turn clockwise.',
  },
  {
    part: 'caption',
    element: 'p',
    required: false,
    purpose: 'The item’s caption under the stage, in its own direction.',
  },
  {
    part: 'thumbnails',
    element: 'div role="group"',
    required: false,
    purpose: 'A strip of the set, composed by the consumer with MediaViewerThumbnails.',
  },
  {
    part: 'thumbnail',
    element: 'button',
    required: false,
    purpose: 'One file of the strip; the current one carries aria-current and a frame.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'images',
    title: 'The photographs of a claim',
    note: 'Open any photograph: it stands whole on the dark ground, never larger than its own pixels. Previous and next walk the set; the bar says which of how many.',
    snippet: defineSnippet({
      id: 'media-viewer-react-images',
      language: 'tsx',
      label: 'Opened from an attachment',
      source: `<>
  <AttachmentTrigger
    onClick={() => {
      setValue(file.id);
      setOpen(true);
    }}
  />
  <MediaViewer
    items={files}
    open={open}
    onOpenChange={setOpen}
    value={value}
    onValueChange={setValue}
  />
</>;`,
    }),
  },
  {
    id: 'zoom',
    title: 'Zoom around a point',
    note: 'The wheel zooms around the point under the pointer by distance, so a trackpad’s many small events do not jump to the maximum. Drag to pan; double-click returns to the fit.',
    snippet: defineSnippet({
      id: 'media-viewer-react-zoom',
      language: 'tsx',
      label: 'Limits and step',
      source: `<MediaViewer items={files} defaultOpen minZoom={1} maxZoom={8} zoomStep={0.5} />;`,
    }),
  },
  {
    id: 'kinds',
    title: 'A photograph, a PDF, a JSON export and a spreadsheet',
    note: 'The PDF opens in the browser’s own reader; the JSON export is read as text, indented and never executed, as a log, a CSV or source would be. A spreadsheet the browser cannot draw gets its tile, a sentence and the download.',
    snippet: defineSnippet({
      id: 'media-viewer-react-kinds',
      language: 'tsx',
      label: 'Items by MIME type',
      source: `const files = [
  { id: 'front', name: 'front.jpg', type: 'image/jpeg', src: frontUrl },
  { id: 'report', name: 'police-report.pdf', type: 'application/pdf', src: reportUrl },
  { id: 'export', name: 'claim-0914.json', type: 'application/json', src: exportUrl },
  { id: 'estimate', name: 'estimate.xlsx', type: '', src: estimateUrl, downloadHref: estimateUrl },
];`,
    }),
  },
  {
    id: 'states',
    title: 'A picture that fails to load',
    note: 'The photograph’s address no longer answers: the stage says what happened and offers to try again or to download, and the zoom pill leaves because there is nothing to zoom.',
    snippet: defineSnippet({
      id: 'media-viewer-react-states',
      language: 'tsx',
      label: 'A known size draws the box before a byte arrives',
      source: `const scan = { id: 'scan', name: 'scan.png', type: 'image/png', src, width: 2480, height: 3508 };`,
    }),
  },
  {
    id: 'content',
    title: 'A long name and a set of one',
    note: 'A scanner’s name is cut in the middle so the extension stays; the whole name is in the tooltip and the accessible name. A single file draws no steps and no position.',
    snippet: defineSnippet({
      id: 'media-viewer-react-content',
      language: 'tsx',
      label: 'One file',
      source: `<MediaViewer items={[scan]} defaultOpen />;`,
    }),
  },
  {
    id: 'thumbnails',
    title: 'A strip of the set',
    note: 'Composed under the stage: the current photograph is framed and the others dimmed until the pointer reaches them. A press steps straight to that file.',
    snippet: defineSnippet({
      id: 'media-viewer-react-thumbnails',
      language: 'tsx',
      label: 'The parts, arranged',
      source: `<MediaViewer items={files} defaultOpen>
  <MediaViewerBar />
  <MediaViewerStage />
  <MediaViewerPrevious />
  <MediaViewerNext />
  <MediaViewerZoom />
  <MediaViewerCaption />
  <MediaViewerThumbnails aria-label="Claim photographs" />
</MediaViewer>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Actions of the product, defaults of the application',
    note: 'The bar takes the product’s own controls beside the download. A provider sets the limits, the loop and the words once for every viewer under it.',
    snippet: defineSnippet({
      id: 'media-viewer-react-composition',
      language: 'tsx',
      label: 'An action and a provider',
      source: `<MediaViewerDefaultsProvider maxZoom={6} loop>
  <MediaViewer items={files} defaultOpen>
    <MediaViewerBar>
      <MediaViewerClose />
      <MediaViewerTitle />
      <MediaViewerActions>
        <Button onClick={share}>Share</Button>
        <MediaViewerDownload />
      </MediaViewerActions>
    </MediaViewerBar>
    <MediaViewerStage />
  </MediaViewer>
</MediaViewerDefaultsProvider>;`,
    }),
  },
  {
    id: 'controlled',
    title: 'The application holds the file and the level',
    note: 'Every move is a request with a reason: the step says pointer, keyboard or remove, the level says pointer, keyboard or select. The log below the openers shows each one.',
    snippet: defineSnippet({
      id: 'media-viewer-react-controlled',
      language: 'tsx',
      label: 'Requests with reasons',
      source: `<MediaViewer
  items={files}
  open={open}
  onOpenChange={setOpen}
  value={value}
  onValueChange={(next, { reason }) => {
    setValue(next);
    log(\`step by \${reason}\`);
  }}
  zoom={zoom}
  onZoomChange={(next) => setZoom(next)}
/>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key of the viewer',
    note: 'Arrows step while the picture fits and pan once it is zoomed; plus, minus and zero zoom; R turns; Home and End reach the ends; Escape closes and focus returns to the opener.',
    snippet: defineSnippet({
      id: 'media-viewer-react-keyboard',
      language: 'tsx',
      label: 'Nothing to wire',
      source: `<MediaViewer items={files} defaultOpen />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload:
      "(open, { reason: 'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'back' | 'programmatic', cancel() })",
    when: 'The close button, Escape, the platform’s back, a click on the ground beside the picture, a pull down on a finger, or a set that became empty.',
  },
  {
    name: 'onValueChange',
    payload: "(id, { reason: 'pointer' | 'keyboard' | 'remove' | 'programmatic', cancel() })",
    when: 'A step by a button, a thumbnail, an arrow, Home, End or a swipe; remove when the shown item left the set and its neighbour takes its place.',
  },
  {
    name: 'onZoomChange',
    payload: "(zoom, { reason: 'pointer' | 'keyboard' | 'select' | 'programmatic', cancel() })",
    when: 'The wheel, a pinch, a double-click, the pill or a key; select when a step puts the level back to the fit.',
  },
  {
    name: 'onRotationChange',
    payload:
      "(0 | 90 | 180 | 270, { reason: 'pointer' | 'keyboard' | 'select' | 'programmatic', cancel() })",
    when: 'The rotate button or R; select when a step puts the turn back to 0.',
  },
];

export const REACT_MEDIA_VIEWER_DOCS = {
  mediaViewer: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'items',
        'MediaViewerItem[]',
        '—',
        'MediaViewer',
        '{ id, src, name, type, caption?, downloadHref?, thumbnail?, width?, height? }; type is a MIME type',
      ],
      ['open', 'boolean', '—', 'MediaViewer', 'Whether the viewer is shown, controlled'],
      ['defaultOpen', 'boolean', 'false', 'MediaViewer', 'The first open state, uncontrolled'],
      ['value', 'string', '—', 'MediaViewer', 'The id of the item shown, controlled'],
      [
        'defaultValue',
        'string',
        'the first item',
        'MediaViewer',
        'The first item shown, uncontrolled',
      ],
      ['zoom', 'number', '—', 'MediaViewer', 'The level, a multiple of the fit, controlled'],
      ['defaultZoom', 'number', '1', 'MediaViewer', 'The first level, uncontrolled'],
      ['rotation', '0 | 90 | 180 | 270', '—', 'MediaViewer', 'The turn, controlled'],
      ['defaultRotation', '0 | 90 | 180 | 270', '0', 'MediaViewer', 'The first turn, uncontrolled'],
      ['minZoom', 'number', '1', 'MediaViewer', 'The lowest level; 1 is the whole picture'],
      ['maxZoom', 'number', '4', 'MediaViewer', 'The highest level'],
      [
        'zoomStep',
        'number',
        '0.25',
        'MediaViewer',
        'What a button, a key or 100 pixels of wheel add',
      ],
      ['loop', 'boolean', 'false', 'MediaViewer', 'Steps wrap at the ends instead of stopping'],
      [
        'fullscreenToggle',
        'boolean',
        'false',
        'MediaViewer',
        'Passed to dialog: asks the platform for the whole screen',
      ],
      [
        'container',
        'Element | null',
        'a layer beside the viewer',
        'MediaViewer',
        'Where the layer is written',
      ],
      [
        'messages',
        'Partial<MediaViewerMessages>',
        '—',
        'MediaViewer',
        'Words laid over the language in force, key by key: close, previous, next, zoomIn, zoomOut, fit, rotate, download, position, zoomLevel, unsupportedTitle, unsupported, errorTitle, error, retry, truncated, loading, announce, label',
      ],
      [
        'children',
        'ReactNode',
        'the anatomy',
        'MediaViewer',
        'The parts, arranged by the consumer',
      ],
      ['children', 'ReactNode', 'the download', 'MediaViewerActions', 'The product’s own controls'],
      [
        'children',
        'ReactNode',
        'close, title, position, actions',
        'MediaViewerBar',
        'The bar’s own arrangement',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'close, download, previous, next',
        'Renders the wiring into another element',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element props',
      ],
    ]),
    composition: apiRows([
      [
        'MediaViewerDefaultsProvider',
        '{ minZoom, maxZoom, zoomStep, loop, messages }',
        '—',
        'a subtree',
        'Sets them once; a viewer that states one still wins',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'close, download, previous, next',
        'The consumer element receives data-part and the wiring; spread it',
      ],
      [
        'onClick',
        'handler',
        '—',
        'close, previous, next',
        'Composed: the page handler runs first and preventDefault refuses the family behavior',
      ],
      [
        'useMediaViewer',
        '() => context',
        '—',
        'a part of the consumer’s own',
        'The item, the index, the level and the requests',
      ],
    ]),
    accessibility: [
      'The layer is dialog’s: focus enters it, Tab stays inside, Escape and the platform’s back close it, and focus returns to the opener.',
      'The dialog is named by the file’s title and described by its position, so a reader hears “police-report.pdf, 3 of 5” when it opens; a step announces the new name and position politely.',
      'Focus lands on the stage rather than on the close button, because the content is the picture; the stage is named by the file and takes the arrows, plus, minus, zero and R.',
      'The family’s keys give way inside a video, an audio, a frame or a field, whose own keys win; Ctrl and Meta combinations stay the browser’s zoom. A text file keeps the arrows that scroll it.',
      'A text file is fetched and set as text, never executed, so an HTML file shows its source; the stage holding it scrolls under a finger as a document does.',
      'Every control is a real button with a name from the catalog, and the level is an output that is not live, so the zoom does not chatter at every wheel event.',
      'The viewer draws the dark scheme on its dark ground in light and dark, and keeps the high-contrast scheme when the reader chose it.',
    ],
    snippets: [
      defineSnippet({
        id: 'media-viewer-react-anatomy',
        language: 'tsx',
        label: 'Every part',
        source:
          '<MediaViewer items={files} open={open} onOpenChange={setOpen}>\n  <MediaViewerBar>\n    <MediaViewerClose />\n    <MediaViewerTitle />\n    <MediaViewerPosition />\n    <MediaViewerActions>\n      <MediaViewerDownload />\n    </MediaViewerActions>\n  </MediaViewerBar>\n  <MediaViewerStage />\n  <MediaViewerPrevious />\n  <MediaViewerNext />\n  <MediaViewerZoom />\n  <MediaViewerCaption />\n  <MediaViewerThumbnails aria-label="Files" />\n</MediaViewer>;',
      }),
    ],
  },
} as const;
