import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { createRemovalFocus } from '@slotted/core/focus';
import {
  attachmentMessages,
  type AttachmentMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { fileKind, splitName } from '@slotted/core/upload';

import { ATTACHMENT_CONTROL_SELECTOR, injectAttachmentDefaults } from './attachment-defaults';
import type {
  AttachmentFile,
  AttachmentLayout,
  AttachmentOrientation,
  AttachmentRemoveReason,
  AttachmentRemoveRequest,
  AttachmentSize,
} from './attachment-defaults';

let nextId = 0;

/**
 * A set of attachments on the `ul` the page wrote: a column, a wrapping grid
 * or one line that scrolls. It hands its size and orientation to every
 * attachment that does not state its own.
 *
 * It keeps the keyboard where it was when an attachment leaves: focus goes to
 * the control that took the removed one's place, then to the last one, then
 * to the list itself — which is why the list takes `tabindex="-1"`.
 * `removal-focus` observes the DOM, so it is right however the consumer
 * removed the file.
 */
@Directive({
  selector: '[slAttachmentGroup]',
  standalone: true,
  exportAs: 'slAttachmentGroup',
  host: {
    'data-ui': 'attachment',
    'data-ui-attachment': '',
    'data-part': 'group',
    'data-part-group': '',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.tabindex]': 'tabindex',
  },
})
export class SlAttachmentGroup {
  /** A column, a wrapping grid, or one line that scrolls. Falls back to the token. */
  readonly layout = input<AttachmentLayout | undefined>(undefined);
  /** Handed to every attachment that does not state its own. */
  readonly size = input<AttachmentSize | undefined>(undefined);
  /** Handed to every attachment that does not state its own. */
  readonly orientation = input<AttachmentOrientation | undefined>(undefined);

  private readonly defaults = injectAttachmentDefaults();
  /** A `tabindex` the page wrote is kept; otherwise the list takes focus only by script. */
  protected readonly tabindex =
    inject(new HostAttributeToken('tabindex'), { optional: true }) ?? '-1';

  readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedOrientation = computed(() => this.orientation() ?? this.defaults.orientation);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const removal = createRemovalFocus(host, { itemSelector: ATTACHMENT_CONTROL_SELECTOR });
    inject(DestroyRef).onDestroy(() => removal.destroy());
  }
}

/**
 * One file that already belongs to something — a message, a record, a tray —
 * on the `li` (inside `slAttachmentGroup`) or `div` (alone) the page wrote.
 * The parts inside read the file from here: the tile its kind, the trigger its
 * name, the detail its size.
 *
 * **Removal is a request.** `removable` draws `slAttachmentRemove` and makes
 * `Backspace` and `Delete` answer anywhere inside the attachment; `(remove)`
 * carries the reason and the file, and the list stays the page's. A held key
 * does not repeat the request.
 *
 * **The refusal runs first.** A click inside the trigger, or on a family
 * action written on an `a`, is refused here in the capture phase while the
 * attachment is loading or disabled: a directive's host listener and a
 * `(click)` the page wrote on the same element run in registration order, and
 * the page's was registered first — the ordering `list-item` found.
 */
@Component({
  selector: '[slAttachment]',
  standalone: true,
  exportAs: 'slAttachment',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/attachment/attachment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'attachment',
    'data-ui-attachment': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-kind]': 'kind()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-invalid]': "invalid() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '(keydown)': 'handleKeydown($event)',
  },
})
export class SlAttachment {
  /** The file: its name, and its media type and size when they are known. */
  readonly file = input.required<AttachmentFile>();
  /** The room the attachment gets. Falls back to the group, then the token, then `md`. */
  readonly size = input<AttachmentSize | undefined>(undefined);
  /** A row, or a card stood on end. Falls back to the group, then the token. */
  readonly orientation = input<AttachmentOrientation | undefined>(undefined);
  /** The file failed; painted from `data-invalid`, never `aria-invalid` on a list item. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Still on its way: `aria-busy`, the trigger refused, remove still operable. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Cannot be reached: the trigger, every action and remove are refused. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Draws `slAttachmentRemove` and lets `Backspace` and `Delete` ask for removal. */
  readonly removable = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * remove control's name (`remove`, with the file's `{name}`) and the tile's
   * word for a file without an extension.
   */
  readonly messages = input<PartialMessages<AttachmentMessages> | undefined>(undefined);

  /** Asks to be taken out of the list. Not emitted while disabled, nor for a repeated key. */
  readonly remove = output<AttachmentRemoveRequest>();

  private readonly defaults = injectAttachmentDefaults();
  private readonly group = inject(SlAttachmentGroup, { optional: true });

  readonly id = `sl-attachment-${nextId++}`;
  readonly ids = { detail: `${this.id}-detail`, message: `${this.id}-message` };
  /** The language in force, which writes the size the detail line shows. */
  readonly locale = injectLocale();
  /** The family's words in the language in force, with this attachment's `messages` laid over them. */
  readonly t = injectMessages(attachmentMessages, this.messages);

  readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? this.defaults.size);
  readonly resolvedOrientation = computed(
    () => this.orientation() ?? this.group?.orientation() ?? this.defaults.orientation,
  );
  readonly kind = computed(() => {
    const file = this.file();
    return fileKind({ name: file.name, type: file.type ?? '' });
  });
  readonly split = computed(() => splitName(this.file().name));
  readonly blocked = computed(() => this.disabled() || this.loading());

  /**
   * The ids of the describing parts on the page, so the trigger names only
   * what exists — and the id each part actually carries, which is the page's
   * own when it wrote one.
   */
  readonly described = signal<{ detail: string | null; message: string | null }>({
    detail: null,
    message: null,
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const refuse = (event: Event) => {
      const target = event.target as Element | null;
      const trigger = target?.closest('[data-part="trigger"]') != null;
      const link = target?.closest('a[data-part="action"]') != null;
      if (!(trigger && this.blocked()) && !(link && this.disabled())) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    host.addEventListener('click', refuse, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      host.removeEventListener('click', refuse, { capture: true }),
    );
  }

  describe(part: 'detail' | 'message', id: string | null) {
    this.described.update((current) =>
      current[part] === id ? current : { ...current, [part]: id },
    );
  }

  request(reason: AttachmentRemoveReason, source: Event) {
    if (!this.removable() || this.disabled()) return;
    this.remove.emit({ reason, file: this.file(), source });
  }

  protected handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.repeat) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (!this.removable() || this.disabled()) return;
    /* A field the page put inside an attachment keeps its own editing keys. */
    const target = event.target as HTMLElement;
    if (target.isContentEditable || target.closest('input, textarea, select') !== null) return;
    event.preventDefault();
    this.request('keyboard', event);
  }
}
