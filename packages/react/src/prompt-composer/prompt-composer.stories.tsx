import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  Attachment,
  AttachmentBody,
  AttachmentDetail,
  AttachmentFilename,
  AttachmentGroup,
  AttachmentPreview,
  AttachmentRemove,
} from '../attachment';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { Icon } from '../icon';
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../menu';
import {
  PromptComposer,
  PromptComposerAction,
  PromptComposerAttach,
  PromptComposerFooter,
  PromptComposerHeader,
  PromptComposerInput,
  PromptComposerSubmit,
} from './prompt-composer';
import { PromptComposerDefaultsProvider } from './prompt-composer-defaults';
import { Grid, Scene } from './prompt-composer-demo';
import { REACT_PROMPT_COMPOSER_DOCS, REACT_PROMPT_COMPOSER_TOKENS } from './prompt-composer.docs';
import type {
  PromptComposerSize,
  PromptComposerStatus,
  PromptComposerVariant,
} from './prompt-composer.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PROMPT_COMPOSER_DOCS.promptComposer.scenes, {
    playground: Playground,
    chat: Chat,
    comment: Comment,
    attachments: Attachments,
    status: Status,
    sizes: Sizes,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

interface PlaygroundArgs {
  size: PromptComposerSize;
  status: PromptComposerStatus;
  submitOn: 'enter' | 'mod-enter';
  variant: PromptComposerVariant;
}

