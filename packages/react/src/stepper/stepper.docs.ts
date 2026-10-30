import stepperTokens from '@slotted/styles/stepper/tokens.json';
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

export const REACT_STEPPER_TOKENS = stepperTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Stepper decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Stepper,\n  StepperDefaultsProvider,\n  StepperList,\n  StepperPanel,\n  StepperStep,\n  useStepper,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'Owns the step, the orientation, the navigation mode and the container query that reflows the row. Carries data-ui="stepper" and the three axes as data attributes. It is not a landmark: a stepper inside a page whose navigation is elsewhere would be a second one.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose:
      'The ordered list, which is what carries the sequence and the set size without a single ARIA attribute. It holds the name of the flow, and it is where the arrow keys are handled — only the list knows every header.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One step, and the element every state is written on: data-current, data-complete, data-invalid, data-disabled and data-loading. It renders the connector after itself, and never after the last step.',
  },
  {
    part: 'trigger',
    element: 'button, a or span',
    required: true,
    purpose:
      'The step header, in whichever element navigation decided. It carries aria-current="step" when it is the step the reader is on, and aria-disabled when a linear flow has not opened it.',
  },
  {
    part: 'marker',
    element: 'span',
    required: true,
    purpose:
      'The circle. It holds the step number, gives way to a check when the step is complete and to a cross when it failed, and is hidden from assistive technology because the status part says the same thing in words.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      "The step's name. The description renders inside it rather than beside it, so the marker sits against the whole text block and not against its first line.",
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'The second line, nested inside label. Absent unless the step states one, and it wraps with the name rather than pushing the marker.',
  },
  {
    part: 'status',
    element: 'span',
    required: true,
    purpose:
      'The visually hidden run that makes a header announce "Cart, Step 2 of 4, current" instead of "2". It carries the position, the status and, where they apply, the words for loading and unavailable.',
  },
  {
    part: 'separator',
    element: 'span',
    required: false,
    purpose:
      'The connector to the next step, aria-hidden and never drawn after the last. It carries data-complete for a step the reader has walked past, which is distance travelled rather than work completed.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'The content of the step it is written inside, rendered only while that step is current. A group labelled by its own header rather than a tabpanel, and focusable so a consumer moving focus after a change has somewhere to put it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on one flow, driven by the controls below the canvas. Switch navigation to none and the same markup becomes a read-only progress indicator.',
    snippet: defineSnippet({
      id: 'stepper-react-playground',
      language: 'tsx',
      label: 'A four-step checkout',
      source:
        '<Stepper defaultStep={1}>\n  <StepperList>\n    <StepperStep label="Cart" complete />\n    <StepperStep label="Address" />\n    <StepperStep label="Payment" />\n  </StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the flow runs',
    note: 'Horizontal is a row of equal columns, so five steps divide the width evenly however long their names are. Vertical runs the connector down the marker center and leaves room for a panel under each step.',
    snippet: defineSnippet({
      id: 'stepper-react-orientation',
      language: 'tsx',
      label: 'A row, and a column',
      source: '<Stepper orientation="vertical">\n  <StepperList>{steps}</StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'statuses',
    title: 'The five things a step can be',
    note: 'Each status is a fill and a shape, never a color alone: an outline for pending, a ring for current, a filled disc with a check for complete, a red disc with a cross for a failure, and a grey outline for a step the flow closed.',
    snippet: defineSnippet({
      id: 'stepper-react-statuses',
      language: 'tsx',
      label: 'Marking one step done and one failed',
      source:
        '<StepperStep label="Cart" complete />;\n<StepperStep label="Address" invalid />;\n<StepperStep label="Review" disabled />;',
    }),
  },
  {
    id: 'linear',
    title: 'A flow that must be taken in order',
    note: 'With linear, a header is reachable only once every step before it is complete. The rest keep their place in the tab sequence and say aria-disabled, so a reader can find the step and learn it is not yet open.',
    snippet: defineSnippet({
      id: 'stepper-react-linear',
      language: 'tsx',
      label: 'Enforcing the order, and refusing a move',
      source:
        '<Stepper linear onStepChange={(step, request) => valid || request.cancel()}>\n  <StepperList>{steps}</StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'navigation',
    title: 'What a header is',
    note: 'button is a control the reader presses, link is a destination with its own URL, and none is a span nothing can press — one family covering both an interactive stepper and a read-only progress indicator.',
    snippet: defineSnippet({
      id: 'stepper-react-navigation',
      language: 'tsx',
      label: 'The three modes',
      source:
        '<Stepper navigation="link">\n  <StepperList>\n    <StepperStep href="/checkout/cart" label="Cart" />\n  </StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'placement',
    title: 'Where the label sits',
    note: 'end puts the name beside the marker and leaves the connector whatever the name does not take; bottom centers the marker over its own column, which is what a row of five long names needs.',
    snippet: defineSnippet({
      id: 'stepper-react-placement',
      language: 'tsx',
      label: 'Beside the marker, or under it',
      source:
        '<Stepper labelPlacement="bottom">\n  <StepperList>{steps}</StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'panels',
    title: 'The content of a step',
    note: 'A panel renders only while its own step is current, so the flow shows one at a time. It is a group labelled by its header, and the button that advances is yours — this family ships none.',
    snippet: defineSnippet({
      id: 'stepper-react-panels',
      language: 'tsx',
      label: 'A step and the content behind it',
      source:
        '<StepperStep label="Address">\n  <StepperPanel>\n    <AddressForm />\n  </StepperPanel>\n</StepperStep>;',
    }),
  },
  {
    id: 'compact',
    title: 'A row with no room to be one',
    note: 'Below thirty rems of its own inline size a horizontal stepper becomes a column. Drag the stage narrower and watch the connectors turn with it, rather than five names shrinking to two characters each.',
    snippet: defineSnippet({
      id: 'stepper-react-compact',
      language: 'tsx',
      label: 'Nothing to write: the container decides',
      source:
        '// The reflow is a container query on the family itself, so a stepper in a\n// narrow panel becomes a column while the same one on a full page does not.\n<Stepper orientation="horizontal">\n  <StepperList>{steps}</StepperList>\n</Stepper>;',
    }),
  },
  {
    id: 'content',
    title: 'Names the flow did not choose',
    note: 'Six steps, a German compound and a phrase of four words. The label wraps inside its own column, the marker never does, and the connector takes whatever is left.',
    snippet: defineSnippet({
      id: 'stepper-react-content',
      language: 'tsx',
      label: 'A long name and a second line',
      source:
        '<StepperStep description="Compiled in 42 seconds" label="Zahlungsabwicklungseinstellungen" />;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'useStepper() hands you the move and whether it is available, so the button that advances is your own — and StepperDefaultsProvider decides the orientation, the placement and the mode for a whole application.',
    snippet: defineSnippet({
      id: 'stepper-react-composition',
      language: 'tsx',
      label: 'Your own advance button, and defaults for the application',
      source:
        'const stepper = useStepper();\n\n<Button disabled={!stepper.canGoNext} onClick={() => stepper.next()}>\n  Continue\n</Button>;\n\n<StepperDefaultsProvider labelPlacement="bottom" orientation="vertical">\n  <App />\n</StepperDefaultsProvider>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every header; the arrows reach exactly the same ones, following the reading direction and wrapping; Home and End go to the ends; Enter and Space move to a step the flow has opened.',
    snippet: defineSnippet({
      id: 'stepper-react-keyboard',
      language: 'tsx',
      label: 'What each header announces',
      source:
        '// "Cart, Step 1 of 4, completed" — the position and the status in words,\n// because the number in the circle is hidden from assistive technology.\n<Stepper defaultStep={1} messages={{ label: \'Checkout\' }}>\n  <StepperList>{steps}</StepperList>\n</Stepper>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onStepChange',
    payload: '(step: number, request: ChangeRequest<number>)',
    when: 'Before the step moves. The request carries the step it replaces, the reason — pointer, keyboard or programmatic — and the originating event. Cancelling it commits nothing, and that is how a consumer refuses a move: this family ships no isStepValid, because the request already says the same thing at the same moment.',
  },
];

export const REACT_STEPPER_DOCS = {
  stepper: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'step',
        'number',
        '—',
        'Stepper',
        'Present means controlled, for the life of the component. Zero-based.',
      ],
      [
        'defaultStep',
        'number',
        '0',
        'Stepper',
        'What an uncontrolled stepper starts from, read once, and where reset() returns to',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Stepper',
        'A row of equal columns, or a column. A horizontal flow turns vertical below thirty rems of its own inline size.',
      ],
      [
        'labelPlacement',
        "'end' | 'bottom'",
        'end',
        'Stepper',
        'The name beside the marker, or under it',
      ],
      [
        'navigation',
        "'button' | 'link' | 'none'",
        'button',
        'Stepper',
        'What a header is. none renders a span and is a read-only progress indicator.',
      ],
      [
        'linear',
        'boolean',
        'false',
        'Stepper',
        'Requires every earlier step to be complete before a later one is reachable',
      ],
      [
        'autoComplete',
        'boolean',
        'false',
        'Stepper',
        'Whether reaching a later step means the earlier ones are finished. Off, because walking past a step is not completing it.',
      ],
      [
        'messages',
        'PartialMessages<StepperMessages>',
        '—',
        'Stepper',
        'Words laid over the language in force, key by key: the name of the sequence announced on the list (label), the position, and the five statuses a step announces',
      ],
      [
        'complete',
        'boolean',
        '—',
        'Stepper.Step',
        'The consumer says the work on this step is done. Only the consumer knows.',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'Stepper.Step',
        'The work on this step failed. Outranks complete, and the marker draws a cross.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Stepper.Step',
        'Takes the header out of reach, in a linear flow or outside one',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Stepper.Step',
        'The step is waiting on something; the header stops answering and announces it',
      ],
      ['description', 'ReactNode', '—', 'Stepper.Step', 'The second line, rendered inside label'],
      ['href', 'string', '—', 'Stepper.Step', 'The destination, when navigation is link'],
      [
        'marker',
        'ReactNode',
        '—',
        'Stepper.Step',
        'What the circle shows in place of the step number',
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
        'useStepper()',
        '() => StepperContextValue',
        '—',
        'inside a Stepper',
        'step, count, percent, canGoNext, canGoPrevious, next, previous, goToStep and reset — the move a consumer cannot express as a prop, for a button of their own',
      ],
      [
        'StepperDefaultsProvider',
        'labelPlacement | linear | navigation | orientation',
        '—',
        'Application',
        'Sets those four once for everything below it; a prop on the stepper still wins',
      ],
    ]),
    accessibility: [
      'The family refuses role="tablist" and role="tab", which Angular Material gives a horizontal stepper. Section 7 of the feature guide forbids it in the Tabs entry itself: tabs are for peer views in one context, not for the steps of a process, and a tab list would tell a reader the panels may be taken in any order. What replaces it is an ol and li for the sequence and the set size, a name on the list, and a status in words inside every header.',
      'The current header carries aria-current="step", which is the value the ARIA specification names for a link inside a step indicator for a step-based process. The item beside it also carries data-current, because the marker, the label and the connector are all styled from the item and none of them is the trigger.',
      'A step a linear flow has not opened carries aria-disabled rather than disabled, so it keeps its place in the tab sequence. A reader can find out the step exists and that it is not yet available, which a removed tab stop would not tell them.',
      'Each header holds a visually hidden status, so what a reader hears is "Cart, Step 2 of 4, current" rather than "2". The marker is aria-hidden for the same reason: the number is the picture, and the words are the announcement.',
      'A panel is a group labelled by its own header, related through aria-controls and aria-labelledby without either claiming to be a tab, and it takes tabindex="-1" so a consumer moving focus after a step change has somewhere to put it.',
      'The arrows reach every header, exactly where Tab reaches. They were added on top of the tab sequence rather than replacing it with a roving tab stop — that is the model a tablist has — so a step a linear flow has not opened is still one a reader is allowed to find.',
      'No status depends on color: a complete step fills and draws a check, a failed one fills and draws a cross, the current one is a ring, and a pending one is an outline whose ring holds the 3:1 a non-text element needs.',
    ],
    snippets: [
      defineSnippet({
        id: 'stepper-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-label-placement="end"\n  data-navigation="button"\n  data-orientation="horizontal"\n  data-part="root"\n  data-ui="stepper"\n>\n  <ol aria-label="Checkout" data-part="list">\n    <li data-complete="" data-part="item">\n      <button data-part="trigger" type="button">\n        <span aria-hidden="true" data-part="marker">\n          1\n        </span>\n        <span data-part="label">\n          Cart\n          <span data-part="description">Two items</span>\n        </span>\n        <span data-part="status" data-ui="visually-hidden">\n          , Step 1 of 2, completed\n        </span>\n      </button>\n      <span aria-hidden="true" data-complete="" data-part="separator" />\n    </li>\n  </ol>\n</div>;',
      }),
      defineSnippet({
        id: 'stepper-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='stepper'] {\n  --slotted-stepper-marker-size: 28px;\n  --slotted-stepper-connector-thickness: 1px;\n  --slotted-stepper-track-gap: 1rem;\n}",
      }),
    ],
  },
} as const;
