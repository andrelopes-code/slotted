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

export const ANGULAR_LOADING_OVERLAY_TOKENS = loadingOverlayTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Loading overlay decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlLoadingOverlay, SlLoadingOverlayCancel, provideLoadingOverlayDefaults } from '@slotted/angular/loading-overlay';",
  selector: '[slLoadingOverlay] · [slLoadingOverlayCancel]',
  exportAs: 'slLoadingOverlay',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element you put slLoadingOverlay on',
    required: true,
    purpose:
      'The region. The selector is a bare attribute, so the element stays yours — a section, a card, a list item. Carries aria-busy while the layer blocks. Under scope="page" it is the fixed layer itself, moved into a portal root.',
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
      'The projected content, made inert while the layer blocks. display: contents, so a covered grid keeps its tracks. Absent under scope="page", where what is covered is the application.',
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
      "The mark. Holds progress-indicator's contained loader by default; project [slLoadingOverlayIndicator] to replace it, including with a determinate slProgressBar.",
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
      'Asks to stop. Rendered when cancellable is set, and the only thing in the layer that takes focus. Escape is bound only while it exists. Project [slLoadingOverlayCancel] to bring your own.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A form covered mid-save, driven by the controls below the canvas. Turn loading off: the fields are exactly where they were, because they never left.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-playground',
      language: 'angular',
      label: 'One covered region',
      source:
        '<section slLoadingOverlay [loading]="saving()" [messages]="{ label: \'Saving changes\' }">\n  <app-billing-form />\n</section>',
    }),
  },
  {
    id: 'region',
    title: 'The content is still there',
    note: 'The covered card keeps its height, so nothing below it moves twice per save. Tab from the button above: focus walks past the covered fields, because they are inert rather than merely dimmed.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-region',
      language: 'angular',
      label: 'Covering a card',
      source:
        '<div slLoadingOverlay [loading]="saving()" [messages]="{ label: \'Saving changes\' }">\n  <div slCard>\n    <div slCardBody>…</div>\n  </div>\n</div>',
    }),
  },
  {
    id: 'page',
    title: 'When the whole application waits',
    note: 'scope="page" moves the layer into a portal root, makes every sibling of that root inert and locks the document scroll. Reach for it only when partial interaction would be unsafe — a month-end close, not a row that is saving.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-page',
      language: 'angular',
      label: 'Blocking the page',
      source:
        '<div\n  slLoadingOverlay\n  scope="page"\n  [loading]="closing()"\n  [messages]="{ label: \'Closing the accounting period\' }"\n  description="Do not close this tab."\n></div>',
    }),
  },
  {
    id: 'veil',
    title: 'Three ways to say out of reach',
    note: 'wash is the theme’s own scrim; blur adds a backdrop filter, so text stops being legible before it stops being visible; none blocks exactly as much and dims nothing, for a wait short enough that a wash would read as a flash.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-veil',
      language: 'angular',
      label: 'The veil axis',
      source:
        '<div slLoadingOverlay veil="wash">…</div>\n<div slLoadingOverlay veil="blur">…</div>\n<div slLoadingOverlay veil="none">…</div>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, and each moves three things',
    note: 'The mark grows on the control-height scale, the two lines on the control type scale, and the panel on the space scale. Switch the toolbar to dense: the type and the mark shrink together and the meaning does not change.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-sizes',
      language: 'angular',
      label: 'The size axis',
      source:
        '<div slLoadingOverlay size="sm" [messages]="{ label: \'Reconciling\' }">…</div>\n<div slLoadingOverlay size="md" [messages]="{ label: \'Reconciling\' }">…</div>\n<div slLoadingOverlay size="lg" [messages]="{ label: \'Reconciling\' }">…</div>',
    }),
  },
  {
    id: 'shapes',
    title: 'The panel answers the region, not the viewport',
    note: 'A tall region gets a column, a short one gets a bar carrying the same four things, and a small one gets the mark alone. Nothing is lost in the third: the words are in the live region, which is where they were doing the work.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-shapes',
      language: 'angular',
      label: 'One overlay, three regions',
      source:
        '<tr slLoadingOverlay [messages]="{ label: \'Updating the row\' }" cancellable>\n  …\n</tr>',
    }),
  },
  {
    id: 'timing',
    title: 'Two flashes, and the two durations that prevent them',
    note: 'delay is the wait before anything is painted, so data that arrives in eighty milliseconds draws nothing. minDuration holds a layer that did appear, so it is not taken away thirty milliseconds later. Both default to zero and cost no timer.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-timing',
      language: 'ts',
      label: 'Set once, for the application',
      source:
        'bootstrapApplication(App, {\n  providers: [provideLoadingOverlayDefaults({ delay: 200, minDuration: 400 })],\n});',
    }),
  },
  {
    id: 'cancel',
    title: 'A wait that has gone wrong',
    note: 'cancellable renders the control and binds Escape to it. The request carries the reason and commits nothing: abort the work and lower loading when it has actually stopped, which is what the second card is showing.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-cancel',
      language: 'angular',
      label: 'Asking to stop',
      source:
        '<div\n  slLoadingOverlay\n  [loading]="importing()"\n  cancellable\n  [messages]="{ label: \'Importing 4 812 rows\' }"\n  (cancel)="abort($event.reason)"\n>\n  …\n</div>',
    }),
  },
  {
    id: 'focus',
    title: 'Where the keyboard goes',
    note: 'Put the caret in the field and press Save. Focus was inside the content that is about to go inert, so it moves to the panel; when the wait ends it returns to the field it came from. Focus that was elsewhere is never moved.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-focus',
      language: 'angular',
      label: 'Nothing to write',
      source:
        '<form slLoadingOverlay [loading]="saving()" cancellable (reveal)="field.focus()">\n  <input #field />\n</form>',
    }),
  },
  {
    id: 'indicator',
    title: 'A wait with a number on it',
    note: 'The mark is a projection slot. The default is the contained loader; a determinate upload projects a slProgressBar with its own value, and the family that owns a measured quantity draws it.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-indicator',
      language: 'angular',
      label: 'Composing progress-indicator',
      source:
        '<div slLoadingOverlay [messages]="{ label: \'Uploading contrato.pdf\' }">\n  <div slLoadingOverlayIndicator slProgressBar [value]="62" label="Uploaded" hideLabel></div>\n  …\n</div>',
    }),
  },
  {
    id: 'content',
    title: 'Words the family did not choose',
    note: 'A translated sentence is longer than the English one that was measured. The panel wraps it, keeps its own measure, and never truncates: the announcement holds the same sentence whole for the reader who would otherwise lose it.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-content',
      language: 'angular',
      label: 'A long label',
      source:
        '<div\n  slLoadingOverlay\n  [messages]="{ label: \'Reconciling the entries for the period against the bank statement\' }"\n  description="Stopping now would leave half the period reconciled."\n></div>',
    }),
  },
  {
    id: 'composition',
    title: 'The parts a consumer owns',
    note: 'The selector is a bare attribute, so the region is the element the page already has. Project [slLoadingOverlayCancel] to bring your own control: the family’s control paint is written :not([data-ui]), so an slButton keeps its own.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-composition',
      language: 'angular',
      label: 'Substituting the parts',
      source:
        '<section slLoadingOverlay cancellable #overlay="slLoadingOverlay">\n  <button slLoadingOverlayCancel slButton variant="outline" size="sm">Interromper</button>\n  …\n</section>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader gets',
    note: 'aria-busy on the region, one role="status" holding one sentence, and the covered subtree out of the accessibility tree entirely. Emptying the live region announces nothing, so a wait says one thing unless loadedLabel asks for a second.',
    snippet: defineSnippet({
      id: 'loading-overlay-angular-accessibility',
      language: 'angular',
      label: 'One wait, one announcement',
      source:
        '<div slLoadingOverlay [messages]="{ label: \'Saving changes\' }" loadedLabel="Changes saved">…</div>',
    }),
  },
];

