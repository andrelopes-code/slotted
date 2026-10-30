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
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import { formatBytes } from '@slotted/core/upload';

import { SlAttachment } from './attachment';
import { ATTACHMENT_KIND_GLYPH } from './attachment-defaults';

function attachment(): SlAttachment {
  const owner = inject(SlAttachment, { optional: true });
  if (owner === null) throw new Error('An attachment part is rendered outside slAttachment.');
  return owner;
}

/**
 * Registers a describing part with its attachment for as long as it exists,
 * under the id it carries: the page's own when it wrote one.
 */
function describes(part: 'detail' | 'message') {
  const owner = attachment();
  const id = inject(new HostAttributeToken('id'), { optional: true }) ?? owner.ids[part];
  owner.describe(part, id);
  inject(DestroyRef).onDestroy(() => owner.describe(part, null));
  return { owner, id };
}

/**
 * The kind's tile with the kind's mark knocked out of it, or the thumbnail the
 * page gives. A thumbnail that fails to load returns to the tile: the failure
 * is this part's own state, not a state of the file. Hidden from assistive
 * technology, because the name already says what the file is.
 */
@Component({
  selector: '[slAttachmentPreview]',
  standalone: true,
  exportAs: 'slAttachmentPreview',
  imports: [SlGlyph, SlIcon],
  template: `@if (picture()) {
      <img alt="" decoding="async" loading="lazy" [src]="src()" (error)="failed.set(src())" />
    } @else {
      <span slIcon><svg slGlyph [name]="glyph()"></svg></span>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'aria-hidden': 'true',
    'data-part': 'preview',
    'data-part-preview': '',
    '[attr.data-kind]': 'owner.kind()',
    '[attr.data-extension]': 'extension()',
  },
})
export class SlAttachmentPreview {
  /** A thumbnail. Absent, or failing to load, the kind's tile is drawn instead. */
  readonly src = input<string | undefined>(undefined);

  protected readonly owner = attachment();
  protected readonly failed = signal<string | undefined>(undefined);
  protected readonly picture = computed(() => {
    const src = this.src();
    return src !== undefined && src !== this.failed();
  });
  protected readonly glyph = computed(() => ATTACHMENT_KIND_GLYPH[this.owner.kind()]);
  protected readonly extension = computed(() => {
    const extension = this.owner.split().extension;
    return extension === '' ? this.owner.t('noExtension') : extension.slice(1).toUpperCase();
  });
}

/** The text column, and the one box in the attachment that may shrink. */
@Directive({
  selector: '[slAttachmentBody]',
  standalone: true,
  exportAs: 'slAttachmentBody',
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlAttachmentBody {}

/**
 * The file name as two runs — the stem, which shrinks to an ellipsis, and the
 * extension, which does not — in the name's own direction. Content the page
 * projects replaces the two runs.
 */
@Component({
  selector: '[slAttachmentFilename]',
  standalone: true,
  exportAs: 'slAttachmentFilename',
  template: `<ng-content
    ><span data-part="name" data-part-name="">{{ owner.split().stem }}</span>
    @if (owner.split().extension) {
      <span data-part="extension" data-part-extension="">{{ owner.split().extension }}</span>
    }
  </ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'filename',
    'data-part-filename': '',
    '[attr.dir]': 'dir',
  },
})
export class SlAttachmentFilename {
  protected readonly owner = attachment();
  protected readonly dir = inject(new HostAttributeToken('dir'), { optional: true }) ?? 'auto';
}

/**
 * The file's target: `<a slAttachmentTrigger [href]>` for a file with an
 * address, so `href`, `download` and a modified click stay the platform's;
 * `<button slAttachmentTrigger>` for a viewer the page opens. Named by the
 * file, described by the detail and the message, and stretched over the whole
 * attachment. A `button` takes the native `disabled` while the file is loading
 * or unavailable; an `a` takes `aria-disabled` and keeps its destination, and
 * `slAttachment` refuses the activation.
 */
