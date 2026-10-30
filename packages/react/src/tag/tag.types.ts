import type { DefinedProps } from '@slotted/core/selector-key';
import type { PartialMessages, TagMessages } from '@slotted/core/i18n';
import type { ChangeReason } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, SyntheticEvent } from 'react';

/** Which of the five semantic colours the tag speaks in. */
export type TagTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted chip a tag usually is. */
export type TagVariant = 'solid' | 'soft' | 'outline' | 'dashed';

export type TagSize = 'sm' | 'md' | 'lg';

export type TagShape = 'pill' | 'square';

export type TagOrientation = 'horizontal' | 'vertical';

/**
 * How the removal was asked for. `remove` is the control at the end of the
 * chip; `keyboard` is `Backspace` or `Delete` pressed on the chip itself. A
 * bare callback cannot tell the two apart, and a confirmation flow wants one
 * and not the other.
 */
export type TagRemoveReason = Extract<ChangeReason, 'remove' | 'keyboard'>;

/**
 * A request to be taken out of the collection that holds the tag, and never a
 * value: the tag does not own whether it exists.
 *
 * Refusing it is what stops the group from moving focus, which is the one
 * thing the family would otherwise commit on its own. A confirmation that the
 * person has not answered yet leaves the keyboard where it is.
 */
export interface TagRemoveRequest {
  readonly reason: TagRemoveReason;
  /** The event the request came from. */
  readonly source: SyntheticEvent;
  readonly cancelled: boolean;
  /** Refuses the request: nothing is removed and focus does not move. */
  cancel(): void;
}

/** What an application sets once for every tag under it. */
export interface TagDefaults {
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

export interface TagDefaultsProviderProps extends Partial<TagDefaults> {
  children?: ReactNode | undefined;
}

export interface TagAppearanceProps {
  /** Defaults to the provider, then to `secondary`. */
  tone?: TagTone | undefined;
  /** Defaults to the provider, then to `soft`. */
  variant?: TagVariant | undefined;
  /** Defaults to the provider, then to `md`. */
  size?: TagSize | undefined;
  /** Defaults to the provider, then to `pill`. */
  shape?: TagShape | undefined;
}

export interface TagContentProps {
  children?: ReactNode | undefined;
  /**
   * A glyph or an avatar before the words, wrapped in the `start` part, which
   * sizes and centres it. The artwork is the consumer's.
   */
  start?: ReactNode | undefined;
  /** A glyph after the words, wrapped in the `end` part. */
  end?: ReactNode | undefined;
}

export interface TagRemovableProps {
  /**
   * Asks to be removed. The tag renders its remove control only when this is
   * present, because a chip with an X that does nothing is worse than a chip
   * without one.
   */
  onRemove?: ((request: TagRemoveRequest) => void) | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: `remove`
   * is the word the remove control announces before the tag's own label, so it
   * reads "Remove Design" rather than "Remove".
   */
  messages?: PartialMessages<TagMessages> | undefined;
  /** Refuses the removal while leaving the rest of the tag operable. */
  removeDisabled?: boolean | undefined;
}

/** Props the family writes on whichever element a member's `render` returns. */
export interface TagElementProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface TagRootProps extends TagElementProps {
  'data-shape': TagShape;
  'data-size': TagSize;
  'data-tone': TagTone;
  'data-ui': string;
  'data-variant': TagVariant;
}

/** What is written on the chip box when a member's own props land elsewhere. */
export type TagRootPassthrough = Omit<ComponentPropsWithRef<'span'>, 'children' | `data-${string}`>;

interface TagSharedProps extends TagAppearanceProps, TagContentProps, TagRemovableProps {
  /** Refuses every interaction the tag offers, including its removal. */
  disabled?: boolean | undefined;
}

export interface TagProps extends TagSharedProps, Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Renders the chip box into the element the page means — an `<li>`, a `<dd>`. */
  render?: ((props: TagRootProps) => ReactNode) | undefined;
}

interface TagInteractiveProps extends TagSharedProps {
  /** Reaches the chip box, which the member's own props do not land on. */
  rootProps?: TagRootPassthrough | undefined;
}

/** What a member writes on the control it renders, native props included. */
export interface TagButtonBodyProps extends ComponentPropsWithRef<'button'> {
  'data-part': string;
}

export interface TagLinkBodyProps extends ComponentPropsWithRef<'a'> {
  'data-part': string;
}

export interface TagButtonProps
  extends TagInteractiveProps, Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Renders the control into another element — a menu trigger, a router link. */
  render?: ((props: TagButtonBodyProps) => ReactNode) | undefined;
}

export interface TagLinkProps
  extends TagInteractiveProps, Omit<ComponentPropsWithRef<'a'>, 'children'> {
  /** Renders the destination into a router's own link component. */
  render?: ((props: DefinedProps<TagLinkBodyProps>) => ReactNode) | undefined;
}

export interface TagToggleProps
  extends TagInteractiveProps, Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The selection the consumer owns. Passing it decides the mode for good. */
  selected?: boolean | undefined;
  /** The selection an uncontrolled tag starts from, read once. */
  defaultSelected?: boolean | undefined;
  /** Asks for the opposite selection, carrying the reason and the event. */
  onSelectedChange?:
    ((selected: boolean, request: { reason: ChangeReason; cancel(): void }) => void) | undefined;
  render?: ((props: TagButtonBodyProps) => ReactNode) | undefined;
}

export interface TagGroupRootProps extends TagElementProps {
  'data-orientation': TagOrientation;
  'data-ui': string;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface TagGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode | undefined;
  /** Which way the run reads. `vertical` also writes `aria-orientation`. */
  orientation?: TagOrientation | undefined;
  /** Whether the arrow keys wrap past the ends. */
  loop?: boolean | undefined;
  /**
   * `toolbar` by default, which is what makes the run one tab stop with arrow
   * navigation inside it. Writing `list` turns that off: a list is a structure
   * rather than a widget, and its items are not controls to move between.
   */
  role?: string | undefined;
  render?: ((props: TagGroupRootProps) => ReactNode) | undefined;
}
