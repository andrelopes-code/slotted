import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  SlAttachment,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentFilename,
  SlAttachmentGroup,
  SlAttachmentPreview,
  SlAttachmentRemove,
} from '@slotted/angular/attachment';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlPromptComposer } from './prompt-composer';
import { providePromptComposerDefaults } from './prompt-composer-defaults';
import type { PromptComposerAttachEvent, PromptComposerStatus } from './prompt-composer-defaults';
import { SlPromptComposerInput } from './prompt-composer-input';
import {
  SlPromptComposerAction,
  SlPromptComposerAttach,
  SlPromptComposerFooter,
  SlPromptComposerHeader,
  SlPromptComposerSubmit,
} from './prompt-composer-parts';
import {
  ANGULAR_PROMPT_COMPOSER_DOCS,
  ANGULAR_PROMPT_COMPOSER_TOKENS,
} from './prompt-composer.docs';

const COMPOSER = [
  SlPromptComposer,
  SlPromptComposerAction,
  SlPromptComposerAttach,
  SlPromptComposerFooter,
  SlPromptComposerHeader,
  SlPromptComposerInput,
  SlPromptComposerSubmit,
];

const DIRECTIVES = [
  ...COMPOSER,
  ReactiveFormsModule,
  SlAttachment,
  SlAttachmentActions,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentFilename,
  SlAttachmentGroup,
  SlAttachmentPreview,
  SlAttachmentRemove,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlGlyph,
  SlIcon,
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuTrigger,
];

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const footer = (extra = '') => `
  <div slPromptComposerFooter>
    <button slPromptComposerAttach></button>${extra}
    <button slPromptComposerSubmit></button>
  </div>`;

const ANSWER =
  'The notice period for the Sirius contract is 60 days before renewal, per clause 12.3. Terminating without this notice incurs a penalty of two monthly fees.';

/**
 * A request submitted for a moment, then streamed word by word, the way an
 * assistant answers; stop cuts it short.
 */
@Component({
  selector: 'sl-prompt-composer-assistant-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="slotted-demo-stack">
    <div
      class="slotted-demo-surface"
      data-surface="sunken"
      role="log"
      aria-label="Conversa"
      aria-live="polite"
    >
      @for (message of messages(); track $index) {
        <p>
          <strong>{{ message.role }}</strong> {{ message.text }}
        </p>
      } @empty {
        <p>Ask, for example: what is the notice period for the contract?</p>
      }
    </div>
    <form slPromptComposer [status]="status()" (valueSubmit)="send($event.value)" (stop)="stop()">
      <textarea
        slPromptComposerInput
        aria-label="Mensagem"
        placeholder="Pergunte ao assistente"
      ></textarea>

      <div slPromptComposerFooter>
        <button slPromptComposerAttach></button>
        <button slPromptComposerAction [slMenuTriggerFor]="models">
          {{ model() }}<span slIcon><svg slGlyph name="chevron-down"></svg></span>
        </button>
        <button slPromptComposerSubmit></button>
      </div>
    </form>

    <sl-menu #models>
      <sl-menu-radio-group [value]="model()" (valueChange)="model.set($event ?? model())">
        @for (name of names; track name) {
          <button slMenuRadioItem [value]="name">{{ name }}</button>
        }
      </sl-menu-radio-group>
    </sl-menu>
  </div>`,
})
class AssistantDemo {
  readonly names = ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'];
  readonly model = signal('Claude Opus');
  readonly status = signal<PromptComposerStatus>('ready');
  readonly messages = signal<{ role: string; text: string }[]>([]);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  send(text: string) {
    this.messages.update((list) => [
      ...list,
      { role: 'You', text },
      { role: 'Assistant', text: '' },
    ]);
    this.status.set('submitted');
    this.timer = setTimeout(() => {
      this.status.set('streaming');
      this.stream(ANSWER.split(' '), 0);
    }, 900);
  }

  stop() {
    clearTimeout(this.timer);
    this.status.set('ready');
  }

  private stream(words: string[], at: number) {
    if (at >= words.length) return this.status.set('ready');
    this.messages.update((list) => {
      const last = list.at(-1)!;
      return [...list.slice(0, -1), { ...last, text: `${last.text} ${words[at]}`.trim() }];
    });
    this.timer = setTimeout(() => this.stream(words, at + 1), 90);
  }
}

/** The list of attachments is the application's; the composer hands over the files. */
@Component({
  selector: 'sl-prompt-composer-attachments-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div slField>
    <label slFieldLabel>Mensagem com anexos</label>
    <form
      slPromptComposer
      accept="image/*,application/pdf"
      [maxSize]="5000000"
      [canSubmit]="files().length > 0 || undefined"
      (attach)="add($event)"
      (valueSubmit)="files.set([])"
    >
      @if (files().length > 0) {
        <div slPromptComposerHeader>
          <ul slAttachmentGroup layout="strip" size="sm" aria-label="Anexos">
            @for (file of files(); track file.name) {
              <li slAttachment [file]="file" removable (remove)="remove(file)">
                <span slAttachmentPreview></span>
                <div slAttachmentBody>
                  <span slAttachmentFilename></span>
                  <p slAttachmentDetail></p>
                </div>
                <div slAttachmentActions><button slAttachmentRemove></button></div>
              </li>
            }
          </ul>
        </div>
      }
      <textarea slPromptComposerInput placeholder="Compare os ficheiros anexos"></textarea>

      <div slPromptComposerFooter>
        <button slPromptComposerAttach></button>
        <button slPromptComposerSubmit></button>
      </div>
    </form>
    @if (refused().length === 0) {
      <p slFieldDescription>Images and PDF up to 5 MB. Paste or drag to attach.</p>
    } @else {
      <p slFieldError>Refused: {{ refused().join(', ') }}.</p>
    }
  </div>`,
})
class AttachmentsDemo {
  readonly files = signal<File[]>([
    new File(['x'.repeat(248_000)], 'contrato-sirius-2026.pdf', { type: 'application/pdf' }),
  ]);
  readonly refused = signal<string[]>([]);

