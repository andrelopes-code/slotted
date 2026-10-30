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

export const REACT_INLINE_MESSAGE_TOKENS = inlineMessageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Inline Message decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  InlineMessage,\n  InlineMessageActions,\n  InlineMessageDefaultsProvider,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'p, or the element render returns',
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
      'The tone’s mark, drawn as a mask from the foundation’s status glyph set and hidden from assistive technology. Becomes a turning ring while loading, holds the page’s own artwork when icon is passed, and is absent when hideIcon.',
  },
  {
    part: 'text',
    element: 'span',
    required: true,
    purpose:
      'The sentence. Written by the family around children, which is what makes “is there a message?” a question the stylesheet can ask and keeps a message holding a link one grid item rather than two.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The answers the message offers (InlineMessageActions), after the sentence and wrapping under it. Present, the root is a div with role="group" named by the sentence, the live role moves to the sentence, and the buttons take the message size.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One message with every axis on it, driven by the controls below the canvas. Change the tone and both the mark and the word a screen reader hears change with it.',
    snippet: defineSnippet({
      id: 'inline-message-react-playground',
      language: 'tsx',
      label: 'A message under a field',
      source: '<InlineMessage tone="danger">Enter a valid EIN to continue.</InlineMessage>;',
    }),
  },
  {
    id: 'tones',
    title: 'What the message is about',
    note: 'Four severities and one absence of one. secondary is help: no mark, no severity word, and the neutral muted ink rather than a tone’s louder label color.',
    snippet: defineSnippet({
      id: 'inline-message-react-tones',
      language: 'tsx',
      label: 'The five, and what each one says',
      source:
        '// secondary is help, accent information, and the other three are severities.\n<InlineMessage>Between 8 and 64 characters.</InlineMessage>;\n<InlineMessage tone="success">Username available.</InlineMessage>;\n<InlineMessage tone="danger">This email is already registered.</InlineMessage>;',
    }),
  },
  {
    id: 'sizes',
    title: 'The step the message sits at',
    note: 'sm sits beside a compact field and md beside a large field. Both read the control scales, so switching the toolbar to dense shrinks them with the rows around them.',
    snippet: defineSnippet({
      id: 'inline-message-react-sizes',
      language: 'tsx',
      label: 'Two steps, both answering density',
      source:
        '<InlineMessage size="sm" tone="danger">\n  A mensagem de um campo compacto.\n</InlineMessage>;\n<InlineMessage size="md" tone="danger">\n  A mensagem de um campo grande.\n</InlineMessage>;',
    }),
  },
  {
    id: 'pending',
    title: 'A message that is still waiting',
    note: 'The mark becomes a ring turning in the same box, so the wait becomes its answer with no geometry moving. Under reduced motion the ring stops rather than slows.',
    snippet: defineSnippet({
      id: 'inline-message-react-pending',
      language: 'tsx',
      label: 'The check, and the answer it becomes',
      source:
        "const [state, setState] = useState<'idle' | 'checking' | 'free'>('checking');\n\n<InlineMessage\n  live=\"polite\"\n  loading={state === 'checking'}\n  tone={state === 'free' ? 'success' : 'secondary'}\n>\n  {state === 'checking' ? 'Checking availability…' : 'Name available.'}\n</InlineMessage>;",
    }),
  },
  {
    id: 'wiring',
    title: 'Pointing a control at the message',
    note: 'The three attributes that make an error reach a reader: aria-invalid on the control, aria-errormessage at the message’s id, and an id the family generates when the page states none.',
    snippet: defineSnippet({
      id: 'inline-message-react-wiring',
      language: 'tsx',
      label: 'A control, a hint and an error',
      source:
        'const messageId = useId();\n\n<>\n  <label htmlFor="cnpj">EIN</label>\n  <input aria-errormessage={messageId} aria-invalid id="cnpj" />\n  <InlineMessage id={messageId} tone="danger">\n    Two digits are missing.\n  </InlineMessage>\n</>;',
    }),
  },
  {
    id: 'live',
    title: 'What a reader hears, and when',
    note: 'off by default, because a message already on the page when it loads is announced by nothing. Press the button and the message arrives while the reader is elsewhere, which is what polite is for.',
    snippet: defineSnippet({
      id: 'inline-message-react-live',
      language: 'tsx',
      label: 'A message that arrived after the page did',
      source:
        '// role="status" on the message itself, which implies aria-live and\n// aria-atomic. There are no controls inside it to keep out of the region.\n<InlineMessage live="polite" tone="success">\n  Changes saved.\n</InlineMessage>;',
    }),
  },
  {
    id: 'reserve',
    title: 'Holding the line open',
    note: 'Both columns render the message unconditionally; only the right one has something to say. The two second fields sit at the same height, because the empty message keeps its line and draws nothing in it.',
    snippet: defineSnippet({
      id: 'inline-message-react-reserve',
      language: 'tsx',
      label: 'One line box, message or no message',
      source:
        '// Rendered whether or not there is an error, so nothing below it moves.\n<InlineMessage reserve tone="danger">\n  {errors.cnpj}\n</InlineMessage>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German compound over three lines, a container digest with no break opportunity, a sentence carrying a link, and the page’s own artwork — the mark stays on the first line in all four.',
    snippet: defineSnippet({
      id: 'inline-message-react-content',
      language: 'tsx',
      label: 'Long, unbreakable, and carrying a link',
      source:
        '<InlineMessage tone="secondary">\n  We accept credit card, ACH transfer and Zelle. <Link href="/tarifas">View fees</Link>\n</InlineMessage>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'The provider translates the severity words once, render substitutes the element for a list of failures, and icon replaces the mark while keeping its box and its place.',
    snippet: defineSnippet({
      id: 'inline-message-react-composition',
      language: 'tsx',
      label: 'One decision for the application, and two for one message',
      source:
        "<InlineMessageDefaultsProvider prefixes={{ danger: 'Error:', warning: 'Attention:' }}>\n  <App />\n</InlineMessageDefaultsProvider>;\n\n<InlineMessage icon={<ShieldIcon />} render={(props) => <div {...props} />}>\n  Two-step verification protects this account.\n</InlineMessage>;",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears before the message',
    note: 'Turn a screen reader on and read the three rows: the severity is a word, not only a color and a silhouette, and it is the same word wherever the message is announced.',
    snippet: defineSnippet({
      id: 'inline-message-react-accessibility',
      language: 'tsx',
      label: 'The word, and the two ways to change it',
      source:
        '// Heard as “Error: Enter a valid EIN.”\n<InlineMessage tone="danger">Enter a valid EIN.</InlineMessage>;\n\n// One message says its own word; the empty string removes it entirely.\n<InlineMessage prefix="Error:" tone="danger" />;\n<InlineMessage prefix="" tone="danger" />;',
    }),
  },
];

export const REACT_INLINE_MESSAGE_DOCS = {
  inlineMessage: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'InlineMessage',
        'What the message is about, and therefore which mark it draws and which word a reader hears first. secondary is help: no mark, no word, and the neutral muted ink',
      ],
      [
        'size',
        "'sm' | 'md'",
        'sm',
        'InlineMessage',
        'The type step. sm beside a compact field, md beside a large field; both read the control scales, which the theme restates per density',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'InlineMessage',
        'Whether the message announces itself. polite writes role="status" and assertive writes role="alert", both on this element — there are no controls inside it to keep out of the region',
      ],
      [
        'mark',
        "'glyph' | 'dot' | 'none'",
        'glyph',
        'InlineMessage',
        'Which mark is drawn. glyph is the tone’s own silhouette; dot is one neutral bullet in the tone’s ink, the same shape for every tone including help; none draws nothing, and the tone is said by the ink and the weight of the sentence. Field and FieldGroup ask for none, because a silhouette under every control of a form is texture rather than a warning',
      ],
      [
        'prefix',
        'string',
        '—',
        'InlineMessage',
        'The word read before the message. Unstated is the tone’s own; the empty string removes it, for a sentence that already names the severity',
      ],
      [
        'hideIcon',
        'boolean',
        'false',
        'InlineMessage',
        'Draws no mark at all. The severity word stays, because it is what a reader hears rather than what a reader sees',
      ],
      [
        'icon',
        'ReactNode',
        '—',
        'InlineMessage',
        'Replaces the tone’s mark, keeping its box, its size and its place on the first line. Angular projects an element carrying slInlineMessageIcon instead',
      ],
      [
        'loading',
        'boolean',
        'false',
        'InlineMessage',
        'The message is waiting for something: the mark becomes a ring turning at the same duration Button’s does, and stopping under reduced motion',
      ],
      [
        'disabled',
        'boolean',
        '—',
        'InlineMessage',
        'Unstated rather than false, so the field this family sits in can answer it once field ships in wave 3. Stated, it wins: the ink is muted and the ring stops',
      ],
      [
        'reserve',
        'boolean',
        'false',
        'InlineMessage',
        'Holds one line box of the family’s own leading open whether or not there is a message, so a form rendering the message unconditionally never moves when the error arrives',
      ],
      [
        'id',
        'string',
        'generated',
        'InlineMessage',
        'What aria-describedby or aria-errormessage points at. The family generates one from useId when the page states none, so the element is always addressable',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'InlineMessage',
        'Substitutes the rendered element and hands it every data attribute. A ul is how one message carries a list of failures instead of a sentence',
      ],
      [
        'ref',
        'Ref<HTMLParagraphElement>',
        '—',
        'InlineMessage',
        'Reaches the element. There is no imperative handle beyond it: the family holds no state and moves nothing, so there is nothing to call',
      ],
      [
        'InlineMessageDefaultsProvider',
        '{ tone, size, live, prefixes }',
        '—',
        'a subtree',
        'Sets the three axes once, and — the one that matters — the table of severity words, merged over the shipped one so a single word can be replaced alone',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'InlineMessage',
        'The sentence, wrapped by the family in the text part. Undefined or an empty string leaves that part empty, which is what reserve draws nothing in',
      ],
    ]),
    accessibility: [
      'A message about a section, a page or a command’s outcome is an alert, at reach section or page. This family is the message of one field or one control, under or beside it.',
      'There is no WAI-ARIA APG pattern for a message attached to a field. Three documents cover it between them: the APG Alert Pattern (w3.org/WAI/ARIA/apg/patterns/alert/) for the announcing behavior, MDN’s aria-errormessage reference for the wiring, and WCAG 2.2 Understanding 3.3.1 Error Identification for the requirement that the error be identified in text.',
      'The severity is a word, not only a color and a mark. A reader who cannot see the message hears the sentence and nothing else, so the family writes “Error:”, “Warning:” or “Success:” in clipped text before it — GOV.UK’s Error message component publishes the idea for errors, and this generalizes it to every severity and to a table an application replaces once through the provider.',
      'The live role goes on the message itself. Alert puts its role on an inner part because it has a dismiss button beside its text and MDN’s alert role reference restricts the role to text content; this family owns no controls, so the element that is the text is the element that announces. live defaults to off, because a message already present when the page finishes loading is announced by nothing whatever role it carries.',
      'Wiring is the control’s job and the identifier is the family’s. MDN: set aria-invalid="true" on the control, then aria-errormessage to the id of the element holding the message. The family generates an id with useId when the page states none, and never replaces one the page wrote.',
      'The mark is aria-hidden, because it repeats what the severity word already says. Under forced colors it keeps its silhouette in CanvasText — the circle, the diamond and the circled exclamation are what tell an error from a note when every color has been replaced, which is WCAG 2.2 1.4.1.',
      'A disabled message is muted to a measured color rather than faded by opacity, and its ring stops: STATE_PRECEDENCE puts disabled above loading, and a control nobody can use is not waiting for anything. Nothing is removed from the accessibility tree, because a message about a disabled field is still a message.',
      'The family never becomes a tooltip. The message is visible text in the flow of the page, which is the requirement WCAG 2.2 3.3.1 states and the one a hover-only error fails for every reader who does not hover.',
    ],
    snippets: [
      defineSnippet({
        id: 'inline-message-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<p\n  data-ui="inline-message"\n  data-part="root"\n  data-tone="danger"\n  data-size="sm"\n  data-live="polite"\n  id="cnpj-error"\n  role="status"\n>\n  <span data-part="prefix">Error:</span>\n  <span aria-hidden="true" data-part="icon" />\n  <span data-part="text">Two digits are missing.</span>\n</p>;',
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
