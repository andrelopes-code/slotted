import popoverTokens from '@slotted/styles/popover/tokens.json';
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

export const REACT_POPOVER_TOKENS = popoverTokens.map((name) => ({
  name,
  purpose: 'A Popover value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Popover,\n  PopoverAnchor,\n  PopoverArrow,\n  PopoverBody,\n  PopoverClose,\n  PopoverContent,\n  PopoverDefaultsProvider,\n  PopoverDescription,\n  PopoverFooter,\n  PopoverHeader,\n  PopoverLayer,\n  PopoverTitle,\n  PopoverTrigger,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, rendered by PopoverLayer',
    required: true,
    purpose:
      'The positioned layer. The positioner writes its position on this element, and this element scales and fades. Its padding is the gap between the trigger and the panel, which is where the arrow stands. It carries data-ui="popover", data-side, data-align, data-size, data-width and data-open.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The panel, with role="dialog" and tabindex="-1". It is named by its title and described by its description when those parts are present. aria-modal is never written, because the popover is not modal. It draws no padding: PopoverHeader, PopoverBody and PopoverFooter carry the panel inset, set by --slotted-popover-padding-inline and --slotted-popover-padding-block.',
  },
  {
    part: 'header',
    element: 'div',
    required: false,
    purpose:
      'The row that holds the title, the description and the close button. It keeps its height while the body scrolls.',
  },
  {
    part: 'title',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The panel’s accessible name. It is a div by default, because only the page knows whether the title belongs in the document outline; render it as a heading when it does.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose: 'One line under the title, referenced by the panel through aria-describedby.',
  },
  {
    part: 'body',
    element: 'div',
    required: false,
    purpose:
      'The only part that scrolls, bounded by --slotted-positioner-available-height. A scroll shadow at the cut edge shows that there is more content.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'The actions row, separated from the body by a rule and kept under it.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The close button, for a pointer or a touch screen, where there is no Escape key. It draws a cross glyph unless you pass children. With no text of its own it is named by the close message of the language in force; with text, such as Done, the text is its name.',
  },
  {
    part: 'arrow',
    element: 'div',
    required: false,
    purpose:
      'A rotated square in the panel’s background and border colours, which continues the panel’s outline towards the anchor. Place it beside PopoverContent inside PopoverLayer, not inside the content: the stylesheet selects it as a direct child of the layer.',
  },
  {
    part: 'focus-guard',
    element: 'span (two of them)',
    required: true,
    purpose:
      'Two zero-sized, focusable elements hidden from assistive technology, one on each side of the panel. Tab or Shift+Tab onto either one closes the popover and returns focus to the trigger.',
  },
];

const api = apiRows([
  [
    'open',
    'boolean',
    '—',
    'Popover',
    'Whether the panel is open. Passing it makes the popover controlled for the life of the component; update it from onOpenChange.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'Popover',
    'The open state an uncontrolled popover starts with. It is read once.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Popover',
    'The maximum width of the layer, which holds the panel and the gap around it: 16rem, 20rem or 24rem, with the inset and the title size to match.',
  ],
  [
    'width',
    "'auto' | 'anchor'",
    'auto',
    'Popover',
    'auto sizes the panel to its content, up to the width size sets. anchor makes it exactly as wide as the anchor.',
  ],
  [
    'side',
    "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'Popover',
    'The edge of the anchor the panel opens against. inline-start and inline-end follow the writing direction of the layer.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'center',
    'Popover',
    'Where the panel sits along the side it opened on.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Popover',
    'When the layer exists. active builds it on open and removes it after the exit animation. lazy builds it on the first open and keeps it, for a panel whose content is expensive to build. eager builds it from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'Popover',
    'The CSS position of the layer. Use fixed for a layer inside an overflow: hidden container, and absolute for one inside a transformed container.',
  ],
  ['arrow', 'boolean', 'true', 'Popover', 'Whether PopoverArrow is drawn.'],
  [
    'autoFocus',
    'boolean',
    'true',
    'Popover',
    'Whether focus moves into the popover on open. Focus goes to the panel itself rather than to its first control, so a screen reader announces the panel’s name first and a destructive first control is not focused by default.',
  ],
  [
    'closeOnEscape',
    'boolean',
    'true',
    'Popover',
    'Whether Escape closes the popover. Escape reaches only the topmost layer.',
  ],
  [
    'closeOnOutsidePress',
    'boolean | (target, event) => boolean',
    'true',
    'Popover',
    'Whether a press outside the panel closes the popover. A function decides per press, for a panel that has to stay open when the reader presses a toast beside it.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'Popover',
    'Whether the panel moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'Popover',
    'Whether the panel slides along its side to stay inside the boundary.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'false',
    'Popover',
    'Whether the panel hides when its anchor scrolls out of view. It is off, unlike Tooltip’s, so a task the reader is halfway through does not disappear when the row behind it scrolls.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'Popover',
    'Whether the layer is rendered into the shared portal root at the end of the document. The portalled layer keeps the theme, colour scheme, density and direction of the region it was opened from.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'Popover',
    'Whether the popover never opens. It does not disable the trigger; set disabled on the trigger element for that.',
  ],
  [
    'messages',
    'Partial<PopoverMessages>',
    '—',
    'Popover',
    'Text that replaces the language’s messages for this popover, key by key. close is the close button’s accessible name; an aria-label on PopoverClose takes precedence.',
  ],
  [
    'sideOffset',
    'number',
    '0',
    'Popover',
    'Extra distance from the anchor in pixels, added to the standard gap.',
  ],
  ['alignOffset', 'number', '0', 'Popover', 'Distance in pixels along the alignment axis.'],
  [
    'collisionPadding',
    'number',
    '8',
    'Popover',
    'The minimum distance in pixels between the panel and the edge of the boundary.',
  ],
  [
    'arrowPadding',
    'number',
    '12',
    'Popover',
    'The minimum distance in pixels between the arrow and the panel’s corners, so the arrow stays off the rounded corner.',
  ],
  [
    'initialFocus',
    'Element | RefObject | string',
    '—',
    'Popover',
    'What takes focus on open instead of the panel, such as a search field. A string is a selector read inside the panel.',
  ],
  [
    'finalFocus',
    'Element | RefObject | string',
    '—',
    'Popover',
    'What takes focus on close instead of the trigger, for a popover whose trigger is gone by then, such as one that deleted its own row.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: PopoverChangeRequest)',
    when: 'Before the panel opens or closes, once per change. request.reason is pointer, keyboard, escape, outsidePress, dismiss or programmatic. request.cancel() refuses the change: an uncontrolled popover stays as it is.',
  },
];

const composition = apiRows([
  [
    'render',
    '(props) => ReactNode',
    '—',
    'every part',
    'Renders the part as the element it returns, with the props it receives spread on it. The trigger uses it to render a Button, and the title uses it to render a heading.',
  ],
  [
    'ref',
    'Ref<PopoverHandle>',
    '—',
    'Popover',
    'A handle with open(), close() and reposition(), for code that has to open, close or re-measure the popover outside a render.',
  ],
  [
    'PopoverAnchor',
    'component',
    '—',
    'composition',
    'The element the panel is positioned against, when it is not the trigger, such as a table row. It writes no attributes. A press on it counts as a press inside the popover.',
  ],
  [
    'PopoverDefaultsProvider',
    'component',
    '—',
    'application',
    'Sets any option for every popover inside it. An option set on a popover takes precedence.',
  ],
  [
    'container',
    'Element | null',
    'document.body',
    'PopoverDefaultsProvider',
    'Where every layer inside the provider is rendered, for an application shell with its own stacking context. It calls setPortalContainer.',
  ],
  [
    'native props',
    'ComponentPropsWithRef',
    '—',
    'every part',
    'Each part takes the props of its element. An onClick on the trigger runs before the popover’s own handler, and event.preventDefault() stops the popover’s handler.',
  ],
]);

const accessibility = [
  'The panel is a non-modal dialog: aria-modal is not written, nothing behind it becomes inert, and the page keeps scrolling. Use Dialog for content that has to block the page.',
  'The trigger carries aria-expanded, aria-haspopup="dialog", and aria-controls while the panel is in the document. The panel is named by its title through aria-labelledby and described by its description through aria-describedby. A popover without a title has no accessible name until you write aria-label on PopoverContent.',
  'Focus moves to the panel on open, so a screen reader announces its name before its contents, and returns to the trigger on close. If the reader has moved focus elsewhere on the page, focus stays there. initialFocus and finalFocus name other targets.',
  'Tab past the last control in the panel, or Shift+Tab before the first, closes the popover and returns focus to the trigger; the next Tab continues down the page. Focus is never trapped in the panel.',
];

const snippets = [
  defineSnippet({
    id: 'popover-react-application-defaults',
    label: 'Application defaults',
    language: 'tsx',
    source: `
<PopoverDefaultsProvider size="lg">
  <App />
</PopoverDefaultsProvider>;
`,
  }),
  defineSnippet({
    id: 'popover-public-tokens',
    label: 'Retuning the family',
    language: 'css',
    source: `
:root {
  --slotted-popover-measure: 24rem;
  --slotted-popover-radius: 12px;
  --slotted-popover-gap: 0.75rem;
  --slotted-popover-arrow-size: 0.75rem;
}
`,
  }),
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'A panel on a button',
    note: 'Press the button: the panel opens, takes the focus and says its own name. Escape closes it and the focus goes back where it came from.',
    snippet: defineSnippet({
      id: 'popover-react-playground',
      label: 'Playground',
      language: 'tsx',
      source: `
<Popover>
  <PopoverTrigger render={(props) => <Button {...props}>Filters</Button>} />
  <PopoverLayer>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Filter invoices</PopoverTitle>
        <PopoverClose />
      </PopoverHeader>
      <PopoverBody>Unpaid, overdue and disputed.</PopoverBody>
    </PopoverContent>
    <PopoverArrow />
  </PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three width steps',
    note: 'Sixteen, twenty and twenty-four rems. The inset and the title step move with the width, and the controls inside move with the density.',
    snippet: defineSnippet({
      id: 'popover-react-sizes',
      label: 'Sizes',
      language: 'tsx',
      source: `
<Popover size="lg">
  <PopoverTrigger render={(props) => <Button {...props}>A form</Button>} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'width',
    title: 'As wide as its words, or as wide as the field',
    note: 'width="anchor" reads the anchor’s measured width, which is the one case Radix publishes a custom property for and the shape a filter panel under a search field needs.',
    snippet: defineSnippet({
      id: 'popover-react-width',
      label: 'Width',
      language: 'tsx',
      source: `
<Popover align="start" width="anchor">
  <PopoverTrigger render={(props) => <TextField {...props} />} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'placement',
    title: 'Which edge it takes',
    note: 'The four physical sides and the two logical ones. Switch the toolbar to rtl: inline-start and inline-end swap, left and right stay where they are.',
    snippet: defineSnippet({
      id: 'popover-react-placement',
      label: 'Placement',
      language: 'tsx',
      source: `
<Popover align="start" side="inline-end">
  <PopoverTrigger render={(props) => <Button {...props}>Beside</Button>} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'anchor',
    title: 'Pointing at something other than the button',
    note: 'The panel hangs off the whole row and the button only opens it. Nothing is written on the anchor: it is measured and nothing else.',
    snippet: defineSnippet({
      id: 'popover-react-anchor',
      label: 'Anchor',
      language: 'tsx',
      source: `
<Popover align="end">
  <PopoverAnchor>
    <Row />
    <PopoverTrigger render={(props) => <Button {...props}>⋯</Button>} />
  </PopoverAnchor>
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'focus',
    title: 'Where the keyboard goes',
    note: 'The first panel takes the focus itself; the second sends it to its search field; the third leaves it on the trigger. Close each one and watch where the focus comes back to.',
    snippet: defineSnippet({
      id: 'popover-react-focus',
      label: 'Focus',
      language: 'tsx',
      source: `
<Popover initialFocus="input">
  <PopoverTrigger render={(props) => <Button {...props}>Search</Button>} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'dismissal',
    title: 'Every way it closes, and the reason it carries',
    note: 'Escape, a press outside, the close control, the trigger again. Each one reports a different reason, and a consumer may refuse any of them before anything moves.',
    snippet: defineSnippet({
      id: 'popover-react-dismissal',
      label: 'Dismissal',
      language: 'tsx',
      source: `
<Popover
  onOpenChange={(open, request) => {
    if (request.reason === 'outsidePress' && dirty) request.cancel();
  }}
>
  <PopoverTrigger render={(props) => <Button {...props}>Edit</Button>} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
  {
    id: 'scrolling',
    title: 'More content than room',
    note: 'The body is the only part that scrolls, bounded by the height the engine says is left. The title and the actions keep theirs, and the fade at the cut says there is more.',
    snippet: defineSnippet({
      id: 'popover-react-scrolling',
      label: 'Scrolling',
      language: 'tsx',
      source: `
<PopoverContent>
  <PopoverHeader>
    <PopoverTitle>Notification settings</PopoverTitle>
  </PopoverHeader>
  <PopoverBody>{rows}</PopoverBody>
  <PopoverFooter>
    <Button size="sm">Save</Button>
  </PopoverFooter>
</PopoverContent>;
`,
    }),
  },
  {
    id: 'composition',
    title: 'A panel holding a real form',
    note: 'Fields, a footer of actions and a close control. The controls inside are the consumer’s own and reach their form untouched: the family holds no value of theirs.',
    snippet: defineSnippet({
      id: 'popover-react-composition',
      label: 'Composition',
      language: 'tsx',
      source: `
<PopoverBody>
  <Field>
    <FieldLabel>Amount</FieldLabel>
    <CurrencyField name="amount" />
  </Field>
</PopoverBody>;
`,
    }),
  },
  {
    id: 'nested',
    title: 'A tooltip on a control inside the panel',
    note: 'Two layers at once. The tooltip is a later layer, so it draws above the panel and Escape reaches it first; the panel closes on the second Escape and not before.',
    snippet: defineSnippet({
      id: 'popover-react-nested',
      label: 'Nested',
      language: 'tsx',
      source: `
<PopoverFooter>
  <Tooltip describes="label">
    <TooltipTrigger render={(props) => <Button {...props}>⌫</Button>} />
    <TooltipLayer>
      <TooltipContent>Clear the filters</TooltipContent>
    </TooltipLayer>
  </Tooltip>
</PopoverFooter>;
`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Enter or Space opens it. Tab walks the panel and, past the last control, closes it and returns to the trigger — one extra Tab, and the reading order intact.',
    snippet: defineSnippet({
      id: 'popover-react-keyboard',
      label: 'Keyboard',
      language: 'tsx',
      source: `
<Popover onOpenChange={(open, request) => report(request.reason)}>
  <PopoverTrigger render={(props) => <Button {...props}>Tab through me</Button>} />
  <PopoverLayer>{/* … */}</PopoverLayer>
</Popover>;
`,
    }),
  },
];

export const REACT_POPOVER_DOCS = {
  popover: { accessibility, anatomy, api, composition, events, imports, scenes, snippets },
};
