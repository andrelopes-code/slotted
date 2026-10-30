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

export const ANGULAR_PROMPT_COMPOSER_TOKENS = promptComposerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Prompt Composer decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  providePromptComposerDefaults,\n  SlPromptComposer,\n  SlPromptComposerAction,\n  SlPromptComposerAttach,\n  SlPromptComposerDictate,\n  SlPromptComposerFooter,\n  SlPromptComposerHeader,\n  SlPromptComposerInput,\n  SlPromptComposerSubmit,\n} from '@slotted/angular/prompt-composer';",
  selector: 'form[slPromptComposer]',
  exportAs: 'slPromptComposer',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'form[slPromptComposer], the consumer’s own form',
    required: true,
    purpose:
      'The frame: border, ground, lift and the focus ring while the value has focus. Carries data-ui="prompt-composer", data-size, data-variant, data-status, and data-disabled, data-invalid, data-readonly, data-loading and data-drop-target. A press on its padding puts the caret in the value; files dropped on it are handed to (attach).',
  },
  {
    part: 'header',
    element: 'any element carrying slPromptComposerHeader',
    required: false,
    purpose:
      'The band above the value: attachments, a quoted reply, a context chip. It wraps, and a strip of attachments scrolls inside it rather than crossing the frame.',
  },
  {
    part: 'input',
    element: 'textarea[slPromptComposerInput]',
    required: true,
    purpose:
      'The value. Grows from rows to maxRows with field-sizing, then scrolls; each paragraph takes its own direction. Enter, Mod+Enter and Shift+Enter are described in the keyboard scene. It is the ControlValueAccessor, so a reactive form binds there; exportAs slPromptComposerInput reaches inputElement.',
  },
  {
    part: 'footer',
    element: 'any element carrying slPromptComposerFooter',
    required: false,
    purpose:
      'The band below the value: tools on the start, the send held at the end by an automatic margin.',
  },
  {
    part: 'action',
    element: 'button[slPromptComposerAction]',
    required: false,
    purpose:
      'A button of the consumer’s in a band: a model menu, a tool, Cancelar. Round when named by aria-label, a pill when named by its words; aria-expanded="true" keeps it pressed while its menu is open.',
  },
  {
    part: 'attach',
    element: 'button[slPromptComposerAttach]',
    required: false,
    purpose:
      'Opens the file chooser with the composer’s accept and multiple, and hands the choice to (attach) with reason "pointer".',
  },
  {
    part: 'dictate',
    element: 'button[slPromptComposerDictate]',
    required: false,
    purpose:
      'The microphone: dictation through the platform’s SpeechRecognition, in the lang input or the nearest lang attribute. Each final phrase is written at the end of the value through (valueChange) with reason "dictation"; the button is aria-pressed while the engine listens, a second press stops it, and “Listening” is announced as it starts. Without a recognition engine the button is hidden.',
  },
  {
    part: 'submit',
    element: 'button[slPromptComposerSubmit]',
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
      id: 'prompt-composer-angular-playground',
      language: 'angular',
      label: 'A composer, its value and its send',
      source: `<form slPromptComposer [status]="status()" (valueSubmit)="send($event.value)" (stop)="abort()">
  <textarea
    slPromptComposerInput
    aria-label="Mensagem"
    placeholder="Pergunte ao assistente"
  ></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAttach></button>
    <button slPromptComposerSubmit></button>
  </div>
</form>`,
    }),
  },
  {
    id: 'chat',
    title: 'An assistant that answers while you wait',
    note: 'Send a question: the status goes to submitted, then streaming, and back to ready when the answer ends — the send turns into a ring, then a stop inside the ring. Press stop and the answer is cut short. The model is a menu on an action.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-chat',
      language: 'angular',
      label: 'Status driven by the request, a model menu on an action',
      source: `<form
  slPromptComposer
  [status]="chat.status()"
  (valueSubmit)="chat.send($event.value)"
  (stop)="chat.stop()"
>
  <textarea
    slPromptComposerInput
    aria-label="Mensagem"
    placeholder="Pergunte ao assistente"
  ></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAttach></button>
    <button slPromptComposerAction [slMenuTriggerFor]="models">{{ model() }}</button>
    <button slPromptComposerSubmit></button>
  </div>
</form>
<sl-menu #models>
  <sl-menu-radio-group [(value)]="model">
    <button slMenuRadioItem value="Claude Opus">Claude Opus</button>
  </sl-menu-radio-group>
</sl-menu>`,
    }),
  },
  {
    id: 'comment',
    title: 'A comment box in a form',
    note: 'The outline variant keeps a one-line control’s geometry beside the other fields. The send is named by its word, Comentar; Cancelar is an action. Enter breaks a line here, because a comment has paragraphs: Mod+Enter sends.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-comment',
      language: 'angular',
      label: 'Outline, a named send, Mod+Enter',
      source: `<form slPromptComposer variant="outline" submitOn="mod-enter" (valueSubmit)="post($event.value)">
  <textarea slPromptComposerInput aria-label="Comment" rows="3"></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAction (click)="close()">Cancel</button>
    <button slPromptComposerSubmit>Comentar</button>
  </div>
</form>`,
    }),
  },
  {
    id: 'attachments',
    title: 'Attaching by the paperclip, a paste and a drop',
    note: 'Choose files, paste a screenshot into the value, or drag files over the frame — it washes in the accent and draws a dashed edge before you let go. Images and PDFs up to 5 MB are accepted; anything else is listed as refused. The attachments are the application’s list, drawn with attachment.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-attachments',
      language: 'angular',
      label: '(attach), the selection rules, and the list the application keeps',
      source: `<form
  slPromptComposer
  accept="image/*,application/pdf"
  [maxSize]="5000000"
  [canSubmit]="files().length > 0 || undefined"
  (attach)="add($event.files, $event.rejected)"
>
  <div slPromptComposerHeader>
    <ul slAttachmentGroup layout="strip" size="sm" aria-label="Anexos">
      @for (file of files(); track file.name) {
        <li slAttachment [file]="file" removable (remove)="remove(file)">
          <span slAttachmentPreview></span>
          <div slAttachmentBody><span slAttachmentFilename></span></div>
          <div slAttachmentActions><button slAttachmentRemove></button></div>
        </li>
      }
    </ul>
  </div>
  <textarea slPromptComposerInput aria-label="Mensagem"></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAttach></button>
    <button slPromptComposerSubmit></button>
  </div>
</form>`,
    }),
  },
  {
    id: 'status',
    title: 'The four statuses of the request',
    note: 'ready sends; submitted is busy and refuses Enter; streaming stops; error offers a retry. The status is the application’s, because only the application knows whether an answer is on its way.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-status',
      language: 'angular',
      label: 'One prop, four sends',
      source: `<form slPromptComposer status="ready"></form>
<form slPromptComposer status="submitted"></form>
<form slPromptComposer status="streaming" (stop)="abort()"></form>
<form slPromptComposer status="error"></form>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the composer sits at',
    note: 'Three steps of the control scale, and three variants: raised lifts a chat surface off the page, outline and subtle sit inside a form. Switch the toolbar to dense and each step shrinks whole.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-sizes',
      language: 'angular',
      label: 'Size and variant',
      source: `<form slPromptComposer size="sm"></form>
<form slPromptComposer size="md" variant="outline"></form>
<form slPromptComposer size="lg" variant="subtle"></form>`,
    }),
  },
  {
    id: 'states',
    title: 'Invalid, read-only and disabled',
    note: 'Invalid takes the danger edge and the field’s message says why; read-only keeps the value legible and copyable and withdraws the send; disabled mutes everything to the measured colour and takes the composer out of the tab order.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-states',
      language: 'angular',
      label: 'Unstated rather than false, so the composer defers to its field',
      source: `<div slField [invalid]="true">
  <label slFieldLabel>Mensagem</label>
  <form slPromptComposer>
    <textarea slPromptComposerInput></textarea>
  </form>
  <p slFieldError>A mensagem passa de 2 000 caracteres.</p>
</div>
<form slPromptComposer>
  <textarea slPromptComposerInput readOnly defaultValue="Arquivado"></textarea>
</form>`,
    }),
  },
  {
    id: 'content',
    title: 'Long, translated and right-to-left',
    note: 'A long message grows to maxRows and then scrolls, with the band still under the thumb. Each paragraph takes its own direction, so an Arabic line and a Portuguese line sit in one value without either ending at the wrong margin.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-content',
      language: 'angular',
      label: 'maxRows, and a value in two scripts',
      source: `<form slPromptComposer>
  <textarea slPromptComposerInput aria-label="Mensagem" maxRows="6"></textarea>
</form>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'providePromptComposerDefaults carries the variant and the send key, and the words come from the language in force; exportAs reaches the textarea, which already has select(); the value binds to a reactive form.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-composition',
      language: 'angular',
      label: 'An exported instance and a reactive form; the provider sits in providers',
      source: `<form slPromptComposer>
  <textarea
    slPromptComposerInput
    #mensagem="slPromptComposerInput"
    [formControl]="texto"
  ></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAction (click)="message.inputElement.select()">Select</button>
    <button slPromptComposerSubmit></button>
  </div>
</form>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Enter sends and Shift+Enter breaks a line; with submitOn="mod-enter" Enter breaks a line and Mod+Enter sends. Nothing is sent while an input method is composing, because there Enter confirms the composition. Escape is not bound.',
    snippet: defineSnippet({
      id: 'prompt-composer-angular-keyboard',
      language: 'angular',
      label: 'Two sending keys',
      source: `<form slPromptComposer submitOn="enter"></form>
<form slPromptComposer submitOn="mod-enter"></form>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string>',
    when: 'On slPromptComposerInput, before the value moves: reason "keyboard" for an edit, "dictation" for a phrase slPromptComposerDictate wrote, "submit" for the clearing after an accepted send. cancel() refuses the move.',
  },
  {
    name: '(valueSubmit)',
    payload: 'ChangeRequest<string>',
    when: 'On slPromptComposer, before the message is sent from Enter, Mod+Enter or the send — reason "keyboard" or "pointer". cancel() keeps the value; otherwise it is cleared.',
  },
  {
    name: '(stop)',
    payload: 'PromptComposerStopEvent — { reason, source }',
    when: 'The stop button, while status is "streaming". “Stopped” is announced.',
  },
  {
    name: '(attach)',
    payload: 'PromptComposerAttachEvent — { files, reason, rejected, source }',
    when: 'Files from the paperclip ("pointer"), a paste ("paste") or a drop ("drop"), after accept, maxSize, maxFiles and multiple.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the form’s own value and touched state',
    when: 'On slPromptComposerInput, whenever the value moves and the request was not cancelled — including the clearing after a send — and on blur for touched.',
  },
];

