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
      'The region. It is a landmark with a name, and it carries the placement, the attachment and the stacking. It is never a live region.',
  },
  {
    part: 'list',
    element: 'ol',
    required: true,
    purpose: 'The messages in order, newest first.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose:
      'One message. It carries the tone, the variant and its states, and the hotkey moves focus to it.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The mark of the tone, hidden from assistive technology. While the message is loading it holds a loader.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose: 'The title and the description. A long string wraps inside it.',
  },
  {
    part: 'title',
    element: 'div, or the element slToastTitle is written on',
    required: false,
    purpose:
      'The name of the message. It is not a heading, because a message is not a section of the page.',
  },
  {
    part: 'description',
    element: 'p, or the element slToastDescription is written on',
    required: false,
    purpose: 'The text of the message. A string without spaces breaks instead of overflowing.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The controls that act on the message, under its text. They stack when the region is narrower than 20rem.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The button that dismisses the message. It is present while the message is dismissible, and its target holds the minimum pointer size at every density.',
  },
  {
    part: 'progress',
    element: 'div',
    required: false,
    purpose:
      'How much of the duration is left. It stops with the timer, and under reduced motion it is a static rule.',
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
    when: 'Before the queue changes. The request carries the previous queue, the reason (programmatic, dismiss, escape, keyboard, pointer, timeout or clear), the originating event and cancel().',
  },
  {
    name: 'onStatusChange',
    payload: '(status, message)',
    when: 'When a message appears (visible), leaves the queue (closing) and leaves the document (removed). It is passed to the call that shows the message.',
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
        'The edge the region sits at. The names are logical, so a right-to-left document mirrors them.',
      ],
      [
        'attach',
        "'portal' | 'viewport' | 'inline'",
        'portal',
        'sl-toast-region',
        'Where the region is rendered. portal places it at the end of the document with the theme it came from, viewport fixes it where it is written, and inline positions it in the nearest positioned ancestor.',
      ],
      [
        'stacking',
        "'list' | 'stack'",
        'list',
        'sl-toast-region',
        'How the messages are arranged. list is a column at their own height; stack is a pile that opens while the pointer is over it or focus is inside it.',
      ],
      [
        'limit',
        'number',
        '3',
        'sl-toast-region',
        'How many messages are on screen at once. The rest wait, and a waiting message has no timer.',
      ],
      [
        'duration',
        'number',
        '5000',
        'sl-toast-region, show()',
        'The milliseconds a message stays on screen, counted from the moment it appears. 0 never expires.',
      ],
      [
        'swipe',
        'boolean',
        'true',
        'sl-toast-region',
        'Whether a message can be dragged toward the edge of the placement to dismiss it. A drag that starts on a control is not a swipe.',
      ],
      [
        'pauseOnHover',
        'boolean',
        'true',
        'sl-toast-region',
        'Whether the timers stop while the pointer is over the region. Focus inside the region always stops them.',
      ],
      [
        'pauseWhenHidden',
        'boolean',
        'true',
        'sl-toast-region',
        'Whether the timers stop while the tab is hidden.',
      ],
      [
        'hotkey',
        'string',
        'F6',
        'sl-toast-region',
        'The key that moves focus into the region, such as F6, Alt+T or Shift+F8.',
      ],
      [
        'messages',
        'Partial<ToastMessages>',
        '—',
        'sl-toast-region',
        'The words of the region over the ones of the language in force: label names the region and close names each close button.',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'SlToastService.show',
        'The color and the mark of the message. secondary draws no mark.',
      ],
      [
        'variant',
        "'raised' | 'soft' | 'solid'",
        'raised',
        'SlToastService.show',
        'How the tone is painted. raised keeps the neutral surface and puts the tone in the mark, soft tints the surface, and solid fills it.',
      ],
      [
        'priority',
        "'polite' | 'assertive'",
        'polite',
        'SlToastService.show',
        'How the message is announced. assertive interrupts the screen reader. It does not follow the tone.',
      ],
      [
        'dismissible',
        'boolean',
        'true',
        'SlToastService.show',
        'Whether the message has a close button.',
      ],
      [
        'progress',
        'boolean',
        'false',
        'SlToastService.show',
        'Whether the message draws how much of its duration is left.',
      ],
      [
        'toasts',
        'readonly ToastMessage[]',
        '—',
        'sl-toast-region',
        'The queue you own. A region that receives it is controlled for its whole life and only asks for changes.',
      ],
      [
        'defaultToasts',
        'readonly ToastMessage[]',
        '—',
        'sl-toast-region',
        'The messages the queue starts with, read once.',
      ],
      [
        'title',
        'string',
        '—',
        'SlToastService.show',
        'The name of the message. With the description, it is what is announced.',
      ],
      ['description', 'string', '—', 'SlToastService.show', 'The text under the title.'],
      [
        'announcement',
        'string',
        '—',
        'SlToastService.show',
        'What is announced instead of the title and the description. State it for a message whose content is not a string.',
      ],
      [
        'loading',
        'boolean',
        'false',
        'SlToastService.show',
        'Whether the message waits for work to end. It draws a loader in place of the mark and never expires.',
      ],
      [
        'body',
        'TemplateRef<{ $implicit: ToastMessage }>',
        '—',
        'SlToastService.show',
        'The template that replaces the whole body of the message. The box, the timer and the keyboard stay.',
      ],
      ['hideIcon', 'boolean', 'false', 'SlToastService.show', 'Whether the mark is left out.'],
      [
        'actions',
        'TemplateRef<{ $implicit: ToastMessage }>',
        '—',
        'SlToastService.show',
        'The controls under the text. A message with actions never expires unless it states a duration.',
      ],
      [
        'id',
        'string',
        '—',
        'SlToastService.show',
        'The identifier of the message. Showing an id that is already in the queue updates that message in place.',
      ],
      [
        'container',
        'Element | null',
        '—',
        'sl-toast-region',
        'The element a portalled region is placed in.',
      ],
    ]),
    composition: apiRows([
      [
        'body',
        'ng-template',
        '—',
        'SlToastService.show',
        'The template of a message. It is rendered per message, with the message in its context.',
      ],
      [
        'slToastItem',
        'directive on an li',
        '—',
        'a page’s own list',
        'The behavior of one message on an li of your own list: the timer, the exit, the swipe and Escape.',
      ],
      [
        'SlToastService',
        'providedIn: root',
        '—',
        'anywhere',
        'The shared queue: show, update, dismiss, clear, pauseAll, resumeAll and promise, with visible, queued and paused as signals. A component that provides it has a queue of its own.',
      ],
      [
        'provideToastDefaults',
        '(defaults) => Provider',
        '—',
        'an application or a route',
        'Sets the axes once for every region and message under the injector. A value on a region or a message still wins.',
      ],
      [
        'exportAs',
        "'slToastRegion'",
        '—',
        'a template',
        'Reaches visible(), queued(), paused() and focus() from a template reference.',
      ],
      [
        'slToastTitle, slToastDescription, slToastActions, slToastClose, slToastIcon, slToastProgress',
        'directives',
        '—',
        'a page’s own body',
        'The parts of a body you write. Each writes its part name, and the item and the region style it.',
      ],
    ]),
    accessibility: [
      'The region is a landmark with the name Notifications in English. The words of a message are announced by a live region that exists before any message does, so the buttons of a message are not read inside its sentence.',
      'A message is announced as its title and its description. A message whose content is not a string announces the string in announcement, and nothing without one.',
      'A message that arrives never moves focus. The hotkey, F6 by default, moves focus to the newest message, and Escape dismisses the message focus is in.',
      'When the message that holds focus leaves, focus moves to the next message, and after the last one to the element it came from.',
      'The timers stop while the pointer is over the region, while focus is inside it and while the tab is hidden, and go on with the time that was left.',
      'A duration of 0 in the defaults turns every time limit off, which WCAG 2.2 SC 2.2.1 asks an application to offer. The setting that does so is yours.',
      'A message with actions, and one that is loading, never expires unless it states a duration.',
      'Every tone with a severity has a mark of its own shape, so the tone is not told by color alone. secondary has none.',
      'The region lets pointer events through, and each message takes its own.',
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
