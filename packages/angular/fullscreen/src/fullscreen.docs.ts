import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import fullscreenTokens from '@slotted/styles/fullscreen/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_FULLSCREEN_TOKENS = fullscreenTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Fullscreen decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideFullscreenDefaults, SlFullscreen, SlFullscreenContent, SlFullscreenIcon, SlFullscreenTrigger } from '@slotted/angular/fullscreen';",
  selector:
    '[slFullscreen], button[slFullscreenTrigger], [slFullscreenContent], [slFullscreenIcon]',
  exportAs: 'slFullscreen, slFullscreenTrigger',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with slFullscreen on it',
    required: true,
    purpose:
      'The region that goes full screen. At rest it paints nothing — it is the container the consumer already had. In full screen it carries data-fullscreen and data-mode (native or layout), takes the page ground and the inset, and scrolls by itself.',
  },
  {
    part: 'trigger',
    element: 'the consumer’s own button, with slFullscreenTrigger on it',
    required: false,
    purpose:
      'The control. It carries data-ui="fullscreen" of its own, so it is styled wherever it stands — inside the region, or in a bar outside it with [slFullscreenTrigger]="fs". Its words and its mark say what the press does next.',
  },
  {
    part: 'content',
    element: 'the consumer’s own element, with slFullscreenContent on it',
    required: false,
    purpose:
      'A direct child of the region that takes, in full screen, the height the other children leave; its first child fills it. Without it, a region with one child gives that child the height, and a lone img, video or canvas fills it with object-fit: contain.',
  },
  {
    part: 'icon',
    element: 'span, rendered by the control',
    required: true,
    purpose:
      'The mark, hidden from the reading order. Empty, it draws the four corners opening or closing from the glyph tokens; an element marked slFullscreenIcon is projected into it instead.',
  },
  {
    part: 'label',
    element: 'span, rendered by the control',
    required: true,
    purpose:
      'The words — the message the state picks, or the content the consumer projects. With iconOnly they are visually hidden and stay the accessible name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A revenue panel with its control in the header. Press it: the panel takes the screen through the browser, the words become “Exit full screen” and the mark turns inward. Escape, or the control again, gives the page back with the scroll where it was.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-playground',
      language: 'angular',
      label: 'A panel the reader can give the whole screen',
      source: `<section slFullscreen>
  <div slFullscreenContent>
    <figure slChart title="Revenue by month" [data]="monthly" [series]="revenue">
      <button slFullscreenTrigger slChartActions iconOnly></button>
    </figure>
  </div>
</section>`,
    }),
  },
  {
    id: 'layout',
    title: 'Inside the page, where the browser will not',
    note: 'mode="layout" never asks the browser: the region is fixed over the page, the page behind stops scrolling, and Escape leaves. It is the picture an iframe without allow="fullscreen" or a phone browser gets under the default mode too.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-layout',
      language: 'angular',
      label: 'Expanding in the layout',
      source: `<section slFullscreen mode="layout">
  <button slFullscreenTrigger></button>
</section>`,
    }),
  },
  {
    id: 'fill',
    title: 'The height of the screen, not only its width',
    note: 'The browser stretches the region and none of its children. slFullscreenContent takes the height a bar and a caption leave, and the chart’s plot grows into it; a region with a single card gives the card the height instead.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-fill',
      language: 'angular',
      label: 'A bar, the content part and a caption',
      source: `<section slFullscreen>
  <div slToolbar><button slFullscreenTrigger></button></div>
  <div slFullscreenContent>
    <figure slChart title="Revenue by month" [data]="monthly" [series]="revenue"></figure>
  </div>
  <p slText>Source: accounting close.</p>
</section>`,
    }),
  },
  {
    id: 'controlled',
    title: 'The page holds the state',
    note: 'The page binds [(fullscreen)] to a signal and every move first arrives on fullscreenChangeRequest with its reason: pointer or keyboard from the control, escape when the reader left on their own. The line under the panel prints each one.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-controlled',
      language: 'angular',
      label: 'The two-way value and the request',
      source: `<section slFullscreen [(fullscreen)]="presenting" (fullscreenChangeRequest)="log($event.reason)">
  <button slFullscreenTrigger></button>
</section>`,
    }),
  },
  {
    id: 'error',
    title: 'Refused, and still full screen',
    note: 'When the browser has no API or refuses, the region enters the layout and fullscreenError says why — unsupported or refused. A page that prefers nothing sets the state back to false from the same handler.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-error',
      language: 'angular',
      label: 'Reading the refusal',
      source: `<section slFullscreen (fullscreenError)="notice.set($event.kind)">
  <button slFullscreenTrigger></button>
</section>`,
    }),
  },
  {
    id: 'overlays',
    title: 'A menu opened from inside',
    note: 'The select in the panel opens its list inside the region while it is full screen: the portal root follows the element the browser shows. Escape in the layout closes the list first and the region on the second press.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-overlays',
      language: 'angular',
      label: 'An overlay in a region in full screen',
      source: `<section slFullscreen>
  <sl-select aria-label="Period" [value]="'6m'">
    <sl-select-item value="3m">Last 3 months</sl-select-item>
    <sl-select-item value="6m">Last 6 months</sl-select-item>
  </sl-select>
  <button slFullscreenTrigger></button>
</section>`,
    }),
  },
  {
    id: 'document',
    title: 'The whole document',
    note: 'slFullscreen on the application’s root element and a control anywhere that takes its instance: presentation mode for the whole application is the directive and one binding.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-document',
      language: 'angular',
      label: 'The application root as the region',
      source: `<main slFullscreen #app="slFullscreen">
  <button [slFullscreenTrigger]="app" variant="outline">Presentation mode</button>
</main>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the control, Space or Enter presses it and the reason says keyboard. While full screen, Tab wraps inside the region. Escape in native full screen belongs to the browser — the family writes no listener and reports the leave as escape.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-keyboard',
      language: 'angular',
      label: 'Reading the reason',
      source: `<section slFullscreen (fullscreenChangeRequest)="reason.set($event.reason)">
  <button slFullscreenTrigger></button>
</section>`,
    }),
  },
  {
    id: 'trigger',
    title: 'The control: two variants, three steps, every state',
    note: 'ghost stands in a bar that is already framed, outline over content and carries its own ground. Each step reads the control scale, so the control lines up with a button of the same step. Disabled keeps the words legible and refuses the press.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-trigger',
      language: 'angular',
      label: 'The framed step beside a button',
      source: `<button slFullscreenTrigger size="sm" variant="outline"></button>`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'The mark alone',
    note: 'iconOnly draws the control square from its height and keeps the words, visually hidden, as its name — so it still says “Exit full screen” to a screen reader when the mark turns inward.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-icon-only',
      language: 'angular',
      label: 'A square control',
      source: `<button slFullscreenTrigger iconOnly></button>`,
    }),
  },
  {
    id: 'outside',
    title: 'The control outside the region',
    note: 'A bar above a chart holds the control; the chart is the region. exportAs hands the instance to the control, which changes with the chart’s state. Inside the region, a second control takes the reader back.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-outside',
      language: 'angular',
      label: 'An exported instance as the target',
      source: `<button [slFullscreenTrigger]="chart"></button>
<section slFullscreen #chart="slFullscreen">…</section>`,
    }),
  },
  {
    id: 'composition',
    title: 'Defaults once, words and mark of the consumer',
    note: 'provideFullscreenDefaults sets the step and the variant for an injector. Projected words and a slFullscreenIcon mark replace the family’s, and read fs.fullscreen() to keep following the state.',
    snippet: defineSnippet({
      id: 'fullscreen-angular-composition',
      language: 'angular',
      label: 'A label and a mark that follow the state',
      source: `<section slFullscreen #fs="slFullscreen">
  <button slFullscreenTrigger variant="outline">
    <ng-icon slFullscreenIcon [name]="fs.fullscreen() ? 'lucideX' : 'lucidePresentation'" />
    {{ fs.fullscreen() ? 'Terminar' : 'Apresentar' }}
  </button>
</section>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'fullscreenChange',
    payload: 'boolean',
    when: 'The two-way half of [(fullscreen)], after a request was accepted.',
  },
  {
    name: 'fullscreenChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the state moves. The reason is pointer or keyboard from the control, programmatic from the instance, and escape when the reader left on their own — Escape in the layout, or the browser’s own exit in native, which has already happened by then. cancel() refuses it.',
  },
  {
    name: 'fullscreenError',
    payload: "{ kind: 'unsupported' | 'refused', cause?: unknown }",
    when: 'When the browser has no API or refuses the request. The region has already entered the layout and the state stays true.',
  },
];

export const ANGULAR_FULLSCREEN_DOCS = {
  fullscreen: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'fullscreen',
        'model<boolean>',
        'false',
        'slFullscreen',
        'The state, two-way. Every move is asked first on fullscreenChangeRequest',
      ],
      [
        'defaultFullscreen',
        'boolean',
        'false',
        'slFullscreen',
        'Read once after the first render. True asks the browser outside a gesture, which refuses, so the region starts in the layout',
      ],
      [
        'mode',
        "'auto' | 'layout'",
        'auto',
        'slFullscreen',
        'auto asks the browser and falls back to the layout when it has no API or refuses; layout never asks',
      ],
      [
        'navigationUI',
        "'auto' | 'show' | 'hide'",
        'auto',
        'slFullscreen',
        'Passed to the native request: whether the browser keeps its navigation interface on screen',
      ],
      [
        'messages',
        'Partial<FullscreenMessages>',
        '—',
        'slFullscreen',
        'Words laid over the language in force, key by key: the two labels of the control (enter, exit) and the two announcements (entered, exited). entered says how to leave',
      ],
      [
        'slFullscreenTrigger',
        'SlFullscreen',
        'the enclosing region',
        'slFullscreenTrigger',
        'The instance of a region the control is not inside',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slFullscreenTrigger',
        'The control step, from the control scale',
      ],
      [
        'variant',
        "'ghost' | 'outline'",
        'ghost',
        'slFullscreenTrigger',
        'ghost inside a framed bar; outline over content, with its own ground',
      ],
      [
        'iconOnly',
        'boolean',
        'false',
        'slFullscreenTrigger',
        'The mark alone in a square; the words stay as the accessible name',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slFullscreenTrigger',
        'The native attribute; the press is refused',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button',
        'slFullscreenTrigger',
        'A type the consumer wrote survives; a button otherwise',
      ],
    ]),
    composition: apiRows([
      [
        'provideFullscreenDefaults',
        '{ mode, navigationUI, size, variant }',
        '—',
        'an injector',
        'The decisions an application takes once; an input still wins',
      ],
      [
        'exportAs',
        'slFullscreen',
        '—',
        '[slFullscreen]',
        'The instance: fullscreen(), mode(), supported(), error(), t(), enter(), exit(), toggle()',
      ],
      [
        'slFullscreenContent',
        'directive',
        '—',
        'a direct child of the region',
        'The part that takes the height in full screen, on the consumer’s own element',
      ],
      [
        'slFullscreenIcon',
        'directive',
        '—',
        'inside the control',
        'Marks the consumer’s own mark, projected into the icon part',
      ],
      [
        'content',
        'projected',
        'the message',
        'inside the control',
        'Words in place of the message the state picks',
      ],
    ]),
    accessibility: [
      'The control is the consumer’s native button, whose label says what the press does next, so it carries no aria-pressed: the APG Button pattern (w3.org/WAI/ARIA/apg/patterns/button/) keeps aria-pressed for a toggle whose label does not change. A screen reader hears “Full screen, button” and then “Exit full screen, button”.',
      'Escape in native full screen belongs to the browser, and the family writes no listener for it; the specification makes it leave before any close watcher. In the layout, Escape asks through the one layer stack, so a list opened inside closes first.',
      'While the region is full screen, Tab wraps inside it: what is outside is not painted, and a focus there would be invisible. On the way out, focus returns to the element that held it when it came from outside, and the page’s and the region’s scroll return to where they were.',
      'Entering is announced politely with how to leave, and leaving is announced too; the layout does not make the page inert, because an inert page would silence that announcement. The cost is that a screen reader’s virtual cursor can reach the covered page.',
    ],
    snippets: [
      defineSnippet({
        id: 'fullscreen-angular-anatomy',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<section data-ui="fullscreen" data-part="root" data-fullscreen data-mode="native">
  <div data-ui="fullscreen" data-part="content">…</div>
  <button
    data-ui="fullscreen"
    data-part="trigger"
    data-fullscreen
    data-size="md"
    data-variant="ghost"
    type="button"
  >
    <span data-part="icon" aria-hidden="true"></span>
    <span data-part="label">Exit full screen</span>
  </button>
</section>`,
      }),
      defineSnippet({
        id: 'fullscreen-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='fullscreen'] {
  --slotted-fullscreen-surface: var(--slotted-surface-sunken);
  --slotted-fullscreen-inset: var(--slotted-space-10);
  --slotted-fullscreen-trigger-radius: var(--slotted-radius-full);
}`,
      }),
    ],
  },
} as const;
