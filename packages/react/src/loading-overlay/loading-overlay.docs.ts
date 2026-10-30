import loadingOverlayTokens from '@slotted/styles/loading-overlay/tokens.json';
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

export const REACT_LOADING_OVERLAY_TOKENS = loadingOverlayTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Loading overlay decision',
}));

const imports: ReferenceImport = {
  source: "import { LoadingOverlay, LoadingOverlayDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The region. Carries aria-busy while the layer blocks, and is the containing block the layer is placed in. Under scope="page" it is the fixed layer itself, portalled.',
  },
  {
    part: 'announcement',
    element: 'span',
    required: true,
    purpose:
      'The one visually-hidden role="status" per overlay. A child of the root and never of the layer, so the sentence it holds is not deleted at the moment it has something to say.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'The covered content, made inert while the layer blocks. display: contents, so a covered grid keeps its tracks. Absent under scope="page", where what is covered is the application.',
  },
  {
    part: 'scrim',
    element: 'div',
    required: true,
    purpose:
      'The wash, the one-cell grid that centers the panel, and the query container. In the document for the life of the family, so both directions of the fade are transitions.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'The box the reader reads. A column in a tall region, a bar in a short one, and the mark alone in a small one. Mounted while the layer is painted and held through its exit.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      "The mark. Holds progress-indicator's contained loader by default; the indicator prop replaces it with anything, including a determinate ProgressBar.",
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The short line. Painted and never announced from here: the announcement above holds the same sentence, and a wait should be heard once.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'The second line, for what the first cannot hold. Rendered only when given.',
  },
  {
    part: 'cancel',
    element: 'button',
    required: false,
    purpose:
      'Asks to stop. Rendered when cancellable is set, and the only thing in the layer that takes focus. Escape is bound only while it exists.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A form covered mid-save, driven by the controls below the canvas. Turn loading off: the fields are exactly where they were, because they never left.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-playground',
      language: 'tsx',
      label: 'One covered region',
      source:
        "<LoadingOverlay loading={saving} messages={{ label: 'Saving changes' }}>\n  <BillingForm />\n</LoadingOverlay>;",
    }),
  },
  {
    id: 'region',
    title: 'The content is still there',
    note: 'The covered card keeps its height, so nothing below it moves twice per save. Tab from the button above: focus walks past the covered fields, because they are inert rather than merely dimmed.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-region',
      language: 'tsx',
      label: 'Covering a card',
      source:
        "<LoadingOverlay loading={saving} messages={{ label: 'Saving changes' }}>\n  <Card>\n    <CardBody>{fields}</CardBody>\n  </Card>\n</LoadingOverlay>;",
    }),
  },
  {
    id: 'page',
    title: 'When the whole application waits',
    note: 'scope="page" portals the layer, makes every sibling of the portal root inert and locks the document scroll. Reach for it only when partial interaction would be unsafe — a month-end close, not a row that is saving.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-page',
      language: 'tsx',
      label: 'Blocking the page',
      source:
        '<LoadingOverlay\n  scope="page"\n  loading={closing}\n  messages={{ label: \'Closing the accounting period\' }}\n  description="Do not close this tab."\n/>;',
    }),
  },
  {
    id: 'veil',
    title: 'Three ways to say out of reach',
    note: 'wash is the theme’s own scrim; blur adds a backdrop filter, so text stops being legible before it stops being visible; none blocks exactly as much and dims nothing, for a wait short enough that a wash would read as a flash.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-veil',
      language: 'tsx',
      label: 'The veil axis',
      source:
        '<LoadingOverlay veil="wash">{rows}</LoadingOverlay>;\n<LoadingOverlay veil="blur">{rows}</LoadingOverlay>;\n<LoadingOverlay veil="none">{rows}</LoadingOverlay>;',
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, and each moves three things',
    note: 'The mark grows on the control-height scale, the two lines on the control type scale, and the panel on the space scale. Switch the toolbar to dense: the type and the mark shrink together and the meaning does not change.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-sizes',
      language: 'tsx',
      label: 'The size axis',
      source:
        '<LoadingOverlay size="sm" messages={{ label: \'Reconciling\' }} />;\n<LoadingOverlay size="md" messages={{ label: \'Reconciling\' }} />;\n<LoadingOverlay size="lg" messages={{ label: \'Reconciling\' }} />;',
    }),
  },
  {
    id: 'shapes',
    title: 'The panel answers the region, not the viewport',
    note: 'A tall region gets a column, a short one gets a bar carrying the same four things, and a small one gets the mark alone. Nothing is lost in the third: the words are in the live region, which is where they were doing the work.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-shapes',
      language: 'tsx',
      label: 'One overlay, three regions',
      source:
        "<LoadingOverlay messages={{ label: 'Updating the row' }} cancellable>\n  <TableRow />\n</LoadingOverlay>;",
    }),
  },
  {
    id: 'timing',
    title: 'Two flashes, and the two durations that prevent them',
    note: 'delay is the wait before anything is painted, so data that arrives in eighty milliseconds draws nothing. minDuration holds a layer that did appear, so it is not taken away thirty milliseconds later. Both default to zero and cost no timer.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-timing',
      language: 'tsx',
      label: 'Set once, for the application',
      source:
        '<LoadingOverlayDefaultsProvider delay={200} minDuration={400}>\n  <App />\n</LoadingOverlayDefaultsProvider>;',
    }),
  },
  {
    id: 'cancel',
    title: 'A wait that has gone wrong',
    note: 'cancellable renders the control and binds Escape to it. The request carries the reason and commits nothing: abort the work and lower loading when it has actually stopped, which is what the second card is showing.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-cancel',
      language: 'tsx',
      label: 'Asking to stop',
      source:
        "<LoadingOverlay\n  loading={importing}\n  cancellable\n  messages={{ label: 'Importing 4 812 rows' }}\n  onCancel={(request) => abort(request.reason)}\n>\n  {rows}\n</LoadingOverlay>;",
    }),
  },
  {
    id: 'focus',
    title: 'Where the keyboard goes',
    note: 'Put the caret in the field and press Save. Focus was inside the content that is about to go inert, so it moves to the panel; when the wait ends it returns to the field it came from. Focus that was elsewhere is never moved.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-focus',
      language: 'tsx',
      label: 'Nothing to write',
      source:
        '<LoadingOverlay loading={saving} cancellable>\n  <form>{fields}</form>\n</LoadingOverlay>;',
    }),
  },
  {
    id: 'indicator',
    title: 'A wait with a number on it',
    note: 'The mark is a slot. The default is the contained loader; a determinate import passes a ProgressBar with its own value, and the family that owns a measured quantity draws it.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-indicator',
      language: 'tsx',
      label: 'Composing progress-indicator',
      source:
        '<LoadingOverlay\n  messages={{ label: \'Uploading contrato.pdf\' }}\n  indicator={<ProgressBar value={62} label="Uploaded" hideLabel />}\n/>;',
    }),
  },
  {
    id: 'content',
    title: 'Words the family did not choose',
    note: 'A translated sentence is longer than the English one that was measured. The panel wraps it, keeps its own measure, and never truncates: the announcement holds the same sentence whole for the reader who would otherwise lose it.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-content',
      language: 'tsx',
      label: 'A long label',
      source:
        '<LoadingOverlay\n  messages={{ label: \'Reconciling the period entries against the bank statement\' }}\n  description="Stopping now would leave half the period reconciled."\n/>;',
    }),
  },
  {
    id: 'composition',
    title: 'The parts a consumer owns',
    note: 'render puts the region on the element the page already has. renderCancel puts this library’s own Button in the slot, and the family’s control paint steps back for it — the part stays the part, and only the paint is the consumer’s.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-composition',
      language: 'tsx',
      label: 'Substituting the parts',
      source:
        '<LoadingOverlay\n  render={(props) => <section {...props} />}\n  renderCancel={(props) => <Button {...props} variant="outline" size="sm" />}\n  cancellable\n>\n  {rows}\n</LoadingOverlay>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader gets',
    note: 'aria-busy on the region, one role="status" holding one sentence, and the covered subtree out of the accessibility tree entirely. Emptying the live region announces nothing, so a wait says one thing unless loadedLabel asks for a second.',
    snippet: defineSnippet({
      id: 'loading-overlay-react-accessibility',
      language: 'tsx',
      label: 'One wait, one announcement',
      source:
        '<LoadingOverlay messages={{ label: \'Saving changes\' }} loadedLabel="Changes saved">\n  {fields}\n</LoadingOverlay>;',
    }),
  },
];