export const ANGULAR_PROMPT_COMPOSER_DOCS = {
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
        'slPromptComposer',
        'Present means the consumer owns the value. defaultValue is the uncontrolled half',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slPromptComposer',
        'What an uncontrolled composer starts from',
      ],
      [
        'status',
        "'ready' | 'submitted' | 'streaming' | 'error'",
        'ready',
        'slPromptComposer',
        'Where the request stands. submitted is busy, streaming turns the send into a stop, error into a retry',
      ],
      [
        'submitOn',
        "'enter' | 'mod-enter'",
        'enter',
        'slPromptComposer, providePromptComposerDefaults',
        'Which key sends. Shift+Enter always breaks a line; Mod+Enter always sends',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slPromptComposer, providePromptComposerDefaults',
        'The control step, read from the field first',
      ],
      [
        'variant',
        "'raised' | 'outline' | 'subtle'",
        'raised',
        'slPromptComposer, providePromptComposerDefaults',
        'raised is the chat surface; outline and subtle sit inside a form',
      ],
      [
        'emphasis',
        "'none' | 'ring'",
        'none',
        'sl-prompt-composer',
        'A ring of turning hues and a soft glow in place of the border, the focus outline and the raised shadow. Reduced motion stops the turn; forced colours bring the border back',
      ],
      [
        'canSubmit',
        'boolean',
        'the value is not blank',
        'slPromptComposer',
        'Whether the send is available; an application with attachments ready says true',
      ],
      [
        'accept / maxSize / maxFiles / multiple',
        'string / number / number / boolean',
        '— / — / — / true',
        'slPromptComposer',
        'The selection rules upload applies, for the paperclip, a paste and a drop',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slPromptComposer',
        'Unstated rather than false, so the composer defers to its field. The native attribute on the textarea; the paperclip and the send leave the tab order with it',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slPromptComposer',
        'The value stays focusable and copyable; the paperclip and the send are withdrawn',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slPromptComposer',
        'aria-invalid on the textarea and the danger edge on the frame',
      ],
      [
        'required',
        'boolean',
        'from the field',
        'slPromptComposer',
        'aria-required on the textarea, never the native attribute, which would engage constraint validation',
      ],
      [
        'loading',
        'derived',
        'false',
        'slPromptComposer',
        'data-loading on the frame while status is submitted or streaming; it is read from status, never set',
      ],
      ['rows', 'number', '1', 'slPromptComposerInput', 'The fewest lines the value shows'],
      [
        'maxRows',
        'number',
        '8',
        'slPromptComposerInput',
        'The most lines it grows to before it scrolls',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'slPromptComposerInput',
        'Publishes the length of the value to the field, which draws the count',
      ],
      [
        'messages',
        'Partial<PromptComposerMessages>',
        '—',
        'slPromptComposer',
        'Words laid over the language in force, key by key: what the send says in each status, what is announced, and the paperclip’s name',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        'slPromptComposer, slPromptComposerInput, slPromptComposerAction',
        '—',
        'the directives',
        'Reach the instance from a template; slPromptComposerInput.inputElement is the native textarea',
      ],
      [
        'button[slPromptComposerAction]',
        'directive',
        'type="button"',
        'a band',
        'A button of the consumer’s; slMenuTriggerFor or slTooltipTrigger sit on the same element, and the part is written back after the first render',
      ],
      [
        'providePromptComposerDefaults',
        '(defaults: Partial<PromptComposerDefaults>) => Provider',
        '—',
        'an injector',
        'The decisions an application takes once',
      ],
      [
        'ControlValueAccessor',
        'formControl, ngModel',
        '—',
        'slPromptComposerInput',
        'The value belongs in a reactive or template-driven form as it stands',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for a composer; the textarea supplies the textbox role, the field supplies the name, and the root is the consumer’s form, so Enter in the value and the send button are the platform’s submission.',
      'The send is named by the label for its status — Send, Sending, Stop, Retry — and the change of name is what a screen reader hears when the request moves; “Sending” and “Stopped” are announced once through the shared live announcer.',
      'While the request is submitted the send is aria-disabled rather than disabled, so focus is not thrown out of it; Enter in the value does nothing until the status returns.',
      'Enter never sends while an input method is composing (isComposing, keyCode 229): in Japanese and Chinese Enter confirms the composition.',
      'The attachments are the application’s list and are drawn with attachment, which owns their names, their removal and the focus after a removal. Refused files are reported in onAttach so the application can say why.',
      'The bands are not an APG toolbar: each button keeps its own tab stop, because there are few of them and they do different things.',
    ],
    snippets: [
      defineSnippet({
        id: 'prompt-composer-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<form slPromptComposer>
  <div slPromptComposerHeader><!-- attachments --></div>
  <textarea slPromptComposerInput></textarea>
  <div slPromptComposerFooter>
    <button slPromptComposerAttach></button>
    <button slPromptComposerAction>Claude Opus</button>
    <button slPromptComposerSubmit></button>
  </div>
</form>`,
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