const meta = {
  title: 'Components/PromptComposer',
  component: PromptComposer,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Prompt Composer',
        description:
          'A message being written: a form around a textarea that grows, a band above it for the attachments and a band below it for the tools and the send — which turns into a busy ring, a stop and a retry as the request moves.',
        framework: 'React',
        ...REACT_PROMPT_COMPOSER_DOCS.promptComposer,
        tokens: REACT_PROMPT_COMPOSER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof PromptComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const MODELS = ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'];

function ModelMenu() {
  const [model, setModel] = useState(MODELS[0]!);
  return (
    <Menu>
      <MenuTrigger
        render={(props) => (
          <PromptComposerAction {...props}>
            {model}
            <Icon>
              <ChevronDown />
            </Icon>
          </PromptComposerAction>
        )}
      />
      <MenuContent>
        <MenuRadioGroup onValueChange={(value) => setModel(value as string)} value={model}>
          {MODELS.map((name) => (
            <MenuRadioItem key={name} value={name}>
              {name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function ChatComposer({
  status,
  ...props
}: Partial<PlaygroundArgs> & { status?: PromptComposerStatus | undefined }) {
  return (
    <PromptComposer {...props} {...(status === undefined ? {} : { status })}>
      <PromptComposerInput aria-label="Mensagem" placeholder="Pergunte ao assistente" />
      <PromptComposerFooter>
        <PromptComposerAttach />
        <ModelMenu />
        <PromptComposerSubmit />
      </PromptComposerFooter>
    </PromptComposer>
  );
}

export const Playground = {
  args: { size: 'md', status: 'ready', submitOn: 'enter', variant: 'raised' } as never,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    status: { control: 'inline-radio', options: ['ready', 'submitted', 'streaming', 'error'] },
    submitOn: { control: 'inline-radio', options: ['enter', 'mod-enter'] },
    variant: { control: 'inline-radio', options: ['raised', 'outline', 'subtle'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args: unknown) => (
    <div className="slotted-demo-stage" data-layout="block">
      <ChatComposer {...(args as PlaygroundArgs)} />
    </div>
  ),
} satisfies Story as Story;

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const ANSWER =
  'The notice period of the Sirius contract is 60 days before renewal, per clause 12.3. A termination without this notice incurs a penalty of two monthly payments.';

/**
 * A request that is submitted for a moment, then streams its answer word by
 * word, the way an assistant does; stop cuts it short.
 */
function Assistant() {
  const [status, setStatus] = useState<PromptComposerStatus>('ready');
  const [messages, setMessages] = useState<Message[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const stream = (words: string[], at: number) => {
    if (at >= words.length) return setStatus('ready');
    setMessages((list) => {
      const last = list.at(-1)!;
      return [...list.slice(0, -1), { ...last, text: `${last.text} ${words[at]}`.trim() }];
    });
    timer.current = setTimeout(() => stream(words, at + 1), 90);
  };

  return (
    <div className="slotted-demo-stack">
      <div
        aria-label="Conversa"
        aria-live="polite"
        className="slotted-demo-surface"
        data-surface="sunken"
        role="log"
      >
        {messages.length === 0 ? (
          <p>Ask, for example: what is the notice period of the contract?</p>
        ) : (
          messages.map((message, index) => (
            <p key={index}>
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}</strong> {message.text}
            </p>
          ))
        )}
      </div>
      <PromptComposer
        onStop={() => {
          clearTimeout(timer.current);
          setStatus('ready');
        }}
        onValueSubmit={(text) => {
          setMessages((list) => [...list, { role: 'user', text }, { role: 'assistant', text: '' }]);
          setStatus('submitted');
          timer.current = setTimeout(() => {
            setStatus('streaming');
            stream(ANSWER.split(' '), 0);
          }, 900);
        }}
        status={status}
      >
        <PromptComposerInput aria-label="Mensagem" placeholder="Pergunte ao assistente" />
        <PromptComposerFooter>
          <PromptComposerAttach />
          <ModelMenu />
          <PromptComposerAction aria-label="Search the web">
            <Icon>
              <Globe />
            </Icon>
          </PromptComposerAction>
          <PromptComposerSubmit />
        </PromptComposerFooter>
      </PromptComposer>
    </div>
  );
}

export const Chat: Story = {
  parameters: scenario('chat'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Ask, wait, watch it answer, stop it"
        note="The send turns into a ring for the moment the request is submitted, then into a stop inside the ring while the answer streams in word by word. Stop cuts it short and focus returns to the value."
      >
        <Assistant />
      </Scene>
    </Grid>
  ),
};

export const Comment: Story = {
  parameters: scenario('comment'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Reply to a contract review"
        note="outline sits beside the other controls of a form. Enter breaks a line, Mod+Enter sends, and the send is named by its word."
      >
        <Field>
          <FieldLabel>Comment</FieldLabel>
          <PromptComposer submitOn="mod-enter" variant="outline">
            <PromptComposerInput rows={3} showCount maxLength={500} />
            <PromptComposerFooter>
              <PromptComposerAction>Cancelar</PromptComposerAction>
              <PromptComposerSubmit>Comentar</PromptComposerSubmit>
            </PromptComposerFooter>
          </PromptComposer>
          <FieldDescription>Ctrl+Enter or ⌘+Enter posts the comment.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

function WithAttachments() {
  const [files, setFiles] = useState<File[]>([
    new File(['x'.repeat(248_000)], 'contrato-sirius-2026.pdf', { type: 'application/pdf' }),
  ]);
  const [refused, setRefused] = useState<string[]>([]);
  return (
    <Field>
      <FieldLabel>Mensagem com anexos</FieldLabel>
      <PromptComposer
        accept="image/*,application/pdf"
        canSubmit={files.length > 0 || undefined}
        maxSize={5_000_000}
        onAttach={(added, { rejected }) => {
          setFiles((list) => [...list, ...added]);
          setRefused(rejected.map((entry) => entry.name));
        }}
        onValueSubmit={() => setFiles([])}
      >
        {files.length === 0 ? null : (
          <PromptComposerHeader>
            <AttachmentGroup aria-label="Anexos" layout="strip" size="sm">
              {files.map((file) => (
                <Attachment
                  file={file}
                  key={file.name}
                  onRemove={() => setFiles((list) => list.filter((entry) => entry !== file))}
                >
                  <AttachmentPreview />
                  <AttachmentBody>
                    <AttachmentFilename />
                    <AttachmentDetail />
                  </AttachmentBody>
                  <AttachmentRemove />
                </Attachment>
              ))}
            </AttachmentGroup>
          </PromptComposerHeader>
        )}
        <PromptComposerInput placeholder="Compare os ficheiros anexos" />
        <PromptComposerFooter>
          <PromptComposerAttach />
          <PromptComposerSubmit />
        </PromptComposerFooter>
      </PromptComposer>
      {refused.length === 0 ? (
        <FieldDescription>Images and PDF up to 5 MB. Paste or drag to attach.</FieldDescription>
      ) : (
        <FieldError>Refused: {refused.join(', ')}.</FieldError>
      )}
    </Field>
  );
}

export const Attachments: Story = {
  parameters: scenario('attachments'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three ways in, one list the application keeps"
        note="The paperclip opens the chooser; a screenshot pasted into the value and files dragged over the frame arrive the same way. With a file attached the send wakes even with no words."
      >
        <WithAttachments />
      </Scene>
    </Grid>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <Grid columns={2}>
      {(['ready', 'submitted', 'streaming', 'error'] as const).map((status) => (
        <Scene
          key={status}
          label={status}
          layout="block"
          note={
            {
              ready: 'The arrow sends; it leans a pixel upward under the pointer.',
              submitted:
                'A busy ring where the arrow stood; Enter does nothing until the status moves.',
              streaming: 'A stop square inside the ring that says the answer is still arriving.',
              error: 'A turn of the arrow: the same message can be sent again.',
            }[status]
          }
        >
          <PromptComposer defaultValue="What is the notice period?" status={status}>
            <PromptComposerInput aria-label={`Message ${status}`} />
            <PromptComposerFooter>
              <PromptComposerAttach />
              <PromptComposerSubmit />
            </PromptComposerFooter>
          </PromptComposer>
        </Scene>
      ))}
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three steps and three variants"
        note="raised is the chat surface, lifted off the page with a corner derived from its round buttons; outline and subtle keep a one-line control’s geometry inside a form."
        layout="stack"
      >
        {(
          [
            ['sm', 'raised'],
            ['md', 'outline'],
            ['lg', 'subtle'],
          ] as const
        ).map(([size, variant]) => (
          <PromptComposer key={size} size={size} variant={variant}>
            <PromptComposerInput
              aria-label={`${size} ${variant}`}
              placeholder={`${size} · ${variant}`}
            />
            <PromptComposerFooter>
              <PromptComposerAttach />
              <PromptComposerSubmit />
            </PromptComposerFooter>
          </PromptComposer>
        ))}
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Invalid, read-only and disabled"
        note="Invalid takes the danger edge and the field says why; read-only keeps the value legible and withdraws the send; disabled mutes everything to the measured color."
        layout="stack"
      >
        <Field invalid>
          <FieldLabel>Mensagem</FieldLabel>
          <PromptComposer defaultValue="Resumo de 3 000 palavras…">
            <PromptComposerInput />
            <PromptComposerFooter>
              <PromptComposerAttach />
              <PromptComposerSubmit />
            </PromptComposerFooter>
          </PromptComposer>
          <FieldError>A mensagem passa de 2 000 caracteres.</FieldError>
        </Field>
        <PromptComposer defaultValue="Conversa arquivada" readOnly>
          <PromptComposerInput aria-label="Somente leitura" />
          <PromptComposerFooter>
            <PromptComposerAttach />
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>
        <PromptComposer defaultValue="No permission to write" disabled>
          <PromptComposerInput aria-label="Disabled" />
          <PromptComposerFooter>
            <PromptComposerAttach />
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>
      </Scene>
    </Grid>
  ),
};

const LONG =
  'Summarize the attached contract in five points, with the renewal dates, the early termination penalties, the notice period and who signs for each party. Compare it with the September proposal and say what changed in the price adjustment clauses. Then write a short email to legal asking for a review of the differences, in a formal tone, and suggest three questions for the Thursday meeting.';

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A message longer than the composer"
        note="It grows to six lines and scrolls; the band stays where the thumb expects it."
        layout="block"
      >
        <PromptComposer defaultValue={LONG}>
          <PromptComposerInput aria-label="Mensagem longa" maxRows={6} />
          <PromptComposerFooter>
            <PromptComposerAttach />
            <ModelMenu />
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>
      </Scene>
      <Scene
        label="Two scripts in one value"
        note="Each paragraph takes its own direction: the Arabic line ends at the right margin and the Portuguese question ends in its own question mark."
        layout="block"
      >
        <PromptComposer defaultValue={'ما هي مدة الإشعار؟\nWhat is the notice period?'}>
          <PromptComposerInput aria-label="Message in two scripts" />
          <PromptComposerFooter>
            <PromptComposerAttach />
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>
      </Scene>
    </Grid>
  ),
};

function FocusFromOutside() {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <PromptComposerDefaultsProvider variant="outline">
      <PromptComposer messages={{ send: 'Send', stop: 'Stop' }}>
        <PromptComposerInput aria-label="Message" placeholder="Type and send" ref={ref} />
        <PromptComposerFooter>
          <PromptComposerAction onClick={() => ref.current?.select()}>Select</PromptComposerAction>
          <PromptComposerSubmit />
        </PromptComposerFooter>
      </PromptComposer>
    </PromptComposerDefaultsProvider>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A provider, a ref, an action of your own"
        note="The provider makes every composer below it outline and names its send Send; the ref reaches the textarea, which already has select()."
      >
        <FocusFromOutside />
      </Scene>
    </Grid>
  ),
};

function SentLog({ submitOn }: { submitOn: 'enter' | 'mod-enter' }) {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <Field>
      <FieldLabel>{submitOn === 'enter' ? 'Enter envia' : 'Mod+Enter envia'}</FieldLabel>
      <PromptComposer
        onValueSubmit={(value) => setSent((list) => [value, ...list].slice(0, 3))}
        submitOn={submitOn}
      >
        <PromptComposerInput placeholder="Escreva e experimente as teclas" />
        <PromptComposerFooter>
          <PromptComposerSubmit />
        </PromptComposerFooter>
      </PromptComposer>
      <FieldDescription>
        {sent.length === 0 ? 'Nothing sent.' : `Sent: ${sent.join(' · ')}`}
      </FieldDescription>
    </Field>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Enter sends, Shift+Enter breaks a line"
        note="The chat default. While an input method composes, Enter confirms the composition and sends nothing."
        layout="block"
      >
        <SentLog submitOn="enter" />
      </Scene>
      <Scene
        label="Mod+Enter sends, Enter breaks a line"
        note="For messages with paragraphs: a comment, an e-mail. Mod is Ctrl, or ⌘ on a Mac."
        layout="block"
      >
        <SentLog submitOn="mod-enter" />
      </Scene>
    </Grid>
  ),
};