  add(event: PromptComposerAttachEvent) {
    this.files.update((list) => [...list, ...event.files]);
    this.refused.set(event.rejected.map((entry) => entry.name));
  }

  remove(file: File) {
    this.files.update((list) => list.filter((entry) => entry !== file));
  }
}

/** What each sending key actually sent. */
@Component({
  selector: 'sl-prompt-composer-keyboard-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div slField>
    <label slFieldLabel>{{ submitOn() === 'enter' ? 'Enter envia' : 'Mod+Enter envia' }}</label>
    <form slPromptComposer [submitOn]="submitOn()" (valueSubmit)="log($event.value)">
      <textarea slPromptComposerInput placeholder="Escreva e experimente as teclas"></textarea>
      <div slPromptComposerFooter><button slPromptComposerSubmit></button></div>
    </form>
    <p slFieldDescription>
      {{ sent().length === 0 ? 'Nothing sent.' : 'Sent: ' + sent().join(' · ') }}
    </p>
  </div>`,
})
class KeyboardDemo {
  readonly submitOn = input<'enter' | 'mod-enter'>('enter');
  readonly sent = signal<string[]>([]);

  log(value: string) {
    this.sent.update((list) => [value, ...list].slice(0, 3));
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_PROMPT_COMPOSER_DOCS.promptComposer.scenes, {
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

interface PromptComposerStoryArgs {
  size: 'sm' | 'md' | 'lg';
  status: PromptComposerStatus;
  submitOn: 'enter' | 'mod-enter';
  variant: 'raised' | 'outline' | 'subtle';
}

const meta: Meta<PromptComposerStoryArgs> = {
  title: 'Components/PromptComposer',
  component: SlPromptComposer,
  decorators: [
    moduleMetadata({ imports: [...DIRECTIVES, AssistantDemo, AttachmentsDemo, KeyboardDemo] }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Prompt Composer',
        description:
          'A message being written: the consumer’s form around a textarea that grows, a band above it for the attachments and a band below it for the tools and the send — which turns into a busy ring, a stop and a retry as the request moves.',
        framework: 'Angular',
        ...ANGULAR_PROMPT_COMPOSER_DOCS.promptComposer,
        tokens: ANGULAR_PROMPT_COMPOSER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<PromptComposerStoryArgs>;

export const Playground: Story = {
  args: { size: 'md', status: 'ready', submitOn: 'enter', variant: 'raised' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    status: { control: 'inline-radio', options: ['ready', 'submitted', 'streaming', 'error'] },
    submitOn: { control: 'inline-radio', options: ['enter', 'mod-enter'] },
    variant: { control: 'inline-radio', options: ['raised', 'outline', 'subtle'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <form slPromptComposer [size]="size" [status]="status" [submitOn]="submitOn" [variant]="variant">
          <textarea slPromptComposerInput aria-label="Mensagem" placeholder="Pergunte ao assistente"></textarea>
          ${footer()}
        </form>
      </div>`,
  }),
};

export const Chat: Story = {
  parameters: scenario('chat'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Ask, wait, watch it answer, stop it',
        'The send turns into a ring for the moment the request is submitted, then into a stop inside the ring while the answer streams in word by word. Stop cuts it short and focus returns to the value.',
        '<sl-prompt-composer-assistant-demo />',
      ),
    ),
  }),
};

export const Comment: Story = {
  parameters: scenario('comment'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Reply to a contract review',
        'outline sits beside the other controls of a form. Enter breaks a line, Mod+Enter sends, and the send is named by its word.',
        `<div slField>
           <label slFieldLabel>Comment</label>
           <form slPromptComposer variant="outline" submitOn="mod-enter">
             <textarea slPromptComposerInput rows="3" maxlength="500" showCount></textarea>
             <div slPromptComposerFooter>
               <button slPromptComposerAction>Cancelar</button>
               <button slPromptComposerSubmit>Comentar</button>
             </div>
           </form>
           <p slFieldDescription>Ctrl+Enter or ⌘+Enter posts the comment.</p>
         </div>`,
      ),
    ),
  }),
};

