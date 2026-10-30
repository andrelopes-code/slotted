import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlRadioGroup } from './radio-group';
import { SlRadioGroupIdFactory } from './radio-group-defaults';
import type { RadioGroupSelectionReason, SlRadioGroupItem } from './radio-group';

/**
 * Help text under one item's label.
 *
 * It is a directive on the consumer's own element, so a `p`, a `span` or an
 * `inline-message` all work and none of them loses its own semantics. It
 * describes that item and not the set — what the set says belongs to the field
 * group above it.
 */
@Directive({
  selector: '[slRadioDescription]',
  standalone: true,
  exportAs: 'slRadioDescription',
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.id]': 'id',
  },
})
export class SlRadioDescription {
  readonly id = `${inject(SlRadioGroupIdFactory).next()}-description`;
}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports the
 * click count. It is why `Space` and a pointer are told apart without a key
 * listener existing anywhere in the family.
 */
function activationReason(event: Event): RadioGroupSelectionReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One item of the set.
 *
 * It is a part of `radio-group` and not an entry point of its own: outside a
 * group it has no exclusive set to belong to, and the platform's whole keyboard
 * model is defined over the set. `SlRadioGroup` is injected without `optional`,
 * so an item written outside one fails at construction rather than silently.
 *
 * The mark is a sibling of the control for the reason `checkbox` records —
 * Firefox renders no pseudo-element on an `input` — and the label names the
 * control through `for` so the description below it can be read without
 * choosing anything.
 */
@Component({
  selector: '[slRadio]',
  standalone: true,
  exportAs: 'slRadio',
  imports: [SlGlyph, SlIcon],
  template: `<input
      #control
      data-part="control"
      data-part-control=""
      type="radio"
      [attr.id]="controlId"
      [attr.name]="group.resolvedName()"
      [attr.value]="value()"
      [attr.aria-describedby]="describedBy()"
      [attr.disabled]="disabledAttribute()"
      [checked]="checked()"
      (click)="onClick($event)"
      (blur)="onBlur()"
    />
    <span data-part="indicator" data-part-indicator=""
      ><span slIcon><svg slGlyph name="dot"></svg></span
    ></span>
    <label data-part="label" data-part-label="" [attr.for]="controlId"><ng-content /></label>
    <ng-content select="[slRadioDescription]" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-checked]': "checked() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
  },
})
export class SlRadio implements SlRadioGroupItem {
  /** What this item selects. It is what the group's value holds. */
  readonly value = input.required<string>();
  /** Unstated rather than `false`, so the item defers to the group. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * The group the item belongs to. Injected without `optional`, and public
   * because the template reads the shared name from it and a consumer reaching
   * the item through `exportAs` may want the group's resolved step.
   */
  readonly group = inject(SlRadioGroup);

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly element = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly description = contentChild(SlRadioDescription, { descendants: true });

  /** The identifier the label points at. A consumer's own wins. */
  readonly controlId = this.writtenId ?? inject(SlRadioGroupIdFactory).next();

  readonly checked = computed(() => this.group.holds(this.value()));

  constructor() {
    this.group.register(this);
    inject(DestroyRef).onDestroy(() => this.group.unregister(this));
  }
  readonly resolvedDisabled = computed(() => this.disabled() ?? this.group.resolvedDisabled());

  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.description()?.id].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );

  /** The native element, for `focus()` and `click()`. */
  get inputElement(): HTMLInputElement {
    return this.element().nativeElement;
  }

  /** Writes this item's element from the group's value. */
  syncElement() {
    this.element().nativeElement.checked = this.checked();
  }

  /**
   * Refusing the default undoes the platform's pre-click check of *this*
   * element. It does not put the previously chosen neighbour back — checking a
   * radio unchecks its neighbours, and the canceled activation behavior undoes
   * only the first half of that — so the group writes every element from the
   * value afterwards.
   */
  protected onClick(event: MouseEvent) {
    if (this.group.select(this.value(), activationReason(event), event)) return;
    event.preventDefault();
    this.group.restoreElements();
  }

  protected onBlur() {
    this.group.markTouched();
  }
}
