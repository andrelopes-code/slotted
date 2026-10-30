import { inject, Injectable, InjectionToken } from '@angular/core';
import type { GridColumnState, GridColumnStateChange } from '@slotted/core/grid';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

/** Where the panel stands: a popover on the trigger, a drawer at the end, or in place. */
export type ColumnManagerPresentation = 'popover' | 'drawer' | 'inline';

/** Whether every action asks at once, or edits a draft that Apply asks for once. */
export type ColumnManagerApply = 'live' | 'confirm';

export type ColumnManagerColumnReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'clear' | 'submit' | 'programmatic'
>;

export type ColumnManagerOpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'back' | 'programmatic'
>;

/** The column request: `data-grid`'s, with every key that moved beside the first. */
export interface ColumnManagerRequest extends ChangeRequest<GridColumnState> {
  readonly reason: ColumnManagerColumnReason;
  readonly change: GridColumnStateChange;
  readonly changes: readonly GridColumnStateChange[];
}

export type ColumnManagerOpenRequest = ChangeRequest<boolean>;

export interface ColumnManagerDefaults {
  presentation: ColumnManagerPresentation;
  apply: ColumnManagerApply;
}

const FALLBACK: ColumnManagerDefaults = {
  presentation: 'popover',
  apply: 'live',
};

export const COLUMN_MANAGER_DEFAULTS = new InjectionToken<ColumnManagerDefaults>(
  'slotted column-manager defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once where its managers stand and whether they apply
 * at once. A manager that states either itself still wins. Its words come from
 * the language in force (`provideSlotted`).
 */
export function provideColumnManagerDefaults(defaults: Partial<ColumnManagerDefaults>) {
  return {
    provide: COLUMN_MANAGER_DEFAULTS,
    useFactory: (): ColumnManagerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectColumnManagerDefaults(): ColumnManagerDefaults {
  return inject(COLUMN_MANAGER_DEFAULTS);
}

@Injectable({ providedIn: 'root' })
export class SlColumnManagerIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-column-manager-${this.count}`;
  }
}
