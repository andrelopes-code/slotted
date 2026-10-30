import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  provideTooltipDefaults,
  SlTooltip,
  SlTooltipContent,
  SlTooltipLayer,
} from '@slotted/angular/tooltip';

/**
 * One of the family's own controls on an item — mark read or unread, and
 * dismiss — and the tooltip it opens with the words its accessible name
 * carries: on hover, and on keyboard focus. Two glyphs with no words beside
 * them are two controls nobody can tell apart until they are named, and
 * `aria-label` names them only to a screen reader. The construction is the
 * one `top-navigation` gives its icon-only controls: `SlTooltip` is a host
 * directive holding the state and the delays, and the control dispatches the
 * pointer and the focus to it.
 *
 * On touch a hover never comes, so a press held on the control opens the hint
 * the way the platform's own long press names a thing.
 */
@Component({
  selector: 'button[slNotificationControl]',
  standalone: true,
  imports: [SlTooltipLayer, SlTooltipContent],
  /* The glyph is the item's to choose, so it is projected. */
  template: `<ng-content /><ng-template slTooltipLayer>
      <div slTooltipContent>{{ text() }}</div>
    </ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [SlTooltip],
  providers: [provideTooltipDefaults({ openOn: 'hover', side: 'bottom' })],
  host: {
    type: 'button',
    '[attr.aria-label]': 'text()',
    '[attr.aria-describedby]': 'describedBy()',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'onPointerUp()',
    '(focus)': 'onFocus($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class SlNotificationControl {
  /** The words the control is named by, and the tooltip repeats. */
  readonly text = input.required<string>();

  private readonly tooltip = inject(SlTooltip);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    this.tooltip.triggerNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.tooltip.triggerNode.set(null));
  }

  protected readonly describedBy = computed(() =>
    this.tooltip.isOpen() ? this.tooltip.contentId : null,
  );

  protected onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    this.tooltip.openAfterDelay(event);
  }

  protected onPointerLeave(event: PointerEvent) {
    this.tooltip.closeAfterDelay(event);
  }

  protected onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') this.tooltip.pressAndHold(event);
    else if (this.tooltip.isOpen()) this.tooltip.toggle(false, 'pointer', event);
  }

  protected onPointerUp() {
    this.tooltip.cancelPending();
  }

  protected onFocus(event: FocusEvent) {
    if (!this.native.matches(':focus-visible')) return;
    this.tooltip.toggle(true, 'keyboard', event);
  }

  protected onBlur(event: FocusEvent) {
    if (this.tooltip.isOpen()) this.tooltip.toggle(false, 'blur', event);
  }
}
