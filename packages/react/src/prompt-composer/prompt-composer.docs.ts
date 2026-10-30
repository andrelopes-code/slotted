import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import promptComposerTokens from '@slotted/styles/prompt-composer/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_PROMPT_COMPOSER_TOKENS = promptComposerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Prompt Composer decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  PromptComposer,\n  PromptComposerAction,\n  PromptComposerAttach,\n  PromptComposerDictate,\n  PromptComposerFooter,\n  PromptComposerHeader,\n  PromptComposerInput,\n  PromptComposerSubmit,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'form, or the element render returns',
    required: true,
    purpose:
      'The frame: border, ground, lift and the focus ring while the value has focus. Carries data-ui="prompt-composer", data-size, data-variant, data-status, and data-disabled, data-invalid, data-readonly, data-loading and data-drop-target. A press on its padding puts the caret in the value; files dropped on it are handed to onAttach.',
  },
  {
    part: 'header',
    element: 'div (PromptComposerHeader)',
    required: false,
    purpose:
      'The band above the value: attachments, a quoted reply, a context chip. It wraps, and a strip of attachments scrolls inside it rather than crossing the frame.',
  },
  {
    part: 'input',
    element: 'textarea (PromptComposerInput)',
    required: true,
    purpose:
      'The value. Grows from rows to maxRows with field-sizing, then scrolls; each paragraph takes its own direction. Enter, Mod+Enter and Shift+Enter are described in the keyboard scene. ref reaches the element.',
  },
  {
    part: 'footer',
    element: 'div (PromptComposerFooter)',
    required: false,
    purpose:
      'The band below the value: tools on the start, the send held at the end by an automatic margin.',
  },
  {
    part: 'action',
    element: 'button (PromptComposerAction)',
    required: false,
    purpose:
      'A button of the consumer’s in a band: a model menu, a tool, Cancelar. Round when named by aria-label, a pill when named by its words; aria-expanded="true" keeps it pressed while its menu is open.',
  },
  {
    part: 'attach',
    element: 'button (PromptComposerAttach), with a hidden file input beside it',
    required: false,
    purpose:
      'Opens the file chooser with the composer’s accept and multiple, and hands the choice to onAttach with reason "pointer".',
  },
  {
    part: 'dictate',
    element: 'button (PromptComposerDictate)',
    required: false,
    purpose:
      'The microphone: dictation through the platform’s SpeechRecognition, in the lang input or the nearest lang attribute. Each final phrase is written at the end of the value through onValueChange with reason "dictation"; the button is aria-pressed while the engine listens, a second press stops it, and “Listening” is announced as it starts. Without a recognition engine the button renders nothing.',
  },
  {
    part: 'submit',
    element: 'button (PromptComposerSubmit)',
    required: false,
    purpose:
      'The send: a round accent disc named by the label for its status — Send, Sending, Stop, Retry — or a pill named by the words given to it. A busy ring while submitted, a stop square inside the ring while streaming, a retry turn after an error.',
  },
  {
    part: 'ring',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'With emphasis="ring": the frame\'s edge, a band cut from a turning conic gradient of --slotted-prompt-composer-ring-colors. It replaces the border, the focus outline and the raised shadow; the buttons keep their own focus rings.',
  },
  {
    part: 'glow',
    element: 'span, aria-hidden',
    required: false,
    purpose:
      'With emphasis="ring": the same gradient blurred outside the frame, at --slotted-prompt-composer-ring-glow-opacity at rest, -focus while the input holds focus, -busy while loading, submitted or streaming.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The chat composer with the controls below the canvas: write, press Enter, and the value clears once the send is accepted. Switch the status to see the send turn into a busy ring, a stop and a retry.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-playground',
      language: 'tsx',
      label: 'A composer, its value and its send',
      source: `<PromptComposer onValueSubmit={(value) => send(value)} status={status} onStop={abort}>
  <PromptComposerInput aria-label="Mensagem" placeholder="Pergunte ao assistente" />
  <PromptComposerFooter>
    <PromptComposerAttach />
    <PromptComposerSubmit />
  </PromptComposerFooter>
</PromptComposer>;`,
    }),
  },
  {
    id: 'chat',
    title: 'An assistant that answers while you wait',
    note: 'Send a question: the status goes to submitted, then streaming, and back to ready when the answer ends — the send turns into a ring, then a stop inside the ring. Press stop and the answer is cut short. The model is a menu on an action.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-chat',
      language: 'tsx',
      label: 'Status driven by the request, a model menu on an action',
      source: `const { status, sendMessage, stop } = useChat();

<PromptComposer status={status} onValueSubmit={(text) => sendMessage({ text })} onStop={stop}>
  <PromptComposerInput aria-label="Mensagem" placeholder="Pergunte ao assistente" />
  <PromptComposerFooter>
    <PromptComposerAttach />
    <Menu>
      <MenuTrigger
        render={(props) => <PromptComposerAction {...props}>{model}</PromptComposerAction>}
      />
      <MenuContent>{/* MenuRadioGroup of models */}</MenuContent>
    </Menu>
    <PromptComposerSubmit />
  </PromptComposerFooter>
</PromptComposer>;`,
    }),
  },
  {
    id: 'comment',
    title: 'A comment box in a form',
    note: 'The outline variant keeps a one-line control’s geometry beside the other fields. The send is named by its word, Comentar; Cancelar is an action. Enter breaks a line here, because a comment has paragraphs: Mod+Enter sends.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-comment',
      language: 'tsx',
      label: 'Outline, a named send, Mod+Enter',
      source: `<PromptComposer variant="outline" submitOn="mod-enter" onValueSubmit={postComment}>
  <PromptComposerInput aria-label="Comment" rows={3} />
  <PromptComposerFooter>
    <PromptComposerAction onClick={close}>Cancel</PromptComposerAction>
    <PromptComposerSubmit>Comentar</PromptComposerSubmit>
  </PromptComposerFooter>
</PromptComposer>;`,
    }),
  },
  {
    id: 'attachments',
    title: 'Attaching by the paperclip, a paste and a drop',
    note: 'Choose files, paste a screenshot into the value, or drag files over the frame — it washes in the accent and draws a dashed edge before you let go. Images and PDFs up to 5 MB are accepted; anything else is listed as refused. The attachments are the application’s list, drawn with attachment.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-attachments',
      language: 'tsx',
      label: 'onAttach, the selection rules, and the list the application keeps',
      source: `<PromptComposer
  accept="image/*,application/pdf"
  maxSize={5_000_000}
  canSubmit={files.length > 0 || undefined}
  onAttach={(added, { rejected }) => {
    setFiles((list) => [...list, ...added]);
    setRefused(rejected);
  }}
>
  <PromptComposerHeader>
    <AttachmentGroup layout="strip" size="sm" aria-label="Anexos">
      {files.map((file) => (
        <Attachment key={file.name} file={file} onRemove={() => remove(file)} />
      ))}
    </AttachmentGroup>
  </PromptComposerHeader>
  <PromptComposerInput aria-label="Mensagem" />
  <PromptComposerFooter>
    <PromptComposerAttach />
    <PromptComposerSubmit />
  </PromptComposerFooter>
</PromptComposer>;`,
    }),
  },
  {
    id: 'status',
    title: 'The four statuses of the request',
    note: 'ready sends; submitted is busy and refuses Enter; streaming stops; error offers a retry. The status is the application’s, because only the application knows whether an answer is on its way.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-status',
      language: 'tsx',
      label: 'One prop, four sends',
      source: `<PromptComposer status="ready" />;
<PromptComposer status="submitted" />;
<PromptComposer status="streaming" onStop={abort} />;
<PromptComposer status="error" />;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the composer sits at',
    note: 'Three steps of the control scale, and three variants: raised lifts a chat surface off the page, outline and subtle sit inside a form. Switch the toolbar to dense and each step shrinks whole.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-sizes',
      language: 'tsx',
      label: 'Size and variant',
      source: `<PromptComposer size="sm" />;
<PromptComposer size="md" variant="outline" />;
<PromptComposer size="lg" variant="subtle" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Invalid, read-only and disabled',
    note: 'Invalid takes the danger edge and the field’s message says why; read-only keeps the value legible and copyable and withdraws the send; disabled mutes everything to the measured colour and takes the composer out of the tab order.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-states',
      language: 'tsx',
      label: 'Unstated rather than false, so the composer defers to its field',
      source: `<Field invalid>
  <FieldLabel>Mensagem</FieldLabel>
  <PromptComposer />
  <FieldError>A mensagem passa de 2 000 caracteres.</FieldError>
</Field>;
<PromptComposer readOnly defaultValue="Arquivado" />;
<PromptComposer disabled />;`,
    }),
  },
  {
    id: 'content',
    title: 'Long, translated and right-to-left',
    note: 'A long message grows to maxRows and then scrolls, with the band still under the thumb. Each paragraph takes its own direction, so an Arabic line and a Portuguese line sit in one value without either ending at the wrong margin.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-content',
      language: 'tsx',
      label: 'maxRows, and a value in two scripts',
      source: `<PromptComposer>
  <PromptComposerInput aria-label="Mensagem" maxRows={6} />
</PromptComposer>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the variant and the send key, and the words come from the language in force; ref reaches the textarea; render substitutes the root, keeping every attribute and handler.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-composition',
      language: 'tsx',
      label: 'A provider, a ref and a substituted root',
      source: `<PromptComposerDefaultsProvider submitOn="mod-enter">
  <App />
</PromptComposerDefaultsProvider>;

const ref = useRef<HTMLTextAreaElement>(null);
<PromptComposerInput ref={ref} />;

<PromptComposer render={(props) => <form {...props} action="/mensagens" />} />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Enter sends and Shift+Enter breaks a line; with submitOn="mod-enter" Enter breaks a line and Mod+Enter sends. Nothing is sent while an input method is composing, because there Enter confirms the composition. Escape is not bound.',
    snippet: defineSnippet({
      id: 'prompt-composer-react-keyboard',
      language: 'tsx',
      label: 'Two sending keys',
      source: `<PromptComposer submitOn="enter" />;
<PromptComposer submitOn="mod-enter" />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the value moves: reason "keyboard" for an edit, "dictation" for a phrase PromptComposerDictate wrote, "submit" for the clearing after an accepted send. cancel() refuses the move.',
  },
  {
    name: 'onValueSubmit',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the message is sent, from Enter, Mod+Enter or the send button — reason "keyboard" or "pointer". cancel() keeps the value where it is; otherwise an uncontrolled composer clears it.',
  },
  {
    name: 'onStop',
    payload: '({ reason, source })',
    when: 'The stop button, while status is "streaming". “Stopped” is announced.',
  },
  {
    name: 'onAttach',
    payload: '(files: File[], { reason, rejected, source })',
    when: 'Files from the paperclip ("pointer"), a paste ("paste") or a drop ("drop"), after accept, maxSize, maxFiles and multiple. rejected lists what the rules refused, with the reason.',
  },
  {
    name: 'onSubmit, onKeyDown, onPaste, onDrop',
    payload: 'the elements’ own events',
    when: 'Whenever the elements fire them. The consumer’s handler runs first; preventing the default of a keydown stops the send.',
  },
];

export const REACT_PROMPT_COMPOSER_DOCS = {
  promptComposer: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'PromptComposer',
        'Present means the consumer owns the value. defaultValue is the uncontrolled half',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'PromptComposer',
        'What an uncontrolled composer starts from',
      ],
      [
        'status',
        "'ready' | 'submitted' | 'streaming' | 'error'",
        'ready',
        'PromptComposer',
        'Where the request stands. submitted is busy, streaming turns the send into a stop, error into a retry',
      ],
      [
        'submitOn',
        "'enter' | 'mod-enter'",
        'enter',
        'PromptComposer, PromptComposerDefaultsProvider',
        'Which key sends. Shift+Enter always breaks a line; Mod+Enter always sends',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'PromptComposer, PromptComposerDefaultsProvider',
        'The control step, read from the field first',
      ],
      [
        'variant',
        "'raised' | 'outline' | 'subtle'",
        'raised',
        'PromptComposer, PromptComposerDefaultsProvider',
        'raised is the chat surface; outline and subtle sit inside a form',
      ],
      [
        'emphasis',
        "'none' | 'ring'",
        'none',
        'PromptComposer',
        'A ring of turning hues and a soft glow in place of the border, the focus outline and the raised shadow. Reduced motion stops the turn; forced colours bring the border back',
      ],
      [
        'canSubmit',
        'boolean',
        'the value is not blank',
        'PromptComposer',
        'Whether the send is available; an application with attachments ready says true',
      ],
      [
        'accept / maxSize / maxFiles / multiple',
        'string / number / number / boolean',
        '— / — / — / true',
        'PromptComposer',
        'The selection rules upload applies, for the paperclip, a paste and a drop',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'PromptComposer',
        'Unstated rather than false, so the composer defers to its field. The native attribute on the textarea; the paperclip and the send leave the tab order with it',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'PromptComposer',
        'The value stays focusable and copyable; the paperclip and the send are withdrawn',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'PromptComposer',
        'aria-invalid on the textarea and the danger edge on the frame',
      ],
      [
        'required',
        'boolean',
        'from the field',
        'PromptComposer',
        'aria-required on the textarea, never the native attribute, which would engage constraint validation',
      ],
      [
        'loading',
        'derived',
        'false',
        'PromptComposer',
        'data-loading on the frame while status is submitted or streaming; it is read from status, never set',
      ],
      ['rows', 'number', '1', 'PromptComposerInput', 'The fewest lines the value shows'],
      [
        'maxRows',
        'number',
        '8',
        'PromptComposerInput',
        'The most lines it grows to before it scrolls',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'PromptComposerInput',
        'Publishes the length of the value to the field, which draws the count',
      ],
      [
        'messages',
        'Partial<PromptComposerMessages>',
        '—',
        'PromptComposer',
        'Words laid over the language in force, key by key: what the send says in each status, what is announced, and the paperclip’s name',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'PromptComposer, PromptComposerHeader, PromptComposerFooter, PromptComposerAction',
        'Substitutes the element and hands it every attribute and handler',
      ],
      [
        'ref',
        'Ref<HTMLTextAreaElement>',
        '—',
        'PromptComposerInput',
        'Reaches the textarea; focus(), select() and setSelectionRange() are the element’s own',
      ],
      [
        'PromptComposerAction',
        'ComponentPropsWithRef<"button">',
        'type="button"',
        'header, footer',
        'A button of the consumer’s; MenuTrigger, PopoverTrigger and TooltipTrigger hand it their wiring through their render',
      ],
      [
        'PromptComposerDefaultsProvider',
        '{ size, variant, submitOn }',
        '—',
        'a subtree',
        'The decisions an application takes once',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for a composer; the textarea supplies the textbox role, the field supplies the name, and the root is a form, so Enter in the value and the send button are the platform’s submission.',
      'The send is named by the label for its status — Send, Sending, Stop, Retry — and the change of name is what a screen reader hears when the request moves; “Sending” and “Stopped” are announced once through the shared live announcer.',
      'While the request is submitted the send is aria-disabled rather than disabled, so focus is not thrown out of it; Enter in the value does nothing until the status returns.',
      'Enter never sends while an input method is composing (isComposing, keyCode 229): in Japanese and Chinese Enter confirms the composition.',
      'The attachments are the application’s list and are drawn with attachment, which owns their names, their removal and the focus after a removal. Refused files are reported in onAttach so the application can say why.',
      'The bands are not an APG toolbar: each button keeps its own tab stop, because there are few of them and they do different things.',
    ],
    snippets: [
      defineSnippet({
        id: 'prompt-composer-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<form data-ui="prompt-composer" data-part="root" data-variant="raised" data-status="ready">
  <div data-part="header">{/* attachments */}</div>
  <textarea data-part="input" dir="auto" />
  <div data-part="footer">
    <button data-part="attach" type="button" aria-label="Attach files" />
    <button data-part="action" type="button">
      Claude Opus
    </button>
    <button data-part="submit" type="submit" aria-label="Send" />
  </div>
</form>;`,
      }),
      defineSnippet({
        id: 'prompt-composer-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='prompt-composer'] {
  --slotted-prompt-composer-raised-shadow: var(--slotted-shadow-sm);
  --slotted-prompt-composer-submit-background: var(--slotted-text);
  --slotted-prompt-composer-max-rows: 12;
}`,
      }),
    ],
  },
} as const;
