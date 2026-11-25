import type { ClockCell, ClockGroup, PlainTime } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

/** Which grid of the clock a press was made in: a unit of the time, or a whole one. */
export type ClockUnitName = 'hour' | 'minute' | 'second' | 'slot';

export type ClockHourCycle = 12 | 24;

/** A request to move to another time, and the grid it was made in. */
export interface ClockChangeRequest extends ChangeRequest<PlainTime | null> {
  readonly unit: ClockUnitName;
}

/** The state of one whole time, handed to its template. */
export interface ClockSlotState {
  readonly time: PlainTime;
  /** The whole time in the locale's shape, which is what the slot draws. */
  readonly label: string;
  readonly selected: boolean;
  readonly unavailable: boolean;
}

/** One listbox of the clock, as its template draws it. */
export interface ClockGridView {
  readonly cells: readonly ClockCell[];
  readonly columns: number;
  readonly groups: readonly ClockGroup[];
  readonly name: string;
  readonly unit: ClockUnitName;
}
