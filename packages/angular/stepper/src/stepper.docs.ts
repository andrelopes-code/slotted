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

export const ANGULAR_STEPPER_TOKENS = stepperTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Stepper decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlStepper,\n  SlStepperList,\n  SlStepperNext,\n  SlStepperPanel,\n  SlStepperPrevious,\n  SlStepperStep,\n  provideStepperDefaults,\n} from '@slotted/angular/stepper';",
  selector:
    '[slStepper], ol[slStepperList], li[slStepperStep], [slStepperPanel], button[slStepperNext], button[slStepperPrevious]',
  exportAs:
    'slStepper, slStepperList, slStepperStep, slStepperPanel, slStepperNext, slStepperPrevious',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The consumer’s own element, carrying data-ui="stepper" and the three axes as data attributes. It owns the step, the count and the container the reflow measures, and it claims no landmark: a second navigation region on a page whose main navigation is elsewhere is noise.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose:
      'The ordered list, which is what carries the sequence and the set size without a single ARIA attribute. It holds the accessible name of the flow and handles the arrow keys, because only the list knows every header.',
  },
  {
    part: 'item',
    element: 'li',
    required: true,
    purpose:
      'One step, and the element every state attribute lands on: data-current, data-complete, data-invalid, data-disabled and data-loading. The marker, the label and the connector are all styled from here.',
  },
  {
    part: 'trigger',
    element: 'button, a or span',
    required: true,
    purpose:
      'The step header. navigation decides which of the three it is, and a span is the read-only progress indicator the field ships as a separate component. Carries aria-current="step" and, in a linear flow it has not opened, aria-disabled.',
  },
  {
    part: 'marker',
    element: 'span',
    required: true,
    purpose:
      'The circle holding the step’s number, replaced by a check when the step is complete and by a cross when it failed. Hidden from assistive technology, because the status part already says all of it in words.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The step’s name, and the block the description renders inside — a marker sits against the whole text block rather than against its first line.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'The second line under the step’s name. It renders inside label rather than beside it, so a two-line step still lines its marker up with both lines.',
  },
  {
    part: 'status',
    element: 'span',
    required: true,
    purpose:
      'The visually hidden run that turns "2" into "Cart, Step 2 of 4, current". It is rendered with the visually-hidden family and prefixed with a comma, because nothing separates two elements’ text when the accessible name is computed.',
  },
  {
    part: 'separator',
    element: 'span',
    required: false,
    purpose:
      'The connector between two markers, drawn after every step but the last and never announced. It fills for a step the reader has walked past, which is distance travelled rather than work completed.',
  },
  {
    part: 'panel',
    element: 'div',
    required: false,
    purpose:
      'The content of the step it is written inside, shown only while that step is current. A group labelled by its own trigger rather than a tabpanel, and focusable so a consumer moving focus after a step change has somewhere to put it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every input on one flow, driven by the controls below the canvas. Turn linear on and watch which headers stop being reachable while staying in the tab sequence.',
    snippet: defineSnippet({
      id: 'stepper-angular-playground',
      language: 'angular',
      label: 'A four-step flow',
      source:
        '<div slStepper [defaultStep]="1" label="Checkout">\n  <ol slStepperList>\n    <li slStepperStep label="Cart" [complete]="true"></li>\n    <li slStepperStep label="Address"></li>\n    <li slStepperStep label="Payment"></li>\n    <li slStepperStep label="Review"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'orientation',
    title: 'Which way the flow runs',
    note: 'Horizontal divides the width into equal columns so five markers line up however long their labels are; vertical runs the connector down the marker’s own center line.',
    snippet: defineSnippet({
      id: 'stepper-angular-orientation',
      language: 'angular',
      label: 'A row and a column',
      source:
        '<div slStepper orientation="horizontal">\n  <ol slStepperList>\n    …\n  </ol>\n</div>\n\n<div slStepper orientation="vertical">\n  <ol slStepperList>\n    …\n  </ol>\n</div>',
    }),
  },
  {
    id: 'statuses',
    title: 'The four statuses, and the fifth that is not one',
    note: 'Each is a fill and an edge rather than a color alone: an outline for pending, a ring for current, a filled disc with a check for complete, a filled disc with a cross for a failure.',
    snippet: defineSnippet({
      id: 'stepper-angular-statuses',
      language: 'angular',
      label: 'Complete, failed, current, pending, closed',
      source:
        '<li slStepperStep label="Complete" [complete]="true"></li>\n<li slStepperStep label="Failed" invalid></li>\n<li slStepperStep label="Current"></li>\n<li slStepperStep label="Pending"></li>\n<li slStepperStep label="Closed" [disabled]="true"></li>',
    }),
  },
  {
    id: 'linear',
    title: 'A flow that has to be taken in order',
    note: 'linear reaches backwards freely and forwards only as far as the first step whose predecessors are complete. Everything further carries aria-disabled and stays reachable by Tab.',
    snippet: defineSnippet({
      id: 'stepper-angular-linear',
      language: 'angular',
      label: 'Refusing a move by cancelling the request',
      source:
        '<div slStepper linear (stepChange)="onStepChange($event)">\n  <ol slStepperList>\n    …\n  </ol>\n</div>',
    }),
  },
  {
    id: 'navigation',
    title: 'What a header is',
    note: 'A button moves the step, a link carries a destination of its own, and none is a read-only progress indicator — one family covering what the field ships as two components.',
    snippet: defineSnippet({
      id: 'stepper-angular-navigation',
      language: 'angular',
      label: 'The three navigation modes',
      source:
        '<div slStepper navigation="button">…</div>\n<div slStepper navigation="link">\n  <ol slStepperList>\n    <li slStepperStep label="Cart" href="/cart"></li>\n  </ol>\n</div>\n<div slStepper navigation="none">…</div>',
    }),
  },
  {
    id: 'placement',
    title: 'Where the label sits',
    note: 'end puts the name beside the marker and gives the connector whatever the label leaves; bottom centers the marker over its own label, which is what a row of five names needs.',
    snippet: defineSnippet({
      id: 'stepper-angular-placement',
      language: 'angular',
      label: 'Beside the marker, and under it',
      source:
        '<div slStepper labelPlacement="end">…</div>\n<div slStepper labelPlacement="bottom">…</div>',
    }),
  },
  {
    id: 'panels',
    title: 'The content of the step you are on',
    note: 'A panel is a group labelled by its own header, shown only while that step is current, and the two buttons that move it are the consumer’s own with a directive on them.',
    snippet: defineSnippet({
      id: 'stepper-angular-panels',
      language: 'angular',
      label: 'A panel and the buttons that move it',
      source:
        '<li slStepperStep label="Recipient">\n  <div slStepperPanel>The account number is being checked.</div>\n</li>\n\n<button slStepperPrevious type="button">Back</button>\n<button slStepperNext type="button">Continue</button>',
    }),
  },
  {
    id: 'compact',
    title: 'A row that runs out of width',
    note: 'Below thirty rems of its own inline size a horizontal flow becomes a column, because five labels at 320 pixels are five columns two characters wide. Drag the stage edge to cross it.',
    snippet: defineSnippet({
      id: 'stepper-compact',
      language: 'css',
      label: 'The container the reflow measures',
      source:
        "/* The family declares its own container, so a stepper in a narrow panel\n   reflows while the same stepper on a full page does not. */\n[data-ui='stepper'] {\n  container-name: slotted-stepper;\n  container-type: inline-size;\n}",
    }),
  },
  {
    id: 'content',
    title: 'Names the flow did not choose',
    note: 'Six steps, a forty-character German compound and a second line under each name. The label wraps inside its own column and the markers stay on one line.',
    snippet: defineSnippet({
      id: 'stepper-angular-content',
      language: 'angular',
      label: 'Long labels and a second line',
      source:
        '<li\n  slStepperStep\n  label="Zahlungsabwicklungseinstellungen"\n  description="Zuletzt geprüft am 14. August"\n></li>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'provideStepperDefaults decides for a whole injector, exportAs reaches the instance from a template, and the two advance directives sit on buttons the consumer styled themselves.',
    snippet: defineSnippet({
      id: 'stepper-angular-composition',
      language: 'ts',
      label: 'Defaults for the application',
      source:
        "bootstrapApplication(App, {\n  providers: [provideStepperDefaults({ labelPlacement: 'bottom', linear: true })],\n});",
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every header, the arrows reach exactly the same ones, Home and End go to the ends, and Enter or Space moves to the focused step when the flow allows it.',
    snippet: defineSnippet({
      id: 'stepper-angular-keyboard',
      language: 'angular',
      label: 'What each header announces',
      source:
        '<!-- "Cart, Step 1 of 4, completed" — the marker is hidden and the\n     status part says the position and the state in words. -->\n<div slStepper [messages]="{ label: \'Checkout\' }" [defaultStep]="1">\n  <ol slStepperList>\n    …\n  </ol>\n</div>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'stepChange',
    payload: 'ChangeRequest<number>',
    when: 'Before the step moves. The request carries the value it replaces, the reason — pointer, keyboard or programmatic — and the originating event. Calling request.cancel() commits nothing, which is how a consumer refuses a move and the reason this family ships no isStepValid and no onStepInvalid.',
  },
];

export const ANGULAR_STEPPER_DOCS = {
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
        'slStepper',
        'Present means controlled, for the life of the component. The family then only asks to move.',
      ],
      [
        'defaultStep',
        'number',
        '0',
        'slStepper',
        'What an uncontrolled stepper starts from, read once, and where reset() returns to',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slStepper',
        'Which way the flow runs. A horizontal one still becomes a column below its own breakpoint.',
      ],
      [
        'labelPlacement',
        "'end' | 'bottom'",
        'end',
        'slStepper',
        'The name beside the marker, or under it',
      ],
      [
        'navigation',
        "'button' | 'link' | 'none'",
        'button',
        'slStepper',
        'What a header is. none renders a span, which is a read-only progress indicator.',
      ],
      [
        'linear',
        'boolean',
        'false',
        'slStepper',
        'Requires every earlier step to be complete before a later one can be reached',
      ],
      [
        'autoComplete',
        'boolean',
        'false',
        'slStepper',
        'Treats every step before the current one as complete. Off, because walking past a step is not finishing it.',
      ],
      [
        'messages',
        'PartialMessages<StepperMessages>',
        '—',
        'slStepper',
        'Words laid over the language in force, key by key: the name of the sequence announced on the list (label), the position, and the five statuses a step announces',
      ],
      [
        'complete',
        'boolean',
        '—',
        'li[slStepperStep]',
        'Whether the consumer says the work on this step is done. Unstated defers to autoComplete.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'li[slStepperStep]',
        'Takes the header out of reach, in a linear flow or outside one. It keeps its tab stop.',
      ],
      [
        'loading',
        'boolean',
        'false',
        'li[slStepperStep]',
        'The step is waiting on something: the header stops answering and the status says so',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'li[slStepperStep]',
        'The work on this step failed. It outranks complete in the marker and in the announcement.',
      ],
      ['description', 'string', '—', 'li[slStepperStep]', 'The second line under the step’s name'],
      [
        'href',
        'string',
        '—',
        'li[slStepperStep]',
        'The destination, used only when navigation is link',
      ],
    ]),
    composition: apiRows([
      [
        'provideStepperDefaults',
        'labelPlacement | linear | navigation | orientation',
        '—',
        'Application',
        'Sets those six once for the whole injector; an input on the stepper still wins',
      ],
      [
        'exportAs="slStepper"',
        'template reference',
        '—',
        'Template',
        'Reaches the instance: step(), count(), percent(), canGoNext(), goToStep(), next(), previous() and reset()',
      ],
      [
        'slStepperNext, slStepperPrevious',
        'directive',
        '—',
        'The consumer’s button',
        'Moving one step is a handler on a button you styled, the shape matStepperNext already taught Angular consumers. The directive disables the button at each bound and never paints it.',
      ],
      [
        'ng-content',
        'projection',
        '—',
        'li[slStepperStep]',
        'Whatever a step should carry beyond its header — a panel, a form, a summary — projected after the trigger and before the connector',
      ],
    ]),
    accessibility: [
      'The family refuses role="tablist". Angular Material gives a horizontal stepper that role and section 7 of docs/component-features.md forbids it in the Tabs entry itself: tabs are for peer views in one context, not for the steps of a process. What replaces it is ol and li for the sequence and the set size, a name on the list, and a status inside every header — the cost is that a screen reader will not announce "tab 2 of 5" or offer tab-specific navigation.',
      'The current step carries aria-current="step" on its trigger, which is the value the ARIA specification names for a link inside a step indicator. The item mirrors it as data-current, because the marker, the label and the connector are styled from the item and none of them is the trigger.',
      'A step a linear flow has not opened carries aria-disabled rather than disabled, so it keeps its tab stop: a reader can find out the step exists and that it is not yet available, instead of finding nothing at all.',
      'Every header carries a visually hidden status, so what a reader hears is "Cart, Step 2 of 4, current" rather than "2". The marker itself is aria-hidden, because it would otherwise announce the number twice, and the status is prefixed with a comma because nothing separates two elements’ text when a name is computed.',
      'A panel is a group labelled by its own trigger and given tabindex="-1", so a consumer who moves focus after a step change has somewhere to put it. It is not a tabpanel, for the same reason the root is not a tablist.',
      'The arrows reach every header, exactly where Tab reaches — they were added on top of the tab sequence rather than replacing it with a roving tab stop, and they follow the reading direction, so ArrowRight moves to the previous step in a right-to-left document. Home and End go to the ends, and the block arrows answer only a vertical flow.',
      'No status depends on color alone: a complete step fills its disc and shows a check, a failed one fills and shows a cross, the current one is a ring and a pending one an outline. Section 7 of the feature guide asks for exactly that.',
    ],
    snippets: [
      defineSnippet({
        id: 'stepper-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-ui="stepper" data-part="root" data-orientation="horizontal" data-navigation="button">\n  <ol aria-label="Checkout" data-part="list">\n    <li data-part="item" data-complete>\n      <button data-part="trigger" id="…-trigger-0" data-index="0" type="button">\n        <span aria-hidden="true" data-part="marker">1</span>\n        <span data-part="label">\n          Cart\n          <span data-part="description">Two items</span>\n        </span>\n        <span data-part="status" data-ui="visually-hidden">, Step 1 of 4, completed</span>\n      </button>\n      <span aria-hidden="true" data-complete data-part="separator"></span>\n    </li>\n  </ol>\n</div>',
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
