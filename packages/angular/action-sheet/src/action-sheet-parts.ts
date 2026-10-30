import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import {
  AfterContentChecked,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { SlActionSheet } from './action-sheet';
import type {
  ActionSheetOpenReason,
  ActionSheetSelectEvent,
  ActionSheetTone,
} from './action-sheet-defaults';

const ITEM_SELECTOR = "[data-part='item']";

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It tells `Enter` and `Space` from a press without a key listener.
 */
function activationReason(event: Event): 'pointer' | 'keyboard' {
  return (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
}

let nextId = 0;
const uniqueId = (prefix: string) => `${prefix}-${(nextId += 1)}`;

/**
 * The control that opens the sheet: the consumer's own element, which is what
 * this ecosystem composes with. It is also the layer's branch, so a press on
 * it is not read as an outside press.
 */
@Directive({
  selector: '[slActionSheetTrigger]',
  standalone: true,
  exportAs: 'slActionSheetTrigger',
  host: {
    'data-part': 'trigger',
    'data-part-trigger': '',
    type: 'button',
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'sheet().open()',
    '[attr.aria-controls]': 'controls()',
    '[attr.data-open]': "sheet().open() ? '' : null",
    '[attr.id]': 'sheet().triggerId()',
    '(click)': 'press($event)',
  },
})
export class SlActionSheetTrigger implements OnInit, OnDestroy {
  /** The sheet this control opens, reached with a template reference variable. */
  readonly sheet = input.required<SlActionSheet>({ alias: 'slActionSheetTrigger' });

  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly controls = computed(() =>
    this.sheet().mounted() ? this.sheet().panelId() : null,
  );

  ngOnInit() {
    this.sheet().triggerNode.set(this.native);
  }

  ngOnDestroy() {
    if (this.sheet().triggerNode() === this.native) this.sheet().triggerNode.set(null);
  }

  protected press(event: Event) {
    /* The consumer's own handler ran first, and `preventDefault()` refuses. */
    if (event.defaultPrevented) return;
    const sheet = this.sheet();
    sheet.request(
      !sheet.open(),
      activationReason(event) as ActionSheetOpenReason,
      undefined,
      event,
    );
  }
}

@Directive({
  selector: '[slActionSheetHeader]',
  standalone: true,
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlActionSheetHeader {}

/** The name of the dialog and of the list. */
@Directive({
  selector: '[slActionSheetTitle]',
  standalone: true,
  host: { 'data-part': 'title', 'data-part-title': '', '[attr.id]': 'sheet.titleId()' },
})
export class SlActionSheetTitle implements OnInit, OnDestroy {
  protected readonly sheet = inject(SlActionSheet);

  ngOnInit() {
    this.sheet.hasTitle.set(true);
  }

  ngOnDestroy() {
    this.sheet.hasTitle.set(false);
  }
}

/** The dialog's description. */
@Directive({
  selector: '[slActionSheetMessage]',
  standalone: true,
  host: { 'data-part': 'message', 'data-part-message': '', '[attr.id]': 'sheet.messageId()' },
})
export class SlActionSheetMessage implements OnInit, OnDestroy {
  protected readonly sheet = inject(SlActionSheet);

  ngOnInit() {
    this.sheet.hasMessage.set(true);
  }

  ngOnDestroy() {
    this.sheet.hasMessage.set(false);
  }
}

/**
 * The menu: one tab stop for every action, the arrows, `Home`, `End` and
 * typeahead. Named by the sheet's title unless the consumer names it.
 */
@Directive({
  selector: '[slActionSheetList]',
  standalone: true,
  exportAs: 'slActionSheetList',
  host: {
    'data-part': 'list',
    'data-part-list': '',
    role: 'menu',
    'aria-orientation': 'vertical',
    '[attr.aria-labelledby]': 'labelledBy()',
    '(focusin)': 'onFocusIn($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlActionSheetList implements OnInit, AfterContentChecked {
  private readonly sheet = inject(SlActionSheet);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private roving: RovingTabindexHandle | null = null;
  private readonly typeahead = createTypeahead();

  protected readonly labelledBy = computed(() =>
    this.sheet.hasTitle() && !this.element.hasAttribute('aria-label') ? this.sheet.titleId() : null,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.roving?.destroy();
      this.typeahead.destroy();
    });
  }

  ngOnInit() {
    this.roving = createRovingTabindex(this.element, {
      includeAriaDisabled: true,
      itemSelector: ITEM_SELECTOR,
      orientation: () => 'vertical',
    });
  }

  /** An item added, removed or disabled moves the stop. */
  ngAfterContentChecked() {
    this.roving?.refresh();
  }

  private items() {
    return [...this.element.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
  }

  /** Focus that arrived by the pointer or by entry moves the stop with it. */
  protected onFocusIn(event: FocusEvent) {
    const index = this.items().indexOf(event.target as HTMLElement);
    if (index !== -1) this.roving?.setActive(index);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isPrintable(event.key, this.typeahead.query.length > 0)) return;
    event.preventDefault();
    const all = this.items();
    const labels = all.map(
      (item) =>
        item.dataset['textValue'] ??
        item.querySelector("[data-part='label']")?.textContent?.trim() ??
        '',
    );
    const index = this.typeahead.match(event.key, labels, all.indexOf(event.target as HTMLElement));
    all[index]?.focus();
  }
}

@Directive({
  selector: '[slActionSheetGroupLabel]',
  standalone: true,
  host: { 'data-part': 'group-label', 'data-part-group-label': '', '[id]': 'id' },
})
export class SlActionSheetGroupLabel {
  readonly id = uniqueId('slotted-action-sheet-group-label');
}

/** A run of related actions, named by the label it holds. */
@Directive({
  selector: '[slActionSheetGroup]',
  standalone: true,
  host: {
    'data-part': 'group',
    'data-part-group': '',
    role: 'group',
    '[attr.aria-labelledby]': 'label()?.id ?? null',
  },
})
export class SlActionSheetGroup {
  protected readonly label = contentChild(SlActionSheetGroupLabel);
}

@Directive({
  selector: 'hr[slActionSheetSeparator]',
  standalone: true,
  host: { 'data-part': 'separator', 'data-part-separator': '', role: 'separator' },
})
export class SlActionSheetSeparator {}

/** The item's visual. Hidden from assistive technology: the label names the action. */
@Directive({
  selector: '[slActionSheetItemIcon]',
  standalone: true,
  host: { 'data-part': 'icon', 'data-part-icon': '', 'aria-hidden': 'true' },
})
export class SlActionSheetItemIcon {}

/** The item's second line, which describes the action rather than naming it. */
@Directive({
  selector: '[slActionSheetItemDescription]',
  standalone: true,
  host: { 'data-part': 'description', 'data-part-description': '', '[id]': 'id' },
})
export class SlActionSheetItemDescription {
  readonly id = uniqueId('slotted-action-sheet-description');
}

/**
 * One action, on the consumer's own `button` or `a`. The role is `menuitem`,
 * as in `menu`; a disabled or loading item keeps its tab index and takes
 * `aria-disabled`, because the pattern keeps disabled items in the ring.
 *
 * While `loading`, the ring takes the icon box and the projected icon is not
 * shown, so the label never moves.
 */
@Component({
  selector: 'button[slActionSheetItem], a[slActionSheetItem]',
  standalone: true,
  exportAs: 'slActionSheetItem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.type]': 'isLink ? null : "button"',
    '[attr.aria-disabled]': 'inert() ? true : null',
    '[attr.aria-busy]': 'loading() ? true : null',
    '[attr.aria-describedby]': 'description()?.id ?? null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    /* A static `disabled` on the host would stay as the native attribute and
       take the item out of the ring the arrows walk; the pattern keeps it in. */
    '[attr.disabled]': 'null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-text-value]': 'textValue() ?? null',
    '[attr.data-tone]': 'tone() ?? null',
    '[attr.data-value]': 'value() ?? null',
    '(click)': 'onClick($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerleave)': 'onPointerLeave($event)',
  },
  template: `
    @if (loading()) {
      <span data-part="icon" data-part-icon="" aria-hidden="true"
        ><span data-ui="spinner" data-ui-spinner=""
          ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.875" />
            <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg></span
      ></span>
    } @else {
      <ng-content select="[slActionSheetItemIcon]" />
    }
    <span data-part="label" data-part-label=""><ng-content /></span>
    <ng-content select="[slActionSheetItemDescription]" />
  `,
})
export class SlActionSheetItem {
  /** What the close carries as its `result` when this item is chosen. */
  readonly value = input<string | undefined>(undefined);
  /** What typeahead matches on, when the visible label is not the word. */
  readonly textValue = input<string | undefined>(undefined);
  readonly tone = input<ActionSheetTone | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The action is running: the item refuses a second press and the sheet stays open. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(undefined, {
    transform: (given: boolean | string | undefined) =>
      given === undefined ? undefined : booleanAttribute(given),
  });
  readonly select = output<ActionSheetSelectEvent>();

  private readonly sheet = inject(SlActionSheet);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly isLink = this.element.tagName === 'A';
  protected readonly description = contentChild(SlActionSheetItemDescription);
  protected readonly inert = computed(() => this.disabled() || this.loading());

  protected onClick(event: Event) {
    if (this.inert()) {
      event.preventDefault();
      return;
    }
    let prevented = false;
    this.select.emit({
      reason: activationReason(event),
      source: event,
      value: this.value(),
      get defaultPrevented() {
        return prevented;
      },
      preventDefault: () => {
        prevented = true;
      },
    });
    if (prevented) return;
    if (this.closeOnSelect() ?? this.sheet.resolvedCloseOnSelect()) {
      this.sheet.request(false, 'select', this.value(), event);
    }
  }

  /**
   * A mouse or a pen over an item focuses it, so exactly one row is lit
   * whichever device is driving. A finger does not: focus moving under a touch
   * that is about to scroll the list would light rows at random.
   */
  protected onPointerMove(event: Event) {
    if ((event as PointerEvent).pointerType === 'touch') return;
    if (this.element.ownerDocument.activeElement !== this.element) {
      this.element.focus({ preventScroll: true });
    }
  }

  protected onPointerLeave(event: Event) {
    if ((event as PointerEvent).pointerType === 'touch') return;
    if (this.element.ownerDocument.activeElement !== this.element) return;
    this.element.closest<HTMLElement>("[data-part='panel']")?.focus({ preventScroll: true });
  }
}

/** The band that holds the cancel. */
@Directive({
  selector: '[slActionSheetFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlActionSheetFooter {}

/**
 * The explicit way out, on the consumer's own `button`. Never disabled: a sheet
 * that cannot be left is a trap. Given no words, it shows the catalog's `cancel`.
 */
@Component({
  selector: 'button[slActionSheetCancel]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'cancel',
    'data-part-cancel': '',
    type: 'button',
    '[disabled]': 'false',
    '(click)': 'onClick($event)',
  },
  template: `<ng-content>{{ sheet.t('cancel') }}</ng-content>`,
})
export class SlActionSheetCancel {
  protected readonly sheet = inject(SlActionSheet);

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    this.sheet.request(false, 'dismiss', undefined, event);
  }
}

/** Every part, for a standalone component's `imports`. */
export const SL_ACTION_SHEET = [
  SlActionSheet,
  SlActionSheetTrigger,
  SlActionSheetHeader,
  SlActionSheetTitle,
  SlActionSheetMessage,
  SlActionSheetList,
  SlActionSheetGroup,
  SlActionSheetGroupLabel,
  SlActionSheetSeparator,
  SlActionSheetItem,
  SlActionSheetItemIcon,
  SlActionSheetItemDescription,
  SlActionSheetFooter,
  SlActionSheetCancel,
] as const;
