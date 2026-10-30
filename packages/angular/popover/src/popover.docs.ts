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

export const ANGULAR_POPOVER_TOKENS = popoverTokens.map((name) => ({
  name,
  purpose: 'A Popover value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  providePopoverDefaults,\n  SlPopover,\n  SlPopoverAnchor,\n  SlPopoverArrow,\n  SlPopoverBody,\n  SlPopoverClose,\n  SlPopoverContent,\n  SlPopoverDescription,\n  SlPopoverFooter,\n  SlPopoverHeader,\n  SlPopoverLayer,\n  SlPopoverTitle,\n  SlPopoverTrigger,\n} from '@slotted/angular/popover';",
  selector:
    '[slPopover] on an ng-container, [slPopoverTrigger] on the control, ng-template[slPopoverLayer], [slPopoverContent], and one directive per part inside it',
  exportAs: 'slPopover',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, built by ng-template[slPopoverLayer]',
    required: true,
    purpose:
      'The positioned layer. The positioner writes its position on this element, and this element scales and fades. Its padding is the gap between the trigger and the panel, which is where the arrow stands. It carries data-ui="popover", data-side, data-align, data-size, data-width and data-open.',
  },
  {
    part: 'content',
    element: 'the element carrying slPopoverContent',
    required: true,
    purpose:
      'The panel, with role="dialog" and tabindex="-1". It is named by its title and described by its description when those parts are present. aria-modal is never written, because the popover is not modal. It draws no padding: slPopoverHeader, slPopoverBody and slPopoverFooter carry the panel inset, set by --slotted-popover-padding-inline and --slotted-popover-padding-block.',
  },
  {
    part: 'header',
    element: 'the element carrying slPopoverHeader',
    required: false,
    purpose:
      'The row that holds the title, the description and the close button. It keeps its height while the body scrolls.',
  },
  {
    part: 'title',
    element: 'the element carrying slPopoverTitle',
    required: false,
    purpose:
      'The panel’s accessible name. Write it on a div, or on a heading when the title belongs in the document outline.',
  },
  {
    part: 'description',
    element: 'the element carrying slPopoverDescription',
    required: false,
    purpose: 'One line under the title, referenced by the panel through aria-describedby.',
  },
  {
    part: 'body',
    element: 'the element carrying slPopoverBody',
    required: false,
    purpose:
      'The only part that scrolls, bounded by --slotted-positioner-available-height. A scroll shadow at the cut edge shows that there is more content.',
  },
  {
    part: 'footer',
    element: 'the element carrying slPopoverFooter',
    required: false,
    purpose: 'The actions row, separated from the body by a rule and kept under it.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The close button, for a pointer or a touch screen, where there is no Escape key. It draws a cross glyph unless you project content of your own. With no text of its own it is named by the close message of the language in force; with text, such as Done, the text is its name.',
  },
  {
    part: 'arrow',
    element: 'the element carrying slPopoverArrow',
    required: false,
    purpose:
      'A rotated square in the panel’s background and border colors, which continues the panel’s outline towards the anchor. Place it beside the content inside ng-template[slPopoverLayer], not inside the content: the stylesheet selects it as a direct child of the layer. While arrow is false the layer leaves it out.',
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
    'false',
    'slPopover',
    'Whether the panel is open. Bind [(open)] to a signal to control it.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'slPopover',
    'The open state an uncontrolled popover starts with. It is read once, on init.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'slPopover',
    'The maximum width of the layer, which holds the panel and the gap around it: 16rem, 20rem or 24rem, with the inset and the title size to match.',
  ],
  [
    'width',
    "'auto' | 'anchor'",
    'auto',
    'slPopover',
    'auto sizes the panel to its content, up to the width size sets. anchor makes it exactly as wide as the anchor.',
  ],
  [
    'side',
    "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'slPopover',
    'The edge of the anchor the panel opens against. inline-start and inline-end follow the writing direction of the layer.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'center',
    'slPopover',
    'Where the panel sits along the side it opened on.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'slPopover',
    'When the layer exists. active builds it on open and removes it after the exit animation. lazy builds it on the first open and keeps it, for a panel whose content is expensive to build. eager builds it from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'slPopover',
    'The CSS position of the layer. Use fixed for a layer inside an overflow: hidden container, and absolute for one inside a transformed container.',
  ],
  ['arrow', 'boolean', 'true', 'slPopover', 'Whether the slPopoverArrow element is drawn.'],
  [
    'autoFocus',
    'boolean',
    'true',
    'slPopover',
    'Whether focus moves into the popover on open. Focus goes to the panel itself rather than to its first control, so a screen reader announces the panel’s name first and a destructive first control is not focused by default.',
  ],
  [
    'closeOnEscape',
    'boolean',
    'true',
    'slPopover',
    'Whether Escape closes the popover. Escape reaches only the topmost layer.',
  ],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'slPopover',
    'Whether a press outside the panel closes the popover.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'slPopover',
    'Whether the panel moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'slPopover',
    'Whether the panel slides along its side to stay inside the boundary.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'false',
    'slPopover',
    'Whether the panel hides when its anchor scrolls out of view. It is off, unlike slTooltip’s, so a task the reader is halfway through does not disappear when the row behind it scrolls.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'slPopover',
    'Whether the layer is rendered into the shared portal root at the end of the document. The portalled layer keeps the theme, color scheme, density and direction of the region it was opened from.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'slPopover',
    'Whether the popover never opens. It does not disable the trigger; set disabled on the trigger element for that.',
  ],
  [
    'messages',
    'Partial<PopoverMessages>',
    '—',
    'slPopover',
    'Text that replaces the language’s messages for this popover, key by key. close is the close button’s accessible name; an aria-label written on slPopoverClose takes precedence.',
  ],
  [
    'sideOffset',
    'number',
    '0',
    'slPopover',
    'Extra distance from the anchor in pixels, added to the standard gap.',
  ],
  ['alignOffset', 'number', '0', 'slPopover', 'Distance in pixels along the alignment axis.'],
  [
    'collisionPadding',
    'number',
    '8',
    'slPopover',
    'The minimum distance in pixels between the panel and the edge of the boundary.',
  ],
  [
    'arrowPadding',
    'number',
    '12',
    'slPopover',
    'The minimum distance in pixels between the arrow and the panel’s corners, so the arrow stays off the rounded corner.',
  ],
  [
    'initialFocus',
    'Element | string',
    '—',
    'slPopover',
    'What takes focus on open instead of the panel, such as a search field. A string is a selector read inside the panel.',
  ],
  [
    'finalFocus',
    'Element | string',
    '—',
    'slPopover',
    'What takes focus on close instead of the trigger, for a popover whose trigger is gone by then, such as one that deleted its own row.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'After the open state changes. It is the change half of [(open)].',
  },
  {
    name: 'openChangeRequest',
    payload: 'PopoverChangeRequest',
    when: 'Before the panel opens or closes, once per change. reason is pointer, keyboard, escape, outsidePress, dismiss or programmatic. cancel() refuses the change, and openChange is not emitted.',
  },
];

