import type {
  GridColumn,
  GridColumnState,
  GridColumnStateChange,
  GridOutOfSpace,
} from '@slotted/core/grid';
import type { ColumnManagerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, Ref, RefObject } from 'react';

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

/**
 * The column request: `data-grid`'s, with every key that moved beside the
 * first. `change` is `changes[0]`.
 */
export interface ColumnManagerRequest extends ChangeRequest<GridColumnState> {
  readonly reason: ColumnManagerColumnReason;
  readonly change: GridColumnStateChange;
  readonly changes: readonly GridColumnStateChange[];
}

export interface ColumnManagerOpenRequest extends ChangeRequest<boolean> {
  readonly reason: ColumnManagerOpenReason;
}

/** What an application sets once for every manager under it. */
export interface ColumnManagerDefaults {
  presentation: ColumnManagerPresentation;
  apply: ColumnManagerApply;
}

export interface ColumnManagerProviderProps {
  presentation?: ColumnManagerPresentation | undefined;
  apply?: ColumnManagerApply | undefined;
  children?: ReactNode | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface ColumnManagerHandle {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  /** The root while it is rendered. */
  readonly element: HTMLDivElement | null;
}

export interface ColumnManagerProps<Row = unknown> extends Omit<
  ComponentPropsWithRef<'div'>,
  'ref' | 'children' | 'defaultValue'
> {
  /** The grid's columns, as the grid is given them. */
  columns: readonly GridColumn<Row>[];
  /** Present means the consumer owns the state, for the life of the component. */
  columnState?: GridColumnState | undefined;
  /** The uncontrolled start, and the target of Restore defaults in both modes. */
  defaultColumnState?: Partial<GridColumnState> | undefined;
  onColumnStateChange?:
    ((state: GridColumnState, request: ColumnManagerRequest) => void) | undefined;
  /**
   * The columns the grid took out for room — the grid's `onOutOfSpaceChange`
   * or `handle.getOutOfSpace()`: listed with a status, never written to the
   * state.
   */
  outOfSpace?: GridOutOfSpace | undefined;
  presentation?: ColumnManagerPresentation | undefined;
  apply?: ColumnManagerApply | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ColumnManagerOpenRequest) => void) | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<ColumnManagerMessages> | undefined;
  ref?: Ref<ColumnManagerHandle> | undefined;
}

/** What `render` receives for the trigger. */
export type ColumnManagerTriggerRootProps = ComponentPropsWithRef<'button'> & {
  'data-part': 'trigger';
  'data-column-manager-trigger': '';
};

export interface ColumnManagerTriggerProps extends ComponentPropsWithRef<'button'> {
  /**
   * The manager this trigger opens. Unset, the trigger reads the one a
   * `ColumnManagerRoot` around both provides.
   */
  manager?: RefObject<ColumnManagerHandle | null> | undefined;
  /** Replaces the rendered element; the family's own `Button` otherwise. */
  render?: ((props: ColumnManagerTriggerRootProps) => ReactNode) | undefined;
}
