import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { FilterBarField } from '@slotted/angular/filter-bar';
import type { FilterGroup } from '@slotted/core/filter';

import { doorFilter, fieldsWithDoor, type Door } from '../../core/backend/door';

/**
 * A list read from its address: a report's door (OV-01) opens it on the
 * door's condition and period as the bar's own pills, and a visit with no door
 * opens it as it would. `open` receives the door's tree, or null, and whether
 * this is the first read of the visit.
 */
export function listDoor(options: {
  readonly fields: () => readonly FilterBarField[];
  readonly doorOnly?: readonly FilterBarField[];
  readonly open: (filter: FilterGroup | null, first: boolean) => void;
}): { readonly fields: Signal<FilterBarField[]>; readonly door: Signal<Door | null> } {
  const route = inject(ActivatedRoute);
  const door = signal<Door | null>(null);
  const doorOnly = options.doorOnly ?? [];
  let first = true;
  const subscription = route.queryParamMap.subscribe((params) => {
    const found = doorFilter(params, [...options.fields(), ...doorOnly]);
    door.set(found);
    options.open(found?.filter ?? null, first);
    first = false;
  });
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  return {
    fields: computed(() => fieldsWithDoor(options.fields(), doorOnly, door())),
    door: door.asReadonly(),
  };
}