const composition = apiRows([
  [
    'the directive',
    'attribute',
    '—',
    'every part',
    'Every part is a directive on your own element, so the title can be a heading and the trigger can be any slButton. There is no render input.',
  ],
  [
    'exportAs',
    'slPopover',
    '—',
    '[slPopover]',
    'A template reference to the popover, with show(), hide() and toggle(next, reason), for code that has to open or close it outside a binding.',
  ],
  [
    'exportAs',
    'slPopoverLayer',
    '—',
    'ng-template[slPopoverLayer]',
    'A template reference to the layer, with reposition(), which measures and places the layer again.',
  ],
  [
    'slPopoverAnchor',
    'directive',
    '—',
    'composition',
    'The element the panel is positioned against, when it is not the trigger, such as a table row. It writes no attributes. A press on it counts as a press inside the popover.',
  ],
  [
    'providePopoverDefaults',
    'Provider',
    '—',
    'application or component',
    'Sets any option for every popover under the injector. An option set on a popover takes precedence, and an aria-label written on slPopoverClose takes precedence over both.',
  ],
  [
    'native attributes',
    'host',
    '—',
    'every part',
    'A part writes only the attributes it owns. A (click) listener on the trigger runs beside the popover’s own, and event.preventDefault() does not stop the popover’s.',
  ],
]);

const accessibility = [
  'The panel is a non-modal dialog: aria-modal is not written, nothing behind it becomes inert, and the page keeps scrolling. Use slDialog for content that has to block the page.',
  'The trigger carries aria-expanded, aria-haspopup="dialog", and aria-controls while the panel is in the document. The panel is named by its title through aria-labelledby and described by its description through aria-describedby. A popover without a title has no accessible name until you write aria-label on the slPopoverContent element.',
  'Focus moves to the panel on open, so a screen reader announces its name before its contents, and returns to the trigger on close. If the reader has moved focus elsewhere on the page, focus stays there. initialFocus and finalFocus name other targets.',
  'Tab past the last control in the panel, or Shift+Tab before the first, closes the popover and returns focus to the trigger; the next Tab continues down the page. Focus is never trapped in the panel.',
];

