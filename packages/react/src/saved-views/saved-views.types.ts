import type { GridColumn, GridView, GridViewStorage, SavedViewsState } from '@slotted/core/grid';
import type { PartialMessages, SavedViewsMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, Ref } from 'react';

/** What the reader did. One state object answers seven different presses. */
export type SavedViewsAction =
  'apply' | 'save' | 'create' | 'rename' | 'delete' | 'default' | 'revert';

/** Why the views moved. `submit` is a form; `remove` a confirmed delete. */
export type SavedViewsReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'submit' | 'remove' | 'programmatic'
>;

/** Why the layer opened or closed: the popover's own reasons. */
export type SavedViewsOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'programmatic'
>;

/**
 * The request every change carries: the state asked for, the one it
 * replaces, the reason, what the reader did, the originating event, and a
 * refusal that stops the change before anything commits.
 */
export interface SavedViewsRequest {
  readonly value: SavedViewsState;
  readonly previous: SavedViewsState;
  readonly reason: SavedViewsReason;
  readonly action: SavedViewsAction;
  /** The originating event, when one exists. */
  readonly source?: unknown;
  readonly cancelled: boolean;
  /** Refuses the request. Nothing commits and no view is applied. */
  cancel(): void;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface SavedViewsHandle {
  /** The root element. */
  readonly element: HTMLDivElement | null;
  /** Moves focus to the trigger. */
  focus: () => void;
  /** Opens the layer, carrying `programmatic`. */
  open: () => void;
  /** Closes the layer, carrying `programmatic`. */
  close: () => void;
  /** Applies a view by id — `null` is the built-in view — carrying `programmatic`. */
  apply: (id: string | null) => void;
}

export interface SavedViewsProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'ref' | 'defaultValue' | 'onChange'
> {
  /** The view the grid shows now. */
  current: GridView;
  /** The built-in view: the application's defaults. */
  builtIn: GridView;
  /** The model, so a view is serialized and compared against the columns it names. */
  columns?: readonly GridColumn<never>[] | undefined;
  /** Present means the consumer owns the views, for the life of the component. */
  state?: SavedViewsState | undefined;
  /** The views an uncontrolled instance starts from, read once. */
  defaultState?: SavedViewsState | undefined;
  onStateChange?: ((state: SavedViewsState, request: SavedViewsRequest) => void) | undefined;
  /** After apply and revert: the view to write into the grid. */
  onViewApply?: ((view: GridView, request: SavedViewsRequest) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * group's and the panel's name (`label`), the controls, the forms and the
   * announcements. A native `aria-label` names both instead.
   */
  messages?: PartialMessages<SavedViewsMessages> | undefined;
  ref?: Ref<SavedViewsHandle> | undefined;
}

export interface UsePersistedSavedViewsOptions {
  /** The entry the views are kept under. */
  readonly key: string;
  /** Default `window.localStorage`; `null` keeps the views in memory only. */
  readonly storage?: GridViewStorage | null | undefined;
  /** The model, so the default view a visit opens on is parsed against it. */
  readonly columns?: readonly GridColumn<never>[] | undefined;
}

export interface PersistedSavedViews {
  readonly state: SavedViewsState;
  readonly onStateChange: (state: SavedViewsState) => void;
  /**
   * The default view this visit opened on, when the store held no view in use
   * and a default: the state already names it as active, and the grid still
   * has to be given it once. `null` otherwise.
   */
  readonly openedDefault: GridView | null;
}
