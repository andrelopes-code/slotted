import toastTokens from '@slotted/styles/toast/tokens.json';
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

export const ANGULAR_TOAST_TOKENS = toastTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toast decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideToastDefaults,\n  SlToastActions,\n  SlToastContent,\n  SlToastDescription,\n  SlToastItem,\n  SlToastRegion,\n  SlToastService,\n  SlToastTitle,\n} from '@slotted/angular/toast';",
  selector: 'sl-toast-region',
  exportAs: 'slToastRegion',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section',
    required: true,
    purpose:
      'The region. Carries data-ui="toast", the placement, the attachment, the stacking, role="region" and its own name. It is a landmark and never a live region: the words are spoken by the shared announcer, and this is what a reader navigates to.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose:
      'The order the messages are in, newest first. A second element because container-type on the root makes it a query container for its descendants and not for itself.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose:
      'One message. Carries the tone, the variant, data-open, data-loading, data-dragging, its own index in the pile and the duration it was given. Holds tabindex="-1" so the hotkey has somewhere to land.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The tone’s mark, drawn as a mask from the foundation’s status glyph set and hidden from assistive technology. Holds the page’s own node instead when one is passed — a spinner from progress-indicator while a promise is in flight.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'The title and the description, and the one column allowed to shrink below its content so a long string wraps instead of widening the message.',
  },
  {
    part: 'title',
    element: 'div, or the element slToastTitle is written on',
    required: false,
    purpose:
      'The message’s name. A div rather than a heading: a message that is gone in five seconds is not a section of the document, and a page that put one in its outline would be telling a reader it can be navigated back to.',
  },
  {
    part: 'description',
    element: 'p, or the element slToastDescription is written on',
    required: false,
    purpose:
      'The message. It breaks a string no language can break — a digest, a host name — rather than overflowing, and removes nothing from the DOM to do it.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The controls that act on the message, under the words rather than beside them, which is the only place they can wrap without taking the message’s own column with them. They stack when the region is narrower than 20rem.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'Puts the message away. Rendered when dismissible, named by the catalog’s close, and sized from its glyph plus a step of air, floored at the WCAG 2.2 minimum so the target holds at every density (R2).',
  },
  {
    part: 'progress',
    element: 'div',
    required: false,
    purpose:
      'How much of the duration is left. It reads the same number the timer does and the same play state, so the picture and the clock cannot disagree; under reduced motion it stops and becomes a rule under the message.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One region with every axis on it, driven by the controls below the canvas. The messages here are given no duration so the page has something to show; an application states one, or lets the default of five seconds stand.',
    snippet: defineSnippet({
      id: 'toast-angular-playground',
      language: 'ts',
      label: 'The region once, and a message from anywhere',
      source:
        "// The region once, near the root: <sl-toast-region />\n// The service from anywhere — a component, an interceptor, a resolver.\nconst toasts = inject(SlToastService);\n\ntoasts.show({\n  title: 'Draft saved',\n  description: 'Everything since 2:02 PM is saved.',\n});",
    }),
  },
  {
    id: 'tones',
    title: 'What the message is about',
    note: 'Five tones and five marks. The mark is the answer to WCAG 2.2 1.4.1: read in grayscale, or under forced colors where every ground becomes one system color, the silhouette is the only thing left to tell a failure from a note.',
    snippet: defineSnippet({
      id: 'toast-angular-tones',
      language: 'ts',
      label: 'The five, and what each one says',
      source:
        "// accent is information, secondary a neutral note, success something\n// finished, warning something that needs attention, danger something failed.\nthis.toasts.show({ title: 'Could not send', tone: 'danger' });",
    }),
  },
  {
    id: 'variants',
    title: 'How that tone is painted',
    note: 'raised is the default and the one the other message families do not have: a toast floats over content this family does not own, so the tone is in the mark and the box keeps the neutral raised surface. soft and solid are for a region inside a page’s own chrome.',
    snippet: defineSnippet({
      id: 'toast-angular-variants',
      language: 'ts',
      label: 'Three paintings of one tone',
      source:
        "this.toasts.show({ title: 'Invoice sent', tone: 'success', variant: 'raised' });\nthis.toasts.show({ title: 'Invoice sent', tone: 'success', variant: 'soft' });\nthis.toasts.show({ title: 'Sending failed', tone: 'danger', variant: 'solid' });",
    }),
  },
  {
    id: 'placement',
    title: 'Which corner the region owns',
    note: 'Six placements, all written in logical properties: bottom-end is the bottom right of this page and the bottom left of the same page in Arabic. Switch the direction in the toolbar and the region moves with the text.',
    snippet: defineSnippet({
      id: 'toast-angular-placement',
      language: 'angular',
      label: 'The edge, named the way the text runs',
      source: '<sl-toast-region placement="top-end" />',
    }),
  },
  {
    id: 'timing',
    title: 'How long a message stays',
    note: 'The bar reads the same number the timer does. Hover the region and both stop together — the clock also stops while focus is inside it and while the tab is hidden, and it resumes on what was left rather than starting again.',
    snippet: defineSnippet({
      id: 'toast-angular-timing',
      language: 'ts',
      label: 'A duration, and a message that has none',
      source:
        "this.toasts.show({ title: 'Exported', duration: 8000, progress: true });\n\n// 0 never expires. A message that must be answered rather than read is one\n// of the two cases the family gives no duration to on its own.\nthis.toasts.show({ title: 'Session expired', tone: 'danger', duration: 0 });",
    }),
  },
  {
    id: 'actions',
    title: 'A message the reader can act on',
    note: 'A message that carries an action is given no duration unless one is stated: Angular Material is the only surveyed implementation that states the rule, and a reader on their way to Undo must not watch it disappear. Press Undo and the message closes with it.',
    snippet: defineSnippet({
      id: 'toast-angular-actions',
      language: 'angular',
      label: 'Undo, and the message that waits for it',
      source:
        '<!-- The controls are a template, rendered per message, with the message\n     in its context. It is what makes the toast wait: a message that carries\n     one is given no duration unless the call states one. -->\n<ng-template #undo let-message>\n  <button slButton size="sm" (click)="restore(message.id)">Undo</button>\n</ng-template>',
    }),
  },
  {
    id: 'promise',
    title: 'A message that follows a promise',
    note: 'One message from start to finish: it begins as loading with no duration and no countdown, and the same element becomes the success or the failure. Replacing it with a second message would make a reader hear the sentence twice.',
    snippet: defineSnippet({
      id: 'toast-angular-promise',
      language: 'ts',
      label: 'Loading, then whichever way it went',
      source:
        "this.toasts.promise(this.publish(), {\n  loading: { title: 'Publishing' },\n  success: (version) => ({ title: `Version ${version} is live`, tone: 'success' }),\n  error: { title: 'Publishing failed', tone: 'danger' },\n});",
    }),
  },
  {
    id: 'queue',
    title: 'More messages than the screen',
    note: 'Past the limit a message waits, and what is already on screen stays — a reader half way through one does not lose it to something that arrived after. A waiting message has no clock at all: its duration starts when it appears.',
    snippet: defineSnippet({
      id: 'toast-angular-queue',
      language: 'angular',
      label: 'Two at a time, and the rest in line',
      source: '<sl-toast-region [limit]="2" />',
    }),
  },
  {
    id: 'stacking',
    title: 'A pile that opens',
    note: 'Four messages at full height fill a phone. stack puts them one behind another at the edge the placement names and opens the pile when the pointer is over it or the keyboard is inside — the same two conditions that stop the clock, because both mean the reader is reading.',
    snippet: defineSnippet({
      id: 'toast-angular-stacking',
      language: 'angular',
      label: 'The pile, and what opens it',
      source: '<sl-toast-region stacking="stack" />',
    }),
  },
  {
    id: 'dismissal',
    title: 'The ways a message leaves',
    note: 'Four, and each carries its own reason: the close control says dismiss, Escape inside the message says escape, a swipe toward the edge says pointer, and the timer says timeout. A page that has to tell them apart reads the reason rather than guessing.',
    snippet: defineSnippet({
      id: 'toast-angular-dismissal',
      language: 'angular',
      label: 'Every departure, and the word for it',
      source:
        '<sl-toast-region (toastsChange)="onToastsChange($event)" />\n\n<!-- onToastsChange(request: ChangeRequest<readonly ToastMessage[]>) {\n       if (request.reason === \'timeout\') return;\n       this.remember(request.reason);\n     } -->',
    }),
  },
  {
    id: 'keyboard',
    title: 'Reaching the messages from the keyboard',
    note: 'A message arriving never moves focus — the APG’s Alert pattern is explicit about it. F6 is what the reader presses to get there, Tab walks the controls, and Escape closes the message and hands the keyboard back to where it came from.',
    snippet: defineSnippet({
      id: 'toast-angular-keyboard',
      language: 'angular',
      label: 'The one key, and how to change it',
      source: '<sl-toast-region hotkey="Alt+T" />',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A digest no language can break, a title that doubled in translation, and a message with no mark at all. Nothing is removed from the document to make any of them fit: the whole string stays selectable and findable by a page search.',
    snippet: defineSnippet({
      id: 'toast-angular-content',
      language: 'ts',
      label: 'A string that has to wrap somewhere',
      source:
        "this.toasts.show({\n  title: 'Deployment rejected',\n  description: digest,\n  tone: 'danger',\n  duration: 0,\n});",
    }),
  },
  {
    id: 'composition',
    title: 'A message a page draws itself',
    note: 'The region hands each message to a function and keeps everything that is behavior: the clock, the exit, the swipe, the keyboard and the announcement. What the page writes is the body, and it can be anything at all.',
    snippet: defineSnippet({
      id: 'toast-angular-composition',
      language: 'angular',
      label: 'The family’s behavior, the page’s markup',
      source:
        '<!-- The body is an ng-template carried by the message, rendered per\n     message and lazily, with the message in its context. -->\n<ng-template #body let-message>\n  <div slToastContent>\n    <div slToastTitle>{{ message.data.title }}</div>\n  </div>\n</ng-template>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onToastsChange',
    payload: '(toasts, request)',
    when: 'Asks to change the queue. The first argument is the queue as it will be; the request carries the value it replaces, the reason — programmatic, dismiss, escape, keyboard, pointer, timeout or clear — the originating event, and cancel(). Calling cancel() refuses the change and nothing moves.',
  },
  {
    name: 'onStatusChange',
    payload: '(status, message)',
    when: 'Per message, passed to the call that showed it. Reports visible when it reaches the screen, closing when it has left the queue and is still leaving the document, and removed once it is gone.',
  },
];

export const ANGULAR_TOAST_DOCS = {
  toast: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'placement',
        "'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end'",
        'bottom-end',
        'sl-toast-region',
        'Which edge the region sits at, named logically so a right-to-left document mirrors it',
      ],
      [
        'attach',
        "'portal' | 'viewport' | 'inline'",
        'portal',
        'sl-toast-region',
        'Where the region is rendered: at the end of the document carrying the theme it came from, fixed where it was written, or absolute against the nearest positioned ancestor',
      ],
      [
        'stacking',
        "'list' | 'stack'",
        'list',
        'sl-toast-region',
        'A column of messages at their own height, or a pile that opens when the pointer is over it or the keyboard inside it',
      ],
      [
        'limit',
        'number',
        '3',
        'sl-toast-region',
        'How many messages are on screen at once. What arrives past it waits, and what is already there stays',
      ],
      [
        'duration',
        'number',
        '5000',
        'sl-toast-region, show()',
        'Milliseconds on screen, counted from the moment a message becomes visible. 0 never expires',
      ],
      [
        'swipe',
        'boolean',
        'true',
        'sl-toast-region',
        'Lets a message be dragged toward the edge the placement names. A drag that starts on a control never becomes a swipe',
      ],
      [
        'pauseOnHover',
        'boolean',
        'true',
        'sl-toast-region',
        'The pointer over the region holds every clock. Focus inside it holds them too, and that one is not an axis: switching it off would expire the message under the keyboard using it',
      ],
      [
        'pauseWhenHidden',
        'boolean',
        'true',
        'sl-toast-region',
        'A hidden tab holds every clock. A five-second message shown to a tab nobody is looking at was never shown',
      ],
      [
        'hotkey',
        'string',
        'F6',
        'sl-toast-region',
        'The key that moves focus into the region, written the way a reader says it — F6, Alt+T, Shift+F8',
      ],
      [
        'messages',
        'Partial<ToastMessages>',
        '—',
        'sl-toast-region',
        'Words laid over the language in force, key by key: the name a reader finds the region by in their landmark list, and what the hotkey lands in (label), and what each close control announces (close)',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'SlToastService.show',
        'Which of the five semantic colors the message speaks in, and which mark it draws',
      ],
      [
        'variant',
        "'raised' | 'soft' | 'solid'",
        'raised',
        'SlToastService.show',
        'How that color is painted. raised keeps the neutral surface and puts the tone in the mark, which is what a box floating over unknown content should do',
      ],
      [
        'priority',
        "'polite' | 'assertive'",
        'polite',
        'SlToastService.show',
        'How loudly the announcer says it. Never inferred from the tone: a danger message a background job produced must not cut into a sentence',
      ],
      [
        'dismissible',
        'boolean',
        'true',
        'SlToastService.show',
        'Renders the control that closes the message. A touch reader has no Escape key, so the pointer needs a target',
      ],
      [
        'progress',
        'boolean',
        'false',
        'SlToastService.show',
        'Draws how much of the duration is left. It is off by default because a message with no duration has nothing to draw',
      ],
      [
        'toasts',
        'readonly ToastMessage[]',
        '—',
        'sl-toast-region',
        'The queue the page owns. Passing it puts the region in controlled mode for good, and the family then only asks',
      ],
      [
        'defaultToasts',
        'readonly ToastMessage[]',
        '—',
        'sl-toast-region',
        'The queue an uncontrolled region starts from, read once. A later change to it is not silently adopted',
      ],
      [
        'title',
        'string',
        '—',
        'SlToastService.show',
        'The message’s name. A string here is also what the announcer says, unless announcement states otherwise',
      ],
      [
        'description',
        'string',
        '—',
        'SlToastService.show',
        'The message. Joined to the title for the announcement when both are strings',
      ],
      [
        'announcement',
        'string',
        '—',
        'SlToastService.show',
        'What a reader hears. State it when the body is a component of the page’s own: a rendered node cannot be read from the store, so a message that says nothing here is shown and not spoken',
      ],
      [
        'loading',
        'boolean',
        'false',
        'SlToastService.show',
        'Waiting on a promise. It draws no countdown and is given no duration, and the mark slot holds whatever the page put there',
      ],
      [
        'body',
        'TemplateRef<{ $implicit: ToastMessage }>',
        '—',
        'SlToastService.show',
        'Replaces the message’s whole body, keeping the box, the tone, the clock and the keyboard. Rendered through NgTemplateOutlet, so it is lazy and the message is in its context',
      ],
      [
        'hideIcon',
        'boolean',
        'false',
        'SlToastService.show',
        'Draws no mark at all. The words then start at the box’s own inset rather than one gap further in',
      ],
      [
        'actions',
        'TemplateRef<{ $implicit: ToastMessage }>',
        '—',
        'SlToastService.show',
        'The page’s own controls, under the words. A message that has them is given no duration unless one is stated',
      ],
      [
        'id',
        'string',
        '—',
        'SlToastService.show',
        'Showing a message whose id is already in the queue updates that message in place rather than adding a second one',
      ],
      [
        'container',
        'Element | null',
        '—',
        'sl-toast-region',
        'The element a portalled region is placed inside, for an application shell that owns its own stacking context',
      ],
    ]),
    composition: apiRows([
      [
        'body',
        'ng-template',
        '—',
        'SlToastService.show',
        'The message a page draws itself. The clock, the exit, the swipe, the keyboard and the announcement stay the family’s; NgTemplateOutlet renders the template per message and only when the message exists',
      ],
      [
        'slToastItem',
        'directive on an li',
        '—',
        'a page’s own list',
        'Everything about a message that is behavior rather than markup. A page that renders SlToastService.visible() itself puts this on its own li and keeps the timer, the exit, the swipe and Escape',
      ],
      [
        'SlToastService',
        'providedIn: root',
        '—',
        'anywhere',
        'show, update, dismiss, clear, pauseAll, resumeAll and promise, plus visible, queued and paused as signals. It is where Angular Material’s consumers already reach, and it is injectable from an interceptor or a resolver',
      ],
      [
        'provideToastDefaults',
        '(defaults) => Provider',
        '—',
        'an application or a route',
        'Sets every axis once for every region and message under it; an explicit value on one message still wins. A component-level provider gives one subtree a queue of its own',
      ],
      [
        'exportAs',
        "'slToastRegion'",
        '—',
        'a template',
        'Reaches the region instance: visible(), queued(), paused() and focus(), which sends the keyboard to the newest message',
      ],
      [
        'slToastTitle, slToastDescription, slToastActions, slToastClose, slToastIcon, slToastProgress',
        'directives',
        '—',
        'a page’s own body',
        'The part names, and nothing else. The geometry, the tone and the states belong to the item and the region, so a directive that repeated any of them would be a second place to change them',
      ],
    ]),
    accessibility: [
      'There is no toast pattern in the WAI-ARIA Authoring Practices. The closest official guidance is the Alert Pattern (w3.org/WAI/ARIA/apg/patterns/alert/), and this family departs from it twice, both times on purpose. The visible message carries no live role, and the family binds keys the pattern says it should not — because the pattern’s table is empty for a message that holds no controls, and every toast worth shipping holds at least a Close.',
      'The region is a landmark and the announcement is made elsewhere. A live role on a box holding a Close and an Undo is read with both buttons inside the sentence, and a live region created in the same task as its text is silent under ARIA 1.2 §6.4 — which is exactly what a message that has just been added is. packages/core/src/live-announcer builds its regions before any message exists, deduplicates, and spaces two announcements so the second is not lost.',
      'A message that renders content of its own announces the string passed as announcement, and nothing at all when none is passed. A rendered node cannot be read out of the store, and guessing at it would announce markup.',
      'The pattern’s one prose rule is kept without exception: a message arriving never moves focus. The reader moves it, with F6, and Shift+F6 is their browser’s own landmark navigation. Escape closes the message the keyboard is inside and hands it back to where it came from.',
      'When the message holding focus is taken away — by its own control, or by the page’s state — focus goes to the next message, then to the element it came from. Only React Aria answers this at all, and only for its own close button; here it is `packages/core/src/focus/removal-focus`, which both bindings compose.',
      'WCAG 2.2 SC 2.2.1 is the criterion a timer answers, and the family takes the first of the criterion’s six ways out: the limit can be turned off before a reader meets it, by setting duration to 0 on ToastDefaultsProvider for the whole application. Putting that switch in front of the reader is the application’s work, not the family’s.',
      'A message that carries an action is given no duration unless one is stated, and a message waiting on a promise is given none either. Angular Material states the first rule and is alone in it; five surveyed implementations ship the action and the timer and leave the combination to the consumer.',
      'Every tone with a severity carries a mark as well as a color, and secondary carries none: a neutral note has no severity to state. Under forced colors the five grounds become one system color, so the mark, and its absence on a note, is the only thing distinguishing a failure from a note — WCAG 2.2 1.4.1.',
      'The region takes no pointer events and each message takes its own, so a region pinned over a page never eats a press meant for the page. Every surveyed implementation does this and none of them says so, which is how a consumer finds a dead corner in their own application.',
    ],
    snippets: [
      defineSnippet({
        id: 'toast-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<section\n  aria-label="Notifications"\n  data-ui="toast"\n  data-part="root"\n  data-placement="bottom-end"\n  data-attach="portal"\n  data-stacking="list"\n  data-swipe="true"\n  tabindex="-1"\n>\n  <ol data-part="list">\n    <li data-part="item" data-tone="success" data-variant="raised" data-open="" tabindex="-1">\n      <span aria-hidden="true" data-part="icon"></span>\n      <div data-part="content">\n        <div data-part="title">Invoice sent</div>\n        <p data-part="description">A copy went to finance.</p>\n      </div>\n      <button aria-label="Close" data-part="close" type="button"></button>\n      <div data-part="actions">…</div>\n      <div aria-hidden="true" data-part="progress"></div>\n    </li>\n  </ol>\n</section>',
      }),
      defineSnippet({
        id: 'toast-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='toast'] {\n  --slotted-toast-measure: 22rem;\n  --slotted-toast-offset: var(--slotted-space-7);\n  --slotted-toast-gap: var(--slotted-space-6);\n}",
      }),
    ],
  },
} as const;
