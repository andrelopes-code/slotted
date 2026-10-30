import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import toggleTokens from '@slotted/styles/toggle/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TOGGLE_TOKENS = toggleTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toggle decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideToggleDefaults, SlToggle, SlToggleIcon } from '@slotted/angular/toggle';",
  selector: 'button[slToggle]',
  exportAs: 'slToggle',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own button, with slToggle on it',
    required: true,
    purpose:
      'The control. It carries data-ui="toggle", aria-pressed in both states, data-pressed while it is on, and the two axes. Its border is always present, so turning it on changes a colour and never the geometry.',
  },
  {
    part: 'icon',
    element: 'the consumer’s own element, with slToggleIcon on it',
    required: false,
    purpose:
      'The mark, sized from the control glyph scale and hidden from the reading order. A toggle with a mark and no words draws square and takes its accessible name from the aria-label the consumer writes.',
  },
  {
    part: 'label',
    element: 'span, always rendered; empty when the button projects no words',
    required: false,
    purpose:
      'The words. A box of their own, so a label a narrow container made too long clips at the ellipsis instead of wrapping — and the string stays whole in the DOM.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One toggle with every axis on it, driven by the controls below the canvas. Press it: the label stays “Quebrar linhas” and the state is what changes, which is what a screen reader announces beside it.',
    snippet: defineSnippet({
      id: 'toggle-angular-playground',
      language: 'angular',
      label: 'A mode that switches on and off',
      source: `<button slToggle defaultPressed>
  <ng-icon slToggleIcon name="lucideWrapText" />
  Quebrar linhas
</button>`,
    }),
  },
  {
    id: 'pressed',
    title: 'Owned by the consumer, or by the toggle',
    note: 'The left toggle owns its state and starts from defaultPressed. The right one is controlled: the page holds the value, the toggle asks with a request carrying the reason, and the page decides. Both announce “pressed” the same way.',
    snippet: defineSnippet({
      id: 'toggle-angular-pressed',
      language: 'angular',
      label: 'The controlled pair',
      source: `<button slToggle [pressed]="wrap()" (pressedChange)="wrap.set($event.value)">
  <ng-icon slToggleIcon name="lucideWrapText" />
  Quebrar linhas
</button>`,
    }),
  },
  {
    id: 'variant',
    title: 'Framed, or bare until it is on',
    note: 'outline draws its own edge and stands beside a field; ghost is the toggle inside something already framed — a toolbar, a card header. Both turn on into the same accent pair, so “on” is one colour wherever the control is.',
    snippet: defineSnippet({
      id: 'toggle-angular-variant',
      language: 'angular',
      label: 'The bare variant',
      source: `<button slToggle variant="ghost">
  <ng-icon slToggleIcon name="lucidePin" />
  Pin header
</button>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, one control tall',
    note: 'Every step reads the control scale, so a toggle beside a text field of the same step lines up with it to the pixel — and the density switch in the toolbar moves both together.',
    snippet: defineSnippet({
      id: 'toggle-angular-sizes',
      language: 'angular',
      label: 'The small step beside a field',
      source: `<button slToggle size="sm">
  <ng-icon slToggleIcon name="lucideWrapText" />
  Quebrar
</button>`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'A mark and no words',
    note: 'Without children the toggle draws square from the control height and the mark is centred in it. The name comes from aria-label, and the type makes nothing of that: the reference page is where the rule is stated, and the harness photographs it.',
    snippet: defineSnippet({
      id: 'toggle-angular-icon-only',
      language: 'angular',
      label: 'Named by the consumer',
      source: `<button slToggle aria-label="Negrito" defaultPressed>
  <ng-icon slToggleIcon name="lucideBold" />
</button>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover takes the neutral ground when off and the accent ground’s own hover step when on. Disabled keeps both facts of a toggle that is on: the ground says unavailable and the edge still says on, so the reader learns the mode from a control they cannot change.',
    snippet: defineSnippet({
      id: 'toggle-angular-states',
      language: 'angular',
      label: 'On and unavailable',
      source: `<button slToggle defaultPressed disabled>
  <ng-icon slToggleIcon name="lucidePin" />
  Pin header
</button>`,
    }),
  },
  {
    id: 'toolbar',
    title: 'Inside a toolbar',
    note: 'The bar is one tab stop with arrow navigation across every control it holds, and a toggle is one of those controls: Tab reaches the bar once, the arrows reach the toggle, Space presses it. The family writes no listener of its own.',
    snippet: defineSnippet({
      id: 'toggle-angular-toolbar',
      language: 'angular',
      label: 'Ghost modes in a bar',
      source: `<div slToolbar aria-label="Editor">
  <button slToggle variant="ghost" aria-label="Negrito">
    <ng-icon slToggleIcon name="lucideBold" />
  </button>
  <button slToggle variant="ghost" aria-label="Italic">
    <ng-icon slToggleIcon name="lucideItalic" />
  </button>
  <hr slToolbarSeparator />
  <button slToggle variant="ghost">
    <ng-icon slToggleIcon name="lucideWrapText" />
    Quebrar
  </button>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long translated label in a narrow column clamps at the ellipsis and keeps its string whole in the DOM; a right-to-left document mirrors the mark to the other side of the words. Switch the direction in the toolbar to see the second.',
    snippet: defineSnippet({
      id: 'toggle-angular-content',
      language: 'angular',
      label: 'A label the column cannot hold',
      source: `<button slToggle>
  <ng-icon slToggleIcon name="lucideWrapText" />
  Zeilenumbruch aktivieren
</button>`,
    }),
  },
  {
    id: 'composition',
    title: 'Defaults once, and the consumer’s own element',
    note: 'provideToggleDefaults() sets size and variant for every toggle under an injector; a toggle that states either itself still wins. The directive sits on the consumer’s own button, so an analytics attribute or a template reference is written where it always was.',
    snippet: defineSnippet({
      id: 'toggle-angular-composition',
      language: 'angular',
      label: 'Defaults provided, and the instance reached',
      source: `<!-- providers: [provideToggleDefaults({ size: 'sm', variant: 'ghost' })] -->
<button slToggle #pin="slToggle" data-track="pin" (click)="track(pin.isPressed())">
  <ng-icon slToggleIcon name="lucidePin" />
  Fixar
</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the control; Space and Enter turn it on and off; nothing else is bound. The request that reaches the consumer says keyboard rather than pointer, and the line below shows which one it saw.',
    snippet: defineSnippet({
      id: 'toggle-angular-keyboard',
      language: 'angular',
      label: 'Reading the reason',
      source: `<button slToggle (pressedChange)="log($event.reason)">
  <ng-icon slToggleIcon name="lucideWrapText" />
  Quebrar linhas
</button>`,
    }),
  },
  {
    id: 'versus',
    title: 'Toggle, or ToggleButton',
    note: 'A mode is one colour and true the moment it is pressed: Toggle. An action that persists — Follow, Subscribe — reaches a server, waits, and stands in one of five tones beside the other actions of a page: button’s ToggleButton. Same state model, different meaning.',
    snippet: defineSnippet({
      id: 'toggle-angular-versus',
      language: 'angular',
      label: 'The two members side by side',
      source: `<button slToggle>
  <ng-icon slToggleIcon name="lucideWrapText" />
  Quebrar linhas
</button>
<button
  slToggleButton
  [loading]="following()"
  [pressed]="followed()"
  (pressedChange)="follow($event)"
>
  Seguir
</button>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'pressedChange',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the state moves. The request carries the new value, the value it replaces, the reason — pointer or keyboard — the originating event, and cancel(), which refuses the move before anything commits. Nothing is emitted for a value equal to the one the toggle already holds.',
  },
  {
    name: '(click), (focus), (blur)',
    payload: 'the element’s own events',
    when: 'Whenever the button fires them. The family listens after the view is created, so a (click) written on the same element runs first; calling preventDefault() in it stops the toggle as well.',
  },
];

export const ANGULAR_TOGGLE_DOCS = {
  toggle: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'pressed',
        'boolean',
        '—',
        'slToggle',
        'Bound, the consumer owns the state for the life of the component. Unbound, the toggle owns it and starts from defaultPressed',
      ],
      [
        'defaultPressed',
        'boolean',
        'false',
        'slToggle',
        'What an uncontrolled toggle starts from, read once. A later change to it does not silently become new state',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slToggle',
        'The control step. It reads the control scale, so the toggle is as tall as the field beside it',
      ],
      [
        'variant',
        "'outline' | 'ghost' | 'chips'",
        'outline',
        'slToggle',
        'Whether the control draws its own edge before it is on, or is a chip pressed in the neutral tone ink. There is no tone axis: a mode is one colour when it is on, and an action that persists in one of five tones is button’s ToggleButton',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slToggle',
        'The native attribute, which is also what makes the browser refuse focus. A toggle that is on and unavailable keeps saying both',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button',
        'slToggle',
        'The native attribute, kept when the consumer wrote it. A toggle in a form is not a form control — checkbox and switch are — so it is a button unless the consumer says otherwise',
      ],
    ]),
    composition: apiRows([
      [
        'slToggle',
        'directive on a button',
        '—',
        'the consumer’s element',
        'The component is a directive on the consumer’s own button: every attribute, every listener and every structural directive around it stay as written. It stays a button, because aria-pressed on a link is a link announcing a state a link does not hold',
      ],
      [
        'slToggleIcon',
        'directive on any element',
        '—',
        'inside the button',
        'The mark, projected before the words and hidden from the reading order. An ng-icon, an inline svg or a masked span all work and none loses its own semantics',
      ],
      [
        'exportAs',
        "'slToggle'",
        '—',
        'a template reference',
        'Reaches the instance, so a template can read isPressed(), resolvedSize() or resolvedVariant() without the component owning a second copy of the state',
      ],
      [
        'provideToggleDefaults()',
        '(defaults: Partial<ToggleDefaults>) => Provider',
        '—',
        'an injector',
        'The two decisions an application takes once, at the root or on one route. A toggle that states either itself still wins',
      ],
      [
        'type',
        'string',
        'button',
        'slToggle',
        'Read from the host with HostAttributeToken before the host binding writes, so a consumer’s own submit survives',
      ],
    ]),
    accessibility: [
      'The APG Button pattern’s toggle button (w3.org/WAI/ARIA/apg/patterns/button/): a native button with aria-pressed, and no navigation pattern around it — a single control has no arrows of its own.',
      'aria-pressed is written in both states, so the control is announced as a toggle rather than as a button that happens to be pressed — and the label never changes with the state, which the pattern calls critical. A toggle with only a mark takes its name from an aria-label the consumer writes.',
      'Inside slToolbar the bar owns the tab stop and the arrows and reaches this control as it reaches every focusable control it holds; the family writes no listener. Space and Enter press it, from the platform.',
      'disabled is the native attribute, because that is also what makes the browser refuse focus and skip the control. The toggle is not a form control and implements no ControlValueAccessor: a value a form submits is checkbox or switch.',
      'The target is the control itself, never narrower than it is tall, so the WCAG 2.2 minimum of 24 by 24 holds at the smallest step and the tightest density — and the theme grows every control to 44 under a coarse pointer.',
    ],
    snippets: [
      defineSnippet({
        id: 'toggle-angular-anatomy',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<button
  data-ui="toggle"
  data-part="root"
  type="button"
  aria-pressed="true"
  data-pressed
  data-size="md"
  data-variant="outline"
>
  <ng-icon data-part="icon" aria-hidden="true"></ng-icon>
  <span data-part="label">Quebrar linhas</span>
</button>`,
      }),
      defineSnippet({
        id: 'toggle-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='toggle'] {
  --slotted-toggle-radius: var(--slotted-radius-full);
  --slotted-toggle-border-color: var(--slotted-border-subtle);
  --slotted-toggle-pressed-background: var(--slotted-tone-success-surface);
  --slotted-toggle-pressed-border-color: var(--slotted-tone-success-border);
  --slotted-toggle-pressed-color: var(--slotted-tone-success-text);
}`,
      }),
    ],
  },
} as const;
