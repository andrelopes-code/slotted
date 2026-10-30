import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import splitButtonTokens from '@slotted/styles/split-button/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SPLIT_BUTTON_TOKENS = splitButtonTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Split Button decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideSplitButtonDefaults,\n  SlSplitButton,\n  SlSplitButtonChoices,\n  SlSplitButtonMenuTrigger,\n  SlSplitButtonPrimary,\n} from '@slotted/angular/split-button';\nimport { SlMenu, SlMenuItem, SlMenuRadioGroup } from '@slotted/angular/menu';",
  selector: '[slSplitButton]',
  exportAs: 'slSplitButton',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with slSplitButton on it',
    required: true,
    purpose:
      'The group. It carries role="group", data-ui="split-button", the three appearance axes it hands to both halves, and data-disabled, data-loading and data-full-width. It paints the join; the chevron is the chevron-down Glyph element inside the menu trigger.',
  },
  {
    part: 'primary',
    element: 'the consumer’s own button, with slSplitButtonPrimary on it — SlButton, extended',
    required: true,
    purpose:
      'The action. Everything about it is Button’s: start and end, type, loading with the width held, focusableWhenDisabled, the native attributes. The family adds the part name and folds the root’s disabled and loading into its own.',
  },
  {
    part: 'menu-trigger',
    element:
      'the consumer’s own button, with slSplitButtonMenuTrigger and [slMenuTriggerFor] on it — SlIconButton, extended, hosting slMenuTriggerFor',
    required: true,
    purpose:
      'The menu button. It carries aria-haspopup="menu", aria-expanded and aria-controls from menu, the chevron from this family — content the consumer passes replaces it — and an accessible name the type makes mandatory. Square from the control height; it never shrinks.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One split button with every axis on it, driven by the controls below the canvas. Tab reaches the action, then the menu button: two controls, two stops, one shape.',
    snippet: defineSnippet({
      id: 'split-button-angular-playground',
      language: 'angular',
      label: 'An action and the menu of its alternatives',
      source: `<div slSplitButton>
  <button slSplitButtonPrimary (click)="save()">Save</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More save options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="saveDraft()">Save as draft</button>
    <button slMenuItem (select)="saveAndClose()">Save and close</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Five tones, three variants, one seam',
    note: 'Every tone and variant is button’s, handed to both halves at once. Between two solid halves the seam is the tone’s darkest step, painted on the trigger’s leading edge — the one edge the join leaves in the shared column.',
    snippet: defineSnippet({
      id: 'split-button-angular-variants',
      language: 'angular',
      label: 'A danger split button, outlined',
      source: `<div slSplitButton tone="danger" variant="outline">
  <button slSplitButtonPrimary (click)="remove()">Delete</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More delete options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="archive()">Arquivar em vez disso</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, one control tall',
    note: 'Both halves read the control scale, so the bar is exactly as tall as the field beside it and the trigger stays square at every step. Switch the density in the toolbar: the pair moves together.',
    snippet: defineSnippet({
      id: 'split-button-angular-sizes',
      language: 'angular',
      label: 'The small step',
      source: `<div slSplitButton size="sm">
  <button slSplitButtonPrimary (click)="save()">Save</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More save options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="saveDraft()">Save as draft</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'remember',
    title: 'The choice becomes the action',
    note: 'Under remember the alternatives are radio items bound to the family’s value, and the page renders the action’s label from it — the merge button whose strategy a repository remembers. Choose one, then read the primary. Without remember the items are actions.',
    snippet: defineSnippet({
      id: 'split-button-angular-remember',
      language: 'angular',
      label: 'A remembered merge strategy',
      source: `<div slSplitButton remember [value]="strategy()" (valueChange)="strategy.set($event.value)">
  <button slSplitButtonPrimary (click)="merge(strategy())">{{ labels[strategy()] }}</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More merge strategies"
  ></button>
  <sl-menu #more>
    <sl-menu-radio-group slSplitButtonChoices>
      <button slMenuRadioItem value="merge">Criar um commit de merge</button>
      <button slMenuRadioItem value="squash">Squash e merge</button>
      <button slMenuRadioItem value="rebase">Rebase e merge</button>
    </sl-menu-radio-group>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'loading',
    title: 'The action in flight',
    note: 'Press Save: the primary shows button’s indicator with its width and name held, and the menu button waits with it — aria-disabled, still focusable, still painted in the tone, refusing the click and the arrow keys. The bar is one control that is busy.',
    snippet: defineSnippet({
      id: 'split-button-angular-loading',
      language: 'angular',
      label: 'Loading on the root',
      source: `<div slSplitButton [loading]="saving()">
  <button slSplitButtonPrimary (click)="save()">Save</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More save options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="saveDraft()">Save as draft</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'disabled on the root takes both halves out natively; disabled on one half leaves the other an action. Hover, press and focus are button’s, and only focus is raised above the seam, because a hover repaints a fill and never an edge.',
    snippet: defineSnippet({
      id: 'split-button-angular-states',
      language: 'angular',
      label: 'One half out',
      source: `<div slSplitButton>
  <button slSplitButtonPrimary disabled>Mesclar</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More merge options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="closeRequest()">Close without merging</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'width',
    title: 'The line, and a narrow room',
    note: 'fullWidth gives the line to the action alone and the trigger stays square. In a narrow column the label wraps inside its own control, which is button’s rule, and the bar never pushes past the container.',
    snippet: defineSnippet({
      id: 'split-button-angular-width',
      language: 'angular',
      label: 'The action takes the line',
      source: `<div slSplitButton fullWidth>
  <button slSplitButtonPrimary (click)="order()">Place order</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More order options"
  ></button>
  <sl-menu #more>
    <button slMenuItem (select)="schedule()">Schedule delivery</button>
  </sl-menu>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'An icon before the label is SlButton’s slButtonStart slot and reaches the primary unchanged; a long translated action wraps rather than growing the bar; a right-to-left document puts the trigger at the other end of the action. Switch the direction in the toolbar.',
    snippet: defineSnippet({
      id: 'split-button-angular-content',
      language: 'angular',
      label: 'SlButton’s own start slot on the action',
      source: `<button slSplitButtonPrimary (click)="save()">
  <ng-icon slButtonStart name="lucideSave" />
  Save
</button>`,
    }),
  },
  {
    id: 'composition',
    title: 'Defaults once, the consumer’s own elements, and the handle',
    note: 'provideSplitButtonDefaults() sets tone, variant and size for every split button under an injector, and provideButtonDefaults() is consulted after it. The root is a section here and the action carries an analytics attribute, because each part is a directive on the consumer’s own element; the second button opens the menu through sl-menu’s own instance, carrying the programmatic reason.',
    snippet: defineSnippet({
      id: 'split-button-angular-composition',
      language: 'angular',
      label: 'Defaults provided, the consumer’s elements, and the menu instance',
      source: `<!-- providers: [provideSplitButtonDefaults({ size: 'sm', variant: 'outline' })] -->
<section slSplitButton>
  <button slSplitButtonPrimary data-track="save" (click)="save()">Save</button>
  <button
    slSplitButtonMenuTrigger
    [slMenuTriggerFor]="more"
    aria-label="More save options"
  ></button>
  <sl-menu #more="slMenu">
    <button slMenuItem (select)="saveDraft()">Save as draft</button>
  </sl-menu>
</section>
<button slButton variant="ghost" (click)="more.toggle(true, 'programmatic')">Open by handle</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the action, then the menu button. Space and Enter run the action from the first and open the menu from the second; ArrowDown opens on the first item, ArrowUp on the last; Escape closes and returns to the trigger. ArrowDown on the action does nothing, and the line below says what the family saw.',
    snippet: defineSnippet({
      id: 'split-button-angular-keyboard',
      language: 'angular',
      label: 'Reading why the menu opened',
      source: `<sl-menu #more (openChangeRequest)="log($event.reason)">
  <button slMenuItem (select)="saveDraft()">Save as draft</button>
</sl-menu>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(openChangeRequest) and [(open)], on sl-menu',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the menu opens or closes. The state is sl-menu’s own and the family adds no second owner — the same reasons in the same order: pointer, keyboard, escape, outsidePress, select, dismiss, programmatic.',
  },
  {
    name: '(valueChange), on slSplitButton',
    payload: 'ChangeRequest<string>',
    when: 'Under remember, before the remembered value moves. The request carries the new value, the one it replaces, the reason — pointer or keyboard — the originating event, and cancel(). Nothing is emitted for a value equal to the one held.',
  },
  {
    name: '(click), on the primary and the trigger',
    payload: 'the element’s own events',
    when: 'Whenever that button fires them. A busy or unavailable half refuses the activation in the capture phase, before the consumer’s listener; otherwise the consumer’s runs as written.',
  },
];

export const ANGULAR_SPLIT_BUTTON_DOCS = {
  splitButton: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'slSplitButton',
        'The tone both halves are painted in. Resolved from the prop, then SplitButtonDefaultsProvider, then button’s own provider, then the contract',
      ],
      [
        'variant',
        "'solid' | 'outline' | 'ghost'",
        'solid',
        'slSplitButton',
        'How the tone is painted on both halves. Between two solid halves the family paints the seam; outline and ghost share the edge the join leaves',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slSplitButton',
        'The control step. The trigger is square from the same height',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'slSplitButton',
        'Whether the action takes the whole line. The trigger stays square either way',
      ],
      [
        'remember',
        'boolean',
        'false',
        'slSplitButton',
        'Whether the choice in the menu becomes the action. On, the items inside the radio group carrying slSplitButtonChoices are bound to value and the page renders the primary’s label from it; off, the items are actions',
      ],
      [
        'value',
        'string',
        '—',
        'slSplitButton',
        'The remembered value. Bound, the consumer owns it for the life of the component; unbound, the family owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slSplitButton',
        'What an uncontrolled split button remembers first, read once',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slSplitButton',
        'Takes both halves out natively. Each half also accepts its own, which adds to the root’s',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slSplitButton',
        'The action is in flight: the primary shows button’s indicator with its width and name held, and the trigger is aria-disabled for the duration, still in the tab sequence and still painted',
      ],
      [
        'open',
        'boolean',
        '—',
        'sl-menu',
        'sl-menu’s own two-way model, untouched by the family. Bound, the consumer owns whether the menu shows',
      ],
      [
        'defaultOpen',
        'boolean',
        'false',
        'sl-menu',
        'sl-menu’s own uncontrolled start, untouched by the family',
      ],
      [
        'side, align, size, closeOnSelect, mount, and the rest, on sl-menu',
        'sl-menu’s inputs',
        'menu’s',
        'sl-menu',
        'Every input of sl-menu is written on the consumer’s own sl-menu: the surface is menu’s and nothing of it is re-declared here',
      ],
      [
        'type, loadingDelay, messages, focusableWhenDisabled, slButtonStart, slButtonEnd, on slSplitButtonPrimary',
        'SlButton’s inputs and slots',
        'SlButton’s',
        'slSplitButtonPrimary',
        'SlButton’s own inputs and content slots reach the action unchanged; only the three appearance axes are the root’s',
      ],
      [
        'slMenuTriggerFor, on slSplitButtonMenuTrigger',
        'SlMenu',
        '—',
        'slSplitButtonMenuTrigger',
        'The menu this trigger opens, as on any menu trigger. Hosted by the component, so the consumer writes one attribute and the part name survives',
      ],
      [
        'aria-label or aria-labelledby, on slSplitButtonMenuTrigger',
        'string',
        '—',
        'slSplitButtonMenuTrigger',
        'The menu button’s own name, distinct from the action’s. SlIconButton refuses to render without one in development: “More save options” beside “Save”',
      ],
    ]),
    composition: apiRows([
      [
        'slSplitButton, slSplitButtonPrimary, slSplitButtonMenuTrigger',
        'directives on the consumer’s own elements',
        '—',
        'the consumer’s elements',
        'Each part is a directive on the element the consumer wrote — a div or a section, two buttons — so every attribute, listener and structural directive around them stays as written, and the part names survive the host bindings',
      ],
      [
        'slSplitButtonChoices',
        'directive on sl-menu-radio-group',
        '—',
        'inside sl-menu, under remember',
        'Binds the consumer’s own radio group to the root’s value both ways. The group never owns the value: its request is forwarded and cancelled, and what it shows checked is written back from the root. It throws outside remember',
      ],
      [
        'exportAs',
        "'slSplitButton' | 'slSplitButtonPrimary' | 'slSplitButtonMenuTrigger' | 'slSplitButtonChoices'",
        '—',
        'a template reference',
        'Reaches each instance; sl-menu’s own exportAs reaches its instance — toggle(open, reason) — as it does for any menu',
      ],
      [
        'provideSplitButtonDefaults()',
        '(defaults: SplitButtonDefaults) => Provider',
        '—',
        'an injector',
        'The three decisions an application takes once, at the root or on one route. A split button that states an axis itself still wins, and provideButtonDefaults() is consulted after this one',
      ],
      [
        'role',
        'string',
        'group',
        'slSplitButton',
        'Read from the host with HostAttributeToken before the host binding writes, so a consumer’s own survives; role="" gives the group up inside a named one',
      ],
      [
        'slMenuItem, slMenuRadioItem, slMenuGroup, slMenuSeparator, …',
        'menu’s directives',
        '—',
        'inside sl-menu',
        'Imported from menu as they are. Nothing of the surface is re-exported under this family’s name',
      ],
    ]),
    accessibility: [
      'There is no APG split-button pattern. The action is the Button pattern’s button and the menu button is the Menu Button pattern’s (w3.org/WAI/ARIA/apg/patterns/menu-button/), each with its own tab stop — which is what every surveyed implementation does.',
      'The trigger carries aria-haspopup="menu", aria-expanded and, while open, aria-controls, all written by slMenuTriggerFor, which the component hosts; its accessible name is the consumer’s and SlIconButton refuses to render without one in development. A default string was declined: “More options” beside “Save” names the menu for no reader.',
      'Enter and Space open the menu on the first item, ArrowDown on the first and ArrowUp on the last, from menu; Escape closes and returns focus to the trigger. ArrowDown on the action does nothing — a key that opens a surface from a button whose name says the action is a surprise.',
      'disabled is the native attribute on both halves. loading keeps the trigger reachable and announces aria-disabled, so a reader who lands on it hears why nothing opens, while the primary announces its progress bar.',
      'Under remember the alternatives are menuitemradio items with aria-checked, so a reader hears which strategy is the action and that choosing another persists — the honest semantics of a choice that changes what the next click does.',
    ],
    snippets: [
      defineSnippet({
        id: 'split-button-angular-anatomy',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  data-ui="split-button"
  data-part="root"
  role="group"
  data-tone="accent"
  data-variant="solid"
  data-size="md"
>
  <button
    data-ui="button"
    data-part="primary"
    data-tone="accent"
    data-variant="solid"
    data-size="md"
    type="button"
  >
    <span data-part="label">Save</span>
  </button>
  <button
    data-ui="button"
    data-part="menu-trigger"
    data-tone="accent"
    data-variant="solid"
    data-size="md"
    data-shape="square"
    type="button"
    aria-label="More save options"
    aria-haspopup="menu"
    aria-expanded="false"
  >
    <span data-part="icon">
      <span data-ui="icon" data-part="root" aria-hidden="true">
        <svg data-part="glyph" data-glyph="chevron-down"></svg>
      </span>
    </span>
  </button>
</div>
;`,
      }),
      defineSnippet({
        id: 'split-button-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='split-button'] {
  --slotted-split-button-radius: var(--slotted-radius-full);
}`,
      }),
    ],
  },
} as const;
