import type { ActionSheetMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, RefObject } from 'react';

/**
 * When the layer exists. `active` builds it on opening and drops it once the
 * exit is over, `lazy` builds it on the first open and keeps it, `eager` builds
 * it up front and makes it inert.
 */
export type ActionSheetMount = 'active' | 'lazy' | 'eager';

/** Whether a dismissal source closes the sheet. */
export type ActionSheetDismissPolicy = 'close' | 'none';

/** The five tones `menu` paints an item in; `danger` is the destructive action. */
export type ActionSheetTone = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';

/** Why the sheet opened or closed. */
export type ActionSheetOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  | 'pointer'
  | 'keyboard'
  | 'select'
  | 'dismiss'
  | 'escape'
  | 'outsidePress'
  | 'back'
  | 'programmatic'
>;

/**
 * The request the family emits before the sheet moves. `result` is the value of
 * the item that was chosen, present when `reason` is `select`: it rides on the
 * close rather than declaring a second state model, the shape `dialog` and
 * `drawer` already take.
 */
export interface ActionSheetChangeRequest extends ChangeRequest<boolean> {
  readonly reason: ActionSheetOpenReason;
  readonly result?: string | undefined;
}

/** What `onSelect` receives. `preventDefault()` keeps the sheet open. */
export interface ActionSheetSelectEvent {
  readonly reason: 'pointer' | 'keyboard';
  readonly source: Event | undefined;
  readonly value: string | undefined;
  readonly defaultPrevented: boolean;
  preventDefault: () => void;
}

export interface ActionSheetDefaults {
  back: ActionSheetDismissPolicy;
  closeOnSelect: boolean;
  escape: ActionSheetDismissPolicy;
  modal: boolean;
  mount: ActionSheetMount;
  outsidePress: ActionSheetDismissPolicy;
}

export interface ActionSheetDefaultsProviderProps extends Partial<ActionSheetDefaults> {
  children?: ReactNode;
}

/** The imperative handle, for the actions a declaration cannot express. */
export interface ActionSheetHandle {
  open: () => void;
  close: () => void;
  /** Moves focus to the item the list holds as its stop. */
  focus: () => void;
}

export interface ActionSheetProps extends Partial<ActionSheetDefaults> {
  children?: ReactNode;
  open?: boolean | undefined;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, request: ActionSheetChangeRequest) => void;
  /** Words laid over the catalog of the language in force, key by key: the cancel's (`cancel`). */
  messages?: PartialMessages<ActionSheetMessages> | undefined;
  /** Where the layer is portalled. The portal root decides when absent. */
  container?: Element | null;
  /**
   * Where focus goes when the sheet opens. Unstated, the first action that can
   * run, or the least destructive one when that action is `danger`. `false`
   * moves nothing, for a sheet that stands open beside the reader's work.
   */
  initialFocus?: RefObject<HTMLElement | null> | false;
  /** Where focus goes when the sheet closes. Defaults to what held it on opening. */
  finalFocus?: RefObject<HTMLElement | null> | false;
  ref?: Ref<ActionSheetHandle>;
}

/** Every part's `ref`, as the callback shape the family hands a `render`. */
export type PartRef = (node: HTMLElement | null) => void;

export interface ActionSheetTriggerRootProps extends HTMLAttributes<HTMLElement> {
  ref: PartRef;
  type: 'button';
  'data-part': 'trigger';
}

export interface ActionSheetTriggerProps extends ComponentPropsWithRef<'button'> {
  render?: (props: ActionSheetTriggerRootProps) => ReactNode;
}

export interface ActionSheetContentRootProps extends HTMLAttributes<HTMLElement> {
  ref: PartRef;
  role: 'dialog';
  tabIndex: -1;
  'data-part': 'panel';
}

/** `drawer`'s panel with the family's root inside. `render` substitutes the panel. */
export interface ActionSheetContentProps extends ComponentPropsWithRef<'div'> {
  render?: (props: ActionSheetContentRootProps) => ReactNode;
}

export type ActionSheetHeaderProps = ComponentPropsWithRef<'header'>;

export interface ActionSheetTitleRootProps extends HTMLAttributes<HTMLElement> {
  ref: PartRef;
  id: string;
  'data-part': 'title';
}

export interface ActionSheetTitleProps extends ComponentPropsWithRef<'h2'> {
  render?: (props: ActionSheetTitleRootProps) => ReactNode;
}

export interface ActionSheetMessageRootProps extends HTMLAttributes<HTMLElement> {
  ref: PartRef;
  id: string;
  'data-part': 'message';
}

export interface ActionSheetMessageProps extends ComponentPropsWithRef<'p'> {
  render?: (props: ActionSheetMessageRootProps) => ReactNode;
}

export type ActionSheetListProps = ComponentPropsWithRef<'div'>;

export interface ActionSheetGroupProps extends ComponentPropsWithRef<'div'> {
  /** Rendered as the group's `group-label` part, and the group's name. */
  label?: ReactNode;
}

export type ActionSheetGroupLabelProps = ComponentPropsWithRef<'div'>;
export type ActionSheetSeparatorProps = ComponentPropsWithRef<'hr'>;

export interface ActionSheetItemRootProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  ref: PartRef;
  role: 'menuitem';
  tabIndex: number;
  type?: 'button';
  'data-part': 'item';
}

export interface ActionSheetItemProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'onSelect' | 'role' | 'value'
> {
  /** What the close carries as its `result` when this item is chosen. */
  value?: string;
  /** What typeahead matches, when the label is not plain text. */
  textValue?: string;
  icon?: ReactNode;
  description?: ReactNode;
  tone?: ActionSheetTone;
  disabled?: boolean;
  /**
   * The action is running. The ring stands in the icon box, the label stays,
   * the item refuses a second press and the sheet stays open until the
   * consumer clears it.
   */
  loading?: boolean;
  /** Overrides the sheet's `closeOnSelect` for this item. */
  closeOnSelect?: boolean;
  onSelect?: (event: ActionSheetSelectEvent) => void;
  render?: (props: ActionSheetItemRootProps) => ReactNode;
}

export interface ActionSheetCancelRootProps extends HTMLAttributes<HTMLElement> {
  ref: PartRef;
  type: 'button';
  'data-part': 'cancel';
}

/** The footer and the button in it. Children default to the catalog's `cancel`. */
export interface ActionSheetCancelProps extends ComponentPropsWithRef<'button'> {
  render?: (props: ActionSheetCancelRootProps) => ReactNode;
}

/**
 * What the family hands its own parts. The layer, the ids the panel is named
 * by and the open state's presence are `drawer`'s, and its parts read them
 * from `useDrawer`.
 */
export interface ActionSheetContextValue {
  /** The family's words in the language in force, with this sheet's `messages` laid over them. */
  t: FamilyTranslator<ActionSheetMessages>;
  close: (reason: ActionSheetOpenReason, result: string | undefined, source: unknown) => void;
  closeOnSelect: boolean;
  nodes: { panel: HTMLElement | null; list: HTMLElement | null };
}