export const Attachments: Story = {
  parameters: scenario('attachments'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Three ways in, one list the application keeps',
        'The paperclip opens the chooser; a screenshot pasted into the value and files dragged over the frame arrive the same way. With a file attached the send wakes even with no words.',
        '<sl-prompt-composer-attachments-demo />',
      ),
    ),
  }),
};

const STATUS_NOTES: Record<PromptComposerStatus, string> = {
  ready: 'The arrow sends; it leans a pixel upward under the pointer.',
  submitted: 'A busy ring where the arrow stood; Enter does nothing until the status moves.',
  streaming: 'A stop square inside the ring that says the answer is still arriving.',
  error: 'A turn of the arrow: the same message can be sent again.',
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    template: grid(
      2,
      (['ready', 'submitted', 'streaming', 'error'] as const)
        .map((status) =>
          scene(
            status,
            STATUS_NOTES[status],
            `<form slPromptComposer status="${status}">
               <textarea slPromptComposerInput aria-label="Message ${status}" defaultValue="What is the notice period?"></textarea>
               ${footer()}
             </form>`,
          ),
        )
        .join(''),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Three steps and three variants',
        'raised is the chat surface, lifted off the page with a corner derived from its round buttons; outline and subtle keep a one-line control’s geometry inside a form.',
        (
          [
            ['sm', 'raised'],
            ['md', 'outline'],
            ['lg', 'subtle'],
          ] as const
        )
          .map(
            ([size, variant]) => `
              <form slPromptComposer size="${size}" variant="${variant}">
                <textarea slPromptComposerInput aria-label="${size} ${variant}" placeholder="${size} · ${variant}"></textarea>
                ${footer()}
              </form>`,
          )
          .join(''),
        'stack',
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Invalid, read-only and disabled',
        'Invalid takes the danger edge and the field says why; read-only keeps the value legible and withdraws the send; disabled mutes everything to the measured color.',
        `<div slField [invalid]="true">
           <label slFieldLabel>Mensagem</label>
           <form slPromptComposer>
             <textarea slPromptComposerInput defaultValue="Resumo de 3 000 palavras…"></textarea>
             ${footer()}
           </form>
           <p slFieldError>A mensagem passa de 2 000 caracteres.</p>
         </div>
         <form slPromptComposer>
           <textarea slPromptComposerInput aria-label="Somente leitura" readOnly defaultValue="Conversa arquivada"></textarea>
           ${footer()}
         </form>
         <form slPromptComposer>
           <textarea slPromptComposerInput aria-label="Disabled" disabled defaultValue="No permission to write"></textarea>
           ${footer()}
         </form>`,
        'stack',
      ),
    ),
  }),
};

const LONG =
  'Summarize the attached contract in five points, with the renewal dates, the early termination fees, the notice period and who signs for each party. Compare it with the September proposal and say what changed in the price adjustment clauses. Then write a short email to legal asking for a review of the differences, in a formal tone, and suggest three questions for the Thursday meeting.';

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { long: LONG, mixed: 'ما هي مدة الإشعار؟\nWhat is the notice period?' },
    template: grid(
      2,
      scene(
        'A message longer than the composer',
        'It grows to six lines and scrolls; the band stays where the thumb expects it.',
        `<form slPromptComposer>
           <textarea slPromptComposerInput aria-label="Mensagem longa" maxRows="6" [defaultValue]="long"></textarea>
           ${footer()}
         </form>`,
      ) +
        scene(
          'Two scripts in one value',
          'Each paragraph takes its own direction: the Arabic line ends at the right margin and the Portuguese question ends in its own question mark.',
          `<form slPromptComposer>
             <textarea slPromptComposerInput aria-label="Mensagem em duas escritas" [defaultValue]="mixed"></textarea>
             ${footer()}
           </form>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    moduleMetadata({
      providers: [providePromptComposerDefaults({ variant: 'outline' })],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'A provider, an exported instance, an action of your own',
        'providePromptComposerDefaults makes every composer below it outline, and messages names this send “Send message”; exportAs reaches the textarea, which already has select().',
        `<form slPromptComposer [messages]="{ send: 'Send message', stop: 'Stop' }">
           <textarea slPromptComposerInput #message="slPromptComposerInput" aria-label="Message" placeholder="Type and send"></textarea>
           <div slPromptComposerFooter>
             <button slPromptComposerAction (click)="message.inputElement.select()">Select</button>
             <button slPromptComposerSubmit></button>
           </div>
         </form>`,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Enter sends, Shift+Enter breaks a line',
        'The chat default. While an input method composes, Enter confirms the composition and sends nothing.',
        '<sl-prompt-composer-keyboard-demo submitOn="enter" />',
      ) +
        scene(
          'Mod+Enter sends, Enter breaks a line',
          'For messages with paragraphs: a comment, an e-mail. Mod is Ctrl, or ⌘ on a Mac.',
          '<sl-prompt-composer-keyboard-demo submitOn="mod-enter" />',
        ),
    ),
  }),
};
