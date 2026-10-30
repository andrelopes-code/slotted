import { hostSelectorKey } from '@slotted/core/selector-key';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';

import { SlDialogBase } from './dialog';
import type { DialogOpenReason, DialogTone } from './dialog-defaults';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is how `Enter`, `Space` and a pointer are told apart without
 * a key listener existing for something the platform already handles.
 */
function activationReason(event: MouseEvent): DialogOpenReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The part a control names. On an element another family draws — `slButton` —
 * that family's root stays its part: two directives write one attribute, and
 * the family the element is drawn by keeps it, as React's `render` does by
 * spreading the button's props last.
 */
function ownPart(native: HTMLElement, part: string): string | null {
  return native.hasAttribute('data-ui') ? native.getAttribute('data-part') : part;
}

/**
 * The control that opens a layer.
 *
 * It is the consumer's own element, which is what this ecosystem composes with:
 * `<button slButton slDialogTrigger [dialog]="d">` is the library's own button
 * and this adds the wiring to it. React reaches the same place with `render`,
 * because there the component owns the tag.
 *
 * The trigger is also the layer's *branch*: a press on it is inside the layer
 * as far as `dismissable-layer` is concerned, or opening would immediately be
 * read as an outside press and close what it just opened.
 */
@Directive({
  selector: '[slDialogTrigger]',
  standalone: true,
  exportAs: 'slDialogTrigger',
  host: {
    '[attr.data-part]': 'part',
    type: 'button',
    '[attr.aria-haspopup]': "'dialog'",
    '[attr.aria-expanded]': 'dialog().open()',
    '[attr.aria-controls]': 'controls()',
    '[attr.data-open]': "dialog().open() ? '' : null",
    '[id]': 'dialog().triggerId',
    '(click)': 'press($event)',
  },
})
export class SlDialogTrigger implements OnInit, OnDestroy {
  /** The layer this control opens, reached with a template reference variable. */
  readonly dialog = input.required<SlDialogBase>({ alias: 'slDialogTrigger' });

  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /** `trigger`, unless the element is another family's root. */
  protected readonly part = hostSelectorKey(this.native, 'part', ownPart(this.native, 'trigger'));

  protected readonly controls = computed(() =>
    this.dialog().mounted() ? this.dialog().contentId : null,
  );

  ngOnInit() {
    this.dialog().triggerNode.set(this.native);
  }

  ngOnDestroy() {
    if (this.dialog().triggerNode() === this.native) this.dialog().triggerNode.set(null);
  }

  protected press(event: MouseEvent) {
    /* The consumer's own handler ran first, and `preventDefault()` refuses the
       open — composed with, never replaced. */
    if (event.defaultPrevented) return;
    this.dialog().request(true, activationReason(event), undefined, event);
  }
}

/**
 * The header, and the one part of it the family renders rather than the
 * consumer: the full-screen toggle, when the layer was asked for one.
 *
 * It is written in the DOM after whatever the consumer projected. The title
 * and the description come first for a reader moving through the header, and
 * the two corner controls are adjacent peers whose order carries no meaning —
 * a toggle written first would be announced ahead of the name of the dialog it
 * belongs to. The stylesheet puts it in the column before the close, which is
 * where a window's controls put it.
 *
 * It is a component on the consumer's own `<header>`, so the toggle is a child
 * of that element written after the projected content, which is the DOM React
 * reaches by rendering the part; the two have to land together.
 *
 * `aria-pressed` says which way the toggle is set, so the name stays one word
 * in every state: a label that changed with the state would be read as a
 * second control. The mark is the opposite of the state, because a mark on a
 * control says what pressing it does.
 */
