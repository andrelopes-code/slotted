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
 * The family's one icon control, named by a tooltip with the words its
 * accessible name carries: a cross with no words beside it is a control
 * nobody can tell apart until it is named. The job's title describes it, and
 * the tooltip's own content joins that description while it is open.
 */
@Component({
  selector: 'button[slImportExportControl]',
  standalone: true,
  imports: [SlTooltipLayer, SlTooltipContent],
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
    '[attr.aria-describedby]': 'describedByValue()',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'onPointerUp()',
    '(focus)': 'onFocus($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class SlImportExportControl {
  readonly text = input.required<string>();
  /** The id of the element that says which job the control acts on. */
  readonly describedBy = input<string | undefined>(undefined);

  private readonly tooltip = inject(SlTooltip);
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    this.tooltip.triggerNode.set(this.native);
    inject(DestroyRef).onDestroy(() => this.tooltip.triggerNode.set(null));
  }

  protected readonly describedByValue = computed(() => {
    const ids = [this.describedBy(), this.tooltip.isOpen() ? this.tooltip.contentId : undefined];
    const joined = ids.filter((id): id is string => id !== undefined).join(' ');
    return joined === '' ? null : joined;
  });

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
