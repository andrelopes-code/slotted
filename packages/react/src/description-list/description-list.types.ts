import type {
  DescriptionListMessages,
  FamilyTranslator,
  PartialMessages,
} from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/** The term beside its value, or above it. */
export type DescriptionListLayout = 'row' | 'stack';

/** How many pairs stand side by side before the container narrows. */
export type DescriptionListColumns = 1 | 2 | 3;

/** The narrowest column before the count folds: `md` 17rem, `sm` 12.5rem. */
export type DescriptionListMinColumnWidth = 'sm' | 'md';

/** Nothing between pairs, a rule between them, or a framed table. */
export type DescriptionListVariant = 'plain' | 'ruled' | 'framed';

/** Only two things can ask to reveal a value: a press and a key. */
export type DescriptionListRevealReason = 'pointer' | 'keyboard' | 'programmatic';

export type DescriptionListChangeRequest = ChangeRequest<boolean>;

/**
 * What happened when a value was copied. It is not a `ChangeRequest`: the
 * clipboard belongs to the platform, so there is no previous value, nothing to
 * cancel, and no state the family holds. The event reports, after the fact,
 * what a consumer may want to log or announce differently.
 */
export interface DescriptionListCopyRequest {
  /** The exact text handed to the clipboard. */
  readonly value: string;
  readonly reason: 'pointer' | 'keyboard';
  /** `false` when the platform refused the write or offers no clipboard. */
  readonly copied: boolean;
  /**
   * `true` when the write was refused and the value was selected instead, so
   * the reader can copy it with the keyboard.
   */
  readonly selected: boolean;
  readonly source?: unknown;
}

export interface DescriptionListDefaults {
  columns?: DescriptionListColumns | undefined;
  layout?: DescriptionListLayout | undefined;
  /** The narrowest column before the count folds: `md` holds two columns to 34rem, `sm` to 25rem. */
  minColumnWidth?: DescriptionListMinColumnWidth | undefined;
  /** The maximum width of the term column, as a CSS length. */
  termWidth?: string | undefined;
  variant?: DescriptionListVariant | undefined;
}

export interface DescriptionListDefaultsProviderProps extends DescriptionListDefaults {
  children?: ReactNode;
}

export interface DescriptionListContextValue {
  columns: DescriptionListColumns;
  layout: DescriptionListLayout;
  /** The family's words in the language in force, with this list's `messages` laid over them. */
  t: FamilyTranslator<DescriptionListMessages>;
  variant: DescriptionListVariant;
}

export interface DescriptionListItemContextValue {
  /** The `dt`'s identifier, which the row's action is described by. */
  termId: string;
}

export interface DescriptionListRootProps extends ComponentPropsWithRef<'div'> {
  'data-columns': string;
  'data-layout': DescriptionListLayout;
  'data-min-column-width': DescriptionListMinColumnWidth;
  'data-part': string;
  'data-ui': string;
  'data-variant': DescriptionListVariant;
}

export interface DescriptionListProps extends ComponentPropsWithRef<'div'> {
  columns?: DescriptionListColumns | undefined;
  layout?: DescriptionListLayout | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * copy control and its announcements, the reveal control, and the sentence
   * read in place of a missing value.
   */
  messages?: PartialMessages<DescriptionListMessages> | undefined;
  /** The narrowest column before the count folds: `md` holds two columns to 34rem, `sm` to 25rem. */
  minColumnWidth?: DescriptionListMinColumnWidth | undefined;
  render?: ((props: DescriptionListRootProps) => ReactNode) | undefined;
  /** The maximum width of the term column, as a CSS length. */
  termWidth?: string | undefined;
  variant?: DescriptionListVariant | undefined;
}

export interface DescriptionListItemRootProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
  'data-span': string | undefined;
}

export interface DescriptionListItemProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: DescriptionListItemRootProps) => ReactNode) | undefined;
  /** How many columns the pair takes, clamped to the count the list has. */
  span?: DescriptionListColumns | undefined;
}

export interface DescriptionListTermRootProps extends ComponentPropsWithRef<'dt'> {
  'data-part': string;
}

export interface DescriptionListTermProps extends ComponentPropsWithRef<'dt'> {
  render?: ((props: DescriptionListTermRootProps) => ReactNode) | undefined;
}

export interface DescriptionListHintRootProps extends ComponentPropsWithRef<'span'> {
  'data-part': string;
}

export interface DescriptionListHintProps extends ComponentPropsWithRef<'span'> {
  render?: ((props: DescriptionListHintRootProps) => ReactNode) | undefined;
}

export interface DescriptionListDescriptionRootProps extends ComponentPropsWithRef<'dd'> {
  'data-clamp': '' | undefined;
  'data-part': string;
  'data-revealed': '' | undefined;
}

export interface DescriptionListDescriptionProps extends Omit<
  ComponentPropsWithRef<'dd'>,
  'onCopy'
> {
  /** Lines the value is held to before it is revealed. `0` never clamps. */
  clamp?: number | undefined;
  /** Draws the control that puts the value on the clipboard. */
  copy?: boolean | undefined;
  /**
   * The text the control copies. Absent, the rendered text of the value is
   * read at the moment of the press, which is what a formatted value needs.
   */
  copyValue?: string | undefined;
  /** The value an uncontrolled description starts from, read once. */
  defaultRevealed?: boolean | undefined;
  /** Draws the placeholder. React also treats nullish children as empty. */
  empty?: boolean | undefined;
  onCopy?: ((request: DescriptionListCopyRequest) => void) | undefined;
  onRevealedChange?:
    ((revealed: boolean, request: DescriptionListChangeRequest) => void) | undefined;
  /** What is read in place of a value that is missing. */
  placeholder?: ReactNode | undefined;
  render?: ((props: DescriptionListDescriptionRootProps) => ReactNode) | undefined;
  /** Present means controlled, for the life of the component. */
  revealed?: boolean | undefined;
}

export interface DescriptionListActionRootProps extends ComponentPropsWithRef<'dd'> {
  'data-part': string;
}

export interface DescriptionListActionProps extends ComponentPropsWithRef<'dd'> {
  render?: ((props: DescriptionListActionRootProps) => ReactNode) | undefined;
}