@Component({
  selector: 'a[slAttachmentTrigger], button[slAttachmentTrigger]',
  standalone: true,
  exportAs: 'slAttachmentTrigger',
  imports: [SlAttachmentFilename],
  template: `<ng-content><span slAttachmentFilename></span></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'trigger',
    'data-part-trigger': '',
    '[attr.title]': 'title ?? owner.file().name',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.disabled]': "isButton && owner.blocked() ? '' : null",
    '[attr.aria-disabled]': "!isButton && owner.blocked() ? 'true' : null",
    '[attr.type]': "isButton ? (type ?? 'button') : null",
  },
})
export class SlAttachmentTrigger {
  protected readonly owner = attachment();
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
  protected readonly title = inject(new HostAttributeToken('title'), { optional: true });
  protected readonly type = inject(new HostAttributeToken('type'), { optional: true });
  /** A description the page wrote comes first; the family's ids are joined to it. */
  private readonly written = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });

  protected readonly describedBy = computed(() => {
    const described = this.owner.described();
    const ids = [
      ...(this.written === null ? [] : [this.written]),
      ...(described.detail === null ? [] : [described.detail]),
      ...(described.message === null ? [] : [described.message]),
    ];
    return ids.length === 0 ? null : ids.join(' ');
  });
}

/**
 * The line under the name. With nothing projected it writes the size with
 * `formatBytes` in the language in force; anything the page writes replaces it.
 */
@Component({
  selector: '[slAttachmentDetail]',
  standalone: true,
  exportAs: 'slAttachmentDetail',
  template: `<ng-content>{{ bytes() }}</ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'detail',
    'data-part-detail': '',
    '[attr.id]': 'wiring.id',
  },
})
export class SlAttachmentDetail {
  protected readonly wiring = describes('detail');
  protected readonly owner = this.wiring.owner;
  protected readonly bytes = computed(() => {
    const size = this.owner.file().size;
    return size === undefined ? '' : formatBytes(size, this.owner.locale());
  });
}

/** Why the file failed, or anything longer than a line the page must say about it. */
@Directive({
  selector: '[slAttachmentMessage]',
  standalone: true,
  exportAs: 'slAttachmentMessage',
  host: {
    'data-part': 'message',
    'data-part-message': '',
    '[attr.id]': 'wiring.id',
  },
})
export class SlAttachmentMessage {
  protected readonly wiring = describes('message');
}

/**
 * The transfer, as the attachment's bottom edge: `slProgressBar`, named by the
 * file so a reader hears the name and the percentage together. Without a
 * `value` the bar is indeterminate.
 */
@Component({
  selector: '[slAttachmentProgress]',
  standalone: true,
  exportAs: 'slAttachmentProgress',
  imports: [SlProgressBar],
  template: `<div
    slProgressBar
    hideLabel
    size="sm"
    [label]="owner.file().name"
    [tone]="owner.invalid() ? 'danger' : 'accent'"
    [value]="value() ?? null"
  ></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'progress', 'data-part-progress': '' },
})
export class SlAttachmentProgress {
  /** Per cent, 0 to 100. Absent, the bar is indeterminate. */
  readonly value = input<number | null | undefined>(undefined);

  protected readonly owner = attachment();
}

/**
 * The controls the application offers on the file, beside the trigger and
 * above its stretched target: interactive content may not nest inside `a` or
 * `button`.
 */
@Directive({
  selector: '[slAttachmentActions]',
  standalone: true,
  exportAs: 'slAttachmentActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlAttachmentActions {}

/**
 * One icon control of the application's own, on the `button` or the `a` the
 * page wrote — an `a` with `download` is a download. It needs an
 * `aria-label`. An unavailable attachment disables it: the native `disabled`
 * on a button, `aria-disabled` on a link, whose activation `slAttachment`
 * refuses.
 */
@Directive({
  selector: 'button[slAttachmentAction], a[slAttachmentAction]',
  standalone: true,
  exportAs: 'slAttachmentAction',
  host: {
    'data-part': 'action',
    'data-part-action': '',
    '[attr.disabled]': "isButton && owner.disabled() ? '' : null",
    '[attr.aria-disabled]': "!isButton && owner.disabled() ? 'true' : null",
    '[attr.type]': "isButton ? (type ?? 'button') : null",
  },
})
export class SlAttachmentAction {
  protected readonly owner = attachment();
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
  protected readonly type = inject(new HostAttributeToken('type'), { optional: true });
}

/**
 * Asks to take the attachment out of its list, on the `button` the page
 * wrote. Hidden unless the attachment is `removable`, so a read-only thread
 * shows no control that does nothing. Its name is the word and the file,
 * `Remove claim-form.pdf`, unless the page wrote its own `aria-label`.
 */
@Component({
  selector: 'button[slAttachmentRemove]',
  standalone: true,
  exportAs: 'slAttachmentRemove',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'remove',
    'data-part-remove': '',
    type: 'button',
    '[attr.hidden]': "owner.removable() ? null : ''",
    '[attr.aria-label]': 'label()',
    '[attr.disabled]': "owner.disabled() ? '' : null",
    '(click)': 'owner.request("remove", $event)',
  },
})
export class SlAttachmentRemove {
  protected readonly owner = attachment();
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly label = computed(
    () => this.written ?? this.owner.t('remove', { name: this.owner.file().name }),
  );
}
