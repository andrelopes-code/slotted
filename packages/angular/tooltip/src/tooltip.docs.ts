import tooltipTokens from '@slotted/styles/tooltip/tokens.json';
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

export const ANGULAR_TOOLTIP_TOKENS = tooltipTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tooltip decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideTooltipDefaults,\n  SlTooltip,\n  SlTooltipArrow,\n  SlTooltipContent,\n  SlTooltipLayer,\n  SlTooltipTrigger,\n} from '@slotted/angular/tooltip';",
  selector:
    '[slTooltip] on an ng-container, [slTooltipTrigger] on the control, ng-template[slTooltipLayer], [slTooltipContent], [slTooltipArrow]',
  exportAs: 'slTooltip',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The layer, built from ng-template[slTooltipLayer] when the tooltip mounts. The positioner writes its position, left and top, and the layer carries the scale and fade of the entrance. Its padding is the gap between the trigger and the surface, so the pointer crosses onto a hoverable tooltip without leaving it. It carries data-ui="tooltip", data-side, data-align, data-open and data-detached.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The painted surface, [slTooltipContent], with role="tooltip". It is a component, and it brings the tooltip stylesheet into the application. The trigger refers to it with aria-describedby, or with aria-labelledby under describes="label".',
  },
  {
    part: 'arrow',
    element: 'div',
    required: false,
    purpose:
      'A rotated square, [slTooltipArrow], drawn over the edge of the surface so its two outer edges continue the outline. Place it beside the content inside ng-template[slTooltipLayer], not inside the content: the stylesheet selects it as a direct child of the layer. It is hidden from assistive technology.',
  },
];

/**
 * The trigger is not a part: `data-part` names a part of the family that owns
 * the element, and sixteen stylesheets here key on `[data-part='root']`. The
 * `render` row of the composition table says so to the reader.
 */
