/** A shortcut as the rail draws it: its name, and what a press writes, in words. */
export interface PickerPresetView {
  readonly disabled: boolean;
  readonly label: string;
  readonly press: (event: Event) => void;
  readonly result: string;
  readonly selected: boolean;
}

/** One step or one length of a group. */
export interface PickerChipView {
  readonly disabled: boolean;
  readonly label: string;
  readonly press: (event: Event) => void;
  readonly selected?: boolean | undefined;
}

/** The length of a run, as a control. */
export interface PickerSpanView {
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly empty: boolean;
  readonly step: (direction: 1 | -1, event: Event) => void;
  readonly text: string;
}

/** Which picker a panel belongs to. */
export type PickerKind =
  'date' | 'time' | 'date-range' | 'datetime' | 'datetime-range' | 'time-range';

/** The part one column shows. */
export type PickerShowing = 'day' | 'time';
