import { computed, linkedSignal, signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

/** The value of a picker, owned by the consumer or by the picker. */
export class PickerValue<V> {
  private readonly own: WritableSignal<V>;
  private initial: V;

  readonly held: Signal<V>;

  constructor(
    private readonly value: Signal<V | undefined>,
    empty: V,
    private readonly equals: (a: V, b: V) => boolean,
    private readonly requested: (request: ChangeRequest<V>) => void,
  ) {
    this.initial = empty;
    this.own = signal(empty);
    this.held = computed(() => {
      const value = this.value();

      return value === undefined ? this.own() : value;
    });
  }

  /** What an uncontrolled picker starts from, and returns to on a form reset. */
  start(initial: V): void {
    this.initial = initial;
    this.own.set(initial);
  }

  reset(source: unknown): void {
    this.request(this.initial, 'programmatic', source);
  }

  /** Asks for another value, and says whether the picker moved to it. */
  request(next: V, reason: ChangeReason, source: unknown): boolean {
    const state = createControllable<V>({
      controlled: this.value(),
      initial: this.held(),
      equals: this.equals,
      onRequest: (request) => this.requested(request),
    });
    const moved = state.request(next, reason, source);
    if (moved) this.own.set(next);

    return moved;
  }
}

/**
 * What the panel is composing. A value that moves from outside — typed in the
 * field, set by the application — takes its place; `PickerLayer` is told to
 * put the value back when the panel leaves (`left`).
 */
export function pickerDraft<V>(
  value: Signal<V>,
  equals: (a: V, b: V) => boolean,
): WritableSignal<V> {
  const base = computed(value, { equal: equals });

  return linkedSignal(() => base());
}
