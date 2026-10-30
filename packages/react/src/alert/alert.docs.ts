import alertTokens from '@slotted/styles/alert/tokens.json';
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

export const REACT_ALERT_TOKENS = alertTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Alert decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Alert,\n  AlertActions,\n  AlertContent,\n  AlertDefaultsProvider,\n  AlertDescription,\n  AlertTitle,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section',
    required: true,
    purpose:
      'The box. Carries data-ui="alert", the four axes, data-open, hidden when closed, and tabindex="-1". A section named by its own title is a region landmark; unnamed it is a plain grouping element.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The tone’s mark, drawn as a mask from the foundation’s status glyph set and hidden from assistive technology. Absent when hideIcon; holds the page’s own artwork when icon is passed.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The title and the description, and nothing else. This is the live region: role="status" or role="alert" is written here, so the controls beside it are outside what a reader hears.',
  },
  {
    part: 'title',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The message’s name, and the box’s: the root points aria-labelledby at it. A div by default, because a heading belongs in the document outline and only the page knows whether this message does.',
  },
  {
    part: 'description',
    element: 'p, or the element render returns',
    required: false,
    purpose:
      'The message. It breaks a string no language can break — a digest, a host name — rather than overflowing, and removes nothing from the DOM to do it.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The controls that act on the message, outside the live region. They stack at a narrow container width, and rejoin the message’s own line on a page banner past 40rem.',
  },
  {
    part: 'dismiss',
    element: 'button',
    required: false,
    purpose:
      'Closes the message. Rendered when dismissible, named by the catalog’s dismiss, and sized from its glyph plus a step of air, floored at the WCAG 2.2 minimum so the target holds at every density (R2).',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One message with every axis on it, driven by the controls below the canvas. Change the tone and the mark changes with it, which is what makes the five distinguishable in grayscale.',
    snippet: defineSnippet({
      id: 'alert-react-playground',
      language: 'tsx',
      label: 'A message with a name and a body',
      source:
        '<Alert tone="warning">\n  <AlertContent>\n    <AlertTitle>Your subscription expires in three days</AlertTitle>\n    <AlertDescription>Renew to keep access for your team.</AlertDescription>\n  </AlertContent>\n</Alert>;',
    }),
  },
  {
    id: 'tones',
    title: 'What the message is about',
    note: 'Five tones and five marks. The mark is the answer to WCAG 2.2 1.4.1: read in grayscale, or under forced colors where every ground becomes one system color, the silhouette is the only thing left.',
    snippet: defineSnippet({
      id: 'alert-react-tones',
      language: 'tsx',
      label: 'The five, and what each one says',
      source:
        '// accent is information, secondary a neutral note, success something\n// finished, warning something that needs attention, danger something failed.\n<Alert tone="danger">\n  <AlertContent>\n    <AlertTitle>Could not save</AlertTitle>\n  </AlertContent>\n</Alert>;',
    }),
  },
  {
    id: 'variants',
    title: 'How that tone is painted',
    note: 'soft and solid bring a ground with them and survive any surface; outline takes the one underneath, so it reads on the page’s own surfaces and goes quiet on a ground the theme never measured its ink against.',
    snippet: defineSnippet({
      id: 'alert-react-variants',
      language: 'tsx',
      label: 'The three paintings',
      source:
        '<Alert variant="soft" />;\n<Alert variant="outline" />;\n<Alert variant="solid" />;\n\n// A dark region is a scheme rather than a surface.\n<div data-slotted-scheme="dark">\n  <Alert variant="outline" />\n</div>;',
    }),
  },
  {
    id: 'reach',
    title: 'How far the message reaches',
    note: 'The guide’s three recipes as one axis: inline beside the thing it is about, section inside a page section, page across an application. A page banner loses its corners because it runs to both edges.',
    snippet: defineSnippet({
      id: 'alert-react-reach',
      language: 'tsx',
      label: 'The same message at three scopes',
      source:
        '<Alert reach="inline" tone="danger">\n  <AlertContent>\n    <AlertDescription>Enter a valid EIN.</AlertDescription>\n  </AlertContent>\n</Alert>;\n\n<Alert reach="page" tone="warning" />;',
    }),
  },
  {
    id: 'dismissal',
    title: 'Putting the message away',
    note: 'The left one owns its own openness and needs no state at all; the right one hands it to the application, which can refuse the request. Watch where the keyboard lands after either of them closes.',
    snippet: defineSnippet({
      id: 'alert-react-dismissal',
      language: 'tsx',
      label: 'Uncontrolled, controlled, and refused',
      source:
        '<Alert dismissible />;\n\n<Alert dismissible onOpenChange={setOpen} open={open} />;\n\n<Alert\n  dismissible\n  onOpenChange={(next, request) => {\n    if (!confirmed) request.cancel();\n  }}\n/>;',
    }),
  },
  {
    id: 'actions',
    title: 'What the message asks for',
    note: 'The controls are the consumer’s own Buttons, in a part outside the live region — a reader hearing the message is not read two button labels in the middle of it. They stack when the box is narrow. actionsPlacement="end" puts them at the end of the message’s own line once the box is 40rem wide, which a page banner does by default. Each Button in the part takes the alert’s tone and the sm size; a Button that states its own tone or size keeps it. The first action is solid and every other one ghost; outline draws no fill over the alert’s ground and is not used here.',
    snippet: defineSnippet({
      id: 'alert-react-actions',
      language: 'tsx',
      label: 'A message with something to do about it',
      source:
        '<Alert tone="warning">\n  <AlertContent>\n    <AlertTitle>Your subscription expires in three days</AlertTitle>\n  </AlertContent>\n  <AlertActions>\n    <Button>Renew</Button>\n    <Button variant="ghost">View plans</Button>\n  </AlertActions>\n</Alert>;\n\n<Alert actionsPlacement="end">\n  <AlertContent>\n    <AlertDescription>The suggestion changes three lines of the plan.</AlertDescription>\n  </AlertContent>\n  <AlertActions>\n    <Button>Apply</Button>\n  </AlertActions>\n</Alert>;',
    }),
  },
  {
    id: 'live',
    title: 'What a reader hears, and when',
    note: 'off by default, because the APG records that alerts already on the page when it loads are not announced at all. Press the button and the message arrives while the reader is elsewhere, which is what polite and assertive are for.',
    snippet: defineSnippet({
      id: 'alert-react-live',
      language: 'tsx',
      label: 'A message that arrives after the page did',
      source:
        '// role="status" on the text, which implies aria-live and aria-atomic.\n<Alert live="polite" tone="success" />;\n\n// role="alert": a failed save, a lost connection, an expiring session.\n<Alert live="assertive" tone="danger" />;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German compound that wraps, a container digest with no break opportunity, a message with no mark, and a title standing alone — all in a column narrow enough to make each of them a problem.',
    snippet: defineSnippet({
      id: 'alert-react-content',
      language: 'tsx',
      label: 'Long, unbreakable, bare and title-only',
      source:
        '<Alert hideIcon>\n  <AlertContent>\n    <AlertTitle>O deploy falhou</AlertTitle>\n    <AlertDescription>{digest}</AlertDescription>\n  </AlertContent>\n</Alert>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider sets the defaults once, render substitutes the element of any part, icon replaces the mark, and ref reaches the section so a page that must move focus to the message can.',
    snippet: defineSnippet({
      id: 'alert-react-composition',
      language: 'tsx',
      label: 'One decision for the application, and three for one message',
      source:
        '<AlertDefaultsProvider reach="page">\n  <App />\n</AlertDefaultsProvider>;\n\n<Alert icon={<ShieldIcon />} render={(props) => <aside {...props} />}>\n  <AlertContent>\n    <AlertTitle render={(props) => <h3 {...props} />}>Maintenance</AlertTitle>\n  </AlertContent>\n</Alert>;',
    }),
  },
  {
    id: 'accessibility',
    title: 'The landmark, the region and the keyboard',
    note: 'Tab into the message and out of it: the box is a region a reader can jump to, the text is the only thing that announces, and closing the message puts the keyboard back where it came from.',
    snippet: defineSnippet({
      id: 'alert-react-accessibility',
      language: 'tsx',
      label: 'What each of these produces in the tree',
      source:
        '// A region landmark named "Maintenance", holding a polite status region.\n<Alert live="polite">\n  <AlertContent>\n    <AlertTitle>Maintenance</AlertTitle>\n  </AlertContent>\n</Alert>;\n\n// No title: a plain grouping element, and no landmark to jump to.\n<Alert>\n  <AlertContent>Done.</AlertContent>\n</Alert>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: 'open: boolean, request: ChangeRequest<boolean>',
    when: 'The dismiss control is activated. request.reason is dismiss, request.source is the click event, and request.cancel() refuses the change — the message stays open and the keyboard stays where it is. Nothing is emitted when the consumer moves open themselves.',
  },
];

export const REACT_ALERT_DOCS = {
  alert: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'Alert',
        'Which of the five semantic colors the message speaks in, and which mark it draws: status-info, none for secondary, status-success, status-warning, status-danger',
      ],
      [
        'variant',
        "'soft' | 'outline' | 'solid'",
        'soft',
        'Alert',
        'How that color is painted. soft carries the tone’s surface and its border, outline the border alone, solid the tone’s fill and the ink the theme measures against it',
      ],
      [
        'reach',
        "'inline' | 'section' | 'page'",
        'section',
        'Alert',
        'The scope the message applies to. inline is tightest and sits beside a field group; page loses its corners and its inline edges because it runs to both edges of what holds it',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'Alert',
        'Whether the text announces itself. polite writes role="status" on the content part and assertive writes role="alert"; both imply aria-live and aria-atomic, and neither is written on the box',
      ],
      [
        'actionsPlacement',
        "'below' | 'end'",
        "end for reach='page', below otherwise",
        'Alert',
        'Where the actions stand. below puts them on a row under the words; end puts them at the end of the words’ line, before the dismiss control, once the box is 40rem wide, and under the words below that width',
      ],
      [
        'hideIcon',
        'boolean',
        'false',
        'Alert',
        'Draws no mark at all, for a callout that carries its own artwork in the body',
      ],
      [
        'icon',
        'ReactNode',
        '—',
        'Alert',
        'Replaces the tone’s mark, keeping the box, the size and the place on the message’s first line. Angular projects an element carrying slAlertIcon instead',
      ],
      [
        'dismissible',
        'boolean',
        'false',
        'Alert',
        'Renders the control that closes the message. A critical banner should not have one: the guide’s rule is that it does not go away on its own',
      ],
      [
        'messages',
        'Partial<AlertMessages>',
        '—',
        'Alert',
        'Words laid over the language in force, key by key: what that control announces (dismiss)',
      ],
      [
        'open',
        'boolean',
        '—',
        'Alert',
        'The openness the consumer owns. Passing it puts the alert in controlled mode for good, and the family then only asks',
      ],
      [
        'defaultOpen',
        'boolean',
        'true',
        'Alert',
        'The openness an uncontrolled alert starts from, read once. A later change to it is not silently adopted',
      ],
      [
        'restoreFocus',
        'boolean',
        'true',
        'Alert',
        'Returns the keyboard to the element it came from when the message closes with focus inside it. Nothing moves when focus was never there',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Alert, AlertContent, AlertTitle, AlertDescription, AlertActions',
        'Substitutes the rendered element of a part, and hands it every data attribute. A title rendered as a heading is how a page puts the message in its outline',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'Alert',
        'Reaches the section, which carries tabindex="-1" so focus() works. There is no imperative handle beyond it: the family never moves focus on its own, because the APG says an alert must not',
      ],
      [
        'AlertDefaultsProvider',
        '{ tone, variant, reach, live }',
        '—',
        'a subtree',
        'Sets all four once for every alert under it; an explicit prop on one message still wins',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'AlertContent',
        'The title and the description. Anything else placed here joins the live region, which is why the actions are a part of their own',
      ],
    ]),
    accessibility: [
      'The applicable pattern is the WAI-ARIA APG Alert Pattern (w3.org/WAI/ARIA/apg/patterns/alert/). It declares one role and no keyboard interaction: an alert is not a widget, so it holds no keys. Its two prose requirements — that an alert must not affect keyboard focus, and must not disappear on its own — are what this family declines automatic focus and automatic dismissal for.',
      'The box is a landmark, not a live region. MDN’s alert role reference states that the role “should only be used for text content, not interactive elements such as links or buttons”, and every alert worth shipping has a dismiss control. The root renders a section named by its own title through aria-labelledby, and the region that announces is the content part, which holds the title and the description alone.',
      'live defaults to off because the APG records that “screen readers do not inform users of alerts that are present on the page before page load completes”. An alert already on the page announces nothing whatever role it carries; polite and assertive are for a message that arrives while the reader is working, and both are written as a role that already implies aria-live and aria-atomic.',
      'Every tone with a severity carries a mark as well as a color, and secondary carries none: a neutral note has no severity to state. Under forced colors the five grounds become one system color and the five borders one more, so the mark, and its absence on a note, is the only thing distinguishing an error from a note — WCAG 2.2 1.4.1.',
      'The dismiss control is a real button with a real name and an inner control rather than a Button (R2): its box is the glyph plus a step of air on each side, floored at --slotted-target-min, which is the WCAG 2.2 2.5.8 minimum of 24 CSS pixels; at rest it has no frame and no ground, and hover moves only the ground.',
      'When the message closes with focus inside it, the keyboard goes back to the element it came from. None of the ten surveyed implementations answers this, and the failure it prevents is the one a real product hits first: the dismiss control is destroyed, focus falls to the document body, and the next Tab starts again at the top of the page.',
      'Closing hides rather than unmounts, so the live region is still in the document if the message comes back and data-open is a state a consumer can style. An application that must not pay for the hidden subtree renders the alert conditionally and never passes defaultOpen.',
      'Escape does not close the message. An alert is not a dismissable layer, and one inside a dialog would swallow the dialog’s own Escape; a message that must interrupt the reader is an alert dialog rather than an alert.',
    ],
    snippets: [
      defineSnippet({
        id: 'alert-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<section\n  aria-labelledby="r1title"\n  data-ui="alert"\n  data-part="root"\n  data-tone="warning"\n  data-variant="soft"\n  data-reach="section"\n  data-live="polite"\n  data-open=""\n  tabIndex={-1}\n>\n  <span aria-hidden="true" data-part="icon" />\n  <div data-part="content" role="status">\n    <div data-part="title" id="r1title">\n      Your subscription expires in three days\n    </div>\n    <p data-part="description">Renew to keep access.</p>\n  </div>\n  <div data-part="actions">…</div>\n  <button aria-label="Dismiss" data-part="dismiss" type="button" />\n</section>;',
      }),
      defineSnippet({
        id: 'alert-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='alert'] {\n  --slotted-alert-radius: var(--slotted-radius-lg);\n  --slotted-alert-padding-block: var(--slotted-space-6);\n  --slotted-alert-state-layer-hover: 12%;\n  --slotted-alert-icon: url('/icons/megaphone.svg');\n}",
      }),
    ],
  },
} as const;
