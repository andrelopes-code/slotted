import type { EntityPickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { Entity, EntitySource } from '@slotted/core/entity-picker';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type { Entity, EntityAvatar, EntitySource } from '@slotted/core/entity-picker';
export type { EntitySearchRequest, EntitySearchResult } from '@slotted/core/entity-picker';

export type EntityPickerSize = 'sm' | 'md' | 'lg';
export type EntityPickerVariant = 'outline' | 'subtle' | 'plain';
export type EntityPickerMedia = 'avatar' | 'none';
export type EntityPickerOverflow = 'collapse' | 'wrap';
export type EntityPickerOpenOn = 'input' | 'focus' | 'manual';
export type EntityPickerSide = 'bottom' | 'top';
export type EntityPickerWidth = 'anchor' | 'content';
export type EntityPickerStrategy = 'absolute' | 'fixed';

export type EntityPickerValueReason =
  'pointer' | 'keyboard' | 'select' | 'remove' | 'clear' | 'submit' | 'programmatic';
export type EntityPickerInputReason = 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic';
export type EntityPickerOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'blur' | 'programmatic';
export type EntityPickerHighlightReason = 'pointer' | 'keyboard' | 'programmatic';
export type EntityPickerScopeReason = 'pointer' | 'keyboard' | 'programmatic';

/** A request to change the chosen ids, carrying the records known for them. */
export interface EntityPickerValueRequest<T> extends ChangeRequest<T> {
  /** The records of the requested value the family knows, in its order. */
  readonly entities: readonly Entity[];
}

export interface EntityPickerScope {
  readonly id: string;
  readonly label: string;
}

export interface EntityPickerDefaults {
  clearable: boolean;
  disabled: boolean;
  fullWidth: boolean;
  highlightMatch: boolean;
  invalid: boolean;
  loop: boolean;
  media: EntityPickerMedia;
  minQueryLength: number;
  openOn: EntityPickerOpenOn;
  overflow: EntityPickerOverflow;
  portal: boolean;
  readOnly: boolean;
  required: boolean;
  searchDelay: number;
  side: EntityPickerSide;
  size: EntityPickerSize;
  strategy: EntityPickerStrategy;
  variant: EntityPickerVariant;
  width: EntityPickerWidth;
}

export interface EntityPickerDefaultsProviderProps extends Partial<EntityPickerDefaults> {
  children?: ReactNode;
}

export interface EntityPickerHandle {
  close: () => void;
  focus: () => void;
  open: () => void;
  /** Asks the source again for the current query. */
  refresh: () => void;
}

/** What `renderOption` receives beside the record. */
export interface EntityPickerOptionState {
  readonly query: string;
  readonly selected: boolean;
  readonly current: boolean;
  readonly disabled: boolean;
}

/** What `render` receives for the root. */
export interface EntityPickerRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-part': string;
  'data-selection-mode': 'single' | 'multiple';
  'data-size': EntityPickerSize;
  'data-ui': string;
  'data-variant': EntityPickerVariant;
  'data-overflow': EntityPickerOverflow;
  ref?: Ref<HTMLDivElement> | undefined;
}

interface EntityPickerBaseProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'value' | 'onChange' | 'size' | 'children' | 'ref' | 'max' | 'width'
> {
  /** A remote source. `items` is the local alternative. */
  source?: EntitySource | undefined;
  /** A list the application holds, filtered locally by the collator. */
  items?: readonly Entity[] | undefined;
  /** Records the application already knows, so their ids need no resolution. */
  entities?: readonly Entity[] | undefined;
  favorites?: readonly Entity[] | undefined;
  recent?: readonly Entity[] | undefined;
  scopes?: readonly EntityPickerScope[] | undefined;
  scope?: string | null | undefined;
  defaultScope?: string | null | undefined;
  onScopeChange?:
    ((scope: string | null, request: ChangeRequest<string | null>) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  highlightedValue?: string | null | undefined;
  defaultHighlightedValue?: string | null | undefined;
  onHighlightedValueChange?:
    ((value: string | null, request: ChangeRequest<string | null>) => void) | undefined;
  /**
   * The reader asked to create what they typed. A record returned is chosen,
   * with reason `submit`; nothing returned chooses nothing.
   */
  onCreate?:
    | ((query: string) => void | Entity | null | Promise<Entity | null | undefined | void>)
    | undefined;
  /** Replaces the content of an option; the face, the check and the row stay the family's. */
  renderOption?: ((entity: Entity, state: EntityPickerOptionState) => ReactNode) | undefined;
  /**
   * Draws only the options in view, and a few either side. On by default above
   * 100 options in a list with no section headings: every keystroke over 500
   * records with faces rendered all 500. A list with headings is drawn whole.
   */
  virtualize?: boolean | undefined;
  /** The height an option is counted at until it has been drawn and measured. Defaults to 48. */
  estimatedRowHeight?: number | undefined;
  /** Replaces the words of a chip; the face and the remove button stay the family's. */
  renderChip?: ((entity: Entity) => ReactNode) | undefined;
  /** Replaces the root element. */
  render?: ((props: EntityPickerRootProps) => ReactNode) | undefined;
  handleRef?: Ref<EntityPickerHandle> | undefined;
  ref?: Ref<HTMLInputElement> | undefined;
  /** BCP 47, for the local filter and the mark. The language in force when absent. */
  locale?: string | undefined;
  max?: number | null | undefined;
  clearable?: boolean | undefined;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  highlightMatch?: boolean | undefined;
  invalid?: boolean | undefined;
  loop?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * buttons, the sections, the chips, and the sentences the popup and the
   * announcer say.
   */
  messages?: PartialMessages<EntityPickerMessages> | undefined;
  media?: EntityPickerMedia | undefined;
  minQueryLength?: number | undefined;
  /**
   * What opens the popup besides the trigger and the arrows. `input` (default): typing or a
   * press on the input; `focus`: every focus as well; `manual`: typing filters without opening.
   */
  openOn?: EntityPickerOpenOn | undefined;
  overflow?: EntityPickerOverflow | undefined;
  portal?: boolean | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  searchDelay?: number | undefined;
  side?: EntityPickerSide | undefined;
  size?: EntityPickerSize | undefined;
  strategy?: EntityPickerStrategy | undefined;
  variant?: EntityPickerVariant | undefined;
  width?: EntityPickerWidth | undefined;
}

export interface EntityPickerSingleProps extends EntityPickerBaseProps {
  selectionMode?: 'single' | undefined;
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?:
    ((value: string | null, request: EntityPickerValueRequest<string | null>) => void) | undefined;
}

export interface EntityPickerMultipleProps extends EntityPickerBaseProps {
  selectionMode: 'multiple';
  value?: readonly string[] | undefined;
  defaultValue?: readonly string[] | undefined;
  onValueChange?:
    | ((value: readonly string[], request: EntityPickerValueRequest<readonly string[]>) => void)
    | undefined;
}

export type EntityPickerProps = EntityPickerSingleProps | EntityPickerMultipleProps;
