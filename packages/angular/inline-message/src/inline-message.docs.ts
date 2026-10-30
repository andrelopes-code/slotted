import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import inlineMessageTokens from '@slotted/styles/inline-message/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_INLINE_MESSAGE_TOKENS = inlineMessageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Inline Message decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideInlineMessageDefaults,\n  SlInlineMessage,\n  SlInlineMessageIcon,\n} from '@slotted/angular/inline-message';",
  selector: '[slInlineMessage]',
  exportAs: 'slInlineMessage',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element the consumer wrote — a p',
    required: true,
    purpose:
      'The message. Carries data-ui="inline-message", the three axes, data-loading, data-disabled, data-reserve, the identifier a control points at, and the live role.',
  },
  {
    part: 'prefix',
    element: 'span',
    required: false,
    purpose:
      'The severity in words — Error:, Warning:, Success: — clipped from sight and first in the DOM so a screen reader reads it before the message. Absent for the two tones that are not severities, and for a message with nothing to say.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The tone’s mark, drawn as a mask from the foundation’s status glyph set and hidden from assistive technology. Becomes a turning ring while loading, holds an element carrying slInlineMessageIcon when one is projected, and is absent when hideIcon.',
  },
  {
    part: 'text',
    element: 'span',
    required: true,
    purpose:
      'The sentence. Written by the family around the projected content, which is what makes “is there a message?” a question the stylesheet can ask and keeps a message holding a link one grid item rather than two.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The answers the message offers ([slInlineMessageActions]), after the sentence and wrapping under it. Present, the root is a div with role="group" named by the sentence, the live role moves to the sentence, and the buttons take the message size.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One message with every axis on it, driven by the controls below the canvas. Change the tone and both the mark and the word a screen reader hears change with it.',
    snippet: defineSnippet({
      id: 'inline-message-angular-playground',
      language: 'angular',
      label: 'A message under a field',
      source: '<p slInlineMessage tone="danger">Enter a valid EIN to continue.</p>',
    }),
  },
  {
    id: 'tones',
    title: 'What the message is about',
    note: 'Four severities and one absence of one. secondary is help: no mark, no severity word, and the neutral muted ink rather than a tone’s louder label colour.',
    snippet: defineSnippet({
      id: 'inline-message-angular-tones',
      language: 'angular',
      label: 'The five, and what each one says',
      source:
        '<p slInlineMessage>Between 8 and 64 characters.</p>\n<p slInlineMessage tone="success">Username available.</p>\n<p slInlineMessage tone="danger">This email is already registered.</p>',
    }),
  },
  {
    id: 'sizes',
    title: 'The step the message sits at',
    note: 'sm sits beside a compact field and md beside a large field. Both read the control scales, so switching the toolbar to dense shrinks them with the rows around them.',
    snippet: defineSnippet({
      id: 'inline-message-angular-sizes',
      language: 'angular',
      label: 'Two steps, both answering density',
      source:
        '<p slInlineMessage size="sm" tone="danger">A mensagem de um campo compacto.</p>\n<p slInlineMessage size="md" tone="danger">A mensagem de um campo grande.</p>',
    }),
  },
  {
    id: 'pending',
    title: 'A message that is still waiting',
    note: 'The mark becomes a ring turning in the same box, so the wait becomes its answer with no geometry moving. Under reduced motion the ring stops rather than slows.',
    snippet: defineSnippet({
      id: 'inline-message-angular-pending',
      language: 'angular',
      label: 'The check, and the answer it becomes',
      source:
        "<p\n  slInlineMessage\n  live=\"polite\"\n  [loading]=\"state() === 'checking'\"\n  [tone]=\"state() === 'free' ? 'success' : 'secondary'\"\n>\n  {{ state() === 'checking' ? 'Checking availability…' : 'Name available.' }}\n</p>",
    }),
  },
  {
    id: 'wiring',
    title: 'Pointing a control at the message',
    note: 'The three attributes that make an error reach a reader: aria-invalid on the control, aria-errormessage at the message’s id, and an id the family generates when the page states none.',
    snippet: defineSnippet({
      id: 'inline-message-angular-wiring',
      language: 'angular',
      label: 'exportAs hands the generated identifier back',
      source:
        '<label for="ein">EIN</label>\n<input id="ein" aria-invalid="true" [attr.aria-errormessage]="message.messageId" />\n<p slInlineMessage #message="slInlineMessage" tone="danger">Two digits are missing.</p>',
    }),
  },
  {
    id: 'live',
    title: 'What a reader hears, and when',
    note: 'off by default, because a message already on the page when it loads is announced by nothing. Press the button and the message arrives while the reader is elsewhere, which is what polite is for.',
    snippet: defineSnippet({
      id: 'inline-message-angular-live',
      language: 'angular',
      label: 'A message that arrived after the page did',
      source:
        '<!-- role="status" on the message itself, which implies aria-live and\n     aria-atomic. There are no controls inside it to keep out of the region. -->\n<p slInlineMessage live="polite" tone="success">Changes saved.</p>',
    }),
  },
  {
    id: 'reserve',
    title: 'Holding the line open',
    note: 'Both columns render the message unconditionally; only the right one has something to say. The two second fields sit at the same height, because the empty message keeps its line and draws nothing in it.',
    snippet: defineSnippet({
      id: 'inline-message-angular-reserve',
      language: 'angular',
      label: 'One line box, message or no message',
      source:
        '<!-- Rendered whether or not there is an error, so nothing below it moves. -->\n<p slInlineMessage reserve tone="danger">{{ errors().cnpj }}</p>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German compound over three lines, a container digest with no break opportunity, a sentence carrying a link, and the page’s own artwork — the mark stays on the first line in all four.',
    snippet: defineSnippet({
      id: 'inline-message-angular-content',
      language: 'angular',
      label: 'Long, unbreakable, and carrying a link',
      source:
        '<p slInlineMessage>We accept card, ACH transfer and Zelle. <a slLink href="/fees">See fees</a></p>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The token translates the severity words once, the directive sits on whatever element the page wrote, and a projected mark replaces the tone’s while keeping its box and its place.',
    snippet: defineSnippet({
      id: 'inline-message-angular-composition',
      language: 'ts',
      label: 'One decision for the application',
      source:
        "providers: [\n  provideInlineMessageDefaults({\n    prefixes: { danger: 'Error:', warning: 'Warning:' },\n  }),\n];",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears before the message',
    note: 'Turn a screen reader on and read the three rows: the severity is a word, not only a colour and a silhouette, and it is the same word wherever the message is announced.',
    snippet: defineSnippet({
      id: 'inline-message-angular-accessibility',
      language: 'angular',
      label: 'The word, and the two ways to change it',
      source:
        '<!-- Heard as “Error: Enter a valid EIN.” -->\n<p slInlineMessage tone="danger">Enter a valid EIN.</p>\n\n<!-- One message says its own word; the empty string removes it entirely. -->\n<p slInlineMessage tone="danger" prefix="Error:">Enter a valid EIN.</p>\n<p slInlineMessage tone="danger" prefix="">Error: enter a valid EIN.</p>',
    }),
  },
];

export const ANGULAR_INLINE_MESSAGE_DOCS = {
  inlineMessage: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slInlineMessage',
        'What the message is about, and therefore which mark it draws and which word a reader hears first. secondary is help: no mark, no word, and the neutral muted ink',
      ],
      [
        'size',
        "'sm' | 'md'",
        'sm',
        'slInlineMessage',
        'The type step. sm beside a compact field, md beside a large field; both read the control scales, which the theme restates per density',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'slInlineMessage',
        'Whether the message announces itself. polite writes role="status" and assertive writes role="alert", both on the host — there are no controls inside it to keep out of the region. A role the template wrote is read first and kept',
      ],
      [
        'mark',
        "'glyph' | 'dot' | 'none'",
        'glyph',
        'slInlineMessage',
        'Which mark is drawn. glyph is the tone’s own silhouette; dot is one neutral bullet in the tone’s ink, the same shape for every tone including help; none draws nothing, and the tone is said by the ink and the weight of the sentence. slField and slFieldGroup ask for none, because a silhouette under every control of a form is texture rather than a warning',
      ],
      [
        'prefix',
        'string',
        '—',
        'slInlineMessage',
        'The word read before the message. Unstated is the tone’s own; the empty string removes it, for a sentence that already names the severity',
      ],
      [
        'hideIcon',
        'boolean',
        'false',
        'slInlineMessage',
        'Draws no mark at all. The severity word stays, because it is what a reader hears rather than what a reader sees',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slInlineMessage',
        'The message is waiting for something: the mark becomes a ring turning at the same duration slButton’s does, and stopping under reduced motion',
      ],
      [
        'disabled',
        'boolean',
        '—',
        'slInlineMessage',
        'Unstated rather than false, so the field this family sits in can answer it once field ships in wave 3. Stated, it wins: the ink is muted and the ring stops',
      ],
      [
        'reserve',
        'boolean',
        'false',
        'slInlineMessage',
        'Holds one line box of the family’s own leading open whether or not there is a message, so a form rendering the message unconditionally never moves when the error arrives',
      ],
      [
        'id',
        'string',
        'generated',
        'slInlineMessage',
        'What aria-describedby or aria-errormessage points at. Read from the host attribute before the family writes its own, so a static id the template wrote survives the host binding',
      ],
    ]),
    composition: apiRows([
      [
        'slInlineMessageIcon',
        'directive',
        '—',
        'a projected element',
        'The page’s own mark, projected into the box the family draws so it keeps the size, the colour and the place on the first line the tone’s mark would have had',
      ],
      [
        'messageId',
        'string',
        'generated',
        'slInlineMessage',
        'The identifier, reachable from the template through exportAs — the reach an Angular template has and a React consumer answers with useId in their own component',
      ],
      [
        'provideInlineMessageDefaults',
        '{ tone, size, live, prefixes }',
        '—',
        'an injector',
        'Sets the three axes once, and — the one that matters — the table of severity words, merged over the shipped one so a single word can be replaced alone',
      ],
      [
        'ng-content',
        'projected content',
        '—',
        'slInlineMessage',
        'The sentence, wrapped by the family in the text part. Projecting nothing leaves that part empty, which is what reserve draws nothing in',
      ],
    ]),
    accessibility: [
      'A message about a section, a page or a command’s outcome is an alert, at reach section or page. This family is the message of one field or one control, under or beside it.',
      'There is no WAI-ARIA APG pattern for a message attached to a field. Three documents cover it between them: the APG Alert Pattern (w3.org/WAI/ARIA/apg/patterns/alert/) for the announcing behaviour, MDN’s aria-errormessage reference for the wiring, and WCAG 2.2 Understanding 3.3.1 Error Identification for the requirement that the error be identified in text.',
      'The severity is a word, not only a colour and a mark. A reader who cannot see the message hears the sentence and nothing else, so the family writes “Error:”, “Warning:” or “Success:” in clipped text before it — GOV.UK’s Error message component publishes the idea for errors, and this generalises it to every severity and to a table an application replaces once through provideInlineMessageDefaults.',
      'The live role goes on the host. slAlert puts its role on an inner part because it has a dismiss button beside its text and MDN’s alert role reference restricts the role to text content; this family owns no controls, so the element that is the text is the element that announces. live defaults to off, because a message already present when the page finishes loading is announced by nothing whatever role it carries.',
      'Wiring is the control’s job and the identifier is the family’s. MDN: set aria-invalid="true" on the control, then aria-errormessage to the id of the element holding the message. exportAs hands the template the instance so it can write [attr.aria-errormessage]="message.messageId" without inventing an id of its own.',
      'The mark is aria-hidden, because it repeats what the severity word already says. Under forced colours it keeps its silhouette in CanvasText — the circle, the diamond and the circled exclamation are what tell an error from a note when every colour has been replaced, which is WCAG 2.2 1.4.1.',
      'A disabled message is muted to a measured colour rather than faded by opacity, and its ring stops: STATE_PRECEDENCE puts disabled above loading, and a control nobody can use is not waiting for anything. Nothing is removed from the accessibility tree, because a message about a disabled field is still a message.',
      'The family never becomes a tooltip. The message is visible text in the flow of the page, which is the requirement WCAG 2.2 3.3.1 states and the one a hover-only error fails for every reader who does not hover.',
    ],
    snippets: [
      defineSnippet({
        id: 'inline-message-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<p\n  data-ui="inline-message"\n  data-part="root"\n  data-tone="danger"\n  data-size="sm"\n  data-live="polite"\n  id="ein-error"\n  role="status"\n>\n  <span data-part="prefix">Error:</span>\n  <span aria-hidden="true" data-part="icon"></span>\n  <span data-part="text">Two digits are missing.</span>\n</p>',
      }),
      defineSnippet({
        id: 'inline-message-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='inline-message'] {\n  --slotted-inline-message-column-gap: var(--slotted-space-4);\n  --slotted-inline-message-line-height: var(--slotted-line-height-sm);\n  --slotted-inline-message-icon: url('/icons/exclamation.svg');\n}",
      }),
    ],
  },
} as const;