const snippets = [
  defineSnippet({
    id: 'popover-angular-application-defaults',
    label: 'Application defaults',
    language: 'ts',
    source: `
bootstrapApplication(App, {
  providers: [providePopoverDefaults({ size: 'lg' })],
});
`,
  }),
  defineSnippet({
    id: 'popover-tokens',
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
      id: 'popover-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `
<ng-container slPopover>
  <button slButton slPopoverTrigger type="button">Filters</button>
  <ng-template slPopoverLayer>
    <div slPopoverContent>
      <div slPopoverHeader>
        <div slPopoverTitle>Filter invoices</div>
        <button slPopoverClose></button>
      </div>
      <div slPopoverBody>Unpaid, overdue and disputed.</div>
    </div>
    <div slPopoverArrow></div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three width steps',
    note: 'Sixteen, twenty and twenty-four rems. The inset and the title step move with the width, and the controls inside move with the density.',
    snippet: defineSnippet({
      id: 'popover-angular-sizes',
      label: 'Sizes',
      language: 'angular',
      source: `
<ng-container slPopover size="lg">
  <button slButton slPopoverTrigger type="button">A form</button>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'width',
    title: 'As wide as its words, or as wide as the field',
    note: 'width="anchor" reads the anchor measured width, which is the one case Radix publishes a custom property for and the shape a filter panel under a search field needs.',
    snippet: defineSnippet({
      id: 'popover-angular-width',
      label: 'Width',
      language: 'angular',
      source: `
<ng-container slPopover align="start" width="anchor">
  <input slPopoverTrigger slTextFieldInput />
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'placement',
    title: 'Which edge it takes',
    note: 'The four physical sides and the two logical ones. Switch the toolbar to rtl: inline-start and inline-end swap, left and right stay where they are.',
    snippet: defineSnippet({
      id: 'popover-angular-placement',
      label: 'Placement',
      language: 'angular',
      source: `
<ng-container slPopover align="start" side="inline-end">
  <button slButton slPopoverTrigger type="button">Beside</button>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'anchor',
    title: 'Pointing at something other than the button',
    note: 'The panel hangs off the whole row and the button only opens it. Nothing is written on the anchor: it is measured and nothing else.',
    snippet: defineSnippet({
      id: 'popover-angular-anchor',
      label: 'Anchor',
      language: 'angular',
      source: `
<ng-container slPopover align="end">
  <div slPopoverAnchor>
    <span>Invoice 2026-014</span>
    <button slButton slPopoverTrigger type="button">More</button>
  </div>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'focus',
    title: 'Where the keyboard goes',
    note: 'The first panel takes the focus itself; the second sends it to its search field; the third leaves it on the trigger. Close each one and watch where the focus comes back to.',
    snippet: defineSnippet({
      id: 'popover-angular-focus',
      label: 'Focus',
      language: 'angular',
      source: `
<ng-container slPopover initialFocus="input">
  <button slButton slPopoverTrigger type="button">Search</button>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'dismissal',
    title: 'Every way it closes, and the reason it carries',
    note: 'Escape, a press outside, the close control, the trigger again. Each one reports a different reason, and a consumer may refuse any of them before anything moves.',
    snippet: defineSnippet({
      id: 'popover-angular-dismissal',
      label: 'Dismissal',
      language: 'angular',
      source: `
<ng-container slPopover (openChangeRequest)="refuseWhileDirty($event)">
  <button slButton slPopoverTrigger type="button">Edit</button>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'scrolling',
    title: 'More content than room',
    note: 'The body is the only part that scrolls, bounded by the height the engine says is left. The title and the actions keep theirs, and the fade at the cut says there is more.',
    snippet: defineSnippet({
      id: 'popover-angular-scrolling',
      label: 'Scrolling',
      language: 'angular',
      source: `
<div slPopoverContent>
  <div slPopoverHeader>
    <div slPopoverTitle>Notification settings</div>
  </div>
  <div slPopoverBody>...</div>
  <div slPopoverFooter>
    <button slButton size="sm" type="button">Save</button>
  </div>
</div>
`,
    }),
  },
  {
    id: 'composition',
    title: 'A panel holding a real form',
    note: 'Fields, a footer of actions and a close control. The controls inside are the consumer own and reach their form untouched: the family holds no value of theirs.',
    snippet: defineSnippet({
      id: 'popover-angular-composition',
      label: 'Composition',
      language: 'angular',
      source: `
<div slPopoverBody>
  <div slField>
    <label slFieldLabel>Amount</label>
    <input slFieldControl slTextFieldInput />
  </div>
</div>
`,
    }),
  },
  {
    id: 'nested',
    title: 'A tooltip on a control inside the panel',
    note: 'Two layers at once. The tooltip is a later layer, so it draws above the panel and Escape reaches it first; the panel closes on the second Escape and not before.',
    snippet: defineSnippet({
      id: 'popover-angular-nested',
      label: 'Nested',
      language: 'angular',
      source: `
<div slPopoverFooter>
  <ng-container slTooltip describes="label">
    <button slButton slTooltipTrigger type="button">Clear</button>
    <ng-template slTooltipLayer>
      <div slTooltipContent>Clear the filters</div>
    </ng-template>
  </ng-container>
</div>
`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Enter or Space opens it. Tab walks the panel and, past the last control, closes it and returns to the trigger — one extra Tab, and the reading order intact.',
    snippet: defineSnippet({
      id: 'popover-angular-keyboard',
      label: 'Keyboard',
      language: 'angular',
      source: `
<ng-container slPopover (openChangeRequest)="reason = $event.reason">
  <button slButton slPopoverTrigger type="button">Tab through me</button>
  <ng-template slPopoverLayer></ng-template>
</ng-container>
`,
    }),
  },
];

export const ANGULAR_POPOVER_DOCS = {
  popover: { accessibility, anatomy, api, composition, events, imports, scenes, snippets },
};