export const ANGULAR_LOADING_OVERLAY_DOCS = {
  loadingOverlay: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'loading',
        'boolean',
        'true',
        'SlLoadingOverlay',
        'Whether the data is still on its way. The consumer’s own fact: the family never moves it, so it is an input() and not a model()',
      ],
      [
        'scope',
        "'region' | 'page'",
        'region',
        'SlLoadingOverlay',
        'What is covered. region is the element the directive sits on; page is the whole viewport, portalled and modal',
      ],
      [
        'veil',
        "'wash' | 'blur' | 'none'",
        'wash',
        'SlLoadingOverlay',
        'How the covered content is obscured. none blocks exactly as much and dims nothing',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'SlLoadingOverlay',
        'The panel’s step: its padding, its type, and the size of the default mark',
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'SlLoadingOverlay',
        'Whether the overlay announces the wait at all. off is for a page that already says it elsewhere',
      ],
      [
        'messages',
        'Partial<LoadingOverlayMessages>',
        '—',
        'SlLoadingOverlay',
        'Words laid over the language in force, key by key: the short line (label), painted in the panel and announced once, and the cancel control’s words (cancel)',
      ],
      [
        'loadedLabel',
        'string',
        '—',
        'SlLoadingOverlay',
        'What a screen reader hears when the wait ends. Silent unless set, so one wait says one thing',
      ],
      [
        'description',
        'string',
        '—',
        'SlLoadingOverlay',
        'The second line, for what the first cannot hold. Painted, never announced',
      ],
      [
        'cancellable',
        'boolean',
        'false',
        'SlLoadingOverlay',
        'Renders the control that asks to stop, and binds Escape to it',
      ],
      [
        'delay',
        'number',
        '0',
        'SlLoadingOverlay',
        'Milliseconds the wait must last before anything is painted',
      ],
      [
        'minDuration',
        'number',
        '0',
        'SlLoadingOverlay',
        'Milliseconds a layer that did appear is held before it is withdrawn',
      ],
      [
        'container',
        'HTMLElement | null',
        '—',
        'SlLoadingOverlay',
        'Where a page-scoped layer is portalled. Defaults to the document body; meaningless for a region',
      ],
    ]),
    events: [
      {
        name: '(cancel)',
        payload: '{ reason: "dismiss" | "escape"; source: Event }',
        when: 'The reader presses the control or the Escape key. The family commits nothing — it does not lower loading and does not hide itself — because the operation has not stopped until the application has stopped it.',
      },
      {
        name: '(reveal)',
        payload: 'void',
        when: 'The covered content is reachable again, which is later than loading turning false whenever minDuration is still holding the layer. It is the moment an application moves focus on.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        '<ng-content>',
        '—',
        '—',
        'SlLoadingOverlay',
        'Content is covered rather than replaced: it keeps its geometry, stays measured, and goes inert while the layer blocks',
      ],
      [
        '[slLoadingOverlayIndicator]',
        'projection slot',
        '—',
        'SlLoadingOverlay',
        'Replaces the mark. A determinate wait projects progress-indicator’s own slProgressBar with a value',
      ],
      [
        '[slLoadingOverlayCancel]',
        'directive',
        '—',
        'SlLoadingOverlay',
        'Your own control in the slot. It takes the part and the press; the family’s control paint is written :not([data-ui]) and steps back',
      ],
      [
        'the selector',
        '[slLoadingOverlay]',
        '—',
        'SlLoadingOverlay',
        'A bare attribute, so the region is the element you already have — a section, a li, a form — and your attributes and listeners sit on it',
      ],
      [
        'exportAs',
        'slLoadingOverlay',
        '—',
        'SlLoadingOverlay',
        'Reaches the instance from a template, including painted(), which is not the same signal as loading',
      ],
      [
        'provideLoadingOverlayDefaults()',
        'LoadingOverlayDefaults',
        '—',
        'Application',
        'Sets veil, size, live, loadedLabel, delay and minDuration once for the whole injector; an input still wins',
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
        id: 'loading-overlay-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<section\n  aria-busy="true"\n  data-ui="loading-overlay"\n  data-part="root"\n  data-scope="region"\n  data-size="md"\n  data-veil="wash"\n  data-loading=""\n>\n  <span data-part="announcement" data-ui="visually-hidden" role="status">Saving changes</span>\n  <div data-part="content" inert>…</div>\n  <div data-part="scrim" data-loading="">\n    <div data-part="panel" tabindex="-1">\n      <span data-part="indicator">…</span>\n      <span aria-hidden="true" data-part="label">Saving changes</span>\n      <button data-part="cancel" type="button">Cancel</button>\n    </div>\n  </div>\n</section>',
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
