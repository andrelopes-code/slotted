import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import {
  messageMessages,
  type FamilyTranslator,
  type MessageMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectMessageDefaults } from './message-defaults';
import type {
  MessageActionsVisibility,
  MessageAlign,
  MessageChangeReason,
  MessageLayout,
  MessageRetryRequest,
  MessageStatus,
} from './message-defaults';

let nextId = 0;

/**
 * A run of messages from one sender on the `div` the page wrote. The rows
 * inside it stand two pixels apart, the corners that face each other on the
 * sender's side are drawn in, and a row with no avatar still stands on the
 * column the run's avatar holds — read from the DOM by the stylesheet.
 */
@Directive({
  selector: '[slMessageGroup]',
  standalone: true,
  exportAs: 'slMessageGroup',
  host: {
    'data-ui': 'message',
    'data-ui-message': '',
    'data-part': 'group',
    'data-part-group': '',
  },
})
export class SlMessageGroup {
  /** The layout every row in the run takes unless it states its own. */
  readonly layout = input<MessageLayout | undefined>(undefined);
}

/**
 * One message of a conversation, on the `article` the page wrote, named by
 * its author.
 *
 * **The side is asked once, here.** A bubble inside the row follows `align`
 * and, when it states no painting, takes the reader's own for `end` — the
 * accent's fill — and none for a thread.
 *
 * **The status is a fact about delivery.** `sending` and `streaming` are
 * `aria-busy` and `data-loading`, `failed` is `data-invalid`, `read` is
 * `data-read`.
 *
 * **Versions.** With `versionCount` of two or more, `slMessageVersions`
 * pages between them; `[(version)]` is two-way and every move is asked
 * first through `versionChangeRequest`.
 */
@Component({
  selector: '[slMessage]',
  standalone: true,
  exportAs: 'slMessage',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/message/message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'message',
    'data-ui-message': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-align]': 'align()',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-actions]': 'resolvedActions()',
    '[attr.data-status]': 'status() ?? null',
    '[attr.data-loading]': "busy() ? '' : null",
    '[attr.data-invalid]': "status() === 'failed' ? '' : null",
    '[attr.data-read]': "status() === 'read' ? '' : null",
    '[attr.aria-busy]': "busy() ? 'true' : null",
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlMessage {
  /** The sender's side. `end` is the reader's own message. */
  readonly align = input<MessageAlign>('start');
  /** Bubbles in a conversation, or rows of a comment thread. Falls back to the group, then the token. */
  readonly layout = input<MessageLayout | undefined>(undefined);
  readonly actionsVisibility = input<MessageActionsVisibility | undefined>(undefined);
  readonly status = input<MessageStatus | undefined>(undefined);
  /** The version on screen, from 0. Two-way; every move is asked first. */
  readonly version = model(0);
  /** How many versions exist; the pager draws when there are two or more. */
  readonly versionCount = input(1);
  /**
   * Words laid over the catalog of the language in force, key by key, for
   * this row and every part and bubble inside it.
   */
  readonly messages = input<PartialMessages<MessageMessages> | undefined>(undefined);

  /** Emitted before the version moves; `cancel()` keeps it. */
  readonly versionChangeRequest = output<ChangeRequest<number>>();
  /** Asks to send the message again; `slBubbleRetry` emits it. */
  readonly retry = output<MessageRetryRequest>();

  private readonly defaults = injectMessageDefaults();
  private readonly group = inject(SlMessageGroup, { optional: true });
  private readonly ownLabel =
    inject(new HostAttributeToken('aria-label'), { optional: true }) ??
    inject(new HostAttributeToken('aria-labelledby'), { optional: true });

  readonly authorId = `sl-message-${nextId++}-author`;
  /** The family's words in the language in force, with this row's `messages` laid over them. */
  readonly t = injectMessages(messageMessages, this.messages);
  private readonly authorPresent = signal(false);

  readonly resolvedLayout = computed(
    () => this.layout() ?? this.group?.layout() ?? this.defaults.layout,
  );
  readonly resolvedActions = computed(
    () => this.actionsVisibility() ?? this.defaults.actionsVisibility,
  );
  readonly busy = computed(() => this.status() === 'sending' || this.status() === 'streaming');
  /** The author names the article unless the page named it: `aria-labelledby` would outrank its `aria-label`. */
  protected readonly labelledBy = computed(() =>
    this.ownLabel === null && this.authorPresent() ? this.authorId : null,
  );

  registerAuthor(present: boolean) {
    this.authorPresent.set(present);
  }

  requestVersion(next: number, reason: MessageChangeReason, source: Event) {
    const bounded = Math.min(Math.max(0, next), Math.max(0, this.versionCount() - 1));
    const state = createControllable<number>({
      initial: this.version(),
      onRequest: (request) => this.versionChangeRequest.emit(request),
    });
    if (state.request(bounded, reason, source)) this.version.set(bounded);
  }

  requestRetry(reason: MessageChangeReason, source: Event) {
    this.retry.emit({ reason, source });
  }
}

/**
 * The family's words for a part that may stand outside a row: the row's, with
 * its `messages` laid over the language in force, or the language alone.
 */
export function injectMessageWords(): FamilyTranslator<MessageMessages> {
  const own = injectMessages(messageMessages);
  return inject(SlMessage, { optional: true })?.t ?? own;
}
