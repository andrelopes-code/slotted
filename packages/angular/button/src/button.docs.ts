import buttonTokens from '@slotted/styles/button/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { AnatomyRow, ApiRow, ReferenceImport } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_BUTTON_TOKENS = buttonTokens.map((name) => ({
  name,
  purpose: 'A theme token the Button stylesheet reads.',
}));

const SOURCE =
  "import {\n  provideButtonDefaults,\n  SlButton,\n  SlButtonEnd,\n  SlButtonLink,\n  SlButtonStart,\n  SlIconButton,\n  SlToggleButton,\n} from '@slotted/angular/button';";

const imports = (selector: string, exportAs: string): ReferenceImport => ({
  source: SOURCE,
  selector,
  exportAs,
});

const TONE = 'accent | secondary | neutral | info | success | warning | danger';
const VARIANT = 'solid | outline | ghost';
const SIZE = 'sm | md | lg';

const appearance = (member: string, tone: string, variant: string): ApiTuple[] => [
  [
    'tone',
    TONE,
    tone,
    member,
    'The semantic colour: accent for the primary action, secondary for a neutral one, neutral for a primary action drawn in ink where the accent is kept for data, and success, warning or danger for what the action does.',
  ],
  ['variant', VARIANT, variant, member, 'How the tone is painted: solid, outline or ghost.'],
  [
    'size',
    SIZE,
    'md',
    member,
    'The step of the control scale. Each step reads the --slotted-control-* tokens, so the density of the theme sets the height.',
  ],
];

/** Being unavailable and being unreachable are two decisions, not one. */
const unavailable = (member: string): ApiTuple[] => [
  [
    'disabled',
    'boolean',
    'false',
    member,
    'Refuses the action and marks the control unavailable. On its own, it sets the native disabled property, which also removes the control from the tab sequence.',
  ],
  [
    'focusableWhenDisabled',
    'boolean',
    'false',
    member,
    'Keeps a disabled control in the tab sequence: aria-disabled replaces the native property, and activation is still refused.',
  ],
];

const waiting = (member: string): ApiTuple[] => [
  [
    'loading',
    'boolean',
    'false',
    member,
    'Refuses activation, keeps focus, and shows a progress indicator named by messages.loading.',
  ],
  [
    'loadingDelay',
    'number',
    '0',
    member,
    'Milliseconds before the indicator appears. Activation is refused from the start of the wait.',
  ],
  [
    'messages',
    'Partial<ButtonMessages>',
    '—',
    member,
    'Overrides for the strings of the active locale, key by key. loading names the progress indicator.',
  ],
];

const CONTENT = (member: string): ApiTuple[] => [
  [
    'start',
    '[slButtonStart]',
    '—',
    member,
    'Content projected before the label, such as an icon, on the element you mark with slButtonStart. It mirrors in a right-to-left document.',
  ],
  [
    'end',
    '[slButtonEnd]',
    '—',
    member,
    'Content projected after the label, on the element you mark with slButtonEnd. It mirrors in a right-to-left document.',
  ],
];

const root = (element: string, carries: string): AnatomyRow => ({
  part: 'root',
  element,
  required: true,
  purpose: `The control. Carries data-ui="button", data-tone, data-variant and data-size. It also carries ${carries}`,
});

const content = (indicator: boolean): AnatomyRow[] => [
  {
    part: 'start',
    element: 'the element you mark with slButtonStart',
    required: false,
    purpose: indicator
      ? 'Holds the start content. Absent when nothing is marked. While loading, it holds the indicator.'
      : 'Holds the start content. Absent when nothing is marked.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose: indicator
      ? 'Wraps the projected text. Always rendered, because the accessible name is computed from it. With reduced motion or forced colours, a loading button with no icon fades it in place, and it keeps its size.'
      : 'Wraps the projected text. Always rendered, because the accessible name is computed from it.',
  },
  {
    part: 'end',
    element: 'the element you mark with slButtonEnd',
    required: false,
    purpose: indicator
      ? 'Holds the end content. Absent when nothing is marked. While loading, it holds the indicator when there is no start content.'
      : 'Holds the end content. Absent when nothing is marked.',
  },
];

const indicatorRow = (where: string): AnatomyRow => ({
  part: 'indicator',
  element: 'span with role="progressbar"',
  required: false,
  purpose: `The loading indicator. Carries data-ui="spinner", is named by messages.loading, and has no value, so it reads as indeterminate. Rendered ${where} once loadingDelay has passed.`,
});