@Component({
  selector: '[slDialogHeader]',
  standalone: true,
  exportAs: 'slDialogHeader',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content />
    @if (dialog.resolvedFullscreenToggle()) {
      <button
        type="button"
        data-part="fullscreen"
        data-part-fullscreen=""
        [attr.aria-label]="dialog.t('fullScreen')"
        [attr.aria-pressed]="dialog.resolvedFullscreen()"
        (click)="toggle($event)"
      >
        <span slIcon
          ><svg slGlyph [name]="dialog.resolvedFullscreen() ? 'minimize' : 'maximize'"></svg
        ></span>
      </button>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlDialogHeader {
  protected readonly dialog = inject(SlDialogBase);

  protected toggle(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.dialog.requestFullscreen(
      !this.dialog.resolvedFullscreen(),
      activationReason(event) === 'keyboard' ? 'keyboard' : 'pointer',
      event,
    );
  }
}

/** The visible name, which `aria-labelledby` points at. */
@Directive({
  selector: '[slDialogTitle]',
  standalone: true,
  exportAs: 'slDialogTitle',
  host: { 'data-part': 'title', 'data-part-title': '', '[id]': 'dialog.titleId' },
})
export class SlDialogTitle implements OnInit, OnDestroy {
  protected readonly dialog = inject(SlDialogBase);

  ngOnInit() {
    this.dialog.hasTitle.set(true);
  }

  ngOnDestroy() {
    this.dialog.hasTitle.set(false);
  }
}

/**
 * The sentence that says what the dialog is about. The alert dialog pattern
 * makes it mandatory; the modal dialog pattern makes it optional and advises
 * against it for structured content.
 */
@Directive({
  selector: '[slDialogDescription]',
  standalone: true,
  exportAs: 'slDialogDescription',
  host: { 'data-part': 'description', 'data-part-description': '', '[id]': 'dialog.descriptionId' },
})
export class SlDialogDescription implements OnInit, OnDestroy {
  protected readonly dialog = inject(SlDialogBase);

  ngOnInit() {
    this.dialog.hasDescription.set(true);
  }

  ngOnDestroy() {
    this.dialog.hasDescription.set(false);
  }
}

/**
 * The one row that scrolls, and the row `aria-busy` belongs to while the
 * content is still on its way — the header, the close button and Escape all
 * stay operable, because a loading dialog a reader cannot leave is the worse
 * failure of the two.
 */
@Directive({
  selector: '[slDialogBody]',
  standalone: true,
  exportAs: 'slDialogBody',
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.aria-busy]': "dialog.loading() ? 'true' : null",
  },
})
export class SlDialogBody {
  protected readonly dialog = inject(SlDialogBase);
}

@Directive({
  selector: '[slDialogFooter]',
  standalone: true,
  exportAs: 'slDialogFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDialogFooter {}

/**
 * The ✕ in the corner. It carries `dismiss`, which is the word the closed
 * vocabulary in `docs/state-and-events.md` already has for what a close button
 * means; `docs/component-features.md` §8 calls the source `closeButton`, and a
 * twelfth reason would be a change to a contract outside this family.
 */
@Component({
  selector: '[slDialogClose]',
  standalone: true,
  exportAs: 'slDialogClose',
  imports: [SlGlyph, SlIcon],
  /* The cross is drawn unless the consumer wrote content of their own. */
  template: `<ng-content
    ><span slIcon><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'close',
    'data-part-close': '',
    type: 'button',
    '[attr.aria-label]': 'label()',
    '(click)': 'press($event)',
  },
})
export class SlDialogClose {
  /** The result the close carries out, which is the platform's `returnValue`. */
  readonly value = input<string | undefined>(undefined);

  private readonly dialog = inject(SlDialogBase);
  /** A consumer's own `aria-label`, which wins over the catalog. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly label = computed(() => this.ownLabel ?? this.dialog.t('close'));

  constructor() {
    if (this.dialog.isAlert()) {
      throw new Error(
        'sl-alert-dialog has no close part: a confirmation is answered with slAlertDialogCancel or slAlertDialogAction, not dismissed by an ✕.',
      );
    }
  }

  protected press(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.dialog.request(false, 'dismiss', this.value(), event);
  }
}

/**
 * The glyph each tone draws, and the warning diamond where no tone was resolved. Warning
 * and danger differ in silhouette as well as color, because under forced
 * colors the silhouette is all that is left.
 */
const TONE_GLYPH: Record<DialogTone, GlyphName> = {
  accent: 'status-info',
  secondary: 'status-info',
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * The tone's own mark, which is geometry rather than a character. A mark the
 * consumer writes as content replaces the tone's.
 */
@Component({
  selector: '[slAlertDialogIcon]',
  standalone: true,
  exportAs: 'slAlertDialogIcon',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph [name]="glyph()"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlAlertDialogIcon {
  private readonly dialog = inject(SlDialogBase);

  protected readonly glyph = computed<GlyphName>(() => {
    const tone = this.dialog.resolvedTone();
    return tone === null ? 'status-warning' : TONE_GLYPH[tone];
  });
}

/**
 * The least destructive action, and where focus lands when the layer opens.
 * That is the APG's own advice for a step that is not easily reversible, and it
 * is a default of the member rather than something a consumer remembers.
 */
@Directive({
  selector: '[slAlertDialogCancel]',
  standalone: true,
  exportAs: 'slAlertDialogCancel',
  host: { '[attr.data-part]': 'part', type: 'button', '(click)': 'press($event)' },
})
export class SlAlertDialogCancel implements OnInit, OnDestroy {
  readonly value = input<string>('cancel');

  private readonly dialog = inject(SlDialogBase);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  /** `cancel`, unless the element is another family's root. */
  protected readonly part = hostSelectorKey(this.native, 'part', ownPart(this.native, 'cancel'));

  ngOnInit() {
    this.dialog.cancelNode.set(this.native);
  }

  ngOnDestroy() {
    if (this.dialog.cancelNode() === this.native) this.dialog.cancelNode.set(null);
  }

  protected press(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.dialog.request(false, 'dismiss', this.value(), event);
  }
}

/**
 * The action being confirmed. It carries `submit`, because confirming is what
 * the reader came to do, and `dismiss` is what the other two controls mean.
 */
@Directive({
  selector: '[slAlertDialogAction]',
  standalone: true,
  exportAs: 'slAlertDialogAction',
  host: { '[attr.data-part]': 'part', type: 'button', '(click)': 'press($event)' },
})
export class SlAlertDialogAction {
  readonly value = input<string>('confirm');

  private readonly dialog = inject(SlDialogBase);

  /** `action`, unless the element is another family's root. */
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly part = hostSelectorKey(this.native, 'part', ownPart(this.native, 'action'));

  protected press(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.dialog.request(false, 'submit', this.value(), event);
  }
}
