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

export const REACT_TOUR_TOKENS = tourTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tour decision',
}));

const imports: ReferenceImport = {
  source: "import { Tour, TourDefaultsProvider, useTour } from '@slotted/react';",
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
      'The scrim, faded in and out as dialog’s is. Takes every press on a modal step. Absent on a non-modal step without a spotlight.',
  },
  {
    part: 'spotlight',
    element: 'div',
    required: false,
    purpose:
      'The cutout round the target; its shadow is the scrim. It travels from one target to the next. Absent on a centerd step and under spotlight={false}.',
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
      'Points at the target from the card’s edge. Absent on a centerd step and under arrow={false}.',
  },
  {
    part: 'content',
    element: 'div role="dialog"',
    required: true,
    purpose:
      'TourContent. The card: named by the title, described by the description, aria-modal on a modal step. Takes focus and reads the arrow keys. It draws no padding: TourHeader, TourBody and TourFooter carry the card inset, set by --slotted-tour-padding-inline and --slotted-tour-padding-block.',
  },
  {
    part: 'media',
    element: 'div',
    required: false,
    purpose: 'TourMedia. The step’s media, full bleed above the header.',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose: 'TourHeader. The progress and the close control on one row.',
  },
  {
    part: 'progress',
    element: 'p',
    required: false,
    purpose:
      'TourProgress. “2 of 5”, counting the steps available now. Absent in a tour of one step.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose: 'TourClose. Closes with the outcome close; named by messages.close.',
  },
  {
    part: 'title',
    element: 'h2',
    required: true,
    purpose: 'TourTitle. The step’s title and the card’s accessible name.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose: 'TourDescription. The step’s description, and the card’s accessible description.',
  },
  {
    part: 'body',
    element: 'div',
    required: false,
    purpose: 'TourBody. The step’s content: the only part of the card that scrolls.',
  },
  {
    part: 'footer',
    element: 'div',
    required: true,
    purpose:
      'TourFooter. Skip at the start, Back and Next at the end; a narrow card lifts Skip to a line of its own.',
  },
  {
    part: 'skip',
    element: 'Button, ghost',
    required: false,
    purpose: 'TourSkip. Closes with the outcome skip. Absent on the last step.',
  },
  {
    part: 'prev',
    element: 'Button, outline',
    required: false,
    purpose: 'TourPrev. The previous available step. Absent on the first.',
  },
  {
    part: 'next',
    element: 'Button, solid accent',
    required: false,
    purpose:
      'TourNext. The next available step, or Done on the last (data-last). data-loading while the next step prepares.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The five stops of a reports workspace, from a welcome card to the export button. Start it, walk it with Next and Back, and read the last request under the screen.',
    snippet: defineSnippet({
      id: 'tour-react-playground',
      language: 'tsx',
      label: 'Five steps, the first one centerd',
      source: `const steps: TourStep[] = [
  { id: 'welcome', title: 'Welcome to Reports', description: 'Five stops, about a minute.' },
  { id: 'search', target: '#search', title: 'Find any report' },
  { id: 'filters', target: '#filters', title: 'Narrow it down' },
  { id: 'share', target: '#share', title: 'Share with your team' },
  { id: 'export', target: '#export', title: 'Export what you see' },
];

const [open, setOpen] = useState(false);

<Tour onOpenChange={setOpen} open={open} steps={steps} />;`,
    }),
  },
  {
    id: 'placement',
    title: 'Where the card stands',
    note: 'Each step names the side of its target; the card flips when that side has no room and slides along the edge to stay on screen, and the arrow keeps pointing at the target.',
    snippet: defineSnippet({
      id: 'tour-react-placement',
      language: 'tsx',
      label: 'side and align, per step or for the tour',
      source: `const steps: TourStep[] = [
  { id: 'nav', target: '#nav', side: 'inline-end', title: 'Every workspace' },
  { id: 'export', target: '#export', side: 'top', align: 'end', title: 'Export' },
];

<Tour side="bottom" steps={steps} />;`,
    }),
  },
  {
    id: 'centered',
    title: 'A step with no target',
    note: 'The opening step points at nothing: it stands in the middle of the screen over the whole scrim, with a picture above the header and its own words, “Not now” and “Start tour”.',
    snippet: defineSnippet({
      id: 'tour-react-centered',
      language: 'tsx',
      label: 'media and per-step messages',
      source: `const step: TourStep = {
  id: 'welcome',
  title: 'Welcome to Reports',
  description: 'Five stops, about a minute.',
  media: <img alt="" src="/tour/reports.png" />,
  messages: { next: 'Start tour', skip: 'Not now' },
};`,
    }),
  },
  {
    id: 'spotlight',
    title: 'With and without the spotlight',
    note: 'The spotlight cuts the target out of the scrim and travels to the next one. spotlight={false} on a non-modal tour is a coach mark: a card beside its control and nothing dimmed.',
    snippet: defineSnippet({
      id: 'tour-react-spotlight',
      language: 'tsx',
      label: 'A coach mark',
      source: `<Tour
  modal={false}
  spotlight={false}
  steps={[{ id: 'views', target: '#views', title: 'Keep this view', messages: { done: 'Got it' } }]}
/>;`,
    }),
  },
  {
    id: 'modal',
    title: 'What a modal step does to the page',
    note: 'On a modal step the page is inert — out of reach of the pointer, the keyboard and a screen reader — Tab stays inside the card, and Escape closes. modal={false} leaves the page reachable.',
    snippet: defineSnippet({
      id: 'tour-react-modal',
      language: 'tsx',
      label: 'A tour the reader can work around',
      source: `<Tour closeOnOutsidePress modal={false} steps={steps} />;`,
    }),
  },
  {
    id: 'interactive',
    title: 'A step the reader completes',
    note: 'Press New report: the step is interactive, so the target stays operable, Next is gone, and the press on the target itself goes on — advanceOn names the event. Tab from the card reaches the target.',
    snippet: defineSnippet({
      id: 'tour-react-interactive',
      language: 'tsx',
      label: 'advanceOn and interactive',
      source: `const step: TourStep = {
  id: 'create',
  target: '#new-report',
  title: 'Create your first report',
  description: 'Press New report. The tour continues once it opens.',
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
      id: 'tour-react-availability',
      language: 'tsx',
      label: 'when, read each time navigation reaches the step',
      source: `const step: TourStep = {
  id: 'billing',
  target: '#billing',
  title: 'Invoices and plans',
  when: () => user.role === 'owner',
};`,
    }),
  },
  {
    id: 'missing',
    title: 'A target that is not on the page',
    note: 'The sidebar is collapsed, so the sidebar step has nothing to point at. Under missing="center" it stands centerd with data-missing and says what it had to say; under "skip" it is passed over.',
    snippet: defineSnippet({
      id: 'tour-react-missing',
      language: 'tsx',
      label: 'What to do when a target cannot be found',
      source: `<Tour missing="skip" steps={steps} targetTimeout={800} />;`,
    }),
  },
  {
    id: 'prepare',
    title: 'Preparing the page for a step',
    note: 'The columns step opens the column menu first: prepare runs, Next carries its loading sweep for as long as it takes, and the card only moves once the menu — the step’s target — is on the page.',
    snippet: defineSnippet({
      id: 'tour-react-prepare',
      language: 'tsx',
      label: 'prepare, with the signal that aborts it',
      source: `const step: TourStep = {
  id: 'columns',
  target: '#column-menu',
  title: 'Choose your columns',
  prepare: async (signal) => {
    setMenuOpen(true);
    await loadColumns({ signal });
  },
};`,
    }),
  },
  {
    id: 'controlled',
    title: 'The product owns the tour',
    note: 'open and step are the product’s: it starts at the step it saved, refuses to leave the filters step until a filter is chosen, and records the outcome — complete, skip or close — to decide whether to offer the tour again.',
    snippet: defineSnippet({
      id: 'tour-react-controlled',
      language: 'tsx',
      label: 'open, step and the outcome',
      source: `<Tour
  onOpenChange={(next, request) => {
    setOpen(next);
    if (!next) saveTourOutcome(request.outcome);
  }}
  onStepChange={(next, request) => {
    if (step === 'filters' && !hasFilter) return request.cancel();
    setStep(next);
  }}
  open={open}
  step={step}
  steps={steps}
/>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composing the card',
    note: 'The card is the product’s own arrangement: dots from useTour() instead of the progress text, an action of its own beside Next, and the title set as a heading one level down.',
    snippet: defineSnippet({
      id: 'tour-react-composition',
      language: 'tsx',
      label: 'Parts, and the hook they read',
      source: `function Dots() {
  const { position, total } = useTour();
  return <span aria-hidden="true">{'●'.repeat(position) + '○'.repeat(total - position)}</span>;
}

<Tour steps={steps}>
  <TourContent>
    <TourTitle render={(props) => <h3 {...props} />} />
    <TourDescription />
    <TourFooter>
      <Dots />
      <Button onClick={openHelp}>Read the guide</Button>
      <TourNext />
    </TourFooter>
  </TourContent>
</Tour>;`,
    }),
  },
  {
    id: 'labels',
    title: 'The tour in another language',
    // language: pt-BR
    note: 'The language in force says Próximo, Voltar, Concluir, Pular tour and “2 de 5” once for the application; a long German progress and title wrap inside the card rather than widening it.',
    // language: en-US
    snippet: defineSnippet({
      id: 'tour-react-labels',
      language: 'tsx',
      label: 'The language, once',
      source: `<SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
  <App />
</SlottedProvider>;

<Tour messages={{ progress: 'Passo {position} de {total}' }} steps={steps} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Walking the tour from the keyboard',
    note: 'Start with Enter: focus lands on the card. ArrowRight and ArrowLeft go on and back — mirrored right to left — Tab reaches the buttons, and Escape closes and gives focus back to Start tour.',
    snippet: defineSnippet({
      id: 'tour-react-keyboard',
      language: 'tsx',
      label: 'The handle, for a start from anywhere',
      source: `const tour = useRef<TourHandle>(null);

<>
  <Button onClick={() => tour.current?.start()}>Start tour</Button>
  <Tour ref={tour} steps={steps} />
</>;`,
    }),
  },
  {
    id: 'compact',
    title: 'On a phone',
    note: 'Below 600 pixels of viewport the card stops standing beside its target: a lateral side turns vertical and the card takes the width the screen has. layout="compact" forces it here; on a real phone auto takes it by itself.',
    snippet: defineSnippet({
      id: 'tour-react-compact',
      language: 'tsx',
      label: 'The phone composition, forced or automatic',
      source: `<Tour layout="compact" steps={steps} />;`,
    }),
  },
  {
    id: 'edges',
    title: 'Targets in the corners, and one that fills the screen',
    note: 'The corner steps ask for a side with no room: the card flips and slides and the arrow keeps pointing. The chart is taller than the room left around it, so its card is centerd over it while the spotlight still frames it.',
    snippet: defineSnippet({
      id: 'tour-react-edges',
      language: 'tsx',
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
      id: 'tour-react-layers',
      language: 'tsx',
      label: 'prepare opens the dialog the step points into',
      source: `const step: TourStep = {
  id: 'emails',
  target: '#invite-emails',
  title: 'Type their emails',
  prepare: async () => {
    setInviteOpen(true);
  },
};`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload:
      "(open: boolean, request: ChangeRequest<boolean> & { outcome?: 'complete' | 'skip' | 'close' | 'unavailable' })",
    when: 'Before the tour opens (programmatic, from start()) or closes: Done (pointer, keyboard; outcome complete), Skip (outcome skip), the close control (dismiss; close), Escape (escape; close), a press outside (outsidePress; close), the way back (back; close), or no step being available (programmatic; unavailable). cancel() keeps it open.',
  },
  {
    name: 'onStepChange',
    payload: '(step: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the current step moves: Next, Back (pointer, keyboard), the arrow keys (keyboard), advanceOn (the reason of the event on the target), goTo() and start(id) (programmatic), and a step that stood in for an unavailable one (programmatic). cancel() keeps the card where it is.',
  },
  {
    name: 'onClick and onKeyDown on each part',
    payload: 'the element’s own event',
    when: 'Run before the family’s own handler; preventDefault() in yours stops it — a Next that validates first.',
  },
];

export const REACT_TOUR_DOCS = {
  tour: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['steps', 'readonly TourStep[]', '—', 'Tour', 'Every step, in order'],
      ['open', 'boolean', '—', 'Tour', 'Whether the tour is open; controlled'],
      ['defaultOpen', 'boolean', 'false', 'Tour', 'Opens on mount; uncontrolled'],
      ['step', 'string | null', '—', 'Tour', 'The current step’s id; controlled'],
      [
        'defaultStep',
        'string | null',
        'null',
        'Tour',
        'The step an uncontrolled tour starts at; null is the first available',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Tour', 'The card’s type and measure: 16, 20 or 24rem'],
      [
        'layout',
        "'auto' | 'compact' | 'regular'",
        'auto',
        'Tour',
        'The phone composition — lateral sides turned vertical, the card as wide as the screen — below 600px of viewport under auto, always or never',
      ],
      [
        'side',
        "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
        'bottom',
        'Tour, TourStep',
        'The side of the target the card stands on; flips when there is no room',
      ],
      ['align', "'start' | 'center' | 'end'", 'center', 'Tour, TourStep', 'Along that side'],
      ['sideOffset', 'number', '0', 'Tour', 'Extra distance from the spotlight’s edge'],
      ['alignOffset', 'number', '0', 'Tour', 'Extra distance along the side'],
      [
        'collisionPadding',
        'number',
        '8',
        'Tour',
        'How close to the viewport edge the card may come',
      ],
      ['arrowPadding', 'number', '12', 'Tour', 'How close to the card’s corner the arrow may come'],
      ['arrow', 'boolean', 'true', 'Tour', 'Draws the arrow on an anchored step'],
      [
        'modal',
        'boolean',
        'true',
        'Tour',
        'The page is inert and focus stays in the card; an interactive step is never modal',
      ],
      ['spotlight', 'boolean', 'true', 'Tour, TourStep', 'Cuts the target out of the scrim'],
      ['autoFocus', 'boolean', 'true', 'Tour', 'Focuses the card when the tour opens'],
      ['closeOnEscape', 'boolean', 'true', 'Tour', 'Escape closes, with the outcome close'],
      [
        'closeOnOutsidePress',
        'boolean',
        'false',
        'Tour',
        'A press outside the card closes; off so a stray press keeps the reader’s place',
      ],
      [
        'scrollIntoView',
        'boolean',
        'true',
        'Tour',
        'Scrolls a target that is not wholly on screen to the middle',
      ],
      [
        'missing',
        "'center' | 'skip'",
        'center',
        'Tour',
        'A step whose target cannot be found is shown centerd, or passed over',
      ],
      [
        'keyboardNavigation',
        'boolean',
        'true',
        'Tour',
        'ArrowRight and ArrowLeft go on and back from the card',
      ],
      [
        'targetTimeout',
        'number',
        '0',
        'Tour',
        'Milliseconds to watch the page for a target that is not there yet',
      ],
      [
        'messages',
        'PartialMessages<TourMessages>',
        '—',
        'Tour',
        'Words laid over the language in force, key by key: next, prev, done, skip, close, preparing, and progress with {position} and {total}',
      ],
      [
        'finalFocus',
        'Element | Ref | string',
        'the element focused at open',
        'Tour',
        'Where focus goes when the tour closes',
      ],
      [
        'children',
        'ReactNode',
        'the whole card',
        'Tour',
        'The consumer’s own arrangement of the parts',
      ],
      [
        'ref',
        'Ref<TourHandle>',
        '—',
        'Tour',
        'start(id?), next(), prev(), goTo(id), close(outcome?), reposition()',
      ],
      ['id', 'string', '—', 'TourStep', 'Unique in the tour; the value of step'],
      [
        'target',
        'Element | Ref | string | () => Element | null',
        '—',
        'TourStep',
        'What the step points at; absent for a centerd step',
      ],
      ['title', 'ReactNode', '—', 'TourStep', 'The card’s title and accessible name'],
      ['description', 'ReactNode', '—', 'TourStep', 'The card’s accessible description'],
      ['content', 'ReactNode', '—', 'TourStep', 'The body, which scrolls'],
      ['media', 'ReactNode', '—', 'TourStep', 'An image or a video above the header'],
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
        'the title’s text',
        'TourStep',
        'Read out when the step arrives while focus is elsewhere',
      ],
      [
        'render',
        '(props) => ReactElement',
        'the part’s element',
        'every part',
        'Substitutes a part’s element; attach props.ref beside your own',
      ],
      [
        'native props',
        'ComponentPropsWithRef<…>',
        '—',
        'every part',
        'aria-*, data-*, className, style and handlers reach the part’s element',
      ],
      [
        'TourDefaultsProvider',
        '{ size, side, align, modal, spotlight, missing, targetTimeout, container, … }',
        '—',
        'a subtree',
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
        id: 'tour-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="tour"
  data-part="root"
  data-open=""
  data-modal=""
  data-spotlight=""
  data-placement="anchored"
>
  <div data-part="backdrop" aria-hidden="true">
    <div data-part="spotlight" />
  </div>
  <div data-part="surface" data-side="bottom" data-align="center">
    <div data-part="arrow" />
    <div
      data-part="content"
      role="dialog"
      aria-modal="true"
      aria-labelledby=":r1:title"
      tabindex="-1"
    >
      <div data-part="header">
        <p data-part="progress">2 of 5</p>
        <button data-part="close" aria-label="Close tour" />
      </div>
      <h2 data-part="title" id=":r1:title">
        Share with your team
      </h2>
      <p data-part="description">Invite people by name or email.</p>
      <div data-part="footer">
        <button data-ui="button" data-part="skip">
          Skip tour
        </button>
        <button data-ui="button" data-part="prev">
          Back
        </button>
        <button data-ui="button" data-part="next">
          Next
        </button>
      </div>
    </div>
  </div>
</div>;`,
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
