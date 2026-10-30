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

export const REACT_BUTTON_TOKENS = buttonTokens.map((name) => ({
  name,
  purpose: 'A theme token the Button stylesheet reads.',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Button,\n  ButtonDefaultsProvider,\n  ButtonLink,\n  IconButton,\n  ToggleButton,\n} from '@slotted/react';",
};

const TONE = 'accent | secondary | neutral | info | success | warning | danger';
const VARIANT = 'solid | outline | ghost';
const SIZE = 'sm | md | lg';

const appearance = (member: string, tone: string, variant: string): ApiTuple[] => [
  [
    'tone',
    TONE,
    tone,
    member,
    'The semantic color: accent for the primary action, secondary for a neutral one, neutral for a primary action drawn in ink where the accent is kept for data, and success, warning or danger for what the action does.',
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
    'Refuses the action and marks the control unavailable. On its own, it sets the native disabled attribute, which also removes the control from the tab sequence.',
  ],
  [
    'focusableWhenDisabled',
    'boolean',
    'false',
    member,
    'Keeps a disabled control in the tab sequence: aria-disabled replaces the native attribute, and activation is still refused.',
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

const substitutable = (member: string): ApiTuple[] => [
  [
    'render',
    '(rootProps) => ReactElement',
    '—',
    member,
    'Renders the root through another element. The function receives every root prop and must pass all of them on.',
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
    element: 'span',
    required: false,
    purpose: indicator
      ? 'Wraps the start content. Rendered only when start is passed. While loading, it holds the indicator.'
      : 'Wraps the start content. Rendered only when start is passed.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose: indicator
      ? 'Wraps the children. Always rendered, because the accessible name is computed from it. With reduced motion or forced colors, a loading button with no icon fades it in place, and it keeps its size.'
      : 'Wraps the children. Always rendered, because the accessible name is computed from it.',
  },
  {
    part: 'end',
    element: 'span',
    required: false,
    purpose: indicator
      ? 'Wraps the end content. Rendered only when end is passed. While loading, it holds the indicator when there is no start content.'
      : 'Wraps the end content. Rendered only when end is passed.',
  },
];

const indicatorRow = (where: string): AnatomyRow => ({
  part: 'indicator',
  element: 'span with role="progressbar"',
  required: false,
  purpose: `The loading indicator. Carries data-ui="spinner", is named by messages.loading, and has no value, so it reads as indeterminate. Rendered ${where} once loadingDelay has passed.`,
});

export const REACT_BUTTON_DOCS = {
  button: {
    imports,
    anatomy: [
      root(
        'button, or the element render returns',
        'data-justify, and data-full-width, data-disabled and data-loading when they apply.',
      ),
      ...content(true),
      indicatorRow('in the start box, else in the end box, else centerd over the label,'),
    ],
    composition: apiRows([
      [
        'ButtonDefaultsProvider',
        '{ size?, tone?, variant?, children }',
        '—',
        'Button',
        'Sets the default size, tone and variant of every button inside it, ButtonLink, IconButton and ToggleButton included. An explicit prop wins, and an axis left unset keeps each member’s own default.',
      ],
    ]),
    api: apiRows([
      ...appearance('Button', 'accent', 'solid'),
      [
        'start',
        'ReactNode',
        '—',
        'Button',
        'Content before the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'Button',
        'Content after the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      ['fullWidth', 'boolean', 'false', 'Button', 'Fills the inline size of the container.'],
      [
        'justify',
        'center | between',
        'center',
        'Button',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      ...unavailable('Button'),
      ...waiting('Button'),
      ...substitutable('Button'),
      [
        'type',
        'button | submit | reset',
        'button',
        'Button',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'Button renders a native button element, so Space, Enter, focus and the disabled state come from the platform. The visible label supplies the accessible name.',
      'While loading, the indicator is a progress bar named by messages.loading, and the button announces aria-disabled while it keeps focus. React Aria’s pending button and Primer’s loading button use the same pattern. aria-busy is not set: screen readers do not announce it reliably on a button, and one mechanism already carries the state.',
      'Where motion is allowed, the indicator is not drawn: once loadingDelay has passed, a band in the button’s own ink sweeps behind the label and the icon, which stay visible. With reduced motion or forced colors, the indicator is a ring drawn in the start or end icon’s box; a button with neither draws it over the label, which drops to zero opacity but stays in the accessibility tree and in the layout, so the accessible name survives the wait and the button keeps its size.',
      'loading refuses activation in the capture phase, before any click handler you attach, so a submit button cannot submit its form twice.',
      'focusableWhenDisabled keeps a disabled button reachable. Use it when the button has a tooltip or an explanation a keyboard user needs, such as inside a toolbar. A reachable disabled button uses muted text on the subtle neutral background, at a contrast of 4.5:1 or more; a natively disabled button keeps the disabled grey.',
      'An icon in start or end repeats the label, so mark it aria-hidden. Glyph sets aria-hidden itself.',
      'type defaults to button. Set submit only for a button that submits its form.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-basic',
        label: 'An action',
        language: 'tsx',
        source:
          'import { Save } from \'lucide-react\';\n\n<Button start={<Save aria-hidden="true" />}>Save changes</Button>;',
      }),
      defineSnippet({
        id: 'react-button-loading',
        label: 'Waiting for the action to finish',
        language: 'tsx',
        source:
          '<Button\n  loading={saving}\n  loadingDelay={300}\n  messages={{ loading: \'Saving\' }}\n  onClick={save}\n  start={<Save aria-hidden="true" />}\n>\n  Save changes\n</Button>;',
      }),
      defineSnippet({
        id: 'react-button-defaults',
        label: 'Every action in the application, decided once',
        language: 'tsx',
        source: '<ButtonDefaultsProvider size="sm">\n  <Toolbar />\n</ButtonDefaultsProvider>;',
      }),
      defineSnippet({
        id: 'react-button-emphasis',
        label: 'One primary action per region',
        language: 'tsx',
        source:
          '<Inline gap={4}>\n  <Button>Publish</Button>\n  <Button tone="secondary" variant="outline">\n    Save draft\n  </Button>\n  <Button tone="secondary" variant="ghost">\n    Discard\n  </Button>\n</Inline>;',
      }),
    ],
  },
  buttonLink: {
    imports,
    anatomy: [
      root(
        'a, or the element render returns',
        'data-justify, and data-full-width and data-disabled when they apply.',
      ),
      ...content(false),
    ],
    api: apiRows([
      [
        'href',
        'string',
        'required without render',
        'ButtonLink',
        'The destination. A disabled ButtonLink does not render it.',
      ],
      [
        'render',
        '(rootProps) => ReactElement',
        '—',
        'ButtonLink',
        'Renders the root through a router’s link component. The function receives every root prop and must pass all of them on.',
      ],
      ...appearance('ButtonLink', 'accent', 'solid'),
      [
        'start',
        'ReactNode',
        '—',
        'ButtonLink',
        'Content before the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'ButtonLink',
        'Content after the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      ['fullWidth', 'boolean', 'false', 'ButtonLink', 'Fills the inline size of the container.'],
      [
        'justify',
        'center | between',
        'center',
        'ButtonLink',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'ButtonLink',
        'Removes the href and refuses activation. The link stays focusable with role="link" and aria-disabled.',
      ],
    ]),
    accessibility: [
      'ButtonLink renders an anchor, so it is announced as a link and activates on Enter. Space does not activate it, as it does not activate any link.',
      'Use ButtonLink for navigation only. An action without a destination is a Button.',
      'A disabled ButtonLink renders no href. An anchor that kept its destination and only blocked click would still navigate on a middle click or a modified click.',
      'A disabled ButtonLink stays in the tab sequence with role="link" and aria-disabled, so a keyboard user can discover that it is unavailable.',
      'The render function receives every root prop, including the accessible name and the data attributes, and must pass all of them to the element it renders.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-button-link-native',
        label: 'Navigating',
        language: 'tsx',
        source: '<ButtonLink href="/settings">Open settings</ButtonLink>;',
      }),
      defineSnippet({
        id: 'react-button-link-router',
        label: 'Navigation the router owns',
        language: 'tsx',
        source:
          '<ButtonLink variant="outline" render={(props) => <RouterLink to="/settings" {...props} />}>\n  Open settings\n</ButtonLink>;',
      }),
    ],
  },
  iconButton: {
    imports,
    anatomy: [
      root(
        'button, or the element render returns',
        'data-shape, and data-disabled, data-loading and data-pressed when they apply.',
      ),
      {
        part: 'icon',
        element: 'span',
        required: true,
        purpose:
          'Wraps the children. While loading, it holds the indicator drawn over the icon, so the control keeps its size.',
      },
      indicatorRow('inside the icon box'),
    ],
    api: apiRows([
      [
        'aria-label | aria-labelledby',
        'string',
        'required',
        'IconButton',
        'The accessible name. Required, because an icon supplies no text. When both are present, aria-labelledby names the button.',
      ],
      ...appearance('IconButton', 'secondary', 'ghost'),
      [
        'shape',
        'square | circle',
        'square',
        'IconButton',
        'The corners of the control: square keeps the radius of the control scale, circle rounds it fully. Both are as wide as they are tall.',
      ],
      ...unavailable('IconButton'),
      ...waiting('IconButton'),
      ...substitutable('IconButton'),
      [
        'pressed',
        'boolean',
        '—',
        'IconButton',
        'The pressed state, controlled. Passing it makes the button a toggle whose value you own.',
      ],
      [
        'defaultPressed',
        'boolean',
        '—',
        'IconButton',
        'The initial pressed state when the button owns it, read once. Passing it makes the button a toggle.',
      ],
      [
        'onPressedChange',
        '(pressed, request) => void',
        '—',
        'IconButton',
        'Called with the requested value and the request: value, previous value, reason (pointer or keyboard), event and cancel().',
      ],
      [
        'type',
        'button | submit | reset',
        'button',
        'IconButton',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'The type requires an accessible name: pass aria-label or aria-labelledby. An icon supplies no text the name could be computed from.',
      'aria-pressed is rendered only when pressed or defaultPressed is passed, so a plain icon button does not announce a toggle state it does not have.',
      'Keep the name the same in both pressed states. The APG toggle button pattern announces the state beside an unchanging label.',
      'A pressed icon button uses the selected colors of the theme — accent text on the accent selection background, inside the accent edge — whatever its tone and variant. On hover it uses the hover step of that background, not the neutral hover of an unpressed button.',
      'The control is as wide as it is tall, at the control height, and never smaller than the WCAG 2.2 minimum target of 24 by 24 CSS pixels at any density.',
      'Add a tooltip when the icon alone does not say what the action does. The accessible name does not replace a visible label.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-icon-button-basic',
        label: 'A named icon-only action',
        language: 'tsx',
        source:
          'import { Trash2 } from \'lucide-react\';\n\n<IconButton aria-label="Delete invoice" tone="danger">\n  <Trash2 aria-hidden="true" />\n</IconButton>;',
      }),
      defineSnippet({
        id: 'react-icon-button-toggle',
        label: 'An icon toggle in a toolbar',
        language: 'tsx',
        source:
          'import { Bold } from \'lucide-react\';\n\n<IconButton\n  aria-label="Bold"\n  pressed={bold}\n  onPressedChange={(bold) => setBold(bold)}\n  tone="secondary"\n>\n  <Bold aria-hidden="true" />\n</IconButton>;',
      }),
    ],
  },
  iconButtonLink: {
    imports,
    anatomy: [
      root('a, or the element render returns', 'data-shape, and data-disabled when it applies.'),
      {
        part: 'icon',
        element: 'span',
        required: true,
        purpose: 'Wraps the children.',
      },
    ],
    api: apiRows([
      [
        'aria-label | aria-labelledby',
        'string',
        'required',
        'IconButtonLink',
        'The accessible name. Required, because an icon supplies no text. When both are present, aria-labelledby names the link.',
      ],
      [
        'href',
        'string',
        'required without render',
        'IconButtonLink',
        'The destination. A disabled IconButtonLink does not render it.',
      ],
      [
        'render',
        '(rootProps) => ReactElement',
        '—',
        'IconButtonLink',
        'Renders the root through a router’s link component. The function receives anchor props — every root prop — and must pass all of them on.',
      ],
      ...appearance('IconButtonLink', 'secondary', 'ghost'),
      [
        'shape',
        'square | circle',
        'square',
        'IconButtonLink',
        'The corners of the control: square keeps the radius of the control scale, circle rounds it fully. Both are as wide as they are tall.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'IconButtonLink',
        'Removes the href and refuses activation. The link stays focusable with role="link" and aria-disabled.',
      ],
    ]),
    accessibility: [
      'IconButtonLink renders an anchor, so it is announced as a link and activates on Enter. Use it for an icon-only control that navigates, such as the previous and next record; an icon-only action is an IconButton.',
      'The type requires an accessible name: pass aria-label or aria-labelledby. An icon supplies no text the name could be computed from.',
      'A disabled IconButtonLink renders no href and stays in the tab sequence with role="link" and aria-disabled.',
      'The render function receives every root prop, including the accessible name and the data attributes, and must pass all of them to the element it renders.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-icon-button-link-router',
        label: 'Previous and next record',
        language: 'tsx',
        source:
          'import { ChevronLeft, ChevronRight } from \'lucide-react\';\n\n<ButtonGroup aria-label="Records">\n  <IconButtonLink\n    aria-label="Previous record"\n    render={(props) => <RouterLink to="/records/1" {...props} />}\n  >\n    <ChevronLeft aria-hidden="true" />\n  </IconButtonLink>\n  <IconButtonLink aria-label="Next record" href="/records/3">\n    <ChevronRight aria-hidden="true" />\n  </IconButtonLink>\n</ButtonGroup>;',
      }),
    ],
  },
  toggleButton: {
    imports,
    anatomy: [
      root(
        'button, or the element render returns',
        'data-justify, and data-full-width, data-disabled, data-loading and data-pressed when they apply.',
      ),
      ...content(true),
      indicatorRow('in the start box, else in the end box, else centerd over the label,'),
    ],
    api: apiRows([
      ...appearance('ToggleButton', 'secondary', 'outline'),
      [
        'start',
        'ReactNode',
        '—',
        'ToggleButton',
        'Content before the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'ToggleButton',
        'Content after the label, such as an icon. It mirrors in a right-to-left document.',
      ],
      ['fullWidth', 'boolean', 'false', 'ToggleButton', 'Fills the inline size of the container.'],
      [
        'justify',
        'center | between',
        'center',
        'ToggleButton',
        'Where the content sits along the inline axis: center keeps the label and end together in the middle; between sets the label at the start and end at the inline end, as a field trigger reads, with start beside the label. It mirrors in a right-to-left document.',
      ],
      ...unavailable('ToggleButton'),
      ...waiting('ToggleButton'),
      ...substitutable('ToggleButton'),
      [
        'pressed',
        'boolean',
        '—',
        'ToggleButton',
        'The pressed state, controlled. Passing it makes you the owner of the value.',
      ],
      [
        'defaultPressed',
        'boolean',
        'false',
        'ToggleButton',
        'The initial pressed state when the button owns it, read once.',
      ],
      [
        'onPressedChange',
        '(pressed, request) => void',
        '—',
        'ToggleButton',
        'Called with the requested value and the request: value, previous value, reason (pointer or keyboard), event and cancel().',
      ],
      [
        'type',
        'button | submit | reset',
        'button',
        'ToggleButton',
        'The native button type. Set submit only for a button that submits its form.',
      ],
    ]),
    accessibility: [
      'ToggleButton renders a native button with aria-pressed, so it is announced as a toggle button and activates on Space and Enter.',
      'Keep the label the same in both states: "Mute" stays "Mute" and the state is announced beside it. When the label has to change, use a Button.',
      'The change request carries a reason. A native button fires the same click for a pointer, Space and Enter; the reason is pointer when the click reports a click count and keyboard when it reports none.',
      'Calling preventDefault in onClick refuses the activation, and the pressed state does not change.',
      'Use Checkbox, not ToggleButton, for a value a form submits.',
      'A toggle that saves to a server can set loading while the request runs. Activation is refused during the wait, so the button keeps the state it had until loading ends.',
    ],
    snippets: [
      defineSnippet({
        id: 'react-toggle-button-uncontrolled',
        label: 'A toggle that owns its own state',
        language: 'tsx',
        source: '<ToggleButton defaultPressed>Pin</ToggleButton>;',
      }),
      defineSnippet({
        id: 'react-toggle-button-controlled',
        label: 'A toggle the consumer owns, with the reason',
        language: 'tsx',
        source:
          "<ToggleButton\n  pressed={pinned}\n  onPressedChange={(pinned, request) => {\n    if (request.reason === 'keyboard') announce(pinned);\n    setPinned(pinned);\n  }}\n>\n  Pin\n</ToggleButton>;",
      }),
    ],
  },
} as const;
