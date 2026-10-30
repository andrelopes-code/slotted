import { inject, Injectable, InjectionToken } from '@angular/core';
import type {
  DashboardColumnsInput,
  DashboardLayout,
  DashboardLayoutChange,
} from '@slotted/core/dashboard-grid';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

export type {
  DashboardColumnsInput,
  DashboardLayout,
  DashboardLayoutChange,
  DashboardLayoutItem,
} from '@slotted/core/dashboard-grid';

/** `auto` follows the heading outline, as `slSection` does, and is never above 2. */
export type DashboardHeadingLevel = 'auto' | 2 | 3 | 4 | 5 | 6;

export type DashboardLayoutReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'remove' | 'dismiss' | 'programmatic'
>;

export type DashboardEditingReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'submit' | 'dismiss' | 'programmatic'
>;

/** The request for a new layout: the layout, why, and what the gesture was. */
export interface DashboardLayoutRequest extends ChangeRequest<DashboardLayout> {
  readonly reason: DashboardLayoutReason;
  readonly change: DashboardLayoutChange;
}

export interface DashboardEditingRequest extends ChangeRequest<boolean> {
  readonly reason: DashboardEditingReason;
}

export type DashboardWidgetStatus = 'ready' | 'empty' | 'error';

export interface DashboardGridDefaults {
  columns: DashboardColumnsInput;
  editBar: boolean;
  headingLevel: DashboardHeadingLevel;
}

const FALLBACK: DashboardGridDefaults = {
  columns: 12,
  editBar: true,
  headingLevel: 'auto',
};

export const DASHBOARD_GRID_DEFAULTS = new InjectionToken<DashboardGridDefaults>(
  'slotted dashboard-grid defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how many columns its dashboards have, whether
 * the family draws the edit bar and the level of a widget's title. A grid that
 * states any of it itself still wins. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideDashboardGridDefaults(defaults: Partial<DashboardGridDefaults>) {
  return {
    provide: DASHBOARD_GRID_DEFAULTS,
    useFactory: (): DashboardGridDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectDashboardGridDefaults(): DashboardGridDefaults {
  return inject(DASHBOARD_GRID_DEFAULTS);
}

@Injectable({ providedIn: 'root' })
export class SlDashboardGridIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-dashboard-grid-${this.count}`;
  }
}

/**
 * The grid a widget declares itself to, wherever the widget is written: as
 * the grid's own content, or inside a component of the consumer's that the
 * grid's content holds, which the grid's content query does not reach. The
 * returned function withdraws the widget.
 */
export abstract class SlDashboardWidgetHost {
  abstract declare(widget: object): () => void;
}

/** The grid's words, for a part the consumer writes inside a widget. */
export abstract class SlDashboardGridWords {
  /** The detail link's name for a widget of this title. */
  abstract detailLabel(title: string): string;
}
