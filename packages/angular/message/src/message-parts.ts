import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlMessage } from './message';
import { reasonOf } from './message-defaults';
import type { MessageActivityStepStatus, MessageStatus } from './message-defaults';

function message(): SlMessage {
  const owner = inject(SlMessage, { optional: true });
  if (owner === null) throw new Error('A message part is rendered outside slMessage.');
  return owner;
}

/** The box the sender's avatar stands in: at the foot of a run, or beside the name in a thread. */
@Directive({
  selector: '[slMessageAvatar]',
  standalone: true,
  host: { 'data-part': 'avatar', 'data-part-avatar': '' },
})
export class SlMessageAvatar {}

/** The column of the words: the header, the bubbles, the attachments and the footer. */
@Directive({
  selector: '[slMessageBody]',
  standalone: true,
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlMessageBody {}

/** The name and, in a thread, the hour, over the words. */
@Directive({
  selector: '[slMessageHeader]',
  standalone: true,
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlMessageHeader {}

/** What is said about the message under it: a receipt outside a bubble, the actions, the versions. */
@Directive({
  selector: '[slMessageFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlMessageFooter {}

/** The hour, on the `time` element the page wrote with its `datetime`. */
@Directive({
  selector: 'time[slMessageTime]',
  standalone: true,
  host: { 'data-part': 'time', 'data-part-time': '' },
})
export class SlMessageTime {}

/**
 * The sender's name. While it is on the page the article is named by it, so a
 * screen reader that moves from article to article hears who spoke. A page
 * `id` is kept.
 */
@Directive({
  selector: '[slMessageAuthor]',
  standalone: true,
  host: { 'data-part': 'author', 'data-part-author': '', '[attr.id]': 'id' },
})
export class SlMessageAuthor {
  private readonly owner = message();
  protected readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) ?? this.owner.authorId;

  constructor() {
    this.owner.registerAuthor(true);
    inject(DestroyRef).onDestroy(() => this.owner.registerAuthor(false));
  }
}

/**
 * The hour and the delivery mark inside a bubble, riding at the end of the
 * last line. A receipt inside it draws its mark and keeps its word for
 * assistive technology.
 */
@Directive({
  selector: '[slBubbleMeta]',
  standalone: true,
  host: { 'data-part': 'meta', 'data-part-meta': '' },
})
export class SlBubbleMeta {}

const RECEIPT_GLYPH = {
  sending: 'clock',
  sent: 'check',
  delivered: 'check-check',
  read: 'check-check',
} as const;

/**
 * Where the message is in its delivery. Inside `slBubbleMeta` it is a mark
 * beside the hour with the word hidden for assistive technology; anywhere
 * else it is the word alone — a mark beside a word of twelve pixels is two
 * voices saying one thing.
 */
@Component({
  selector: '[slMessageReceipt]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `@if (glyph(); as name) {
      <span slIcon><svg slGlyph [name]="name"></svg></span><span>{{ word() }}</span>
    } @else {
      {{ word() }}
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'receipt', 'data-part-receipt': '', '[attr.data-status]': 'resolved()' },
})
export class SlMessageReceipt {
  /** Falls back to the row's status. */
  readonly status = input<Exclude<MessageStatus, 'streaming'> | undefined>(undefined);

  private readonly owner = message();
  private readonly inMeta = inject(SlBubbleMeta, { optional: true }) !== null;

  readonly resolved = computed(() => {
    const own = this.owner.status();
    return this.status() ?? (own === 'streaming' ? undefined : own) ?? 'sent';
  });
  protected readonly word = computed(() => this.owner.t(this.resolved()));
  protected readonly glyph = computed(() => {
    const status = this.resolved();
    return this.inMeta && status !== 'failed' ? RECEIPT_GLYPH[status] : null;
  });
}

/** The message's own actions — copy, reply, rate — as a toolbar the row reveals. */
@Directive({
  selector: '[slMessageActions]',
  standalone: true,
  host: {
    'data-part': 'actions',
    'data-part-actions': '',
    role: 'toolbar',
    '[attr.aria-label]': 'label()',
  },
})
export class SlMessageActions {
  private readonly owner = message();
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly label = computed(() => this.written ?? this.owner.t('actions'));
}

/** What a reply is doing before it has words, as a short log of steps; a status region. */
@Directive({
  selector: '[slMessageActivity]',
  standalone: true,
  host: { 'data-part': 'activity', 'data-part-activity': '', role: 'status' },
})
export class SlMessageActivity {}

/** One step of an activity: done, in progress, or waiting. */
@Component({
  selector: '[slMessageActivityStep]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `@switch (status()) {
      @case ('complete') {
        <span slIcon><svg slGlyph name="check"></svg></span>
      }
      @case ('current') {
        <span aria-hidden="true"
          ><span aria-hidden="true" data-ui="spinner" data-ui-spinner=""
            ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="8.875" />
              <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg></span
        ></span>
      }
      @default {
        <span aria-hidden="true"></span>
      }
    }
    <span><ng-content></ng-content></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'activity-step',
    'data-part-activity-step': '',
    '[attr.data-complete]': "status() === 'complete' ? '' : null",
    '[attr.data-current]': "status() === 'current' ? '' : null",
    '[attr.aria-current]': "status() === 'current' ? 'step' : null",
  },
})
export class SlMessageActivityStep {
  readonly status = input<MessageActivityStepStatus>('current');
}

/**
 * `2 de 3` between two controls that page through a reply's versions. It
 * draws its controls only while there are two or more; they stop at the ends
 * rather than wrapping. `ArrowLeft` and `ArrowRight` page as well, mirrored in
 * a right-to-left document.
 */
@Component({
  selector: '[slMessageVersions]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `@if (owner.versionCount() > 1) {
    <button
      type="button"
      data-part="version-previous"
      data-part-version-previous=""
      [attr.aria-label]="owner.t('previousVersion')"
      [disabled]="owner.version() <= 0"
      (click)="step(-1, $event)"
    >
      <span slIcon><svg slGlyph name="chevron-right"></svg></span>
    </button>
    <span data-part="version-label" data-part-version-label="" aria-live="polite">{{
      label()
    }}</span>
    <button
      type="button"
      data-part="version-next"
      data-part-version-next=""
      [attr.aria-label]="owner.t('nextVersion')"
      [disabled]="owner.version() >= owner.versionCount() - 1"
      (click)="step(1, $event)"
    >
      <span slIcon><svg slGlyph name="chevron-right"></svg></span>
    </button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'versions',
    'data-part-versions': '',
    role: 'group',
    '[attr.aria-label]': "owner.t('versions')",
    '[attr.hidden]': "owner.versionCount() > 1 ? null : ''",
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlMessageVersions {
  protected readonly owner = message();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly label = computed(() =>
    this.owner.t('versionLabel', {
      current: this.owner.version() + 1,
      total: this.owner.versionCount(),
    }),
  );

  protected step(delta: number, event: MouseEvent) {
    this.owner.requestVersion(this.owner.version() + delta, reasonOf(event), event);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const rtl = getComputedStyle(this.host).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key !== forward && event.key !== back) return;
    event.preventDefault();
    this.owner.requestVersion(
      this.owner.version() + (event.key === forward ? 1 : -1),
      'keyboard',
      event,
    );
  }
}
