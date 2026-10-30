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
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { SlSegmentedControl } from './segmented-control';
import { SlSegmentedControlIdFactory } from './segmented-control-defaults';
import type {
  SegmentedControlSelectionReason,
  SlSegmentedControlSegment,
} from './segmented-control';

/**
 * The mark a segment is drawn with, on the consumer's own element.
 *
 * A directive rather than a slot, so an `ng-icon`, an inline `svg` or a
 * `span` all work and none of them loses its own semantics. It is hidden from
 * the reading order, because the words beside it — or the `aria-label` on the
 * radio — are what a reader hears.
 */
@Directive({
  selector: '[slSegmentIcon]',
  standalone: true,
  exportAs: 'slSegmentIcon',
  host: {
    'data-part': 'icon',
    'data-part-icon': '',
    'aria-hidden': 'true',
  },
})
export class SlSegmentIcon {}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is why `Space` and a pointer are told apart without a
 * key listener existing anywhere in the family.
 */
function activationReason(event: Event): SegmentedControlSelectionReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One segment of the track.
 *
 * It is a part of `segmented-control` and not an entry point of its own:
 * outside a control it has no exclusive set to belong to, and the platform's
 * whole keyboard model is defined over the set. `SlSegmentedControl` is
 * injected without `optional`, so a segment written outside one fails at
 * construction rather than silently.
 *
 * The radio is real, visually hidden and left where it is: it covers the
 * segment and reaches the track's own edge, so the hit area is the control's
 * height rather than the thumb's.
 */
@Component({
  selector: '[slSegment]',
  standalone: true,
  exportAs: 'slSegment',
  template: `<input
      #control
      data-part="control"
      data-part-control=""
      type="radio"
      [attr.id]="controlId"
      [attr.name]="control_.resolvedName()"
      [attr.value]="value()"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="writtenDescribedBy"
      [attr.disabled]="disabledAttribute()"
      [checked]="checked()"
      (click)="onClick($event)"
      (blur)="onBlur()"
    />
    <ng-content select="[slSegmentIcon]" />
    <span data-part="label" data-part-label=""><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-checked]': "checked() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
  },
})
export class SlSegment implements SlSegmentedControlSegment {
  /** What this segment selects. It is what the control's value holds. */
  readonly value = input.required<string>();
  /** Unstated rather than `false`, so the segment defers to the control. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * The control the segment belongs to. Injected without `optional`, and
   * public because the template reads the shared name from it and a consumer
   * reaching the segment through `exportAs` may want the resolved step.
   *
   * The trailing underscore keeps the name off `value`, which is the input.
   */
  readonly control_ = inject(SlSegmentedControl);

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  /**
   * Read from the host and written onto the radio: the name of a segment whose
   * mark is its whole content belongs to the control that holds the focus, and
   * an `aria-label` left on the `label` element would name it twice.
   */
  protected readonly ariaLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly element = viewChild.required<ElementRef<HTMLInputElement>>('control');

  /** The identifier the radio carries. A consumer's own wins. */
  readonly controlId = this.writtenId ?? inject(SlSegmentedControlIdFactory).next();

  readonly checked = computed(() => this.control_.holds(this.value()));
  readonly resolvedDisabled = computed(() => this.disabled() ?? this.control_.resolvedDisabled());

  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );

  constructor() {
    this.control_.register(this);
    inject(DestroyRef).onDestroy(() => this.control_.unregister(this));
  }

  /** Writes this segment's element from the control's value. */
  syncElement() {
    this.element().nativeElement.checked = this.checked();
  }

  protected onClick(event: Event) {
    if (this.control_.select(this.value(), activationReason(event), event)) return;
    /* Refused: the platform's own selection is put back, on this element and
       on the neighbour the browser had already unchecked. */
    event.preventDefault();
    this.control_.restoreElements();
  }

  protected onBlur() {
    this.control_.markTouched();
  }
}