const api = apiRows([
  [
    'open',
    'boolean',
    'false',
    'slTooltip',
    'Whether the tooltip is open. It is two-way: bind [(open)] to a signal to read and set the state, or leave it unbound and the tooltip keeps its own.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'slTooltip',
    'The state an uncontrolled tooltip starts in, read once in ngOnInit.',
  ],
  [
    'variant',
    "'inverse' | 'surface'",
    'inverse',
    'slTooltip',
    'inverse paints the tooltip in the colour opposite to the page, which needs no edge on a light page. surface paints the raised panel colour with a hairline border, for a page that is already dark.',
  ],
  [
    'size',
    "'sm' | 'md'",
    'md',
    'slTooltip',
    'The type step: sm for dense rows such as toolbars and table cells, md elsewhere. Both steps follow the density of the region, because both read the control scale.',
  ],
  [
    'describes',
    "'description' | 'label' | 'none'",
    'description',
    'slTooltip',
    'How the trigger refers to the tooltip. description writes aria-describedby while the tooltip is open. label writes aria-labelledby, so the tooltip is the accessible name of an icon-only button, and it forces mount="eager" so the name exists before the first open. none writes no reference and hides the content from assistive technology, for a tooltip that repeats words the trigger already carries.',
  ],
  [
    'openOn',
    "'hover' | 'focus' | 'manual'",
    'hover',
    'slTooltip',
    'What opens the tooltip. hover opens it on pointer hover and on keyboard focus, and focus opens it without a delay. focus opens it on keyboard focus only. manual binds neither: the tooltip opens only through open, show() or hide().',
  ],
  [
    'side',
    "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'top',
    'slTooltip',
    'The edge of the trigger the tooltip prefers. inline-start and inline-end follow the writing direction of the layer, resolved at every measurement; left and right do not.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'center',
    'slTooltip',
    'Where the tooltip sits along the edge it took: at the start of the trigger, at its centre or at its end.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'slTooltip',
    'When the layer is in the document. active adds it on open and removes it after the exit animation, lazy keeps it after the first open, and eager renders it from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'slTooltip',
    'The CSS position of the layer. Use fixed for a trigger inside an overflow: hidden ancestor, and absolute for one inside a transformed ancestor.',
  ],
  ['arrow', 'boolean', 'true', 'slTooltip', 'Whether the layer draws the arrow.'],
  [
    'hoverable',
    'boolean',
    'true',
    'slTooltip',
    'Whether the pointer can move from the trigger onto the tooltip without it closing. WCAG 2.2 SC 1.4.13 (Content on Hover or Focus) requires it, so turn it off only for content that meets the criterion another way.',
  ],
  [
    'closeOnPress',
    'boolean',
    'true',
    'slTooltip',
    'Whether pressing the trigger closes the tooltip, so it is not left over the dialog its button opened.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'slTooltip',
    'Whether the tooltip moves to the opposite edge when the preferred edge has no room.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'slTooltip',
    'Whether the tooltip slides along its edge to stay inside the boundary.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'slTooltip',
    'Whether the layer hides while its trigger is outside the clipping ancestor. The tooltip hides without closing and shows again when the trigger comes back; the pointer leaving is what closes it.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'slTooltip',
    'Whether the layer renders into the shared portal root at the end of the document. The portal root keeps the theme, colour scheme, density and direction of the region the tooltip opened from.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'slTooltip',
    'Turns the tooltip off: it never opens and renders no layer. The disabled state of the trigger is set on the trigger itself.',
  ],
  [
    'whenClipped',
    'boolean',
    'false',
    'slTooltip',
    'Opens the tooltip only while the text of the trigger is cut off by its box, such as a column header truncated to “Op…”. The trigger is measured at the moment the tooltip would open, so a column dragged wider stops opening it.',
  ],
  [
    'openDelay',
    'number',
    '600',
    'slTooltip',
    'Milliseconds the pointer rests on the trigger before the tooltip opens. Keyboard focus opens it without waiting.',
  ],
  [
    'closeDelay',
    'number',
    '150',
    'slTooltip',
    'Milliseconds the tooltip stays after the pointer leaves, which is the time the pointer has to reach a hoverable tooltip. At 0 the pointer cannot reach it.',
  ],
  [
    'groupDelay',
    'number',
    '400',
    'provideTooltipDefaults',
    'Milliseconds after one tooltip closes during which the next one in the same injector opens without openDelay, so a row of buttons pays the wait once. It is set through the provider, because every tooltip in that injector shares the window.',
  ],
  [
    'touchDelay',
    'number',
    '500',
    'slTooltip',
    'Milliseconds a touch is held on the trigger before the tooltip opens. A tap does not open it, because a tap is the action of the control.',
  ],
  [
    'sideOffset',
    'number',
    '0',
    'slTooltip',
    'Distance in pixels between the trigger and the tooltip beyond the standard gap. The standard gap is the padding of the layer, not empty page.',
  ],
  [
    'alignOffset',
    'number',
    '0',
    'slTooltip',
    'Distance in pixels the tooltip moves along its edge from the aligned position.',
  ],
  [
    'collisionPadding',
    'number',
    '8',
    'slTooltip',
    'The smallest distance in pixels between the tooltip and the edge of the boundary.',
  ],
  [
    'arrowPadding',
    'number',
    '8',
    'slTooltip',
    'The smallest distance in pixels between the arrow and the rounded corners of the surface, where the surface would stop covering the base of the arrow.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'Emitted after the tooltip changes its own value, which is what makes [(open)] two-way. Bind it alone when the template only reads the state.',
  },
  {
    name: 'openChangeRequest',
    payload: 'TooltipChangeRequest',
    when: 'Emitted once per change, before the layer moves. The request carries value, previous, reason (pointer, keyboard, escape, blur or programmatic) and the originating event. cancel() refuses the change: nothing moves and openChange is not emitted.',
  },
];

const composition = apiRows([
  [
    'slTooltipTrigger',
    'directive',
    '—',
    'the control',
    'Goes on a control the page already has, such as a slButton or a slIconButton. The tooltip writes only the ARIA reference and data-open on it, and no data-part, so the control keeps its own styling.',
  ],
  [
    'ng-template[slTooltipLayer]',
    'directive',
    '—',
    'slTooltip',
    'Holds the layer content in a template, because the layer is built when the tooltip mounts and removed when it unmounts. Its exportAs, slTooltipLayer, reaches reposition().',
  ],
  [
    'exportAs',
    'slTooltip',
    '—',
    'slTooltip',
    'A template reference such as #hint="slTooltip" reaches show() and hide(), which open and close the tooltip without a delay.',
  ],
  [
    'provideTooltipDefaults',
    '(defaults: Partial<TooltipDefaults>) => Provider[]',
    '—',
    'providers',
    'Sets any axis and any delay once for every tooltip in the injector it is provided in, and holds the group window. A value set on one tooltip wins.',
  ],
  [
    'provideSlottedPortalContainer',
    '(container: () => Element | null) => Provider',
    'document.body',
    'providers',
    'Names the element every layer renders into, set through setPortalContainer. An application shell with its own stacking context provides it once.',
  ],
]);

const accessibility = [
  'The content has role="tooltip" and the trigger refers to it: with aria-describedby by default, and with aria-labelledby under describes="label". An icon-only button that its tooltip only describes has no name, and a screen reader announces it as “button”.',
  'Escape closes the tooltip and leaves focus on the trigger. It reaches the topmost layer only, so a tooltip open over a popover closes first. Escape is the whole keyboard table of the WAI-ARIA tooltip pattern, and it meets WCAG 2.2 SC 1.4.13 Dismissible. The tooltip never takes focus and holds nothing focusable: content with a link or a button belongs in a Popover.',
  'The pointer can move onto the tooltip without it closing, because the gap between the trigger and the surface is the padding of the layer, not empty page (SC 1.4.13 Hoverable). Nothing closes the tooltip on a timer (Persistent).',
  'A coarse pointer has no hover, so a long press opens the tooltip and a tap does not. A tooltip is supplementary: a fact reachable only by hover or long press is a fact many readers never reach, so a tooltip may never be the only place a fact is written.',
];

const snippets = [
  defineSnippet({
    id: 'tooltip-angular-application-defaults',
    label: 'Application defaults',
    language: 'ts',
    source: `
bootstrapApplication(App, {
  providers: [
    provideTooltipDefaults({
      closeDelay: 150,
      groupDelay: 400,
      openDelay: 600,
      variant: 'surface',
    }),
  ],
});
`,
  }),
  defineSnippet({
    id: 'tooltip-tokens',
    label: 'Retuning the family',
    language: 'css',
    source: `
:root {
  --slotted-tooltip-surface: #101828;
  --slotted-tooltip-measure: 22rem;
  --slotted-tooltip-gap: 0.625rem;
  --slotted-tooltip-arrow-size: 0.625rem;
}
`,
  }),
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'A hint on a control',
    note: 'Hover the button, or Tab to it: focus opens the hint in the same task and the pointer waits out the delay first.',
    snippet: defineSnippet({
      id: 'tooltip-angular-playground',
      label: 'Playground',
      language: 'angular',
      source: `
<ng-container slTooltip>
  <button slButton slTooltipTrigger type="button">Publish</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Sends the draft to every subscriber</div>
    <div slTooltipArrow></div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'variant',
    title: 'Inverse, and surface',
    note: 'The inverse hint separates itself from a light page with no edge at all; the surface one takes the raised surface and the hairline it needs on a dark ground.',
    snippet: defineSnippet({
      id: 'tooltip-angular-variant',
      label: 'Variant',
      language: 'angular',
      source: `
<ng-container slTooltip variant="surface">
  <button slButton slTooltipTrigger type="button">On a dark page</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Reads as a small panel rather than as a label</div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'sizes',
    title: 'Two type steps',
    note: 'Small is the hint inside a dense table row; medium is everywhere else. Switch the density in the toolbar and both tighten without either changing meaning.',
    snippet: defineSnippet({
      id: 'tooltip-angular-sizes',
      label: 'Sizes',
      language: 'angular',
      source: `
<ng-container slTooltip size="sm">
  <button slButton slTooltipTrigger type="button">Small</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Twelve pixels, in a row that has no room</div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'placement',
    title: 'Which edge it takes',
    note: 'Four sides around one anchor. inline-start and inline-end mirror with the direction; left and right do not, which is why the arrow stays put when the toolbar switches to rtl.',
    snippet: defineSnippet({
      id: 'tooltip-angular-placement',
      label: 'Placement',
      language: 'angular',
      source: `
<ng-container slTooltip align="start" side="inline-end">
  <button slButton slTooltipTrigger type="button">Beside</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Mirrors with the writing direction</div>
    <div slTooltipArrow></div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'delay',
    title: 'The warmup, and the group window',
    note: 'Cross the row of buttons quickly and nothing opens. Rest on one, wait, and it opens; move to its neighbour inside the group window and that one opens in the same task.',
    snippet: defineSnippet({
      id: 'tooltip-angular-delay',
      label: 'Delay',
      language: 'ts',
      source: `
@Component({
  providers: [provideTooltipDefaults({ groupDelay: 400, openDelay: 600 })],
})
export class RowActions {}
`,
    }),
  },
  {
    id: 'describes',
    title: 'Description, or name',
    note: 'The left button is labelled and the hint describes it. The right one has no words of its own, so the hint is its accessible name and the layer is in the document before anyone opens it.',
    snippet: defineSnippet({
      id: 'tooltip-angular-describes',
      label: 'Describes',
      language: 'angular',
      source: `
<ng-container slTooltip describes="label">
  <button slButton slTooltipTrigger type="button">+</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Add a row</div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'hoverable',
    title: 'Reaching the hint with the pointer',
    note: 'Open the left one and move the pointer onto it: it stays, because the gap is the layer own padding. The right one is [hoverable]="false" and lets the pointer straight through.',
    snippet: defineSnippet({
      id: 'tooltip-angular-hoverable',
      label: 'Hoverable',
      language: 'angular',
      source: `
<ng-container slTooltip [hoverable]="false">
  <button slButton slTooltipTrigger type="button">Passes through</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>The pointer never lands on this one</div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A sentence long enough to meet the measure, a single unbroken token, and a string in another script. The cap is a token rather than an axis, because measure belongs to Container.',
    snippet: defineSnippet({
      id: 'tooltip-angular-content',
      label: 'Content',
      language: 'angular',
      source: `
<div slTooltipContent>
  Publishing sends the draft to every subscriber on the list and cannot be undone from here.
</div>
`,
    }),
  },
  {
    id: 'disabled',
    title: 'A hint on a control that is out of action',
    note: 'A native disabled button fires no pointer events, so its explanation is unreachable. Use aria-disabled on a control that stays focusable, or put the trigger on a wrapper.',
    snippet: defineSnippet({
      id: 'tooltip-angular-disabled',
      label: 'Disabled',
      language: 'angular',
      source: `
<ng-container slTooltip>
  <button aria-disabled="true" slButton slTooltipTrigger type="button">Publish</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Publish once the invoice has a customer</div>
  </ng-template>
</ng-container>
`,
    }),
  },
  {
    id: 'composition',
    title: 'In a row of icon buttons',
    note: 'Where a tooltip actually lives. Every trigger is the consumer own button, and one provider sets the hint and the delays for the whole row.',
    snippet: defineSnippet({
      id: 'tooltip-angular-composition',
      label: 'Composition',
      language: 'ts',
      source: `
@Component({
  providers: [provideTooltipDefaults({ describes: 'label', size: 'sm' })],
})
export class Toolbar {}
`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Tab in and the hint opens with no delay; press Escape and it goes without the focus moving; press Enter and the button acts and the hint clears itself away.',
    snippet: defineSnippet({
      id: 'tooltip-angular-keyboard',
      label: 'Keyboard',
      language: 'angular',
      source: `
<ng-container slTooltip (openChangeRequest)="reason = $event.reason">
  <button slButton slTooltipTrigger type="button">Tab to me</button>
  <ng-template slTooltipLayer>
    <div slTooltipContent>Escape dismisses without moving the focus</div>
  </ng-template>
</ng-container>
`,
    }),
  },
];

export const ANGULAR_TOOLTIP_DOCS = {
  tooltip: { accessibility, anatomy, api, composition, events, imports, scenes, snippets },
};
