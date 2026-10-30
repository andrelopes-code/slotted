import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { SlToggleGroup } from './toggle-group';
import type { ToggleGroupSelectionReason } from './toggle-group';

/**
 * The mark an item is drawn with, on the consumer's own element.
 *
 * A directive rather than a slot, so an `ng-icon`, an inline `svg` or a `span`
 * all work and none of them loses its own semantics. It is hidden from the
 * reading order, because the words beside it — or the `aria-label` on the
 * button — are what a reader hears.
 */
@Directive({
  selector: '[slToggleGroupIcon]',
  standalone: true,
  exportAs: 'slToggleGroupIcon',
  host: {
    'data-part': 'icon',
    'data-part-icon': '',
    'aria-hidden': 'true',
  },
})
export class SlToggleGroupIcon {}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is why `Space`, `Enter` and a pointer are told apart
 * without a key listener existing anywhere in the family.
 */
function activationReason(event: Event): ToggleGroupSelectionReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One two-state button of the set.
 *
 * `aria-pressed` is written in both states, so the item is announced as a
 * toggle rather than as a button that happens to be pressed — and its label
 * never changes with its state, which the APG Button pattern calls critical.
 *
 * It is a part of `toggle-group` and not an entry point of its own:
 * `SlToggleGroup` is injected without `optional`, so an item written outside a
 * group fails at construction rather than rendering a button that toggles
 * nothing.
 */
@Component({
  selector: 'button[slToggleGroupItem]',
  standalone: true,
  exportAs: 'slToggleGroupItem',
  template: `<ng-content select="[slToggleGroupIcon]" />
    <span data-part="label" data-part-label=""><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    'data-part': 'item',
    'data-part-item': '',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-pressed]': "pressed() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.disabled]': 'disabledAttribute()',
    '(click)': 'onClick($event)',
  },
})
export class SlToggleGroupItem {
  /** What this item turns on. It is what the group's value holds. */
  readonly value = input.required<string>();
  /** Unstated rather than `false`, so the item defers to the group. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  /**
   * The group the item belongs to. Public, because a consumer reaching the
   * item through `exportAs` may want the group's resolved step.
   */
  readonly group = inject(SlToggleGroup);

  readonly pressed = computed(() => this.group.holds(this.value()));
  readonly resolvedDisabled = computed(() => this.disabled() ?? this.group.resolvedDisabled());

  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );

  constructor() {
    this.group.refresh();
    inject(DestroyRef).onDestroy(() => this.group.refresh());
  }

  protected onClick(event: Event) {
    this.group.toggle(this.value(), activationReason(event), event);
  }
}