export const REACT_LOADING_OVERLAY_DOCS = {
  loadingOverlay: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'loading',
        'boolean',
        'true',
        'LoadingOverlay',
        'Whether the data is still on its way. The consumer’s own fact: the family never moves it, so there is no controlled and uncontrolled pair',
      ],
      [
        'scope',
        "'region' | 'page'",
        'region',
        'LoadingOverlay',
        'What is covered. region is the box this element wraps; page is the whole viewport, portalled and modal',
      ],
      [
        'veil',
        "'wash' | 'blur' | 'none'",
        'wash',
        'LoadingOverlay',
        'How the covered content is obscured. none blocks exactly as much and dims nothing',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'LoadingOverlay',
        'The panel’s step: its padding, its type, and the size of the default mark',
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'LoadingOverlay',
        'Whether the overlay announces the wait at all. off is for a page that already says it elsewhere',
      ],
      [
        'messages',
        'Partial<LoadingOverlayMessages>',
        '—',
        'LoadingOverlay',
        'Words laid over the language in force, key by key: the short line (label), painted in the panel and announced once, and the cancel control’s words (cancel)',
      ],
      [
        'loadedLabel',
        'string',
        '—',
        'LoadingOverlay',
        'What a screen reader hears when the wait ends. Silent unless set, so one wait says one thing',
      ],
      [
        'description',
        'ReactNode',
        '—',
        'LoadingOverlay',
        'The second line, for what the first cannot hold. Painted, never announced',
      ],
      [
        'cancellable',
        'boolean',
        'false',
        'LoadingOverlay',
        'Renders the control that asks to stop, and binds Escape to it',
      ],
      [
        'cancelLabel',
        'ReactNode',
        '—',
        'LoadingOverlay',
        'What that control says, in place of the catalog’s cancel',
      ],
      [
        'delay',
        'number',
        '0',
        'LoadingOverlay',
        'Milliseconds the wait must last before anything is painted',
      ],
      [
        'minDuration',
        'number',
        '0',
        'LoadingOverlay',
        'Milliseconds a layer that did appear is held before it is withdrawn',
      ],
      [
        'container',
        'HTMLElement | null',
        '—',
        'LoadingOverlay',
        'Where a page-scoped layer is portalled. Defaults to the document body; meaningless for a region',
      ],
    ]),
    events: [
      {
        name: 'onCancel',
        payload: '{ reason: "dismiss" | "escape"; source: Event }',
        when: 'The reader presses the control or the Escape key. The family commits nothing — it does not lower loading and does not hide itself — because the operation has not stopped until the application has stopped it.',
      },
      {
        name: 'onReveal',
        payload: 'void',
        when: 'The covered content is reachable again, which is later than loading turning false whenever minDuration is still holding the layer. It is the moment an application moves focus on.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        'children',
        'ReactNode',
        '—',
        'LoadingOverlay',
        'Covered rather than replaced: the content keeps its geometry, stays measured, and goes inert while the layer blocks',
      ],
      [
        'indicator',
        'ReactNode',
        '—',
        'LoadingOverlay',
        'Replaces the mark. A determinate wait passes progress-indicator’s own ProgressBar with a value',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'LoadingOverlay',
        'Substitutes the region’s element. Every data attribute, the ref and aria-busy are handed to it',
      ],
      [
        'renderCancel',
        '(props) => ReactNode',
        '—',
        'LoadingOverlay',
        'Substitutes the control. The family’s own control paint is written :not([data-ui]), so a Button here keeps its own',
      ],
      [
        'ref',
        'Ref<HTMLDivElement>',
        '—',
        'LoadingOverlay',
        'Reaches the region element; the props are that element’s, extended',
      ],
      [
        'LoadingOverlayDefaultsProvider',
        'LoadingOverlayDefaults',
        '—',
        'Application',
        'Sets veil, size, live, loadedLabel, delay and minDuration once for everything below it; a prop still wins',
      ],
    ]),
    accessibility: [
      'The covered content carries inert while the layer blocks, which takes it out of the tab order and out of the accessibility tree. It is the capability the two surveyed implementations that document accessibility both decline: Quasar states that the content it covers stays focusable and asks the developer to solve it, and Mantine says the same in its usage section.',
      'The region carries aria-busy="true" while it waits, which is the platform’s own answer: ARIA 1.2 asks an author to set it on the region until it is finished loading. Page scope writes it nowhere, because the busy region would be the document root and this family owns no part of it.',
      'One overlay is one announcement. A visually-hidden role="status" holds the label while waiting and is emptied afterwards, and emptying a live region announces nothing, so a wait says one thing. The two painted lines carry aria-hidden, so the same sentence is not heard twice.',
      'Focus is read before the content goes inert. If it was inside, it moves to the control or to the panel itself — the container destination the APG advises for content that must be read before it is operated — and returns to where it came from when the wait ends. Focus that was elsewhere is never moved: a background save does not take the caret out of another form.',
      'There is no APG pattern for a loading overlay: the pattern index holds none for a busy region or a blocking layer, and claiming the Dialog pattern would import aria-modal and a close affordance into something that is neither. Page scope makes the rest of the document inert instead, which is what ARIA 1.2 asks of a modal element, and writes no aria-modal because that property inherits only into dialog and alertdialog.',
      'Escape is bound only while a control exists for it to ask. A key that appears to do something and does nothing is worse than a key nobody bound, and an overlay with nothing to cancel has nothing for the key to ask for.',
    ],
    snippets: [
      defineSnippet({
        id: 'loading-overlay-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  aria-busy="true"\n  data-ui="loading-overlay"\n  data-part="root"\n  data-scope="region"\n  data-size="md"\n  data-veil="wash"\n  data-loading=""\n>\n  <span data-part="announcement" data-ui="visually-hidden" role="status">\n    Saving changes\n  </span>\n  <div data-part="content" inert>\n    {covered}\n  </div>\n  <div data-part="scrim" data-loading="">\n    <div data-part="panel" tabIndex={-1}>\n      <span data-part="indicator">{mark}</span>\n      <span aria-hidden="true" data-part="label">\n        Saving changes\n      </span>\n      <button data-part="cancel" type="button">\n        Cancel\n      </button>\n    </div>\n  </div>\n</div>;',
      }),
      defineSnippet({
        id: 'loading-overlay-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='loading-overlay'] {\n  --slotted-loading-overlay-scrim: rgb(15 23 42 / 0.6);\n  --slotted-loading-overlay-blur: 6px;\n  --slotted-loading-overlay-measure: 22rem;\n}",
      }),
    ],
  },
} as const;
