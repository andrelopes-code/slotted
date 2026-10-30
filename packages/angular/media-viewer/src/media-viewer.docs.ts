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

export const ANGULAR_MEDIA_VIEWER_TOKENS = mediaViewerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned MediaViewer decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideMediaViewerDefaults, SlMediaViewer, SlMediaViewerAction } from '@slotted/angular/media-viewer';",
  selector: 'sl-media-viewer, [slMediaViewerAction]',
  exportAs: 'slMediaViewer',
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
    purpose: 'The consumer’s own controls, projected with slMediaViewerAction, and the download.',
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
    purpose: 'A strip of the set, drawn with the thumbnails input.',
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
      id: 'media-viewer-angular-images',
      language: 'angular',
      label: 'Opened from an attachment',
      source: `<button slAttachmentTrigger (click)="value.set(file.id); open.set(true)"></button>
<sl-media-viewer [items]="files" [(open)]="open" [(value)]="value" />`,
    }),
  },
  {
    id: 'zoom',
    title: 'Zoom around a point',
    note: 'The wheel zooms around the point under the pointer by distance, so a trackpad’s many small events do not jump to the maximum. Drag to pan; double-click returns to the fit.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-zoom',
      language: 'angular',
      label: 'Limits and step',
      source: `<sl-media-viewer [items]="files" [(open)]="open" [maxZoom]="8" [zoomStep]="0.5" />`,
    }),
  },
  {
    id: 'kinds',
    title: 'A photograph, a PDF, a JSON export and a spreadsheet',
    note: 'The PDF opens in the browser’s own reader; the JSON export is read as text, indented and never executed, as a log, a CSV or source would be. A spreadsheet the browser cannot draw gets its tile, a sentence and the download.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-kinds',
      language: 'angular',
      label: 'Items by MIME type',
      source: `<sl-media-viewer [items]="claimFiles" [(open)]="open" />`,
    }),
  },
  {
    id: 'states',
    title: 'A picture that fails to load',
    note: 'The photograph’s address no longer answers: the stage says what happened and offers to try again or to download, and the zoom pill leaves because there is nothing to zoom.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-states',
      language: 'angular',
      label: 'A file that does not load',
      source: `<sl-media-viewer [items]="[front, wheelArch, rear]" [(open)]="open" />`,
    }),
  },
  {
    id: 'content',
    title: 'A long name and a set of one',
    note: 'A scanner’s name is cut in the middle so the extension stays; the whole name is in the tooltip and the accessible name. A single file draws no steps and no position.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-content',
      language: 'angular',
      label: 'One file',
      source: `<sl-media-viewer [items]="[scan]" [(open)]="open" />`,
    }),
  },
  {
    id: 'thumbnails',
    title: 'A strip of the set',
    note: 'Composed under the stage: the current photograph is framed and the others dimmed until the pointer reaches them. A press steps straight to that file.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-thumbnails',
      language: 'angular',
      label: 'A strip of the set',
      source: `<sl-media-viewer [items]="files" [(open)]="open" thumbnails thumbnailsLabel="Claim photographs" />`,
    }),
  },
  {
    id: 'composition',
    title: 'Actions of the product, defaults of the application',
    note: 'The bar takes the product’s own controls beside the download. A provider sets the limits, the loop and the words once for every viewer under it.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-composition',
      language: 'angular',
      label: 'An action and a provider',
      source: `<sl-media-viewer [items]="files" [(open)]="open">
  <button slMediaViewerAction type="button" (click)="share()">Share with adjuster</button>
</sl-media-viewer>`,
    }),
  },
  {
    id: 'controlled',
    title: 'The application holds the file and the level',
    note: 'Every move is a request with a reason: the step says pointer, keyboard or remove, the level says pointer, keyboard or select. The log below the openers shows each one.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-controlled',
      language: 'angular',
      label: 'Requests with reasons',
      source: `<sl-media-viewer
  [items]="files"
  [(open)]="open"
  [(value)]="value"
  [(zoom)]="zoom"
  (zoomChangeRequest)="log('level by ' + $event.reason)"
/>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key of the viewer',
    note: 'Arrows step while the picture fits and pan once it is zoomed; plus, minus and zero zoom; R turns; Home and End reach the ends; Escape closes and focus returns to the opener.',
    snippet: defineSnippet({
      id: 'media-viewer-angular-keyboard',
      language: 'angular',
      label: 'Nothing to wire',
      source: `<sl-media-viewer [items]="files" [(open)]="open" />`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChangeRequest',
    payload:
      "ChangeRequest<boolean>: { value, previous, reason: 'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'back' | 'programmatic', cancel() }",
    when: 'The close button, Escape, the platform’s back, a click on the ground beside the picture, a pull down on a finger, or a set that became empty. cancel() keeps the viewer open.',
  },
  {
    name: 'valueChangeRequest',
    payload:
      "ChangeRequest<string>: { value, previous, reason: 'pointer' | 'keyboard' | 'remove' | 'programmatic', cancel() }",
    when: 'A step by a button, a thumbnail, an arrow, Home, End or a swipe; remove when the shown item left the set and its neighbour takes its place.',
  },
  {
    name: 'zoomChangeRequest',
    payload:
      "ChangeRequest<number>: { value, previous, reason: 'pointer' | 'keyboard' | 'select' | 'programmatic', cancel() }",
    when: 'The wheel, a pinch, a double-click, the pill or a key; select when a step puts the level back to the fit.',
  },
  {
    name: 'rotationChangeRequest',
    payload:
      "ChangeRequest<0 | 90 | 180 | 270>: { value, previous, reason: 'pointer' | 'keyboard' | 'select' | 'programmatic', cancel() }",
    when: 'The rotate button or R; select when a step puts the turn back to 0.',
  },
];

export const ANGULAR_MEDIA_VIEWER_DOCS = {
  mediaViewer: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'items',
        'MediaViewerItem[]',
        '[]',
        'sl-media-viewer',
        '{ id, src, name, type, caption?, downloadHref?, thumbnail?, width?, height? }; type is a MIME type',
      ],
      [
        'open',
        'model<boolean>',
        'false',
        'sl-media-viewer',
        'Whether the viewer is shown; [(open)] two-way',
      ],
      [
        'value',
        'model<string | undefined>',
        'the first item',
        'sl-media-viewer',
        'The id of the item shown; [(value)] two-way',
      ],
      [
        'zoom',
        'model<number>',
        '1',
        'sl-media-viewer',
        'The level, a multiple of the fit; [(zoom)] two-way',
      ],
      [
        'rotation',
        'model<0 | 90 | 180 | 270>',
        '0',
        'sl-media-viewer',
        'The turn; [(rotation)] two-way',
      ],
      ['minZoom', 'number', '1', 'sl-media-viewer', 'The lowest level; 1 is the whole picture'],
      ['maxZoom', 'number', '4', 'sl-media-viewer', 'The highest level'],
      [
        'zoomStep',
        'number',
        '0.25',
        'sl-media-viewer',
        'What a button, a key or 100 pixels of wheel add',
      ],
      ['loop', 'boolean', 'false', 'sl-media-viewer', 'Steps wrap at the ends instead of stopping'],
      [
        'thumbnails',
        'boolean',
        'false',
        'sl-media-viewer',
        'Draws the strip of the set under the stage',
      ],
      ['thumbnailsLabel', 'string', '—', 'sl-media-viewer', 'The strip’s accessible name'],
      [
        'fullscreenToggle',
        'boolean',
        'false',
        'sl-media-viewer',
        'Passed to sl-dialog: asks the platform for the whole screen',
      ],
      [
        'container',
        'Element | null',
        'the dialog’s own',
        'sl-media-viewer',
        'Where the layer is written',
      ],
      [
        'messages',
        'Partial<MediaViewerMessages>',
        '—',
        'sl-media-viewer',
        'Words laid over the language in force, key by key: close, previous, next, zoomIn, zoomOut, fit, rotate, download, position, zoomLevel, unsupportedTitle, unsupported, errorTitle, error, retry, truncated, loading, announce, label',
      ],
    ]),
    composition: apiRows([
      [
        'provideMediaViewerDefaults',
        '{ minZoom, maxZoom, zoomStep, loop, messages }',
        '—',
        'providers',
        'Sets them once for every viewer under the injector; an input still wins',
      ],
      [
        'slMediaViewerAction',
        'directive',
        '—',
        'a control of the consumer’s own',
        'Projected into the bar beside the download',
      ],
      [
        'exportAs',
        'slMediaViewer',
        '—',
        'sl-media-viewer',
        'The instance: requestStep, requestZoom, requestRotation, requestOpen',
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
        id: 'media-viewer-angular-anatomy',
        language: 'angular',
        label: 'Every input',
        source:
          '<sl-media-viewer\n  [items]="files"\n  [(open)]="open"\n  [(value)]="value"\n  [(zoom)]="zoom"\n  [(rotation)]="rotation"\n  [maxZoom]="6"\n  loop\n  thumbnails\n  thumbnailsLabel="Claim photographs"\n>\n  <button slMediaViewerAction type="button">Share</button>\n</sl-media-viewer>',
      }),
    ],
  },
} as const;
