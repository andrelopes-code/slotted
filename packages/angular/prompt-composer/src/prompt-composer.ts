import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';
import { injectMessages } from '@slotted/angular/i18n';
import {
  type PartialMessages,
  promptComposerMessages,
  type PromptComposerMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { selectFiles } from '@slotted/core/upload';

import { injectPromptComposerDefaults, SlPromptComposerControl } from './prompt-composer-defaults';
import type {
  PromptComposerAttachEvent,
  PromptComposerSize,
  PromptComposerStatus,
  PromptComposerStopEvent,
  PromptComposerSubmitOn,
  PromptComposerSubmitReason,
  PromptComposerVariant,
  PromptComposerEmphasis,
} from './prompt-composer-defaults';

/** Whether a drag carries files, rather than a selection of text. */
function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/**
 * A message being written: the consumer's own `form`, around a textarea, a
 * band above for what the message carries and a band below for what it is
 * sent with.
 *
 * The value is the textarea's, so a reactive form binds there; the status is
 * the application's; the attachments are the application's too — the
 * composer hands over the files after the selection rules `upload` applies,
 * and draws nothing of them.
 */
@Component({
  selector: 'form[slPromptComposer]',
  standalone: true,
  exportAs: 'slPromptComposer',
  template: `<ng-content />
    @if (resolvedEmphasis() === 'ring') {
      <span aria-hidden="true" data-part="glow" data-part-glow=""></span>
      <span aria-hidden="true" data-part="ring" data-part-ring=""></span>
    }`,
  styleUrl: '../../../styles/src/prompt-composer/prompt-composer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'prompt-composer',
    'data-ui-prompt-composer': '',
    'data-part': 'root',
    'data-part-root': '',
    novalidate: '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-emphasis]': "resolvedEmphasis() === 'ring' ? 'ring' : null",
    '[attr.data-status]': 'status()',
    '[attr.data-loading]': "busy() ? '' : null",
    '[attr.data-disabled]': "control()?.resolvedDisabled() === true ? '' : null",
    '[attr.data-readonly]': "control()?.resolvedReadOnly() === true ? '' : null",
    '[attr.data-invalid]': "control()?.resolvedInvalid() === true ? '' : null",
    '[attr.data-drop-target]': "dropTarget() ? '' : null",
    '(submit)': 'onSubmit($event)',
    '(mousedown)': 'onMouseDown($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class SlPromptComposer {
  readonly size = input<PromptComposerSize | undefined>(undefined);
  readonly variant = input<PromptComposerVariant | undefined>(undefined);
  /** Defaults to the token, then to `none`. */
  readonly emphasis = input<PromptComposerEmphasis | undefined>(undefined);
  /** Where the request stands. The application owns it. */
  readonly status = input<PromptComposerStatus>('ready');
  readonly submitOn = input<PromptComposerSubmitOn | undefined>(undefined);
  /** Whether the send is available. Defaults to "the value has something besides white space". */
  readonly canSubmit = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  /** The file types the attach button, a paste and a drop accept. */
  readonly accept = input<string | undefined>(undefined);
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly maxSize = input<number | undefined, unknown>(undefined, {
    transform: (value) => (value == null ? undefined : numberAttribute(value)),
  });
  readonly maxFiles = input<number | undefined, unknown>(undefined, {
    transform: (value) => (value == null ? undefined : numberAttribute(value)),
  });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * names of the attach and submit buttons for each status (`send`, `sending`,
   * `stop`, `retry`), and the `sending` and `stopped` announcements.
   */
  readonly messages = input<PartialMessages<PromptComposerMessages> | undefined>(undefined);

  /** Before the message is sent; `cancel()` keeps the value where it is. */
  readonly valueSubmit = output<ChangeRequest<string>>();
  /** The stop button, while the status is `streaming`. */
  readonly stop = output<PromptComposerStopEvent>();
  /** Files from the attach button, a paste or a drop, after the selection rules. */
  readonly attach = output<PromptComposerAttachEvent>();

  readonly defaults = injectPromptComposerDefaults();
  /** The family's words in the language in force, with this composer's `messages` laid over them. */
  readonly t = injectMessages(promptComposerMessages, this.messages);
  private readonly field = inject(SlField, { optional: true });
  private readonly element: HTMLFormElement = inject(ElementRef).nativeElement;

  readonly control = contentChild(SlPromptComposerControl, { descendants: true });
  protected readonly dropTarget = signal(false);

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedEmphasis = computed(() => this.emphasis() ?? this.defaults.emphasis);
  readonly resolvedSubmitOn = computed(() => this.submitOn() ?? this.defaults.submitOn);
  readonly busy = computed(() => this.status() === 'submitted' || this.status() === 'streaming');
  readonly resolvedCanSubmit = computed(() => {
    const control = this.control();
    if (control === undefined || this.busy()) return false;
    if (control.resolvedDisabled() === true || control.resolvedReadOnly() === true) return false;
    return this.canSubmit() ?? control.current().trim() !== '';
  });
  readonly off = computed(
    () =>
      this.control()?.resolvedDisabled() === true || this.control()?.resolvedReadOnly() === true,
  );

  constructor() {
    /* The request travelling is announced once, as it starts. */
    let previous: PromptComposerStatus = 'ready';
    effect(() => {
      const status = this.status();
      if (status === 'submitted' && previous !== 'submitted') {
        untracked(() => this.announce(this.t('sending')));
      }
      previous = status;
    });
  }

  private announce(message: string) {
    getLiveAnnouncer(this.element.ownerDocument).announce(message);
  }

  /** Sends what the textarea holds, unless the send is unavailable or refused. */
  submitWith(reason: PromptComposerSubmitReason, source: Event) {
    const control = this.control();
    if (control === undefined || !this.resolvedCanSubmit()) return;
    let cancelled = false;
    const state = createControllable<string>({
      controlled: undefined,
      initial: '',
      equals: () => false,
      onRequest: (request) => {
        this.valueSubmit.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(control.current(), reason, source);
    if (cancelled) return;
    control.clearAfterSubmit(source);
    control.focus();
  }

  stopWith(reason: PromptComposerSubmitReason, source: Event) {
    this.stop.emit({ reason, source });
    this.announce(this.t('stopped'));
    this.control()?.focus();
  }

  attachFiles(files: readonly File[], reason: PromptComposerAttachEvent['reason'], source: Event) {
    if (files.length === 0 || this.off()) return;
    const outcome = selectFiles(files, [], {
      accept: this.accept(),
      maxFiles: this.maxFiles(),
      maxSize: this.maxSize(),
      multiple: this.multiple(),
    });
    const accepted = outcome.files
      .filter((entry) => entry.status !== 'rejected' && entry.file !== undefined)
      .map((entry) => entry.file as File);
    this.attach.emit({ files: accepted, reason, rejected: outcome.rejected, source });
  }

  protected onSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.submitWith('keyboard', event);
  }

  /** A press on the frame's padding or a band's empty space puts the caret in the value. */
  protected onMouseDown(event: MouseEvent) {
    const part = (event.target as HTMLElement).getAttribute('data-part');
    if (part !== 'root' && part !== 'header' && part !== 'footer') return;
    event.preventDefault();
    this.control()?.focus();
  }

  protected onDragOver(event: DragEvent) {
    if (!carriesFiles(event) || this.off()) return;
    event.preventDefault();
    this.dropTarget.set(true);
  }

  protected onDragLeave(event: DragEvent) {
    const next = event.relatedTarget as Node | null;
    if (next === null || !this.element.contains(next)) this.dropTarget.set(false);
  }

  protected onDrop(event: DragEvent) {
    this.dropTarget.set(false);
    if (!carriesFiles(event)) return;
    event.preventDefault();
    this.attachFiles(Array.from(event.dataTransfer?.files ?? []), 'drop', event);
  }
}