export const ANGULAR_BUTTON_DOCS = {
  button: {
    imports: imports('button[slButton], [slButtonStart], [slButtonEnd]', 'slButton'),
    anatomy: [
      root(
        'the button element you write',
        'data-justify, and data-full-width, data-disabled and data-loading when they apply.',
      ),
      ...content(true),
      indicatorRow('in the start box, else in the end box, else centred over the label,'),
    ],
    composition: apiRows([
      [
        'provideButtonDefaults',
        '(defaults: ButtonDefaults) => Provider',
        '—',
        'SlButton',
        'Sets the default size, tone and variant of every button under the injector, SlButtonLink, SlIconButton and SlToggleButton included. An explicit input wins, and an axis left unset keeps each member’s own default.',
      ],
    ]),
    api: apiRows([
      ...appearance('SlButton', 'accent', 'solid'),
      ...CONTENT('SlButton'),
      ['fullWidth', 'boolean', 'false', 'SlButton', 'Fills the inline size of the container.'],
      [
        'justify',
        'center | between',
        'center',
        'SlButton',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      ...unavailable('SlButton'),
      ...waiting('SlButton'),
      [
        'type',
        'button | submit | reset',
        'button',
        'SlButton',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'SlButton applies to the button element in your template, so Space, Enter, focus, form submission and the disabled state come from the platform. The visible label supplies the accessible name.',
      'While loading, the indicator is a progress bar named by messages.loading, and the button announces aria-disabled while it keeps focus. React Aria’s pending button and Primer’s loading button use the same pattern. aria-busy is not set: screen readers do not announce it reliably on a button, and one mechanism already carries the state.',
      'Where motion is allowed, the indicator is not drawn: once loadingDelay has passed, a band in the button’s own ink sweeps behind the label and the icon, which stay visible. With reduced motion or forced colours, the indicator is a ring drawn in the start or end icon’s box; a button with neither draws it over the label, which drops to zero opacity but stays in the accessibility tree and in the layout, so the accessible name survives the wait and the button keeps its size.',
      'loading refuses activation on a capture-phase listener, before any click handler in your template, so a submit button cannot submit its form twice.',
      'focusableWhenDisabled keeps a disabled button reachable. Use it when the button has a tooltip or an explanation a keyboard user needs, such as inside a toolbar. A reachable disabled button uses muted text on the subtle neutral background, at a contrast of 4.5:1 or more; a natively disabled button keeps the disabled grey.',
      'SlButton has no render input: it applies to the element you write, so writing a different element replaces it.',
      'A projected start or end icon repeats the label, so mark it aria-hidden. slGlyph sets aria-hidden itself.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-button-basic',
        label: 'An action',
        language: 'angular',
        source:
          '<button slButton (click)="save()">\n  <span slButtonStart><ng-icon aria-hidden="true" name="lucideSave" /></span>\n  Save changes\n</button>',
      }),
      defineSnippet({
        id: 'angular-button-loading',
        label: 'Waiting for the action to finish',
        language: 'angular',
        source:
          '<button\n  slButton\n  [loading]="saving()"\n  [loadingDelay]="300"\n  [messages]="{ loading: \'Saving\' }"\n  (click)="save()"\n>\n  <span slButtonStart><ng-icon aria-hidden="true" name="lucideSave" /></span>\n  Save changes\n</button>',
      }),
      defineSnippet({
        id: 'angular-button-defaults',
        label: 'Every action in the application, decided once',
        language: 'ts',
        source:
          "bootstrapApplication(App, {\n  providers: [provideButtonDefaults({ size: 'sm' })],\n});",
      }),
    ],
  },
  buttonLink: {
    imports: imports('a[slButtonLink]', 'slButtonLink'),
    anatomy: [
      root(
        'the anchor element you write',
        'data-justify, and data-full-width and data-disabled when they apply.',
      ),
      ...content(false),
    ],
    api: apiRows([
      [
        'href',
        'string',
        '—',
        'SlButtonLink',
        'The destination. A disabled SlButtonLink does not render it.',
      ],
      ...appearance('SlButtonLink', 'accent', 'solid'),
      ...CONTENT('SlButtonLink'),
      ['fullWidth', 'boolean', 'false', 'SlButtonLink', 'Fills the inline size of the container.'],
      [
        'justify',
        'center | between',
        'center',
        'SlButtonLink',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'SlButtonLink',
        'Removes the href and refuses activation. The link stays focusable with role="link" and aria-disabled.',
      ],
    ]),
    accessibility: [
      'SlButtonLink applies to an anchor, so it is announced as a link and activates on Enter. Space does not activate it, as it does not activate any link.',
      'routerLink works on the same anchor and writes its href. Do not also set href.',
      'A disabled SlButtonLink renders no href. An anchor that kept its destination and only blocked click would still navigate on a middle click or a modified click.',
      'A disabled SlButtonLink stays in the tab sequence with role="link" and aria-disabled, so a keyboard user can discover that it is unavailable.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-button-link-native',
        label: 'Navigating',
        language: 'angular',
        source: '<a slButtonLink href="/settings">Open settings</a>',
      }),
      defineSnippet({
        id: 'angular-button-link-router',
        label: 'Navigation the router owns',
        language: 'angular',
        source: '<a slButtonLink variant="outline" routerLink="/settings">Open settings</a>',
      }),
    ],
  },
  iconButton: {
    imports: imports('button[slIconButton]', 'slIconButton'),
    anatomy: [
      root(
        'the button element you write',
        'data-shape, and data-disabled, data-loading and data-pressed when they apply.',
      ),
      {
        part: 'icon',
        element: 'span',
        required: true,
        purpose:
          'Wraps the projected icon. While loading, it holds the indicator drawn over the icon, so the control keeps its size.',
      },
      indicatorRow('inside the icon box'),
    ],
    api: apiRows([
      [
        'aria-label | aria-labelledby',
        'string',
        'required',
        'SlIconButton',
        'The accessible name. Required, because an icon supplies no text.',
      ],
      ...appearance('SlIconButton', 'secondary', 'ghost'),
      [
        'shape',
        'square | circle',
        'square',
        'SlIconButton',
        'The corners of the control: square keeps the radius of the control scale, circle rounds it fully. Both are as wide as they are tall.',
      ],
      ...unavailable('SlIconButton'),
      ...waiting('SlIconButton'),
      [
        'pressed',
        'boolean',
        '—',
        'SlIconButton',
        'The pressed state, controlled. Binding it makes the button a toggle whose value you own.',
      ],
      [
        'defaultPressed',
        'boolean',
        '—',
        'SlIconButton',
        'The initial pressed state when the button owns it. Binding it makes the button a toggle.',
      ],
      [
        'pressedChange',
        'ChangeRequest<boolean>',
        '—',
        'SlIconButton',
        'Emits the request: value, previous value, reason (pointer or keyboard), event and cancel().',
      ],
      [
        'type',
        'button | submit | reset',
        'button',
        'SlIconButton',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'The accessible name is required: the development build throws when neither aria-label nor aria-labelledby is present, because a template cannot make an attribute mandatory.',
      'aria-pressed is rendered only when pressed or defaultPressed is bound, so a plain icon button does not announce a toggle state it does not have.',
      'Keep the name the same in both pressed states. The APG toggle button pattern announces the state beside an unchanging label.',
      'A pressed icon button uses the selected colours of the theme — accent text on the accent selection background, inside the accent edge — whatever its tone and variant. On hover it uses the hover step of that background, not the neutral hover of an unpressed button.',
      'The control is as wide as it is tall, at the control height, and never smaller than the WCAG 2.2 minimum target of 24 by 24 CSS pixels at any density.',
      'Add a tooltip when the icon alone does not say what the action does. The accessible name does not replace a visible label.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-icon-button-basic',
        label: 'A named icon-only action',
        language: 'angular',
        source:
          '<button slIconButton tone="danger" aria-label="Delete invoice" (click)="remove()">\n  <ng-icon aria-hidden="true" name="lucideTrash2" />\n</button>',
      }),
      defineSnippet({
        id: 'angular-icon-button-toggle',
        label: 'An icon toggle in a toolbar',
        language: 'angular',
        source:
          '<button slIconButton aria-label="Bold" [pressed]="bold()" (pressedChange)="bold.set($event.value)">\n  <ng-icon aria-hidden="true" name="lucideBold" />\n</button>',
      }),
    ],
  },
  iconButtonLink: {
    imports: imports('a[slIconButtonLink]', 'slIconButtonLink'),
    anatomy: [
      root('the anchor element you write', 'data-shape, and data-disabled when it applies.'),
      {
        part: 'icon',
        element: 'span',
        required: true,
        purpose: 'Wraps the projected icon.',
      },
    ],
    api: apiRows([
      [
        'aria-label | aria-labelledby',
        'string',
        'required',
        'SlIconButtonLink',
        'The accessible name. Required, because an icon supplies no text; a missing name throws in development. When both are present, aria-labelledby names the link.',
      ],
      [
        'href',
        'string',
        '—',
        'SlIconButtonLink',
        'The destination. A disabled SlIconButtonLink does not render it.',
      ],
      ...appearance('SlIconButtonLink', 'secondary', 'ghost'),
      [
        'shape',
        'square | circle',
        'square',
        'SlIconButtonLink',
        'The corners of the control: square keeps the radius of the control scale, circle rounds it fully. Both are as wide as they are tall.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'SlIconButtonLink',
        'Removes the href and refuses activation. The link stays focusable with role="link" and aria-disabled.',
      ],
    ]),
    accessibility: [
      'SlIconButtonLink applies to an anchor, so it is announced as a link and activates on Enter. Use it for an icon-only control that navigates, such as the previous and next record; an icon-only action is an SlIconButton.',
      'An accessible name is required: pass aria-label or aria-labelledby. An icon supplies no text the name could be computed from.',
      'routerLink works on the same anchor and writes its href. Do not also set href.',
      'A disabled SlIconButtonLink renders no href and stays in the tab sequence with role="link" and aria-disabled.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-icon-button-link-router',
        label: 'Previous and next record',
        language: 'angular',
        source:
          '<div slButtonGroup aria-label="Records">\n  <a slIconButtonLink aria-label="Previous record" routerLink="/records/1">\n    <ng-icon aria-hidden="true" name="lucideChevronLeft"></ng-icon>\n  </a>\n  <a slIconButtonLink aria-label="Next record" routerLink="/records/3">\n    <ng-icon aria-hidden="true" name="lucideChevronRight"></ng-icon>\n  </a>\n</div>',
      }),
    ],
  },
  toggleButton: {
    imports: imports('button[slToggleButton]', 'slToggleButton'),
    anatomy: [
      root(
        'the button element you write',
        'data-justify, and data-full-width, data-disabled, data-loading and data-pressed when they apply.',
      ),
      ...content(true),
      indicatorRow('in the start box, else in the end box, else centred over the label,'),
    ],
    api: apiRows([
      ...appearance('SlToggleButton', 'secondary', 'outline'),
      ...CONTENT('SlToggleButton'),
      [
        'fullWidth',
        'boolean',
        'false',
        'SlToggleButton',
        'Fills the inline size of the container.',
      ],
      [
        'justify',
        'center | between',
        'center',
        'SlToggleButton',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      ...unavailable('SlToggleButton'),
      ...waiting('SlToggleButton'),
      [
        'pressed',
        'boolean',
        '—',
        'SlToggleButton',
        'The pressed state, controlled. Binding it makes you the owner of the value.',
      ],
      [
        'defaultPressed',
        'boolean',
        'false',
        'SlToggleButton',
        'The initial pressed state when the button owns it, read once.',
      ],
      [
        'pressedChange',
        'ChangeRequest<boolean>',
        '—',
        'SlToggleButton',
        'Emits the request: value, previous value, reason (pointer or keyboard), event and cancel().',
      ],
      [
        'type',
        'button | submit | reset',
        'button',
        'SlToggleButton',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'SlToggleButton applies to a native button and sets aria-pressed, so it is announced as a toggle button and activates on Space and Enter.',
      'Keep the label the same in both states: "Mute" stays "Mute" and the state is announced beside it. When the label has to change, use SlButton.',
      'There is no [(pressed)]: a two-way binding carries only the value, and the change request also carries the reason and cancel(). One output, pressedChange, carries the whole request.',
      'The reason is pointer when the click reports a click count and keyboard when it reports none, because a native button fires the same click for a pointer, Space and Enter.',
      'Calling preventDefault on the click refuses the activation, and the pressed state does not change.',
      'Use a checkbox, not SlToggleButton, for a value a form submits.',
    ],
    snippets: [
      defineSnippet({
        id: 'angular-toggle-button-uncontrolled',
        label: 'A toggle that owns its own state',
        language: 'angular',
        source: '<button slToggleButton defaultPressed>Pin</button>',
      }),
      defineSnippet({
        id: 'angular-toggle-button-controlled',
        label: 'A toggle the consumer owns, with the reason',
        language: 'angular',
        source:
          '<button slToggleButton [pressed]="pinned()" (pressedChange)="onPinnedChange($event)">Pin</button>',
      }),
    ],
  },
} as const;
