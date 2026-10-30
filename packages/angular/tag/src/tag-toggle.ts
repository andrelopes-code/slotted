import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlTag } from './tag';
import { TAG_BODY_TEMPLATE } from './tag-body';

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter, which is why the family uses one — and why the reason a selection
 * moved has to be recovered from the event. A click synthesised by the
 * keyboard reports no detail; a real one reports the click count.
 */
function activationReason(event: Event): ChangeReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The controlled and uncontrolled pair, decided by whether the consumer passed
 * a value. `@slotted/core/state` owns that decision so the two bindings cannot
 * disagree about who holds the value; the signal below is only where an
 * uncontrolled chip keeps its own.
 */
class SelectionState {
  private readonly own: WritableSignal<boolean | undefined> = signal(undefined);

  constructor(
    private readonly source: {
      selected: Signal<boolean | undefined>;
      defaultSelected: Signal<boolean>;
      emit: (request: ChangeRequest<boolean>) => void;
    },
  ) {}

  readonly value = () => this.source.selected() ?? this.own() ?? this.source.defaultSelected();

  request(event: Event) {
    const next = !this.value();
    const state = createControllable<boolean>({
      controlled: this.source.selected(),
      initial: this.value(),
      onRequest: (request) => this.source.emit(request),
    });

    if (state.request(next, activationReason(event), event)) this.own.set(next);
  }
}

/**
 * A chip that holds a selection: a filter that is on, a facet that is chosen.
 * Carbon calls it a selectable tag, Ant a checkable tag, Fluent a selected
 * tag — and none of them ships the uncontrolled half, so a filter bar cannot
 * be written without a piece of application state for every chip in it.
 *
 * It announces `aria-pressed` rather than `aria-selected`, which is a
 * deliberate departure with a cost: `aria-selected` is only valid inside a
 * `listbox`, a `grid` or a `tree`, and an `option` may not contain the remove
 * control this family puts beside the label. The family keeps `selected` as
 * its own word and writes `data-selected` for styling.
 *
 * The label never changes with the state — the APG's rule for a toggle — so
 * "Aberto" stays "Aberto" and the state is announced beside it.
 */
@Component({
  selector: 'button[slTagToggle]',
  standalone: true,
  exportAs: 'slTagToggle',
  imports: [SlGlyph, SlIcon],
  /* The selection mark's check, which the sheet uncovers when the chip is on. */
  template: `<span aria-hidden="true" data-part="indicator" data-part-indicator=""
      ><span slIcon><svg slGlyph name="check"></svg></span></span
    >${TAG_BODY_TEMPLATE}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'body',
    'data-part-body': '',
    type: 'button',
    '[attr.aria-pressed]': 'isSelected()',
    '[attr.disabled]': "tag.disabled() ? '' : null",
    '(click)': 'onClick($event)',
  },
})
export class SlTagToggle {
  /** Present means controlled, for the life of the component. */
  readonly selected = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultSelected = input(false, { transform: booleanAttribute });
  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no
   * `[(selected)]` because a two-way binding has one slot and cannot carry any
   * of those, and a second output for the same transition would be the same
   * failure stated twice.
   */
  readonly selectedChange = output<ChangeRequest<boolean>>();

  protected readonly tag = inject(SlTag);

  private readonly state = new SelectionState({
    selected: this.selected,
    defaultSelected: this.defaultSelected,
    emit: (request) => this.selectedChange.emit(request),
  });

  protected readonly isSelected = computed(() => this.state.value());

  constructor() {
    /* The chip box paints the selection; the control owns it. */
    effect(() => this.tag.setSelected(this.isSelected()));
  }

  protected onClick(event: MouseEvent) {
    if (this.tag.disabled()) return;
    /* A consumer that calls preventDefault has refused the activation, and a
       refused activation moves nothing. */
    if (event.defaultPrevented) return;
    this.state.request(event);
  }
}
