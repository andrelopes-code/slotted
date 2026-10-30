import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import tourTokens from '@slotted/styles/tour/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TOUR_TOKENS = tourTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tour decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlTour, SlTourStep, SlTourCard, provideTourDefaults } from '@slotted/angular/tour';",
  selector: 'sl-tour, ng-template[slTourStep], ng-template[slTourCard]',
  exportAs: 'slTour',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, portalled',
    required: true,
    purpose:
      'data-ui="tour", fixed over the viewport, takes no pointer. data-open, data-modal, data-spotlight, data-missing, data-placement and data-size; carries the target rectangle as --slotted-tour-target-*.',
  },
  {
    part: 'backdrop',
    element: 'div',
    required: false,
    purpose:
      'The scrim, faded in and out as slDialog’s is. Takes every press on a modal step. Absent on a non-modal step without a spotlight.',
  },
  {
    part: 'spotlight',
    element: 'div',
    required: false,
    purpose:
      'The cutout round the target; its shadow is the scrim. It travels from one target to the next. Absent on a centerd step and under [spotlight]="false".',
  },
  {
    part: 'surface',
    element: 'div',
    required: true,
    purpose:
      'The layer the positioner places, with data-side and data-align; centerd by the stylesheet when the step has no target.',
  },
  {
    part: 'focus-guard',
    element: 'span, twice',
    required: false,
    purpose:
      'On a non-modal step only: Tab past either edge of the card goes to the target the reader is asked to operate.',
  },
  {
    part: 'arrow',
    element: 'div',
    required: false,
    purpose:
      'Points at the target from the card’s edge. Absent on a centerd step and under [arrow]="false".',
  },
  {
    part: 'content',
    element: '[slTourContent]',
    required: true,
    purpose:
      'The card: role="dialog" unless you wrote a role, named by the title unless you wrote aria-label, aria-modal on a modal step. Reads the arrow keys. It draws no padding: slTourHeader, slTourBody and slTourFooter carry the card inset, set by --slotted-tour-padding-inline and --slotted-tour-padding-block.',
  },
  {
    part: 'media',
    element: '[slTourMedia]',
    required: false,
    purpose:
      'The step’s media — a template, or an image URL — full bleed above the header; hidden when it has none.',
  },
  {
    part: 'header',
    element: '[slTourHeader]',
    required: true,
    purpose: 'The progress and the close control on one row.',
  },
  {
    part: 'progress',
    element: '[slTourProgress]',
    required: false,
    purpose: '“2 of 5”, counting the steps available now; hidden in a tour of one step.',
  },
  {
    part: 'close',
    element: 'button[slTourClose]',
    required: false,
    purpose: 'Closes with the outcome close; named by messages.close.',
  },
  {
    part: 'title',
    element: '[slTourTitle]',
    required: true,
    purpose: 'The step’s title and the card’s accessible name; text written inside replaces it.',
  },
  {
    part: 'description',
    element: '[slTourDescription]',
    required: false,
    purpose:
      'The step’s description and the card’s accessible description; hidden when it has none.',
  },
  {
    part: 'body',
    element: '[slTourBody]',
    required: false,
    purpose:
      'The step’s content — step.content, or an ng-template slTourStep with its id — rendered lazily. The only part that scrolls.',
  },
  {
    part: 'footer',
    element: '[slTourFooter]',
    required: true,
    purpose:
      'Skip at the start, Back and Next at the end; a narrow card lifts Skip to a line of its own.',
  },
  {
    part: 'skip',
    element: 'button[slButton][slTourSkip]',
    required: false,
    purpose: 'Closes with the outcome skip; hidden on the last step.',
  },
  {
    part: 'prev',
    element: 'button[slButton][slTourPrev]',
    required: false,
    purpose: 'The previous available step; hidden on the first.',
  },
  {
    part: 'next',
    element: 'button[slButton][slTourNext]',
    required: false,
    purpose:
      'The next available step, or Done on the last (data-last); carries [loading] while the next step prepares.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The five stops of a reports workspace, from a welcome card to the export button. Start it, walk it with Next and Back, and read the last request under the screen.',
    snippet: defineSnippet({
      id: 'tour-angular-playground',
      language: 'angular',
      label: 'Five steps, the first one centerd',
      source: `<button slButton (click)="open.set(true)">Start tour</button>
<sl-tour [steps]="steps" [(open)]="open" />`,
    }),
  },
  {
    id: 'placement',
    title: 'Where the card stands',
    note: 'Each step names the side of its target; the card flips when that side has no room and slides along the edge to stay on screen, and the arrow keeps pointing at the target.',
    snippet: defineSnippet({
      id: 'tour-angular-placement',
      language: 'ts',
      label: 'side and align, per step or for the tour',
      source: `const steps: TourStep[] = [
  { id: 'nav', target: '#nav', side: 'inline-end', title: 'Every workspace' },
  { id: 'export', target: '#export', side: 'top', align: 'end', title: 'Export' },
];`,
    }),
  },
  {
    id: 'centered',
    title: 'A step with no target',
    note: 'The opening step points at nothing: it stands in the middle of the screen over the whole scrim, with a picture above the header and its own words, “Not now” and “Start tour”.',
    snippet: defineSnippet({
      id: 'tour-angular-centered',
      language: 'angular',
      label: 'The picture, written for the step',
      source: `<sl-tour [steps]="steps" [(open)]="open">
  <ng-template slTourStep="welcome" slTourStepSlot="media">
    <img alt="" src="/tour/reports.png" />
  </ng-template>
</sl-tour>`,
    }),
  },
  {
    id: 'spotlight',
    title: 'With and without the spotlight',
    note: 'The spotlight cuts the target out of the scrim and travels to the next one. [spotlight]="false" on a non-modal tour is a coach mark: a card beside its control and nothing dimmed.',
    snippet: defineSnippet({
      id: 'tour-angular-spotlight',
      language: 'angular',
      label: 'A coach mark',
      source: `<sl-tour [steps]="tip" [(open)]="tipOpen" [modal]="false" [spotlight]="false" size="sm" />`,
    }),
  },
  {
    id: 'modal',
    title: 'What a modal step does to the page',
    note: 'On a modal step the page is inert — out of reach of the pointer, the keyboard and a screen reader — Tab stays inside the card, and Escape closes. [modal]="false" leaves the page reachable.',
    snippet: defineSnippet({
      id: 'tour-angular-modal',
      language: 'angular',
      label: 'A tour the reader can work around',
      source: `<sl-tour [steps]="steps" [(open)]="open" [modal]="false" closeOnOutsidePress />`,
    }),
  },
  {
    id: 'interactive',
    title: 'A step the reader completes',
    note: 'Press New report: the step is interactive, so the target stays operable, Next is gone, and the press on the target itself goes on — advanceOn names the event. Tab from the card reaches the target.',
    snippet: defineSnippet({
      id: 'tour-angular-interactive',
      language: 'ts',
      label: 'advanceOn and interactive',
      source: `const step: TourStep = {
  id: 'create',
  target: '#new-report',
  title: 'Create your first report',
  interactive: true,
  advanceOn: 'click',
};`,
    }),
  },
  {
    id: 'availability',
    title: 'Steps that apply to this reader',
    note: 'Billing is only for owners: switch the role and the step drops out of the count — “1 of 3” becomes “1 of 4” — and Next and Back pass over it in both directions.',
    snippet: defineSnippet({
      id: 'tour-angular-availability',
      language: 'ts',
      label: 'when, read each time navigation reaches the step',
      source: `const step: TourStep = {
  id: 'billing',
  target: '#billing',
  title: 'Invoices and plans',
  when: () => this.role() === 'owner',
};`,
    }),
  },
  {
    id: 'missing',
    title: 'A target that is not on the page',
    note: 'The sidebar is collapsed, so the sidebar step has nothing to point at. Under missing="center" it stands centerd with data-missing and says what it had to say; under "skip" it is passed over.',
    snippet: defineSnippet({
      id: 'tour-angular-missing',
      language: 'angular',
      label: 'What to do when a target cannot be found',
      source: `<sl-tour [steps]="steps" [(open)]="open" missing="skip" [targetTimeout]="800" />`,
    }),
  },
  {
    id: 'prepare',
    title: 'Preparing the page for a step',
    note: 'The columns step opens the column menu first: prepare runs, Next carries its loading sweep for as long as it takes, and the card only moves once the menu — the step’s target — is on the page.',
    snippet: defineSnippet({
      id: 'tour-angular-prepare',
      language: 'ts',
      label: 'prepare, with the signal that aborts it',
      source: `const step: TourStep = {
  id: 'columns',
  target: '#column-menu',
  title: 'Choose your columns',
  prepare: async (signal) => {
    this.menuOpen.set(true);
    await this.columns.load({ signal });
  },
};`,
    }),
  },
  {
    id: 'controlled',
    title: 'The product owns the tour',
    note: 'open and step are the product’s: it starts at the step it saved, refuses to leave the filters step until a filter is chosen, and records the outcome — complete, skip or close — to decide whether to offer the tour again.',
    snippet: defineSnippet({
      id: 'tour-angular-controlled',
      language: 'angular',
      label: 'Two-way values, and the requests that can be refused',
      source: `<sl-tour
  [steps]="steps"
  [(open)]="open"
  [(step)]="step"
  (stepChangeRequest)="guard($event)"
  (openChangeRequest)="$event.value || saveOutcome($event.outcome)"
/>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composing the card',
    note: 'The card is the product’s own arrangement: dots from the slTour instance instead of the progress text, an action of its own beside Next, and the title set as an h3.',
    snippet: defineSnippet({
      id: 'tour-angular-composition',
      language: 'angular',
      label: 'The parts, and the instance they read',
      source: `<sl-tour #tour="slTour" [steps]="steps" [(open)]="open">
  <ng-template slTourCard>
    <div slTourContent>
      <h3 slTourTitle></h3>
      <p slTourDescription></p>
      <div slTourFooter>
        <span aria-hidden="true">{{ tour.position() }} / {{ tour.total() }}</span>
        <button slButton size="sm" variant="ghost" (click)="openGuide()">Read the guide</button>
        <button slButton slTourNext size="sm" tone="accent">
          {{ tour.t(tour.last() ? 'done' : 'next') }}
        </button>
      </div>
    </div>
  </ng-template>
</sl-tour>`,
    }),
  },
  {
    id: 'labels',
    title: 'The tour in another language',
    note: 'The language in force says Next, Back, Done, Skip tour and “2 of 5” once for the application; a long German progress and title wrap inside the card rather than widening it.',
    snippet: defineSnippet({
      id: 'tour-angular-labels',
      language: 'ts',
      label: 'The language, once',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Walking the tour from the keyboard',
    note: 'Start with Enter: focus lands on the card. ArrowRight and ArrowLeft go on and back — mirrored right to left — Tab reaches the buttons, and Escape closes and gives focus back to Start tour.',
    snippet: defineSnippet({
      id: 'tour-angular-keyboard',
      language: 'angular',
      label: 'start(), from anywhere a template reaches the instance',
      source: `<button slButton (click)="tour.start()">Start tour</button>
<sl-tour #tour="slTour" [steps]="steps" />`,
    }),
  },
  {
    id: 'compact',
    title: 'On a phone',
    note: 'Below 600 pixels of viewport the card stops standing beside its target: a lateral side turns vertical and the card takes the width the screen has. layout="compact" forces it here; on a real phone auto takes it by itself.',
    snippet: defineSnippet({
      id: 'tour-angular-compact',
      language: 'angular',
      label: 'The phone composition, forced or automatic',
      source: `<sl-tour [steps]="steps" [(open)]="open" layout="compact" />`,
    }),
  },
  {
    id: 'edges',
    title: 'Targets in the corners, and one that fills the screen',
    note: 'The corner steps ask for a side with no room: the card flips and slides and the arrow keeps pointing. The chart is taller than the room left around it, so its card is centerd over it while the spotlight still frames it.',
    snippet: defineSnippet({
      id: 'tour-angular-edges',
      language: 'ts',
      label: 'Nothing to configure: the positioner and the room rule answer',
      source: `const steps: TourStep[] = [
  { id: 'alerts', target: '#alerts', side: 'top', title: 'Notifications' },
  { id: 'chart', target: '#chart', title: 'Revenue by region' },
];`,
    }),
  },
  {
    id: 'layers',
    title: 'Over a dialog a step opens',
    note: 'The second step opens the invite dialog in its prepare and points inside it. The tour stays on top — the dialog is the layer made inert, focus stays in the card — and Escape closes the tour while the dialog stays open.',
    snippet: defineSnippet({
      id: 'tour-angular-layers',
      language: 'ts',
      label: 'prepare opens the dialog the step points into',
      source: `const step: TourStep = {
  id: 'emails',
  target: '#invite-emails',
  title: 'Type their emails',
  prepare: async () => {
    this.inviteOpen.set(true);
  },
};`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChangeRequest',
    payload: "ChangeRequest<boolean> & { outcome?: 'complete' | 'skip' | 'close' | 'unavailable' }",
    when: 'Before the tour opens (programmatic, from start()) or closes: Done (pointer, keyboard; outcome complete), Skip (outcome skip), the close control (dismiss; close), Escape (escape; close), a press outside (outsidePress; close), the way back (back; close), or no step being available (programmatic; unavailable). cancel() keeps it open.',
  },
  {
    name: 'stepChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the current step moves: Next, Back (pointer, keyboard), the arrow keys (keyboard), advanceOn (the reason of the event on the target), goTo() and start(id) (programmatic). cancel() keeps the card where it is.',
  },
  {
    name: 'openChange / stepChange',
    payload: 'boolean / string | null',
    when: 'The two-way halves of [(open)] and [(step)], after a request was not cancelled.',
  },
  {
    name: '(click) on an action',
    payload: 'MouseEvent',
    when: 'Your handler runs on the same button; preventDefault() in it stops the family’s — a Next that validates first.',
  },
];

export const ANGULAR_TOUR_DOCS = {
  tour: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['steps', 'readonly TourStep[]', '—', 'sl-tour', 'Every step, in order'],
      ['open', 'model<boolean>', 'false', 'sl-tour', 'Whether the tour is open; two-way'],
      [
        'step',
        'model<string | null>',
        'null',
        'sl-tour',
        'The current step’s id; two-way. null is the first available step',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'sl-tour',
        'The card’s type and measure: 16, 20 or 24rem',
      ],
      [
        'layout',
        "'auto' | 'compact' | 'regular'",
        'auto',
        'sl-tour, provideTourDefaults',
        'The phone composition — lateral sides turned vertical, the card as wide as the screen — below 600px of viewport under auto, always or never',
      ],
      [
        'side',
        "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
        'bottom',
        'sl-tour, TourStep',
        'The side of the target the card stands on; flips when there is no room',
      ],
      ['align', "'start' | 'center' | 'end'", 'center', 'sl-tour, TourStep', 'Along that side'],
      ['sideOffset', 'number', '0', 'sl-tour', 'Extra distance from the spotlight’s edge'],
      ['alignOffset', 'number', '0', 'sl-tour', 'Extra distance along the side'],
      [
        'collisionPadding',
        'number',
        '8',
        'sl-tour',
        'How close to the viewport edge the card may come',
      ],
      [
        'arrowPadding',
        'number',
        '12',
        'sl-tour',
        'How close to the card’s corner the arrow may come',
      ],
      ['arrow', 'boolean', 'true', 'sl-tour', 'Draws the arrow on an anchored step'],
      [
        'modal',
        'boolean',
        'true',
        'sl-tour',
        'The page is inert and focus stays in the card; an interactive step is never modal',
      ],
      ['spotlight', 'boolean', 'true', 'sl-tour, TourStep', 'Cuts the target out of the scrim'],
      ['autoFocus', 'boolean', 'true', 'sl-tour', 'Focuses the card when the tour opens'],
      ['closeOnEscape', 'boolean', 'true', 'sl-tour', 'Escape closes, with the outcome close'],
      [
        'closeOnOutsidePress',
        'boolean',
        'false',
        'sl-tour',
        'A press outside the card closes; off so a stray press keeps the reader’s place',
      ],
      [
        'scrollIntoView',
        'boolean',
        'true',
        'sl-tour',
        'Scrolls a target that is not wholly on screen to the middle',
      ],
      [
        'missing',
        "'center' | 'skip'",
        'center',
        'sl-tour',
        'A step whose target cannot be found is shown centerd, or passed over',
      ],
      [
        'keyboardNavigation',
        'boolean',
        'true',
        'sl-tour',
        'ArrowRight and ArrowLeft go on and back from the card',
      ],
      [
        'targetTimeout',
        'number',
        '0',
        'sl-tour',
        'Milliseconds to watch the page for a target that is not there yet',
      ],
      [
        'messages',
        'PartialMessages<TourMessages>',
        '—',
        'sl-tour',
        'Words laid over the language in force, key by key: next, prev, done, skip, close, preparing, and progress with {position} and {total}',
      ],
      [
        'finalFocus',
        'Element | string',
        'the element focused at open',
        'sl-tour',
        'Where focus goes when the tour closes',
      ],
      ['id', 'string', '—', 'TourStep', 'Unique in the tour; the value of step'],
      [
        'target',
        'Element | string | { current } | () => Element | null',
        '—',
        'TourStep',
        'What the step points at; absent for a centerd step',
      ],
      ['title', 'string', '—', 'TourStep', 'The card’s title and accessible name'],
      ['description', 'string', '—', 'TourStep', 'The card’s accessible description'],
      [
        'content',
        'TemplateRef | string',
        '—',
        'TourStep',
        'The body; an ng-template slTourStep="id" in the tour does the same',
      ],
      [
        'media',
        'TemplateRef | string',
        '—',
        'TourStep',
        'A picture above the header: a template, or an image URL',
      ],
      ['when', '() => boolean', '—', 'TourStep', 'Passes over the step while it returns false'],
      [
        'prepare',
        '(signal: AbortSignal) => void | Promise<void>',
        '—',
        'TourStep',
        'Awaited before the target is looked for; a rejection is a missing target',
      ],
      [
        'interactive',
        'boolean',
        'false',
        'TourStep',
        'The target stays operable and the step is not modal',
      ],
      ['advanceOn', 'string', '—', 'TourStep', 'An event on the target that goes to the next step'],
      [
        'messages',
        'PartialMessages<{ next, prev, skip, done }>',
        '—',
        'TourStep',
        'The step’s own words, laid over the tour’s: “Start tour”, “Got it”',
      ],
      [
        'actions',
        '{ prev?, next?, skip?, close?: boolean }',
        'by position',
        'TourStep',
        'Shows or hides the card’s own controls for the step',
      ],
      [
        'announcement',
        'string',
        'the title',
        'TourStep',
        'Read out when the step arrives while focus is elsewhere',
      ],
      [
        'slTourStep',
        'ng-template, with slTourStepSlot: body | media',
        'body',
        'sl-tour content',
        'The lazy body or picture of the step with that id',
      ],
      [
        'slTourCard',
        'ng-template',
        'the whole card',
        'sl-tour content',
        'Your own arrangement of the parts',
      ],
      [
        'slTour',
        'exportAs',
        '—',
        'sl-tour',
        'start(id?), next(), prev(), goTo(id), close(outcome?), reposition(); position(), total(), t() and the rest as signals',
      ],
      [
        'provideTourDefaults',
        '(defaults) => Provider',
        '—',
        'an injector',
        'The decisions an application takes once; a tour or a step that states any of them wins',
      ],
    ]),
    accessibility: [
      'The APG has no tour pattern. A modal step answers its Dialog (Modal) pattern: the page behind becomes inert — out of reach of the pointer, Tab and a screen reader, not only dimmed — Tab and Shift+Tab stay in the card, and aria-modal is written only while that is true.',
      'The card is a dialog named by the step’s title and described by its description. It takes focus itself when the tour opens, so a reader hears the step before the buttons and Skip does not arrive armed; closing gives focus back to the element that had it.',
      'Focus follows the reader rather than the tour: a step change moves focus to the new card only when it was in the old one. A reader operating an interactive target keeps their place, and the new step is read out once through the shared polite live region.',
      'ArrowRight and ArrowLeft go on and back from the card, mirrored in a right-to-left document, and are left to a text field inside it. Escape closes from the topmost layer only.',
      'The progress is text in the card’s reading order — “2 of 5” — and not a row of dots a screen reader would count. The spotlight, the scrim and the arrow are hidden from assistive technology; under forced colors the scrim is dropped and the spotlight is drawn as a ring in the system highlight.',
    ],
    snippets: [
      defineSnippet({
        id: 'tour-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="tour" data-part="root" data-open data-modal data-spotlight data-placement="anchored">
  <div data-part="backdrop" aria-hidden="true"><div data-part="spotlight"></div></div>
  <div data-part="surface" data-side="bottom" data-align="center">
    <div data-part="arrow"></div>
    <div
      data-part="content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slotted-tour-1-title"
      tabindex="-1"
    >
      <div data-part="header">
        <p data-part="progress">2 of 5</p>
        <button data-part="close" aria-label="Close tour"></button>
      </div>
      <h2 data-part="title" id="slotted-tour-1-title">Share with your team</h2>
      <p data-part="description">Invite people by name or email.</p>
      <div data-part="footer">
        <button data-ui="button" data-part="skip">Skip tour</button>
        <button data-ui="button" data-part="prev">Back</button>
        <button data-ui="button" data-part="next">Next</button>
      </div>
    </div>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'tour-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='tour'] {
  --slotted-tour-spotlight-padding: var(--slotted-space-4);
  --slotted-tour-spotlight-radius: var(--slotted-radius-lg);
  --slotted-tour-measure: 22rem;
}`,
      }),
    ],
  },
} as const;
